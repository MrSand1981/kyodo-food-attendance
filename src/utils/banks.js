// src/utils/banks.js
// Danh sách các ngân hàng tại Việt Nam (hỗ trợ chuyển khoản nhanh Napas 247 và tạo mã VietQR chuẩn)

export const VIETNAM_BANKS = [
  { code: 'VCB', shortName: 'Vietcombank', name: 'Vietcombank - Ngân hàng Ngoại thương Việt Nam', bin: '970436' },
  { code: 'MB', shortName: 'MB Bank', name: 'MB Bank - Ngân hàng Quân Đội', bin: '970422' },
  { code: 'TCB', shortName: 'Techcombank', name: 'Techcombank - Ngân hàng Kỹ Thương Việt Nam', bin: '970407' },
  { code: 'ICB', shortName: 'VietinBank', name: 'VietinBank - Ngân hàng Công Thương Việt Nam', bin: '970415' },
  { code: 'BIDV', shortName: 'BIDV', name: 'BIDV - Ngân hàng Đầu tư và Phát triển Việt Nam', bin: '970418' },
  { code: 'VBA', shortName: 'Agribank', name: 'Agribank - Ngân hàng Nông nghiệp & PTNT Việt Nam', bin: '970405' },
  { code: 'ACB', shortName: 'ACB', name: 'ACB - Ngân hàng Á Châu', bin: '970416' },
  { code: 'VPB', shortName: 'VPBank', name: 'VPBank - Ngân hàng Việt Nam Thịnh Vượng', bin: '970432' },
  { code: 'TPB', shortName: 'TPBank', name: 'TPBank - Ngân hàng Tiên Phong', bin: '970423' },
  { code: 'VIB', shortName: 'VIB', name: 'VIB - Ngân hàng Quốc tế Việt Nam', bin: '970441' },
  { code: 'STB', shortName: 'Sacombank', name: 'Sacombank - Ngân hàng Sài Gòn Thương Tín', bin: '970403' },
  { code: 'HDB', shortName: 'HDBank', name: 'HDBank - Ngân hàng Phát triển TP.HCM', bin: '970437' },
  { code: 'SHB', shortName: 'SHB', name: 'SHB - Ngân hàng Sài Gòn - Hà Nội', bin: '970443' },
  { code: 'MSB', shortName: 'MSB', name: 'MSB - Ngân hàng Hàng Hải Việt Nam', bin: '970426' },
  { code: 'OCB', shortName: 'OCB', name: 'OCB - Ngân hàng Phương Đông', bin: '970448' },
  { code: 'LPB', shortName: 'LPBank', name: 'LPBank - Ngân hàng Bưu Điện Liên Việt', bin: '970449' },
  { code: 'SEAB', shortName: 'SeABank', name: 'SeABank - Ngân hàng Đông Nam Á', bin: '970440' },
  { code: 'NAB', shortName: 'Nam A Bank', name: 'Nam A Bank - Ngân hàng Nam Á', bin: '970428' },
  { code: 'BAB', shortName: 'Bac A Bank', name: 'Bac A Bank - Ngân hàng Bắc Á', bin: '970409' },
  { code: 'TIMO', shortName: 'Timo', name: 'Timo by BVBank', bin: '963388' },
  { code: 'CAKE', shortName: 'Cake', name: 'Cake by VPBank', bin: '546034' }
];

export function getBankInfo(bankCode) {
  if (!bankCode) return null;
  const codeUpper = String(bankCode).trim().toUpperCase();
  return VIETNAM_BANKS.find(b => b.code.toUpperCase() === codeUpper || b.shortName.toUpperCase() === codeUpper) || null;
}

/**
 * Tạo link ảnh mã VietQR chuẩn Napas 247 để quét bằng bất kỳ ứng dụng ngân hàng nào
 * @param {Object} params
 * @param {string} params.bankCode - Mã ngân hàng (VCB, MB, TCB...)
 * @param {string} params.bankAccount - Số tài khoản ngân hàng
 * @param {number} [params.amount] - Số tiền chuyển (VNĐ)
 * @param {string} [params.accountName] - Tên chủ tài khoản
 * @param {string} [params.memo] - Nội dung chuyển khoản
 * @returns {string} Đường dẫn ảnh VietQR
 */
export function getVietQRUrl({ bankCode, bankAccount, amount = 0, accountName = '', memo = '' }) {
  if (!bankCode || !bankAccount) return '';
  const bank = getBankInfo(bankCode) || { code: bankCode };
  const cleanAccount = String(bankAccount).replace(/\s+/g, '');
  
  const params = new URLSearchParams();
  if (amount > 0) {
    params.append('amount', String(Math.round(amount)));
  }
  if (accountName) {
    params.append('accountName', String(accountName).trim().toUpperCase());
  }
  if (memo) {
    params.append('addInfo', String(memo).trim());
  }

  const qs = params.toString() ? `?${params.toString()}` : '';
  return `https://img.vietqr.io/image/${bank.code}-${cleanAccount}-compact2.png${qs}`;
}
