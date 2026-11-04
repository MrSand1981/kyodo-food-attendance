import { describe, it, expect, beforeEach } from 'vitest';
import db from '../server/db';
import { formatVND, convertVNDToWords } from '../src/utils/currency';

describe('Shift Cash Handover (Bàn Giao Tiền Ca Sau)', () => {
  it('should create a valid cash handover slip and retrieve it', () => {
    const handover = db.createCashHandover({
      giverId: 'admin',
      receiverId: '',
      receiverName: 'Nguyễn Văn A',
      date: '2026-11-04',
      time: '12:00',
      shift: 'Ca Sáng ➔ Ca Chiều',
      totalAmount: 1850000,
      totalBills: 15,
      amountInWords: convertVNDToWords(1850000),
      breakdown: { '500000': 3, '200000': 1, '100000': 1, '50000': 1 },
      note: 'Tiền két bàn giao ca sáng đầy đủ',
    });

    expect(handover).toBeDefined();
    expect(handover.id).toMatch(/^handover-/);
    expect(handover.totalAmount).toBe(1850000);
    expect(handover.totalBills).toBe(15);
    expect(handover.receiverName).toBe('Nguyễn Văn A');

    // Retrieve by month
    const list = db.getCashHandovers(null, '2026-11');
    const found = list.find((h: any) => h.id === handover.id);
    expect(found).toBeDefined();
    expect(found.shift).toBe('Ca Sáng ➔ Ca Chiều');

    // Clean up test record
    const deleted = db.deleteCashHandover(handover.id);
    expect(deleted).toBe(true);

    const afterDelete = db.getCashHandovers(null, '2026-11').find((h: any) => h.id === handover.id);
    expect(afterDelete).toBeUndefined();
  });

  it('should format VND and convert to words properly for handover slips', () => {
    const amount = 3450000;
    expect(formatVND(amount)).toBe('3.450.000 đ');
    expect(convertVNDToWords(amount)).toBe('Ba triệu bốn trăm năm mươi nghìn đồng');
  });
});
