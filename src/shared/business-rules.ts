// src/shared/business-rules.ts
// SHARED business logic between client and server
// Single source of truth for salary advance cycles, overlap detection, etc.

import { AttendanceRecord } from './types';

/**
 * Quy tắc nghiệp vụ chu kỳ tạm ứng lương Kyodo Food:
 * - Chấm công từ ngày 01 đến ngày cuối cùng của tháng.
 * - Ngày trả lương là ngày 05 hàng tháng.
 * - Ứng lương trước hoặc vào ngày 05 (ngày 01 - 05): khấu trừ vào lương của THÁNG TRƯỚC ĐÓ.
 * - Ứng lương từ ngày 06 trở đi (ngày 06 tháng này đến 05 tháng sau): khấu trừ vào lương THÁNG ĐANG CHẤM CÔNG.
 */

export function getSalaryMonthForAdvance(dateStr: string): string {
  if (!dateStr) return '';
  const s = String(dateStr).trim().split('T')[0];
  let year = 0, month = 0, day = 0;

  if (s.includes('-')) {
    const parts = s.split('-');
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
      year = parseInt(parts[2], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[0], 10);
    }
  } else if (s.includes('/')) {
    const parts = s.split('/');
    if (parts[2].length === 4) {
      year = parseInt(parts[2], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[0], 10);
    }
  }

  if (!year || !month || isNaN(day)) return s.substring(0, 7);

  // Nếu ngày ứng <= 5: thuộc chu kỳ lương tháng trước
  if (day <= 5) {
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Lấy ngày hôm nay theo múi giờ Việt Nam (Asia/Ho_Chi_Minh, GMT+7) định dạng YYYY-MM-DD
 * Tuyệt đối không dùng toISOString() vì toISOString() trả về giờ UTC (GMT+0) khiến từ 00:00 đến 07:00 sáng tại VN bị lùi về ngày hôm trước!
 */
export function getVietnamTodayYMD(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  } catch {
    const d = new Date(Date.now() + 7 * 3600 * 1000);
    return d.toISOString().split('T')[0];
  }
}

/**
 * Lấy tháng hiện tại theo múi giờ Việt Nam định dạng YYYY-MM
 */
export function getVietnamCurrentYM(): string {
  return getVietnamTodayYMD().substring(0, 7);
}

export function formatDateVN(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '';
    const d = String(dateInput.getDate()).padStart(2, '0');
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const y = dateInput.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const s = String(dateInput).trim();
  const dateOnly = s.includes('T') ? s.split('T')[0] : s;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const [y, m, d] = dateOnly.split('-');
    return `${d}/${m}/${y}`;
  }

  if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateOnly)) {
    const [y, m, d] = dateOnly.split('/');
    return `${d}/${m}/${y}`;
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(dateOnly)) {
    const [d, m, y] = dateOnly.split('-');
    return `${d}/${m}/${y}`;
  }

  // Đã ở dạng DD/MM/YYYY hoặc MM/DD/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateOnly)) {
    const parts = dateOnly.split('/');
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    const y = parts[2];
    if (p1 <= 12 && p2 > 12) {
      // Nhận diện định dạng Mỹ MM/DD/YYYY và chuyển sang chuẩn Việt Nam DD/MM/YYYY
      return `${String(p2).padStart(2, '0')}/${String(p1).padStart(2, '0')}/${y}`;
    }
    return `${String(p1).padStart(2, '0')}/${String(p2).padStart(2, '0')}/${y}`;
  }

  if (/^\d{4}-\d{2}$/.test(dateOnly)) {
    const [y, m] = dateOnly.split('-');
    return `${m}/${y}`;
  }

  return dateOnly;
}

export function formatMonthVN(monthStr: string): string {
  if (!monthStr) return '';
  const s = String(monthStr).trim();
  if (/^\d{4}-\d{2}$/.test(s)) {
    const [y, m] = s.split('-');
    return `Tháng ${m}/${y}`;
  }
  if (/^\d{2}\/\d{4}$/.test(s)) {
    return `Tháng ${s}`;
  }
  return s;
}

