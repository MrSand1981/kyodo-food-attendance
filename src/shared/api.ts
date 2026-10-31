// src/shared/api.ts
// React Query hooks + Axios client

import axios, { AxiosError, InternalAxiosRequestConfig } from '\''axios'\'';
import { QueryClient } from '\''@tanstack/react-query'\'';
import type {
  LoginCredentials,
  AuthResult,
  Employee,
  EmployeePublic,
  AttendanceRecord,
  SalaryAdvance,
  LeaveRequest,
  MonthlySummary,
  MasterMonthlyReport,
  EmployeeFormData,
  DailyWorkEntryData,
  SalaryAdvanceData,
  LeaveRequestData,
  AdminProfileData,
  LoginInput,
  ChangePasswordInput,
  AdminChangePasswordInput,
  ForgotPasswordInput,
  EmployeeCreateInput,
  EmployeeUpdateInput,
  CheckInInput,
  CheckOutInput,
  DailyEntryInput,
  SalaryAdvanceCreateInput,
  SalaryAdvanceUpdateInput,
  LeaveRequestCreateInput,
  LeaveRequestUpdateInput,
  AdminProfileInput,
  MonthQuery,
  EmployeeIdQuery,
  AdvanceQuery,
  LeaveQuery,
  ApiResponse
} from '\''./types'\'';

// ============ AXIOS INSTANCE ============
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Request interceptor - add auth token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer \${token}`;
  }
  return config;
});

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const res = await axios.post('/api/auth/refresh', {}, {
            headers: { Authorization: `Bearer \${refreshToken}` },
            withCredentials: true
          });
          
          if (res.data.accessToken) {
            localStorage.setItem('accessToken', res.data.accessToken);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer \${res.data.accessToken}`;
            }
            return api(originalRequest);
          }
        }
      } catch {
        // Refresh failed - redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

// ============ QUERY CLIENT ============
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});

// ============ API ERROR HANDLER ============
function handleApiError(error: AxiosError): never {
  if (error.response?.data) {
    const data = error.response.data as { message?: string; errors?: unknown[] };
    throw new Error(data.message || 'Lỗi từ máy chủ');
  }
  throw new Error(error.message || 'Lỗi kết nối');
}

