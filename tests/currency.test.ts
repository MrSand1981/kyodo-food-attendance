// tests/currency.test.ts
import { describe, it, expect } from 'vitest';
import { DENOMINATIONS, formatVND, convertVNDToWords } from '../src/utils/currency';

describe('Currency and Cash Counting Utilities', () => {
  it('should have all 9 standard Vietnamese denominations from 1k to 500k', () => {
    expect(DENOMINATIONS).toHaveLength(9);
    const values = DENOMINATIONS.map((d) => d.value);
    expect(values).toEqual([500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000]);
  });

  it('should format VND properly with thousands separator', () => {
    expect(formatVND(0)).toBe('0 đ');
    expect(formatVND(1000)).toBe('1.000 đ');
    expect(formatVND(500000)).toBe('500.000 đ');
    expect(formatVND(15420000)).toBe('15.420.000 đ');
  });

  it('should convert VND amounts into accurate Vietnamese words', () => {
    expect(convertVNDToWords(0)).toBe('Không đồng');
    expect(convertVNDToWords(1000)).toBe('Một nghìn đồng');
    expect(convertVNDToWords(5000)).toBe('Năm nghìn đồng');
    expect(convertVNDToWords(15000)).toBe('Mười lăm nghìn đồng');
    expect(convertVNDToWords(21000)).toBe('Hai mươi mốt nghìn đồng');
    expect(convertVNDToWords(105000)).toBe('Một trăm linh năm nghìn đồng');
    expect(convertVNDToWords(500000)).toBe('Năm trăm nghìn đồng');
    expect(convertVNDToWords(1500000)).toBe('Một triệu năm trăm nghìn đồng');
    expect(convertVNDToWords(15420000)).toBe('Mười lăm triệu bốn trăm hai mươi nghìn đồng');
  });

  it('should calculate grand total for denomination counts accurately', () => {
    const counts = {
      500000: 10, // 5.000.000
      200000: 5,  // 1.000.000
      100000: 20, // 2.000.000
      50000: 10,  // 500.000
      20000: 10,  // 200.000
      10000: 15,  // 150.000
      5000: 8,    // 40.000
      2000: 10,   // 20.000
      1000: 10,   // 10.000
    };

    let totalBills = 0;
    let totalAmount = 0;

    DENOMINATIONS.forEach((d) => {
      const c = counts[d.value] || 0;
      totalBills += c;
      totalAmount += c * d.value;
    });

    expect(totalBills).toBe(10 + 5 + 20 + 10 + 10 + 15 + 8 + 10 + 10); // 98 bills
    expect(totalAmount).toBe(8920000); // 8.920.000 đ
    expect(convertVNDToWords(totalAmount)).toBe('Tám triệu chín trăm hai mươi nghìn đồng');
  });
});
