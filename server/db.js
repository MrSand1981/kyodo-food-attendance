// server/db.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const os = require('os');
const { MongoClient } = require('mongodb');
const { generateSeedData } = require('./seedData');
const XLSX = require('xlsx');

const BUNDLED_DB_PATH = path.join(__dirname, '..', 'data', 'database.json');
// Trên Vercel (serverless), thư mục gốc là read-only nên cần ghi file tạm vào /tmp
const DB_PATH = process.env.VERCEL
  ? path.join(os.tmpdir(), 'kyodo_database.json')
  : BUNDLED_DB_PATH;

let mongoClient = null;
let mongoDb = null;
let isMongo = false;
let mongoConnectPromise = null;
let pendingSyncPromise = null;

async function connectMongo() {
  if (!process.env.MONGODB_URI) return null;
  if (isMongo && mongoDb) return mongoDb;
  if (mongoConnectPromise) return mongoConnectPromise;

  mongoConnectPromise = MongoClient.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000
  })
    .then(async (client) => {
      mongoClient = client;
      mongoDb = client.db('kyodo_food');
      isMongo = true;
      console.log('✅ Đã kết nối Cơ sở dữ liệu Cloud MongoDB Atlas thành công!');
      return mongoDb;
    })
    .catch((err) => {
      console.warn('⚠️ Không thể kết nối MongoDB Cloud, chuyển sang dùng database.json:', err.message);
      mongoConnectPromise = null;
      return null;
    });

  return mongoConnectPromise;
}

// Đồng bộ dữ liệu mới nhất từ MongoDB Atlas về bộ nhớ đệm trước mỗi request
async function syncFromCloud() {
  if (!process.env.MONGODB_URI) return;
  try {
    const dbConn = await connectMongo();
    if (!dbConn) return;

    const doc = await dbConn.collection('app_state').findOne({ _id: 'master_db' });
    if (doc && doc.data) {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(DB_PATH, JSON.stringify(doc.data, null, 2), 'utf-8');
    } else {
      // Nếu trên MongoDB chưa có dữ liệu, đẩy dữ liệu khởi tạo lên Cloud
      const localData = ensureDbFile();
      await dbConn.collection('app_state').updateOne(
        { _id: 'master_db' },
        { $set: { data: localData, updatedAt: new Date() } },
        { upsert: true }
      );
    }
  } catch (err) {
    console.warn('⚠️ Lỗi đồng bộ từ MongoDB Cloud:', err.message);
  }
}

async function flushCloudSync() {
  if (pendingSyncPromise) {
    try {
      await pendingSyncPromise;
    } catch (err) {
      console.error('Lỗi chờ đồng bộ MongoDB:', err.message);
    } finally {
      pendingSyncPromise = null;
    }
  }
}

// Khởi tạo kết nối ngay khi chạy server
if (process.env.MONGODB_URI) {
  syncFromCloud();
}

