@echo off
chcp 65001 >nul
title Kyodo Food - Cập Nhật & Đẩy Lên GitHub
color 0A

echo =======================================================
echo  🍗 KYODO FOOD - ĐỒNG BỘ VÀ ĐẨY BẢN MỚI LÊN GITHUB
echo  Cơ sở: Trưng Nữ Vương, Đà Nẵng
echo =======================================================
echo.

cd /d "%~dp0"

echo [1/4] Đang kiểm tra trạng thái Git...
git status --short
echo.

echo [2/4] Đang đóng gói giao diện sản xuất mới nhất (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    echo [CANH BAO] Giao dien chua duoc build lai hoac co canh bao nho. Tiep tuc dong bo...
)
echo.

echo [3/4] Đang lưu tất cả các tệp thay đổi vào Git...
git add -A

set commit_msg=Update Kyodo Food - %date% %time%
git commit -m "%commit_msg%"
echo.

echo [4/4] Đang đẩy bản cập nhật lên GitHub (git push origin main)...
git push origin main
if %errorlevel% equ 0 (
    echo.
    echo =======================================================
    echo  🎉 THÀNH CÔNG! ĐÃ ĐẨY BẢN CẬP NHẬT LÊN GITHUB!
    echo =======================================================
    echo  Kho lưu trữ: https://github.com/MrSand1981/kyodo-food-attendance
    echo  Bây giờ máy tính tại cửa hàng Đà Nẵng chỉ cần nhấn:
    echo  "Kiểm tra & Cập nhật" để tự động tải bản mới này về!
    echo =======================================================
) else (
    echo.
    echo =======================================================
    echo  ❌ LỖI: Không thể đẩy lên GitHub.
    echo  Vui lòng kiểm tra lại kết nối mạng Internet của bạn!
    echo =======================================================
)

echo.
echo Nhấn phím bất kỳ để đóng cửa sổ này...
pause >nul
