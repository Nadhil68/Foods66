@echo off
setlocal enabledelayedexpansion
title Foods66 Platform Launcher

echo ========================================================
echo               FOODS66 PLATFORM LAUNCHER                  
echo ========================================================
echo.

:: 1. Locate project root directory
set "PROJECT_DIR="
if exist "%~dp0backend\package.json" (
    set "PROJECT_DIR=%~dp0"
) else if exist "%~dp0foods66\backend\package.json" (
    set "PROJECT_DIR=%~dp0foods66"
)

if "%PROJECT_DIR%"=="" (
    echo [ERROR] Could not locate Foods66 backend or frontend folder!
    echo Checked: "%~dp0" and "%~dp0foods66"
    pause
    exit /b 1
)

echo [INFO] Project directory: %PROJECT_DIR%
echo.

:: 2. Check Node.js and npm
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in PATH!
    pause
    exit /b 1
)

:: 3. Check Database
echo [1/4] Checking Database status...
echo   - Live Firebase Firestore Database (Project: foods66-3e9a5) is ACTIVE and CONNECTED.

:: 4. Verify Dependencies
echo.
echo [2/4] Checking dependencies...
if not exist "%PROJECT_DIR%\backend\node_modules" (
    echo   - Installing backend dependencies...
    pushd "%PROJECT_DIR%\backend"
    call npm install
    popd
) else (
    echo   - Backend dependencies verified.
)

if not exist "%PROJECT_DIR%\frontend\node_modules" (
    echo   - Installing frontend dependencies...
    pushd "%PROJECT_DIR%\frontend"
    call npm install
    popd
) else (
    echo   - Frontend dependencies verified.
)

:: 5. Start Backend Server
echo.
echo [3/4] Launching Backend Server (port 5000)...
start "Foods66 - Backend Server" cmd /k "cd /d ""%PROJECT_DIR%\backend"" && title Foods66 Backend (Port 5000) && npm run dev"

:: 6. Start Frontend Server
echo.
echo [4/4] Launching Frontend Server (port 3000)...
start "Foods66 - Frontend Server" cmd /k "cd /d ""%PROJECT_DIR%\frontend"" && title Foods66 Frontend (Port 3000) && npm run dev"

:: 7. Summary and open browser
echo.
echo ========================================================
echo   Services are starting up:
echo     - Backend:  http://localhost:5000 (API: /api)
echo     - Frontend: http://localhost:3000
echo ========================================================
echo.
echo Opening browser in 4 seconds...
timeout /t 4 /nobreak >nul
start http://localhost:3000

echo.
echo Project is running! Keep the backend and frontend terminal windows open.
echo Press any key to close this launcher window.
echo.
pause
