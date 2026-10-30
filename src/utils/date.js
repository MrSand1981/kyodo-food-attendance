// src/utils/date.js
// Các hàm tiện ích chuẩn hóa định dạng ngày tháng sang dd/mm/yyyy theo chuẩn Việt Nam

export function formatDateVN(dateStr) {
  if (!dateStr) return '';
  const s = String(dateStr).trim();
  
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

  // Trường hợp YYYY-MM
  if (/^\d{4}-\d{2}$/.test(dateOnly)) {
    const [y, m] = dateOnly.split('-');
    return `${m}/${y}`;
  }

  // Nếu đã ở dạng DD/MM/YYYY hoặc khác thì giữ nguyên
  return dateOnly;
}

export function formatMonthVN(monthStr) {
  if (!monthStr) return '';
  const s = String(monthStr).trim();
  if (/^\d{4}-\d{2}$/.test(s)) {
    const [y, m] = s.split('-');
    return `Tháng ${m}/${y}`;
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
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
