// server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const XLSX = require('xlsx');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const db = require('./db');
const updater = require('./updater');
const gitService = require('./gitService');
const { generateToken, extractUserMiddleware, requireAuth, requireAdmin } = require('./auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Bảo vệ Header bằng Helmet (chống clickjacking, XSS, MIME sniffing)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Giới hạn CORS an toàn
const allowedOrigins = [
  'https://kyodo-food-attendance-2.onrender.com',
  'https://kyodo-food-attendance.onrender.com',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://localhost:5173',
  'capacitor://localhost',
  'ionic://localhost'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.onrender.com') || origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Chặn tấn công dò mật khẩu (Brute-force): Giới hạn 20 lần thử sai trong 15 phút
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Bạn đã thử đăng nhập quá nhiều lần! Vui lòng thử lại sau 15 phút.' }
});

// Giới hạn tần suất chung cho API
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', apiLimiter);

// Middleware tự động giải mã JWT Token phiên làm việc
app.use(extractUserMiddleware);

const publicDir = path.join(__dirname, '..', 'public');
const distDir = path.join(__dirname, '..', 'dist');

app.use(express.static(publicDir));
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// Multer lưu logo an toàn (chỉ chấp nhận ảnh, giới hạn 5MB)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, publicDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `custom-logo${ext}`);
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận tệp hình ảnh hợp lệ (PNG, JPEG, WEBP, SVG)!'));
    }
  }
});

// ================= API ROUTES =================

