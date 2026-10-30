// server/db.js
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const { generateSeedData } = require('./seedData');

const DB_PATH = path.join(__dirname, '..', 'data', 'database.json');
let mongoClient = null;
let mongoDb = null;
let isMongo = false;

// Khởi tạo kết nối MongoDB nếu có biến môi trường MONGODB_URI (dành cho Cloud Render/Railway)
if (process.env.MONGODB_URI) {
  MongoClient.connect(process.env.MONGODB_URI)
    .then(client => {
      mongoClient = client;
      mongoDb = client.db('kyodo_food');
      isMongo = true;
      console.log('✅ Đã kết nối Cơ sở dữ liệu Cloud MongoDB Atlas thành công!');
    })
    .catch(err => {
      console.warn('⚠️ Không thể kết nối MongoDB Cloud, chuyển sang dùng database.json:', err.message);
    });
}

function ensureDbFile() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const seed = generateSeedData();
    saveDatabase(seed);
    return seed;
  }

  try {
    const content = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error("Lỗi đọc database.json, tạo lại dữ liệu mẫu:", err);
    const seed = generateSeedData();
    saveDatabase(seed);
    return seed;
  }
}

function saveDatabase(data) {
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, DB_PATH);

  // Nếu có MongoDB Cloud, đồng bộ song song lên Cloud
  if (isMongo && mongoDb) {
    mongoDb.collection('app_state').updateOne(
      { _id: 'master_db' },
      { $set: { data: data, updatedAt: new Date() } },
      { upsert: true }
    ).catch(err => console.error('Lỗi sync MongoDB:', err.message));
  }
}

// ---------------- EMPLOYEES ----------------
function getEmployees() {
  const db = ensureDbFile();
  return (db.employees || []).filter(e => e.active !== false);
}

function getEmployeeByIdOrUsername(idOrUsername) {
  const db = ensureDbFile();
  const search = String(idOrUsername).trim().toLowerCase();
  return db.employees.find(e => 
    (e.id && e.id.toLowerCase() === search) || 
    (e.username && e.username.toLowerCase() === search) || 
    (e.code && e.code.toLowerCase() === search)
  );
}

function addEmployee(employeeData) {
  const db = ensureDbFile();
  const rawUsername = (employeeData.username || employeeData.code || `NV${db.employees.length + 1}`).trim().toUpperCase();
  
  // Kiểm tra trùng username
  const exists = db.employees.find(e => e.username && e.username.toUpperCase() === rawUsername && e.active !== false);
  if (exists) {
    throw new Error(`Tài khoản "${rawUsername}" đã tồn tại! Vui lòng chọn tên đăng nhập khác.`);
  }

  const newId = `emp-${Date.now()}`;
  const newEmp = {
    id: newId,
    username: rawUsername,
    code: rawUsername,
    name: employeeData.name.trim(),
    gender: employeeData.gender || "Khác",
    branch: "Trưng Nữ Vương",
    role: employeeData.role || "Nhân viên",
    hourlyRate: Number(employeeData.hourlyRate) || 25000,
    password: employeeData.password || "1234",
    phone: employeeData.phone || "",
    avatar: employeeData.avatar || "",
    active: true
  };

  db.employees.push(newEmp);
  saveDatabase(db);
  return newEmp;
}

function updateEmployee(id, updateData) {
  const db = ensureDbFile();
  const idx = db.employees.findIndex(e => e.id === id);
  if (idx === -1) return null;

  db.employees[idx] = {
    ...db.employees[idx],
    ...updateData,
    branch: "Trưng Nữ Vương", // Cố định cơ sở Trưng Nữ Vương
    id
  };

  saveDatabase(db);
  return db.employees[idx];
}

function deleteEmployee(id) {
  const db = ensureDbFile();
  const idx = db.employees.findIndex(e => e.id === id);
  if (idx === -1) return false;

  db.employees[idx].active = false;
  saveDatabase(db);
  return true;
}

