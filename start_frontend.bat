@echo off
set "NODE=C:\Users\user\Documents\esg\tools\node\node-v22.23.2-win-x64"
set "PATH=%NODE%;%PATH%"
cd /d "%~dp0frontend"
if not exist node_modules (
    echo [ERROR] node_modules not found. Run setup.bat first.
    pause
    exit /b 1
)
echo Starting frontend on http://localhost:3000 ...
"%NODE%\node.exe" "%NODE%\node_modules\npm\bin\npm-cli.js" run dev
pause