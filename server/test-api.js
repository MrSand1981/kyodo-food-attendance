// server/test-api.js
const assert = require('assert');
const db = require('./db');

console.log('🧪 Starting Kyodo Food (Trưng Nữ Vương) Unit Tests...');

try {
  // Test 1: Employees initialization (includeConfidential = true for admin/manager check)
  // Clean up any temporary test users from previous runs
  const existingTestEmp = db.getEmployees(true).find(e => e.username === 'LINHNVTNV');
  if (existingTestEmp) db.deleteEmployee(existingTestEmp.id, true);

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

  const authBao = db.authenticateUser('BAONVTNV', 'nhatbaodeptrai03');
  assert.strictEqual(authBao.role, 'employee');
  assert.strictEqual(authBao.user.name, 'Bảo');

  const authAdmin = db.authenticateUser('admin', '20162020');
  assert.strictEqual(authAdmin.role, 'admin');
  console.log('✅ Test 2 Passed: Authentication for UTNVTNV, BAONVTNV, and Admin (20162020)');

  // Test 2b: JWT Token Generation & Verification
  const { generateToken, verifyToken } = require('./auth');
  const token = generateToken(authAdmin.user, authAdmin.role);
  const decoded = verifyToken(token);
  assert.strictEqual(decoded.role, 'admin');
  assert.strictEqual(decoded.username, 'Admin');
  console.log('✅ Test 2b Passed: JWT Token generated and verified with cryptographic signature');

  // Test 3: Nhập thời gian làm việc từng ngày
  // Clean up any test attendance records from previous test runs
  const existingRecords = db.getAttendance({ employeeId: ut.id, date: '2026-10-31' });
  existingRecords.forEach(r => db.deleteAttendance(r.id));
  const existingHolRecords = db.getAttendance({ employeeId: ut.id, date: '2026-04-30' });
  existingHolRecords.forEach(r => db.deleteAttendance(r.id));

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

  // Test 7: Holiday feature & salary multiplier x2
  const holidays = db.getHolidays();
  assert(holidays.length >= 22);
  const hol30Apr = db.getHolidayByDate('2026-04-30');
  assert(hol30Apr !== null);
  assert.strictEqual(hol30Apr.multiplier, 2);

  // Record 5h worked on 2026-04-30 (Holiday x2) for Út (25k/h)
  const holidayWorkLog = db.recordDailyWork({
    employeeId: ut.id,
    date: '2026-04-30',
    startTime: '08:00',
    endTime: '13:00',
    hours: 5,
    shiftName: 'Ca Sáng Lễ 30/4',
    note: 'Làm việc ngày lễ 30/4'
  });
  assert(holidayWorkLog.isHoliday === true);
  assert.strictEqual(holidayWorkLog.holidayMultiplier, 2);

  const utHolidaySummary = db.getEmployeeMonthlySummary(ut.id, '2026-04', true);
  assert.strictEqual(utHolidaySummary.holidayHours, 5);
  assert.strictEqual(utHolidaySummary.estimatedSalary, 250000); // 5h * 25k * 2 = 250k
  assert.strictEqual(utHolidaySummary.holidayBonus, 125000); // bonus = 125k

  const aprMaster = db.getMasterMonthlyReport('2026-04');
  const utRow = aprMaster.rows.find(r => r.employee.id === ut.id);
  assert.strictEqual(utRow.holidayHours, 5);
  assert.strictEqual(utRow.totalSalary, 250000);
  assert.strictEqual(utRow.holidayBonus, 125000);
  console.log(`✅ Test 7 Passed: Ngày lễ 30/4 lương nhân 2 (5h x 25k x 2 = ${utHolidaySummary.estimatedSalary.toLocaleString()} đ) chính xác tuyệt đối!`);

  // Clean up test staff & logs
  db.deleteEmployee(newStaff.id, true);
  db.deleteAttendance(manualLog.id);
  db.deleteAttendance(holidayWorkLog.id);

  console.log('\n🎉 ALL TESTS PASSED! System perfectly configured for Kyodo Food Trưng Nữ Vương 🚀');
} catch (err) {
  console.error('❌ Test failed:', err);
  process.exit(1);
}
