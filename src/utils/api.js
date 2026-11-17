// src/utils/api.js

const BASE_URL = '/api';

function parseSafeJson(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function getStorage() {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

function getStoredToken() {
  try {
    return getStorage()?.getItem('kyodo_token') || null;
  } catch {
    return null;
  }
}

function setStoredToken(token) {
  if (!token) return;
  try {
    getStorage()?.setItem('kyodo_token', token);
  } catch {
    // Bỏ qua nếu môi trường chặn lưu storage
  }
}

function clearStoredToken() {
  try {
    getStorage()?.removeItem('kyodo_token');
  } catch {
    // Bỏ qua nếu môi trường chặn truy cập storage
  }
}

async function request(endpoint, options = {}, retries = 2) {
  const url = `${BASE_URL}${endpoint}`;
  const { retries: customRetries, headers: optionHeaders, ...fetchOptions } = options;
  const method = String(fetchOptions.method || 'GET').toUpperCase();
  // Chỉ tự thử lại khi là GET (hoặc cấu hình tường minh), tuyệt đối không retry POST/lỗi 4xx tránh nhân 3 số lần đăng nhập sai
  const maxRetries =
    typeof customRetries === 'number' ? Math.max(0, customRetries) : method === 'GET' ? retries : 0;

  const token = getStoredToken();
  const config = {
    credentials: 'include',
    ...fetchOptions,
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...optionHeaders,
    },
  };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, config);
      const rawText = typeof response.text === 'function' ? await response.text() : '';
      const data = rawText ? parseSafeJson(rawText) : await response.json();

      if (!response.ok) {
        // Nếu token hết hạn hoặc không hợp lệ, xóa token để người dùng đăng nhập lại
        if (response.status === 401) {
          clearStoredToken();
        }
        const err = new Error(data.message || 'Lỗi xử lý yêu cầu từ máy chủ');
        err.status = response.status;
        if (response.status >= 400 && response.status < 500) {
          err.noRetry = true;
        }
        throw err;
      }
      return data;
    } catch (error) {
      if (error?.noRetry || attempt >= maxRetries) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
      }
      // Đợi ngắn rồi thử lại với lỗi mạng tạm thời hoặc 5xx trên GET
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
}