export function formatMonthShort(monthStr: string): string {
  if (!monthStr) return '';
  const s = String(monthStr).trim();
  if (/^\d{4}-\d{2}$/.test(s)) {
    const [y, m] = s.split('-');
    return `${m}/${y}`;
  }
  return s;
}

export function formatShortTime(isoString: string): string {
  if (!isoString) return '--:--';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '--:--';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d);
}

/**
 * Lấy khoảng ngày chu kỳ tạm ứng của một tháng lương:
 * Ví dụ: '2026-11' -> 'Từ 06/11/2026 đến 05/12/2026'
 */
export function getAdvanceCycleRange(yearMonth: string): string {
  if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) return '';
  const [y, m] = yearMonth.split('-').map(Number);
  let nextY = y;
  let nextM = m + 1;
  if (nextM > 12) {
    nextM = 1;
    nextY += 1;
  }
  return `Từ 06/${String(m).padStart(2, '0')}/${y} đến 05/${String(nextM).padStart(2, '0')}/${nextY}`;
}

/**
 * Giải thích chi tiết một ngày ứng thuộc chu kỳ lương tháng nào
 */
export function getAdvanceCycleExplanation(dateStr: string): {
  salaryMonth: string;
  formattedMonth: string;
  isBeforeOrOn5th: boolean;
  note: string;
} | null {
  if (!dateStr) return null;
  const targetYM = getSalaryMonthForAdvance(dateStr);
  const s = String(dateStr).trim().split('T')[0];
  let day = 0;
  if (s.includes('-')) {
    const parts = s.split('-');
    day = parseInt(parts[parts[0].length === 4 ? 2 : 0], 10);
  } else if (s.includes('/')) {
    day = parseInt(s.split('/')[0], 10);
  }

  const isBeforeOrOn5th = day <= 5;
  return {
    salaryMonth: targetYM,
    formattedMonth: formatMonthVN(targetYM),
    isBeforeOrOn5th,
    note: isBeforeOrOn5th 
      ? `Khấu trừ vào lương ${formatMonthVN(targetYM)} (ứng trước ngày 05).`
      : `Khấu trừ vào lương ${formatMonthVN(targetYM)} (ứng từ ngày 06).`
  };
}

/**
 * Kiểm tra giao thoa thời gian giữa 2 ca làm việc
 * Trả về true nếu có giao thoa
 */
export function hasTimeOverlap(
  newStartMs: number,
  newEndMs: number,
  existStartMs: number,
  existEndMs: number
): boolean {
  return newStartMs < existEndMs && newEndMs > existStartMs;
}

/**
 * Parse time string HH:mm to minutes since midnight
 */
export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Parse ISO string to minutes since midnight in Vietnam timezone
 */
export function parseISOToMinutes(isoString: string): number {
  if (!isoString) return 0;
  const timeStr = formatShortTime(isoString);
  if (timeStr === '--:--') return 0;
  return parseTimeToMinutes(timeStr);
}

/**
 * Kiểm tra trùng lặp/giao thoa ca làm việc trong ngày
 * Dùng cho cả client-side validation và server-side validation
 */
