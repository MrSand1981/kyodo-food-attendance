@echo off
title Kyodo Food - Khoi Dong May Chu & Tao Link Online Tu Xa
echo ======================================================================
echo    KYODO FOOD - CUA HANG TRUNG NU VUONG (DA NANG - NGHE AN)
echo ======================================================================
echo.
cd /d "%~dp0"

REM 1. Khoi dong server noi bo port 5000 neu chua chay
start "Kyodo Server" cmd /c "node server/server.js"
timeout /t 2 >nul

REM 2. Kiem tra xem da co cloudflared chua
if not exist "cloudflared.exe" (
    echo Dang tai cong cu Cloudflare Tunnel mien phi de tao link online...
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe'"
)

echo.
echo ======================================================================
echo DANG KET NOI VA TAO LINK TRUY CAP ONLINE GIUA DA NANG VA NGHE AN...
echo (Link se hien thi ben duoi dang: https://xxxx.trycloudflare.com)
echo ======================================================================
echo.

cloudflared.exe tunnel --url http://localhost:5000
pause
