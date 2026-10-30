// server/updater.js
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const APP_DIR = path.join(__dirname, '..');
const DB_FILE = path.join(APP_DIR, 'data', 'database.json');
const BACKUP_DIR = path.join(APP_DIR, 'data', 'backups');
const VERSION_FILE = path.join(APP_DIR, 'package.json');

function isNewerVersion(remoteVer, currentVer) {
  if (!remoteVer || !currentVer) return false;
  const parse = v => String(v).split('.').map(n => parseInt(n, 10) || 0);
  const r = parse(remoteVer);
  const c = parse(currentVer);
  for (let i = 0; i < Math.max(r.length, c.length); i++) {
    const rNum = r[i] || 0;
    const cNum = c[i] || 0;
    if (rNum > cNum) return true;
    if (rNum < cNum) return false;
  }
  return false;
}

function getCurrentVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8'));
    return pkg.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

function parseGithubRepo(inputUrlOrSlug) {
  if (!inputUrlOrSlug) return null;
  const cleaned = inputUrlOrSlug.trim()
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/^\//, '')
    .replace(/\/$/, '');
  
  const parts = cleaned.split('/');
  if (parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`;
  }
  return null;
}

async function checkUpdate(githubRepoInput) {
  const currentVersion = getCurrentVersion();
  const repoSlug = parseGithubRepo(githubRepoInput);

  if (!repoSlug) {
    return {
      configured: false,
      hasUpdate: false,
      currentVersion,
      message: 'Chưa cấu hình đường link GitHub Repository'
    };
  }

  try {
    let remoteVer = null;
    let branch = 'main';

    // 1. Ưu tiên kiểm tra trực tiếp qua GitHub Contents API (không bị cache CDN Fastly)
    try {
      const apiRes = await fetch(`https://api.github.com/repos/${repoSlug}/contents/package.json?ref=main`, {
        headers: { 
          'User-Agent': 'KyodoFood-App-Updater',
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData.content) {
          const pkgJson = JSON.parse(Buffer.from(apiData.content, 'base64').toString('utf-8'));
          remoteVer = pkgJson.version;
        }
      }
    } catch (e) {
      // Fallback qua raw bên dưới
    }

    // 2. Fallback sang rawUrl nếu API rate-limited hoặc không có mạng quốc tế
    if (!remoteVer) {
      const rawUrl = `https://raw.githubusercontent.com/${repoSlug}/main/package.json?t=${Date.now()}`;
      let res = await fetch(rawUrl, {
        headers: { 'User-Agent': 'KyodoFood-App-Updater', 'Cache-Control': 'no-cache' }
      });

      if (!res.ok) {
        const masterUrl = `https://raw.githubusercontent.com/${repoSlug}/master/package.json?t=${Date.now()}`;
        res = await fetch(masterUrl, {
          headers: { 'User-Agent': 'KyodoFood-App-Updater', 'Cache-Control': 'no-cache' }
        });
        branch = 'master';
      }

      if (res.ok) {
        const remotePkg = await res.json();
        remoteVer = remotePkg.version;
      }
    }

    if (!remoteVer) {
      throw new Error(`Không thể tìm thấy package.json trên GitHub (${repoSlug}). Vui lòng kiểm tra lại repository.`);
    }

    const hasUpdate = isNewerVersion(remoteVer, currentVersion);
    const displayLatest = hasUpdate ? remoteVer : currentVersion;

    return {
      configured: true,
      repo: repoSlug,
      branch: branch,
      hasUpdate,
      currentVersion,
      latestVersion: displayLatest,
      message: hasUpdate 
        ? `Đã có bản cập nhật mới (v${remoteVer}) trên GitHub!` 
        : `Phần mềm đang ở phiên bản mới nhất (v${currentVersion}).`
    };
  } catch (err) {
    return {
      configured: true,
      repo: repoSlug,
      hasUpdate: false,
      currentVersion,
      error: true,
      message: `Lỗi kết nối GitHub: ${err.message}`
    };
  }
}

async function applyUpdate(githubRepoInput) {
  const repoSlug = parseGithubRepo(githubRepoInput);
  if (!repoSlug) {
    throw new Error('Chưa cấu hình GitHub repository!');
  }

  // Bước 1: Sao lưu database.json an toàn
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  let dbBackup = null;
  if (fs.existsSync(DB_FILE)) {
    dbBackup = fs.readFileSync(DB_FILE, 'utf-8');
    const backupName = `db_backup_before_update_${Date.now()}.json`;
    fs.writeFileSync(path.join(BACKUP_DIR, backupName), dbBackup, 'utf-8');
    console.log(`[Updater] Đã sao lưu database an toàn tại ${backupName}`);
  }

  // Bước 2: Tải zip từ GitHub
  let zipUrl = `https://github.com/${repoSlug}/archive/refs/heads/main.zip`;
  let zipRes = await fetch(zipUrl, {
    headers: { 'User-Agent': 'KyodoFood-App-Updater' }
  });

  if (!zipRes.ok) {
    // Thử nhánh master
    zipUrl = `https://github.com/${repoSlug}/archive/refs/heads/master.zip`;
    zipRes = await fetch(zipUrl, {
      headers: { 'User-Agent': 'KyodoFood-App-Updater' }
    });
    if (!zipRes.ok) {
      throw new Error(`Không thể tải bản cập nhật từ GitHub (${zipRes.statusText})`);
    }
  }

  const arrayBuffer = await zipRes.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const tempZipPath = path.join(APP_DIR, 'temp_update.zip');
  fs.writeFileSync(tempZipPath, buffer);

  try {
    // Bước 3: Giải nén và ghi đè mã nguồn mới
    const zip = new AdmZip(tempZipPath);
    const zipEntries = zip.getEntries();
    
    // Tìm tiền tố thư mục gốc trong zip của GitHub (ví dụ: kyodo-food-attendance-main/)
    const rootDirName = zipEntries[0].entryName.split('/')[0];

    zipEntries.forEach(entry => {
      if (entry.isDirectory) return;
      
      // Bỏ qua thư mục gốc của GitHub
      const relPath = entry.entryName.substring(rootDirName.length + 1);
      if (!relPath) return;

      // TUYỆT ĐỐI KHÔNG GHI ĐÈ FILE DỮ LIỆU CHẤM CÔNG CỦA CỬA HÀNG
      if (relPath.startsWith('data/database.json') || relPath.startsWith('bin/')) {
        return;
      }

      const targetPath = path.join(APP_DIR, relPath);
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      fs.writeFileSync(targetPath, entry.getData());
    });

    console.log('[Updater] Đã giải nén và cập nhật mã nguồn mới thành công!');
  } finally {
    // Dọn dẹp file zip tạm
    if (fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
    }

    // Đảm bảo dữ liệu database.json được giữ nguyên vẹn 100%
    if (dbBackup) {
      fs.writeFileSync(DB_FILE, dbBackup, 'utf-8');
      console.log('[Updater] Đã bảo toàn nguyên vẹn dữ liệu chấm công của cửa hàng.');
    }
  }

  return {
    success: true,
    message: 'Cập nhật phần mềm thành công! Dữ liệu chấm công đã được bảo toàn nguyên vẹn.'
  };
}

module.exports = {
  getCurrentVersion,
  checkUpdate,
  applyUpdate,
  parseGithubRepo
};