export function checkShiftOverlap(
  newDate: string,
  newStartTime: string,
  newEndTime: string,
  existingRecords: AttendanceRecord[]
): { hasOverlap: boolean; errorMessage?: string; conflictingRecord?: AttendanceRecord } {
  const dayRecords = existingRecords.filter(
    r => r.date === newDate && r.status === 'completed' && r.checkIn && r.checkOut
  );

  const newStartMins = parseTimeToMinutes(newStartTime);
  let newEndMins = parseTimeToMinutes(newEndTime);
  if (newEndMins <= newStartMins) newEndMins += 24 * 60;

  for (const rec of dayRecords) {
    const existStartMins = parseISOToMinutes(rec.checkIn);
    let existEndMins = parseISOToMinutes(rec.checkOut);
    if (existEndMins <= existStartMins) existEndMins += 24 * 60;

    if (hasTimeOverlap(newStartMins, newEndMins, existStartMins, existEndMins)) {
      const existStartStr = formatShortTime(rec.checkIn);
      const existEndStr = formatShortTime(rec.checkOut);
      const recDate = rec.date || newDate;
      const [y, m, d] = recDate.split('-');
      const recDateVN = `${d}/${m}/${y}`;

      if (newStartTime === existStartStr && newEndTime === existEndStr) {
        return {
          hasOverlap: true,
          errorMessage: `Trùng lặp thời gian! Bạn đã chấm công ca ${existStartStr} - ${existEndStr} (${rec.totalHours}h) trong ngày ${recDateVN} rồi. Không được khai báo lặp lại 2 lần để gian lận giờ làm!`,
          conflictingRecord: rec
        };
      } else {
        return {
          hasOverlap: true,
          errorMessage: `Trùng thời gian làm việc! Khoảng giờ bạn nhập (${newStartTime} - ${newEndTime}) bị giao thoa/trùng đè với ca làm (${existStartStr} - ${existEndStr}) đã chấm ngày ${recDateVN}. Vui lòng nhập khoảng giờ khác!`,
          conflictingRecord: rec
        };
      }
    }
  }

  return { hasOverlap: false };
}

/**
 * Tính số giờ làm từ giờ vào/ra (làm tròn giờ, không tính lẻ phút)
 * 5h10p -> 5h, 4h50p -> 5h
 */
export function calculateHours(startTime: string, endTime: string): number {
  const startMins = parseTimeToMinutes(startTime);
  let endMins = parseTimeToMinutes(endTime);
  if (endMins <= startMins) endMins += 24 * 60;
  
  const diffMinutes = endMins - startMins;
  const roundedHours = Math.round(diffMinutes / 60);
  return Math.max(1, roundedHours);
}

/**
 * Tự động đặt tên ca làm việc dựa trên giờ
 */
export function getShiftNameFromTime(startTime: string, endTime: string): string {
  if (startTime === "08:00" && endTime === "17:00") {
    return "Ca Sáng";
  } else if (startTime === "17:00" && endTime === "22:00") {
    return "Ca Chiều";
  } else {
    return `Ca ${startTime}-${endTime}`;
  }
}

/**
 * Đếm tổng số ngày nghỉ thực tế trong tháng (không trùng lặp)
 */
export function countLeaveDaysInMonth(leaveList: Array<{ date: string; endDate?: string }>, yearMonth: string): number {
  if (!leaveList || !Array.isArray(leaveList)) return 0;
  const uniqueDates = new Set<string>();
  
  leaveList.forEach(l => {
    const startStr = l.date;
    const endStr = l.endDate || l.date;
    if (!startStr) return;
    
    const dStart = new Date(startStr);
    const dEnd = new Date(endStr);
    if (isNaN(dStart.getTime())) return;
    
    const cur = new Date(dStart);
    const stop = isNaN(dEnd.getTime()) || dEnd < dStart ? dStart : dEnd;
    
    let count = 0;
    while (cur <= stop && count <= 31) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, '0');
      const d = String(cur.getDate()).padStart(2, '0');
      const ymd = `${y}-${m}-${d}`;
      if (ymd.startsWith(yearMonth)) {
        uniqueDates.add(ymd);
      }
      cur.setDate(cur.getDate() + 1);
      count++;
    }
  });
  
  return uniqueDates.size;
}

/**
 * Tính lương tháng cho nhân viên
 */
export function calculateMonthlySalary(
  totalHours: number,
  hourlyRate: number,
  advanceTotal: number = 0
): { gross: number; net: number; advanceTotal: number } {
  const gross = Math.round(totalHours * hourlyRate);
  const net = gross - advanceTotal;
  return { gross, net, advanceTotal };
}

/**
 * Format tiền VNĐ
 */
export function formatVND(amount: number): string {
  return Number(amount || 0).toLocaleString('vi-VN');
}

/**
 * Format tiền VNĐ + đơn vị
 */
export function formatVNDWithUnit(amount: number): string {
  return `${formatVND(amount)} đ`;
}
