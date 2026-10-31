// src/utils/date.js
// Các hàm tiện ích chuẩn hóa định dạng ngày tháng sang DD/MM/YYYY theo chuẩn Việt Nam

export function formatDateVN(dateInput) {
  if (!dateInput) return '';
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '';
    const d = String(dateInput.getDate()).padStart(2, '0');
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const y = dateInput.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const s = String(dateInput).trim();
  
  // Trường hợp ISO string có T: 2026-10-30T...
  const dateOnly = s.includes('T') ? s.split('T')[0] : s;

  // Trường hợp YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const [y, m, d] = dateOnly.split('-');
    return `${d}/${m}/${y}`;
  }

  // Trường hợp YYYY/MM/DD
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateOnly)) {
    const [y, m, d] = dateOnly.split('/');
    return `${d}/${m}/${y}`;
  }

  // Trường hợp DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateOnly)) {
    const [d, m, y] = dateOnly.split('-');
    return `${d}/${m}/${y}`;
  }

  // Đã ở dạng DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateOnly)) {
    return dateOnly;
  }

  // Trường hợp YYYY-MM
  if (/^\d{4}-\d{2}$/.test(dateOnly)) {
    const [y, m] = dateOnly.split('-');
    return `${m}/${y}`;
  }

  return dateOnly;
}

export function formatMonthVN(monthStr) {
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

export function formatMonthShort(monthStr) {
  if (!monthStr) return '';
  const s = String(monthStr).trim();
  if (/^\d{4}-\d{2}$/.test(s)) {
    const [y, m] = s.split('-');
    return `${m}/${y}`;
  }
  return s;
}

export function toISODate(dateStr) {
  if (!dateStr) return '';
  const s = String(dateStr).trim();
  // Nếu là DD/MM/YYYY -> chuyển thành YYYY-MM-DD
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split('/');
    return `${y}-${m}-${d}`;
  }
  return s;
}

export function formatShortTime(isoString) {
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
 * Quy tắc nghiệp vụ chu kỳ tạm ứng lương Kyodo Food:
 * - Chấm công từ ngày 01 đến ngày cuối cùng của tháng.
 * - Ngày trả lương là ngày 05 hàng tháng.
 * - Ứng lương trước hoặc vào ngày 05 (ngày 01 - 05): khấu trừ vào lương của THÁNG TRƯỚC ĐÓ.
 * - Ứng lương từ ngày 06 trở đi (ngày 06 tháng này đến 05 tháng sau): khấu trừ vào lương THÁNG ĐANG CHẤM CÔNG.
 */
export function getSalaryMonthForAdvance(dateStr) {
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
 * Lấy khoảng ngày chu kỳ tạm ứng của một tháng lương:
 * Ví dụ: '2026-11' -> 'Từ 06/11/2026 đến 05/12/2026'
 */
export function getAdvanceCycleRange(yearMonth) {
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
export function getAdvanceCycleExplanation(dateStr) {
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
