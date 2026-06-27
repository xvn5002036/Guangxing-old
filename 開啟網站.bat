@echo off
setlocal
cd /d "%~dp0"

set "SCRIPT=%~dp0tools\start-site.ps1"

if not exist "%SCRIPT%" (
  echo start-site.ps1 not found.
  pause
  exit /b 1
)

start "Guangxing Site Starter" powershell -NoProfile -ExecutionPolicy Bypass -NoExit -File "%SCRIPT%"
exit /b
