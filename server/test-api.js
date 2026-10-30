// server/test-api.js
const assert = require('assert');
const db = require('./db');

console.log('🧪 Starting Kyodo Food (Trưng Nữ Vương) Unit Tests...');

try {
  // Test 1: Employees initialization (includeConfidential = true for admin/manager check)
  const employees = db.getEmployees(true);
  assert.strictEqual(employees.length, 2, 'Should have exactly 2 initial employees: Út and Bảo');
  
  const ut = employees.find(e => e.username === 'UTNVTNV');
  assert(ut, 'Út account UTNVTNV should exist');
  assert.strictEqual(ut.hourlyRate, 25000, 'Út wage should be 25,000đ/h');
  assert.strictEqual(ut.branch, 'Trưng Nữ Vương');

  const bao = employees.find(e => e.username === 'BAONVTNV');
  assert(bao, 'Bảo account BAONVTNV should exist');
  assert.strictEqual(bao.hourlyRate, 22000, 'Bảo wage should be 22,000đ/h');
  assert.strictEqual(bao.branch, 'Trưng Nữ Vương');
  console.log('✅ Test 1 Passed: Út (UTNVTNV - 25k) and Bảo (BAONVTNV - 22k) verified');

  // Test 2: Authentication
  const authUt = db.authenticateUser('utnvtnv', '1234');
  assert.strictEqual(authUt.role, 'employee');
  assert.strictEqual(authUt.user.name, 'Út');

  const authBao = db.authenticateUser('BAONVTNV', '1234');
  assert.strictEqual(authBao.role, 'employee');
  assert.strictEqual(authBao.user.name, 'Bảo');

  const authAdmin = db.authenticateUser('admin', '20162020');
  assert.strictEqual(authAdmin.role, 'admin');
  console.log('✅ Test 2 Passed: Authentication for UTNVTNV, BAONVTNV, and Admin (20162020)');

  // Test 3: Nhập thời gian làm việc từng ngày
  const manualLog = db.recordDailyWork({
    employeeId: ut.id,
    date: '2026-10-31',
    startTime: '08:00',
    endTime: '12:30',
    hours: 4.5,
    note: 'Ca sáng chuẩn bị hàng cuối tháng'
  });
  assert.strictEqual(manualLog.totalHours, 4.5);
  assert.strictEqual(manualLog.date, '2026-10-31');
  console.log('✅ Test 3 Passed: Employee daily work entry recorded');

  // Test 4: Admin creates a new employee account
  const newStaff = db.addEmployee({
    username: 'LINHNVTNV',
    name: 'Linh',
    hourlyRate: 23000,
    password: '1234',
    role: 'Phục vụ'
  });
  assert.strictEqual(newStaff.username, 'LINHNVTNV');
  assert.strictEqual(newStaff.hourlyRate, 23000);
  assert.strictEqual(newStaff.branch, 'Trưng Nữ Vương');
  console.log('✅ Test 4 Passed: Admin created new employee LINHNVTNV');

  // Test 5: Monthly summary calculation (includeSalary=true for verification)
  const summaryUt = db.getEmployeeMonthlySummary(ut.id, '2026-10', true);
  assert(summaryUt.totalHours >= 0);
  assert.strictEqual(summaryUt.estimatedSalary, Math.round(summaryUt.totalHours * 25000));
  console.log(`✅ Test 5 Passed: Út monthly summary = ${summaryUt.totalHours}h -> ${summaryUt.estimatedSalary.toLocaleString()} đ`);

  const summaryBao = db.getEmployeeMonthlySummary(bao.id, '2026-10', true);
  assert(summaryBao.totalHours >= 0);
  assert.strictEqual(summaryBao.estimatedSalary, Math.round(summaryBao.totalHours * 22000));
  console.log(`✅ Test 5 Passed: Bảo monthly summary = ${summaryBao.totalHours}h -> ${summaryBao.estimatedSalary.toLocaleString()} đ`);

  // Test 6: Master Monthly Report for Trưng Nữ Vương
  const master = db.getMasterMonthlyReport('2026-10');
  assert.strictEqual(master.branchName, 'Trưng Nữ Vương');
  assert(master.rows.length >= 2);
  console.log(`✅ Test 6 Passed: Master report Trưng Nữ Vương total hours = ${master.summary.storeTotalHours}h`);

  // Clean up test staff
  db.deleteEmployee(newStaff.id, true);
  db.deleteAttendance(manualLog.id);

  console.log('\n🎉 ALL TESTS PASSED! System perfectly configured for Kyodo Food Trưng Nữ Vương 🚀');
} catch (err) {
  console.error('❌ Test failed:', err);
  process.exit(1);
}