// ---------------- AUTHENTICATION ----------------
function authenticateUser(username, password) {
  const db = ensureDbFile();
  const u = String(username || '').trim().toLowerCase();
  const p = String(password || '').trim();

  // 1. Kiểm tra tài khoản Admin (mật khẩu: 20162020)
  if (p === db.settings.adminPassword || p === '20162020') {
    if (u === 'admin' || u === '' || u === 'quanly' || u === 'chucuahang') {
      return {
        role: 'admin',
        user: { username: 'admin', name: 'Chủ Cửa Hàng (Admin)', role: 'admin' }
      };
    }
  }

  // 2. Kiểm tra tài khoản Nhân viên (UTNVTNV, BAONVTNV...)
  const emp = db.employees.find(e => 
    e.active !== false && 
    (
      (e.username && e.username.toLowerCase() === u) ||
      (e.code && e.code.toLowerCase() === u)
    )
  );

  if (!emp) {
    throw new Error(`Tài khoản "${username}" không tồn tại trên hệ thống!`);
  }

  if (emp.password && emp.password !== p) {
    throw new Error('Mật khẩu không chính xác! Vui lòng kiểm tra lại.');
  }

  const activeShift = getActiveShift(emp.id);

  return {
    role: 'employee',
    user: emp,
    activeShift
  };
}

// ---------------- ATTENDANCE / CHẤM CÔNG ----------------
function getAttendance(filters = {}) {
  const db = ensureDbFile();
  let list = db.attendance || [];

  if (filters.employeeId) {
    list = list.filter(a => a.employeeId === filters.employeeId);
  }
  if (filters.employeeCode) {
    list = list.filter(a => a.employeeCode === filters.employeeCode);
  }
  if (filters.date) {
    list = list.filter(a => a.date === filters.date);
  }
  if (filters.yearMonth) {
    list = list.filter(a => a.date.startsWith(filters.yearMonth));
  }
  if (filters.status) {
    list = list.filter(a => a.status === filters.status);
  }

  return list.sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
}

function getActiveShift(employeeId) {
  const db = ensureDbFile();
  return (db.attendance || []).find(a => a.employeeId === employeeId && a.status === 'working') || null;
}

