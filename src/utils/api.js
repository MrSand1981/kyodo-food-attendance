// src/utils/api.js

const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Lỗi xử lý yêu cầu từ máy chủ');
    }
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Cài đặt
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await fetch(`${BASE_URL}/settings/upload-logo`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi tải ảnh logo');
    return data;
  },

  // Đăng nhập (Nhân viên: UTNVTNV, BAONVTNV | Admin mật khẩu: 20162020)
  login: ({ username, password }) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }),

  // Nhân viên
  getEmployees: () => request('/employees'),
  addEmployee: (data) => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id, data) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmployee: (id) => request(`/employees/${id}`, { method: 'DELETE' }),

  // Chấm công trực tiếp (Vào ca / Ra ca)
  getActiveShift: (employeeId) => request(`/attendance/active/${employeeId}`),
  checkIn: ({ employeeId, shiftCode, note }) => request('/attendance/check-in', {
    method: 'POST',
    body: JSON.stringify({ employeeId, shiftCode, note })
  }),
  checkOut: ({ employeeId, attendanceId, note }) => request('/attendance/check-out', {
    method: 'POST',
    body: JSON.stringify({ employeeId, attendanceId, note })
  }),

  // Nhân viên tự nhập thời gian làm việc từng ngày
  recordDailyWork: (data) => request('/attendance/daily-entry', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

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
  adjustAttendance: (data) => request('/attendance/adjust', { method: 'POST', body: JSON.stringify(data) }),
  deleteAttendance: (id) => request(`/attendance/${id}`, { method: 'DELETE' }),

  // Link xuất file Excel chuẩn
  getExportExcelUrl: (month) => {
    const query = month ? `?month=${month}` : '';
    return `${BASE_URL}/attendance/export-excel${query}`;
  }
};
