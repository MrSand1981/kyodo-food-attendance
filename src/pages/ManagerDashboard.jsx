// src/pages/ManagerDashboard.jsx
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Users, Calendar, FileSpreadsheet, Settings, 
  Clock, Plus, Edit, Trash2, Download, Printer, 
  Upload, CheckCircle, ShieldCheck, DollarSign, 
  MapPin, Key, UserPlus, Check, RefreshCw, GitBranch, ArrowUpCircle,
  UploadCloud, GitCommit, Terminal, ExternalLink, CheckCircle2,
  Bell, Copy, CalendarDays, Phone, Home, CreditCard, Sparkles
} from 'lucide-react';
import { api } from '../utils/api';

export default function ManagerDashboard({ settings, onSettingsChange, shifts }) {
  const [activeTab, setActiveTab] = useState('timesheet'); // 'timesheet' | 'employees' | 'advances-leaves' | 'settings'
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  
  // Data states
  const [report, setReport] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [allAdvances, setAllAdvances] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Modals & Forms
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Form states for new/edit employee with full HR info
  const [empForm, setEmpForm] = useState({
    username: '',
    name: '',
    gender: 'Nữ',
    dob: '',
    cccd: '',
    phone: '',
    address: '',
    role: 'Nhân viên',
    hourlyRate: 25000,
    password: '1234'
  });

  // Logo file upload
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // GitHub Auto Update states (Kéo bản mới về)
  const [githubRepoUrl, setGithubRepoUrl] = useState(settings?.githubRepo || 'https://github.com/MrSand1981/kyodo-food-attendance');
  const [updateInfo, setUpdateInfo] = useState(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updatingApp, setUpdatingApp] = useState(false);

  // GitHub Push states (Đẩy bản mới lên GitHub từ Nghệ An)
  const [gitStatus, setGitStatus] = useState(null);
  const [gitCommitMsg, setGitCommitMsg] = useState('Cập nhật tính năng Kyodo Food');
  const [pushingGit, setPushingGit] = useState(false);
  const [gitResult, setGitResult] = useState(null);
  const [checkingGit, setCheckingGit] = useState(false);

  // Tải dữ liệu báo cáo chấm công
  const loadReport = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getMasterReport(selectedMonth);
      setReport(res.report);
    } catch (err) {
      setError(err.message || 'Không thể tải bảng chấm công tổng hợp');
    } finally {
      setLoading(false);
    }
  };

  // Tải danh sách nhân viên
  const loadEmployees = async () => {
    try {
      const res = await api.getEmployees(true);
      setEmployees(res.employees || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Tải danh sách tạm ứng & nghỉ phép toàn cửa hàng
  const loadAdvancesAndLeaves = async () => {
    try {
      const [advRes, leaveRes] = await Promise.all([
        api.getSalaryAdvances('', selectedMonth),
        api.getLeaveRequests('', selectedMonth)
      ]);
      setAllAdvances(advRes.records || []);
      setAllLeaves(leaveRes.records || []);
    } catch (err) {
      console.error("Lỗi tải tạm ứng và nghỉ phép:", err);
    }
  };

  useEffect(() => {
    loadReport();
    loadEmployees();
    loadAdvancesAndLeaves();
  }, [selectedMonth]);

  // Xử lý tạo/sửa tài khoản nhân viên (ĐẦY ĐỦ THÔNG TIN: Ngày sinh, CCCD, Điện thoại, Địa chỉ, Giới tính)
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    if (!empForm.username.trim() || !empForm.name.trim()) {
      setError('Vui lòng điền đầy đủ Tên tài khoản và Họ tên nhân viên!');
      return;
    }

    try {
      setLoading(true);
      if (editingEmployee) {
        await api.updateEmployee(editingEmployee.id, empForm);
        setMessage(`Đã cập nhật thông tin tài khoản "${empForm.username}" thành công!`);
      } else {
        await api.addEmployee(empForm);
        setMessage(`🎉 Đã tạo thành công tài khoản mới: "${empForm.username.toUpperCase()}" cho nhân viên ${empForm.name}!`);
      }
      setShowAddEmployeeModal(false);
      setEditingEmployee(null);
      await loadEmployees();
      await loadReport();
    } catch (err) {
      setError(err.message || 'Lỗi khi lưu tài khoản nhân viên');
    } finally {
      setLoading(false);
    }
  };

  // Xóa tài khoản nhân viên
  const handleDeleteEmployee = async (id, name, username) => {
    if (!window.confirm(`Bạn có chắc chắn muốn ngưng hoạt động tài khoản "${username}" (${name})?`)) return;
    try {
      await api.deleteEmployee(id);
      setMessage(`Đã ngưng hoạt động tài khoản ${username}`);
      await loadEmployees();
      await loadReport();
    } catch (err) {
      setError(err.message);
    }
  };

  // Xóa bản ghi tạm ứng từ màn hình quản lý
  const handleDeleteAdvanceByManager = async (id, name, amount) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bản ghi tạm ứng ${Number(amount).toLocaleString('vi-VN')} đ của nhân viên ${name}?`)) return;
    try {
      await api.deleteSalaryAdvance(id);
      setMessage(`Đã xóa bản ghi tạm ứng của ${name}`);
      await loadAdvancesAndLeaves();
      await loadReport();
    } catch (err) {
      setError(err.message);
    }
  };

  // Xóa đơn xin nghỉ từ màn hình quản lý
  const handleDeleteLeaveByManager = async (id, name, date) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đơn xin nghỉ ngày ${date} của nhân viên ${name}?`)) return;
    try {
      await api.deleteLeaveRequest(id);
      setMessage(`Đã xóa đơn xin nghỉ của ${name}`);
      await loadAdvancesAndLeaves();
    } catch (err) {
      setError(err.message);
    }
  };

  // Upload logo
  const handleUploadLogo = async () => {
    if (!logoFile) return;
    try {
      setUploadingLogo(true);
      await api.uploadLogo(logoFile);
      setMessage('Cập nhật logo Kyodo Food thành công!');
      if (onSettingsChange) onSettingsChange();
    } catch (err) {
      setError(err.message || 'Lỗi khi tải logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Kiểm tra cập nhật từ GitHub
  const handleCheckUpdate = async () => {
    try {
      setCheckingUpdate(true);
      setError('');
      if (githubRepoUrl !== settings?.githubRepo) {
        await api.updateSettings({ githubRepo: githubRepoUrl.trim() });
        if (onSettingsChange) onSettingsChange();
      }
      const res = await api.checkUpdate();
      setUpdateInfo(res);
      if (res.hasUpdate) {
        setMessage(`Đã phát hiện bản cập nhật mới (v${res.latestVersion}) trên GitHub!`);
      } else {
        setMessage(res.message || 'Phần mềm đang ở phiên bản mới nhất.');
      }
    } catch (err) {
      setError(err.message || 'Không thể kiểm tra cập nhật từ GitHub');
    } finally {
      setCheckingUpdate(false);
    }
  };

  // Nâng cấp phần mềm từ GitHub
  const handleApplyUpdate = async () => {
    if (!window.confirm('Hệ thống sẽ tải bản cập nhật mới nhất từ GitHub và ghi đè mã nguồn. Dữ liệu chấm công hiện tại của cửa hàng sẽ được sao lưu và bảo toàn nguyên vẹn 100%. Bạn có muốn tiếp tục?')) {
      return;
    }
    try {
      setUpdatingApp(true);
      setError('');
      const res = await api.applyUpdate();
      alert('🎉 ' + res.message);
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Lỗi khi cập nhật phần mềm');
    } finally {
      setUpdatingApp(false);
    }
  };

  // Tải trạng thái Git
  const loadGitStatus = async () => {
    try {
      setCheckingGit(true);
      const res = await api.getGitStatus();
      setGitStatus(res);
    } catch (err) {
      console.error('Lỗi kiểm tra git status:', err);
    } finally {
      setCheckingGit(false);
    }
  };

  // Đẩy bản cập nhật mới lên GitHub (Dành cho Chủ Cửa Hàng ở Nghệ An)
  const handlePushToGitHub = async (e) => {
    if (e) e.preventDefault();
    if (!window.confirm('Hệ thống sẽ tự động đóng gói (build) giao diện mới nhất và đẩy toàn bộ mã nguồn lên GitHub. Sau đó máy tính ở Đà Nẵng chỉ cần nhấn "Cập Nhật" là nhận được ngay. Bạn có muốn tiếp tục?')) {
      return;
    }
    try {
      setPushingGit(true);
      setGitResult(null);
      setError('');
      setMessage('');
      const res = await api.pushToGitHub(gitCommitMsg);
      setGitResult(res);
      if (res.success) {
        setMessage(`🎉 ${res.message}`);
        confetti({ particleCount: 120, spread: 85, origin: { y: 0.6 } });
        await loadGitStatus();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi đẩy lên GitHub');
    } finally {
      setPushingGit(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      loadGitStatus();
    }
  }, [activeTab]);

  const openEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setEmpForm({
      username: emp.username || emp.code,
      name: emp.name,
      gender: emp.gender || 'Nữ',
      dob: emp.dob || '',
      cccd: emp.cccd || '',
      phone: emp.phone || '',
      address: emp.address || '',
      role: emp.role || 'Nhân viên',
      hourlyRate: emp.hourlyRate || 25000,
      password: emp.password || '1234'
    });
    setShowAddEmployeeModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Cổng Quản Trị Cửa Hàng
            </span>
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-500" />
              Cơ sở duy nhất: Trưng Nữ Vương
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Bảng Chấm Công & Quản Trị Nhân Sự
          </h2>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('timesheet')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'timesheet' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bảng Công & Lương</span>
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'employees' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Hồ Sơ Nhân Sự ({employees.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('advances-leaves')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'advances-leaves' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4 text-amber-600" />
            <span>Tạm Ứng & Nghỉ Phép ({allAdvances.length + allLeaves.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'settings' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Cài Đặt Cửa Hàng</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-bold flex items-center justify-between no-print animate-in fade-in">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="underline text-xs cursor-pointer">Đóng</button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm font-bold flex items-center justify-between no-print animate-in fade-in">
          <span>{error}</span>
          <button onClick={() => setError('')} className="underline text-xs cursor-pointer">Đóng</button>
        </div>
      )}

      {/* ================= TAB 1: BẢNG CHẤM CÔNG & QUYẾT TOÁN LƯƠNG TỔNG HỢP ================= */}
      {activeTab === 'timesheet' && (
        <div>
          {/* Controls Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-4 no-print">
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Chọn Tháng Chấm Công:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 cursor-pointer"
                >
                  <option value="2026-11">Tháng 11/2026 (Bắt đầu sử dụng)</option>
                  <option value="2026-12">Tháng 12/2026</option>
                  <option value="2027-01">Tháng 01/2027</option>
                  <option value="2026-10">Tháng 10/2026</option>
                  <option value="2026-09">Tháng 09/2026</option>
                  <option value="2026-08">Tháng 08/2026</option>
                </select>
              </div>
              <div className="pt-5 text-xs text-slate-500 font-bold">
                Cơ sở: <strong>Trưng Nữ Vương</strong>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <a
                href={api.getExportExcelUrl(selectedMonth)}
                download={`Bang_Cham_Cong_Kyodo_Trung_Nu_Vuong_${selectedMonth}.xlsx`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Xuất File Excel (.xlsx)</span>
              </a>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>In Báo Cáo</span>
              </button>
            </div>

          </div>

          {/* Store Monthly Metrics Header (5 Cards: Nhân sự, Tổng giờ, Tổng lương ca, Tạm ứng, Thực chi) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Nhân Sự</span>
              <div className="text-xl font-black text-slate-900 font-mono mt-1">
                {report?.summary?.totalEmployees || 0} <span className="text-xs font-semibold text-slate-500">nhân viên</span>
              </div>
            </div>

            <div className="bg-red-50/60 rounded-3xl p-4 border border-red-100 shadow-2xs">
              <span className="text-[11px] font-bold text-red-800 uppercase">Tổng Giờ Làm</span>
              <div className="text-xl font-black text-red-700 font-mono mt-1">
                {report?.summary?.storeTotalHours || 0} <span className="text-xs font-semibold text-red-600">giờ</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-600 uppercase">Lương Ca Làm</span>
              <div className="text-xl font-black text-slate-800 font-mono mt-1">
                {Number(report?.summary?.storeTotalSalary || 0).toLocaleString()} <span className="text-xs font-semibold text-slate-500">đ</span>
              </div>
            </div>

            <div className="bg-amber-50/70 rounded-3xl p-4 border border-amber-200 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-800 uppercase">Tổng Tạm Ứng</span>
              <div className="text-xl font-black text-amber-700 font-mono mt-1">
                {Number(report?.summary?.storeTotalAdvance || 0).toLocaleString()} <span className="text-xs font-semibold text-amber-600">đ</span>
              </div>
            </div>

            <div className="bg-emerald-50/70 rounded-3xl p-4 border border-emerald-200 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">Thực Chi (Net)</span>
              <div className="text-xl font-black text-emerald-700 font-mono mt-1">
                {Number(report?.summary?.storeTotalNetSalary ?? report?.summary?.storeTotalSalary ?? 0).toLocaleString()} <span className="text-xs font-semibold text-emerald-600">đ</span>
              </div>
            </div>
          </div>

          {/* ================= BẢNG TỔNG HỢP CA LÀM & THÔNG BÁO LƯƠNG NHÂN VIÊN THEO THÁNG ================= */}
          <div className="bg-gradient-to-br from-amber-500/10 via-white to-red-500/10 rounded-3xl p-6 border border-amber-200/80 shadow-xs mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-5 border-b border-amber-200/60 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" />
                    Bảng Tổng Hợp Ca & Thông Báo Lương
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    Áp dụng: <strong>{selectedMonth}</strong> • Cơ sở Trưng Nữ Vương
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  Tổng Hợp Ca & Quyết Toán Tiền Lương Từng Nhân Viên
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold bg-white/90 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <span>Ca chuẩn:</span>
                <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 font-bold">Sáng: 8h-17h (9h)</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">Chiều: 17h-22h (5h)</span>
              </div>
            </div>

            {/* Chi tiết ca & lương từng nhân viên */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report?.rows?.map((row) => {
                const isUt = (row.employee.name === 'Út' || row.employee.code === 'UTNVTNV');
                const accentBg = isUt ? 'bg-red-50/70 border-red-200' : 'bg-blue-50/70 border-blue-200';
                const badgeColor = isUt ? 'bg-red-600 text-white' : 'bg-blue-600 text-white';

                const avatarSrc = row.employee.avatar || (row.employee.gender === 'Nữ' ? '/avatar-female.svg' : '/avatar-male.svg');

                const copyNotifyText = () => {
                  const text = `📢 Kyodo Food Trưng Nữ Vương thông báo kết quả công tháng ${selectedMonth} cho nhân viên ${row.employee.name} (${row.employee.code || row.employee.username}):\n- Ca Sáng (8h-17h • 9 tiếng): ${row.morningShifts || 0} ca\n- Ca Chiều (17h-22h • 5 tiếng): ${row.eveningShifts || 0} ca\n- Tổng số ca hoàn thành: ${row.totalShifts || 0} ca (${row.daysWorked || 0} ngày)\n- Tổng số giờ làm việc: ${row.totalHours} giờ\n- Mức lương: ${Number(row.hourlyRate).toLocaleString()} VNĐ/h\n- Tiền lương ca làm: ${Number(row.totalSalary).toLocaleString()} VNĐ\n- Đã tạm ứng lương (${row.advanceCount || 0} lần): ${Number(row.advanceTotal || 0).toLocaleString()} VNĐ\n👉 TIỀN LƯƠNG THỰC LĨNH: ${Number(row.netSalary ?? row.totalSalary).toLocaleString()} VNĐ.\nCảm ơn em đã nỗ lực làm việc cùng Kyodo Food!`;
                  navigator.clipboard.writeText(text);
                  alert(`Đã sao chép tin nhắn thông báo lương cho ${row.employee.name}! Bạn có thể dán (Paste) để gửi qua Zalo hoặc tin nhắn.`);
                };

                return (
                  <div key={row.employee.id} className={`rounded-2xl p-5 border ${accentBg} shadow-2xs flex flex-col justify-between bg-white`}>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <img 
                            src={avatarSrc} 
                            alt={row.employee.name} 
                            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-200 bg-slate-50"
                          />
                          <div>
                            <div className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                              <span>{row.employee.name}</span>
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                                {row.employee.code || row.employee.username}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-semibold">
                              Cơ sở Trưng Nữ Vương • {row.employee.gender || "Nam"}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Mức lương</span>
                          <span className="text-xs font-black font-mono text-slate-800 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                            {Number(row.hourlyRate).toLocaleString()} đ/h
                          </span>
                        </div>
                      </div>

                      {/* Phân rã số ca sáng / số ca chiều */}
                      <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-100 my-2 text-center text-xs">
                        <div className="bg-red-50/50 rounded-xl p-2 border border-red-100">
                          <span className="text-[10px] text-red-700 font-bold block uppercase">Ca Sáng (8-17h)</span>
                          <strong className="text-base font-mono font-black text-red-800">
                            {row.morningShifts || 0} <span className="text-xs font-normal">ca</span>
                          </strong>
                        </div>
                        <div className="bg-amber-50/50 rounded-xl p-2 border border-amber-100">
                          <span className="text-[10px] text-amber-700 font-bold block uppercase">Ca Chiều (17-22h)</span>
                          <strong className="text-base font-mono font-black text-amber-800">
                            {row.eveningShifts || 0} <span className="text-xs font-normal">ca</span>
                          </strong>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-2 border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase">Số Ngày Đi Làm</span>
                          <strong className="text-base font-mono font-black text-slate-800">
                            {row.daysWorked || 0} <span className="text-xs font-normal">ngày</span>
                          </strong>
                        </div>
                      </div>

                      {/* SỐ LIỆU TÀI CHÍNH: Giờ làm, Lương ca, Tạm ứng, THỰC LĨNH */}
                      <div className="grid grid-cols-2 gap-2.5 mt-3">
                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">1. Tổng Giờ Làm</span>
                          <div className="text-xl font-black font-mono text-red-700 mt-0.5">
                            {row.totalHours} <span className="text-xs font-bold">giờ</span>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block">2. Lương Ca Làm</span>
                          <div className="text-xl font-black font-mono text-slate-800 mt-0.5">
                            {Number(row.totalSalary).toLocaleString()} <span className="text-xs font-bold">đ</span>
                          </div>
                        </div>

                        <div className="bg-amber-50 rounded-xl p-2.5 border border-amber-200">
                          <span className="text-[10px] font-bold text-amber-800 uppercase block">
                            3. Đã Tạm Ứng ({row.advanceCount || 0} lần)
                          </span>
                          <div className="text-xl font-black font-mono text-amber-700 mt-0.5">
                            {Number(row.advanceTotal || 0).toLocaleString()} <span className="text-xs font-bold">đ</span>
                          </div>
                        </div>

                        <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-200">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase block">4. Thực Lĩnh Còn Lại</span>
                          <div className="text-xl font-black font-mono text-emerald-700 mt-0.5">
                            {Number(row.netSalary ?? row.totalSalary).toLocaleString()} <span className="text-xs font-bold">VNĐ</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tiện ích copy gửi nhân viên */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between no-print">
                      <span className="text-[11px] text-slate-500 italic">
                        Thực lĩnh = Lương ca - Đã ứng
                      </span>
                      <button
                        type="button"
                        onClick={copyNotifyText}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        title="Sao chép thông báo gửi qua Zalo / SMS cho nhân viên"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Sao Chép Báo Lương</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Master Table Matrix */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-3 px-3 sticky left-0 bg-slate-100 z-10 w-24">Tài Khoản</th>
                    <th className="py-3 px-3 sticky left-24 bg-slate-100 z-10 min-w-32">Tên NV</th>
                    <th className="py-3 px-2 text-center w-12">GT</th>
                    
                    {report?.days?.map(d => (
                      <th 
                        key={d.day} 
                        className={`py-2 px-1 text-center min-w-10 ${d.isWeekend ? 'bg-amber-100/70 text-amber-900' : ''}`}
                      >
                        <div className="font-extrabold">{d.day}</div>
                        <div className="text-[10px] text-slate-500 font-medium">{d.dayOfWeek}</div>
                      </th>
                    ))}

                    <th className="py-3 px-3 text-center bg-red-50 text-red-900 font-extrabold min-w-20">
                      Tổng Giờ
                    </th>
                    <th className="py-3 px-3 text-right bg-slate-100 min-w-20 font-bold">
                      Lương/h
                    </th>
                    <th className="py-3 px-3 text-right bg-slate-100 min-w-24 font-bold">
                      Lương Ca
                    </th>
                    <th className="py-3 px-3 text-right bg-amber-50 text-amber-900 font-extrabold min-w-24">
                      Tạm Ứng
                    </th>
                    <th className="py-3 px-3 text-right bg-emerald-50 text-emerald-900 font-extrabold min-w-28">
                      Thực Lĩnh
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {report?.rows?.map((row) => (
                    <tr key={row.employee.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-red-700 sticky left-0 bg-white z-10">
                        {row.employee.username || row.employee.code}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 sticky left-24 bg-white z-10 whitespace-nowrap">
                        {row.employee.name}
                      </td>
                      <td className="py-3 px-2 text-center text-slate-500 text-[11px]">
                        {row.employee.gender || "Nam"}
                      </td>

                      {report?.days?.map(d => {
                        const cellData = row.dailyData[d.day];
                        const hasHours = cellData && cellData.hours > 0;
                        return (
                          <td 
                            key={d.day} 
                            className={`py-2 px-1 text-center font-mono ${d.isWeekend ? 'bg-amber-50/40' : ''}`}
                          >
                            {hasHours ? (
                              <span className="inline-block px-1.5 py-0.5 rounded-md bg-red-100 text-red-800 font-bold text-[11px]">
                                {cellData.hours}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-[11px]">-</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-3 px-3 text-center font-mono font-black text-red-700 bg-red-50/40 whitespace-nowrap text-sm">
                        {row.totalHours}h
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700 whitespace-nowrap font-bold">
                        {Number(row.hourlyRate).toLocaleString()}đ
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-800 whitespace-nowrap font-bold">
                        {Number(row.totalSalary).toLocaleString()}đ
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-amber-700 bg-amber-50/40 whitespace-nowrap text-sm">
                        {Number(row.advanceTotal || 0).toLocaleString()}đ
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-black text-emerald-700 bg-emerald-50/40 whitespace-nowrap text-sm">
                        {Number(row.netSalary ?? row.totalSalary).toLocaleString()}đ
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr className="bg-slate-900 text-white font-extrabold text-xs">
                    <td colSpan={3} className="py-3 px-4 uppercase tracking-wider sticky left-0 bg-slate-900 z-10">
                      TỔNG CỘNG ({selectedMonth})
                    </td>
                    <td colSpan={report?.days?.length || 31} className="py-3 px-2 text-center text-slate-400">
                      - Kyodo Food Trưng Nữ Vương -
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-red-400 text-sm whitespace-nowrap">
                      {report?.summary?.storeTotalHours || 0}h
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">--</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300 text-sm whitespace-nowrap">
                      {Number(report?.summary?.storeTotalSalary || 0).toLocaleString()} đ
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-amber-400 text-sm whitespace-nowrap">
                      {Number(report?.summary?.storeTotalAdvance || 0).toLocaleString()} đ
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400 text-sm whitespace-nowrap">
                      {Number(report?.summary?.storeTotalNetSalary ?? report?.summary?.storeTotalSalary ?? 0).toLocaleString()} đ
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: TẠO & QUẢN LÝ TÀI KHOẢN NHÂN VIÊN (ĐẦY ĐỦ THÔNG TIN) ================= */}
      {activeTab === 'employees' && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Hồ Sơ Nhân Sự Cửa Hàng Trưng Nữ Vương
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chủ cửa hàng quản lý đầy đủ thông tin: Ngày sinh, Địa chỉ, Số điện thoại, CCCD, Giới tính và Mức lương.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingEmployee(null);
                setEmpForm({
                  username: `NV${employees.length + 1}TNV`,
                  name: '',
                  gender: 'Nữ',
                  dob: '',
                  cccd: '',
                  phone: '',
                  address: '',
                  role: 'Nhân viên',
                  hourlyRate: 25000,
                  password: '1234'
                });
                setShowAddEmployeeModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tạo Tài Khoản Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {employees.map(emp => {
              const avatarSrc = emp.avatar || (emp.gender === 'Nữ' ? '/avatar-female.svg' : '/avatar-male.svg');
              return (
                <div 
                  key={emp.id} 
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={avatarSrc} 
                          alt={emp.name} 
                          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-100 bg-slate-50" 
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-black font-mono">
                              TK: {emp.username || emp.code}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold">
                              {emp.gender || "Nam"}
                            </span>
                          </div>
                          <h4 className="text-lg font-bold text-slate-900 mt-1">{emp.name}</h4>
                          <p className="text-xs text-slate-500 font-medium">Trưng Nữ Vương • {emp.role}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Lương/giờ</span>
                        <strong className="text-sm font-black font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 block">
                          {Number(emp.hourlyRate).toLocaleString()} đ
                        </strong>
                      </div>
                    </div>

                    {/* Lưới thông tin chi tiết: CCCD, Điện thoại, Ngày sinh, Địa chỉ */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-2xl mb-4 border border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Số CCCD:</span>
                        <strong className="font-mono text-slate-800">{emp.cccd || "Chưa cập nhật"}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Số Điện Thoại:</span>
                        <strong className="font-mono text-slate-800">{emp.phone || "Chưa cập nhật"}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Ngày Sinh:</span>
                        <span className="font-semibold text-slate-700">{emp.dob || "Chưa cập nhật"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Mật Khẩu Đăng Nhập:</span>
                        <span className="font-mono text-red-600 font-bold">{emp.password || '1234'}</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Địa Chỉ:</span>
                        <span className="text-slate-700 font-medium">{emp.address || "Trưng Nữ Vương, Đà Nẵng"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => openEditEmployee(emp)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Sửa Thông Tin & Lương</span>
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(emp.id, emp.name, emp.username)}
                      className="px-3.5 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all cursor-pointer"
                      title="Xóa tài khoản"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 3: QUẢN LÝ TẠM ỨNG LƯƠNG & ĐƠN XIN NGHỈ ================= */}
      {activeTab === 'advances-leaves' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Quản Lý Tạm Ứng Lương & Đơn Xin Nghỉ Của Nhân Viên
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tổng hợp toàn bộ các khoản tạm ứng lương và đơn xin nghỉ của nhân viên tại cơ sở Trưng Nữ Vương.
              </p>
            </div>
            
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800"
            >
              <option value="2026-11">Tháng 11/2026</option>
              <option value="2026-12">Tháng 12/2026</option>
              <option value="2027-01">Tháng 01/2027</option>
              <option value="2026-10">Tháng 10/2026</option>
            </select>
          </div>

          {/* Section: Danh sách tạm ứng */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h4 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-600 stroke-[3]" />
              <span>Danh Sách Tạm Ứng Lương ({allAdvances.length} bản ghi)</span>
            </h4>

            {allAdvances.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-amber-50/70 border-b border-amber-200 text-amber-900 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Nhân Viên</th>
                      <th className="py-3 px-4">Ngày Ứng</th>
                      <th className="py-3 px-4 text-right">Số Tiền Tạm Ứng</th>
                      <th className="py-3 px-4">Lý Do</th>
                      <th className="py-3 px-4 text-center">Trạng Thái</th>
                      <th className="py-3 px-4 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allAdvances.map(adv => (
                      <tr key={adv.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {adv.employeeName} ({adv.employeeCode})
                        </td>
                        <td className="py-3 px-4 text-slate-600">{adv.date}</td>
                        <td className="py-3 px-4 font-mono font-black text-red-600 text-right text-sm">
                          {Number(adv.amount).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-4 text-slate-600">{adv.reason || "Ứng lương"}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Đã Khấu Trừ
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteAdvanceByManager(adv.id, adv.employeeName, adv.amount)}
                            className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            title="Xóa khoản tạm ứng này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-4">
                Không có bản ghi tạm ứng lương nào trong tháng {selectedMonth}.
              </p>
            )}
          </div>

          {/* Section: Danh sách đơn xin nghỉ */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h4 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <span>Danh Sách Đơn Xin Nghỉ Phép ({allLeaves.length} đơn)</span>
            </h4>

            {allLeaves.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-blue-50/70 border-b border-blue-200 text-blue-900 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Nhân Viên</th>
                      <th className="py-3 px-4">Ngày Xin Nghỉ</th>
                      <th className="py-3 px-4">Ca Nghỉ</th>
                      <th className="py-3 px-4">Lý Do</th>
                      <th className="py-3 px-4 text-center">Trạng Thái</th>
                      <th className="py-3 px-4 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allLeaves.map(leave => (
                      <tr key={leave.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {leave.employeeName} ({leave.employeeCode})
                        </td>
                        <td className="py-3 px-4 text-slate-600">{leave.date}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
                            {leave.shift}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{leave.reason}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            Đã Duyệt
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteLeaveByManager(leave.id, leave.employeeName, leave.date)}
                            className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                            title="Xóa đơn xin nghỉ này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-4">
                Không có đơn xin nghỉ nào trong tháng {selectedMonth}.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 4: CÀI ĐẶT CỬA HÀNG ================= */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Card: ĐẨY BẢN CẬP NHẬT MỚI LÊN GITHUB (DÀNH CHO CHỦ CỬA HÀNG) */}
          <div className="bg-linear-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-700">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>Đẩy Bản Cập Nhật Mới Lên GitHub</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Dành riêng cho bạn tại Nghệ An sau khi Antigravity hoàn tất chỉnh sửa
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                main
              </span>
            </div>

            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Mỗi khi bạn yêu cầu chỉnh sửa phần mềm xong, bạn chỉ cần nhấn nút <strong>"Đẩy Lên GitHub Ngay"</strong> bên dưới. Hệ thống sẽ tự động đóng gói bản mới, commit và đẩy trực tiếp lên kho lưu trữ. Sau đó máy ở Đà Nẵng chỉ cần nhấn nút nhận bản mới!
            </p>

            {/* Trạng thái Git hiện tại */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 mb-5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300 font-bold">Commit gần nhất:</span>
                  <span className="font-mono text-emerald-400 font-bold">{gitStatus?.lastCommit?.hash || 'loading...'}</span>
                </div>
                <button
                  type="button"
                  onClick={loadGitStatus}
                  disabled={checkingGit}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${checkingGit ? 'animate-spin' : ''}`} />
                  <span>Làm mới trạng thái</span>
                </button>
              </div>
              <p className="text-slate-400 italic">"{gitStatus?.lastCommit?.subject || 'Đang đọc git log...'}"</p>
            </div>

            {/* Form đẩy lên GitHub */}
            <form onSubmit={handlePushToGitHub} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Nội dung ghi chú bản cập nhật (Commit Message):
                </label>
                <input
                  type="text"
                  required
                  value={gitCommitMsg}
                  onChange={(e) => setGitCommitMsg(e.target.value)}
                  placeholder="Ví dụ: Cập nhật tính năng ứng lương và avatar..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-600 text-white text-xs font-semibold focus:outline-hidden focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={pushingGit}
                className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-98 disabled:bg-slate-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
              >
                <UploadCloud className={`w-4 h-4 ${pushingGit ? 'animate-bounce' : ''}`} />
                <span>{pushingGit ? 'Đang Build & Đẩy Lên GitHub Cloud...' : '🚀 Đẩy Bản Cập Nhật Lên GitHub Ngay'}</span>
              </button>
            </form>

            {gitResult && (
              <div className="mt-4 p-3 rounded-2xl bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 text-xs">
                <p className="font-bold">✅ {gitResult.message}</p>
                {gitResult.commitHash && (
                  <p className="font-mono text-[11px] mt-1 text-slate-300">Commit SHA: {gitResult.commitHash}</p>
                )}
              </div>
            )}
          </div>

          {/* Card: Kiểm tra và Cập nhật từ GitHub (Dành cho máy ở cửa hàng Đà Nẵng) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cập Nhật Phần Mềm Từ GitHub
                </h3>
                <p className="text-xs text-slate-500">
                  Dành cho máy tính đặt tại cửa hàng Trưng Nữ Vương, Đà Nẵng
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs mt-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Đường dẫn Kho lưu trữ GitHub:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={githubRepoUrl}
                    onChange={(e) => setGithubRepoUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={handleCheckUpdate}
                    disabled={checkingUpdate}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-spin' : ''}`} />
                    <span>{checkingUpdate ? 'Đang kiểm tra...' : 'Kiểm Tra Bản Mới'}</span>
                  </button>
                </div>
              </div>

              {updateInfo && (
                <div className={`p-4 rounded-2xl border ${
                  updateInfo.hasUpdate 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-sm mb-1">{updateInfo.message}</p>
                      {updateInfo.hasUpdate && (
                        <p className="text-[11px] text-emerald-700">
                          Phiên bản hiện tại: <strong>v{updateInfo.currentVersion}</strong> ➔ Bản mới trên GitHub: <strong className="text-emerald-900">v{updateInfo.latestVersion}</strong>
                        </p>
                      )}
                    </div>
                    {updateInfo.hasUpdate && (
                      <button
                        type="button"
                        onClick={handleApplyUpdate}
                        disabled={updatingApp}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all shrink-0 cursor-pointer"
                      >
                        <ArrowUpCircle className="w-4 h-4" />
                        <span>{updatingApp ? 'Đang nâng cấp...' : 'Nâng Cấp Ngay'}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Logo Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5 text-red-600" />
              <span>Logo Cửa Hàng Kyodo Food</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Logo chính thức của Kyodo Food đang được áp dụng trên toàn bộ ứng dụng.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 p-2 flex items-center justify-center shadow-xs">
                <img 
                  src={settings?.logoUrl || '/logo-kyodo.png'} 
                  alt="Logo Kyodo Food" 
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Tải ảnh logo mới (PNG / JPG):
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files[0])}
                    className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
                  />
                  <button
                    onClick={handleUploadLogo}
                    disabled={!logoFile || uploadingLogo}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {uploadingLogo ? 'Đang tải...' : 'Lưu Logo'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Info Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-600" />
              <span>Tài Khoản Quản Trị (Admin)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-slate-500">Mật khẩu đăng nhập Admin:</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-base font-black text-slate-800">••••••••</span>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">Bảo Mật Cao</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                Chủ cửa hàng sử dụng mật khẩu này để đăng nhập và tạo tài khoản cho nhân viên.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TẠO / SỬA TÀI KHOẢN NHÂN VIÊN (ĐẦY ĐỦ THÔNG TIN HR) ================= */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-slate-900 mb-1">
              {editingEmployee ? 'Chỉnh Sửa Hồ Sơ Nhân Viên' : 'Tạo Tài Khoản Mới Cho Nhân Viên'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Điền đầy đủ thông tin cá nhân của nhân viên để quản lý chặt chẽ tại cơ sở Trưng Nữ Vương.
            </p>

            <form onSubmit={handleSaveEmployee} className="space-y-3.5 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Họ và Tên Nhân Viên:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn A..."
                    value={empForm.name}
                    onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên Đăng Nhập / Mã TK:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: UTNVTNV..."
                    value={empForm.username}
                    onChange={(e) => setEmpForm({ ...empForm, username: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-black font-mono uppercase text-red-600"
                  />
                </div>
              </div>

              {/* Giới tính & Ngày tháng năm sinh */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giới tính:</label>
                  <select
                    value={empForm.gender}
                    onChange={(e) => setEmpForm({ ...empForm, gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  >
                    <option value="Nữ">Nữ</option>
                    <option value="Nam">Nam</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày Tháng Năm Sinh:</label>
                  <input
                    type="date"
                    value={empForm.dob}
                    onChange={(e) => setEmpForm({ ...empForm, dob: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                  />
                </div>
              </div>

              {/* Số CCCD & Số Điện Thoại */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số CCCD (Căn cước CD):</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 048102001234"
                    value={empForm.cccd}
                    onChange={(e) => setEmpForm({ ...empForm, cccd: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số Điện Thoại:</label>
                  <input
                    type="tel"
                    placeholder="Ví dụ: 0905123456"
                    value={empForm.phone}
                    onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Địa chỉ nơi ở */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Địa Chỉ Thường Trú / Tạm Trú:</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 123 Trưng Nữ Vương, Hải Châu, Đà Nẵng"
                  value={empForm.address}
                  onChange={(e) => setEmpForm({ ...empForm, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-medium"
                />
              </div>

              {/* Mức lương & Mật khẩu */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mức Lương (đ/1 giờ):</label>
                  <input
                    type="number"
                    step="1000"
                    required
                    placeholder="Ví dụ: 25000"
                    value={empForm.hourlyRate}
                    onChange={(e) => setEmpForm({ ...empForm, hourlyRate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-extrabold font-mono text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mật Khẩu Khởi Tạo (mặc định 1234):</label>
                  <input
                    type="text"
                    required
                    value={empForm.password}
                    onChange={(e) => setEmpForm({ ...empForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold font-mono text-center text-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Cơ sở làm việc:</label>
                <input
                  type="text"
                  disabled
                  value="Cơ sở Trưng Nữ Vương, Đà Nẵng (Cố định)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
                >
                  {editingEmployee ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}