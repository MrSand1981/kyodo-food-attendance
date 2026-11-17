// server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const XLSX = require('xlsx');

const db = require('./db');
const updater = require('./updater');
const gitService = require('./gitService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const publicDir = path.join(__dirname, '..', 'public');
const distDir = path.join(__dirname, '..', 'dist');

app.use(express.static(publicDir));
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// Middleware đồng bộ dữ liệu Cloud (MongoDB Atlas) cho Vercel Serverless & Render
app.use('/api', async (req, res, next) => {
  await db.syncFromCloud();
  const originalJson = res.json.bind(res);
  res.json = async function (body) {
    await db.flushCloudSync();
    return originalJson(body);
  };
  next();
});

// Multer lưu logo
const uploadDir = process.env.VERCEL ? require('os').tmpdir() : publicDir;
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `custom-logo${ext}`);
  }
});
const upload = multer({ storage: storage });

// ================= API ROUTES =================

// 1. SETTINGS & SHIFTS
app.get('/api/settings', (req, res) => {
  try {
    const settings = db.getSettings();
    const shifts = db.getShifts();
    res.json({ success: true, settings, shifts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/settings/upload-logo', upload.single('logo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Chưa chọn file logo!' });
    }
    const logoUrl = `/${req.file.filename}?t=${Date.now()}`;
    db.updateSettings({ logoUrl });
    res.json({ success: true, logoUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 2. AUTHENTICATION & LOGIN (NHÂN VIÊN Út / Bảo & ADMIN MẬT KHẨU 20162020)
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const auth = db.authenticateUser(username, password);
    res.json({
      success: true,
      role: auth.role,
      user: auth.user,
      activeShift: auth.activeShift || null
    });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
});

// 3. EMPLOYEES CRUD (ADMIN TẠO TÀI KHOẢN CHO NHÂN VIÊN)
app.get('/api/employees', (req, res) => {
  try {
    const isAdmin = req.query.role === 'admin' || req.headers['x-admin-key'] === '20162020';
    const employees = db.getEmployees(isAdmin);
    res.json({ success: true, employees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/employees/change-password', (req, res) => {
  try {
    const { employeeId, oldPassword, newPassword } = req.body;
    const result = db.changeEmployeePassword(employeeId, oldPassword, newPassword);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/employees', (req, res) => {
  try {
    const newEmp = db.addEmployee(req.body);
    res.json({ success: true, employee: newEmp, message: `Đã tạo tài khoản "${newEmp.username}" thành công!` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/employees/:id', (req, res) => {
  try {
    const updated = db.updateEmployee(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên' });
    res.json({ success: true, employee: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/api/employees/:id', (req, res) => {
  try {
    const ok = db.deleteEmployee(req.params.id);
    res.json({ success: ok });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4. ATTENDANCE & CHẤM CÔNG HÀNG NGÀY
app.get('/api/attendance/active/:employeeId', (req, res) => {
  try {
    const active = db.getActiveShift(req.params.employeeId);
    res.json({ success: true, activeShift: active });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Vào ca trực tiếp - KHÔNG CẦN CHỌN CA, CHỈ CẦN GIỜ VÀO
app.post('/api/attendance/check-in', (req, res) => {
  try {
    const { employeeId, startTime, note } = req.body;
    const record = db.checkIn({ employeeId, startTime, note });
    res.json({ success: true, record, message: 'Vào ca thành công!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Ra ca trực tiếp
app.post('/api/attendance/check-out', (req, res) => {
  try {
    const { employeeId, attendanceId, note } = req.body;
    const record = db.checkOut({ employeeId, attendanceId, note });
    res.json({
      success: true,
      record,
      message: `Ra ca thành công! Ca này bạn đã làm được ${record.totalHours} giờ.`
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// NHÂN VIÊN TỰ NHẬP THỜI GIAN LÀM VIỆC TỪNG NGÀY
app.post('/api/attendance/daily-entry', (req, res) => {
  try {
    const { employeeId, date, startTime, endTime, hours, shiftName, note } = req.body;
    const record = db.recordDailyWork({ employeeId, date, startTime, endTime, hours, shiftName, note });
    res.json({
      success: true,
      record,
      message: `Đã lưu thời gian làm việc ngày ${date} (${record.totalHours} giờ) thành công!`
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 5. TỔNG KẾT THÁNG CHO NHÂN VIÊN (CUỐI THÁNG NHẬN KẾT QUẢ TỔNG GIỜ LÀM - BẢO MẬT LƯƠNG)
app.get('/api/attendance/my-summary/:employeeId', (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    const isAdmin = req.query.includeSalary === 'true' && req.headers['x-admin-key'] === '20162020';
    const summary = db.getEmployeeMonthlySummary(req.params.employeeId, month, isAdmin);
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. MASTER REPORT FOR ADMIN (BẢNG CÔNG TỔNG HỢP TRƯNG NỮ VƯƠNG)
app.get('/api/attendance/master-report', (req, res) => {
  try {
    const { month } = req.query;
    const report = db.getMasterMonthlyReport(month);
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. EXPORT TO EXCEL
app.get('/api/attendance/export-excel', (req, res) => {
  try {
    const { month } = req.query;
    const report = db.getMasterMonthlyReport(month);
    const buffer = db.exportAttendanceExcel(report);
    res.setHeader('Content-Disposition', `attachment; filename="Bang_Cham_Cong_Kyodo_Trung_Nu_Vuong_${report.yearMonth}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. MANAGER ADJUSTMENT & DELETE
app.post('/api/attendance/adjust', (req, res) => {
  try {
    const { id, ...data } = req.body;
    const record = db.adjustAttendance(id, data);
    res.json({ success: true, record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/api/attendance/:id', (req, res) => {
  try {
    const ok = db.deleteAttendance(req.params.id);
    res.json({ success: ok });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ================= SHARED SHIFTS (CHIA CA 2 NHÂN VIÊN) =================
app.get('/api/shared-shifts', (req, res) => {
  try {
    const isAdmin = req.headers['x-admin-key'] === '20162020' || req.query.role === 'admin';
    const filters = {
      date: req.query.date,
      yearMonth: req.query.month,
      shiftCode: req.query.shiftCode,
      employeeId: isAdmin ? req.query.employeeId : req.query.employeeId || req.headers['x-employee-id']
    };
    // Nhân viên chỉ xem của mình
    if (!isAdmin && req.headers['x-employee-id']) {
      filters.employeeId = req.headers['x-employee-id'];
    }
    const sharedShifts = db.getSharedShifts(filters);
    const shifts = db.getShifts();
    res.json({ success: true, sharedShifts, shifts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/shared-shifts', (req, res) => {
  try {
    const createdBy = req.headers['x-employee-id'] || req.body.createdBy || 'system';
    const sharedShift = db.createSharedShift({ ...req.body, createdBy });
    res.json({ success: true, sharedShift, message: 'Đã tạo lịch chia ca thành công!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/shared-shifts/:id', (req, res) => {
  try {
    const isAdmin = req.headers['x-admin-key'] === '20162020';
    const sharedShift = db.updateSharedShift(req.params.id, req.body);
    res.json({ success: true, sharedShift, message: isAdmin ? 'Đã cập nhật lịch chia ca!' : 'Đã cập nhật!' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/api/shared-shifts/:id', (req, res) => {
  try {
    const isAdmin = req.headers['x-admin-key'] === '20162020';
    if (!isAdmin) return res.status(403).json({ success: false, message: 'Chỉ quản lý mới được xóa lịch chia ca' });
    const ok = db.deleteSharedShift(req.params.id);
    res.json({ success: ok });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 9. CẬP NHẬT PHẦN MỀM TỰ ĐỘNG TỪ GITHUB
app.get('/api/system/check-update', async (req, res) => {
  try {
    const settings = db.getSettings();
    const repo = req.query.repo || settings.githubRepo;
    const result = await updater.checkUpdate(repo);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/system/apply-update', async (req, res) => {
  try {
    const settings = db.getSettings();
    const repo = req.body?.repo || settings.githubRepo;
    const result = await updater.applyUpdate(repo);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 10. ĐẨY BẢN CẬP NHẬT MỚI LÊN GITHUB (DÀNH CHO CHỦ CỬA HÀNG)
app.get('/api/system/git-status', async (req, res) => {
  try {
    const status = await gitService.getGitStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/system/git-push', async (req, res) => {
  try {
    const { message } = req.body || {};
    const result = await gitService.pushToGitHub(message);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cho các route React SPA khi build production
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.url.startsWith('/api')) return next();
  const indexHtml = path.join(distDir, 'index.html');
  if (fs.existsSync(indexHtml)) {
    return res.sendFile(indexHtml);
  }
  next();
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🍗 KYODO FOOD - CƠ SỞ TRƯNG NỮ VƯƠNG`);
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`=======================================================`);
  });
}

module.exports = app;