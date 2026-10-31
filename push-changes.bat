@echo off
title Kyodo Food - Push Changes to GitHub
echo =======================================================
echo     KYODO FOOD - PUSH CHANGES TO GITHUB
echo =======================================================
echo.
echo Dang kiem tra trang thai Git...
cd /d "%~dp0"

git status --short
echo.

set /p confirm="Ban co muon commit va push tat ca thay doi? (y/N): "
if /i not "%confirm%"=="y" (
    echo Da huy.
    pause
    exit /b
)

echo.
echo Dang them cac file thay doi...
git add -A

echo.
set /p msg="Nhap commit message (de trong de tu dong): "
if "%msg%"=="" (
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set datetime=%%I
    set msg=chore: auto-sync %datetime:~6,2%-%datetime:~4,2%-%datetime:~0,4% %datetime:~8,2%:%datetime:~10,2%
)

echo.
echo Dang commit: "%msg%"
git commit -m "%msg%"

echo.
echo Dang push len GitHub...
git push origin main

echo.
echo =======================================================
echo ✅ HOAN TAT! Da push len GitHub thanh cong.
echo.
echo May nhan vien se tu dong cap nhat trong 60 giay.
echo =======================================================
pause