// ============ AUTH API ============
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResult> => {
    try {
      const res = await api.post<ApiResponse<AuthResult>>('/auth/login', credentials);
      if (res.data.tokens) {
        localStorage.setItem('accessToken', res.data.tokens.accessToken);
        localStorage.setItem('refreshToken', res.data.tokens.refreshToken);
      }
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  refresh: async (): Promise<string> => {
    try {
      const res = await api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
      if (res.data.accessToken) {
        localStorage.setItem('accessToken', res.data.accessToken);
      }
      return res.data.accessToken!;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  me: async (): Promise<AuthResult['user']> => {
    try {
      const res = await api.get<ApiResponse<AuthResult['user']>>('/auth/me');
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  changePassword: async (data: ChangePasswordInput): Promise<ApiResponse> => {
    try {
      const res = await api.post<ApiResponse>('/auth/change-password', data);
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  adminChangePassword: async (data: AdminChangePasswordInput): Promise<ApiResponse> => {
    try {
      const res = await api.post<ApiResponse>('/auth/admin/change-password', data);
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  forgotPassword: async (data: ForgotPasswordInput): Promise<ApiResponse> => {
    try {
      const res = await api.post<ApiResponse>('/auth/admin/forgot-password', data);
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  }
};

// ============ EMPLOYEES API ============
export const employeesApi = {
  getAll: async (isAdmin = false): Promise<EmployeePublic[]> => {
    try {
      const headers = isAdmin ? { 'x-admin-key': '20162020' } : {};
      const res = await api.get<ApiResponse<{ employees: EmployeePublic[] }>>('/employees', { headers });
      return res.data.employees || [];
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  getById: async (id: string): Promise<Employee> => {
    try {
      const res = await api.get<ApiResponse<Employee>>(`/employees/\${id}`);
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  create: async (data: EmployeeCreateInput): Promise<{ employee: Employee; message: string }> => {
    try {
      const res = await api.post<ApiResponse<{ employee: Employee; message: string }>>('/employees', data);
      return { employee: res.data.employee!, message: res.data.message! };
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  update: async (id: string, data: EmployeeUpdateInput): Promise<Employee> => {
    try {
      const res = await api.put<ApiResponse<Employee>>(`/employees/\${id}`, data);
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  updateAvatar: async (employeeId: string, avatar: string): Promise<ApiResponse> => {
    try {
      const res = await api.post<ApiResponse>('/employees/avatar', { employeeId, avatar });
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  delete: async (id: string): Promise<ApiResponse> => {
    try {
      const res = await api.delete<ApiResponse>(`/employees/\${id}`);
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  getAdminProfileStatus: async (): Promise<ApiResponse> => {
    try {
      const res = await api.get<ApiResponse>('/employees/admin/profile-status');
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  updateAdminProfile: async (data: AdminProfileInput): Promise<ApiResponse> => {
    try {
      const res = await api.post<ApiResponse>('/employees/admin/profile', data);
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  forgotPassword: async (identifier: string): Promise<ApiResponse> => {
    try {
      const res = await api.post<ApiResponse>('/employees/admin/forgot-password', { identifier });
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  }
};

// ============ ATTENDANCE API ============
export const attendanceApi = {
  getAll: async (filters?: Record<string, string>): Promise<AttendanceRecord[]> => {
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get<ApiResponse<{ records: AttendanceRecord[] }>>(`/attendance?\${params}`);
      return res.data.records || [];
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  getActiveShift: async (employeeId: string): Promise<AttendanceRecord | null> => {
    try {
      const res = await api.get<ApiResponse<{ activeShift: AttendanceRecord | null }>>(`/attendance/active/\${employeeId}`);
      return res.data.activeShift;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  checkIn: async (data: CheckInInput): Promise<{ record: AttendanceRecord; message: string }> => {
    try {
      const res = await api.post<ApiResponse<{ record: AttendanceRecord; message: string }>>('/attendance/check-in', data);
      return { record: res.data.record!, message: res.data.message! };
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  checkOut: async (data: CheckOutInput): Promise<{ record: AttendanceRecord; message: string }> => {
    try {
      const res = await api.post<ApiResponse<{ record: AttendanceRecord; message: string }>>('/attendance/check-out', data);
      return { record: res.data.record!, message: res.data.message! };
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  dailyEntry: async (data: DailyEntryInput): Promise<{ record: AttendanceRecord; message: string }> => {
    try {
      const res = await api.post<ApiResponse<{ record: AttendanceRecord; message: string }>>('/attendance/daily-entry', data);
      return { record: res.data.record!, message: res.data.message! };
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  adjust: async (id: string, data: Partial<AttendanceRecord>): Promise<AttendanceRecord> => {
    try {
      const res = await api.post<ApiResponse<AttendanceRecord>>('/attendance/adjust', { id, ...data });
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  delete: async (id: string): Promise<ApiResponse> => {
    try {
      const res = await api.delete<ApiResponse>(`/attendance/\${id}`);
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  }
};

// ============ SALARY ADVANCES API ============
export const advancesApi = {
  getAll: async (params?: AdvanceQuery): Promise<{ records: SalaryAdvance[]; totalCount: number; totalAmount: number }> => {
    try {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      const res = await api.get<ApiResponse<{ records: SalaryAdvance[]; totalCount: number; totalAmount: number }>>(`/advances?\${query}`);
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  create: async (data: SalaryAdvanceCreateInput): Promise<{ record: SalaryAdvance; message: string }> => {
    try {
      const res = await api.post<ApiResponse<{ record: SalaryAdvance; message: string }>>('/advances', data);
      return { record: res.data.record!, message: res.data.message! };
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  update: async (id: string, data: SalaryAdvanceUpdateInput): Promise<SalaryAdvance> => {
    try {
      const res = await api.put<ApiResponse<SalaryAdvance>>(`/advances/\${id}`, data);
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  delete: async (id: string): Promise<ApiResponse> => {
    try {
      const res = await api.delete<ApiResponse>(`/advances/\${id}`);
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  }
};

// ============ LEAVES API ============
export const leavesApi = {
  getAll: async (params?: LeaveQuery): Promise<LeaveRequest[]> => {
    try {
      const query = new URLSearchParams(params as Record<string, string>).toString();
      const res = await api.get<ApiResponse<{ records: LeaveRequest[] }>>(`/leaves?\${query}`);
      return res.data.records || [];
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  create: async (data: LeaveRequestCreateInput): Promise<{ record: LeaveRequest; message: string }> => {
    try {
      const res = await api.post<ApiResponse<{ record: LeaveRequest; message: string }>>('/leaves', data);
      return { record: res.data.record!, message: res.data.message! };
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  delete: async (id: string): Promise<ApiResponse> => {
    try {
      const res = await api.delete<ApiResponse>(`/leaves/\${id}`);
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  }
};

// ============ REPORTS API ============
export const reportsApi = {
  getMySummary: async (employeeId: string, month?: string, includeSalary = false): Promise<MonthlySummary> => {
    try {
      const query = new URLSearchParams({ ...(month && { month }), includeSalary: String(includeSalary) }).toString();
      const res = await api.get<ApiResponse<{ data: MonthlySummary }>>(`/attendance/my-summary/\${employeeId}?\${query}`);
      return res.data.data!;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  getMasterReport: async (month?: string): Promise<MasterMonthlyReport> => {
    try {
      const query = month ? `?month=\${month}` : '';
      const res = await api.get<ApiResponse<{ report: MasterMonthlyReport }>>(`/attendance/master-report\${query}`);
      return res.data.report!;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  exportExcel: async (month?: string): Promise<Blob> => {
    try {
      const query = month ? `?month=\${month}` : '';
      const res = await api.get(`/attendance/export-excel\${query}`, { responseType: 'blob' });
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  }
};

// ============ SYSTEM API ============
export const systemApi = {
  getSettings: async (): Promise<{ settings: unknown; shifts: unknown }> => {
    try {
      const res = await api.get<ApiResponse<{ settings: unknown; shifts: unknown }>>('/settings');
      return { settings: res.data.settings!, shifts: res.data.shifts! };
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  updateSettings: async (data: Record<string, unknown>): Promise<ApiResponse> => {
    try {
      const res = await api.put<ApiResponse>('/settings', data);
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  uploadLogo: async (file: File): Promise<{ logoUrl: string }> => {
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await api.post<ApiResponse<{ logoUrl: string }>>('/settings/upload-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return { logoUrl: res.data.logoUrl! };
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  checkUpdate: async (repo?: string): Promise<ApiResponse> => {
    try {
      const query = repo ? `?repo=\${encodeURIComponent(repo)}` : '';
      const res = await api.get<ApiResponse>(`/system/check-update\${query}`);
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  applyUpdate: async (repo?: string): Promise<ApiResponse> => {
    try {
      const res = await api.post<ApiResponse>('/system/apply-update', { repo });
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  getGitStatus: async (): Promise<ApiResponse> => {
    try {
      const res = await api.get<ApiResponse>('/system/git-status');
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  },

  pushToGitHub: async (message?: string): Promise<ApiResponse> => {
    try {
      const res = await api.post<ApiResponse>('/system/git-push', { message });
      return res.data;
    } catch (error) {
      handleApiError(error as AxiosError);
    }
  }
};

// ============ EXPORT ALL ============
export const api = {
  auth: authApi,
  employees: employeesApi,
  attendance: attendanceApi,
  advances: advancesApi,
  leaves: leavesApi,
  reports: reportsApi,
  system: systemApi
};

export default api;
