// server/zaloService.js
// Dịch vụ gửi thông báo tự động qua Zalo (Hỗ trợ Zalo Webhook & Zalo Official Account OpenAPI)
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

function getZaloConfig() {
  const settings = db.getSettings();
  return (
    settings.zalo || {
      enabled: false,
      mode: 'webhook', // 'webhook' | 'oa'
      webhookUrl: '',
      oaAccessToken: '',
      oaUserId: '',
      notifyAdvance: true,
      notifyLeave: true,
      notifyAttendance: false,
    }
  );
}

// 1. Gửi qua Zalo Webhook (Tương thích Make, Pancake, Botcake, n8n, Zapier hoặc Custom Bridge)
async function sendViaWebhook(webhookUrl, payload) {
  const response = await fetch(webhookUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Zalo Webhook phản hồi lỗi (${response.status}): ${errorText.slice(0, 150)}`);
  }
  return { success: true };
}

// 2. Gửi qua Zalo Official Account (OA) OpenAPI v3.0
async function sendViaZaloOA(accessToken, userId, messageText) {
  const url = 'https://openapi.zalo.me/v3.0/oa/message/cs';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      access_token: accessToken.trim(),
    },
    body: JSON.stringify({
      recipient: {
        user_id: String(userId).trim(),
      },
      message: {
        text: messageText,
      },
    }),
  });

  const data = await response.json();
  if (data.error && data.error !== 0) {
    throw new Error(`Zalo OA API lỗi (${data.error}): ${data.message || 'Gửi tin nhắn thất bại'}`);
  }
  return data;
}

// Bộ phân phối tin nhắn Zalo chính
async function sendZaloNotification(messageText, rawData = {}) {
  try {
    const config = getZaloConfig();
    if (!config.enabled) return { sent: false, reason: 'Zalo disabled' };

    if (config.mode === 'webhook' && config.webhookUrl) {
      await sendViaWebhook(config.webhookUrl, {
        app: 'Kyodo Food Attendance',
        store: 'Trưng Nữ Vương, Đà Nẵng',
        message: messageText,
        ...rawData,
        timestamp: new Date().toISOString(),
      });
      return { sent: true, mode: 'webhook' };
    }

    if (config.mode === 'oa' && config.oaAccessToken && config.oaUserId) {
      await sendViaZaloOA(config.oaAccessToken, config.oaUserId, messageText);
      return { sent: true, mode: 'oa' };
    }

    return { sent: false, reason: 'Zalo unconfigured' };
  } catch (err) {
    console.error('⚠️ [Zalo] Lỗi gửi thông báo:', err.message);
    return { sent: false, error: err.message };
  }
}

// 1. Thông báo Ứng Lương qua Zalo
async function notifySalaryAdvance({ employee, amount, date, reason }) {
  const config = getZaloConfig();
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

  const text = `[KYODO FOOD] YÊU CẦU ỨNG LƯƠNG MỚI!
------------------------------
Cơ sở: Trưng Nữ Vương, Đà Nẵng
Nhân viên: ${empName} (${empCode})
Số tiền ứng: ${formattedAmount} đ
Ngày ứng: ${formatDateVN(date)}
Lý do: ${reason || 'Chi tiêu cá nhân'}
Thời gian: ${now}
------------------------------
Quản lý vui lòng đăng nhập web để đối chiếu và duyệt chi.`;

  return sendZaloNotification(text, {
    event: 'SALARY_ADVANCE',
    employee: { name: empName, code: empCode },
    amount,
    date: formatDateVN(date),
    reason,
  });
}

// 2. Thông báo Xin Nghỉ Làm qua Zalo
async function notifyLeaveRequest({ employee, date, endDate, shift, reason }) {
  const config = getZaloConfig();
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
      ? `${formatDateVN(date)} đến ${formatDateVN(endDate)}`
      : formatDateVN(date);

  const text = `[KYODO FOOD] THÔNG BÁO XIN NGHỈ LÀM!
------------------------------
Cơ sở: Trưng Nữ Vương, Đà Nẵng
Nhân viên: ${empName} (${empCode})
Ngày xin nghỉ: ${dateRange}
Ca xin nghỉ: ${shift || 'Cả ngày'}
Lý do: ${reason || 'Việc cá nhân'}
Thời gian: ${now}
------------------------------
Quản lý vui lòng kiểm tra lịch ca và sắp xếp nhân sự thay thế.`;

  return sendZaloNotification(text, {
    event: 'LEAVE_REQUEST',
    employee: { name: empName, code: empCode },
    date: dateRange,
    shift,
    reason,
  });
}

// 3. Thông báo Chấm Công qua Zalo (tùy chọn)
async function notifyAttendance({ employee, date, shiftName, startTime, endTime, hours }) {
  const config = getZaloConfig();
  if (!config.enabled || !config.notifyAttendance) return;

  const empName = employee?.name || employee?.fullName || 'Nhân viên';
  const empCode = employee?.username || employee?.code || '';

  const text = `[KYODO FOOD] CHẤM CÔNG CA LÀM
------------------------------
Cơ sở: Trưng Nữ Vương, Đà Nẵng
Nhân viên: ${empName} (${empCode})
Ngày làm: ${formatDateVN(date)}
Ca làm: ${shiftName || 'Ca làm'} (${startTime} - ${endTime})
Tổng giờ: ${hours} tiếng`;

  return sendZaloNotification(text, {
    event: 'DAILY_ATTENDANCE',
    employee: { name: empName, code: empCode },
    date: formatDateVN(date),
    hours,
  });
}

// 4. Thông báo khôi phục mật khẩu Quản trị viên (Gửi ngoài kênh bảo mật Zalo)
async function notifyAdminPasswordReset({ adminUsername, newPassword, ip }) {
  const config = getZaloConfig();
  if (!config.enabled) {
    return { sent: false, reason: 'Zalo disabled' };
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

  const text = `🔐 YÊU CẦU ĐẶT LẠI MẬT KHẨU QUẢN TRỊ VIÊN
━━━━━━━━━━━━━━━━━━
🏪 Cơ sở: Kyodo Food - Trưng Nữ Vương, Đà Nẵng
👤 Tài khoản: ${adminUsername || 'admin'}
🔑 Mật khẩu mới tạm thời: ${newPassword}
⏰ Thời gian: ${now}
🌐 IP: ${ip || 'Kiosk / Mạng nội bộ'}
━━━━━━━━━━━━━━━━━━
⚠️ Mật khẩu mới đã được cập nhật. Vui lòng đăng nhập ngay và đổi mật khẩu trong mục Cài Đặt!`;

  if (config.mode === 'oa' && config.oaAccessToken && config.oaUserId) {
    return sendViaZaloOA(config.oaAccessToken, config.oaUserId, text);
  } else if (config.webhookUrl) {
    return sendViaWebhook(config.webhookUrl, {
      event: 'admin_password_reset',
      adminUsername,
      newPassword,
      time: now,
      text,
    });
  }
  return { sent: false, reason: 'Zalo configuration incomplete' };
}

// 5. Kiểm tra kết nối Zalo (Test)
async function testZalo(testConfig) {
  const now = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  const testMessage = `[KYODO FOOD] THỬ NGHIỆM KẾT NỐI ZALO THÀNH CÔNG!
------------------------------
Phần mềm: Chấm công & Quản lý Kyodo Food
Cơ sở: Trưng Nữ Vương, Đà Nẵng
Thời gian: ${now}
Hệ thống đã sẵn sàng tự động gửi tin nhắn mỗi khi nhân viên gửi yêu cầu ứng lương hoặc xin nghỉ làm!`;

  if (testConfig.mode === 'webhook') {
    if (!testConfig.webhookUrl) throw new Error('Vui lòng nhập đường dẫn Zalo Webhook URL');
    return sendViaWebhook(testConfig.webhookUrl, {
      event: 'TEST_CONNECTION',
      message: testMessage,
      timestamp: new Date().toISOString(),
    });
  }

  if (testConfig.mode === 'oa') {
    if (!testConfig.oaAccessToken || !testConfig.oaUserId) {
      throw new Error('Vui lòng nhập đầy đủ Zalo OA Access Token và Zalo User ID');
    }
    return sendViaZaloOA(testConfig.oaAccessToken, testConfig.oaUserId, testMessage);
  }

  throw new Error('Vui lòng chọn hình thức kết nối Zalo (Webhook hoặc Zalo OA)');
}

// 6. Thông báo Bàn Giao Tiền Mặt Ca Làm Việc
async function notifyCashHandover({ handover }) {
  const config = getZaloConfig();
  if (!config.enabled) return;

  const text = [
    `💰 KYODO FOOD - BÀN GIAO TIỀN CA LÀM`,
    `📍 Cơ sở: Trưng Nữ Vương, Đà Nẵng`,
    `👤 Người giao: ${handover.giverName} (${handover.giverCode})`,
    `👥 Người nhận: ${handover.receiverName}`,
    `⏰ Ca: ${handover.shift} (${formatDateVN(handover.date)} lúc ${handover.time})`,
    `💵 Tổng tiền giao: ${new Intl.NumberFormat('vi-VN').format(handover.totalAmount)} đ (${handover.totalBills} tờ)`,
    `✍️ Bằng chữ: ${handover.amountInWords}`,
    handover.note ? `📝 Ghi chú: ${handover.note}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return sendZaloNotification(text);
}

module.exports = {
  getZaloConfig,
  sendViaWebhook,
  sendViaZaloOA,
  sendZaloNotification,
  notifySalaryAdvance,
  notifyLeaveRequest,
  notifyAttendance,
  notifyAdminPasswordReset,
  notifyCashHandover,
  testZalo,
};
