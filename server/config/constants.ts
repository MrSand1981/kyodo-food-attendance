// server/config/constants.ts
// Centralized constants for the application

export const APP_CONSTANTS = {
  // App Info
  APP_NAME: 'Kyodo Food',
  BRANCH_NAME: 'Trưng Nữ Vương',
  VERSION: '1.4.9',
  
  // Default Values
  DEFAULT_HOURLY_RATE: 25000,
  DEFAULT_PASSWORD: '1234',
  DEFAULT_ADMIN_PASSWORD: '20162020',
  DEFAULT_ADMIN_USERNAME: 'admin',
  
  // Pagination
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  
  // File Paths
  DB_FILE: 'data/database.json',
  VAULT_FILE: 'data/kyodo_employee_vault.json',
  BACKUP_DIR: 'data/backups',
  MAX_BACKUPS: 30,
  
  // Security
  BCRYPT_SALT_ROUNDS: 12,
  JWT_EXPIRES_IN: '7d',
  JWT_REFRESH_EXPIRES_IN: '30d',
  RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 10,
  LOGIN_RATE_LIMIT_MAX: 5,
  
  // Business Rules
  SALARY_PAYMENT_DAY: 5, // Ngày 5 hàng tháng
  MIN_SHIFT_HOURS: 0.5,
  MAX_SHIFT_HOURS: 24,
  MIN_ADVANCE_AMOUNT: 1000,
  MAX_ADVANCE_AMOUNT: 100000000,
  
  // Shift Codes
  SHIFT_CODES: ['SANG', 'CHIEU', 'TOI', 'CA1', 'CA2', 'CA3', 'MANUAL'] as const,
  SHIFT_NAMES: {
    SANG: 'Ca Sáng',
    CHIEU: 'Ca Chiều', 
    TOI: 'Ca Tối',
    CA1: 'Ca 1',
    CA2: 'Ca 2',
    CA3: 'Ca 3',
    MANUAL: 'Khai báo thủ công'
  } as const,
  
  // Status Values
  ATTENDANCE_STATUS: ['working', 'completed', 'cancelled'] as const,
  ADVANCE_STATUS: ['approved', 'pending', 'rejected'] as const,
  LEAVE_STATUS: ['approved', 'pending', 'rejected'] as const,
  EMPLOYEE_ROLES: ['Nhân viên', 'Quản lý', 'Admin'] as const,
  GENDERS: ['Nam', 'Nữ'] as const,
  
  // File Upload
  MAX_LOGO_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_LOGO_TYPES: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'],
  
  // Cache
  UPDATE_CHECK_INTERVAL_MS: 60 * 1000, // 1 minute
} as const;

// Type exports
export type ShiftCode = typeof APP_CONSTANTS.SHIFT_CODES[number];
export type AttendanceStatus = typeof APP_CONSTANTS.ATTENDANCE_STATUS[number];
export type AdvanceStatus = typeof APP_CONSTANTS.ADVANCE_STATUS[number];
export type LeaveStatus = typeof APP_CONSTANTS.LEAVE_STATUS[number];
export type EmployeeRole = typeof APP_CONSTANTS.EMPLOYEE_ROLES[number];
export type Gender = typeof APP_CONSTANTS.GENDERS[number];