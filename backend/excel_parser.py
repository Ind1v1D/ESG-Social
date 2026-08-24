"""
Excel parser and validator for the Social Impact Dashboard.
Parses uploaded .xlsx files against the defined template schema.
Returns structured data + errors + warnings.
"""
import pandas as pd
import io
from typing import Any

# ── Schema definitions ──────────────────────────────────────────────
SHEET_SCHEMAS = {
    "meta": {
        "required": ["year"],
        "optional": ["period", "university_name", "uploaded_by"],
        "validators": {
            "year": {"type": "int"},
        },
    },
    "gender": {
        "required": ["year", "faculty", "group_type", "male_pct", "female_pct"],
        "optional": ["other_pct", "women_leadership_pct", "pay_gap_pct"],
        "validators": {
            "year": {"type": "int"},
            "faculty": {"type": "str"},
            "group_type": {"type": "enum", "values": ["student", "staff"]},
            "male_pct": {"type": "pct"},
            "female_pct": {"type": "pct"},
            "other_pct": {"type": "pct"},
            "women_leadership_pct": {"type": "pct"},
            "pay_gap_pct": {"type": "float"},
        },
    },
    "engagement": {
        "required": ["year", "faculty", "satisfaction_pct"],
        "optional": ["nps", "club_participation_pct", "avg_activities_per_student"],
        "validators": {
            "year": {"type": "int"},
            "faculty": {"type": "str"},
            "satisfaction_pct": {"type": "pct"},
            "nps": {"type": "float"},
            "club_participation_pct": {"type": "pct"},
            "avg_activities_per_student": {"type": "positive_float"},
        },
    },
    "volunteering": {
        "required": ["year", "faculty", "volunteers_students", "volunteers_staff", "total_hours", "projects_count"],
        "optional": ["top_direction"],
        "validators": {
            "year": {"type": "int"},
            "faculty": {"type": "str"},
            "volunteers_students": {"type": "non_negative_int"},
            "volunteers_staff": {"type": "non_negative_int"},
            "total_hours": {"type": "positive_float"},
            "projects_count": {"type": "non_negative_int"},
            "top_direction": {"type": "str"},
        },
    },
    "esg_courses": {
        "required": ["year", "faculty", "courses_count"],
        "optional": ["esg_students_pct", "green_program_students"],
        "validators": {
            "year": {"type": "int"},
            "faculty": {"type": "str"},
            "courses_count": {"type": "non_negative_int"},
            "esg_students_pct": {"type": "pct"},
            "green_program_students": {"type": "non_negative_int"},
        },
    },
}


def _validate_value(value: Any, rule: dict, sheet: str, row: int, field: str) -> list[dict]:
    """Validate a single cell value against its rule. Returns list of error dicts."""
    errors = []
    if pd.isna(value) or value is None or str(value).strip() == "":
        return errors  # optional/missing handled elsewhere

    vtype = rule["type"]
    try:
        if vtype == "int":
            v = int(float(value))
            if v != float(value):
                errors.append({"sheet": sheet, "row": row, "field": field, "message": f"Expected integer, got {value}"})
        elif vtype == "float":
            float(value)
        elif vtype == "pct":
            v = float(value)
            if v < 0 or v > 100:
                errors.append({"sheet": sheet, "row": row, "field": field, "message": f"Percent must be 0..100, got {v}"})
        elif vtype == "positive_float":
            v = float(value)
            if v < 0:
                errors.append({"sheet": sheet, "row": row, "field": field, "message": f"Must be >= 0, got {v}"})
        elif vtype == "non_negative_int":
            v = int(float(value))
            if v < 0:
                errors.append({"sheet": sheet, "row": row, "field": field, "message": f"Must be >= 0, got {v}"})
        elif vtype == "enum":
            allowed = rule["values"]
            if str(value).strip().lower() not in allowed:
                errors.append({"sheet": sheet, "row": row, "field": field, "message": f"Must be one of {allowed}, got '{value}'"})
        elif vtype == "str":
            pass  # any string is fine
    except (ValueError, TypeError):
        errors.append({"sheet": sheet, "row": row, "field": field, "message": f"Invalid value '{value}' for type {vtype}"})
    return errors


