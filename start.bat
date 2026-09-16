@echo off
title Cinefora - Book-to-Screen AI Pipeline
echo.
echo  ===================================
echo   Cinefora - Starting Dev Server
echo  ===================================
echo.
echo  Press Ctrl+C to stop the server.
echo.
cd /d "%~dp0"
npm run dev
pause
