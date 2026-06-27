@echo off
cd /d "%~dp0"
set "LOG_FILE=%~dp0site-start.log"

echo.
echo ==============================
echo   Guangxing Site Starter
echo ==============================
echo.
echo Project folder:
echo %cd%
echo.
echo Start time: %date% %time% > "%LOG_FILE%"
echo Project folder: %cd% >> "%LOG_FILE%"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found.
  echo Node.js was not found.>> "%LOG_FILE%"
  goto error_exit
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm was not found.
  echo npm was not found.>> "%LOG_FILE%"
  goto error_exit
)

if not exist "node_modules" (
  echo Installing packages...
  echo Running npm install...>> "%LOG_FILE%"
  call npm.cmd install >> "%LOG_FILE%" 2>&1
  if errorlevel 1 (
    echo Package install failed.
    goto error_exit
  )
)

echo Preparing local SQLite database...
echo Running db init...>> "%LOG_FILE%"
call node tools\db-tool.cjs init-sqlite >> "%LOG_FILE%" 2>&1
if errorlevel 1 (
  echo Database init failed.
  goto error_exit
)

netstat -ano | findstr ":3000" | findstr "LISTENING" >nul 2>nul
if not errorlevel 1 (
  echo.
  echo Site is already running. Opening browser:
  echo http://localhost:3000
  echo Port 3000 already running.>> "%LOG_FILE%"
  start "" "http://localhost:3000"
  echo.
  echo If the page still does not open, close the old black terminal window and run this file again.
  pause
  exit /b 0
)

netstat -ano | findstr ":3001" | findstr "LISTENING" >nul 2>nul
if not errorlevel 1 (
  echo.
  echo Port 3001 is already in use, but port 3000 is not running.
  echo Close old site terminal windows, then run this file again.
  echo Port 3001 already in use.>> "%LOG_FILE%"
  goto error_exit
)

echo.
echo Starting site...
echo Browser will open:
echo http://localhost:3000
echo.
start "" powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 5; Start-Process 'http://localhost:3000'"
echo Running npm run dev:all...>> "%LOG_FILE%"
call npm.cmd run dev:all

echo.
echo Site process stopped.
echo See log file:
echo %LOG_FILE%
pause
exit /b 0

:error_exit
echo.
echo Site did not start.
echo See log file:
echo %LOG_FILE%
echo.
pause
exit /b 1