// Chấm công vào ca trực tiếp
function checkIn({ employeeId, shiftCode, note }) {
  const db = ensureDbFile();
  const emp = db.employees.find(e => e.id === employeeId);
  if (!emp) throw new Error("Không tìm thấy nhân viên");

  const active = (db.attendance || []).find(a => a.employeeId === employeeId && a.status === 'working');
  if (active) {
    throw new Error("Bạn đang trong ca làm việc, vui lòng bấm Kết Thúc Ca trước!");
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const shift = (db.shifts || []).find(s => s.code === shiftCode) || {
    name: "Ca Làm Việc",
    code: shiftCode || "CA1"
  };

  const newRecord = {
    id: `att-${Date.now()}`,
    employeeId: emp.id,
    employeeCode: emp.username || emp.code,
    employeeName: emp.name,
    branch: "Trưng Nữ Vương",
    date: dateStr,
    checkIn: now.toISOString(),
    checkOut: null,
    totalHours: 0,
    shiftCode: shift.code,
    shiftName: shift.name,
    status: "working",
    note: note || "",
    photo: null
  };

  db.attendance.push(newRecord);
  saveDatabase(db);
  return newRecord;
}

// Chấm công ra ca trực tiếp
function checkOut({ employeeId, attendanceId, note }) {
  const db = ensureDbFile();
  let record = null;
  if (attendanceId) {
    record = (db.attendance || []).find(a => a.id === attendanceId);
  } else if (employeeId) {
    record = (db.attendance || []).find(a => a.employeeId === employeeId && a.status === 'working');
  }

  if (!record) {
    throw new Error("Không tìm thấy ca làm việc đang mở để kết thúc!");
  }

  const now = new Date();
  const checkInDate = new Date(record.checkIn);
  const diffMs = now.getTime() - checkInDate.getTime();
  const totalHours = Math.max(0.1, Number((diffMs / 3600000).toFixed(2)));

  record.checkOut = now.toISOString();
  record.totalHours = totalHours;
  record.status = "completed";
  if (note) {
    record.note = record.note ? `${record.note} | ${note}` : note;
  }

  saveDatabase(db);
  return record;
}

// NHÂN VIÊN NHẬP THỜI GIAN LÀM VIỆC TỪNG NGÀY (KHAI BÁO CA LÀM)
function recordDailyWork({ employeeId, date, startTime, endTime, hours, shiftName, note }) {
  const db = ensureDbFile();
  const emp = db.employees.find(e => e.id === employeeId);
  if (!emp) throw new Error("Nhân viên không tồn tại");

  if (!date) throw new Error("Vui lòng chọn ngày làm việc");

  let calculatedHours = Number(hours);
  let checkInISO = null;
  let checkOutISO = null;

  if (startTime && endTime) {
    checkInISO = new Date(`${date}T${startTime}:00+07:00`).toISOString();
    checkOutISO = new Date(`${date}T${endTime}:00+07:00`).toISOString();
    if (isNaN(calculatedHours) || calculatedHours <= 0) {
      const diffMs = new Date(checkOutISO) - new Date(checkInISO);
      calculatedHours = Math.max(0.1, Number((diffMs / 3600000).toFixed(2)));
    }
  } else if (calculatedHours > 0) {
    checkInISO = new Date(`${date}T08:00:00+07:00`).toISOString();
    const endMs = new Date(checkInISO).getTime() + calculatedHours * 3600000;
    checkOutISO = new Date(endMs).toISOString();
  } else {
    throw new Error("Vui lòng nhập số giờ làm việc hoặc giờ vào và giờ ra!");
  }

  const newRecord = {
    id: `att-manual-${Date.now()}`,
    employeeId: emp.id,
    employeeCode: emp.username || emp.code,
    employeeName: emp.name,
    branch: "Trưng Nữ Vương",
    date: date,
    checkIn: checkInISO,
    checkOut: checkOutISO,
    totalHours: Number(calculatedHours.toFixed(2)),
    shiftCode: "MANUAL",
    shiftName: shiftName || "Khai báo ngày làm",
    status: "completed",
    note: note || "Nhân viên tự nhập giờ làm",
    photo: null
  };

  db.attendance.push(newRecord);
  saveDatabase(db);
  return newRecord;
}

function adjustAttendance(id, updateData) {
  const db = ensureDbFile();
  const record = (db.attendance || []).find(a => a.id === id);
  if (!record) throw new Error("Bản ghi chấm công không tồn tại");

  if (updateData.checkIn) record.checkIn = updateData.checkIn;
  if (updateData.checkOut) record.checkOut = updateData.checkOut;
  if (updateData.totalHours !== undefined) record.totalHours = Number(updateData.totalHours);
  if (updateData.note !== undefined) record.note = updateData.note;

  if (record.checkIn && record.checkOut && !updateData.totalHours) {
    const diffMs = new Date(record.checkOut) - new Date(record.checkIn);
    record.totalHours = Math.max(0, Number((diffMs / 3600000).toFixed(2)));
    record.status = "completed";
  }

  saveDatabase(db);
  return record;
}

function deleteAttendance(id) {
  const db = ensureDbFile();
  const idx = db.attendance.findIndex(a => a.id === id);
  if (idx === -1) return false;

  db.attendance.splice(idx, 1);
  saveDatabase(db);
  return true;
}

// ---------------- TỔNG KẾT THÁNG CHO NHÂN VIÊN (CUỐI THÁNG NHẬN TỔNG GIỜ LÀM) ----------------
function getEmployeeMonthlySummary(employeeId, yearMonth) {
  const db = ensureDbFile();
  const emp = db.employees.find(e => e.id === employeeId || e.username === employeeId || e.code === employeeId);
  if (!emp) throw new Error("Nhân viên không tồn tại");

  const currentYM = yearMonth || new Date().toISOString().substring(0, 7);

  const monthRecords = (db.attendance || []).filter(
    a => a.employeeId === emp.id && a.date.startsWith(currentYM)
  ).sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());

  let totalCompletedHours = 0;
  let activeShift = null;
  const daysWorkedSet = new Set();
  let shiftCount = 0;

  monthRecords.forEach(rec => {
    if (rec.status === 'completed') {
      totalCompletedHours += Number(rec.totalHours || 0);
      daysWorkedSet.add(rec.date);
      shiftCount++;
    } else if (rec.status === 'working') {
      activeShift = rec;
      daysWorkedSet.add(rec.date);
    }
  });

  totalCompletedHours = Number(totalCompletedHours.toFixed(2));
  const hourlyRate = emp.hourlyRate || (emp.name === 'Út' ? 25000 : 22000);
  const estimatedSalary = Math.round(totalCompletedHours * hourlyRate);

  return {
    employee: {
      id: emp.id,
      username: emp.username,
      code: emp.code,
      name: emp.name,
      gender: emp.gender,
      branch: "Trưng Nữ Vương",
      role: emp.role,
      hourlyRate: hourlyRate
    },
    yearMonth: currentYM,
    totalHours: totalCompletedHours,
    totalDays: daysWorkedSet.size,
    totalShifts: shiftCount,
    hourlyRate: hourlyRate,
    estimatedSalary: estimatedSalary,
    activeShift: activeShift,
    records: monthRecords
  };
}

