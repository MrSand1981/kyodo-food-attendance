// server/zaloService.js
// Dịch vụ gửi thông báo tự động qua Zalo (Hỗ trợ Zalo Webhook & Zalo Official Account OpenAPI)
const db = require('./db');

function getZaloConfig() {
  const settings = db.getSettings();
  return settings.zalo || {
    enabled: false,
    mode: 'webhook', // 'webhook' | 'oa'
    webhookUrl: '',
    oaAccessToken: '',
    oaUserId: '',
    notifyAdvance: true,
    notifyLeave: true,
    notifyAttendance: false
  };
}

// 1. Gửi qua Zalo Webhook (Tương thích Make, Pancake, Botcake, n8n, Zapier hoặc Custom Bridge)
async function sendViaWebhook(webhookUrl, payload) {
  const response = await fetch(webhookUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
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
      'access_token': accessToken.trim()
    },
    body: JSON.stringify({
      recipient: {
        user_id: String(userId).trim()
      },
      message: {
        text: messageText
      }
    })
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
        timestamp: new Date().toISOString()
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
    year: 'numeric'
  }).format(new Date());

  const empName = employee?.name || employee?.fullName || 'Nhân viên';
  const empCode = employee?.username || employee?.code || '';
  const formattedAmount = Number(amount || 0).toLocaleString('vi-VN');

  const text = 
`[KYODO FOOD] YÊU CẦU ỨNG LƯƠNG MỚI!
------------------------------
Cơ sở: Trưng Nữ Vương, Đà Nẵng
Nhân viên: ${empName} (${empCode})
Số tiền ứng: ${formattedAmount} đ
Ngày ứng: ${date}
Lý do: ${reason || 'Chi tiêu cá nhân'}
Thời gian: ${now}
------------------------------
Quản lý vui lòng đăng nhập web để đối chiếu và duyệt chi.`;

  return sendZaloNotification(text, {
    event: 'SALARY_ADVANCE',
    employee: { name: empName, code: empCode },
    amount,
    date,
    reason
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
    year: 'numeric'
  }).format(new Date());

  const empName = employee?.name || employee?.fullName || 'Nhân viên';
  const empCode = employee?.username || employee?.code || '';
  const dateRange = endDate && endDate !== date ? `${date} đến ${endDate}` : date;

  const text = 
`[KYODO FOOD] THÔNG BÁO XIN NGHỈ LÀM!
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
    reason
  });
}

// 3. Thông báo Chấm Công qua Zalo (tùy chọn)
async function notifyAttendance({ employee, date, shiftName, startTime, endTime, hours }) {
  const config = getZaloConfig();
  if (!config.enabled || !config.notifyAttendance) return;

  const empName = employee?.name || employee?.fullName || 'Nhân viên';
  const empCode = employee?.username || employee?.code || '';

  const text = 
`[KYODO FOOD] CHẤM CÔNG CA LÀM
------------------------------
Cơ sở: Trưng Nữ Vương, Đà Nẵng
Nhân viên: ${empName} (${empCode})
Ngày làm: ${date}
Ca làm: ${shiftName || 'Ca làm'} (${startTime} - ${endTime})
Tổng giờ: ${hours} tiếng`;

  return sendZaloNotification(text, {
    event: 'DAILY_ATTENDANCE',
    employee: { name: empName, code: empCode },
    date,
    hours
  });
}

// 4. Kiểm tra kết nối Zalo (Test)
async function testZalo(testConfig) {
  const now = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(new Date());

  const testMessage = 
`[KYODO FOOD] THỬ NGHIỆM KẾT NỐI ZALO THÀNH CÔNG!
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
      timestamp: new Date().toISOString()
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

module.exports = {
  getZaloConfig,
  sendViaWebhook,
  sendViaZaloOA,
  sendZaloNotification,
  notifySalaryAdvance,
  notifyLeaveRequest,
  notifyAttendance,
  testZalo
};
