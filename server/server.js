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

// Multer lưu logo
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, publicDir);
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

// Cập nhật Avatar cá nhân cho nhân viên
app.post('/api/employees/avatar', (req, res) => {
  try {
    const { employeeId, avatar } = req.body;
    if (!employeeId || !avatar) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin employeeId hoặc ảnh avatar!' });
    }
    const result = db.updateEmployeeAvatar(employeeId, avatar);
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

    const titleRow = [`BẢNG CHẤM CÔNG THEO GIỜ KYODO FOODS - CƠ SỞ TRƯNG NỮ VƯƠNG (${report.yearMonth})`];
    const headerRow1 = ['Tài khoản', 'Tên nhân viên', 'Cơ sở'];
    const headerRow2 = ['', '', ''];

    report.days.forEach(d => {
      headerRow1.push(`${d.day}`);
      headerRow2.push(d.dayOfWeek);
    });

    headerRow1.push(
      'Tổng giờ làm',
      'Mức lương/h',
      'Lương ca làm (Gross)',
      'Số lần tạm ứng',
      'Tổng tạm ứng',
      'Lương thực lĩnh (Net)'
    );
    headerRow2.push('', '', '', '', '', '');

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
          row.push(`${dData.hours}h`);
        } else {
          row.push('');
        }
      });

      row.push(
        r.totalHours,
        r.hourlyRate,
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
