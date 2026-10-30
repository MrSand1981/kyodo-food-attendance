// server/seedData.js
// Dữ liệu chuẩn cho Kyodo Food - Cơ sở duy nhất: Trưng Nữ Vương
// Sẵn sàng hoạt động chính thức từ ngày 01/11/2026

function generateSeedData() {
  const employees = [
    {
      id: "emp-ut",
      username: "UTNVTNV",
      code: "UTNVTNV",
      name: "Út",
      gender: "Nữ",
      dob: "2002-08-15",
      cccd: "048102001234",
      phone: "0905111222",
      address: "Hải Châu, Đà Nẵng",
      branch: "Trưng Nữ Vương",
      role: "Nhân viên",
      hourlyRate: 25000,
      bankCode: "VCB",
      bankName: "Vietcombank",
      bankAccount: "102008151234",
      accountName: "NGUYEN THI UT",
      password: "1234",
      passwordChanged: false,
      active: true,
      avatar: "/avatar-female.svg"
    },
    {
      id: "emp-bao",
      username: "BAONVTNV",
      code: "BAONVTNV",
      name: "Bảo",
      gender: "Nam",
      dob: "2001-03-20",
      cccd: "048201005678",
      phone: "0905333444",
      address: "Thanh Khê, Đà Nẵng",
      branch: "Trưng Nữ Vương",
      role: "Nhân viên",
      hourlyRate: 22000,
      bankCode: "MB",
      bankName: "MB Bank",
      bankAccount: "0905333444",
      accountName: "LE HOANG BAO",
      password: "1234",
      passwordChanged: false,
      active: true,
      avatar: "/avatar-male.svg"
    }
  ];

  const shifts = [
    { code: "SANG", name: "Full Ca Sáng", duration: 9, defaultStart: "08:00", defaultEnd: "17:00", note: "08:00 - 17:00 (9 tiếng)" },
    { code: "TOI", name: "Full Ca Tối", duration: 5, defaultStart: "17:00", defaultEnd: "22:00", note: "17:00 - 22:00 (5 tiếng)" }
  ];

  const settings = {
    storeName: "Kyodo Food",
    branchName: "Trưng Nữ Vương",
    tagline: "Cửa hàng Kyodo Food - Trưng Nữ Vương, Đà Nẵng",
    logoUrl: "/logo-kyodo.png",
    adminUsername: "admin",
    adminPassword: "20162020",
    githubRepo: "https://github.com/MrSand1981/kyodo-food-attendance"
  };

  // Dữ liệu chấm công trống 100% để bắt đầu tính từ ngày 01/11/2026
  const attendance = [];
  const salaryAdvances = [];
  const leaveRequests = [];

  return {
    employees,
    shifts,
    settings,
    attendance,
    salaryAdvances,
    leaveRequests
  };
}

module.exports = { generateSeedData };
