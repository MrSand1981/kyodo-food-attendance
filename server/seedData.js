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
      branch: "Trưng Nữ Vương",
      role: "Nhân viên",
      hourlyRate: 25000,
      password: "1234",
      active: true,
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: "emp-bao",
      username: "BAONVTNV",
      code: "BAONVTNV",
      name: "Bảo",
      gender: "Nam",
      branch: "Trưng Nữ Vương",
      role: "Nhân viên",
      hourlyRate: 22000,
      password: "1234",
      active: true,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
    }
  ];

  const shifts = [
    { code: "SANG", name: "Ca Sáng", duration: 9, defaultStart: "08:00", defaultEnd: "17:00", note: "08:00 - 17:00 (9 tiếng)" },
    { code: "CHIEU", name: "Ca Chiều", duration: 5, defaultStart: "17:00", defaultEnd: "22:00", note: "17:00 - 22:00 (5 tiếng)" }
  ];

  const settings = {
    storeName: "Kyodo Food",
    branchName: "Trưng Nữ Vương",
    tagline: "Cửa hàng Kyodo Food - Trưng Nữ Vương, Đà Nẵng",
    logoUrl: "/logo-kyodo.png",
    adminUsername: "admin",
    adminPassword: "20162020"
  };

  // Dữ liệu chấm công trống 100% để bắt đầu tính từ ngày 01/11/2026
  const attendance = [];

  return {
    employees,
    shifts,
    settings,
    attendance
  };
}

module.exports = { generateSeedData };