// ---------------- BẢNG TỔNG HỢP CỬA HÀNG TRƯNG NỮ VƯƠNG (ADMIN) ----------------
function getMasterMonthlyReport(yearMonth) {
  const db = ensureDbFile();
  const currentYM = yearMonth || new Date().toISOString().substring(0, 7);
  
  const [yearStr, monthStr] = currentYM.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  const days = [];
  const vietnameseDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = d < 10 ? `0${d}` : `${d}`;
    const dateObj = new Date(`${year}-${String(month).padStart(2, '0')}-${dStr}`);
    days.push({
      day: d,
      date: `${year}-${String(month).padStart(2, '0')}-${dStr}`,
      dayOfWeek: vietnameseDays[dateObj.getDay()],
      isWeekend: dateObj.getDay() === 0
    });
  }

  const employees = db.employees.filter(e => e.active !== false);
  const allMonthAttendance = (db.attendance || []).filter(a => a.date.startsWith(currentYM));

  let storeTotalHours = 0;
  let storeTotalSalary = 0;

  const rows = employees.map(emp => {
    const empRecords = allMonthAttendance.filter(a => a.employeeId === emp.id);
    const dailyData = {};
    let empTotalHours = 0;
    let daysWorked = 0;

    days.forEach(dayInfo => {
      const dayLogs = empRecords.filter(a => a.date === dayInfo.date);
      if (dayLogs.length > 0) {
        let dayHours = 0;
        dayLogs.forEach(log => {
          if (log.status === 'completed') {
            dayHours += Number(log.totalHours || 0);
          }
        });

        dayHours = Number(dayHours.toFixed(2));
        empTotalHours += dayHours;
        if (dayHours > 0 || dayLogs.length > 0) daysWorked++;

        dailyData[dayInfo.day] = {
          hours: dayHours,
          logs: dayLogs
        };
      } else {
        dailyData[dayInfo.day] = {
          hours: 0,
          logs: []
        };
      }
    });

    empTotalHours = Number(empTotalHours.toFixed(2));
    const hourlyRate = emp.hourlyRate || (emp.name === 'Út' ? 25000 : 22000);
    const empTotalSalary = Math.round(empTotalHours * hourlyRate);

    storeTotalHours += empTotalHours;
    storeTotalSalary += empTotalSalary;

    return {
      employee: emp,
      dailyData: dailyData,
      totalHours: empTotalHours,
      daysWorked: daysWorked,
      hourlyRate: hourlyRate,
      totalSalary: empTotalSalary
    };
  });

  return {
    yearMonth: currentYM,
    branchName: "Trưng Nữ Vương",
    year,
    month,
    daysInMonth,
    days,
    rows,
    summary: {
      totalEmployees: employees.length,
      storeTotalHours: Number(storeTotalHours.toFixed(2)),
      storeTotalSalary: storeTotalSalary
    }
  };
}

// ---------------- SETTINGS ----------------
function getSettings() {
  const db = ensureDbFile();
  return db.settings || {};
}

function updateSettings(newSettings) {
  const db = ensureDbFile();
  db.settings = { ...db.settings, ...newSettings };
  saveDatabase(db);
  return db.settings;
}

function getShifts() {
  const db = ensureDbFile();
  return db.shifts || [];
}

module.exports = {
  getEmployees,
  getEmployeeByIdOrUsername,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  authenticateUser,
  getAttendance,
  getActiveShift,
  checkIn,
  checkOut,
  recordDailyWork,
  adjustAttendance,
  deleteAttendance,
  getEmployeeMonthlySummary,
  getMasterMonthlyReport,
  getSettings,
  updateSettings,
  getShifts
};
