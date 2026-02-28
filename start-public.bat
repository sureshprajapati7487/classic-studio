@echo off
title Classic Studio - One Click Start
color 0A

echo.
echo  ==========================================
echo   CLASSIC STUDIO - Starting Everything...
echo  ==========================================
echo.
echo  [1/3] Starting Backend Server...
start "Classic Studio - Backend" cmd /k "cd /d "D:\Projects\Professional Video & Photo Editor\backend" && npm start"
timeout /t 3 /nobreak >nul

echo  [2/3] Starting Frontend...
start "Classic Studio - Frontend" cmd /k "cd /d "D:\Projects\Professional Video & Photo Editor\frontend" && npm run dev"
timeout /t 5 /nobreak >nul

echo  [3/3] Starting Public Tunnel (wait for URL)...
echo.
echo  ==========================================
echo   Look for URL ending in .loca.lt below:
echo  ==========================================
echo.
lt --port 5000 --subdomain classicstudio
pause
