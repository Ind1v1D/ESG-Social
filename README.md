# ESG Social Dashboard

Full-stack web application for tracking and visualizing university-level social ESG (Environmental, Social, Governance) key performance indicators.

---

## Overview

The ESG Social Dashboard enables universities to upload, validate, and visualize social responsibility metrics across four pillars: Gender Equity, Student Engagement, Volunteering, and ESG Courses. Administrators upload structured Excel files; the system validates data, publishes it, and the frontend updates in real-time via Server-Sent Events.

**Status:** Working MVP, deployment-ready for demo, academic, and low-load environments.

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + TypeScript + Vite | React 19, Vite 7, TypeScript 5.9 |
| Styling | Tailwind CSS | 4.2 |
| Charts | Recharts | 3.7 |
| Routing | React Router | 7.13 |
| i18n | i18next + react-i18next | 25.10 / 16.6 |
| Backend | FastAPI + SQLAlchemy | FastAPI 0.109, SQLAlchemy 2.0 |
| Server | Uvicorn | 0.27 |
| Database | SQLite (WAL mode) | Built-in |
| Auth | JWT (python-jose) + bcrypt (passlib) | 3.3 / 1.7 |
| Excel | pandas + openpyxl | 2.2 / 3.1 |

---

## Features

### Dashboard
- **Overview page** — KPI summary cards with pie/bar charts summarizing all metrics
- **4 category pages** — dedicated detail pages for Gender, Engagement, Volunteering, and ESG Courses with interactive charts and data tables
- **Methodology page** — 9-step documentation of the data collection process
- **Filtering** — global year and faculty filters across all pages

### Data Management
- **Excel upload** — upload multi-sheet Excel files with automatic validation (data types, ranges, required fields)
- **Template download** — downloadable .xlsx template with headers, example data, and field notes
- **Upload lifecycle** — draft → published → archived (one active dataset at a time)
- **Rollback** — revert to previous dataset if issues are found

### Real-Time Updates
- **SSE (Server-Sent Events)** — dashboard auto-refreshes when new data is published
- **Polling fallback** — 12-second polling for environments where SSE is unavailable

### Multilingual UI
- **3 languages** — English, Russian, Kazakh
- **Auto-detection** — browser language detection on first visit
- **Manual switch** — language toggle in the header

### Theme System
- **Light/Dark mode** — full CSS variable design system
- **Toggle** — theme switch in sidebar, persisted to localStorage

### Export
- **CSV** — table data export
- **PNG** — page screenshot capture
- **PDF** — formatted report with charts and data

### Admin Panel
- **JWT authentication** — secure login with bcrypt password hashing
- **Multi-admin support** — create, edit, enable/disable, delete admin users
- **Login rate limiting** — 5 attempts per 5-minute window per IP
- **Upload management** — view upload history, publish, rollback

### UI/UX
- **Collapsible sidebar** — collapsed by default, hover to expand
- **Skeleton loading** — shimmer animations during data fetch
- **Staggered animations** — fade-up, scale-in, page transitions
- **Responsive** — mobile drawer sidebar, adaptive layouts

---

## Project Structure

```
esg/
├── .env.example              # Environment template
├── .gitignore
├── setup.bat                 # Windows: creates Python venv, installs deps
├── start_backend.bat         # Windows: runs FastAPI on :8000
├── start_frontend.bat        # Windows: runs Vite dev server on :3000
│
├── backend/
│   ├── main.py               # FastAPI entry point
│   ├── config.py             # Environment-driven configuration
│   ├── database.py           # SQLAlchemy engine, session, init_db()
│   ├── models.py             # ORM models (Admin, Upload, 4 metric tables)
│   ├── auth.py               # JWT authentication + admin verification
│   ├── rate_limit.py         # In-memory login rate limiter
│   ├── excel_parser.py       # Excel validation and parsing
│   ├── template_generator.py # Excel template generator
│   ├── events.py             # SSE event manager
│   ├── requirements.txt      # Python dependencies
│   ├── sample.xlsx           # Sample data for demo
│   └── routers/
│       ├── admin.py          # Admin API (login, upload, publish, admin CRUD)
│       ├── public.py         # Public API (summary, metrics, filters)
│       └── realtime.py       # SSE streaming endpoint
│
├── frontend/
│   ├── package.json          # npm dependencies and scripts
│   ├── vite.config.ts        # Vite config with /api proxy to :8000
│   ├── index.html            # HTML shell (Space Grotesk, Plus Jakarta Sans, DM Sans)
│   └── src/
│       ├── main.tsx          # React entry point
│       ├── App.tsx           # React Router with all routes
│       ├── api.ts            # API client (fetch wrappers)
│       ├── index.css         # Design system (CSS variables, animations)
│       ├── pages/            # 8 page components
│       ├── components/       # Layout, FilterBar, KpiCard, Charts, etc.
│       ├── context/          # Filter, Export, Theme context providers
│       ├── hooks/            # useSSE hook
│       ├── i18n/             # Translation files (en.json, ru.json, kz.json)
│       └── utils/            # Chart colors/theme, export utilities
│
└── tools/
    └── node/                 # Portable Node.js (v22.23.2)
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js (portable included in `tools/node/` or system安装)
- Windows (`.bat` scripts) or manually run commands

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/Ind1v1D/ESG-Social.git
cd ESG-Social

# 2. Create environment file
cp .env.example .env
# Edit .env — set ADMIN_PASSWORD and SECRET_KEY

# 3. Run setup (creates Python venv, installs backend deps)
setup.bat

# 4. Install frontend dependencies
cd frontend
npm install
cd ..
```

