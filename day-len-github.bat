@echo off
title Day Phan Mem Kyodo Food Len GitHub
echo ======================================================================
echo       KYODO FOOD - HUONG DAN DAY MA NGUON LEN GITHUB DE DUA LEN CLOUD
echo ======================================================================
echo.
cd /d "%~dp0"

echo Buoc 1: Vao trang https://github.com/new tren trinh duyet va tao mot Repository moi
echo         (Dat ten la: kyodo-food-attendance)
echo.
echo Buoc 2: Dan duong link Repository cua ban vao day (Vi du: https://github.com/ten-ban/kyodo-food-attendance.git)
echo.
set /p REPO_URL="Nhap link GitHub Repository cua ban: "

if "%REPO_URL%"=="" (
    echo Ban chua nhap link! Vui long chay lai file nay.
    pause
    exit /b
)

git remote remove origin 2>nul
git remote add origin %REPO_URL%
git branch -M main
git push -u origin main

echo.
echo ======================================================================
echo DA DAY MA NGUON LEN GITHUB THANH CONG!
echo Bay gio ban chi can vao Render.com -> New Web Service -> Chon Repository nay!
echo ======================================================================
pause
