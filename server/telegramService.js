// server/telegramService.js
// Dịch vụ gửi thông báo tự động qua Telegram Bot cho Quản lý Kyodo Food
const db = require('./db');

function formatDateVN(dateInput) {
  if (!dateInput) return '';
  const s = String(dateInput).split('T')[0].trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-');
    return `${d}/${m}/${y}`;
  }
  return s;
}

function getTelegramConfig() {
  const settings = db.getSettings();
  return (
    settings.telegram || {
      enabled: false,
      botToken: '',
      chatId: '',
      notifyAdvance: true,
      notifyLeave: true,
      notifyAttendance: false,
    }
  );
}

async function sendTelegramRaw(botToken, chatId, messageHtml) {
  if (!botToken || !chatId) {
    throw new Error('Chưa cấu hình Telegram Bot Token hoặc Chat ID');
  }

  const url = `https://api.telegram.org/bot${botToken.trim()}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: String(chatId).trim(),
      text: messageHtml,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.description || 'Lỗi gửi tin nhắn Telegram');
  }
  return data;
}

async function sendNotification(messageHtml) {
  try {
    const config = getTelegramConfig();
    if (!config.enabled || !config.botToken || !config.chatId) {
      return { sent: false, reason: 'Telegram disabled or unconfigured' };
    }
    await sendTelegramRaw(config.botToken, config.chatId, messageHtml);
    return { sent: true };
  } catch (err) {
    console.error('⚠️ [Telegram] Lỗi gửi thông báo:', err.message);
    return { sent: false, error: err.message };
  }
}

// 1. Thông báo khi nhân viên xin Ứng Lương
async function notifySalaryAdvance({ employee, amount, date, reason }) {
  const config = getTelegramConfig();
  if (!config.enabled || config.notifyAdvance === false) return;

  const now = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  const empName = employee?.name || employee?.fullName || 'Nhân viên';
  const empCode = employee?.username || employee?.code || '';
  const formattedAmount = Number(amount || 0).toLocaleString('vi-VN');

  const text = `💸 <b>YÊU CẦU ỨNG TIỀN LƯƠNG MỚI!</b>
━━━━━━━━━━━━━━━━━━
🏪 <b>Cơ sở:</b> Kyodo Food - Trưng Nữ Vương, Đà Nẵng
👤 <b>Nhân viên:</b> <b>${empName}</b> (${empCode})
💰 <b>Số tiền ứng:</b> <b>${formattedAmount} đ</b>
📅 <b>Ngày ứng:</b> ${formatDateVN(date)}
📝 <b>Lý do:</b> <i>${reason || 'Ứng chi tiêu cá nhân'}</i>
⏰ <b>Thời gian gửi:</b> ${now}
━━━━━━━━━━━━━━━━━━
👉 <i>Quản lý đăng nhập để đối chiếu và duyệt chi:</i>
🌐 <a href="https://kyodo-food-attendance.onrender.com">Cổng Quản Trị Kyodo Food</a>`;

  return sendNotification(text);
}

// 2. Thông báo khi nhân viên Xin Nghỉ Phép
async function notifyLeaveRequest({ employee, date, endDate, shift, reason }) {
  const config = getTelegramConfig();
  if (!config.enabled || config.notifyLeave === false) return;

  const now = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  const empName = employee?.name || employee?.fullName || 'Nhân viên';
  const empCode = employee?.username || employee?.code || '';
  const dateRange =
    endDate && endDate !== date
      ? `${formatDateVN(date)} ➔ ${formatDateVN(endDate)}`
      : formatDateVN(date);

  const text = `📅 <b>THÔNG BÁO XIN NGHỈ LÀM!</b>
━━━━━━━━━━━━━━━━━━
🏪 <b>Cơ sở:</b> Kyodo Food - Trưng Nữ Vương, Đà Nẵng
👤 <b>Nhân viên:</b> <b>${empName}</b> (${empCode})
📆 <b>Ngày xin nghỉ:</b> <b>${dateRange}</b>
⏰ <b>Ca xin nghỉ:</b> ${shift || 'Cả ngày'}
📝 <b>Lý do:</b> <i>${reason || 'Việc cá nhân'}</i>
⏰ <b>Thời gian gửi:</b> ${now}
━━━━━━━━━━━━━━━━━━
👉 <i>Quản lý kiểm tra lịch ca và sắp xếp nhân sự thay thế:</i>
🌐 <a href="https://kyodo-food-attendance.onrender.com">Cổng Quản Trị Kyodo Food</a>`;

  return sendNotification(text);
}

// 3. Thông báo khi nhân viên Chấm Công (tùy chọn)
async function notifyAttendance({ employee, date, shiftName, startTime, endTime, hours }) {
  const config = getTelegramConfig();
  if (!config.enabled || !config.notifyAttendance) return;

  const empName = employee?.name || employee?.fullName || 'Nhân viên';
  const empCode = employee?.username || employee?.code || '';

  const text = `🕒 <b>NHÂN VIÊN CHẤM CÔNG CA LÀM!</b>
━━━━━━━━━━━━━━━━━━
🏪 <b>Cơ sở:</b> Kyodo Food - Trưng Nữ Vương, Đà Nẵng
👤 <b>Nhân viên:</b> <b>${empName}</b> (${empCode})
📅 <b>Ngày làm:</b> ${formatDateVN(date)}
⏰ <b>Khung giờ:</b> ${startTime} - ${endTime} (${shiftName || 'Ca làm'})
⏱️ <b>Tổng giờ làm:</b> <b>${hours} tiếng</b>
━━━━━━━━━━━━━━━━━━`;

  return sendNotification(text);
}

// 4. Thông báo khôi phục mật khẩu Quản trị viên (Gửi ngoài kênh bảo mật Telegram)
async function notifyAdminPasswordReset({ adminUsername, newPassword, ip }) {
  const config = getTelegramConfig();
  if (!config.enabled || !config.botToken || !config.chatId) {
    return { sent: false, reason: 'Telegram disabled or unconfigured' };
  }

  const now = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  const text = `🔐 <b>YÊU CẦU ĐẶT LẠI MẬT KHẨU QUẢN TRỊ VIÊN</b>
━━━━━━━━━━━━━━━━━━
🏪 <b>Cơ sở:</b> Kyodo Food - Trưng Nữ Vương, Đà Nẵng
👤 <b>Tài khoản Quản trị:</b> <b>${adminUsername || 'admin'}</b>
🔑 <b>Mật khẩu mới tạm thời:</b> <code>${newPassword}</code>
⏰ <b>Thời gian yêu cầu:</b> ${now}
🌐 <b>IP yêu cầu:</b> <code>${ip || 'Kiosk / Mạng cục bộ'}</code>
━━━━━━━━━━━━━━━━━━
⚠️ <i><b>Lưu ý quan trọng:</b> Mật khẩu mới đã được cập nhật. Vui lòng đăng nhập ngay và đổi lại mật khẩu trong mục Cài Đặt. Nếu bạn KHÔNG thực hiện thao tác này, tài khoản của bạn có thể đang bị tấn công, hãy đổi mật khẩu ngay!</i>`;

  return sendTelegramRaw(config.botToken, config.chatId, text);
}

// 5. Kiểm tra kết nối Telegram Bot (gửi tin nhắn test)
async function testTelegram(botToken, chatId) {
  const now = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  const testMessage = `🎉 <b>KẾT NỐI TELEGRAM BOT THÀNH CÔNG!</b>
━━━━━━━━━━━━━━━━━━
🍗 <b>Phần mềm:</b> Chấm công Kyodo Food
🏪 <b>Cơ sở:</b> Trưng Nữ Vương, Đà Nẵng
⏰ <b>Thời gian kiểm tra:</b> ${now}
✅ <i>Từ nay, mỗi khi nhân viên xin ứng lương hoặc báo nghỉ, thông báo sẽ được tự động gửi ngay vào đây!</i>
━━━━━━━━━━━━━━━━━━`;

  return sendTelegramRaw(botToken, chatId, testMessage);
}

// 6. Thông báo Bàn Giao Tiền Mặt Ca Làm Việc
async function notifyCashHandover({ handover }) {
  const config = getTelegramConfig();
  if (!config.enabled) return;

  const msg = [
    `💰 <b>KYODO FOOD - BÀN GIAO TIỀN CA LÀM</b>`,
    `━━━━━━━━━━━━━━━━━━`,
    `📍 <b>Cơ sở:</b> Trưng Nữ Vương, Đà Nẵng`,
    `👤 <b>Người giao:</b> <b>${handover.giverName}</b> (${handover.giverCode})`,
    `👥 <b>Người nhận:</b> <b>${handover.receiverName}</b>`,
    `⏰ <b>Ca:</b> ${handover.shift} (${formatDateVN(handover.date)} lúc ${handover.time})`,
    `💵 <b>Tổng tiền giao:</b> <code>${new Intl.NumberFormat('vi-VN').format(handover.totalAmount)} đ</code> (${handover.totalBills} tờ)`,
    `✍️ <b>Bằng chữ:</b> <i>${handover.amountInWords}</i>`,
    handover.note ? `📝 <b>Ghi chú:</b> ${handover.note}` : '',
    `━━━━━━━━━━━━━━━━━━`,
  ]
    .filter(Boolean)
    .join('\n');

  return sendNotification(msg);
}

module.exports = {
  getTelegramConfig,
  sendTelegramRaw,
  sendNotification,
  notifySalaryAdvance,
  notifyLeaveRequest,
  notifyAttendance,
  notifyAdminPasswordReset,
  notifyCashHandover,
  testTelegram,
};
