# Kyodo Food - Push Changes to GitHub (PowerShell version)
param(
    [string]$Message = ""
)

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "     KYODO FOOD - PUSH CHANGES TO GITHUB" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $PSScriptRoot

Write-Host "Dang kiem tra trang thai Git..." -ForegroundColor Yellow
git status --short
Write-Host ""

$confirm = Read-Host "Ban co muon commit va push tat ca thay doi? (y/N)"
if ($confirm -ine 'y') {
    Write-Host "Da huy." -ForegroundColor Red
    Read-Host "Nhan Enter de thoat"
    exit
}

Write-Host ""
Write-Host "Dang them cac file thay doi..." -ForegroundColor Yellow
git add -A

if ([string]::IsNullOrWhiteSpace($Message)) {
    $datetime = Get-Date -Format "dd-MM-yyyy HH:mm"
    $Message = "chore: auto-sync $datetime"
}

Write-Host ""
Write-Host "Dang commit: `"$Message`"" -ForegroundColor Yellow
git commit -m $Message

Write-Host ""
Write-Host "Dang push len GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Green
Write-Host "✅ HOAN TAT! Da push len GitHub thanh cong." -ForegroundColor Green
Write-Host ""
Write-Host "May nhan vien se tu dong cap nhat trong 60 giay." -ForegroundColor Gray
Write-Host "=======================================================" -ForegroundColor Green
Read-Host "Nhan Enter de thoat"