export const api = {
  // Cài đặt
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    const token = getStoredToken();
    const res = await fetch(`${BASE_URL}/settings/upload-logo`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi tải ảnh logo');
    return data;
  },

  // Đăng nhập (Nhân viên: UTNVTNV, BAONVTNV | Admin: Mật khẩu quản trị)
  login: async ({ username, password }) => {
    const res = await request('/auth/login', {
      method: 'POST',
      retries: 0,
      body: JSON.stringify({ username, password }),
    });
    if (res.success && res.token) {
      setStoredToken(res.token);
    }
    return res;
  },
  logout: async () => {
    clearStoredToken();
    try {
      await fetch(`${BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (_) {}
  },

  // Quản lý tài khoản Admin & Khôi phục mật khẩu
  getAdminProfileStatus: () => request('/admin/profile-status'),
  updateAdminProfile: (data) =>
    request('/admin/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  changeAdminPassword: (data) =>
    request('/admin/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  forgotAdminPassword: (identifier) =>
    request('/admin/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    }),

  // Nhân viên (Server tự động phân quyền theo Token)
  getEmployees: () => request('/employees'),
  getEmployee: (id) => request(`/employees/${encodeURIComponent(id)}`),
  addEmployee: (data) => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id, data) =>
    request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmployee: (id) => request(`/employees/${id}`, { method: 'DELETE' }),
  resetEmployeePassword: (id, password = '1234') =>
    request(`/employees/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  // Cập nhật Avatar cá nhân
  updateAvatar: ({ employeeId, avatar }) =>
    request('/employees/avatar', {
      method: 'POST',
      body: JSON.stringify({ employeeId, avatar }),
    }),

  // Ứng tiền lương trước (Salary Advances)
  getSalaryAdvances: (employeeId = '', month = '') => {
    const params = new URLSearchParams();
    if (employeeId) params.append('employeeId', employeeId);
    if (month) params.append('month', month);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/advances${qs}`);
  },
  requestSalaryAdvance: ({ employeeId, date, amount, reason }) =>
    request('/advances', {
      method: 'POST',
      body: JSON.stringify({ employeeId, date, amount, reason }),
    }),
  updateSalaryAdvance: (id, { amount, date, reason }) =>
    request(`/advances/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ amount, date, reason }),
    }),
  deleteSalaryAdvance: (id) => request(`/advances/${id}`, { method: 'DELETE' }),

  // Xin ngày nghỉ (Leave Requests)
  getLeaveRequests: (employeeId = '', month = '') => {
    const params = new URLSearchParams();
    if (employeeId) params.append('employeeId', employeeId);
    if (month) params.append('month', month);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/leaves${qs}`);
  },
  requestLeave: ({ employeeId, date, endDate, shift, reason }) =>
    request('/leaves', {
      method: 'POST',
      body: JSON.stringify({ employeeId, date, endDate, shift, reason }),
    }),
  deleteLeaveRequest: (id) => request(`/leaves/${id}`, { method: 'DELETE' }),

  // Chấm công trực tiếp (Vào ca / Ra ca)
  getActiveShift: (employeeId) => request(`/attendance/active/${employeeId}`),
  checkIn: ({ employeeId, shiftCode, note }) =>
    request('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({ employeeId, shiftCode, note }),
    }),
  checkOut: ({ employeeId, attendanceId, note }) =>
    request('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify({ employeeId, attendanceId, note }),
    }),

  // Nhân viên tự nhập thời gian làm việc từng ngày
  recordDailyWork: (data) =>
    request('/attendance/daily-entry', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Quản lý Chấm công bù (Makeup Attendance)
  getMakeupRequests: (employeeId = '', month = '') => {
    const params = new URLSearchParams();
    if (employeeId) params.append('employeeId', employeeId);
    if (month) params.append('month', month);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/attendance/makeup-requests${qs}`);
  },
  approveMakeupAttendance: (id) =>
    request(`/attendance/makeup-requests/${id}/approve`, { method: 'POST' }),
  rejectMakeupAttendance: (id, reason = '') =>
    request(`/attendance/makeup-requests/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  resetMakeupAttendance: (id) =>
    request(`/attendance/makeup-requests/${id}/reset`, { method: 'POST' }),
  deleteMakeupAttendance: (id) =>
    request(`/attendance/makeup-requests/${id}`, { method: 'DELETE' }),

  // Tổng kết cho nhân viên (cuối tháng nhận kết quả tổng số giờ làm việc)
  getMySummary: (employeeId, month) => {
    const query = month ? `?month=${month}` : '';
    return request(`/attendance/my-summary/${employeeId}${query}`);
  },

  // Bảng tổng hợp toàn cửa hàng Trưng Nữ Vương (Admin)
  getMasterReport: (month) => {
    const query = month ? `?month=${month}` : '';
    return request(`/attendance/master-report${query}`);
  },

  // Điều chỉnh bản ghi chấm công (Admin)
  adjustAttendance: (data) =>
    request('/attendance/adjust', { method: 'POST', body: JSON.stringify(data) }),
  deleteAttendance: (id) => request(`/attendance/${id}`, { method: 'DELETE' }),

  // Nhân viên tự đổi mật khẩu riêng biệt
  changePassword: async ({ employeeId, oldPassword, newPassword }) => {
    const res = await request('/employees/change-password', {
      method: 'POST',
      body: JSON.stringify({ employeeId, oldPassword, newPassword }),
    });
    if (res.success && res.token) {
      setStoredToken(res.token);
    }
    return res;
  },

  // Xuất file Excel bằng fetch kèm Authorization header (không gắn JWT lên URL)
  exportAttendanceExcel: async (month) => {
    const query = month ? `?month=${encodeURIComponent(month)}` : '';
    const token = getStoredToken();
    const response = await fetch(`${BASE_URL}/attendance/export-excel${query}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearStoredToken();
      }
      const rawText = typeof response.text === 'function' ? await response.text() : '';
      const errData = parseSafeJson(rawText);
      const err = new Error(errData?.message || 'Không thể xuất file Excel chấm công!');
      err.status = response.status;
      throw err;
    }

    const blob = await response.blob();
    const disposition =
      typeof response.headers?.get === 'function'
        ? response.headers.get('Content-Disposition') || ''
        : '';
    const filenameMatch = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
    const filename =
      (filenameMatch && decodeURIComponent(filenameMatch[1])) ||
      `Bang_Cham_Cong_Kyodo_Trung_Nu_Vuong_${month || 'hien_tai'}.xlsx`;
    return { blob, filename };
  },

  // Bàn giao tiền mặt ca làm việc (Cash Handovers)
  getCashHandovers: (employeeId = '', month = '') => {
    const params = new URLSearchParams();
    if (employeeId) params.append('employeeId', employeeId);
    if (month) params.append('month', month);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/cash-handovers${qs}`);
  },
  createCashHandover: (data) =>
    request('/cash-handovers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteCashHandover: (id) =>
    request(`/cash-handovers/${id}`, {
      method: 'DELETE',
    }),

  // Quản lý Ngày Lễ (Lương x2)
  getHolidays: (year) => request(year ? `/holidays?year=${year}` : '/holidays'),
  addHoliday: (data) =>
    request('/holidays', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateHoliday: (id, data) =>
    request(`/holidays/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteHoliday: (id) =>
    request(`/holidays/${id}`, {
      method: 'DELETE',
    }),

  // Cập nhật phần mềm từ GitHub
  checkUpdate: () => request('/system/check-update'),
  applyUpdate: () => request('/system/apply-update', { method: 'POST' }),

  // Đẩy bản cập nhật mới lên GitHub (Dành cho Chủ cửa hàng)
  getGitStatus: () => request('/system/git-status'),
  pushToGitHub: (message) =>
    request('/system/git-push', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  // Cấu hình đồng bộ Cloud (Đà Nẵng - Nghệ An)
  getCloudConfig: () => request('/system/cloud-config'),
  updateCloudConfig: (data) =>
    request('/system/cloud-config', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Cấu hình thông báo Telegram tức thì (Nghệ An - Đà Nẵng)
  getTelegramConfig: () => request('/system/telegram-config'),
  updateTelegramConfig: (data) =>
    request('/system/telegram-config', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  testTelegram: (data) =>
    request('/system/telegram-test', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Cấu hình thông báo Zalo tức thì (Nghệ An - Đà Nẵng)
  getZaloConfig: () => request('/system/zalo-config'),
  updateZaloConfig: (data) =>
    request('/system/zalo-config', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  testZalo: (data) =>
    request('/system/zalo-test', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
