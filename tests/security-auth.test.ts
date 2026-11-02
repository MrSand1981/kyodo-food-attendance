import { describe, it, expect } from 'vitest';
// @ts-ignore
import db from '../server/db';
// @ts-ignore
import {
  generateToken,
  verifyToken,
  requireAuth,
  requireAdmin,
  requireSelfOrAdmin,
} from '../server/auth';

describe('Security & Authentication Tests', () => {
  it('should hash passwords using bcrypt format ($2a$ or $2b$)', () => {
    const rawPass = 'testPass123';
    const hash = db.hashPassword(rawPass);
    expect(hash).not.toBe(rawPass);
    expect(db.isBcryptHash(hash)).toBe(true);
    expect(db.comparePasswords(rawPass, hash)).toBe(true);
    expect(db.comparePasswords('wrongPass', hash)).toBe(false);
  });

  it('should allow admin to view employee password and profile in getEmployees', () => {
    const employees = db.getEmployees(true);
    expect(employees.length).toBeGreaterThan(0);
    employees.forEach((emp: any) => {
      expect(emp.password).toBeDefined();
      expect(typeof emp.password).toBe('string');
      expect(emp.phone).toBeDefined();
    });
  });

  it('should never expose admin password in getSettings', () => {
    const settings = db.getSettings();
    expect(settings.adminPassword).toBeUndefined();
  });

  it('should authenticate Admin, Út, and Bảo with valid credentials', () => {
    const adminAuth = db.authenticateUser('admin', 'Kyodo@DN2026');
    expect(adminAuth.role).toBe('admin');
    expect(adminAuth.user.username).toBe('Admin');

    const ut = db.getEmployees().find((e: any) => e.username === 'UTNVTNV' || e.code === 'UTNVTNV');
    const utPwd = ut?.password || 'Ut@Kyodo2026';
    const utAuth = db.authenticateUser('UTNVTNV', utPwd);
    expect(utAuth.role).toBe('employee');
    expect(utAuth.user.name).toBe('Út');

    const bao = db
      .getEmployees()
      .find((e: any) => e.username === 'BAONVTNV' || e.code === 'BAONVTNV');
    const baoPwd = bao?.password || 'Bao@Kyodo2026';
    const baoAuth = db.authenticateUser('BAONVTNV', baoPwd);
    expect(baoAuth.role).toBe('employee');
    expect(baoAuth.user.name).toBe('Bảo');
  });

  it('should reject invalid and rotated historical passwords for Admin and Employees', () => {
    expect(() => db.authenticateUser('admin', 'wrongpass')).toThrow();
    expect(() => db.authenticateUser('admin', '20162020')).toThrow(); // Mật khẩu cũ đã lộ phải bị từ chối
    expect(() => db.authenticateUser('UTNVTNV', 'wrongpass')).toThrow();
    expect(() => db.authenticateUser('UTNVTNV', '2008')).toThrow(); // Mật khẩu cũ đã lộ của Út phải bị từ chối
    expect(() => db.authenticateUser('BAONVTNV', '1234')).toThrow();
    expect(() => db.authenticateUser('BAONVTNV', 'nhatbaodeptrai03')).toThrow(); // Mật khẩu cũ đã lộ của Bảo phải bị từ chối
  });

  it('should generate and verify tamper-proof JWT tokens', () => {
    const user = { username: 'Admin', role: 'admin', name: 'Chủ Cửa Hàng' };
    const token = generateToken(user, 'admin');
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded.role).toBe('admin');
    expect(decoded.username).toBe('Admin');

    // Tampered token must fail verification
    const tampered = token.slice(0, -5) + 'xxxxx';
    expect(verifyToken(tampered)).toBeNull();
  });

  it('should enforce requireAdmin middleware and reject static key bypass', () => {
    // 1. Unauthenticated request
    let status = 200;
    let jsonResult: any = null;
    let nextCalled = false;
    const reqUnauth: any = { headers: { 'x-admin-key': '20162020' } };
    const resUnauth: any = {
      status: (s: number) => {
        status = s;
        return resUnauth;
      },
      json: (data: any) => {
        jsonResult = data;
      },
    };
    const nextUnauth = () => {
      nextCalled = true;
    };

    requireAdmin(reqUnauth, resUnauth, nextUnauth);
    expect(nextCalled).toBe(false);
    expect(status).toBe(403);
    expect(jsonResult.success).toBe(false);

    // 2. Employee role (must be rejected from admin actions)
    status = 200;
    nextCalled = false;
    const reqEmp: any = { user: { role: 'employee', username: 'UTNVTNV' } };
    requireAdmin(reqEmp, resUnauth, nextUnauth);
    expect(nextCalled).toBe(false);
    expect(status).toBe(403);

    // 3. Admin role (must be permitted)
    nextCalled = false;
    const reqAdmin: any = { user: { role: 'admin', username: 'Admin' } };
    requireAdmin(reqAdmin, resUnauth, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
  });

  it('should prevent IDOR (Insecure Direct Object Reference) across employees', () => {
    const middleware = requireSelfOrAdmin('employeeId');

    // 1. Employee Út attempting to modify Bảo's work/attendance
    let status = 200;
    let jsonResult: any = null;
    let nextCalled = false;
    const reqAttack: any = {
      user: { role: 'employee', username: 'UTNVTNV', id: 'emp-ut' },
      body: { employeeId: 'BAONVTNV' },
      params: {},
      query: {},
    };
    const resMock: any = {
      status: (s: number) => {
        status = s;
        return resMock;
      },
      json: (data: any) => {
        jsonResult = data;
      },
    };
    middleware(reqAttack, resMock, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(false);
    expect(status).toBe(403);
    expect(jsonResult.message).toContain('không có quyền thao tác');

    // 2. Employee Út modifying their own work (allowed)
    nextCalled = false;
    const reqSelf: any = {
      user: { role: 'employee', username: 'UTNVTNV', id: 'emp-ut' },
      body: { employeeId: 'UTNVTNV' },
      params: {},
      query: {},
    };
    middleware(reqSelf, resMock, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);

    // 3. Admin modifying any employee work (allowed)
    nextCalled = false;
    const reqAdmin: any = {
      user: { role: 'admin', username: 'Admin', id: 'admin-id' },
      body: { employeeId: 'BAONVTNV' },
      params: {},
      query: {},
    };
    middleware(reqAdmin, resMock, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
  });

  it('should enforce requireAuth middleware for unauthenticated sessions', () => {
    let status = 200;
    let nextCalled = false;
    const req: any = {};
    const res: any = {
      status: (s: number) => {
        status = s;
        return res;
      },
      json: () => {},
    };
    requireAuth(req, res, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(false);
    expect(status).toBe(401);
  });

  it('should NEVER leak adminEmail or adminPhone to unauthenticated calls in getAdminProfileStatus', () => {
    // 1. Unauthenticated / Public call (false)
    const publicStatus = db.getAdminProfileStatus(false);
    expect(publicStatus.adminEmail).toBeUndefined();
    expect(publicStatus.adminPhone).toBeUndefined();
    expect(publicStatus.isDefaultPassword).toBeUndefined();
    expect(publicStatus.maskedEmail).toBeDefined();
    expect(publicStatus.maskedEmail).toContain('*');
    expect(publicStatus.maskedPhone).toBeDefined();
    expect(publicStatus.maskedPhone).toContain('*');
    expect(publicStatus.hasEmail).toBe(true);
    expect(publicStatus.hasPhone).toBe(true);

    // 2. Authenticated Admin call (true)
    const adminStatus = db.getAdminProfileStatus(true);
    expect(adminStatus.adminEmail).toBeDefined();
    expect(adminStatus.adminEmail.length).toBeGreaterThan(0);
    expect(adminStatus.adminPhone).toBeDefined();
    expect(adminStatus.adminPhone.length).toBeGreaterThan(0);
  });

  it('should sanitize settings and never leak admin contacts or credentials to public getSettings', () => {
    // Public call: getSettings(false)
    const publicSettings = db.getSettings(false);
    expect(publicSettings.adminPassword).toBeUndefined();
    expect(publicSettings.adminEmail).toBeUndefined();
    expect(publicSettings.adminPhone).toBeUndefined();
    expect(publicSettings.telegram).toBeUndefined();
    expect(publicSettings.zalo).toBeUndefined();
    expect(publicSettings.cloudConfig).toBeUndefined();

    // Store display fields remain available
    expect(publicSettings.storeName).toBeDefined();
  });

  it('should refuse forgot-password without out-of-band channel and NEVER reveal newPassword over HTTP', async () => {
    // 1. Reject invalid identifier
    await expect(
      db.recoverAdminPassword('wrong-email@example.com', {
        telegramService: { getTelegramConfig: () => ({ enabled: false }) },
        zaloService: { getZaloConfig: () => ({ enabled: false }) },
      })
    ).rejects.toThrow('không khớp với hồ sơ Quản trị viên');

    // 2. Matching email, but NO out-of-band channels configured:
    // Must refuse to reveal password over public HTTP and suggest CLI reset
    const savedEmail = db.getAdminProfileStatus(true).adminEmail;
    await expect(
      db.recoverAdminPassword(savedEmail, {
        telegramService: { getTelegramConfig: () => ({ enabled: false }) },
        zaloService: { getZaloConfig: () => ({ enabled: false }) },
      })
    ).rejects.toThrow('Kênh thông báo bảo mật (Telegram/Zalo) chưa được kích hoạt');

    // 3. Matching email with Telegram out-of-band channel active:
    let telegramNotifiedWithPassword = '';
    const mockTelegram = {
      getTelegramConfig: () => ({ enabled: true, botToken: 'mock-token', chatId: 'mock-chat' }),
      notifyAdminPasswordReset: async ({ newPassword }: any) => {
        telegramNotifiedWithPassword = newPassword;
      },
    };

    const res = await db.recoverAdminPassword(savedEmail, {
      telegramService: mockTelegram,
      zaloService: { getZaloConfig: () => ({ enabled: false }) },
    });

    expect(res.success).toBe(true);
    // CRITICAL: newPassword MUST NEVER be in the response returned to client!
    expect((res as any).newPassword).toBeUndefined();
    expect(res.sentTo).toContain('Telegram');
    expect(telegramNotifiedWithPassword).toMatch(/^Kyodo@\d{4}$/);

    // Verify admin can now login with the dispatched password
    const loginRes = db.authenticateUser('admin', telegramNotifiedWithPassword);
    expect(loginRes.role).toBe('admin');
  });

  it('should support safe server CLI reset tool resetAdminPasswordDirect', () => {
    const directResult = db.resetAdminPasswordDirect('KyodoSecure@2026');
    expect(directResult.success).toBe(true);

    const reAuth = db.authenticateUser('admin', 'KyodoSecure@2026');
    expect(reAuth.role).toBe('admin');

    // Restore standard password for subsequent tests
    db.resetAdminPasswordDirect('Kyodo@DN2026');
  });
});
