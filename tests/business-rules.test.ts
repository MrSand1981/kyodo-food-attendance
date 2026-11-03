import { describe, it, expect } from 'vitest';
import {
  getSalaryMonthForAdvance,
  formatDateVN,
  formatMonthVN,
  formatShortTime,
  getAdvanceCycleRange,
  getAdvanceCycleExplanation,
  checkShiftOverlap,
  calculateHours,
  getShiftNameFromTime,
  countLeaveDaysInMonth,
  calculateMonthlyAbsenceDays,
  calculateMonthlySalary,
  formatVND,
  formatVNDWithUnit,
} from '../src/shared/business-rules';

describe('Business Rules', () => {
  describe('getSalaryMonthForAdvance', () => {
    it('should return previous month for days 1-5', () => {
      expect(getSalaryMonthForAdvance('2026-11-01')).toBe('2026-10');
      expect(getSalaryMonthForAdvance('2026-11-05')).toBe('2026-10');
    });

    it('should return current month for days 6+', () => {
      expect(getSalaryMonthForAdvance('2026-11-06')).toBe('2026-11');
      expect(getSalaryMonthForAdvance('2026-11-30')).toBe('2026-11');
    });

    it('should handle year boundary', () => {
      expect(getSalaryMonthForAdvance('2026-01-03')).toBe('2025-12');
      expect(getSalaryMonthForAdvance('2026-01-10')).toBe('2026-01');
    });

    it('should handle DD/MM/YYYY format', () => {
      expect(getSalaryMonthForAdvance('03/11/2026')).toBe('2026-10');
      expect(getSalaryMonthForAdvance('10/11/2026')).toBe('2026-11');
    });
  });

  describe('formatDateVN', () => {
    it('should format YYYY-MM-DD to DD/MM/YYYY', () => {
      expect(formatDateVN('2026-11-30')).toBe('30/11/2026');
      expect(formatDateVN('2026-01-05')).toBe('05/01/2026');
    });

    it('should format ISO strings', () => {
      expect(formatDateVN('2026-11-30T10:30:00')).toBe('30/11/2026');
    });

    it('should handle YYYY-MM format', () => {
      expect(formatDateVN('2026-11')).toBe('11/2026');
    });
  });

  describe('formatMonthVN', () => {
    it('should format YYYY-MM to Tháng MM/YYYY', () => {
      expect(formatMonthVN('2026-11')).toBe('Tháng 11/2026');
      expect(formatMonthVN('2026-01')).toBe('Tháng 01/2026');
    });
  });

  describe('calculateHours', () => {
    it('should calculate hours correctly', () => {
      expect(calculateHours('08:00', '17:00')).toBe(9);
      expect(calculateHours('17:00', '22:00')).toBe(5);
      expect(calculateHours('08:00', '12:00')).toBe(4);
    });

    it('should handle overnight shifts', () => {
      expect(calculateHours('21:00', '02:00')).toBe(5);
      expect(calculateHours('22:00', '06:00')).toBe(8);
    });

    it('should round minutes', () => {
      expect(calculateHours('08:00', '13:10')).toBe(5); // 5h10m -> 5h
      expect(calculateHours('08:00', '13:50')).toBe(6); // 5h50m -> 6h
    });

    it('should minimum 1 hour', () => {
      expect(calculateHours('08:00', '08:30')).toBe(1);
    });
  });

  describe('checkShiftOverlap', () => {
    const mockRecords = [
      {
        id: '1',
        date: '2026-11-15',
        checkIn: '2026-11-15T08:00:00+07:00',
        checkOut: '2026-11-15T12:00:00+07:00',
        status: 'completed',
        totalHours: 4,
      },
      {
        id: '2',
        date: '2026-11-15',
        checkIn: '2026-11-15T13:00:00+07:00',
        checkOut: '2026-11-15T17:00:00+07:00',
        status: 'completed',
        totalHours: 4,
      },
    ];

    it('should detect exact duplicate', () => {
      const result = checkShiftOverlap('2026-11-15', '08:00', '12:00', mockRecords);
      expect(result.hasOverlap).toBe(true);
      expect(result.errorMessage).toContain('Trùng lặp thời gian');
    });

    it('should detect overlap', () => {
      const result = checkShiftOverlap('2026-11-15', '10:00', '14:00', mockRecords);
      expect(result.hasOverlap).toBe(true);
      expect(result.errorMessage).toContain('giao thoa');
    });

    it('should allow non-overlapping shifts', () => {
      const result = checkShiftOverlap('2026-11-15', '17:00', '22:00', mockRecords);
      expect(result.hasOverlap).toBe(false);
    });

    it('should allow different dates', () => {
      const result = checkShiftOverlap('2026-11-16', '08:00', '12:00', mockRecords);
      expect(result.hasOverlap).toBe(false);
    });
  });

  describe('getShiftNameFromTime', () => {
    it('should return standard shift names', () => {
      expect(getShiftNameFromTime('08:00', '17:00')).toBe('Ca Sáng');
      expect(getShiftNameFromTime('17:00', '22:00')).toBe('Ca Chiều');
    });

    it('should return custom shift name', () => {
      expect(getShiftNameFromTime('09:00', '14:00')).toBe('Ca 09:00-14:00');
    });
  });

  describe('countLeaveDaysInMonth', () => {
    it('should count unique leave days', () => {
      const leaves = [
        { date: '2026-11-10', endDate: '2026-11-12' },
        { date: '2026-11-15', endDate: '2026-11-15' },
        { date: '2026-11-20', endDate: '2026-11-22' },
      ];
      expect(countLeaveDaysInMonth(leaves, '2026-11')).toBe(7); // 3 + 1 + 3
    });

    it('should handle overlapping leave ranges', () => {
      const leaves = [
        { date: '2026-11-10', endDate: '2026-11-15' },
        { date: '2026-11-12', endDate: '2026-11-18' },
      ];
      expect(countLeaveDaysInMonth(leaves, '2026-11')).toBe(9); // 10-18 = 9 days unique
    });

    it('should filter by month', () => {
      const leaves = [
        { date: '2026-10-28', endDate: '2026-11-02' },
        { date: '2026-11-10', endDate: '2026-11-12' },
      ];
      expect(countLeaveDaysInMonth(leaves, '2026-11')).toBe(5); // 1-2 (2 days) + 10-12 (3 days) = 5
    });
  });

  describe('calculateMonthlyAbsenceDays', () => {
    it('should count past days with no attendance as days off when transitioning to next day', () => {
      // Month: 2026-11, Worked only Day 1, Today is Day 3 (2026-11-03)
      // Day 1: Worked -> NOT off
      // Day 2: Past with no attendance -> DAY OFF
      // Day 3: Today -> NOT off yet
      const res = calculateMonthlyAbsenceDays('2026-11', ['2026-11-01'], [], '2026-11-03');
      expect(res.totalLeaveDays).toBe(1);
      expect(res.absenceDates).toEqual(['2026-11-02']);
      expect(res.leaveDates).toEqual(['2026-11-02']);
    });

    it('should not count today as a day off yet because work is in progress', () => {
      // If today is 2026-11-03 and no shifts logged yet today, today is not off
      const res = calculateMonthlyAbsenceDays(
        '2026-11',
        ['2026-11-01', '2026-11-02'],
        [],
        '2026-11-03'
      );
      expect(res.totalLeaveDays).toBe(0);
      expect(res.leaveDates).toEqual([]);
    });

    it('should exclude day from days off when makeup attendance (chấm công bù) is recorded', () => {
      // Before makeup: Day 2 is counted as day off
      const before = calculateMonthlyAbsenceDays('2026-11', ['2026-11-01'], [], '2026-11-03');
      expect(before.totalLeaveDays).toBe(1);
      expect(before.absenceDates).toContain('2026-11-02');

      // After employee adds makeup shift for Day 2 (2026-11-02)
      const after = calculateMonthlyAbsenceDays(
        '2026-11',
        ['2026-11-01', '2026-11-02'],
        [],
        '2026-11-03'
      );
      expect(after.totalLeaveDays).toBe(0);
      expect(after.absenceDates).not.toContain('2026-11-02');
      expect(after.leaveDates).toEqual([]);
    });

    it('should combine past auto absence and future registered leave without double counting', () => {
      const futureLeaves = [{ date: '2026-11-10', endDate: '2026-11-11' }];
      const res = calculateMonthlyAbsenceDays(
        '2026-11',
        ['2026-11-01'],
        futureLeaves,
        '2026-11-03'
      );
      // Past day off: 2026-11-02 (1 day)
      // Future registered: 2026-11-10, 2026-11-11 (2 days)
      expect(res.totalLeaveDays).toBe(3);
      expect(res.absenceDates).toEqual(['2026-11-02']);
      expect(res.registeredLeaveDates).toEqual(['2026-11-10', '2026-11-11']);
      expect(res.leaveDates).toEqual(['2026-11-02', '2026-11-10', '2026-11-11']);
    });

    it('should exclude registered leave date if employee actually worked or submitted makeup shift on that date', () => {
      const leaves = [{ date: '2026-11-02', endDate: '2026-11-02' }];
      // Employee registered leave for Nov 2, but then actually worked or submitted makeup attendance on Nov 2
      const res = calculateMonthlyAbsenceDays(
        '2026-11',
        ['2026-11-01', '2026-11-02'],
        leaves,
        '2026-11-03'
      );
      expect(res.totalLeaveDays).toBe(0);
      expect(res.leaveDates).toEqual([]);
    });
  });

  describe('calculateMonthlySalary', () => {
    it('should calculate gross and net correctly', () => {
      const result = calculateMonthlySalary(160, 25000, 500000);
      expect(result.gross).toBe(4000000);
      expect(result.net).toBe(3500000);
      expect(result.advanceTotal).toBe(500000);
    });

    it('should handle zero advances', () => {
      const result = calculateMonthlySalary(160, 25000, 0);
      expect(result.gross).toBe(4000000);
      expect(result.net).toBe(4000000);
    });
  });

  describe('formatVND', () => {
    it('should format numbers with Vietnamese locale', () => {
      expect(formatVND(1000000)).toBe('1.000.000');
      expect(formatVND(25000)).toBe('25.000');
      expect(formatVND(0)).toBe('0');
    });
  });

  describe('formatVNDWithUnit', () => {
    it('should append đ unit', () => {
      expect(formatVNDWithUnit(1000000)).toBe('1.000.000 đ');
      expect(formatVNDWithUnit(25000)).toBe('25.000 đ');
    });
  });

  describe('getAdvanceCycleRange', () => {
    it('should return correct range for a month', () => {
      expect(getAdvanceCycleRange('2026-11')).toBe('Từ 06/11/2026 đến 05/12/2026');
      expect(getAdvanceCycleRange('2026-12')).toBe('Từ 06/12/2026 đến 05/01/2027');
    });
  });

  describe('getAdvanceCycleExplanation', () => {
    it('should explain before 5th', () => {
      const result = getAdvanceCycleExplanation('2026-11-03');
      expect(result?.isBeforeOrOn5th).toBe(true);
      expect(result?.note).toContain('ứng trước ngày 05');
    });

    it('should explain after 5th', () => {
      const result = getAdvanceCycleExplanation('2026-11-10');
      expect(result?.isBeforeOrOn5th).toBe(false);
      expect(result?.note).toContain('ứng từ ngày 06');
    });
  });

  describe('formatShortTime', () => {
    it('should format ISO time to HH:mm', () => {
      expect(formatShortTime('2026-11-15T08:30:00+07:00')).toBe('08:30');
      expect(formatShortTime('2026-11-15T17:05:00+07:00')).toBe('17:05');
    });

    it('should handle invalid dates', () => {
      expect(formatShortTime('invalid')).toBe('--:--');
      expect(formatShortTime('')).toBe('--:--');
    });
  });
});
