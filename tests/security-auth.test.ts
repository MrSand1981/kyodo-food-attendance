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
    const adminAuth = db.authenticateUser('admin', '20162020');
    expect(adminAuth.role).toBe('admin');
    expect(adminAuth.user.username).toBe('Admin');

    const ut = db.getEmployees().find((e: any) => e.username === 'UTNVTNV' || e.code === 'UTNVTNV');
    const utPwd = ut?.password || '2008';
    const utAuth = db.authenticateUser('UTNVTNV', utPwd);
    expect(utAuth.role).toBe('employee');
    expect(utAuth.user.name).toBe('Út');

    const bao = db
      .getEmployees()
      .find((e: any) => e.username === 'BAONVTNV' || e.code === 'BAONVTNV');
    const baoPwd = bao?.password || 'nhatbaodeptrai03';
    const baoAuth = db.authenticateUser('BAONVTNV', baoPwd);
    expect(baoAuth.role).toBe('employee');
    expect(baoAuth.user.name).toBe('Bảo');
  });

  it('should reject invalid password for Admin and Employees', () => {
    expect(() => db.authenticateUser('admin', 'wrongpass')).toThrow();
    expect(() => db.authenticateUser('UTNVTNV', 'wrongpass')).toThrow();
    expect(() => db.authenticateUser('BAONVTNV', '1234')).toThrow();
    expect(() => db.authenticateUser('BAONVTNV', '1111')).toThrow(); // Mật khẩu cũ 1111 bắt buộc phải bị từ chối
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
});
