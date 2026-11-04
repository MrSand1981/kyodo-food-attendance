import { describe, it, expect } from 'vitest';
import db from '../server/db';
import { formatVND, convertVNDToWords } from '../src/utils/currency';
import { formatDateVN, getDayOfWeekNameSafe } from '../src/utils/date';

describe('Shift Cash Handover (Bàn Giao Tiền Ca Sau & Đối Chiếu Theo Ngày)', () => {
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

  it('should group handovers accurately by date for daily reconciliation', () => {
    const handovers = [
      { id: '1', date: '2026-11-04', time: '17:00', shift: 'Ca Sáng', totalAmount: 1200000, totalBills: 10 },
      { id: '2', date: '2026-11-04', time: '22:00', shift: 'Ca Chiều', totalAmount: 1500000, totalBills: 15 },
      { id: '3', date: '2026-11-03', time: '22:00', shift: 'Ca Chiều', totalAmount: 2000000, totalBills: 20 },
    ];

    const map = new Map();
    handovers.forEach((item) => {
      const d = item.date;
      if (!map.has(d)) {
        map.set(d, { date: d, totalAmount: 0, totalBills: 0, shifts: [] });
      }
      const grp = map.get(d);
      grp.totalAmount += item.totalAmount;
      grp.totalBills += item.totalBills;
      grp.shifts.push(item);
    });

    const sortedDays = Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));

    expect(sortedDays.length).toBe(2);
    expect(sortedDays[0].date).toBe('2026-11-04');
    expect(sortedDays[0].totalAmount).toBe(2700000);
    expect(sortedDays[0].totalBills).toBe(25);
    expect(sortedDays[0].shifts.length).toBe(2);

    expect(sortedDays[1].date).toBe('2026-11-03');
    expect(sortedDays[1].totalAmount).toBe(2000000);
    expect(sortedDays[1].shifts.length).toBe(1);

    expect(formatDateVN(sortedDays[0].date)).toBe('04/11/2026');
    expect(getDayOfWeekNameSafe(sortedDays[0].date)).toBe('Thứ 4');
  });
});
