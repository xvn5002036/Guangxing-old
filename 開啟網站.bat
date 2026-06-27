@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "LOG_FILE=%~dp0site-start.log"
set "SITE_URL=http://localhost"
set "SITE_PORT=80"

net session >nul 2>nul
if errorlevel 1 (
  echo This site uses port 80 and needs administrator permission.
  echo Requesting administrator permission...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

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
echo Website URL: %SITE_URL% >> "%LOG_FILE%"

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

echo Checking port %SITE_PORT%...
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%SITE_PORT% .*LISTENING"') do (
  if not "%%P"=="0" (
    echo Closing old process on port %SITE_PORT%: %%P
    echo Closing old process on port %SITE_PORT%: %%P>> "%LOG_FILE%"
    taskkill /F /PID %%P >> "%LOG_FILE%" 2>&1
  )
)

timeout /t 2 /nobreak >nul

netstat -ano | findstr /R /C:":%SITE_PORT% .*LISTENING" >nul 2>nul
if not errorlevel 1 (
  echo.
  echo Port %SITE_PORT% is still in use.
  echo If Windows shows PID 4 or System, please stop IIS / World Wide Web Publishing Service first.
  echo Port %SITE_PORT% still in use.>> "%LOG_FILE%"
  goto error_exit
)

echo Building website...
echo Running npm run build...>> "%LOG_FILE%"
call npm.cmd run build >> "%LOG_FILE%" 2>&1
if errorlevel 1 (
  echo Website build failed.
  goto error_exit
)

echo.
echo Starting website on port %SITE_PORT%...
echo Browser will open:
echo %SITE_URL%
echo.
start "" powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 3; Start-Process '%SITE_URL%'"
echo Running node server/server.js on port %SITE_PORT%...>> "%LOG_FILE%"
set "PORT=%SITE_PORT%"
set "PUBLIC_BASE_URL=%SITE_URL%"
set "FRONTEND_BASE_URL=%SITE_URL%"
node server\server.js

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
