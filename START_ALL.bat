@echo off
echo ========================================
echo   Starting AI Medical Center Services
echo ========================================
echo.

cd /d "%~dp0"

echo Starting Backend (X-ray API)...
start "Backend - X-ray API" powershell -NoExit -Command "cd '%~dp0services\nv-reason-cxr-api'; .\start-backend.ps1"

timeout /t 3 /nobreak >nul

echo Starting Frontend (Next.js)...
start "Frontend - Next.js" powershell -NoExit -Command "cd '%~dp0healt-care'; npm run dev"

echo.
echo ========================================
echo   Services Starting...
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Two windows will open:
echo   1. Backend server (X-ray API)
echo   2. Frontend server (Next.js)
echo.
pause
