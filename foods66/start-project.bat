@echo off
cd /d "%~dp0"

echo Starting Database...
start cmd /k "mongod --dbpath db_data"

echo Waiting for MongoDB to start...
timeout /t 3 /nobreak > NUL

echo Starting Backend...
start cmd /k "cd backend && npm run dev"

echo Starting Frontend...
start cmd /k "cd frontend && npm run dev"

echo All services are starting in separate windows.
echo - MongoDB: Local DB
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:3000
pause
