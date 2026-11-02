// server/telegramService.js
// Dịch vụ gửi thông báo tự động qua Telegram Bot cho Quản lý Kyodo Food
const db = require('./db');

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
📅 <b>Ngày ứng:</b> ${date}
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
  const dateRange = endDate && endDate !== date ? `${date} ➔ ${endDate}` : date;

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
📅 <b>Ngày làm:</b> ${date}
⏰ <b>Khung giờ:</b> ${startTime} - ${endTime} (${shiftName || 'Ca làm'})
⏱️ <b>Tổng giờ làm:</b> <b>${hours} tiếng</b>
━━━━━━━━━━━━━━━━━━`;

  return sendNotification(text);
}

// 4. Kiểm tra kết nối Telegram Bot (gửi tin nhắn test)
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

module.exports = {
  getTelegramConfig,
  sendTelegramRaw,
  sendNotification,
  notifySalaryAdvance,
  notifyLeaveRequest,
  notifyAttendance,
  testTelegram,
};
