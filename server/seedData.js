// server/seedData.js
// Dữ liệu chuẩn cho Kyodo Food - Cơ sở duy nhất: Trưng Nữ Vương
// Sẵn sàng hoạt động chính thức từ ngày 01/11/2026

function generateSeedData() {
  const employees = [
    {
      id: "emp-ut",
      username: "UTNVTNV",
      code: "UTNVTNV",
      fullName: "",
      shortName: "Út",
      name: "Út",
      gender: "Nữ",
      dob: "",
      cccd: "",
      phone: "",
      address: "",
      branch: "Trưng Nữ Vương",
      role: "Nhân viên",
      hourlyRate: 25000,
      bankCode: "",
      bankName: "",
      bankAccount: "",
      accountName: "",
      password: "1234",
      passwordChanged: false,
      active: true,
      avatar: "/avatar-female.svg"
    },
    {
      id: "emp-bao",
      username: "BAONVTNV",
      code: "BAONVTNV",
      fullName: "",
      shortName: "Bảo",
      name: "Bảo",
      gender: "Nam",
      dob: "",
      cccd: "",
      phone: "",
      address: "",
      branch: "Trưng Nữ Vương",
      role: "Nhân viên",
      hourlyRate: 22000,
      bankCode: "",
      bankName: "",
      bankAccount: "",
      accountName: "",
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