function ensureDbFile() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    // Nếu đang ở môi trường Vercel (/tmp) và có sẵn file gốc trong repo thì copy sang
    if (DB_PATH !== BUNDLED_DB_PATH && fs.existsSync(BUNDLED_DB_PATH)) {
      try {
        const bundled = JSON.parse(fs.readFileSync(BUNDLED_DB_PATH, 'utf-8'));
        fs.writeFileSync(DB_PATH, JSON.stringify(bundled, null, 2), 'utf-8');
        return bundled;
      } catch (e) {
        // fallback xuống dưới
      }
    }
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
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmpPath = `${DB_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, DB_PATH);
  } catch (err) {
    console.warn('⚠️ Không thể ghi file cục bộ:', err.message);
  }

  // Nếu có MongoDB Cloud, đồng bộ lên Cloud
  if (process.env.MONGODB_URI) {
    pendingSyncPromise = connectMongo().then((dbConn) => {
      if (!dbConn) return;
      return dbConn.collection('app_state').updateOne(
        { _id: 'master_db' },
        { $set: { data: data, updatedAt: new Date() } },
        { upsert: true }
      );
    }).catch(err => console.error('Lỗi sync MongoDB:', err.message));
  }
}

// ---------------- EMPLOYEES ----------------
function getEmployees(includeConfidential = false) {
  const db = ensureDbFile();
  const list = (db.employees || []).filter(e => e.active !== false);
  if (includeConfidential) return list;
  return list.map(e => ({
    id: e.id,
    username: e.username,
    code: e.code,
    name: e.name,
    gender: e.gender,
    branch: e.branch || "Trưng Nữ Vương",
    role: e.role || "Nhân viên",
    avatar: e.avatar,
    active: e.active
  }));
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
    branch: "Trưng Nữ Vương",
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

  // Che giấu tuyệt đối thông tin lương và mật khẩu cho nhân viên
  const sanitizedEmp = {
    id: emp.id,
    username: emp.username,
    code: emp.code,
    name: emp.name,
    gender: emp.gender,
    branch: emp.branch || "Trưng Nữ Vương",
    role: emp.role || "Nhân viên",
    avatar: emp.avatar,
    active: emp.active
  };

  return {
    role: 'employee',
    user: sanitizedEmp,
    activeShift
  };
}

// Nhân viên tự đổi mật khẩu riêng biệt
function changeEmployeePassword(employeeId, oldPassword, newPassword) {
  const db = ensureDbFile();
  const emp = db.employees.find(e => (e.id === employeeId || e.username === employeeId || e.code === employeeId) && e.active !== false);
  if (!emp) throw new Error("Nhân viên không tồn tại trên hệ thống!");

  const curPass = String(oldPassword || '').trim();
  if (emp.password && emp.password !== curPass) {
    throw new Error("Mật khẩu hiện tại không chính xác!");
  }

  const newPass = String(newPassword || '').trim();
  if (!newPass || newPass.length < 4) {
    throw new Error("Mật khẩu mới phải có ít nhất 4 ký tự!");
  }

  emp.password = newPass;
  saveDatabase(db);
  return { success: true, message: "Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn." };
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

// Chấm công vào ca trực tiếp - KHÔNG CẦN CHỌN CA, CHỈ CẦN GIỜ VÀO
function checkIn({ employeeId, startTime, note }) {
  const db = ensureDbFile();
  const emp = db.employees.find(e => e.id === employeeId);
  if (!emp) throw new Error("Không tìm thấy nhân viên");

  const active = (db.attendance || []).find(a => a.employeeId === employeeId && a.status === 'working');
  if (active) {
    throw new Error("Bạn đang trong ca làm việc, vui lòng bấm Kết Thúc Ca trước!");
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  // Sử dụng giờ vào từ tham số hoặc giờ hiện tại
  let checkInTime = now.toISOString();
  if (startTime) {
    checkInTime = new Date(`${dateStr}T${startTime}:00+07:00`).toISOString();
  }

  const newRecord = {
    id: `att-${Date.now()}`,
    employeeId: emp.id,
    employeeCode: emp.username || emp.code,
    employeeName: emp.name,
    branch: "Trưng Nữ Vương",
    date: dateStr,
    checkIn: checkInTime,
    checkOut: null,
    totalHours: 0,
    shiftCode: null,
    shiftName: "Tự do",
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

// ---------------- SHARED SHIFTS (CHIA CA 2 NHÂN VIÊN) ----------------
// Mỗi record: { id, date, shiftCode, shiftName, emp1Id, emp1Hours, emp2Id, emp2Hours, note, createdAt, createdBy }

function getSharedShifts(filters = {}) {
  const db = ensureDbFile();
  let list = db.sharedShifts || [];

  if (filters.date) {
    list = list.filter(s => s.date === filters.date);
  }
  if (filters.yearMonth) {
    list = list.filter(s => s.date.startsWith(filters.yearMonth));
  }
  if (filters.shiftCode) {
    list = list.filter(s => s.shiftCode === filters.shiftCode);
  }
  if (filters.employeeId) {
    list = list.filter(s => s.emp1Id === filters.employeeId || s.emp2Id === filters.employeeId);
  }

  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function createSharedShift(data) {
  const db = ensureDbFile();
  const emp1 = db.employees.find(e => e.id === data.emp1Id);
  const emp2 = db.employees.find(e => e.id === data.emp2Id);
  if (!emp1 || !emp2) throw new Error("Nhân viên không tồn tại");

  // Kiểm tra đã có record cho ngày/ca này chưa
  const existing = db.sharedShifts.find(s => 
    s.date === data.date && s.shiftCode === data.shiftCode
  );
  if (existing) {
    throw new Error(`Đã có lịch chia ca cho ${data.date} - ${data.shiftCode}!`);
  }

  const newId = `ss-${Date.now()}`;
  const newRecord = {
    id: newId,
    date: data.date,
    shiftCode: data.shiftCode,
    shiftName: data.shiftName,
    emp1Id: emp1.id,
    emp1Code: emp1.username || emp1.code,
    emp1Name: emp1.name,
    emp1Hours: Number(data.emp1Hours) || 0,
    emp2Id: emp2.id,
    emp2Code: emp2.username || emp2.code,
    emp2Name: emp2.name,
    emp2Hours: Number(data.emp2Hours) || 0,
    note: data.note || "",
    createdAt: new Date().toISOString(),
    createdBy: data.createdBy || 'system'
  };

  db.sharedShifts.push(newRecord);
  saveDatabase(db);
  return newRecord;
}

function updateSharedShift(id, updateData) {
  const db = ensureDbFile();
  const idx = db.sharedShifts.findIndex(s => s.id === id);
  if (idx === -1) throw new Error("Lịch chia ca không tồn tại");

  db.sharedShifts[idx] = { ...db.sharedShifts[idx], ...updateData, id };
  saveDatabase(db);
  return db.sharedShifts[idx];
}

function deleteSharedShift(id) {
  const db = ensureDbFile();
  const idx = db.sharedShifts.findIndex(s => s.id === id);
  if (idx === -1) return false;

  db.sharedShifts.splice(idx, 1);
  saveDatabase(db);
  return true;
}

// Tự động tạo attendance records từ sharedShifts (dùng cho báo cáo)
function generateAttendanceFromSharedShifts(sharedShifts) {
  const records = [];
  sharedShifts.forEach(s => {
    // Nhân viên 1
    if (s.emp1Hours > 0) {
      records.push({
        id: `att-shared-${s.id}-1`,
        employeeId: s.emp1Id,
        employeeCode: s.emp1Code,
        employeeName: s.emp1Name,
        branch: "Trưng Nữ Vương",
        date: s.date,
        checkIn: new Date(`${s.date}T08:00:00+07:00`).toISOString(),
        checkOut: new Date(`${s.date}T${Number(s.emp1Hours) + 8}:00:00+07:00`).toISOString(),
        totalHours: s.emp1Hours,
        shiftCode: s.shiftCode,
        shiftName: s.shiftName,
        status: "completed",
        note: `Chia ca: ${s.note || ''}`,
        photo: null,
        isShared: true,
        sharedShiftId: s.id
      });
    }
    // Nhân viên 2
    if (s.emp2Hours > 0) {
      records.push({
        id: `att-shared-${s.id}-2`,
        employeeId: s.emp2Id,
        employeeCode: s.emp2Code,
        employeeName: s.emp2Name,
        branch: "Trưng Nữ Vương",
        date: s.date,
        checkIn: new Date(`${s.date}T08:00:00+07:00`).toISOString(),
        checkOut: new Date(`${s.date}T${Number(s.emp2Hours) + 8}:00:00+07:00`).toISOString(),
        totalHours: s.emp2Hours,
        shiftCode: s.shiftCode,
        shiftName: s.shiftName,
        status: "completed",
        note: `Chia ca: ${s.note || ''}`,
        photo: null,
        isShared: true,
        sharedShiftId: s.id
      });
    }
  });
  return records;
}

// ---------------- TỔNG KẾT THÁNG CHO NHÂN VIÊN ----------------
function getEmployeeMonthlySummary(employeeId, yearMonth, includeSalary = false) {
  const db = ensureDbFile();
  const emp = db.employees.find(e => e.id === employeeId || e.username === employeeId || e.code === employeeId);
  if (!emp) throw new Error("Nhân viên không tồn tại");

  const currentYM = yearMonth || new Date().toISOString().substring(0, 7);

  // Gộp attendance thường + shared shifts
  const monthAttendance = (db.attendance || []).filter(
    a => a.employeeId === emp.id && a.date.startsWith(currentYM)
  );

  // Thêm shared shifts
  const monthSharedShifts = (db.sharedShifts || []).filter(
    s => s.date.startsWith(currentYM) && (s.emp1Id === emp.id || s.emp2Id === emp.id)
  );
  const sharedAttRecords = generateAttendanceFromSharedShifts(monthSharedShifts).filter(
    a => a.employeeId === emp.id
  );

  const allRecords = [...monthAttendance, ...sharedAttRecords].sort(
    (a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()
  );

  let totalCompletedHours = 0;
  let activeShift = null;
  const daysWorkedSet = new Set();
  let shiftCount = 0;

  allRecords.forEach(rec => {
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

  const summary = {
    employee: {
      id: emp.id,
      username: emp.username,
      code: emp.code,
      name: emp.name,
      gender: emp.gender,
      branch: "Trưng Nữ Vương",
      role: emp.role
    },
    yearMonth: currentYM,
    totalHours: totalCompletedHours,
    totalDays: daysWorkedSet.size,
    totalShifts: shiftCount,
    salaryConfidential: !includeSalary,
    activeShift: activeShift,
    records: allRecords
  };

  if (includeSalary) {
    summary.employee.hourlyRate = hourlyRate;
    summary.hourlyRate = hourlyRate;
    summary.estimatedSalary = estimatedSalary;
  }

  return summary;
}

// ---------------- BẢNG TỔNG HỢP CỬA HÀNG (ADMIN) ----------------
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
  
  // Gộp attendance + shared shifts
  const allMonthAttendance = (db.attendance || []).filter(a => a.date.startsWith(currentYM));
  const monthSharedShifts = (db.sharedShifts || []).filter(s => s.date.startsWith(currentYM));
  const sharedAttRecords = generateAttendanceFromSharedShifts(monthSharedShifts);
  
  const allRecords = [...allMonthAttendance, ...sharedAttRecords];

  let storeTotalHours = 0;
  let storeTotalSalary = 0;

  const rows = employees.map(emp => {
    const empRecords = allRecords.filter(a => a.employeeId === emp.id);
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

// ---------------- EXPORT EXCEL (CHẤM CÔNG) ----------------
function exportAttendanceExcel(report) {
  const titleRow = [`BẢNG CHẤM CÔNG THEO GIỜ KYODO FOODS - CƠ SỞ TRƯNG NỮ VƯƠNG (${report.yearMonth})`];
  const headerRow1 = ['Tài khoản', 'Tên nhân viên', 'Cơ sở'];
  const headerRow2 = ['', '', ''];

  report.days.forEach(d => {
    headerRow1.push(`${d.day}`);
    headerRow2.push(d.dayOfWeek);
  });

  headerRow1.push('Tổng giờ làm', 'Lương mỗi giờ', 'Tổng tiền lương');
  headerRow2.push('', '', '');

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

    row.push(r.totalHours, r.hourlyRate, r.totalSalary);
    excelRows.push(row);
  });

  const totalRow = ['TỔNG CỘNG', '', ''];
  report.days.forEach(() => totalRow.push(''));
  totalRow.push(report.summary.storeTotalHours, '', report.summary.storeTotalSalary);
  excelRows.push(totalRow);

  const ws = XLSX.utils.aoa_to_sheet(excelRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Kyodo_TNV_${report.yearMonth}`);

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
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
  changeEmployeePassword,
  getAttendance,
  getActiveShift,
  checkIn,
  checkOut,
  recordDailyWork,
  adjustAttendance,
  deleteAttendance,
  getEmployeeMonthlySummary,
  getMasterMonthlyReport,
  exportAttendanceExcel,
  getSettings,
  updateSettings,
  getShifts,
  // SHARED SHIFTS (NEW)
  getSharedShifts,
  createSharedShift,
  updateSharedShift,
  deleteSharedShift,
  generateAttendanceFromSharedShifts,
  // CLOUD SYNC
  syncFromCloud,
  flushCloudSync
};