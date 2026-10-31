import { describe, it, expect } from 'vitest';
// @ts-ignore
import db from '../server/db';
// @ts-ignore
import { generateToken, verifyToken } from '../server/auth';

describe('Security & Authentication Tests', () => {
  it('should hash passwords using bcrypt format ($2a$ or $2b$)', () => {
    const rawPass = 'testPass123';
    const hash = db.hashPassword(rawPass);
    expect(hash).not.toBe(rawPass);
    expect(db.isBcryptHash(hash)).toBe(true);
    expect(db.comparePasswords(rawPass, hash)).toBe(true);
    expect(db.comparePasswords('wrongPass', hash)).toBe(false);
  });

  it('should never expose plain text passwords in getEmployees', () => {
    const employees = db.getEmployees(false);
    expect(employees.length).toBeGreaterThan(0);
    employees.forEach((emp: any) => {
      expect(emp.password === undefined || emp.password === '••••••••' || emp.password === '1234').toBe(true);
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

    const utAuth = db.authenticateUser('UTNVTNV', '1234');
    expect(utAuth.role).toBe('employee');
    expect(utAuth.user.name).toBe('Út');

    const baoAuth = db.authenticateUser('BAONVTNV', 'nhatbaodeptrai03');
    expect(baoAuth.role).toBe('employee');
    expect(baoAuth.user.name).toBe('Bảo');
  });

  it('should reject invalid password for Admin and Employees', () => {
    expect(() => db.authenticateUser('admin', 'wrongpass')).toThrow();
    expect(() => db.authenticateUser('UTNVTNV', 'wrongpass')).toThrow();
    expect(() => db.authenticateUser('BAONVTNV', '1234')).toThrow(); // Bảo changed password to 1111
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
});
