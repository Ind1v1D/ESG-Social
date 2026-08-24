@echo off
cd /d "%~dp0backend"
if exist venv rmdir /s /q venv
python -m venv venv
venv\Scripts\python.exe -m pip install --upgrade pip
venv\Scripts\python.exe -m pip install -r requirements.txt
if not exist data mkdir data
echo Backend ready.
pause