// src/shared/types.ts
// Shared TypeScript types between client and server

export type UserRole = 'admin' | 'employee';
export type AttendanceStatus = 'working' | 'completed' | 'cancelled';
export type ShiftCode = 'SANG' | 'CHIEU' | 'TOI' | 'CA1' | 'CA2' | 'CA3' | 'MANUAL';
export type AdvanceStatus = 'approved' | 'pending' | 'rejected';
export type LeaveStatus = 'approved' | 'pending' | 'rejected';

export interface Employee {
  id: string;
  username: string;
  code: string;
  fullName: string;
  shortName: string;
  name: string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  cccd: string;
  phone: string;
  address: string;
  branch: string;
  role: string;
  bankCode: string;
  bankName: string;
  bankAccount: string;
  accountName: string;
  hourlyRate: number;
  password: string; // hashed
  passwordChanged: boolean;
  avatar: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeePublic extends Omit<Employee, 'password' | 'passwordChanged'> {
  passwordChanged: boolean;
  isDefaultPassword: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  branch: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // ISO string
  checkOut: string | null; // ISO string
  totalHours: number;
  shiftCode: ShiftCode;
  shiftName: string;
  status: AttendanceStatus;
  note: string;
  photo: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryAdvance {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employeeShortName: string;
  branch: string;
  date: string; // YYYY-MM-DD
  salaryMonth: string; // YYYY-MM
  amount: number;
  reason: string;
  status: AdvanceStatus;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  employeeShortName: string;
  branch: string;
  date: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  shift: string;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
}

export interface Shift {
  code: ShiftCode;
  name: string;
  duration: number;
  defaultStart: string; // HH:mm
  defaultEnd: string; // HH:mm
  note: string;
}

export interface Settings {
  storeName: string;
  branchName: string;
  tagline: string;
  logoUrl: string;
  adminUsername: string;
  adminPassword: string; // hashed
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  githubRepo: string;
}

export interface AuthResult {
  role: UserRole;
  user: EmployeePublic | AdminUser;
  activeShift: AttendanceRecord | null;
}

export interface AdminUser {
  username: string;
  name: string;
  role: 'admin';
  email: string;
  phone: string;
}

export interface MonthlySummary {
  employee: EmployeePublic;
  yearMonth: string;
  totalHours: number;
  totalDays: number;
  totalShifts: number;
  totalLeaveDays: number;
  advanceCount: number;
  advanceTotal: number;
  advances: SalaryAdvance[];
  leaveRequests: LeaveRequest[];
  salaryConfidential: boolean;
  activeShift: AttendanceRecord | null;
  records: AttendanceRecord[];
  hourlyRate?: number;
  estimatedSalary?: number;
}

export interface MasterReportRow {
  employee: EmployeePublic & { password: string; passwordChanged: boolean; isDefaultPassword: boolean };
  dailyData: Record<number, { hours: number; logs: AttendanceRecord[] }>;
  totalHours: number;
  daysWorked: number;
  morningShifts: number;
  eveningShifts: number;
  totalShifts: number;
  leaveDaysCount: number;
  leaves: LeaveRequest[];
  hourlyRate: number;
  totalSalary: number;
  advanceCount: number;
  advanceTotal: number;
  netSalary: number;
  advances: SalaryAdvance[];
}

export interface MasterMonthlyReport {
  yearMonth: string;
  branchName: string;
  year: number;
  month: number;
  daysInMonth: number;
  days: Array<{
    day: number;
    date: string;
    dayOfWeek: string;
    isWeekend: boolean;
  }>;
  rows: MasterReportRow[];
  summary: {
    totalEmployees: number;
    storeTotalHours: number;
    storeTotalSalary: number;
    storeTotalAdvance: number;
    storeTotalNetSalary: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  records: T[];
  totalCount: number;
  totalAmount?: number;
}

// Form types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface EmployeeFormData {
  username: string;
  fullName: string;
  shortName: string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  cccd: string;
  phone: string;
  address: string;
  bankCode: string;
  bankName: string;
  bankAccount: string;
  accountName: string;
  role: string;
  hourlyRate: number;
  password: string;
}

export interface AttendanceCheckInData {
  employeeId: string;
  shiftCode: ShiftCode;
  note?: string;
}

export interface AttendanceCheckOutData {
  employeeId: string;
  attendanceId: string;
  note?: string;
}

export interface DailyWorkEntryData {
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  shiftName: string;
  note?: string;
}

export interface SalaryAdvanceData {
  employeeId: string;
  date: string;
  amount: number;
  reason: string;
}

export interface LeaveRequestData {
  employeeId: string;
  date: string;
  endDate?: string;
  shift?: string;
  reason?: string;
}

export interface AdminProfileData {
  adminName?: string;
  adminUsername?: string;
  adminEmail?: string;
  adminPhone?: string;
  currentPassword?: string;
  newPassword?: string;
}

// Vietnam Banks
export interface VietnamBank {
  code: string;
  shortName: string;
  name: string;
  bin: string;
}