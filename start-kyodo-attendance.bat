@echo off
title Kyodo Food - He Thong Quan Ly Cham Cong Thong Minh
echo =======================================================
echo     KYODO FOOD - HE THONG QUAN LY CHAM CONG THONG MINH
echo =======================================================
echo.
echo Dang khoi dong may chu Cham Cong...
cd /d "%~dp0"

start http://localhost:5000
node server/server.js
pause