### Running

Open two terminals:

```bash
# Terminal 1 — Backend (port 8000)
start_backend.bat

# Terminal 2 — Frontend (port 3000)
start_frontend.bat
```

Then open http://localhost:3000 in your browser.

### Default Credentials

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

> Change these in `.env` before any non-local deployment.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ADMIN_USER` | Yes | `admin` | Admin panel username |
| `ADMIN_PASSWORD` | **Yes** | — | Admin password. App refuses to start if placeholder. |
| `SECRET_KEY` | **Yes** | — | JWT signing key (32+ chars). App refuses to start if placeholder. |
| `DATABASE_URL` | No | `sqlite:///./data/social_dashboard.db` | SQLAlchemy database URL |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000` | Comma-separated CORS origins |
| `WEB_CONCURRENCY` | No | `2` | Number of Uvicorn workers |
| `DEBUG` | No | `false` | Enable `/docs`, `/redoc`, `/openapi.json` |
| `MAX_UPLOAD_SIZE` | No | `20971520` | Max upload size in bytes (20 MB) |

---

## API Endpoints

### Public

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe |
| GET | `/api/active-version` | Current active dataset ID |
| GET | `/api/filters` | Available years and faculties |
| GET | `/api/summary` | Aggregated summary (all categories) |
| GET | `/api/gender` | Gender metrics (filtered) |
| GET | `/api/engagement` | Engagement metrics (filtered) |
| GET | `/api/volunteering` | Volunteering metrics (filtered) |
| GET | `/api/esg-courses` | ESG courses metrics (filtered) |
| GET | `/api/realtime` | SSE stream for real-time updates |

### Admin (JWT required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/login` | Login, returns JWT token |
| GET | `/api/admin/uploads` | List all uploads |
| POST | `/api/admin/upload` | Upload + validate Excel file |
| POST | `/api/admin/publish/{id}` | Publish a dataset |
| POST | `/api/admin/rollback/{id}` | Rollback to previous dataset |
| GET | `/api/admin/template` | Download Excel template |
| GET | `/api/admin/admins` | List admin users |
| POST | `/api/admin/admins` | Create admin user |
| PUT | `/api/admin/admins/{id}` | Update admin user |
| DELETE | `/api/admin/admins/{id}` | Delete admin user |

---

## Excel Template Format

The upload Excel file must contain 5 sheets:

| Sheet | Required Columns |
|-------|-----------------|
| `meta` | year, faculty, group_type |
| `gender` | year, faculty, group_type, male_pct, female_pct, other_pct, women_leadership_pct, pay_gap_pct |
| `engagement` | year, faculty, satisfaction_pct, nps, club_participation_pct, avg_activities_per_student |
| `volunteering` | year, faculty, volunteers_students, volunteers_staff, total_hours, projects_count, top_direction |
| `esg_courses` | year, faculty, courses_count, esg_students_pct, green_program_students |

Download the template from the admin panel (GET `/api/admin/template`) with pre-filled headers, example data, and field notes.

---

## Architecture

```
Browser (localhost:3000)
    │
    ├── Vite Dev Server (serves React SPA)
    │       └── proxies /api/* → localhost:8000
    │
    └── FastAPI (localhost:8000)
            ├── /api/admin/* → authentication, upload, publish
            ├── /api/* → public dashboard data
            ├── /api/realtime → SSE stream
            └── SQLite (WAL mode)
```

- **Frontend** — React SPA with 8 pages, CSS variable design system, i18n
- **Backend** — FastAPI with 3 routers (admin, public, realtime)
- **Database** — SQLite file (`backend/data/social_dashboard.db`), WAL mode for read concurrency
- **Auth** — JWT tokens with bcrypt password hashing, 24-hour expiry

---

## Database

### Models

| Table | Description |
|-------|-------------|
| `admins` | Admin users (id, username, password_hash, is_active, created_at) |
| `uploads` | Upload history (id, filename, status, errors_count, created_at) |
| `settings` | Key-value store (active_upload_id) |
| `gender_metrics` | Gender equity data per faculty/year |
| `engagement_metrics` | Student/staff engagement data |
| `volunteering_metrics` | Volunteering statistics |
| `esg_courses_metrics` | ESG course enrollment data |

### Backup

```bash
# Copy database files
copy backend\data\social_dashboard.db backup.db
copy backend\data\social_dashboard.db-wal backup.db-wal
copy backend\data\social_dashboard.db-shm backup.db-shm
```

### Restore

```bash
# Stop backend, replace files, restart
copy backup.db backend\data\social_dashboard.db
copy backup.db-wal backend\data\social_dashboard.db-wal
copy backup.db-shm backend\data\social_dashboard.db-shm
```

---

## Limitations

| Area | Limitation |
|------|-----------|
| Database | SQLite — single writer, no multi-instance scaling. Suitable for demo/MVP. |
| Rate limiter | In-memory, per-process. Not distributed across workers. |
| SSE manager | In-memory, per-process. Events only reach clients connected to the same worker. |
| Authentication | JWT-based. No session revocation (token expires after 24h). |
| TLS | Not handled by the application. Deploy behind a TLS-terminating proxy. |
| Scaling | Single-instance only. For higher load, migrate to PostgreSQL + Redis. |

---

## License

This project is for academic and demonstration purposes.
