@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js not found. Install Node.js 20 or newer from https://nodejs.org/
  pause
  exit /b 1
)
echo GlobalLaunch AI starting. Open http://127.0.0.1:3000
node server.mjs
pause
