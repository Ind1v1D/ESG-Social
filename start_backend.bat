@echo off
cd /d "%~dp0backend"
if not exist venv\Scripts\python.exe (
    echo [ERROR] venv not found. Run setup.bat first.
    pause
    exit /b 1
)
echo Starting backend on http://localhost:8000 ...
venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000
pause