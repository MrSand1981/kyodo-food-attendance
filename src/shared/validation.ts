// src/shared/validation.ts
// Shared Zod validation schemas (client + server)

import { z } from 'zod';

// ============ BASE SCHEMAS ============
export const usernameSchema = z
  .string()
  .min(1, 'Tên đăng nhập không được để trống')
  .max(50, 'Tên đăng nhập tối đa 50 ký tự')
  .regex(/^[A-Z0-9]+$/, 'Chỉ chấp nhận chữ in hoa và số');

export const passwordSchema = z
  .string()
  .min(4, 'Mật khẩu phải có ít nhất 4 ký tự')
  .max(100, 'Mật khẩu quá dài');

export const nameSchema = z
  .string()
  .min(1, 'Tên không được để trống')
  .max(100, 'Tên tối đa 100 ký tự')
  .trim();

export const phoneSchema = z
  .string()
  .regex(/^(0|\+84)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ')
  .optional()
  .or(z.literal(''));

export const emailSchema = z
  .string()
  .email('Email không hợp lệ')
  .optional()
  .or(z.literal(''));

export const cccdSchema = z
  .string()
  .regex(/^[0-9]{12}$/, 'CCCD phải có 12 chữ số')
  .optional()
  .or(z.literal(''));

export const bankAccountSchema = z
  .string()
  .regex(/^[0-9]{6,20}$/, 'Số tài khoản không hợp lệ')
  .optional()
  .or(z.literal(''));

export const hourlyRateSchema = z
  .number()
  .min(0, 'Mức lương không được âm')
  .max(1000000, 'Mức lương quá cao')
  .default(25000);

export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Định dạng ngày phải là YYYY-MM-DD');

export const monthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'Định dạng tháng phải là YYYY-MM');

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Định dạng giờ phải là HH:mm (24h)');

// ============ AUTH SCHEMAS ============
export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, 'Mật khẩu không được để trống')
});

export const changePasswordSchema = z.object({
  employeeId: z.string().min(1),
  oldPassword: z.string().min(1, 'Mật khẩu hiện tại không được để trống'),
  newPassword: passwordSchema
}).refine(data => data.oldPassword !== data.newPassword, {
  message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
  path: ['newPassword']
});

export const adminChangePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Mật khẩu hiện tại không được để trống'),
  newPassword: passwordSchema
}).refine(data => data.oldPassword !== data.newPassword, {
  message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
  path: ['newPassword']
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập Email hoặc Số điện thoại')
});

// ============ EMPLOYEE SCHEMAS ============
export const employeeCreateSchema = z.object({
  username: usernameSchema,
  fullName: nameSchema,
  shortName: nameSchema,
  gender: z.enum(['Nam', 'Nữ'], { message: 'Giới tính phải là Nam hoặc Nữ' }),
  dob: dateSchema.optional().or(z.literal('')),
  cccd: cccdSchema,
  phone: phoneSchema,
  address: z.string().max(200, 'Địa chỉ quá dài').optional().or(z.literal('')),
  bankCode: z.string().min(1, 'Vui lòng chọn ngân hàng').default('VCB'),
  bankName: z.string().min(1).default('Vietcombank'),
  bankAccount: bankAccountSchema,
  accountName: nameSchema.optional().or(z.literal('')),
  role: z.string().default('Nhân viên'),
  hourlyRate: hourlyRateSchema,
  password: passwordSchema.default('1234')
});

export const employeeUpdateSchema = employeeCreateSchema.partial().extend({
  id: z.string().min(1)
});

// ============ ATTENDANCE SCHEMAS ============
export const checkInSchema = z.object({
  employeeId: z.string().min(1),
  shiftCode: z.enum(['SANG', 'CHIEU', 'TOI', 'CA1', 'CA2', 'CA3', 'MANUAL'], {
    message: 'Mã ca không hợp lệ'
  }),
  note: z.string().max(500, 'Ghi chú quá dài').optional().or(z.literal(''))
});

export const checkOutSchema = z.object({
  employeeId: z.string().min(1),
  attendanceId: z.string().min(1),
  note: z.string().max(500, 'Ghi chú quá dài').optional().or(z.literal(''))
});

