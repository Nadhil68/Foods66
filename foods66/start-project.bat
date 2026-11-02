@echo off
cd /d "%~dp0"

echo ========================================================
echo   FOODS66 - Live Firebase Firestore Platform Launcher
echo ========================================================
echo Database: Live Firebase Firestore (foods66-3e9a5)
echo.

echo Starting Backend Server...
start "Foods66 - Backend (Live Firebase)" cmd /k "cd backend && npm run dev"

echo Starting Frontend Web App...
start "Foods66 - Frontend (Port 3000)" cmd /k "cd frontend && npm run dev"

echo.
echo All services are starting in separate windows:
echo - Live Database: Firebase Firestore (foods66-3e9a5)
echo - Backend API:   http://localhost:5000
echo - Frontend App:  http://localhost:3000
echo.
pause
