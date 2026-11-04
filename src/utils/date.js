// src/utils/date.js
// Các hàm tiện ích chuẩn hóa định dạng ngày tháng sang DD/MM/YYYY theo chuẩn Việt Nam

/**
 * Lấy ngày hôm nay theo múi giờ Việt Nam (Asia/Ho_Chi_Minh, GMT+7) định dạng YYYY-MM-DD
 * Tuyệt đối không dùng toISOString() vì toISOString() trả về giờ UTC (GMT+0) khiến từ 00:00 đến 07:00 sáng tại VN bị lùi về ngày hôm trước!
 */
export function getVietnamTodayYMD() {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch (e) {
    const d = new Date(Date.now() + 7 * 3600 * 1000);
    return d.toISOString().split('T')[0];
  }
}

/**
 * Lấy tháng hiện tại theo múi giờ Việt Nam định dạng YYYY-MM
 */
export function getVietnamCurrentYM() {
  return getVietnamTodayYMD().substring(0, 7);
}

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
    hour12: false,
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
  let year = 0,
    month = 0,
    day = 0;

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
      : `Khấu trừ vào lương ${formatMonthVN(targetYM)} (ứng từ ngày 06).`,
  };
}

/**
 * Quy tắc tính ngày nghỉ Kyodo Food:
 * - Ngày nào nếu nhân viên không phát sinh chấm công thì qua ngày hôm sau sẽ tính ngày trước đó là ngày nghỉ.
 * - Nếu nhân viên chấm công bù thì lại loại trừ tính ngày đó là ngày nghỉ.
 * - Ngày hôm nay (today) đang diễn ra ca làm nên chưa tính là ngày nghỉ.
 * - Ngày trong tương lai chỉ tính nếu có đơn xin nghỉ phép hợp lệ.
 */
export function calculateMonthlyAbsenceDays(
  yearMonth,
  workedDates,
  leaveList = [],
  todayYMD = getVietnamTodayYMD()
) {
  if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
    return {
      totalLeaveDays: 0,
      leaveDates: [],
      absenceDates: [],
      registeredLeaveDates: [],
    };
  }

  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  const workedSet = new Set();
  if (workedDates instanceof Set) {
    workedDates.forEach((d) => workedSet.add(d));
  } else if (Array.isArray(workedDates)) {
    workedDates.forEach((d) => workedSet.add(d));
  }

  const registeredSet = new Set();
  if (Array.isArray(leaveList)) {
    leaveList.forEach((l) => {
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
          registeredSet.add(ymd);
        }
        cur.setDate(cur.getDate() + 1);
        count++;
      }
    });
  }

  const absenceDates = [];
  const registeredLeaveDates = [];
  const allLeaveDatesSet = new Set();

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = String(d).padStart(2, '0');
    const mStr = String(month).padStart(2, '0');
    const dateFormatted = `${year}-${mStr}-${dStr}`;

    // 1. Nếu ngày này nhân viên đã có chấm công (hoặc chấm công bù): LOẠI TRỪ khỏi ngày nghỉ!
    if (workedSet.has(dateFormatted)) {
      continue;
    }

    // 2. Nếu ngày này là ngày trong quá khứ (< todayYMD):
    // Qua ngày hôm sau tự động tính ngày trước đó là ngày nghỉ!
    if (dateFormatted < todayYMD) {
      absenceDates.push(dateFormatted);
      allLeaveDatesSet.add(dateFormatted);
    } else if (registeredSet.has(dateFormatted)) {
      // 3. Nếu nhân viên chủ động đăng ký nghỉ (cho hôm nay hoặc tương lai)
      registeredLeaveDates.push(dateFormatted);
      allLeaveDatesSet.add(dateFormatted);
    }
    // Chú ý: dateFormatted === todayYMD nếu chưa có đơn đăng ký thì không tính vì hôm nay đang diễn ra ca làm!
  }

  return {
    totalLeaveDays: allLeaveDatesSet.size,
    leaveDates: Array.from(allLeaveDatesSet).sort(),
    absenceDates: absenceDates.sort(),
    registeredLeaveDates: registeredLeaveDates.sort(),
  };
}

/**
 * Thêm số ngày vào ngày định dạng YYYY-MM-DD
 */
export function addDaysYMD(ymdStr, daysToAdd) {
  if (!ymdStr) return '';
  const [y, m, d] = ymdStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + daysToAdd);
  const nextY = dt.getFullYear();
  const nextM = String(dt.getMonth() + 1).padStart(2, '0');
  const nextD = String(dt.getDate()).padStart(2, '0');
  return `${nextY}-${nextM}-${nextD}`;
}

/**
 * Đếm số ngày giữa hai ngày (inclusive)
 */
export function countDaysBetween(startDate, endDate) {
  if (!startDate) return 0;
  if (!endDate || endDate === startDate) return 1;
  const [y1, m1, d1] = startDate.split('-').map(Number);
  const [y2, m2, d2] = endDate.split('-').map(Number);
  const t1 = new Date(y1, m1 - 1, d1).getTime();
  const t2 = new Date(y2, m2 - 1, d2).getTime();
  if (t2 < t1) return 1;
  const diffTime = Math.abs(t2 - t1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Lấy tên thứ trong tuần an toàn
 */
export function getDayOfWeekNameSafe(dateStr) {
  if (!dateStr) return '';
  const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  if (dateStr.includes('-')) {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      const dt = new Date(y, m - 1, d);
      return days[dt.getDay()];
    }
  }
  const dt = new Date(dateStr);
  return days[dt.getDay()] || '';
}