def parse_and_validate(file_bytes: bytes) -> dict:
    """
    Parse and validate an uploaded Excel file.

    Returns:
        {
            "data": {
                "meta": [...],
                "gender": [...],
                "engagement": [...],
                "volunteering": [...],
                "esg_courses": [...]
            },
            "errors": [...],
            "warnings": [...]
        }
    """
    errors: list[dict] = []
    warnings: list[dict] = []
    data: dict[str, list[dict]] = {}

    try:
        xls = pd.ExcelFile(io.BytesIO(file_bytes), engine="openpyxl")
    except Exception as e:
        return {
            "data": {},
            "errors": [{"sheet": "file", "row": 0, "field": "", "message": f"Cannot read Excel file: {e}"}],
            "warnings": [],
        }

    available_sheets = [s.lower().strip() for s in xls.sheet_names]

    for sheet_name, schema in SHEET_SCHEMAS.items():
        # Find matching sheet (case-insensitive)
        matched_sheet = None
        for original_name in xls.sheet_names:
            if original_name.lower().strip() == sheet_name:
                matched_sheet = original_name
                break

        if matched_sheet is None:
            if sheet_name == "meta":
                warnings.append({"sheet": sheet_name, "row": 0, "field": "", "message": "Sheet 'meta' not found, skipping"})
            else:
                errors.append({"sheet": sheet_name, "row": 0, "field": "", "message": f"Required sheet '{sheet_name}' not found"})
            data[sheet_name] = []
            continue

        try:
            df = pd.read_excel(xls, sheet_name=matched_sheet, engine="openpyxl")
        except Exception as e:
            errors.append({"sheet": sheet_name, "row": 0, "field": "", "message": f"Cannot read sheet: {e}"})
            data[sheet_name] = []
            continue

        # Normalize column names
        df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

        # Check required columns
        all_columns = schema["required"] + schema["optional"]
        for col in schema["required"]:
            if col not in df.columns:
                errors.append({"sheet": sheet_name, "row": 0, "field": col, "message": f"Required column '{col}' is missing"})

        # Warn about unknown columns
        known_cols = set(all_columns)
        for col in df.columns:
            if col not in known_cols:
                warnings.append({"sheet": sheet_name, "row": 0, "field": col, "message": f"Unknown column '{col}' — ignored"})

        # Skip row-level validation if required columns are missing
        missing_required = [c for c in schema["required"] if c not in df.columns]
        if missing_required:
            data[sheet_name] = []
            continue

        rows = []
        validators = schema.get("validators", {})
        for idx, row in df.iterrows():
            excel_row = idx + 2  # 1-indexed + header = row 2+
            row_data = {}

            # Check required fields are not empty
            for col in schema["required"]:
                val = row.get(col)
                if pd.isna(val) or val is None or str(val).strip() == "":
                    errors.append({"sheet": sheet_name, "row": excel_row, "field": col, "message": f"Required field '{col}' is empty"})

            # Validate all known columns
            for col in all_columns:
                if col not in df.columns:
                    row_data[col] = None
                    continue
                val = row.get(col)

                # Run type validator
                if col in validators and not (pd.isna(val) or val is None or str(val).strip() == ""):
                    errs = _validate_value(val, validators[col], sheet_name, excel_row, col)
                    errors.extend(errs)

                # Store cleaned value
                if pd.isna(val) or val is None or str(val).strip() == "":
                    row_data[col] = None
                    if col in schema["optional"]:
                        warnings.append({"sheet": sheet_name, "row": excel_row, "field": col, "message": f"Optional field '{col}' is empty — stored as NULL"})
                else:
                    # Coerce types
                    vtype = validators.get(col, {}).get("type", "str")
                    try:
                        if vtype in ("int", "non_negative_int"):
                            row_data[col] = int(float(val))
                        elif vtype in ("float", "pct", "positive_float"):
                            row_data[col] = float(val)
                        elif vtype == "enum":
                            row_data[col] = str(val).strip().lower()
                        else:
                            row_data[col] = str(val).strip()
                    except (ValueError, TypeError):
                        row_data[col] = str(val).strip()

            rows.append(row_data)

        data[sheet_name] = rows

    return {"data": data, "errors": errors, "warnings": warnings}
