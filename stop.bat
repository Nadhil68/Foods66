@echo off
title Foods66 - Stop Servers
echo ========================================================
echo               STOPPING FOODS66 PLATFORM                  
echo ========================================================
echo.
echo Stopping processes running on ports 3000 (Frontend) and 5000 (Backend)...

powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000, 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue; Write-Host 'Stopped process ID:' $_ }"

echo.
echo Servers have been stopped.
echo (MongoDB service is left intact.)
echo.
pause
