// server/reset-admin.js
// Công cụ dòng lệnh (CLI) khôi phục mật khẩu Quản trị viên Kyodo Food an toàn trên máy chủ
const db = require('./db');

const args = process.argv.slice(2);
const newPassword = args[0] || '20162020';

console.log('🔄 Đang tiến hành đặt lại mật khẩu Quản trị viên Kyodo Food...');

try {
  const result = db.resetAdminPasswordDirect(newPassword);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ ĐẶT LẠI MẬT KHẨU QUẢN TRỊ VIÊN THÀNH CÔNG!');
  console.log(`👤 Tài khoản: ${result.adminUsername}`);
  console.log(`🔑 Mật khẩu mới: ${newPassword}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👉 Bạn có thể mở ứng dụng và đăng nhập bằng mật khẩu trên.');
  process.exit(0);
} catch (err) {
  console.error('❌ Thất bại:', err.message);
  process.exit(1);
}
