@echo off
title Kyodo Food - Cap Nhat Phan Mem Tu GitHub
echo ======================================================================
echo       KYODO FOOD - CAP NHAT PHAN MEM TU DONG TU GITHUB
echo ======================================================================
echo.
cd /d "%~dp0"

echo Dang kiem tra ban cap nhat tu GitHub...
echo.

.\bin\node.exe -e "
const db = require('./server/db');
const updater = require('./server/updater');

async function main() {
  const settings = db.getSettings();
  const repo = settings.githubRepo;
  if (!repo) {
    console.log('Chua cau hinh duong link GitHub trong phan mem.');
    console.log('Vui long vao phan mem -> Cai dat -> Nhap link GitHub Repository truoc!');
    process.exit(1);
  }

  console.log('Kiem tra repository:', repo);
  const check = await updater.checkUpdate(repo);
  console.log(check.message);

  if (check.hasUpdate) {
    console.log('\nDang tien hanh tai va nang cap phan mem...');
    const res = await updater.applyUpdate(repo);
    console.log(res.message);
  } else {
    console.log('\nBan dang su dung phien ban moi nhat!');
  }
}

main().catch(err => {
  console.error('Loi:', err.message);
  process.exit(1);
});
"

echo.
echo ======================================================================
pause
