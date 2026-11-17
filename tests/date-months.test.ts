// tests/date-months.test.ts
import { describe, it, expect } from 'vitest';
import { addMonthsYM, getSelectableMonths, getSelectableHolidayYears } from '../src/utils/date';

describe('Dynamic Month & Year Selector Utilities', () => {
  it('adds and subtracts YYYY-MM strings accurately across year boundaries', () => {
    expect(addMonthsYM('2026-11', 0)).toBe('2026-11');
    expect(addMonthsYM('2026-11', 2)).toBe('2027-01');
    expect(addMonthsYM('2026-12', 1)).toBe('2027-01');
    expect(addMonthsYM('2027-01', 1)).toBe('2027-02');
    expect(addMonthsYM('2027-02', 2)).toBe('2027-04');
    expect(addMonthsYM('2027-01', -1)).toBe('2026-12');
    expect(addMonthsYM('2027-02', -3)).toBe('2026-11');
    expect(addMonthsYM('invalid', 1)).toBe('');
    expect(addMonthsYM('2027-13', 1)).toBe('');
  });

  it('includes months past 2027-01 automatically when current month advances to 2027-02 and beyond', () => {
    const feb2027 = getSelectableMonths({ currentYM: '2027-02', selectedMonth: '2027-02' });
    const values = feb2027.map((item) => item.value);

    expect(values).toContain('2027-04');
    expect(values).toContain('2027-03');
    expect(values).toContain('2027-02');
    expect(values).toContain('2027-01');
    expect(values).toContain('2026-11');
    expect(values).toContain('2026-08');

    // Newest first ordering
    expect(values[0]).toBe('2027-04');
    expect(values[values.length - 1]).toBe('2026-08');

    const currentItem = feb2027.find((item) => item.value === '2027-02');
    expect(currentItem?.label).toBe('Tháng 02/2027 (Hiện tại)');

    const launchItem = feb2027.find((item) => item.value === '2026-11');
    expect(launchItem?.label).toBe('Tháng 11/2026 (Bắt đầu sử dụng)');
  });

  it('keeps working seamlessly into 2028 and 2029', () => {
    const dec2028 = getSelectableMonths({ currentYM: '2028-12', selectedMonth: '2028-12' });
    const values = dec2028.map((item) => item.value);

    expect(values[0]).toBe('2029-02');
    expect(values).toContain('2029-01');
    expect(values).toContain('2028-12');
    expect(values).toContain('2027-02');
    expect(values[values.length - 1]).toBe('2026-08');
  });

  it('preserves out-of-range selectedMonth and formats combined current+launch label cleanly', () => {
    const nov2026 = getSelectableMonths({
      currentYM: '2026-11',
      selectedMonth: '2026-04',
    });
    const values = nov2026.map((item) => item.value);

    expect(values).toContain('2026-04');
    expect(values[0]).toBe('2027-01');
    expect(values[values.length - 1]).toBe('2026-04');

    const novItem = nov2026.find((item) => item.value === '2026-11');
    expect(novItem?.label).toBe('Tháng 11/2026 (Hiện tại • Bắt đầu sử dụng)');
  });

  it('generates dynamic holiday year filter options past 2027', () => {
    expect(getSelectableHolidayYears({ currentYear: 2026 })).toEqual(['2026', '2027', 'all']);
    expect(getSelectableHolidayYears({ currentYear: 2027 })).toEqual([
      '2026',
      '2027',
      '2028',
      'all',
    ]);
    expect(getSelectableHolidayYears({ currentYear: 2029 })).toEqual([
      '2026',
      '2027',
      '2028',
      '2029',
      '2030',
      'all',
    ]);
  });
});
