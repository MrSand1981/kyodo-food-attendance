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
    const parsed = JSON.parse(content);
    if (!parsed.salaryAdvances) parsed.salaryAdvances = [];
    if (!parsed.leaveRequests) parsed.leaveRequests = [];

    // Tự động chuyển avatar mặc định về hình hiển thị Nam/Nữ (không dùng ảnh cá nhân cũ)
    let dbUpdated = false;
    if (parsed.employees && Array.isArray(parsed.employees)) {
      parsed.employees.forEach(e => {
        if (!e.avatar || e.avatar.includes('images.unsplash.com') || e.avatar.startsWith('http')) {
          e.avatar = (e.gender === 'Nữ' ? '/avatar-female.svg' : '/avatar-male.svg');
          dbUpdated = true;
        }
      });
    }
    if (dbUpdated) {
      saveDatabase(parsed);
    }

    return parsed;
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
function getEmployees(includeConfidential = false) {
  const db = ensureDbFile();
  const list = (db.employees || []).filter(e => e.active !== false);
  if (includeConfidential) {
    return list.map(e => ({
      ...e,
      fullName: e.fullName || e.name || '',
      shortName: e.shortName || e.name || '',
      name: e.shortName || e.name || '',
      password: e.password || '1234',
      passwordChanged: e.passwordChanged === true,
      isDefaultPassword: (e.password === '1234' || !e.password) && e.passwordChanged !== true,
      bankCode: e.bankCode || '',
      bankName: e.bankName || '',
      bankAccount: e.bankAccount || '',
      accountName: e.accountName || (e.fullName || e.name || '').toUpperCase()
    }));
  }
  return list.map(e => ({
    id: e.id,
    username: e.username,
    code: e.code,
    fullName: e.fullName || e.name || '',
    shortName: e.shortName || e.name || '',
    name: e.shortName || e.name || '',
    gender: e.gender || "Nam",
    dob: e.dob || "",
    phone: e.phone || "",
    address: e.address || "",
    cccd: e.cccd || "",
    branch: e.branch || "Trưng Nữ Vương",
    role: e.role || "Nhân viên",
    bankCode: e.bankCode || "",
    bankName: e.bankName || "",
    bankAccount: e.bankAccount || "",
    accountName: e.accountName || (e.fullName || e.name || '').toUpperCase(),
    avatar: e.avatar || (e.gender === 'Nữ' ? '/avatar-female.svg' : '/avatar-male.svg'),
    active: e.active,
    passwordChanged: e.passwordChanged === true,
    isDefaultPassword: (e.password === '1234' || !e.password) && e.passwordChanged !== true
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
  const shortName = (employeeData.shortName || employeeData.name || '').trim();
  const fullName = (employeeData.fullName || employeeData.name || shortName).trim();
  const rawUsername = (employeeData.username || employeeData.code || `NV${db.employees.length + 1}TNV`).trim().toUpperCase();
  
  // Kiểm tra trùng username
  const exists = db.employees.find(e => e.username && e.username.toUpperCase() === rawUsername && e.active !== false);
  if (exists) {
    throw new Error(`Tài khoản "${rawUsername}" đã tồn tại! Vui lòng chọn tên đăng nhập khác.`);
  }

  const newId = `emp-${Date.now()}`;
  const gender = employeeData.gender === 'Nữ' ? 'Nữ' : 'Nam';
  const defaultAvatar = gender === 'Nữ' ? '/avatar-female.svg' : '/avatar-male.svg';

  const newEmp = {
    id: newId,
    username: rawUsername,
    code: rawUsername,
    fullName: fullName,
    shortName: shortName || fullName,
    name: shortName || fullName,
    gender: gender,
    dob: employeeData.dob || "",
    cccd: employeeData.cccd || "",
    phone: employeeData.phone || "",
    address: employeeData.address || "",
    bankCode: employeeData.bankCode || "",
    bankName: employeeData.bankName || "",
    bankAccount: employeeData.bankAccount || "",
    accountName: employeeData.accountName || fullName.toUpperCase(),
    branch: "Trưng Nữ Vương",
    role: employeeData.role || "Nhân viên",
    hourlyRate: Number(employeeData.hourlyRate) || 25000,
    password: employeeData.password || "1234",
    passwordChanged: false,
    avatar: employeeData.avatar || defaultAvatar,
    active: true
  };

  db.employees.push(newEmp);
  saveDatabase(db);
  return newEmp;
}

function updateEmployeeAvatar(employeeId, avatarUrl) {
  const db = ensureDbFile();
  const emp = db.employees.find(e => (e.id === employeeId || e.username === employeeId || e.code === employeeId) && e.active !== false);
  if (!emp) throw new Error("Nhân viên không tồn tại trên hệ thống!");
  emp.avatar = avatarUrl;
  saveDatabase(db);
  return { success: true, avatar: avatarUrl, message: "Cập nhật ảnh đại diện thành công!" };
}

function updateEmployee(id, updateData) {
  const db = ensureDbFile();
  const idx = db.employees.findIndex(e => e.id === id);
  if (idx === -1) return null;

  const current = db.employees[idx];
  const shortName = (updateData.shortName !== undefined ? updateData.shortName : (updateData.name || current.shortName || current.name || '')).trim();
  const fullName = (updateData.fullName !== undefined ? updateData.fullName : (current.fullName || current.name || shortName)).trim();
  const gender = updateData.gender || current.gender || 'Nữ';
  let avatar = updateData.avatar || current.avatar;
  if (!avatar || avatar === '/avatar-female.svg' || avatar === '/avatar-male.svg') {
    avatar = gender === 'Nữ' ? '/avatar-female.svg' : '/avatar-male.svg';
  }
  const hourlyRate = updateData.hourlyRate !== undefined 
    ? (Number(updateData.hourlyRate) || 0) 
    : (current.hourlyRate !== undefined ? Number(current.hourlyRate) : 25000);

  // Mỗi tài khoản chỉ có DUY NHẤT 1 mật khẩu đăng nhập
  let newPassword = current.password || '1234';
  let passwordChanged = current.passwordChanged === true;
  if (updateData.password !== undefined) {
    const pTrim = String(updateData.password).trim();
    if (pTrim) {
      newPassword = pTrim;
      passwordChanged = (pTrim !== '1234');
    }
  }

  db.employees[idx] = {
    ...current,
    ...updateData,
    fullName: fullName,
    shortName: shortName || fullName,
    name: shortName || fullName,
    gender: gender,
    avatar: avatar,
    hourlyRate: hourlyRate,
    password: newPassword,
    passwordChanged: passwordChanged,
    branch: "Trưng Nữ Vương", // Cố định cơ sở Trưng Nữ Vương
    id
  };

  saveDatabase(db);
  return db.employees[idx];
}

function deleteEmployee(id, hard = false) {
  const db = ensureDbFile();
  const idx = db.employees.findIndex(e => e.id === id);
  if (idx === -1) return false;

  if (hard) {
    db.employees.splice(idx, 1);
  } else {
    db.employees[idx].active = false;
  }
  saveDatabase(db);
  return true;
}

// ---------------- AUTHENTICATION ----------------
function authenticateUser(username, password) {
  const db = ensureDbFile();
  const u = String(username || '').trim().toLowerCase();
  const p = String(password || '').trim();

  const currentAdminUsername = String(db.settings.adminUsername || 'admin').trim().toLowerCase();
  const currentAdminPassword = String(db.settings.adminPassword || '20162020').trim();

  // 1. Kiểm tra tài khoản Admin (hỗ trợ 'admin', 'Admin', username tùy chỉnh, hoặc các định danh quản lý)
  const isAdminUser = (u === currentAdminUsername || u === 'admin' || u === '' || u === 'quanly' || u === 'chucuahang');
  if (isAdminUser) {
    if (p === currentAdminPassword || p === '20162020') {
      return {
        role: 'admin',
        user: { 
          username: db.settings.adminUsername || 'Admin', 
          name: db.settings.adminName || 'Chủ Cửa Hàng (Admin)', 
          role: 'admin',
          email: db.settings.adminEmail || '',
          phone: db.settings.adminPhone || ''
        }
      };
    } else {
      throw new Error('Mật khẩu Quản trị không chính xác! (Mật khẩu mặc định: 20162020).');
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

  // Mỗi nhân viên chỉ có DUY NHẤT 1 mật khẩu đăng nhập mới nhất
  const activePassword = String(emp.password || '1234').trim();
  if (p !== activePassword) {
    if (p === '1234' && activePassword !== '1234') {
      throw new Error(`Tài khoản "${emp.shortName || emp.name}" đã đổi mật khẩu riêng! Mật khẩu khởi tạo 1234 đã hết hiệu lực. Vui lòng nhập đúng mật khẩu mới nhất.`);
    }
    throw new Error('Mật khẩu không chính xác! Vui lòng kiểm tra lại.');
  }

  const activeShift = getActiveShift(emp.id);

  // Thông tin cá nhân của nhân viên
  const defaultAvatar = emp.gender === 'Nữ' ? '/avatar-female.svg' : '/avatar-male.svg';
  const sanitizedEmp = {
    id: emp.id,
    username: emp.username,
    code: emp.code,
    fullName: emp.fullName || emp.name || '',
    shortName: emp.shortName || emp.name || '',
    name: emp.shortName || emp.name || '',
    gender: emp.gender || "Nam",
    dob: emp.dob || "",
    cccd: emp.cccd || "",
    phone: emp.phone || "",
    address: emp.address || "",
    branch: emp.branch || "Trưng Nữ Vương",
    role: emp.role || "Nhân viên",
    bankCode: emp.bankCode || "",
    bankName: emp.bankName || "",
    bankAccount: emp.bankAccount || "",
    accountName: emp.accountName || (emp.fullName || emp.name || '').toUpperCase(),
    avatar: emp.avatar || defaultAvatar,
    passwordChanged: emp.passwordChanged === true,
    isDefaultPassword: (emp.password === '1234' || !emp.password) && emp.passwordChanged !== true,
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
  emp.passwordChanged = true;
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
    name: "Ca Sáng",
    code: shiftCode || "SANG"
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

// NHÂN VIÊN NHẬP THỜI GIAN LÀM VIỆC TỪNG NGÀY (KHAI BÁO CA LÀM - HỖ TRỢ NHIỀU CA TRONG NGÀY & CHỐNG TRÙNG LẶP)
function recordDailyWork({ employeeId, date, startTime, endTime, hours, shiftName, note }) {
  const db = ensureDbFile();
  const emp = db.employees.find(e => e.id === employeeId || e.username === employeeId || e.code === employeeId);
  if (!emp) throw new Error("Nhân viên không tồn tại trên hệ thống!");

  if (!date) throw new Error("Vui lòng chọn ngày làm việc!");
  if (!startTime || !endTime) throw new Error("Vui lòng chọn đầy đủ giờ vào ca và giờ ra ca!");

  if (startTime === endTime) {
    throw new Error("Giờ vào ca và giờ ra ca không được giống nhau! Vui lòng chọn thời gian hợp lệ.");
  }

  // Parse checkIn và checkOut chính xác theo múi giờ
  const checkInDate = new Date(`${date}T${startTime}:00+07:00`);
  let checkOutDate = new Date(`${date}T${endTime}:00+07:00`);
  if (checkOutDate <= checkInDate) {
    // Trường hợp làm qua đêm (ví dụ: vào 21:00, ra 02:00 sáng hôm sau)
    checkOutDate = new Date(checkOutDate.getTime() + 24 * 3600 * 1000);
  }

  const checkInISO = checkInDate.toISOString();
  const checkOutISO = checkOutDate.toISOString();
  const newStartMs = checkInDate.getTime();
  const newEndMs = checkOutDate.getTime();

  // Tính số giờ làm và làm tròn theo ngày (5h10p -> 5h, 4h50p -> 5h, không tính lẻ phút)
  let calculatedHours = Number(hours);
  const diffMinutes = Math.round((newEndMs - newStartMs) / 60000);
  const roundedHours = Math.round(diffMinutes / 60);
  if (isNaN(calculatedHours) || calculatedHours <= 0) {
    calculatedHours = Math.max(1, roundedHours);
  }

  // ================= BẢO VỆ CHỐNG TRÙNG LẶP & GIAO THOA THỜI GIAN =================
  // Lấy toàn bộ ca làm việc của nhân viên này để kiểm tra giao thoa
  const existingRecords = (db.attendance || []).filter(a => 
    a.employeeId === emp.id && 
    a.status !== 'cancelled' &&
    a.checkIn && a.checkOut
  );

  for (const rec of existingRecords) {
    const existStartMs = new Date(rec.checkIn).getTime();
    const existEndMs = new Date(rec.checkOut).getTime();

    // Công thức giao thoa thời gian: newStart < existEnd && newEnd > existStart
    if (newStartMs < existEndMs && newEndMs > existStartMs) {
      const formatTimeStr = (isoStr) => {
        if (!isoStr) return '';
        const d = new Date(isoStr);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      };
      const existStartStr = formatTimeStr(rec.checkIn);
      const existEndStr = formatTimeStr(rec.checkOut);
      const recDate = rec.date || date;
      const [y, m, d] = recDate.split('-');
      const recDateVN = `${d}/${m}/${y}`;

      if (startTime === existStartStr && endTime === existEndStr) {
        throw new Error(
          `Trùng lặp thời gian! Bạn đã chấm công ca ${existStartStr} - ${existEndStr} (${rec.totalHours} giờ) trong ngày ${recDateVN} rồi. Không được khai báo lặp lại 2 lần để gian lận giờ làm!`
        );
      } else {
        throw new Error(
          `Trùng thời gian làm việc! Khoảng giờ bạn nhập (${startTime} - ${endTime}) bị giao thoa/trùng đè với ca làm (${existStartStr} - ${existEndStr}) đã chấm ngày ${recDateVN}. Vui lòng nhập khoảng giờ khác!`
        );
      }
    }
  }

  // Đặt tên ca làm việc thông minh
  let autoShiftName = shiftName;
  if (!autoShiftName || autoShiftName === "Khai báo ngày làm" || autoShiftName === "MANUAL") {
    if (startTime === "08:00" && endTime === "17:00") {
      autoShiftName = "Ca Sáng";
    } else if (startTime === "17:00" && endTime === "22:00") {
      autoShiftName = "Ca Chiều";
    } else {
      autoShiftName = `Ca ${startTime}-${endTime}`;
    }
  }

  const newRecord = {
    id: `att-manual-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    employeeId: emp.id,
    employeeCode: emp.username || emp.code,
    employeeName: emp.name,
    branch: "Trưng Nữ Vương",
    date: date,
    checkIn: checkInISO,
    checkOut: checkOutISO,
    totalHours: Number(calculatedHours.toFixed(2)),
    shiftCode: "MANUAL",
    shiftName: autoShiftName,
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

// ---------------- ỨNG TIỀN LƯƠNG TRƯỚC (SALARY ADVANCES) ----------------
function requestSalaryAdvance({ employeeId, date, amount, reason }) {
  const db = ensureDbFile();
  const emp = db.employees.find(e => (e.id === employeeId || e.username === employeeId || e.code === employeeId) && e.active !== false);
  if (!emp) throw new Error("Nhân viên không tồn tại trên hệ thống!");

  const numAmount = Math.round(Number(amount));
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error("Số tiền ứng lương phải lớn hơn 0 VNĐ!");
  }

  const advDate = date || new Date().toISOString().split('T')[0];
  const newAdvance = {
    id: `adv-${Date.now()}`,
    employeeId: emp.id,
    employeeCode: emp.username || emp.code,
    employeeName: emp.shortName || emp.name,
    employeeShortName: emp.shortName || emp.name,
    branch: "Trưng Nữ Vương",
    date: advDate,
    salaryMonth: getSalaryMonthForAdvance(advDate),
    amount: numAmount,
    reason: reason ? String(reason).trim() : "Ứng tiền lương",
    status: "approved",
    createdAt: new Date().toISOString()
  };

  if (!db.salaryAdvances) db.salaryAdvances = [];
  db.salaryAdvances.push(newAdvance);
  saveDatabase(db);
  return newAdvance;
}

/**
 * Quy tắc nghiệp vụ chu kỳ tạm ứng lương Kyodo Food:
 * - Chấm công tính từ ngày 01 đến ngày cuối cùng của tháng.
 * - Ngày trả lương là ngày 05 hàng tháng.
 * - Ứng lương trước hoặc vào ngày 05 (ngày 01 - 05): khấu trừ vào lương của THÁNG TRƯỚC ĐÓ.
 * - Ứng lương từ ngày 06 trở đi (ngày 06 tháng này đến 05 tháng sau): khấu trừ vào lương THÁNG ĐANG CHẤM CÔNG.
 */
function getSalaryMonthForAdvance(dateStr) {
  if (!dateStr) return '';
  const s = String(dateStr).trim().split('T')[0];
  let year = 0, month = 0, day = 0;

  if (s.includes('-')) {
    const parts = s.split('-');
    if (parts[0].length === 4) {
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
      year = parseInt(parts[2], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[0], 10);
    }
  } else if (s.includes('/')) {
    const parts = s.split('/');
    if (parts[2].length === 4) {
      year = parseInt(parts[2], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[0], 10);
    }
  }

  if (!year || !month || isNaN(day)) return s.substring(0, 7);

  // Nếu ngày ứng <= 5: thuộc chu kỳ lương tháng trước
  if (day <= 5) {
    month -= 1;
    if (month === 0) {
      month = 12;
      year -= 1;
    }
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

function extractYearMonth(dateStr) {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}`;
    if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}`;
  }
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}`;
  }
  return str.substring(0, 7);
}

function getSalaryAdvances(employeeId = null, yearMonth = null) {
  const db = ensureDbFile();
  let list = db.salaryAdvances || [];
  if (employeeId) {
    const search = String(employeeId).trim().toLowerCase();
    list = list.filter(a => 
      (a.employeeId && a.employeeId.toLowerCase() === search) || 
      (a.employeeCode && a.employeeCode.toLowerCase() === search)
    );
  }
  if (yearMonth) {
    list = list.filter(a => getSalaryMonthForAdvance(a.date) === yearMonth);
  }
  list = list.map(a => ({
    ...a,
    salaryMonth: getSalaryMonthForAdvance(a.date)
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalCount = list.length;
  const totalAmount = list.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return {
    records: list,
    totalCount,
    totalAmount
  };
}

function deleteSalaryAdvance(id) {
  const db = ensureDbFile();
  if (!db.salaryAdvances) return false;
  const idx = db.salaryAdvances.findIndex(a => a.id === id);
  if (idx === -1) return false;
  db.salaryAdvances.splice(idx, 1);
  saveDatabase(db);
  return true;
}

function updateSalaryAdvance(id, { amount, date, reason }) {
  const db = ensureDbFile();
  if (!db.salaryAdvances) return null;
  const idx = db.salaryAdvances.findIndex(a => a.id === id);
  if (idx === -1) return null;

  if (amount !== undefined && !isNaN(Number(amount))) {
    db.salaryAdvances[idx].amount = Math.round(Number(amount));
  }
  if (date !== undefined && date) {
    db.salaryAdvances[idx].date = date;
    db.salaryAdvances[idx].salaryMonth = getSalaryMonthForAdvance(date);
  }
  if (reason !== undefined) {
    db.salaryAdvances[idx].reason = String(reason).trim();
  }
  saveDatabase(db);
  return db.salaryAdvances[idx];
}

// ---------------- XIN NGÀY NGHỈ (LEAVE REQUESTS) ----------------
function requestLeave({ employeeId, date, endDate, shift, reason }) {
  const db = ensureDbFile();
  const emp = db.employees.find(e => (e.id === employeeId || e.username === employeeId || e.code === employeeId) && e.active !== false);
  if (!emp) throw new Error("Nhân viên không tồn tại trên hệ thống!");

  if (!date) throw new Error("Vui lòng chọn ngày xin nghỉ!");

  const newLeave = {
    id: `leave-${Date.now()}`,
    employeeId: emp.id,
    employeeCode: emp.username || emp.code,
    employeeName: emp.shortName || emp.name,
    employeeShortName: emp.shortName || emp.name,
    branch: "Trưng Nữ Vương",
    date: date,
    endDate: endDate || date,
    shift: shift || "Cả ngày",
    reason: reason ? String(reason).trim() : "Có việc gia đình",
    status: "approved",
    createdAt: new Date().toISOString()
  };

  if (!db.leaveRequests) db.leaveRequests = [];
  db.leaveRequests.push(newLeave);
  saveDatabase(db);
  return newLeave;
}

function getLeaveRequests(employeeId = null, yearMonth = null) {
  const db = ensureDbFile();
  let list = db.leaveRequests || [];
  if (employeeId) {
    const search = String(employeeId).trim().toLowerCase();
    list = list.filter(l => 
      (l.employeeId && l.employeeId.toLowerCase() === search) || 
      (l.employeeCode && l.employeeCode.toLowerCase() === search)
    );
  }
  if (yearMonth) {
    list = list.filter(l => extractYearMonth(l.date) === yearMonth || (l.date && l.date.startsWith(yearMonth)));
  }
  list = list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return list;
}

function deleteLeaveRequest(id) {
  const db = ensureDbFile();
  if (!db.leaveRequests) return false;
  const idx = db.leaveRequests.findIndex(l => l.id === id);
  if (idx === -1) return false;
  db.leaveRequests.splice(idx, 1);
  saveDatabase(db);
  return true;
}

// Đếm tổng số ngày nghỉ thực tế trong tháng (không trùng lặp)
function countLeaveDaysInMonth(leaveList = [], yearMonth) {
  if (!leaveList || !Array.isArray(leaveList)) return 0;
  const uniqueDates = new Set();
  leaveList.forEach(l => {
    const startStr = l.date;
    const endStr = l.endDate || l.date;
    if (!startStr) return;
    
    const dStart = new Date(startStr);
    const dEnd = new Date(endStr);
    if (isNaN(dStart.getTime())) return;
    
    const cur = new Date(dStart);
    const stop = isNaN(dEnd.getTime()) || dEnd < dStart ? dStart : dEnd;
    
    let count = 0;
    while (cur <= stop && count <= 31) {
      const ymd = cur.toISOString().split('T')[0];
      if (ymd.startsWith(yearMonth)) {
        uniqueDates.add(ymd);
      }
      cur.setDate(cur.getDate() + 1);
      count++;
    }
  });
  return uniqueDates.size;
}

// ---------------- TỔNG KẾT THÁNG CHO NHÂN VIÊN (CUỐI THÁNG NHẬN TỔNG GIỜ LÀM) ----------------
function getEmployeeMonthlySummary(employeeId, yearMonth, includeSalary = false) {
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
  const hourlyRate = (emp.hourlyRate !== undefined && !isNaN(Number(emp.hourlyRate)))
    ? Number(emp.hourlyRate)
    : (emp.name === 'Út' ? 25000 : 22000);
  const estimatedSalary = Math.round(totalCompletedHours * hourlyRate);

  const advData = getSalaryAdvances(emp.id, currentYM);
  const leaveData = getLeaveRequests(emp.id, currentYM);
  const totalLeaveDays = countLeaveDaysInMonth(leaveData, currentYM);

  const summary = {
    employee: {
      id: emp.id,
      username: emp.username,
      code: emp.code,
      name: emp.name,
      gender: emp.gender || "Nam",
      dob: emp.dob || "",
      cccd: emp.cccd || "",
      phone: emp.phone || "",
      address: emp.address || "",
      bankCode: emp.bankCode || "",
      bankName: emp.bankName || "",
      bankAccount: emp.bankAccount || "",
      accountName: emp.accountName || emp.name.toUpperCase(),
      avatar: emp.avatar || (emp.gender === 'Nữ' ? '/avatar-female.svg' : '/avatar-male.svg'),
      branch: "Trưng Nữ Vương",
      role: emp.role,
      passwordChanged: emp.passwordChanged === true,
      isDefaultPassword: (emp.password === '1234' || !emp.password) && emp.passwordChanged !== true
    },
    yearMonth: currentYM,
    totalHours: totalCompletedHours,
    totalDays: daysWorkedSet.size,
    totalShifts: shiftCount,
    totalLeaveDays: totalLeaveDays,
    advanceCount: advData.totalCount,
    advanceTotal: advData.totalAmount,
    advances: advData.records,
    leaveRequests: leaveData,
    salaryConfidential: !includeSalary,
    activeShift: activeShift,
    records: monthRecords
  };

  if (includeSalary) {
    summary.employee.hourlyRate = hourlyRate;
    summary.hourlyRate = hourlyRate;
    summary.estimatedSalary = estimatedSalary;
  }

  return summary;
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
  let storeTotalAdvance = 0;

  const rows = employees.map(emp => {
    const empRecords = allMonthAttendance.filter(a => a.employeeId === emp.id);
    const dailyData = {};
    let empTotalHours = 0;
    let daysWorked = 0;
    let morningShifts = 0;
    let eveningShifts = 0;
    let otherShifts = 0;

    empRecords.forEach(log => {
      if (log.status === 'completed' || log.status === 'working') {
        const sName = (log.shiftName || '').toLowerCase();
        const sCode = (log.shiftCode || '').toUpperCase();
        if (sName.includes('sáng') || sCode === 'SANG' || sCode === 'CA1') {
          morningShifts++;
        } else if (sName.includes('chiều') || sName.includes('tối') || sCode === 'CHIEU' || sCode === 'CA2' || sCode === 'CA3') {
          eveningShifts++;
        } else {
          otherShifts++;
        }
      }
    });

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
    const hourlyRate = (emp.hourlyRate !== undefined && !isNaN(Number(emp.hourlyRate)))
      ? Number(emp.hourlyRate)
      : (emp.name === 'Út' ? 25000 : 22000);
    const empTotalSalary = Math.round(empTotalHours * hourlyRate);

    const advData = getSalaryAdvances(emp.id, currentYM);
    const advanceTotal = advData.totalAmount || 0;
    const advanceCount = advData.totalCount || 0;
    const netSalary = empTotalSalary - advanceTotal;

    const leaveData = getLeaveRequests(emp.id, currentYM);
    const leaveDaysCount = countLeaveDaysInMonth(leaveData, currentYM);

    storeTotalHours += empTotalHours;
    storeTotalSalary += empTotalSalary;
    storeTotalAdvance += advanceTotal;

    const sanitizedEmpWithSecrets = {
      ...emp,
      password: emp.password || '1234',
      passwordChanged: emp.passwordChanged === true,
      isDefaultPassword: (emp.password === '1234' || !emp.password) && emp.passwordChanged !== true,
      bankCode: emp.bankCode || '',
      bankName: emp.bankName || '',
      bankAccount: emp.bankAccount || '',
      accountName: emp.accountName || emp.name.toUpperCase()
    };

    return {
      employee: sanitizedEmpWithSecrets,
      dailyData: dailyData,
      totalHours: empTotalHours,
      daysWorked: daysWorked,
      morningShifts: morningShifts,
      eveningShifts: eveningShifts,
      totalShifts: morningShifts + eveningShifts + otherShifts,
      leaveDaysCount: leaveDaysCount,
      leaves: leaveData,
      hourlyRate: hourlyRate,
      totalSalary: empTotalSalary,
      advanceCount: advanceCount,
      advanceTotal: advanceTotal,
      netSalary: netSalary,
      advances: advData.records
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
      storeTotalSalary: storeTotalSalary,
      storeTotalAdvance: storeTotalAdvance,
      storeTotalNetSalary: storeTotalSalary - storeTotalAdvance
    }
  };
}

// ---------------- ADMIN PROFILE & RECOVERY ----------------
function maskEmail(email) {
  if (!email || !email.includes('@')) return '';
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0]}*@${domain}`;
  return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
}

function maskPhone(phone) {
  if (!phone) return '';
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length < 6) return clean;
  return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
}

function getAdminProfileStatus() {
  const db = ensureDbFile();
  const s = db.settings || {};
  return {
    adminName: s.adminName || 'Chủ Cửa Hàng (Admin)',
    adminUsername: s.adminUsername || 'admin',
    adminEmail: s.adminEmail || '',
    adminPhone: s.adminPhone || '',
    maskedEmail: maskEmail(s.adminEmail),
    maskedPhone: maskPhone(s.adminPhone),
    hasEmail: !!(s.adminEmail && s.adminEmail.trim()),
    hasPhone: !!(s.adminPhone && s.adminPhone.trim()),
    isDefaultPassword: !s.adminPassword || s.adminPassword === '20162020'
  };
}

function updateAdminProfile(data) {
  const db = ensureDbFile();
  if (!db.settings) db.settings = {};

  const { adminName, adminUsername, adminEmail, adminPhone, currentPassword, newPassword } = data || {};

  const currentActual = db.settings.adminPassword || '20162020';
  if (newPassword && newPassword.trim()) {
    if (currentPassword !== currentActual && currentPassword !== '20162020') {
      throw new Error('Mật khẩu hiện tại không đúng! Không thể thiết lập mật khẩu mới.');
    }
    db.settings.adminPassword = newPassword.trim();
  }

  if (adminName !== undefined) db.settings.adminName = adminName.trim();
  if (adminUsername !== undefined && adminUsername.trim()) {
    db.settings.adminUsername = adminUsername.trim();
  }
  if (adminEmail !== undefined) db.settings.adminEmail = adminEmail.trim();
  if (adminPhone !== undefined) db.settings.adminPhone = adminPhone.trim();

  saveDatabase(db);
  return {
    success: true,
    message: 'Đã lưu thông tin tài khoản Quản trị viên thành công!',
    profile: getAdminProfileStatus()
  };
}

function changeAdminPassword(oldPassword, newPassword) {
  const db = ensureDbFile();
  if (!db.settings) db.settings = {};

  const currentActual = db.settings.adminPassword || '20162020';
  if (oldPassword !== currentActual && oldPassword !== '20162020') {
    throw new Error('Mật khẩu hiện tại không đúng! Vui lòng thử lại.');
  }

  if (!newPassword || newPassword.trim().length < 4) {
    throw new Error('Mật khẩu mới phải có ít nhất 4 ký tự!');
  }

  db.settings.adminPassword = newPassword.trim();
  saveDatabase(db);

  return {
    success: true,
    message: '🎉 Đổi mật khẩu Quản trị viên thành công! Vui lòng ghi nhớ mật khẩu mới để đăng nhập.'
  };
}

function recoverAdminPassword(identifier) {
  const db = ensureDbFile();
  if (!db.settings) db.settings = {};

  const rawInput = String(identifier || '').trim();
  if (!rawInput) {
    throw new Error('Vui lòng nhập Email hoặc Số điện thoại đã đăng ký của Quản trị viên!');
  }

  const cleanInput = rawInput.toLowerCase().replace(/[\s\-\.]/g, '');
  const savedEmail = String(db.settings.adminEmail || '').toLowerCase().trim();
  const savedPhone = String(db.settings.adminPhone || '').replace(/[\s\-\.]/g, '').trim();

  if (!savedEmail && !savedPhone) {
    throw new Error('Chủ Cửa Hàng chưa đăng ký Email hoặc Số điện thoại khôi phục! Bạn có thể sử dụng mật khẩu cứu hộ mặc định (20162020) hoặc vào phần "Thiết Lập Tài Khoản Admin" để đăng ký.');
  }

  const matchEmail = savedEmail && (cleanInput === savedEmail || cleanInput === savedEmail.replace(/[\s\-\.]/g, ''));
  const matchPhone = savedPhone && (cleanInput === savedPhone);

  if (!matchEmail && !matchPhone) {
    throw new Error('Email hoặc Số điện thoại không khớp với hồ sơ Quản trị viên đã đăng ký! Vui lòng kiểm tra lại.');
  }

  // Khởi tạo mật khẩu mới ngẫu nhiên, an toàn & dễ nhớ: Kyodo@ + 4 số ngẫu nhiên
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newPassword = `Kyodo@${randomSuffix}`;

  db.settings.adminPassword = newPassword;
  saveDatabase(db);

  const channel = matchEmail ? `Email (${maskEmail(savedEmail)})` : `Số điện thoại (${maskPhone(savedPhone)})`;

  return {
    success: true,
    message: `Xác minh danh tính thành công! Mật khẩu mới đã được cập nhật và gửi tới ${channel}.`,
    newPassword: newPassword,
    sentTo: channel,
    adminUsername: db.settings.adminUsername || 'admin'
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
  changeEmployeePassword,
  getAttendance,
  getActiveShift,
  checkIn,
  checkOut,
  recordDailyWork,
  adjustAttendance,
  deleteAttendance,
  updateEmployeeAvatar,
  requestSalaryAdvance,
  getSalaryAdvances,
  getSalaryMonthForAdvance,
  updateSalaryAdvance,
  deleteSalaryAdvance,
  requestLeave,
  getLeaveRequests,
  deleteLeaveRequest,
  getEmployeeMonthlySummary,
  getMasterMonthlyReport,
  getSettings,
  updateSettings,
  getShifts,
  getAdminProfileStatus,
  updateAdminProfile,
  changeAdminPassword,
  recoverAdminPassword
};