export const dailyEntrySchema = z.object({
  employeeId: z.string().min(1),
  date: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  hours: z.number().min(0.5, 'Tối thiểu 0.5 giờ').max(24, 'Không quá 24 giờ'),
  shiftName: z.string().min(1, 'Tên ca không được để trống').max(100),
  note: z.string().max(500, 'Ghi chú quá dài').optional().or(z.literal(''))
}).refine(data => data.startTime !== data.endTime, {
  message: 'Giờ vào và giờ ra không được trùng nhau',
  path: ['endTime']
});

export const adjustAttendanceSchema = z.object({
  id: z.string().min(1),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  totalHours: z.number().min(0).optional(),
  note: z.string().max(500).optional()
});

// ============ SALARY ADVANCE SCHEMAS ============
export const salaryAdvanceCreateSchema = z.object({
  employeeId: z.string().min(1),
  date: dateSchema,
  amount: z.number().min(1000, 'Tối thiểu 1.000 đ').max(100000000, 'Quá lớn'),
  reason: z.string().min(1, 'Lý do không được để trống').max(200)
});

export const salaryAdvanceUpdateSchema = z.object({
  id: z.string().min(1),
  amount: z.number().min(1000).max(100000000).optional(),
  date: dateSchema.optional(),
  reason: z.string().max(200).optional()
});

// ============ LEAVE REQUEST SCHEMAS ============
export const leaveRequestCreateSchema = z.object({
  employeeId: z.string().min(1),
  date: dateSchema,
  endDate: dateSchema.optional(),
  shift: z.string().max(50).optional().default('Cả Ngày'),
  reason: z.string().max(200).optional().default('Có việc cá nhân')
});

export const leaveRequestUpdateSchema = z.object({
  id: z.string().min(1),
  date: dateSchema.optional(),
  endDate: dateSchema.optional(),
  shift: z.string().max(50).optional(),
  reason: z.string().max(200).optional()
});

// ============ SETTINGS SCHEMAS ============
export const settingsUpdateSchema = z.object({
  storeName: z.string().max(100).optional(),
  branchName: z.string().max(100).optional(),
  tagline: z.string().max(200).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  githubRepo: z.string().url().optional().or(z.literal('')),
  adminUsername: usernameSchema.optional(),
  adminName: nameSchema.optional(),
  adminEmail: emailSchema,
  adminPhone: phoneSchema
});

export const adminProfileSchema = z.object({
  adminName: nameSchema.optional(),
  adminUsername: usernameSchema.optional(),
  adminEmail: emailSchema,
  adminPhone: phoneSchema,
  currentPassword: z.string().optional(),
  newPassword: passwordSchema.optional()
}).refine(data => {
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  return true;
}, {
  message: 'Cần nhập mật khẩu hiện tại để đổi mật khẩu mới',
  path: ['currentPassword']
});

// ============ QUERY SCHEMAS ============
export const monthQuerySchema = z.object({
  month: monthSchema.optional()
});

export const employeeIdQuerySchema = z.object({
  employeeId: z.string().min(1),
  month: monthSchema.optional()
});

export const advanceQuerySchema = z.object({
  employeeId: z.string().optional(),
  month: monthSchema.optional()
});

export const leaveQuerySchema = z.object({
  employeeId: z.string().optional(),
  month: monthSchema.optional()
});

// ============ EXPORT TYPES ============
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type AdminChangePasswordInput = z.infer<typeof adminChangePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type EmployeeCreateInput = z.infer<typeof employeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type DailyEntryInput = z.infer<typeof dailyEntrySchema>;
export type AdjustAttendanceInput = z.infer<typeof adjustAttendanceSchema>;
export type SalaryAdvanceCreateInput = z.infer<typeof salaryAdvanceCreateSchema>;
export type SalaryAdvanceUpdateInput = z.infer<typeof salaryAdvanceUpdateSchema>;
export type LeaveRequestCreateInput = z.infer<typeof leaveRequestCreateSchema>;
export type LeaveRequestUpdateInput = z.infer<typeof leaveRequestUpdateSchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
export type AdminProfileInput = z.infer<typeof adminProfileSchema>;
export type MonthQuery = z.infer<typeof monthQuerySchema>;
export type EmployeeIdQuery = z.infer<typeof employeeIdQuerySchema>;
export type AdvanceQuery = z.infer<typeof advanceQuerySchema>;
export type LeaveQuery = z.infer<typeof leaveQuerySchema>;