// 0. KEEP-ALIVE & HEALTH CHECK (DÀNH CHO CRON-JOB / UPTIMEROBOT GIỮ MÁY CHỦ THỨC 24/7)
app.get('/api/ping', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'Kyodo Food Attendance',
    store: 'Trưng Nữ Vương, Đà Nẵng',
    time: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    message: 'Máy chủ Kyodo Food đang hoạt động 24/7'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

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

app.put('/api/settings', requireAdmin, (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/settings/upload-logo', requireAdmin, upload.single('logo'), (req, res) => {
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

// 2. AUTHENTICATION & LOGIN (CẤP JWT TOKEN AN TOÀN)
app.post('/api/auth/login', loginLimiter, (req, res) => {
  try {
    const { username, password } = req.body;
    const auth = db.authenticateUser(username, password);
    const token = generateToken(auth.user, auth.role);
    res.json({
      success: true,
      role: auth.role,
      user: auth.user,
      token,
      activeShift: auth.activeShift || null
    });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
});

// 2.1. ADMIN PROFILE & PASSWORD RECOVERY (ĐĂNG KÝ, ĐỔI MẬT KHẨU & QUÊN MẬT KHẨU ADMIN)
app.get('/api/admin/profile-status', (req, res) => {
  try {
    const status = db.getAdminProfileStatus();
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/profile', requireAdmin, (req, res) => {
  try {
    const result = db.updateAdminProfile(req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/change-password', requireAdmin, (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = db.changeAdminPassword(oldPassword, newPassword);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/admin/forgot-password', loginLimiter, (req, res) => {
  try {
    const { identifier } = req.body;
    const result = db.recoverAdminPassword(identifier);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 3. EMPLOYEES CRUD (XÁC THỰC PHÂN QUYỀN RBAC)
app.get('/api/employees', (req, res) => {
  try {
    // Luôn trả về danh sách đầy đủ hồ sơ nhân viên (SĐT, Ngân hàng, CCCD, Lương) cho trang Quản lý
    const employees = db.getEmployees(true);
    res.json({ success: true, employees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/employees/change-password', (req, res) => {
  try {
    const { employeeId, oldPassword, newPassword } = req.body;
    // Nếu có token đăng nhập và không phải admin thì kiểm tra đúng tài khoản
    if (req.user && req.user.role !== 'admin' && req.user.id !== employeeId && req.user.username !== employeeId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền đổi mật khẩu của tài khoản khác!' });
    }
    const result = db.changeEmployeePassword(employeeId, oldPassword, newPassword);

    // Cấp luôn token mới để phiên làm việc tiếp tục duy trì 30 ngày thông suốt
    const emp = db.getEmployeeByIdOrUsername(employeeId);
    let token = null;
    if (emp) {
      token = generateToken(emp, 'employee');
    }
    res.json({ ...result, token });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Admin đặt lại mật khẩu nhân viên về 1234 khi nhân viên quên mật khẩu
app.post('/api/employees/:id/reset-password', (req, res) => {
  try {
    const result = db.resetEmployeePassword(req.params.id, req.body?.password || '1234');
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Cập nhật Avatar cá nhân cho nhân viên
app.post('/api/employees/avatar', (req, res) => {
  try {
    const { employeeId, avatar } = req.body;
    if (!employeeId || !avatar) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin employeeId hoặc ảnh avatar!' });
    }
    if (req.user && req.user.role !== 'admin' && req.user.id !== employeeId && req.user.username !== employeeId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa ảnh của tài khoản khác!' });
    }
    const result = db.updateEmployeeAvatar(employeeId, avatar);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/employees', requireAdmin, (req, res) => {
  try {
    const newEmp = db.addEmployee(req.body);
    res.json({ success: true, employee: newEmp, message: `Đã tạo tài khoản "${newEmp.username}" thành công!` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/employees/:id', requireAdmin, (req, res) => {
  try {
    const updated = db.updateEmployee(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy nhân viên' });
    res.json({ success: true, employee: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/api/employees/:id', requireAdmin, (req, res) => {
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

// Vào ca trực tiếp
app.post('/api/attendance/check-in', (req, res) => {
  try {
    const { employeeId, shiftCode, note } = req.body;
    const record = db.checkIn({ employeeId, shiftCode, note });
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

// 4b. ỨNG TIỀN LƯƠNG TRƯỚC (SALARY ADVANCES)
app.get('/api/advances', (req, res) => {
  try {
    const { employeeId, month } = req.query;
    const result = db.getSalaryAdvances(employeeId, month);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/advances', (req, res) => {
  try {
    const { employeeId, date, amount, reason } = req.body;
    const record = db.requestSalaryAdvance({ employeeId, date, amount, reason });
    res.json({
      success: true,
      record,
      message: `Đã lưu bản ghi ứng lương ${Number(amount).toLocaleString('vi-VN')} đ thành công!`
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/advances/:id', (req, res) => {
  try {
    const { amount, date, reason } = req.body;
    const updated = db.updateSalaryAdvance(req.params.id, { amount, date, reason });
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy khoản tạm ứng' });
    res.json({ success: true, record: updated, message: 'Đã cập nhật khoản tạm ứng lương thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/advances/:id', (req, res) => {
  try {
    const ok = db.deleteSalaryAdvance(req.params.id);
    res.json({ success: ok, message: 'Đã xóa bản ghi tạm ứng lương' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4c. XIN NGÀY NGHỈ (LEAVE REQUESTS)
app.get('/api/leaves', (req, res) => {
  try {
    const { employeeId, month } = req.query;
    const result = db.getLeaveRequests(employeeId, month);
    res.json({ success: true, records: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/leaves', (req, res) => {
  try {
    const { employeeId, date, endDate, shift, reason } = req.body;
    const record = db.requestLeave({ employeeId, date, endDate, shift, reason });
    res.json({
      success: true,
      record,
      message: `Đã lưu thông báo nghỉ làm ngày ${date} thành công!`
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/api/leaves/:id', (req, res) => {
  try {
    const ok = db.deleteLeaveRequest(req.params.id);
    res.json({ success: ok, message: 'Đã xóa đơn xin nghỉ' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 4.1 QUẢN LÝ NGÀY LỄ TRONG NĂM (HỆ SỐ LƯƠNG X2)
app.get('/api/holidays', (req, res) => {
  try {
    const list = db.getHolidays(req.query.year);
    res.json({ success: true, holidays: list });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.post('/api/holidays', requireAdmin, (req, res) => {
  try {
    const newHol = db.addHoliday(req.body);
    res.json({ success: true, holiday: newHol, message: "Đã thêm ngày lễ thành công!" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/holidays/:id', requireAdmin, (req, res) => {
  try {
    const updated = db.updateHoliday(req.params.id, req.body);
    res.json({ success: true, holiday: updated, message: "Đã cập nhật ngày lễ thành công!" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/api/holidays/:id', requireAdmin, (req, res) => {
  try {
    const result = db.deleteHoliday(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// 5. TỔNG KẾT THÁNG CHO NHÂN VIÊN (CUỐI THÁNG NHẬN KẾT QUẢ TỔNG GIỜ LÀM - BẢO MẬT LƯƠNG)
app.get('/api/attendance/my-summary/:employeeId', (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    const isAdmin = req.user && req.user.role === 'admin';
    const summary = db.getEmployeeMonthlySummary(req.params.employeeId, month, isAdmin);
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6. MASTER REPORT FOR ADMIN (BẢNG CÔNG TỔNG HỢP TRƯNG NỮ VƯƠNG - YÊU CẦU QUYỀN ADMIN)
app.get('/api/attendance/master-report', requireAdmin, (req, res) => {
  try {
    const { month } = req.query;
    const report = db.getMasterMonthlyReport(month);
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 7. EXPORT TO EXCEL (YÊU CẦU QUYỀN ADMIN)
app.get('/api/attendance/export-excel', requireAdmin, (req, res) => {
  try {
    const { month } = req.query;
    const report = db.getMasterMonthlyReport(month);

    const [y, m] = (report.yearMonth || '').split('-');
    const formattedMonth = (y && m) ? `${m}/${y}` : report.yearMonth;
    const titleRow = [`BẢNG CHẤM CÔNG THEO GIỜ KYODO FOODS - CƠ SỞ TRƯNG NỮ VƯƠNG (THÁNG ${formattedMonth})`];
    const headerRow1 = ['Tài khoản', 'Tên nhân viên', 'Cơ sở'];
    const headerRow2 = ['', '', ''];

    report.days.forEach(d => {
      const headerTitle = d.isHoliday ? `${d.dateVN || `${String(d.day).padStart(2, '0')}/${m}/${y}`} (LỄ)` : (d.dateVN || `${String(d.day).padStart(2, '0')}/${m}/${y}`);
      const daySub = d.isHoliday ? `${d.dayOfWeek} (x${d.holidayMultiplier || 2})` : d.dayOfWeek;
      headerRow1.push(headerTitle);
      headerRow2.push(daySub);
    });

    headerRow1.push(
      'Tổng giờ làm',
      'Giờ thường (h)',
      'Giờ lễ (x2)',
      'Mức lương/h',
      'Thưởng lễ',
      'Tổng lương (Gross)',
      'Số lần tạm ứng',
      'Tổng tạm ứng',
      'Lương thực lĩnh (Net)'
    );
    headerRow2.push('', '', '', '', '', '', '', '', '');

    const excelRows = [
      titleRow,
      [],
      headerRow1,
      headerRow2
    ];

    report.rows.forEach(r => {
      const row = [
        r.employee.username || r.employee.code,
        r.employee.name,
        'Trưng Nữ Vương'
      ];

      report.days.forEach(d => {
        const dData = r.dailyData[d.day];
        if (dData && dData.hours > 0) {
          const suffix = dData.isHoliday ? ` (x${dData.holidayMultiplier || 2})` : '';
          row.push(`${dData.hours}h${suffix}`);
        } else {
          row.push('');
        }
      });

      row.push(
        r.totalHours,
        r.regularHours || r.totalHours,
        r.holidayHours || 0,
        r.hourlyRate,
        r.holidayBonus || 0,
        r.totalSalary,
        r.advanceCount || 0,
        r.advanceTotal || 0,
        r.netSalary ?? r.totalSalary
      );
      excelRows.push(row);
    });

    const totalRow = ['TỔNG CỘNG TOÀN CỬA HÀNG', '', ''];
    report.days.forEach(() => totalRow.push(''));
    totalRow.push(
      report.summary.storeTotalHours,
      report.summary.storeRegularHours || report.summary.storeTotalHours,
      report.summary.storeHolidayHours || 0,
      '',
      '',
      report.summary.storeTotalSalary,
      '',
      report.summary.storeTotalAdvance,
      report.summary.storeTotalNetSalary
    );
    excelRows.push(totalRow);

    const ws = XLSX.utils.aoa_to_sheet(excelRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Kyodo_TNV_${report.yearMonth}`);

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="Bang_Cham_Cong_Kyodo_Trung_Nu_Vuong_${report.yearMonth}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 8. MANAGER ADJUSTMENT & DELETE (YÊU CẦU QUYỀN ADMIN)
app.post('/api/attendance/adjust', requireAdmin, (req, res) => {
  try {
    const { id, ...data } = req.body;
    const record = db.adjustAttendance(id, data);
    res.json({ success: true, record });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.delete('/api/attendance/:id', requireAdmin, (req, res) => {
  try {
    const ok = db.deleteAttendance(req.params.id);
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

app.post('/api/system/apply-update', requireAdmin, async (req, res) => {
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
app.get('/api/system/git-status', requireAdmin, async (req, res) => {
  try {
    const status = await gitService.getGitStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/system/git-push', requireAdmin, async (req, res) => {
  try {
    const { message } = req.body || {};
    const result = await gitService.pushToGitHub(message);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 11. CẤU HÌNH ĐỒNG BỘ CLOUD (ĐÀ NẴNG - NGHỆ AN)
const CLOUD_CONFIG_PATH = path.join(__dirname, '..', 'cloud_config.json');

app.get('/api/system/cloud-config', (req, res) => {
  try {
    let config = { cloudUrl: '', activeMode: 'local' };
    if (fs.existsSync(CLOUD_CONFIG_PATH)) {
      config = JSON.parse(fs.readFileSync(CLOUD_CONFIG_PATH, 'utf-8'));
    }
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/system/cloud-config', requireAdmin, (req, res) => {
  try {
    const { cloudUrl, activeMode } = req.body || {};
    const config = {
      cloudUrl: cloudUrl ? cloudUrl.trim().replace(/\/+$/, '') : '',
      activeMode: activeMode || 'cloud',
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(CLOUD_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
    res.json({ success: true, config, message: 'Đã lưu cấu hình kết nối Cloud thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Cho các route React SPA khi build production (ngăn chặn triệt để lỗi "Cannot GET /")
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.url.startsWith('/api')) return next();

  // 1. Kiểm tra các vị trí chứa index.html
  const candidates = [
    path.join(distDir, 'index.html'),
    path.join(publicDir, 'index.html'),
    path.join(__dirname, '..', 'index.html'),
    path.resolve('dist', 'index.html'),
    path.resolve('public', 'index.html')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return res.sendFile(candidate);
    }
  }

  // 2. Dự phòng an toàn: nếu chưa có file index.html tĩnh thì trả về trang báo trạng thái rõ ràng, tuyệt đối không quăng Cannot GET /
  res.status(200).send(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kyodo Food App - Máy Chủ Sẵn Sàng</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #1e293b; padding: 32px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); max-width: 520px; width: 100%; text-align: center; border: 1px solid #334155; }
    h1 { color: #f59e0b; margin-top: 0; font-size: 22px; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 12px 0; }
    .badge { display: inline-block; background: #059669; color: #fff; font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px; }
    .btn { display: inline-block; background: #f59e0b; color: #000; padding: 10px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; margin-top: 16px; cursor: pointer; border: none; font-size: 14px; }
    .btn:hover { background: #d97706; }
    .links { margin-top: 20px; font-size: 12px; color: #64748b; }
    .links a { color: #38bdf8; text-decoration: none; margin: 0 8px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">ONLINE - SẴN SÀNG KẾT NỐI</div>
    <h1>🍗 KYODO FOOD - MÁY CHỦ ĐANG HOẠT ĐỘNG</h1>
    <p>Máy chủ Node.js & Database đã sẵn sàng trên cổng ${PORT}. Đang nạp giao diện ứng dụng...</p>
    <button class="btn" onclick="location.reload()">Tải Lại Giao Diện</button>
    <div class="links">
      <a href="/api/settings" target="_blank">Kiểm tra API Cài đặt</a> |
      <a href="/api/employees" target="_blank">Kiểm tra API Nhân viên</a>
    </div>
  </div>
</body>
</html>`);
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🍗 KYODO FOOD - CƠ SỞ TRƯNG NỮ VƯƠNG`);
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`=======================================================`);

    // Cơ chế phụ trợ tự giữ nhịp 24/7 nếu được triển khai trên Cloud Render
    const publicCloudUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
    if (publicCloudUrl && publicCloudUrl.startsWith('http')) {
      console.log(`[Keep-Alive] Đã kích hoạt cơ chế tự giữ nhịp 24/7 đến: ${publicCloudUrl}/api/ping`);
      const httpModule = publicCloudUrl.startsWith('https') ? require('https') : require('http');
      setInterval(() => {
        try {
          httpModule.get(`${publicCloudUrl}/api/ping`, (pingRes) => {
            pingRes.resume(); // Tiêu thụ stream để giải phóng socket
          }).on('error', () => {
            // Không làm gián đoạn server nếu mạng ngoài chập chờn
          });
        } catch (e) {
          // Bỏ qua lỗi
        }
      }, 9 * 60 * 1000); // 9 phút một lần (dưới ngưỡng 15 phút của Render)
    }
  });
}


// 12. EXPORT & RESTORE DATABASE (CHỐNG MẤT DỮ LIỆU - YÊU CẦU QUYỀN ADMIN)
app.get('/api/system/export-db', requireAdmin, (req, res) => {
  try {
    const data = db.ensureDbFile();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="kyodo_backup_${new Date().toISOString().slice(0,10)}.json"`);
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/system/restore-db', requireAdmin, (req, res) => {
  try {
    const { backupData } = req.body || {};
    if (!backupData || !backupData.employees) {
      return res.status(400).json({ success: false, message: 'Dữ liệu sao lưu không hợp lệ!' });
    }
    db.saveDatabase(backupData, true);
    res.json({ success: true, message: 'Khôi phục cơ sở dữ liệu thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = app;
