// tests/api-and-timezone-fixes.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
// @ts-ignore
import request from 'supertest';
// @ts-ignore
import db from '../server/db';
// @ts-ignore
import app from '../server/server';
// @ts-ignore
import { generateToken } from '../server/auth';
import { api } from '../src/utils/api';

describe('P0 Fixes: Excel Export, Auth Delete, Login Retry & Vietnam Timezone', () => {
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = window.localStorage;
  let memoryStorage: Record<string, string> = {};

  const installMockStorage = () => {
    memoryStorage = {};
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      writable: true,
      value: {
        getItem: (k: string) => (k in memoryStorage ? memoryStorage[k] : null),
        setItem: (k: string, v: string) => {
          memoryStorage[k] = String(v);
        },
        removeItem: (k: string) => {
          delete memoryStorage[k];
        },
        clear: () => {
          memoryStorage = {};
        },
      },
    });
  };

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    if (originalLocalStorage) {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        writable: true,
        value: originalLocalStorage,
      });
    }
  });

  describe('1. Secure Excel Export without JWT in URL', () => {
    it('sends Authorization header via fetch instead of ?token= query param', async () => {
      installMockStorage();
      window.localStorage.setItem('kyodo_token', 'secret-jwt-token');
      const mockBlob = new Blob(['excel-binary'], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({
          'Content-Disposition':
            'attachment; filename="Bang_Cham_Cong_Kyodo_Trung_Nu_Vuong_2027-02.xlsx"',
        }),
        blob: async () => mockBlob,
      });
      globalThis.fetch = fetchSpy as any;

      const result = await api.exportAttendanceExcel('2027-02');

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [calledUrl, calledConfig] = fetchSpy.mock.calls[0];
      expect(calledUrl).toBe('/api/attendance/export-excel?month=2027-02');
      expect(calledUrl).not.toContain('token=');
      expect(calledConfig.headers.Authorization).toBe('Bearer secret-jwt-token');
      expect(calledConfig.credentials).toBe('include');
      expect(result.filename).toBe('Bang_Cham_Cong_Kyodo_Trung_Nu_Vuong_2027-02.xlsx');
      expect(result.blob).toBe(mockBlob);
    });

    it('clears expired token on 401 and rejects without retrying', async () => {
      installMockStorage();
      window.localStorage.setItem('kyodo_token', 'expired-token');
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ success: false, message: 'Phiên đăng nhập hết hạn' }),
      });
      globalThis.fetch = fetchSpy as any;

      await expect(api.exportAttendanceExcel('2027-02')).rejects.toThrow('Phiên đăng nhập hết hạn');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(window.localStorage.getItem('kyodo_token')).toBeNull();
    });

    it('accepts Bearer token and rejects query-only token on Express /api/attendance/export-excel', async () => {
      const resQueryOnly = await request(app).get(
        '/api/attendance/export-excel?month=2026-11&token=fake-token'
      );
      expect(resQueryOnly.status).toBe(403);

      const adminToken = generateToken(
        { id: 'admin', username: 'Admin', name: 'Chủ Cửa Hàng' },
        'admin'
      );
      const resAuth = await request(app)
        .get('/api/attendance/export-excel?month=2026-11')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(resAuth.status).toBe(200);
      expect(resAuth.headers['content-type']).toContain(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(resAuth.headers['content-disposition']).toContain(
        'Bang_Cham_Cong_Kyodo_Trung_Nu_Vuong_2026-11.xlsx'
      );
    });
  });

  describe('2. Makeup & Attendance Delete Authorization', () => {
    it('prevents employees from deleting completed/approved shifts via deleteMakeupAttendance while allowing pending/rejected cleanup', () => {
      const employees = db.getEmployees();
      const targetEmp = employees[0];
      const otherEmp = employees[1] || employees[0];
      expect(targetEmp).toBeDefined();

      const createdIds: string[] = [];
      try {
        // Past date creates a pending makeup request
        const pendingRec = db.recordDailyWork({
          employeeId: targetEmp.id,
          date: '2025-01-10',
          startTime: '08:00',
          endTime: '12:00',
          hours: 4,
          note: 'test-pending-cleanup',
        });
        createdIds.push(pendingRec.id);
        expect(pendingRec.status).toBe('pending');

        // Another employee cannot delete it
        if (otherEmp.id !== targetEmp.id && otherEmp.username !== targetEmp.username) {
          expect(() =>
            db.deleteMakeupAttendance(pendingRec.id, {
              id: otherEmp.id,
              username: otherEmp.username,
              role: 'employee',
            })
          ).toThrow('không có quyền');
        }

        // Approve it -> status becomes 'completed'
        db.approveMakeupAttendance(pendingRec.id, { username: 'Admin', name: 'Admin' });

        // Employee MUST NOT delete an already approved record
        expect(() =>
          db.deleteMakeupAttendance(pendingRec.id, {
            id: targetEmp.id,
            username: targetEmp.username,
            role: 'employee',
          })
        ).toThrow('Ca đã duyệt chỉ Quản lý mới được xóa');

        // Admin CAN delete it
        const deletedByAdmin = db.deleteMakeupAttendance(pendingRec.id, {
          id: 'admin',
          username: 'Admin',
          role: 'admin',
        });
        expect(deletedByAdmin).toBe(true);

        // Employee CAN cancel a pending makeup request and dismiss a rejected one
        const pendingForCancel = db.recordDailyWork({
          employeeId: targetEmp.id,
          date: '2025-01-11',
          startTime: '13:00',
          endTime: '17:00',
          hours: 4,
          note: 'test-self-cancel',
        });
        createdIds.push(pendingForCancel.id);

        expect(
          db.deleteMakeupAttendance(pendingForCancel.id, {
            id: targetEmp.id,
            username: targetEmp.username,
            role: 'employee',
          })
        ).toBe(true);

        const toReject = db.recordDailyWork({
          employeeId: targetEmp.id,
          date: '2025-01-12',
          startTime: '08:00',
          endTime: '12:00',
          hours: 4,
          note: 'test-rejected-cleanup',
        });
        createdIds.push(toReject.id);
        db.rejectMakeupAttendance(toReject.id, { username: 'Admin' }, 'Không hợp lệ');

        expect(
          db.deleteMakeupAttendance(toReject.id, {
            id: targetEmp.id,
            username: targetEmp.username,
            role: 'employee',
          })
        ).toBe(true);
      } finally {
        createdIds.forEach((id) => db.deleteAttendance(id));
      }
    });

    it('returns 403 over HTTP when an employee tries to delete an approved makeup record', async () => {
      const targetEmp = db.getEmployees()[0];
      const rec = db.recordDailyWork({
        employeeId: targetEmp.id,
        date: '2025-01-14',
        startTime: '08:00',
        endTime: '12:00',
        hours: 4,
        note: 'http-403-test',
      });
      try {
        db.approveMakeupAttendance(rec.id, { username: 'Admin' });
        const empToken = generateToken(targetEmp, 'employee');

        const res = await request(app)
          .delete(`/api/attendance/makeup-requests/${rec.id}`)
          .set('Authorization', `Bearer ${empToken}`);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      } finally {
        db.deleteAttendance(rec.id);
      }
    });
  });

  describe('3. No Amplified Lockouts on Login Failure', () => {
    it('does not retry login or any 4xx/POST errors', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ success: false, message: 'Mật khẩu không chính xác!' }),
      });
      globalThis.fetch = fetchSpy as any;

      await expect(api.login({ username: 'admin', password: 'wrong' })).rejects.toThrow(
        'Mật khẩu không chính xác!'
      );
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('still retries GET requests on transient network failure', async () => {
      const fetchSpy = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network temporary blip'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ success: true, settings: { storeName: 'Kyodo' } }),
        });
      globalThis.fetch = fetchSpy as any;

      const data = await api.getSettings();
      expect(data.settings.storeName).toBe('Kyodo');
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('4. Vietnam Timezone Accuracy (00:00 - 06:59 GMT+7)', () => {
    it('resolves Vietnam date and HH:MM cleanly during early morning (00:00 - 06:59 VN)', () => {
      // 2026-11-12T18:30:00.000Z === 2026-11-13 01:30:00 (Asia/Ho_Chi_Minh)
      const earlyMorningVN = new Date('2026-11-12T18:30:00.000Z');
      expect(db.getVietnamTodayYMD(earlyMorningVN)).toBe('2026-11-13');
      expect(db.formatVietnamTimeHM(earlyMorningVN)).toBe('01:30');

      // 2026-11-12T17:05:00.000Z === 2026-11-13 00:05:00 (Asia/Ho_Chi_Minh)
      expect(db.formatVietnamTimeHM('2026-11-12T17:05:00.000Z')).toBe('00:05');
    });

    it('records Vietnam date on checkIn and requestSalaryAdvance during 00:00 - 06:59 VN', () => {
      const emp = db.getEmployees().find((e: any) => !db.getActiveShift(e.id));
      expect(emp).toBeDefined();

      vi.useFakeTimers();
      // 01:30 sáng ngày 13/11/2026 giờ VN (đang là 18:30 ngày 12/11 giờ UTC)
      vi.setSystemTime(new Date('2026-11-12T18:30:00.000Z'));

      let shiftId: string | null = null;
      let advId: string | null = null;
      try {
        const shift = db.checkIn({ employeeId: emp.id, shiftCode: 'TOI', note: 'tz-checkin' });
        shiftId = shift.id;
        expect(shift.date).toBe('2026-11-13');

        const adv = db.requestSalaryAdvance({
          employeeId: emp.id,
          amount: 100000,
          reason: 'tz-advance',
        });
        advId = adv.id;
        expect(adv.date).toBe('2026-11-13');
        expect(adv.salaryMonth).toBe('2026-11');
      } finally {
        if (shiftId) db.deleteAttendance(shiftId);
        if (advId) db.deleteSalaryAdvance(advId);
      }
    });

    it('counts multi-day leaves across >31 day range accurately without timezone drift', () => {
      const leaves = [
        { date: '2027-01-25', endDate: '2027-03-05' }, // Spans across Jan, full Feb (28 days), and 5 days in Mar
      ];
      expect(db.countLeaveDaysInMonth(leaves, '2027-01')).toBe(7);
      expect(db.countLeaveDaysInMonth(leaves, '2027-02')).toBe(28);
      expect(db.countLeaveDaysInMonth(leaves, '2027-03')).toBe(5);
    });
  });
});
