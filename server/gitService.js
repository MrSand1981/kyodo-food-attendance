// server/gitService.js
const { exec } = require('child_process');
const path = require('path');

const APP_DIR = path.join(__dirname, '..');

function runCmd(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd: APP_DIR, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        return reject(new Error(stderr || stdout || err.message));
      }
      resolve(stdout.trim());
    });
  });
}

async function getGitStatus() {
  try {
    const branch = await runCmd('git rev-parse --abbrev-ref HEAD');
    
    let remoteUrl = '';
    try {
      remoteUrl = await runCmd('git remote get-url origin');
    } catch {
      remoteUrl = 'https://github.com/MrSand1981/kyodo-food-attendance.git';
    }

    const porcelain = await runCmd('git status --porcelain');
    const modifiedFiles = porcelain ? porcelain.split('\n').filter(Boolean).length : 0;

    let unpushedCount = 0;
    try {
      const revCount = await runCmd(`git rev-list --count HEAD ^origin/${branch}`);
      unpushedCount = parseInt(revCount, 10) || 0;
    } catch {
      unpushedCount = 0;
    }

    return {
      success: true,
      branch: branch || 'main',
      remoteUrl,
      repoSlug: remoteUrl.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, ''),
      modifiedFiles,
      unpushedCount,
      hasChanges: modifiedFiles > 0 || unpushedCount > 0
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

async function pushToGitHub(messageInput) {
  const now = new Date();
  const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  const commitMsg = messageInput?.trim() || `Cap nhat Kyodo Food - ${dateStr}`;

  const logs = [];

  try {
    // 1. Build production frontend
    logs.push('1. Đang đóng gói giao diện sản xuất (npm run build)...');
    try {
      await runCmd('npm run build');
      logs.push('-> Đóng gói giao diện thành công.');
    } catch (bErr) {
      logs.push(`-> Lưu ý build: ${bErr.message}`);
    }

    // 2. Git add
    logs.push('2. Đang thêm các tệp thay đổi vào Git (git add -A)...');
    await runCmd('git add -A');

    // 3. Git commit
    logs.push(`3. Đang tạo commit: "${commitMsg}"...`);
    try {
      const commitOutput = await runCmd(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
      logs.push(`-> ${commitOutput.split('\n')[0]}`);
    } catch (cErr) {
      if (cErr.message.includes('nothing to commit')) {
        logs.push('-> Không có thay đổi mới cần commit.');
      } else {
        logs.push(`-> Commit: ${cErr.message}`);
      }
    }

    // 4. Git push
    logs.push('4. Đang đẩy lên GitHub repository (git push origin main)...');
    const pushOutput = await runCmd('git push origin main');
    logs.push(pushOutput || '-> Đẩy mã nguồn lên GitHub thành công!');

    // 5. Lấy commit hash mới nhất
    let latestHash = '';
    try {
      latestHash = await runCmd('git rev-parse --short HEAD');
    } catch {}

    return {
      success: true,
      commitHash: latestHash,
      message: `Đã đẩy bản cập nhật mới lên GitHub thành công! (Commit: ${latestHash})`,
      logs: logs.join('\n')
    };
  } catch (err) {
    logs.push(`LỖI: ${err.message}`);
    return {
      success: false,
      message: `Lỗi khi đẩy lên GitHub: ${err.message}`,
      logs: logs.join('\n')
    };
  }
}

module.exports = {
  getGitStatus,
  pushToGitHub
};
