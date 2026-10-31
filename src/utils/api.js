// src/utils/api.js

const BASE_URL = '/api';

async function request(endpoint, options = {}, retries = 2) {
  const url = `${BASE_URL}${endpoint}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('kyodo_token') : null;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    },
    ...options
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, config);
      const data = await response.json();
      if (!response.ok) {
        // Nếu token hết hạn hoặc không hợp lệ, xóa token để người dùng đăng nhập lại
        if (response.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('kyodo_token');
        }
        throw new Error(data.message || 'Lỗi xử lý yêu cầu từ máy chủ');
      }
      return data;
    } catch (error) {
      if (attempt === retries) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
      }
      // Đợi ngắn rồi thử lại (rất hữu ích khi mạng chập chờn hoặc máy chủ Cloud đang nạp)
      await new Promise(r => setTimeout(r, 600 * (attempt + 1)));
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('kyodo_token') : null;
    const res = await fetch(`${BASE_URL}/settings/upload-logo`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Lỗi tải ảnh logo');
    return data;
  },

  // Đăng nhập (Nhân viên: UTNVTNV, BAONVTNV | Admin: Mật khẩu quản trị)
  login: async ({ username, password }) => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    if (res.success && res.token && typeof window !== 'undefined') {
      localStorage.setItem('kyodo_token', res.token);
    }
    return res;
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kyodo_token');
    }
  },

  // Quản lý tài khoản Admin & Khôi phục mật khẩu
  getAdminProfileStatus: () => request('/admin/profile-status'),
  updateAdminProfile: (data) => request('/admin/profile', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  changeAdminPassword: (data) => request('/admin/change-password', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  forgotAdminPassword: (identifier) => request('/admin/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ identifier })
  }),

  // Nhân viên (Server tự động phân quyền theo Token)
  getEmployees: () => request('/employees'),
  addEmployee: (data) => request('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id, data) => request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmployee: (id) => request(`/employees/${id}`, { method: 'DELETE' }),
  resetEmployeePassword: (id, password = '1234') => request(`/employees/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ password })
  }),

  // Cập nhật Avatar cá nhân
  updateAvatar: ({ employeeId, avatar }) => request('/employees/avatar', {
    method: 'POST',
    body: JSON.stringify({ employeeId, avatar })
  }),

  // Ứng tiền lương trước (Salary Advances)
  getSalaryAdvances: (employeeId = '', month = '') => {
    const params = new URLSearchParams();
    if (employeeId) params.append('employeeId', employeeId);
    if (month) params.append('month', month);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request(`/advances${qs}`);
  },
  requestSalaryAdvance: ({ employeeId, date, amount, reason }) => request('/advances', {
    method: 'POST',
    body: JSON.stringify({ employeeId, date, amount, reason })
  }),
  updateSalaryAdvance: (id, { amount, date, reason }) => request(`/advances/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ amount, date, reason })
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
  requestLeave: ({ employeeId, date, endDate, shift, reason }) => request('/leaves', {
    method: 'POST',
    body: JSON.stringify({ employeeId, date, endDate, shift, reason })
  }),
  deleteLeaveRequest: (id) => request(`/leaves/${id}`, { method: 'DELETE' }),

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

  // Nhân viên tự đổi mật khẩu riêng biệt
  changePassword: ({ employeeId, oldPassword, newPassword }) => request('/employees/change-password', {
    method: 'POST',
    body: JSON.stringify({ employeeId, oldPassword, newPassword })
  }),

  // Link xuất file Excel chuẩn
  getExportExcelUrl: (month) => {
    const query = month ? `?month=${month}` : '';
    const token = typeof window !== 'undefined' ? localStorage.getItem('kyodo_token') : '';
    const tokenParam = token ? `${query ? '&' : '?'}token=${encodeURIComponent(token)}` : '';
    return `${BASE_URL}/attendance/export-excel${query}${tokenParam}`;
  },

  // Quản lý Ngày Lễ (Lương x2)
  getHolidays: (year) => request(year ? `/holidays?year=${year}` : '/holidays'),
  addHoliday: (data) => request('/holidays', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateHoliday: (id, data) => request(`/holidays/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteHoliday: (id) => request(`/holidays/${id}`, {
    method: 'DELETE'
  }),

  // Cập nhật phần mềm từ GitHub
  checkUpdate: () => request('/system/check-update'),
  applyUpdate: () => request('/system/apply-update', { method: 'POST' }),

  // Đẩy bản cập nhật mới lên GitHub (Dành cho Chủ cửa hàng)
  getGitStatus: () => request('/system/git-status'),
  pushToGitHub: (message) => request('/system/git-push', {
    method: 'POST',
    body: JSON.stringify({ message })
  }),

  // Cấu hình đồng bộ Cloud (Đà Nẵng - Nghệ An)
  getCloudConfig: () => request('/system/cloud-config'),
  updateCloudConfig: (data) => request('/system/cloud-config', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};
