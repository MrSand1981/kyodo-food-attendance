// src/utils/currency.js
// Tiện ích quản lý mệnh giá tiền tệ Việt Nam và bộ đọc số thành chữ

export const DENOMINATIONS = [
  {
    value: 500000,
    label: '500.000 đ',
    short: '500k',
    color: 'sky',
    borderClass: 'border-sky-300 hover:border-sky-500',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-300',
    activeBg: 'bg-sky-50/50',
    type: 'Polymer',
  },
  {
    value: 200000,
    label: '200.000 đ',
    short: '200k',
    color: 'rose',
    borderClass: 'border-rose-300 hover:border-rose-500',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    activeBg: 'bg-rose-50/50',
    type: 'Polymer',
  },
  {
    value: 100000,
    label: '100.000 đ',
    short: '100k',
    color: 'emerald',
    borderClass: 'border-emerald-300 hover:border-emerald-500',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    activeBg: 'bg-emerald-50/50',
    type: 'Polymer',
  },
  {
    value: 50000,
    label: '50.000 đ',
    short: '50k',
    color: 'fuchsia',
    borderClass: 'border-fuchsia-300 hover:border-fuchsia-500',
    badgeClass: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300',
    activeBg: 'bg-fuchsia-50/50',
    type: 'Polymer',
  },
  {
    value: 20000,
    label: '20.000 đ',
    short: '20k',
    color: 'blue',
    borderClass: 'border-blue-300 hover:border-blue-500',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    activeBg: 'bg-blue-50/50',
    type: 'Polymer',
  },
  {
    value: 10000,
    label: '10.000 đ',
    short: '10k',
    color: 'amber',
    borderClass: 'border-amber-300 hover:border-amber-500',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    activeBg: 'bg-amber-50/50',
    type: 'Polymer',
  },
  {
    value: 5000,
    label: '5.000 đ',
    short: '5k',
    color: 'teal',
    borderClass: 'border-teal-300 hover:border-teal-500',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-300',
    activeBg: 'bg-teal-50/50',
    type: 'Cotton',
  },
  {
    value: 2000,
    label: '2.000 đ',
    short: '2k',
    color: 'violet',
    borderClass: 'border-violet-300 hover:border-violet-500',
    badgeClass: 'bg-violet-100 text-violet-900 border-violet-300',
    activeBg: 'bg-violet-50/50',
    type: 'Cotton',
  },
  {
    value: 1000,
    label: '1.000 đ',
    short: '1k',
    color: 'lime',
    borderClass: 'border-lime-300 hover:border-lime-500',
    badgeClass: 'bg-lime-100 text-lime-900 border-lime-300',
    activeBg: 'bg-lime-50/50',
    type: 'Cotton',
  },
];

/**
 * Định dạng số tiền sang chuẩn Việt Nam (ví dụ: 15.420.000 đ)
 */
export function formatVND(num) {
  if (num === null || num === undefined || isNaN(num)) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(Math.round(num)) + ' đ';
}

function readThreeDigits(n, readZeroHundreds) {
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const hundred = Math.floor(n / 100);
  const ten = Math.floor((n % 100) / 10);
  const unit = n % 10;
  let res = '';

  if (hundred > 0 || readZeroHundreds) {
    res += digits[hundred] + ' trăm ';
  }

  if (ten > 1) {
    res += digits[ten] + ' mươi ';
    if (unit === 1) res += 'mốt ';
    else if (unit === 5) res += 'lăm ';
    else if (unit > 0) res += digits[unit] + ' ';
  } else if (ten === 1) {
    res += 'mười ';
    if (unit === 5) res += 'lăm ';
    else if (unit > 0) res += digits[unit] + ' ';
  } else if (ten === 0) {
    if ((hundred > 0 || readZeroHundreds) && unit > 0) {
      res += 'linh ' + digits[unit] + ' ';
    } else if (unit > 0) {
      res += digits[unit] + ' ';
    }
  }

  return res.trim();
}

/**
 * Đọc số tiền VNĐ thành chữ tiếng Việt chuẩn xác
 * Ví dụ: 15420000 -> "Mười lăm triệu bốn trăm hai mươi nghìn đồng"
 */
export function convertVNDToWords(num) {
  if (!num || isNaN(num) || num === 0) return 'Không đồng';
  const cleanNum = Math.round(Math.abs(num));
  const scales = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const groups = [];
  let temp = cleanNum;

  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const words = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g > 0) {
      const isFirst = i === groups.length - 1;
      const text = readThreeDigits(g, !isFirst);
      words.push(text + ' ' + scales[i]);
    }
  }

  let result = words.join(' ').replace(/\s+/g, ' ').trim();
  result = result.charAt(0).toUpperCase() + result.slice(1) + ' đồng';
  return result;
}
