// src/pages/ManagerDashboard.jsx
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Users, Calendar, FileSpreadsheet, Settings, 
  Clock, Plus, Edit, Trash2, Download, Printer, 
  Upload, CheckCircle, ShieldCheck, DollarSign, 
  MapPin, Key, UserPlus, Check, RefreshCw, GitBranch, ArrowUpCircle,
  UploadCloud, GitCommit, Terminal, ExternalLink, CheckCircle2,
  Bell, Copy, CalendarDays, Phone, Home, CreditCard, Sparkles,
  QrCode, Eye, EyeOff, X, Mail, Send, MessageCircle
} from 'lucide-react';
import { api } from '../utils/api';
import { VIETNAM_BANKS, getVietQRUrl } from '../utils/banks';
import { 
  formatDateVN, 
  formatMonthVN, 
  formatShortTime, 
  getSalaryMonthForAdvance, 
  getAdvanceCycleRange, 
  getAdvanceCycleExplanation,
  getVietnamTodayYMD,
  getVietnamCurrentYM
} from '../utils/date';

export default function ManagerDashboard({ settings, onSettingsChange, shifts }) {
  const [activeTab, setActiveTab] = useState('timesheet'); // 'timesheet' | 'employees' | 'advances-leaves' | 'settings'
  const [selectedMonth, setSelectedMonth] = useState(getVietnamCurrentYM());
  
  // Data states
  const [report, setReport] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [allAdvances, setAllAdvances] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tableDensity, setTableDensity] = useState('compact');

  // Quản lý Ngày Lễ (Phương án 2: Lương x2)
  const [holidaysList, setHolidaysList] = useState([]);
  const [holidaysYear, setHolidaysYear] = useState('2026');
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [holidayForm, setHolidayForm] = useState({
    name: '',
    date: '',
    multiplier: 2,
    description: ''
  });
  const [holidayLoading, setHolidayLoading] = useState(false); // 'compact' (vừa vặn màn hình, hiện đủ 31 ngày) | 'expanded' (rộng rãi)

  // Modals & Forms
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  // Modal QR Code chuyển khoản VietQR
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrModalData, setQrModalData] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(String(text));
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (_) {}
  };

  // Quản lý hiển thị mật khẩu nhân viên
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const [showFormPassword, setShowFormPassword] = useState(false);

  // Quản lý nhập/sửa trực tiếp mức lương theo giờ của từng nhân viên
  const [editingRates, setEditingRates] = useState({});
  const [savingRateId, setSavingRateId] = useState(null);
  const [rateSuccessId, setRateSuccessId] = useState(null);

  // Modal Ghi nhận Tạm ứng cho nhân viên (Chủ cửa hàng)
  const [showManagerAdvanceModal, setShowManagerAdvanceModal] = useState(false);
  const [mgrAdvTargetEmp, setMgrAdvTargetEmp] = useState(null);
  const [mgrAdvDate, setMgrAdvDate] = useState('');
  const [mgrAdvAmount, setMgrAdvAmount] = useState('');
  const [mgrAdvReason, setMgrAdvReason] = useState('Chủ cửa hàng tạm ứng lương');
  const [mgrAdvLoading, setMgrAdvLoading] = useState(false);

  // Modal Chỉnh Sửa Tạm Ứng (Dành riêng cho Quản Lý: xóa hoặc chỉnh sửa số tiền ứng)
  const [showEditAdvanceModal, setShowEditAdvanceModal] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState(null);
  const [editAdvDate, setEditAdvDate] = useState('');
  const [editAdvAmount, setEditAdvAmount] = useState('');
  const [editAdvReason, setEditAdvReason] = useState('');
  const [editAdvLoading, setEditAdvLoading] = useState(false);

  // Form states for new/edit employee with full HR info & Bank account
  const [empForm, setEmpForm] = useState({
    username: '',
    fullName: '',
    shortName: '',
    name: '',
    gender: 'Nữ',
    dob: '',
    cccd: '',
    phone: '',
    address: '',
    bankCode: 'VCB',
    bankName: 'Vietcombank',
    bankAccount: '',
    accountName: '',
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

  // Xử lý tạo/sửa tài khoản nhân viên (Họ và tên đầy đủ, Biệt danh ngắn, CCCD, Điện thoại, Địa chỉ, Giới tính, VietQR)
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    const shortName = (empForm.shortName || empForm.name || '').trim();
    const fullName = (empForm.fullName || empForm.name || shortName).trim();

    if (!empForm.username.trim() || !shortName) {
      setError('Vui lòng điền Tên đăng nhập và Biệt danh (Tên ngắn) của nhân viên!');
      return;
    }

    const payload = {
      ...empForm,
      fullName,
      shortName,
      name: shortName,
      accountName: empForm.accountName?.trim() || fullName.toUpperCase()
    };

    try {
      setLoading(true);
      if (editingEmployee) {
        await api.updateEmployee(editingEmployee.id, payload);
        setMessage(`Đã cập nhật thông tin tài khoản "${empForm.username}" thành công!`);
      } else {
        await api.addEmployee(payload);
        setMessage(`🎉 Đã tạo thành công tài khoản mới: "${empForm.username.toUpperCase()}" cho nhân viên ${shortName}!`);
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

  // Cập nhật nhanh mức lương giờ trực tiếp từ ô nhập trong thẻ nhân sự
  const handleQuickUpdateHourlyRate = async (emp, customRate) => {
    const rawVal = customRate !== undefined ? customRate : editingRates[emp.id];
    const rateNum = Number(rawVal);
    if (isNaN(rateNum) || rateNum < 0) {
      alert("Vui lòng nhập mức lương theo giờ hợp lệ (số lớn hơn hoặc bằng 0)!");
      return;
    }
    try {
      setSavingRateId(emp.id);
      await api.updateEmployee(emp.id, { hourlyRate: rateNum });
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, hourlyRate: rateNum } : e));
      await loadReport();
      setRateSuccessId(emp.id);
      setTimeout(() => setRateSuccessId(null), 3000);
      setMessage(`✓ Đã cập nhật mức lương giờ của ${emp.shortName || emp.name}: ${rateNum.toLocaleString('vi-VN')} đ/h! Bảng công đã tự động tính lại.`);
    } catch (err) {
      setError(err.message || "Lỗi khi cập nhật mức lương");
    } finally {
      setSavingRateId(null);
    }
  };

  // Tải danh sách ngày lễ
  const loadHolidays = async () => {
    try {
      const res = await api.getHolidays(holidaysYear === 'all' ? null : holidaysYear);
      if (res && res.success) {
        setHolidaysList(res.holidays || []);
      }
    } catch (err) {
      console.warn("Lỗi tải danh sách ngày lễ:", err.message);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, [holidaysYear]);

  // Lưu hoặc cập nhật ngày lễ
  const handleSaveHoliday = async (e) => {
    e.preventDefault();
    if (!holidayForm.name.trim() || !holidayForm.date) {
      alert("Vui lòng điền đầy đủ tên ngày lễ và ngày áp dụng!");
      return;
    }
    try {
      setHolidayLoading(true);
      if (editingHoliday) {
        await api.updateHoliday(editingHoliday.id, holidayForm);
        setMessage(`✓ Đã cập nhật ngày lễ "${holidayForm.name}" thành công!`);
      } else {
        await api.addHoliday(holidayForm);
        setMessage(`✓ Đã thêm ngày lễ "${holidayForm.name}" (Hệ số ×${holidayForm.multiplier}) thành công!`);
      }
      setShowAddHolidayModal(false);
      setEditingHoliday(null);
      setHolidayForm({ name: '', date: '', multiplier: 2, description: '' });
      await loadHolidays();
      await loadReport();
    } catch (err) {
      alert(err.message || "Lỗi lưu ngày lễ");
    } finally {
      setHolidayLoading(false);
    }
  };

  // Toggle Bật/Tắt ngày lễ
  const handleToggleHoliday = async (holiday) => {
    try {
      const newActive = !holiday.active;
      await api.updateHoliday(holiday.id, { active: newActive });
      setHolidaysList(prev => prev.map(h => h.id === holiday.id ? { ...h, active: newActive } : h));
      setMessage(`✓ Đã ${newActive ? 'kích hoạt' : 'tạm dừng'} ngày lễ: ${holiday.name}`);
      await loadReport();
    } catch (err) {
      alert(err.message || "Lỗi cập nhật trạng thái");
    }
  };

  // Xóa ngày lễ riêng
  const handleDeleteHoliday = async (holiday) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ngày lễ "${holiday.name}" (${formatDateVN(holiday.date)}) không?`)) return;
    try {
      await api.deleteHoliday(holiday.id);
      setMessage(`✓ Đã xóa ngày lễ: ${holiday.name}`);
      await loadHolidays();
      await loadReport();
    } catch (err) {
      alert(err.message || "Lỗi xóa ngày lễ");
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

  // Mở modal sửa khoản tạm ứng
  const openEditAdvanceModal = (adv, emp = null) => {
    setEditingAdvance(adv);
    setEditAdvDate(adv.date || '');
    setEditAdvAmount(String(adv.amount || ''));
    setEditAdvReason(adv.reason || '');
    setShowEditAdvanceModal(true);
  };

  // Lưu chỉnh sửa khoản tạm ứng
  const handleSaveEditAdvance = async (e) => {
    e.preventDefault();
    if (!editingAdvance) return;
    const num = Number(editAdvAmount);
    if (isNaN(num) || num <= 0) {
      alert("Vui lòng nhập số tiền tạm ứng hợp lệ lớn hơn 0!");
      return;
    }
    try {
      setEditAdvLoading(true);
      await api.updateSalaryAdvance(editingAdvance.id, {
        amount: num,
        date: editAdvDate,
        reason: editAdvReason.trim()
      });
      setMessage("🎉 Đã cập nhật khoản tạm ứng lương thành công!");
      setShowEditAdvanceModal(false);
      setEditingAdvance(null);
      await Promise.all([loadAdvancesAndLeaves(), loadReport()]);
    } catch (err) {
      setError(err.message || 'Lỗi khi cập nhật khoản tạm ứng');
    } finally {
      setEditAdvLoading(false);
    }
  };

  // Mở modal tạm ứng lương cho nhân viên
  const openManagerAdvanceModal = (emp) => {
    setMgrAdvTargetEmp(emp);
    const todayStr = getVietnamTodayYMD();
    const currentSalaryMonth = getSalaryMonthForAdvance(todayStr);
    setMgrAdvDate(selectedMonth === currentSalaryMonth ? todayStr : `${selectedMonth}-06`);
    setMgrAdvAmount('');
    setMgrAdvReason('Chủ cửa hàng tạm ứng lương');
    setShowManagerAdvanceModal(true);
  };

  // Xử lý gửi ghi nhận tạm ứng từ quản lý
  const handleManagerAdvanceSubmit = async (e) => {
    e.preventDefault();
    if (!mgrAdvTargetEmp) return;
    const num = Number(mgrAdvAmount);
    if (isNaN(num) || num <= 0) {
      alert("Vui lòng nhập số tiền tạm ứng lớn hơn 0!");
      return;
    }
    try {
      setMgrAdvLoading(true);
      await api.requestSalaryAdvance({
        employeeId: mgrAdvTargetEmp.id,
        date: mgrAdvDate,
        amount: num,
        reason: mgrAdvReason.trim() || 'Chủ cửa hàng tạm ứng lương'
      });
      setMessage(`🎉 Đã ghi nhận tạm ứng ${num.toLocaleString('vi-VN')} đ cho nhân viên ${mgrAdvTargetEmp.name}!`);
      confetti({ particleCount: 70, spread: 60 });
      setShowManagerAdvanceModal(false);
      await loadAdvancesAndLeaves();
      await loadReport();
    } catch (err) {
      setError(err.message || "Lỗi khi ghi nhận tạm ứng");
    } finally {
      setMgrAdvLoading(false);
    }
  };

  // Xóa đơn xin nghỉ từ màn hình quản lý
  const handleDeleteLeaveByManager = async (id, name, date) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đơn xin nghỉ ngày ${formatDateVN(date)} của nhân viên ${name}?`)) return;
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

    // Cau hinh ket noi Cloud (Nghe An - Da Nang)
  const [cloudConfig, setCloudConfig] = useState({ cloudUrl: 'https://kyodo-food-attendance.onrender.com', activeMode: 'cloud' });
  const [savingCloud, setSavingCloud] = useState(false);
  const [cloudMsg, setCloudMsg] = useState('');

  // Cấu hình thông báo Telegram Bot tức thì
  const [telegramForm, setTelegramForm] = useState({
    enabled: false,
    botToken: '',
    chatId: '',
    notifyAdvance: true,
    notifyLeave: true,
    notifyAttendance: false
  });
  const [savingTelegram, setSavingTelegram] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramMsg, setTelegramMsg] = useState('');
  const [telegramError, setTelegramError] = useState('');

  const loadTelegramConfig = async () => {
    try {
      const res = await api.getTelegramConfig();
      if (res && res.config) {
        setTelegramForm({
          enabled: Boolean(res.config.enabled),
          botToken: res.config.botToken || '',
          chatId: res.config.chatId || '',
          notifyAdvance: res.config.notifyAdvance !== false,
          notifyLeave: res.config.notifyLeave !== false,
          notifyAttendance: Boolean(res.config.notifyAttendance)
        });
      }
    } catch (e) {
      console.warn('Lỗi tải cấu hình Telegram:', e);
    }
  };

  const handleSaveTelegramConfig = async (e) => {
    if (e) e.preventDefault();
    try {
      setSavingTelegram(true);
      setTelegramMsg('');
      setTelegramError('');
      const res = await api.updateTelegramConfig(telegramForm);
      setTelegramMsg(res.message || 'Đã lưu cấu hình thông báo Telegram thành công!');
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      setTelegramError(err.message || 'Lỗi khi lưu cấu hình Telegram');
    } finally {
      setSavingTelegram(false);
    }
  };

  const handleTestTelegram = async () => {
    try {
      setTestingTelegram(true);
      setTelegramMsg('');
      setTelegramError('');
      const res = await api.testTelegram({
        botToken: telegramForm.botToken,
        chatId: telegramForm.chatId
      });
      setTelegramMsg(res.message || '🎉 Đã gửi tin nhắn thử nghiệm thành công!');
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
    } catch (err) {
      setTelegramError(err.message || 'Lỗi gửi tin nhắn thử nghiệm Telegram');
    } finally {
      setTestingTelegram(false);
    }
  };

  // Cấu hình thông báo Zalo tức thì (Webhook / Zalo OA)
  const [notifyTab, setNotifyTab] = useState('zalo'); // 'zalo' | 'telegram'
  const [zaloForm, setZaloForm] = useState({
    enabled: false,
    mode: 'webhook',
    webhookUrl: '',
    oaAccessToken: '',
    oaUserId: '',
    notifyAdvance: true,
    notifyLeave: true,
    notifyAttendance: false
  });
  const [savingZalo, setSavingZalo] = useState(false);
  const [testingZalo, setTestingZalo] = useState(false);
  const [zaloMsg, setZaloMsg] = useState('');
  const [zaloError, setZaloError] = useState('');

  const loadZaloConfig = async () => {
    try {
      const res = await api.getZaloConfig();
      if (res && res.config) {
        setZaloForm({
          enabled: Boolean(res.config.enabled),
          mode: res.config.mode || 'webhook',
          webhookUrl: res.config.webhookUrl || '',
          oaAccessToken: res.config.oaAccessToken || '',
          oaUserId: res.config.oaUserId || '',
          notifyAdvance: res.config.notifyAdvance !== false,
          notifyLeave: res.config.notifyLeave !== false,
          notifyAttendance: Boolean(res.config.notifyAttendance)
        });
      }
    } catch (e) {
      console.warn('Lỗi tải cấu hình Zalo:', e);
    }
  };

  const handleSaveZaloConfig = async (e) => {
    if (e) e.preventDefault();
    try {
      setSavingZalo(true);
      setZaloMsg('');
      setZaloError('');
      const res = await api.updateZaloConfig(zaloForm);
      setZaloMsg(res.message || 'Đã lưu cấu hình thông báo Zalo thành công!');
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      setZaloError(err.message || 'Lỗi khi lưu cấu hình Zalo');
    } finally {
      setSavingZalo(false);
    }
  };

  const handleTestZalo = async () => {
    try {
      setTestingZalo(true);
      setZaloMsg('');
      setZaloError('');
      const res = await api.testZalo(zaloForm);
      setZaloMsg(res.message || '🎉 Đã gửi tin nhắn thử nghiệm Zalo thành công!');
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
    } catch (err) {
      setZaloError(err.message || 'Lỗi gửi tin nhắn thử nghiệm Zalo');
    } finally {
      setTestingZalo(false);
    }
  };

  const loadCloudConfig = async () => {
    try {
      const res = await api.getCloudConfig();
      if (res && res.config) {
        setCloudConfig({
          cloudUrl: res.config.cloudUrl || '',
          activeMode: res.config.activeMode || 'cloud'
        });
      }
    } catch (e) {
      console.warn('Loi tai cau hinh cloud:', e);
    }
  };

  const handleSaveCloudConfig = async (e) => {
    e.preventDefault();
    try {
      setSavingCloud(true);
      setCloudMsg('');
      const res = await api.updateCloudConfig(cloudConfig);
      setCloudMsg(res.message || 'Da luu cau hinh Cloud thanh cong!');
    } catch (err) {
      alert('Loi luu cau hinh Cloud: ' + err.message);
    } finally {
      setSavingCloud(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      loadGitStatus();
      loadAdminProfile();
      loadCloudConfig();
      loadTelegramConfig();
      loadZaloConfig();
    }
  }, [activeTab]);

  // Admin Profile & Recovery state in Manager Dashboard
  const [adminProfileForm, setAdminProfileForm] = useState({
    adminName: '',
    adminUsername: 'admin',
    adminEmail: '',
    adminPhone: '',
    currentPassword: '',
    newPassword: ''
  });
  const [adminProfileLoading, setAdminProfileLoading] = useState(false);
  const [adminProfileMsg, setAdminProfileMsg] = useState('');
  const [adminProfileError, setAdminProfileError] = useState('');

  const loadAdminProfile = async () => {
    try {
      const res = await api.getAdminProfileStatus();
      if (res && res.success) {
        setAdminProfileForm(prev => ({
          ...prev,
          adminName: res.adminName || '',
          adminUsername: res.adminUsername || 'admin',
          adminEmail: res.adminEmail || '',
          adminPhone: res.adminPhone || '',
          currentPassword: '',
          newPassword: ''
        }));
      }
    } catch (err) {
      console.warn('Lỗi đọc admin profile:', err.message);
    }
  };

  const handleSaveAdminProfileSettings = async (e) => {
    e.preventDefault();
    try {
      setAdminProfileLoading(true);
      setAdminProfileError('');
      setAdminProfileMsg('');
      const res = await api.updateAdminProfile(adminProfileForm);
      setAdminProfileMsg(res.message);
      setAdminProfileForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
      if (onSettingsChange) {
        onSettingsChange({
          ...settings,
          adminName: adminProfileForm.adminName,
          adminUsername: adminProfileForm.adminUsername
        });
      }
      setTimeout(() => setAdminProfileMsg(''), 3000);
    } catch (err) {
      setAdminProfileError(err.message || 'Lỗi khi cập nhật thông tin Quản trị');
    } finally {
      setAdminProfileLoading(false);
    }
  };

  const openEditEmployee = (emp) => {
    setEditingEmployee(emp);
    setEmpForm({
      username: emp.username || emp.code,
      fullName: emp.fullName || emp.name,
      shortName: emp.shortName || emp.name,
      name: emp.shortName || emp.name,
      gender: emp.gender || 'Nữ',
      dob: emp.dob || '',
      cccd: emp.cccd || '',
      phone: emp.phone || '',
      address: emp.address || '',
      bankCode: emp.bankCode || 'VCB',
      bankName: emp.bankName || 'Vietcombank',
      bankAccount: emp.bankAccount || '',
      accountName: emp.accountName || (emp.fullName || emp.name).toUpperCase(),
      role: emp.role || 'Nhân viên',
      hourlyRate: emp.hourlyRate || 25000,
      password: emp.password || '1234'
    });
    setShowAddEmployeeModal(true);
  };

  // Đặt lại mật khẩu nhân viên về 1234 khi nhân viên quên
  const handleResetPassword = async (emp) => {
    const isConfirm = window.confirm(`Bạn có chắc chắn muốn đặt lại mật khẩu cho nhân viên "${emp.fullName || emp.name}" (${emp.username}) về mặc định "1234" không?`);
    if (!isConfirm) return;
    try {
      setLoading(true);
      await api.resetEmployeePassword(emp.id, '1234');
      setMessage(`Đã đặt lại mật khẩu của nhân viên "${emp.shortName || emp.name}" về 1234 thành công!`);
      await loadEmployees();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setError(err.message || 'Lỗi khi đặt lại mật khẩu');
      setTimeout(() => setError(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 mb-3 border-b border-slate-200 gap-3 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Cổng Quản Trị Cửa Hàng</span>
            </span>
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1 whitespace-nowrap">
              <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Cơ sở duy nhất: Trưng Nữ Vương</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black whitespace-nowrap">
              Bản v2.0 (Chính Thức)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 whitespace-nowrap">
            Bảng Chấm Công & Quản Trị Nhân Sự
          </h2>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('timesheet')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'timesheet' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Bảng Công & Lương</span>
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'employees' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Hồ Sơ Nhân Sự ({employees.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('advances-leaves')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'advances-leaves' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="whitespace-nowrap">Tạm Ứng & Đăng Ký Nghỉ ({allAdvances.length + allLeaves.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('holidays')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'holidays' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="whitespace-nowrap">Cài Đặt Ngày Lễ (x2) ({holidaysList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'settings' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Cài Đặt Cửa Hàng</span>
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
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-bold flex items-center justify-between no-print animate-in fade-in">
          <span>{error}</span>
          <button onClick={() => setError('')} className="underline text-xs cursor-pointer text-amber-800">Đóng</button>
        </div>
      )}

      {/* ================= TAB 1: BẢNG CHẤM CÔNG & QUYẾT TOÁN LƯƠNG TỔNG HỢP ================= */}
      {activeTab === 'timesheet' && (
        <div>
          {/* Controls Bar */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-4 no-print">
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 whitespace-nowrap">Chọn Tháng Chấm Công:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="2026-11">Tháng 11/2026 (Bắt đầu sử dụng)</option>
                  <option value="2026-12">Tháng 12/2026</option>
                  <option value="2027-01">Tháng 01/2027</option>
                  <option value="2026-10">Tháng 10/2026</option>
                  <option value="2026-09">Tháng 09/2026</option>
                  <option value="2026-08">Tháng 08/2026</option>
                </select>
              </div>
              <div className="pt-5 text-xs text-slate-500 font-bold whitespace-nowrap">
                Cơ sở: <strong>Trưng Nữ Vương</strong>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <a
                href={api.getExportExcelUrl(selectedMonth)}
                download={`Bang_Cham_Cong_Kyodo_Trung_Nu_Vuong_${selectedMonth}.xlsx`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Xuất File Excel (.xlsx)</span>
              </a>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="whitespace-nowrap">In Báo Cáo</span>
              </button>
            </div>

          </div>

          {/* Store Monthly Metrics Header (5 Cards: Nhân sự, Tổng giờ, Tổng lương ca, Tạm ứng, Thực chi) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase whitespace-nowrap block">Nhân Sự</span>
              <div className="text-xl font-black text-slate-900 font-mono mt-1 whitespace-nowrap">
                {report?.summary?.totalEmployees || 0} <span className="text-xs font-semibold text-slate-500">nhân viên</span>
              </div>
            </div>

            <div className="bg-amber-50/70 rounded-3xl p-4 border border-amber-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-800 uppercase whitespace-nowrap block">Tổng Giờ Làm</span>
              <div className="text-xl font-black text-amber-700 font-mono mt-1 whitespace-nowrap">
                {report?.summary?.storeTotalHours || 0} <span className="text-xs font-semibold text-amber-600">giờ</span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-4 border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-600 uppercase whitespace-nowrap block">Lương Ca Làm</span>
              <div className="text-xl font-black text-slate-800 font-mono mt-1 whitespace-nowrap">
                {Number(report?.summary?.storeTotalSalary || 0).toLocaleString()} <span className="text-xs font-semibold text-slate-500">đ</span>
              </div>
            </div>

            <div className="bg-amber-50/70 rounded-3xl p-4 border border-amber-200 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-800 uppercase whitespace-nowrap block">Tổng Tạm Ứng</span>
              <div className="text-xl font-black text-amber-700 font-mono mt-1 whitespace-nowrap">
                {Number(report?.summary?.storeTotalAdvance || 0).toLocaleString()} <span className="text-xs font-semibold text-amber-600">đ</span>
              </div>
            </div>

            <div className="bg-emerald-50/70 rounded-3xl p-4 border border-emerald-200 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-800 uppercase whitespace-nowrap block">Thực Chi (Net)</span>
              <div className="text-xl font-black text-emerald-700 font-mono mt-1 whitespace-nowrap">
                {Number(report?.summary?.storeTotalNetSalary ?? report?.summary?.storeTotalSalary ?? 0).toLocaleString()} <span className="text-xs font-semibold text-emerald-600">đ</span>
              </div>
            </div>
          </div>

          {/* ================= BẢNG TỔNG HỢP CA LÀM & THÔNG BÁO LƯƠNG NHÂN VIÊN THEO THÁNG ================= */}
          <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-500/10 rounded-3xl p-6 border border-amber-200/80 shadow-xs mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-5 border-b border-amber-200/60 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" />
                    Bảng Tổng Hợp Ca & Thông Báo Lương
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    Áp dụng: <strong>{formatMonthVN(selectedMonth)}</strong> • Cơ sở Trưng Nữ Vương
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  Tổng Hợp Ca & Quyết Toán Tiền Lương Từng Nhân Viên
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold bg-white/90 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                <span>Ca chuẩn:</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold border border-amber-200">Sáng: 8h-17h (9h)</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold border border-amber-200">Chiều: 17h-22h (5h)</span>
              </div>
            </div>

            {/* Chi tiết ca & lương từng nhân viên */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {report?.rows?.map((row) => {
                const isUt = (row.employee.name === 'Út' || row.employee.code === 'UTNVTNV');
                const accentBg = isUt ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50 border-slate-200';
                const avatarSrc = row.employee.avatar || (row.employee.gender === 'Nữ' ? '/avatar-female.svg' : '/avatar-male.svg');

                const copyNotifyText = () => {
                  let advDetailsText = '- Không có tạm ứng trong chu kỳ này';
                  if (row.advances && row.advances.length > 0) {
                    advDetailsText = row.advances.map((a, idx) => `  • Đợt ${row.advances.length - idx} (${formatDateVN(a.date)}): ${Number(a.amount).toLocaleString('vi-VN')} VNĐ (${a.reason || 'Ứng lương'})`).join('\n');
                  }
                  const text = `📢 Kyodo Food Trưng Nữ Vương thông báo kết quả công & lương ${formatMonthVN(selectedMonth)} cho nhân viên ${row.employee.shortName || row.employee.name} (${row.employee.code || row.employee.username}):
- Ca Sáng (8h-17h • 9 tiếng): ${row.morningShifts || 0} ca
- Ca Chiều (17h-22h • 5 tiếng): ${row.eveningShifts || 0} ca
- Tổng số ca hoàn thành: ${row.totalShifts || 0} ca (${row.daysWorked || 0} ngày)
- Giờ làm ca thường: ${row.regularHours || row.totalHours} giờ${row.holidayHours > 0 ? `\n- Giờ làm ngày Lễ (x2): ${row.holidayHours} giờ (Thưởng thêm lễ: +${Number(row.holidayBonus || 0).toLocaleString()} VNĐ)` : ''}
- Tổng số giờ làm việc: ${row.totalHours} giờ
- Mức lương cơ bản: ${Number(row.hourlyRate).toLocaleString()} VNĐ/h
------------------------------------------
1. TIỀN LƯƠNG ĐÃ LÀM TRONG THÁNG: ${Number(row.totalSalary).toLocaleString()} VNĐ
2. TỔNG SỐ TIỀN ĐÃ TẠM ỨNG (${row.advanceCount || 0} lần): ${Number(row.advanceTotal || 0).toLocaleString()} VNĐ
Chi tiết các đợt tạm ứng:
${advDetailsText}
------------------------------------------
👉 3. TIỀN LƯƠNG THỰC LĨNH CÒN LẠI: ${Number(row.netSalary ?? row.totalSalary).toLocaleString()} VNĐ
(Thực lĩnh = Lương ca làm - Tổng tiền tạm ứng)
Cảm ơn em đã nỗ lực làm việc cùng Kyodo Food!`;
                  navigator.clipboard.writeText(text);
                  alert(`Đã sao chép tin nhắn thông báo lương cho ${row.employee.name}! Bạn có thể dán (Paste) để gửi qua Zalo hoặc tin nhắn.`);
                };

                return (
                  <div key={row.employee.id} className={`rounded-3xl p-5 sm:p-6 border ${accentBg} shadow-sm flex flex-col justify-between bg-white`}>
                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="flex items-center gap-3">
                          <img 
                            src={avatarSrc} 
                            alt={row.employee.name} 
                            className="w-13 h-13 rounded-2xl object-cover ring-2 ring-slate-200 bg-slate-50 shadow-xs"
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
                          <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                            Lương / Giờ (đ/h):
                          </label>
                          <div className="inline-flex items-center gap-1.5 bg-emerald-50/90 px-2.5 py-1 rounded-2xl border border-emerald-300 shadow-2xs">
                            <input
                              type="number"
                              step="1000"
                              min="0"
                              value={
                                editingRates[row.employee.id] !== undefined
                                  ? editingRates[row.employee.id]
                                  : (row.hourlyRate ?? 25000)
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditingRates(prev => ({ ...prev, [row.employee.id]: val }));
                              }}
                              onBlur={(e) => {
                                const val = e.target.value;
                                if (val !== '' && Number(val) !== Number(row.hourlyRate)) {
                                  handleQuickUpdateHourlyRate(row.employee, val);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.target.blur();
                                }
                              }}
                              className="w-22 px-2 py-0.5 bg-white rounded-xl border border-emerald-300 font-mono font-black text-emerald-800 text-xs sm:text-sm text-right focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                              placeholder="25000"
                              title="Nhập mức lương giờ và nhấn Enter hoặc bấm ra ngoài để lưu"
                            />
                            <span className="text-[11px] font-black font-mono text-emerald-700">
                              đ/h
                            </span>
                            {savingRateId === row.employee.id ? (
                              <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin shrink-0" />
                            ) : rateSuccessId === row.employee.id ? (
                              <span className="text-[9px] font-black text-emerald-800 bg-emerald-200 px-1 py-0.5 rounded-md shrink-0 animate-in fade-in">
                                ✓ Lưu
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Phân rã số ca sáng / số ca chiều / số ngày làm / số ngày nghỉ */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2.5 border-y border-slate-100 my-2.5 text-center text-xs">
                        <div className="bg-amber-50/60 rounded-xl p-2 border border-amber-200/80">
                          <span className="text-[10px] text-amber-800 font-bold block uppercase whitespace-nowrap">Ca Sáng (8-17h)</span>
                          <strong className="text-base font-mono font-black text-amber-900 whitespace-nowrap">
                            {row.morningShifts || 0} <span className="text-xs font-normal">ca</span>
                          </strong>
                        </div>
                        <div className="bg-amber-50/50 rounded-xl p-2 border border-amber-100">
                          <span className="text-[10px] text-amber-700 font-bold block uppercase whitespace-nowrap">Ca Chiều (17-22h)</span>
                          <strong className="text-base font-mono font-black text-amber-800 whitespace-nowrap">
                            {row.eveningShifts || 0} <span className="text-xs font-normal">ca</span>
                          </strong>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-2 border border-slate-200">
                          <span className="text-[10px] text-slate-500 font-bold block uppercase whitespace-nowrap">Số Ngày Đi Làm</span>
                          <strong className="text-base font-mono font-black text-slate-800 whitespace-nowrap">
                            {row.daysWorked || 0} <span className="text-xs font-normal">ngày</span>
                          </strong>
                        </div>
                        <div className="bg-blue-50/60 rounded-xl p-2 border border-blue-100">
                          <span className="text-[10px] text-blue-700 font-bold block uppercase whitespace-nowrap">Số Ngày Nghỉ</span>
                          <strong className="text-base font-mono font-black text-blue-800 whitespace-nowrap">
                            {row.leaveDaysCount || 0} <span className="text-xs font-normal">ngày</span>
                          </strong>
                        </div>
                      </div>

                      {/* KHỐI QUYẾT TOÁN TÀI CHÍNH CHI TIẾT (3 MỤC RÕ RÀNG) */}
                      <div className="mt-4 space-y-3">
                        {/* 1. SỐ TIỀN LƯƠNG ĐÃ LÀM TRONG THÁNG */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">1</span>
                              <div>
                                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide whitespace-nowrap block">
                                  Số Tiền Lương Đã Làm Trong Tháng:
                                </span>
                                <p className="text-[11px] text-slate-500 whitespace-nowrap">
                                  {row.totalHours} giờ × {Number(row.hourlyRate).toLocaleString()} đ/h ({row.totalShifts || 0} ca)
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-lg font-black font-mono text-slate-900 whitespace-nowrap">
                                {Number(row.totalSalary).toLocaleString()}
                              </span>
                              <span className="text-xs font-bold text-slate-500 ml-1 whitespace-nowrap">VNĐ</span>
                            </div>
                          </div>
                        </div>

                        {/* 2. TỔNG SỐ TIỀN LƯƠNG ĐÃ TẠM ỨNG (KÈM CHI TIẾT TỪNG ĐỢT) */}
                        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
                              <div>
                                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide whitespace-nowrap block">
                                  Tổng Số Tiền Lương Đã Tạm Ứng:
                                </span>
                                <p className="text-[11px] text-amber-700 font-medium whitespace-nowrap">
                                  <strong>{row.advanceCount || 0} lần ứng lương</strong> trong tháng
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-lg font-black font-mono text-amber-800 whitespace-nowrap">
                                {Number(row.advanceTotal || 0).toLocaleString()}
                              </span>
                              <span className="text-xs font-bold text-amber-700 ml-1 whitespace-nowrap">VNĐ</span>
                            </div>
                          </div>

                          {/* Chi tiết từng đợt tạm ứng */}
                          <div className="mt-2.5 pt-2.5 border-t border-amber-200/60">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[11px] font-bold text-amber-800 uppercase">
                                Chi tiết các đợt ứng ({row.advanceCount || 0} đợt):
                              </span>
                              <button
                                type="button"
                                onClick={() => openManagerAdvanceModal(row.employee)}
                                className="text-[11px] font-extrabold text-amber-900 hover:text-amber-950 bg-amber-200 hover:bg-amber-300 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                              >
                                <Plus className="w-3 h-3" />
                                <span>+ Ghi Nhận Ứng Lương</span>
                              </button>
                            </div>

                            {row.advances && row.advances.length > 0 ? (
                              <div className="space-y-1.5 mt-2">
                                {row.advances.map((adv, idx) => (
                                  <div key={adv.id || idx} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-amber-200/70 text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] font-mono whitespace-nowrap">
                                        Đợt {row.advances.length - idx}
                                      </span>
                                      <span className="font-bold text-slate-800 whitespace-nowrap">{formatDateVN(adv.date)}</span>
                                      <span className="text-slate-500 text-[11px] italic truncate max-w-44">
                                        ({adv.reason || 'Ứng lương'})
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-black text-amber-800 whitespace-nowrap">
                                        -{Number(adv.amount).toLocaleString('vi-VN')} đ
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => openEditAdvanceModal(adv, row.employee)}
                                        className="text-slate-400 hover:text-amber-600 p-1 rounded-md hover:bg-amber-50 cursor-pointer transition-colors"
                                        title="Chỉnh sửa số tiền hoặc ngày ứng"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteAdvanceByManager(adv.id, row.employee.name, adv.amount)}
                                        className="text-slate-400 hover:text-amber-800 p-1 rounded-md hover:bg-amber-100 cursor-pointer transition-colors"
                                        title="Xóa đợt ứng này"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-amber-700/80 italic bg-white/70 p-2 rounded-xl text-center mt-1">
                                Nhân viên {row.employee.name} chưa có đợt tạm ứng lương nào trong tháng.
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 3. SỐ TIỀN LƯƠNG CÒN LẠI SAU KHI TRỪ ĐI LƯƠNG TẠM ỨNG (THỰC LĨNH) */}
                        <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-white text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">3</span>
                              <div>
                                <span className="text-xs font-black uppercase tracking-wide block whitespace-nowrap">
                                  Lương Thực Lĩnh (Sau Trừ Tạm Ứng):
                                </span>
                                <p className="text-[11px] text-emerald-100 font-medium whitespace-nowrap">
                                  Lương ca ({Number(row.totalSalary).toLocaleString()} đ) - Tạm ứng ({Number(row.advanceTotal || 0).toLocaleString()} đ)
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-2xl font-black font-mono text-white whitespace-nowrap">
                                {Number(row.netSalary ?? row.totalSalary).toLocaleString()}
                              </span>
                              <span className="text-xs font-bold text-emerald-100 ml-1 whitespace-nowrap">VNĐ</span>
                            </div>
                          </div>

                          {/* Nút thanh toán tiền lương VietQR chuẩn */}
                          <button
                            type="button"
                            onClick={() => {
                              if (!row.employee?.bankAccount) {
                                alert(`Nhân viên ${row.employee.name} chưa cập nhật Tài Khoản Ngân Hàng! Vui lòng vào tab "Hồ Sơ Nhân Sự" để bổ sung số tài khoản ngân hàng.`);
                                return;
                              }
                              const transferAmount = Math.max(0, row.netSalary ?? (row.totalSalary - (row.advanceTotal || 0)));
                              setQrModalData({
                                bankCode: row.employee.bankCode,
                                bankName: row.employee.bankName,
                                bankAccount: row.employee.bankAccount,
                                accountName: row.employee.accountName || row.employee.name,
                                amount: transferAmount,
                                memo: `KyodoFoods DN Thanh Toan Tien Luong. Cam On Em`,
                                employeeName: row.employee.name,
                                month: selectedMonth
                              });
                              setShowQrModal(true);
                            }}
                            className="mt-3 w-full py-2.5 px-3 rounded-xl bg-linear-to-r from-amber-600 via-amber-700 to-yellow-600 hover:from-amber-700 hover:to-amber-800 text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg whitespace-nowrap"
                            title="Tạo mã VietQR quét bằng App ngân hàng chuyển khoản đúng số tiền thực lĩnh kèm nội dung chuẩn: KyodoFoods DN Thanh Toan Tien Luong. Cam On Em"
                          >
                            <CreditCard className="w-4 h-4 shrink-0 text-amber-200" />
                            <span className="whitespace-nowrap">💳 Thanh Toán Lương (Quét Mã QR)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Tiện ích copy gửi nhân viên */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between no-print">
                      <span className="text-[11px] text-slate-500 italic whitespace-nowrap">
                        Thực lĩnh = Lương ca - Đã ứng
                      </span>
                      <button
                        type="button"
                        onClick={copyNotifyText}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
                        title="Sao chép thông báo gửi qua Zalo / SMS cho nhân viên"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="whitespace-nowrap">Sao Chép Báo Lương</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Master Table Matrix */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            
            {/* Header thông tin chu kỳ ngày & chế độ hiển thị */}
            <div className="px-4 py-3 bg-linear-to-r from-amber-50/90 via-orange-50/70 to-amber-50/90 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <CalendarDays className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-xs sm:text-sm whitespace-nowrap">
                      Bảng Chấm Công Ma Trận: {formatMonthVN(selectedMonth)}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 font-black text-[11px] border border-amber-300 whitespace-nowrap">
                      Chu kỳ {report?.days?.length || 31} ngày (Ngày 01 ➔ Ngày {String(report?.days?.length || 31).padStart(2, '0')})
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 font-medium mt-0.5 whitespace-nowrap">
                    Tháng này có <strong>{report?.days?.length || 31} ngày</strong> • Toàn bộ ngày hiển thị trực diện trên màn hình
                  </p>
                </div>
              </div>

              {/* Bộ chuyển đổi thu phóng: Vừa vặn màn hình (hiện đủ 31 ngày) vs Mở rộng */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-amber-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setTableDensity('compact')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                    tableDensity === 'compact'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Tối ưu kích thước cột để hiện toàn bộ 31 ngày trên màn hình không bị cắt"
                >
                  <span>✨ Vừa Màn Hình ({report?.days?.length || 31} Ngày)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTableDensity('expanded')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                    tableDensity === 'expanded'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Mở rộng khoảng cách cột và cuộn ngang"
                >
                  <span>↔️ Mở Rộng Ô</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-2.5 sticky left-0 bg-slate-100 z-10 w-28 min-w-[100px] text-left">
                      <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-800">Nhân Viên</span>
                    </th>
                    <th className="py-2.5 px-1 text-center w-8 min-w-[30px] text-slate-600 font-extrabold text-[10px]">
                      GT
                    </th>
                    
                    {report?.days?.map(d => (
                      <th 
                        key={d.day} 
                        className={`py-1.5 px-0.5 text-center transition-all ${
                          tableDensity === 'compact' 
                            ? 'w-7 min-w-[24px] max-w-[28px]' 
                            : 'min-w-10 px-1'
                        } ${
                          d.isHoliday 
                            ? 'bg-amber-200/90 text-amber-950 font-black border-b-2 border-amber-500' 
                            : d.isWeekend 
                              ? 'bg-amber-100/90 text-amber-950 font-black' 
                              : 'text-slate-700'
                        }`}
                        title={d.isHoliday ? `🎉 ${d.holidayName || 'Ngày Lễ'} (${d.dateVN || formatDateVN(d.date)}): Lương ×${d.holidayMultiplier || 2}` : `${d.dateVN || formatDateVN(d.date)} (${d.dayOfWeek})`}
                      >
                        <div className="flex items-center justify-center gap-0.5 font-black text-[11px] leading-tight">
                          <span>{d.day}</span>
                          {d.isHoliday && <span className="text-[9px]">⭐</span>}
                        </div>
                        <div className={`text-[8px] font-bold leading-tight ${d.isHoliday ? 'text-amber-900 font-black' : d.isWeekend ? 'text-amber-800' : 'text-slate-400'}`}>
                          {d.isHoliday ? `x${d.holidayMultiplier || 2}` : d.dayOfWeek}
                        </div>
                      </th>
                    ))}

                    <th className="py-2.5 px-2 text-center bg-amber-50 text-amber-900 font-black min-w-[54px] text-[11px] uppercase">
                      Tổng Giờ
                    </th>
                    <th className="py-2.5 px-2 text-right bg-slate-100 min-w-[60px] font-bold text-slate-600 text-[10px] uppercase">
                      Lương/h
                    </th>
                    <th className="py-2.5 px-2 text-right bg-slate-100 min-w-[68px] font-bold text-slate-700 text-[11px] uppercase">
                      Lương Ca
                    </th>
                    <th className="py-2.5 px-2 text-right bg-amber-50 text-amber-900 font-black min-w-[68px] text-[11px] uppercase">
                      Tạm Ứng
                    </th>
                    <th className="py-2.5 px-2.5 text-right bg-emerald-50 text-emerald-900 font-black min-w-[76px] text-xs uppercase">
                      Thực Lĩnh
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {report?.rows?.map((row) => (
                    <tr key={row.employee.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-2 px-2.5 sticky left-0 bg-white z-10 whitespace-nowrap border-r border-slate-100">
                        <div className="font-black text-slate-900 text-xs leading-tight">
                          {row.employee.shortName || row.employee.name}
                        </div>
                        <div className="text-[10px] font-mono text-amber-700 font-bold leading-tight mt-0.5">
                          {row.employee.username || row.employee.code}
                        </div>
                      </td>
                      <td className="py-2 px-1 text-center text-slate-500 text-[10px] font-bold">
                        {row.employee.gender || "Nam"}
                      </td>

                      {report?.days?.map(d => {
                        const cellData = row.dailyData[d.day];
                        const hasHours = cellData && cellData.hours > 0;
                        const logsTooltip = cellData?.logs?.map((l, i) => `Ca ${i+1}: ${formatShortTime(l.checkIn)} - ${formatShortTime(l.checkOut)} (${l.totalHours}h)`).join('\n') || '';
                        return (
                          <td 
                            key={d.day} 
                            className={`py-1 px-0.5 text-center font-mono ${
                              tableDensity === 'compact' ? 'w-7 min-w-[24px] max-w-[28px]' : 'min-w-10'
                            } ${d.isWeekend ? 'bg-amber-50/50' : ''}`}
                            title={logsTooltip || `${d.dateVN || formatDateVN(d.date)} (${d.dayOfWeek}): Chưa có giờ làm`}
                          >
                            {hasHours ? (
                              <span 
                                className="inline-flex items-center justify-center w-5 h-5 rounded bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] shadow-2xs transition-transform cursor-pointer"
                                title={logsTooltip}
                              >
                                {cellData.hours}
                              </span>
                            ) : (
                              <span className="text-slate-300 text-[10px] select-none">-</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-2 px-2 text-center font-mono font-black text-amber-800 bg-amber-50/50 whitespace-nowrap text-xs">
                        {row.totalHours}h
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-600 whitespace-nowrap font-bold text-[10px]">
                        {Number(row.hourlyRate).toLocaleString()}đ
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-slate-800 whitespace-nowrap font-bold text-[11px]">
                        {Number(row.totalSalary).toLocaleString()}đ
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-black text-amber-700 bg-amber-50/50 whitespace-nowrap text-[11px]">
                        {Number(row.advanceTotal || 0).toLocaleString()}đ
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-black text-emerald-700 bg-emerald-50/50 whitespace-nowrap text-xs">
                        <div className="flex items-center justify-end gap-1.5">
                          <span>{Number(row.netSalary ?? row.totalSalary).toLocaleString()}đ</span>
                          {row.employee?.bankAccount && (
                            <button
                              type="button"
                              onClick={() => {
                                const transferAmount = Math.max(0, row.netSalary ?? (row.totalSalary - (row.advanceTotal || 0)));
                                setQrModalData({
                                  bankCode: row.employee.bankCode,
                                  bankName: row.employee.bankName,
                                  bankAccount: row.employee.bankAccount,
                                  accountName: row.employee.accountName || row.employee.name,
                                  amount: transferAmount,
                                  memo: `KyodoFoods DN Thanh Toan Tien Luong. Cam On Em`,
                                  employeeName: row.employee.name,
                                  month: selectedMonth
                                });
                                setShowQrModal(true);
                              }}
                              className="p-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-all cursor-pointer shadow-2xs"
                              title={`Quét mã QR thanh toán lương cho ${row.employee.name}`}
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr className="bg-slate-900 text-white font-extrabold text-xs">
                    <td colSpan={2} className="py-2.5 px-3 uppercase tracking-wider sticky left-0 bg-slate-900 z-10 text-[11px]">
                      TỔNG CỘNG ({formatMonthVN(selectedMonth)})
                    </td>
                    <td colSpan={report?.days?.length || 31} className="py-2 px-1 text-center text-slate-400 text-[10px] truncate">
                      - Đầy đủ {report?.days?.length || 31} ngày ({formatMonthVN(selectedMonth)}) -
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-amber-400 text-xs whitespace-nowrap">
                      {report?.summary?.storeTotalHours || 0}h
                    </td>
                    <td className="py-2.5 px-2 text-right text-slate-500 text-[10px]">--</td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-300 text-[11px] whitespace-nowrap">
                      {Number(report?.summary?.storeTotalSalary || 0).toLocaleString()}đ
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-amber-400 text-[11px] whitespace-nowrap">
                      {Number(report?.summary?.storeTotalAdvance || 0).toLocaleString()}đ
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono text-emerald-400 text-xs whitespace-nowrap">
                      {Number(report?.summary?.storeTotalNetSalary ?? report?.summary?.storeTotalSalary ?? 0).toLocaleString()}đ
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
              <h3 className="text-lg font-bold text-slate-900 whitespace-nowrap">
                Hồ Sơ Nhân Sự Cửa Hàng Trưng Nữ Vương
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">
                Quản lý hồ sơ: Ngày sinh, SĐT, CCCD, Ngân hàng và Mức lương.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingEmployee(null);
                setEmpForm({
                  username: `NV${employees.length + 1}TNV`,
                  fullName: '',
                  shortName: '',
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/25 transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">Tạo Tài Khoản Mới</span>
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
                          alt={emp.shortName || emp.name} 
                          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-slate-100 bg-slate-50" 
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 text-xs font-black font-mono whitespace-nowrap">
                              TK: {emp.username || emp.code}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold whitespace-nowrap">
                              {emp.gender || "Nam"}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold whitespace-nowrap">
                              Biệt danh: {emp.shortName || emp.name}
                            </span>
                          </div>
                          <h4 className="text-lg font-black text-slate-900 mt-1 whitespace-nowrap">{emp.fullName || emp.name}</h4>
                          <p className="text-xs text-slate-500 font-medium whitespace-nowrap">Trưng Nữ Vương • {emp.role}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1 whitespace-nowrap">
                          Lương / Giờ (Nhập số):
                        </label>
                        <div className="inline-flex items-center gap-1.5 bg-emerald-50/90 px-2.5 py-1.5 rounded-2xl border border-emerald-300 shadow-2xs whitespace-nowrap">
                          <input
                            type="number"
                            step="1000"
                            min="0"
                            value={
                              editingRates[emp.id] !== undefined
                                ? editingRates[emp.id]
                                : (emp.hourlyRate ?? 25000)
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingRates(prev => ({ ...prev, [emp.id]: val }));
                            }}
                            onBlur={(e) => {
                              const val = e.target.value;
                              if (val !== '' && Number(val) !== Number(emp.hourlyRate)) {
                                handleQuickUpdateHourlyRate(emp, val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.target.blur();
                              }
                            }}
                            className="w-24 px-2 py-1 bg-white rounded-xl border border-emerald-300 font-mono font-black text-emerald-800 text-sm text-right focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                            placeholder="25000"
                            title="Nhập mức lương giờ và nhấn Enter hoặc bấm ra ngoài để lưu"
                          />
                          <span className="text-xs font-black font-mono text-emerald-700 whitespace-nowrap">
                            đ/h
                          </span>
                          {savingRateId === emp.id ? (
                            <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin shrink-0" />
                          ) : rateSuccessId === emp.id ? (
                            <span className="text-[10px] font-black text-emerald-800 bg-emerald-200 px-1.5 py-0.5 rounded-lg shrink-0 animate-in fade-in whitespace-nowrap">
                              ✓ Đã lưu
                            </span>
                          ) : null}
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-0.5 font-medium whitespace-nowrap">
                          Nhập trực tiếp để đổi lương
                        </span>
                      </div>
                    </div>

                    {/* Lưới thông tin chi tiết: CCCD, Điện thoại, Ngày sinh, Địa chỉ */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-2xl mb-4 border border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block whitespace-nowrap">Số CCCD:</span>
                        <strong className="font-mono text-slate-800 whitespace-nowrap">{emp.cccd || "Chưa cập nhật"}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block whitespace-nowrap">Số Điện Thoại:</span>
                        <strong className="font-mono text-slate-800 whitespace-nowrap">{emp.phone || "Chưa cập nhật"}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block whitespace-nowrap">Ngày Sinh:</span>
                        <span className="font-semibold text-slate-700 whitespace-nowrap">{formatDateVN(emp.dob) || "Chưa cập nhật"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block whitespace-nowrap">Mật Khẩu Đăng Nhập:</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-amber-700 font-black text-xs whitespace-nowrap">
                            {visiblePasswords[emp.id] ? (emp.password || '1234') : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setVisiblePasswords(prev => ({ ...prev, [emp.id]: !prev[emp.id] }))}
                            className="p-1 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
                            title={visiblePasswords[emp.id] ? "Ẩn mật khẩu" : "Hiện mật khẩu mới của nhân viên"}
                          >
                            {visiblePasswords[emp.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md whitespace-nowrap ${
                            emp.passwordChanged ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {emp.passwordChanged ? 'Đã đổi MK' : 'Mặc định'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleResetPassword(emp)}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 border border-slate-200 transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                            title="Đặt lại mật khẩu về mặc định 1234 nếu nhân viên quên"
                          >
                            <Key className="w-3 h-3 text-amber-600" />
                            <span>Đặt lại 1234</span>
                          </button>
                        </div>
                      </div>

                      <div className="col-span-2 pt-1.5 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block whitespace-nowrap">Tài Khoản Ngân Hàng (VietQR Napas 247):</span>
                          <span className="font-semibold text-slate-800 whitespace-nowrap">
                            {emp.bankAccount ? `${emp.bankName || emp.bankCode}: ${emp.bankAccount} (${emp.accountName || emp.name})` : 'Chưa cập nhật tài khoản ngân hàng'}
                          </span>
                        </div>
                        {emp.bankAccount && (
                          <button
                            type="button"
                            onClick={() => {
                              setQrModalData({
                                bankCode: emp.bankCode,
                                bankName: emp.bankName,
                                bankAccount: emp.bankAccount,
                                accountName: emp.accountName || emp.name,
                                amount: 0,
                                employeeName: emp.name
                              });
                              setShowQrModal(true);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 flex items-center gap-1 shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <QrCode className="w-3.5 h-3.5 shrink-0" />
                            <span className="whitespace-nowrap">Mã QR TK</span>
                          </button>
                        )}
                      </div>

                      <div className="col-span-2 pt-1 border-t border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block whitespace-nowrap">Địa Chỉ:</span>
                        <span className="text-slate-700 font-medium whitespace-nowrap">{emp.address || "Trưng Nữ Vương, Đà Nẵng"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => openEditEmployee(emp)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Edit className="w-3.5 h-3.5 shrink-0" />
                      <span className="whitespace-nowrap">Sửa Thông Tin & Lương</span>
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(emp.id, emp.name, emp.username)}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-amber-800 text-xs font-bold transition-all cursor-pointer"
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

      {/* ================= TAB 3: QUẢN LÝ TẠM ỨNG LƯƠNG & THÔNG BÁO NGHỈ ================= */}
      {activeTab === 'advances-leaves' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-lg font-bold text-slate-900 whitespace-nowrap">
                Quản Lý Tạm Ứng Lương & Đăng Ký Ngày Nghỉ
              </h3>
              <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">
                Tổng hợp tạm ứng lương và đăng ký ngày nghỉ của nhân viên.
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
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-600 stroke-[3]" />
                <span>Danh Sách Tạm Ứng Lương ({allAdvances.length} bản ghi)</span>
              </h4>

              <button
                type="button"
                onClick={() => openManagerAdvanceModal(employees.find(e => e.active !== false) || employees[0])}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Ghi Nhận Tạm Ứng Mới</span>
              </button>
            </div>

            {allAdvances.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-amber-50/70 border-b border-amber-200 text-amber-900 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4 whitespace-nowrap">Nhân Viên</th>
                      <th className="py-3 px-4 whitespace-nowrap">Ngày Ứng (DD/MM/YYYY)</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Số Tiền Tạm Ứng</th>
                      <th className="py-3 px-4 whitespace-nowrap">Lý Do</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Trạng Thái</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allAdvances.map(adv => (
                      <tr key={adv.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                          {adv.employeeShortName || adv.employeeName} ({adv.employeeCode})
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-semibold whitespace-nowrap">{formatDateVN(adv.date)}</td>
                        <td className="py-3 px-4 font-mono font-black text-amber-700 text-right text-sm whitespace-nowrap">
                          {Number(adv.amount).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{adv.reason || "Ứng lương"}</td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold whitespace-nowrap">
                            Đã Khấu Trừ
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5 shrink-0">
                            <button
                              onClick={() => openEditAdvanceModal(adv)}
                              className="p-1 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                              title="Chỉnh sửa số tiền hoặc ngày ứng"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAdvanceByManager(adv.id, adv.employeeShortName || adv.employeeName, adv.amount)}
                              className="p-1 rounded-lg hover:bg-amber-100 text-slate-400 hover:text-amber-800 transition-colors cursor-pointer"
                              title="Xóa khoản tạm ứng này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-4">
                Không có bản ghi tạm ứng lương nào trong {formatMonthVN(selectedMonth)}.
              </p>
            )}
          </div>

          {/* Section: Danh sách thông báo nghỉ */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h4 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <span>Danh Sách Đăng Ký Ngày Nghỉ ({allLeaves.length} bản ghi)</span>
            </h4>

            {allLeaves.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-blue-50/70 border-b border-blue-200 text-blue-900 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4 whitespace-nowrap">Nhân Viên</th>
                      <th className="py-3 px-4 whitespace-nowrap">Ngày Đăng Ký Nghỉ (DD/MM/YYYY)</th>
                      <th className="py-3 px-4 whitespace-nowrap">Ca Nghỉ</th>
                      <th className="py-3 px-4 whitespace-nowrap">Lý Do / Ghi Chú</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Trạng Thái</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allLeaves.map(leave => (
                      <tr key={leave.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                          {leave.employeeShortName || leave.employeeName} ({leave.employeeCode})
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-semibold whitespace-nowrap">{formatDateVN(leave.date)}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold whitespace-nowrap">
                            {leave.shift}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{leave.reason}</td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold whitespace-nowrap">
                            Đã Thông Báo
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteLeaveByManager(leave.id, leave.employeeShortName || leave.employeeName, leave.date)}
                            className="p-1 rounded-lg hover:bg-amber-100 text-slate-400 hover:text-amber-800 transition-colors cursor-pointer shrink-0"
                            title="Xóa thông báo nghỉ này"
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
                Không có thông báo nghỉ nào trong {formatMonthVN(selectedMonth)}.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 4: CÀI ĐẶT NGÀY LỄ (HỆ SỐ LƯƠNG X2) ================= */}
      {activeTab === 'holidays' && (
        <div className="space-y-4">
          
          {/* Header Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                  </span>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Cài Đặt & Quản Lý Ngày Lễ (Lương Nhân 2)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Hệ thống tự động nhận diện ngày lễ lớn và áp dụng hệ số lương x2 cho ca làm việc.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Lọc theo năm */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  {['2026', '2027', 'all'].map((yr) => (
                    <button
                      key={yr}
                      onClick={() => setHolidaysYear(yr)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        holidaysYear === yr ? 'bg-white text-amber-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {yr === 'all' ? 'Tất cả' : `Năm ${yr}`}
                    </button>
                  ))}
                </div>

                {/* Nút thêm ngày lễ riêng */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingHoliday(null);
                    setHolidayForm({ name: '', date: '', multiplier: 2, description: '' });
                    setShowAddHolidayModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Thêm Ngày Lễ Riêng</span>
                </button>
              </div>
            </div>

            {/* Thông điệp chính sách */}
            <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3">
              <span className="text-lg">📢</span>
              <div className="text-xs text-amber-950 leading-relaxed">
                <strong className="font-extrabold">Quy tắc tính lương ngày Lễ:</strong> Nhân viên khi có ca làm việc rơi vào các ngày lễ đang BẬT bên dưới sẽ nhận mức lương <span className="text-amber-800 font-black underline">hệ số ×2 (nhân đôi)</span> tự động. Bạn có thể Bật/Tắt từng ngày hoặc thêm ngày lễ riêng của cửa hàng bất cứ lúc nào.
              </div>
            </div>
          </div>

          {/* Table of holidays */}
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] tracking-wider font-extrabold">
                    <th className="py-3 px-4">Ngày Áp Dụng (DD/MM/YYYY)</th>
                    <th className="py-3 px-4">Thứ</th>
                    <th className="py-3 px-4">Tên Ngày Lễ</th>
                    <th className="py-3 px-3 text-center">Hệ Số Lương</th>
                    <th className="py-3 px-3 text-center">Phân Loại</th>
                    <th className="py-3 px-4 text-center">Trạng Thái</th>
                    <th className="py-3 px-4 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {holidaysList.map((h) => {
                    const dObj = new Date(h.date);
                    const daysVN = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                    const dayName = daysVN[dObj.getDay()];
                    return (
                      <tr key={h.id} className={`hover:bg-slate-50/80 transition-colors ${!h.active ? 'opacity-60 bg-slate-50/40' : ''}`}>
                        <td className="py-3 px-4 font-mono font-black text-slate-900 whitespace-nowrap">
                          {formatDateVN(h.date)}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-600 whitespace-nowrap">
                          {dayName}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>{h.name}</span>
                            {h.description && (
                              <span className="text-[11px] text-slate-400 font-normal">({h.description})</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300">
                            ×{h.multiplier || 2} Lương
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {h.isDefault ? (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                              Lễ Nhà Nước
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold">
                              Quán Tự Thêm
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleHoliday(h)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              h.active
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-200 text-slate-600 border border-slate-300'
                            }`}
                            title="Bấm để Bật hoặc Tắt áp dụng ngày lễ này"
                          >
                            <span className={`w-2 h-2 rounded-full ${h.active ? 'bg-emerald-600' : 'bg-slate-400'}`}></span>
                            <span>{h.active ? 'Đang Áp Dụng' : 'Tạm Dừng'}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingHoliday(h);
                                setHolidayForm({
                                  name: h.name,
                                  date: h.date,
                                  multiplier: h.multiplier || 2,
                                  description: h.description || ''
                                });
                                setShowAddHolidayModal(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                              title="Sửa ngày lễ"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {!h.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleDeleteHoliday(h)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Xóa ngày lễ riêng này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Thêm / Chỉnh Sửa Ngày Lễ */}
          {showAddHolidayModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-base">
                        {editingHoliday ? 'Chỉnh Sửa Ngày Lễ' : 'Thêm Ngày Lễ Mới'}
                      </h4>
                      <p className="text-[11px] text-slate-500">Cửa hàng Kyodo Food Trưng Nữ Vương</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddHolidayModal(false);
                      setEditingHoliday(null);
                    }}
                    className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveHoliday} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên Ngày Lễ *
                    </label>
                    <input
                      type="text"
                      required
                      value={holidayForm.name}
                      onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                      placeholder="VD: Ngày Thành Lập Quán, Khai Trương, Lễ Giáng Sinh..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ngày Áp Dụng (DD/MM/YYYY) * {holidayForm.date && <span className="text-amber-800 font-mono">({formatDateVN(holidayForm.date)})</span>}
                      </label>
                      <div className="relative cursor-pointer group">
                        <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 pointer-events-none z-10" />
                        <input
                          type="text"
                          readOnly
                          value={formatDateVN(holidayForm.date) || 'DD/MM/YYYY'}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-black text-amber-900 text-xs shadow-2xs group-hover:border-amber-400 transition-colors pointer-events-none"
                          placeholder="DD/MM/YYYY"
                        />
                        <input
                          type="date"
                          required
                          value={holidayForm.date}
                          onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                          title="Nhấn để chọn ngày áp dụng (DD/MM/YYYY)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Hệ Số Lương *
                      </label>
                      <select
                        value={holidayForm.multiplier}
                        onChange={(e) => setHolidayForm({ ...holidayForm, multiplier: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
                      >
                        <option value={1.5}>×1.5 (Nhân 1.5 lần)</option>
                        <option value={2}>×2.0 (Nhân đôi - Chuẩn)</option>
                        <option value={2.5}>×2.5 (Nhân 2.5 lần)</option>
                        <option value={3}>×3.0 (Nhân 3 lần)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ghi Chú / Diễn Giải
                    </label>
                    <input
                      type="text"
                      value={holidayForm.description}
                      onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                      placeholder="VD: Thưởng thêm nhân dịp đặc biệt của cửa hàng"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddHolidayModal(false);
                        setEditingHoliday(null);
                      }}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={holidayLoading}
                      className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {holidayLoading ? 'Đang Lưu...' : (editingHoliday ? 'Cập Nhật Ngày Lễ' : 'Lưu Ngày Lễ')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ================= TAB 5: CÀI ĐẶT CỬA HÀNG ================= */}
      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Card: CẤU HÌNH KẾT NỐI CLOUD ĐỒNG BỘ NGHỆ AN - ĐÀ NẴNG */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold text-lg">
                  ☁️
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Cấu Hình Kết Nối Cloud (Đà Nẵng - Nghệ An)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Đồng bộ chấm công trực tuyến tức thì giữa cơ sở Đà Nẵng và Nghệ An
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                cloudConfig.activeMode === 'cloud' && cloudConfig.cloudUrl 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${cloudConfig.activeMode === 'cloud' && cloudConfig.cloudUrl ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                {cloudConfig.activeMode === 'cloud' && cloudConfig.cloudUrl ? 'Cloud Online' : 'Localhost'}
              </span>
            </div>

            <form onSubmit={handleSaveCloudConfig} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Đường dẫn Cloud Máy Chủ (Render / Cloudflare):
                </label>
                <input
                  type="url"
                  value={cloudConfig.cloudUrl}
                  onChange={(e) => setCloudConfig({ ...cloudConfig, cloudUrl: e.target.value })}
                  placeholder="https://kyodo-food-attendance.onrender.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-700 focus:outline-hidden focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Khi cấu hình link này, máy tính ở Đà Nẵng và điện thoại của quản lý tại Nghệ An sẽ tự động kết nối chung 1 cơ sở dữ liệu trên Cloud.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="radio"
                    name="cloudMode"
                    value="cloud"
                    checked={cloudConfig.activeMode === 'cloud'}
                    onChange={() => setCloudConfig({ ...cloudConfig, activeMode: 'cloud' })}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>Ưu tiên chạy Cloud (Khuyến nghị)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                  <input
                    type="radio"
                    name="cloudMode"
                    value="local"
                    checked={cloudConfig.activeMode === 'local'}
                    onChange={() => setCloudConfig({ ...cloudConfig, activeMode: 'local' })}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>Chạy máy chủ Localhost nội bộ</span>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={savingCloud}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold transition-all cursor-pointer shadow-md shadow-amber-600/20"
                >
                  {savingCloud ? 'Đang lưu...' : 'Lưu Cấu Hình Cloud'}
                </button>

                {cloudConfig.cloudUrl && (
                  <a
                    href={cloudConfig.cloudUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-all flex items-center gap-1.5"
                  >
                    <span>Mở thử link Cloud</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              {cloudMsg && (
                <p className="text-emerald-600 font-bold mt-2">✅ {cloudMsg}</p>
              )}
            </form>
          </div>

          {/* Card: CẤU HÌNH THÔNG BÁO TỨC THÌ (ZALO & TELEGRAM) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-lg border ${
                  notifyTab === 'zalo' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-sky-50 text-sky-600 border-sky-200'
                }`}>
                  {notifyTab === 'zalo' ? <MessageCircle className="w-5 h-5 text-blue-600" /> : <Send className="w-5 h-5 text-sky-600" />}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>Thông Báo Báo Động Tức Thì</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">Zalo / Telegram</span>
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Tự động gửi tin nhắn báo về điện thoại Quản lý khi nhân viên Ứng Lương hoặc Xin Nghỉ
                  </p>
                </div>
              </div>

              {/* Nút chuyển đổi Zalo vs Telegram */}
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setNotifyTab('zalo')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    notifyTab === 'zalo' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Kênh Zalo</span>
                  {zaloForm.enabled && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                </button>
                <button
                  type="button"
                  onClick={() => setNotifyTab('telegram')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    notifyTab === 'telegram' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kênh Telegram</span>
                  {telegramForm.enabled && <span className="w-2 h-2 rounded-full bg-emerald-400"></span>}
                </button>
              </div>
            </div>

            {/* TAB 1: CẤU HÌNH ZALO */}
            {notifyTab === 'zalo' && (
              <form onSubmit={handleSaveZaloConfig} className="space-y-4 text-xs animate-in fade-in">
                <div className="flex items-center justify-between p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200">
                  <div>
                    <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <span>Bật tính năng gửi thông báo qua Zalo</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Mỗi khi nhân viên gửi đơn ứng lương hoặc xin nghỉ, thông báo sẽ báo ngay về Zalo của bạn</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={zaloForm.enabled}
                      onChange={(e) => setZaloForm({ ...zaloForm, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* Chọn phương thức kết nối Zalo */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-700 mb-1">Phương thức kết nối Zalo:</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input
                        type="radio"
                        name="zaloMode"
                        value="webhook"
                        checked={zaloForm.mode === 'webhook'}
                        onChange={() => setZaloForm({ ...zaloForm, mode: 'webhook' })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>1. Zalo Webhook (Đơn giản nhất - Dùng Webhook Chatbot / Make / Pancake)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                      <input
                        type="radio"
                        name="zaloMode"
                        value="oa"
                        checked={zaloForm.mode === 'oa'}
                        onChange={() => setZaloForm({ ...zaloForm, mode: 'oa' })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>2. Zalo Official Account (Zalo OA Doanh Nghiệp)</span>
                    </label>
                  </div>
                </div>

                {/* Trường nhập Webhook */}
                {zaloForm.mode === 'webhook' ? (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Zalo Webhook URL: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={zaloForm.webhookUrl}
                      onChange={(e) => setZaloForm({ ...zaloForm, webhookUrl: e.target.value })}
                      placeholder="Ví dụ: https://hook.eu1.make.com/... hoặc https://botcake.io/webhook/..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-700 focus:outline-hidden focus:border-blue-500"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Dán link Webhook từ các nền tảng tự động hóa Zalo hoặc Chatbot Zalo mà bạn sử dụng.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Zalo OA Access Token: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={zaloForm.oaAccessToken}
                        onChange={(e) => setZaloForm({ ...zaloForm, oaAccessToken: e.target.value })}
                        placeholder="Nhập Access Token của Zalo Official Account..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-700 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Zalo User ID người nhận: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={zaloForm.oaUserId}
                        onChange={(e) => setZaloForm({ ...zaloForm, oaUserId: e.target.value })}
                        placeholder="User ID của Quản lý đã quan tâm Zalo OA..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-700 focus:outline-hidden focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Các sự kiện gửi thông báo */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-700 mb-1">Các sự kiện gửi tin nhắn Zalo:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
                      <input
                        type="checkbox"
                        checked={zaloForm.notifyAdvance}
                        onChange={(e) => setZaloForm({ ...zaloForm, notifyAdvance: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>💸 Yêu cầu Ứng Lương</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
                      <input
                        type="checkbox"
                        checked={zaloForm.notifyLeave}
                        onChange={(e) => setZaloForm({ ...zaloForm, notifyLeave: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>📅 Đơn Xin Nghỉ Làm</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
                      <input
                        type="checkbox"
                        checked={zaloForm.notifyAttendance}
                        onChange={(e) => setZaloForm({ ...zaloForm, notifyAttendance: e.target.checked })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>🕒 Chấm Công Ca Làm</span>
                    </label>
                  </div>
                </div>

                {/* Nút hành động Zalo */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingZalo}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold transition-all cursor-pointer shadow-md shadow-blue-600/20"
                  >
                    {savingZalo ? 'Đang lưu...' : 'Lưu Cài Đặt Zalo 💾'}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestZalo}
                    disabled={testingZalo || (zaloForm.mode === 'webhook' ? !zaloForm.webhookUrl : (!zaloForm.oaAccessToken || !zaloForm.oaUserId))}
                    className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageCircle className={`w-3.5 h-3.5 ${testingZalo ? 'animate-spin' : ''}`} />
                    <span>{testingZalo ? 'Đang gửi thử...' : 'Gửi Tin Nhắn Thử Nghiệm Zalo 📨'}</span>
                  </button>
                </div>

                {zaloMsg && (
                  <p className="text-emerald-600 font-bold mt-2">✅ {zaloMsg}</p>
                )}
                {zaloError && (
                  <p className="text-amber-800 font-bold mt-2">⚠️ {zaloError}</p>
                )}

                {/* Thông tin cần biết về Zalo */}
                <details className="mt-3 p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-slate-700">
                  <summary className="font-bold text-blue-900 cursor-pointer flex items-center gap-1.5">
                    <span>💡 Lưu ý về chính sách gửi tin nhắn Zalo tự động</span>
                  </summary>
                  <div className="mt-2.5 space-y-2 text-[11px] text-slate-600 leading-relaxed pl-2">
                    <p>• <strong>Tại sao Zalo cần Webhook hoặc OA:</strong> Zalo (VNG) không cung cấp API Bot cá nhân mở như Telegram mà yêu cầu liên kết qua <em>Zalo Official Account</em> hoặc <em>Webhook tự động hóa</em>.</p>
                    <p>• <strong>Cách cấu hình nhanh nhất:</strong> Nếu bạn chưa có Zalo OA, bạn có thể tạo 1 kịch bản miễn phí trên <em>Make.com</em> hoặc dịch vụ Chatbot Zalo (Pancake/Botcake) để lấy Webhook URL dán vào đây.</p>
                    <p>• <strong>Lựa chọn thay thế:</strong> Bạn cũng có thể chuyển sang tab <strong>Kênh Telegram</strong> bên cạnh để nhận tin nhắn hoàn toàn miễn phí chỉ sau 30 giây cài đặt.</p>
                  </div>
                </details>
              </form>
            )}

            {/* TAB 2: CẤU HÌNH TELEGRAM */}
            {notifyTab === 'telegram' && (
              <form onSubmit={handleSaveTelegramConfig} className="space-y-4 text-xs animate-in fade-in">
                <div className="flex items-center justify-between p-3.5 bg-sky-50/60 rounded-2xl border border-sky-200">
                  <div>
                    <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-600"></span>
                      <span>Bật tính năng gửi thông báo qua Telegram (Miễn phí 100%)</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Mỗi khi nhân viên bấm gửi đơn, tin nhắn sẽ báo ngay về điện thoại Quản lý tại Nghệ An</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={telegramForm.enabled}
                      onChange={(e) => setTelegramForm({ ...telegramForm, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Telegram Bot Token: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={telegramForm.botToken}
                      onChange={(e) => setTelegramForm({ ...telegramForm, botToken: e.target.value })}
                      placeholder="Ví dụ: 123456789:ABCdefGhIjkLmNoPqRsTuVwXyZ"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-700 focus:outline-hidden focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Telegram Chat ID (ID cá nhân hoặc ID Nhóm): <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={telegramForm.chatId}
                      onChange={(e) => setTelegramForm({ ...telegramForm, chatId: e.target.value })}
                      placeholder="Ví dụ: 987654321 hoặc -100123456789"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-700 focus:outline-hidden focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Các tùy chọn thông báo */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <p className="font-bold text-slate-700 mb-1">Các sự kiện gửi thông báo Telegram:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
                      <input
                        type="checkbox"
                        checked={telegramForm.notifyAdvance}
                        onChange={(e) => setTelegramForm({ ...telegramForm, notifyAdvance: e.target.checked })}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <span>💸 Yêu cầu Ứng Lương</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
                      <input
                        type="checkbox"
                        checked={telegramForm.notifyLeave}
                        onChange={(e) => setTelegramForm({ ...telegramForm, notifyLeave: e.target.checked })}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <span>📅 Đơn Xin Nghỉ Làm</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-semibold">
                      <input
                        type="checkbox"
                        checked={telegramForm.notifyAttendance}
                        onChange={(e) => setTelegramForm({ ...telegramForm, notifyAttendance: e.target.checked })}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      <span>🕒 Chấm Công Ca Làm</span>
                    </label>
                  </div>
                </div>

                {/* Nút hành động */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={savingTelegram}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold transition-all cursor-pointer shadow-md shadow-sky-600/20"
                  >
                    {savingTelegram ? 'Đang lưu...' : 'Lưu Cài Đặt Telegram 💾'}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={testingTelegram || !telegramForm.botToken || !telegramForm.chatId}
                    className="px-4 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className={`w-3.5 h-3.5 ${testingTelegram ? 'animate-spin' : ''}`} />
                    <span>{testingTelegram ? 'Đang gửi thử...' : 'Gửi Tin Nhắn Thử Nghiệm 📨'}</span>
                  </button>
                </div>

                {telegramMsg && (
                  <p className="text-emerald-600 font-bold mt-2">✅ {telegramMsg}</p>
                )}
                {telegramError && (
                  <p className="text-amber-800 font-bold mt-2">⚠️ {telegramError}</p>
                )}

                {/* Hướng dẫn 3 bước tạo bot */}
                <details className="mt-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-slate-700">
                  <summary className="font-bold text-amber-900 cursor-pointer flex items-center gap-1.5">
                    <span>📖 Hướng dẫn 2 phút tạo Bot và lấy Chat ID Telegram miễn phí</span>
                  </summary>
                  <div className="mt-2.5 space-y-2 text-[11px] text-slate-600 leading-relaxed pl-2">
                    <p><strong>Bước 1:</strong> Mở Telegram trên điện thoại, tìm bot <code>@BotFather</code> ➔ bấm <code>/start</code> ➔ gõ <code>/newbot</code> và làm theo hướng dẫn để đặt tên bot (ví dụ: <em>KyodoFoodBot</em>). BotFather sẽ gửi cho bạn một chuỗi <strong>Bot Token</strong> (dán vào ô Bot Token ở trên).</p>
                    <p><strong>Bước 2:</strong> Bấm vào đường link bot vừa tạo ➔ bấm <strong>START</strong> để kích hoạt trò chuyện với bot.</p>
                    <p><strong>Bước 3:</strong> Tìm bot <code>@userinfobot</code> trên Telegram và bấm <code>/start</code>. Bot sẽ hiển thị <strong>Id</strong> của bạn (ví dụ: <em>987654321</em>). Dán số Id này vào ô <strong>Chat ID</strong> ở trên.</p>
                    <p><strong>Bước 4:</strong> Bấm <strong>"Gửi Tin Nhắn Thử Nghiệm"</strong> để kiểm tra nhận tin nhắn ngay trên điện thoại!</p>
                  </div>
                </details>
              </form>
            )}
          </div>

          
          {/* Card: ĐẨY BẢN CẬP NHẬT MỚI LÊN GITHUB (DÀNH CHO CHỦ CỬA HÀNG) */}
          <div className="bg-linear-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-700">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <UploadCloud className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 whitespace-nowrap">
                    <span>Đẩy Bản Cập Nhật Mới Lên GitHub</span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5 whitespace-nowrap">
                    Đóng gói và đẩy phiên bản mới lên kho lưu trữ GitHub
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                main
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/90 border border-amber-500/30 mb-5 text-xs text-slate-300 leading-relaxed space-y-1.5">
              <p className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Quy trình cập nhật tự động (Auto-Deploy):</span>
              </p>
              <p>
                Mỗi khi bạn yêu cầu chỉnh sửa phần mềm qua Trợ lý AI Antigravity, hệ thống đã <strong>tự động đóng gói, chạy kiểm thử và đẩy thẳng lên GitHub</strong>. Máy chủ Cloud (Render) sẽ <strong>tự động nhận diện và cập nhật (Auto-Deploy)</strong> trong vòng 1-2 phút mà <strong>bạn không cần phải bấm nút gì cả</strong>!
              </p>
              <p className="text-slate-400 text-[11px]">
                ℹ️ <em>Nút "Đẩy Bản Cập Nhật Lên GitHub Ngay" bên dưới là tính năng dự phòng chỉ dùng khi bạn tự chỉnh sửa code offline trên máy mà không dùng AI.</em>
              </p>
            </div>

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
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-600 text-white text-xs font-semibold focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={pushingGit}
                className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 disabled:bg-slate-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
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
              <Upload className="w-5 h-5 text-amber-600" />
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
                    className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer"
                  />
                  <button
                    onClick={handleUploadLogo}
                    disabled={!logoFile || uploadingLogo}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    {uploadingLogo ? 'Đang tải...' : 'Lưu Logo'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Account & Security Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Tài Khoản & Bảo Mật Quản Trị Viên (Admin)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cài đặt tên đăng nhập, đổi mật khẩu và lưu Email / SĐT để khôi phục khi quên
                  </p>
                </div>
              </div>
            </div>

            {adminProfileError && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{adminProfileError}</span>
              </div>
            )}

            {adminProfileMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{adminProfileMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdminProfileSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Chủ Cửa Hàng / Quản Lý:
                  </label>
                  <input
                    type="text"
                    value={adminProfileForm.adminName}
                    onChange={(e) => setAdminProfileForm({ ...adminProfileForm, adminName: e.target.value })}
                    placeholder="Ví dụ: Chủ Cửa Hàng, Anh Hoàng..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên Đăng Nhập Quản Trị (Admin): <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={adminProfileForm.adminUsername}
                    onChange={(e) => setAdminProfileForm({ ...adminProfileForm, adminUsername: e.target.value })}
                    placeholder="admin hoặc tên bất kỳ..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold font-mono text-slate-900 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Khối thông tin khôi phục mật khẩu */}
              <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="font-extrabold text-amber-900 flex items-center gap-1.5 text-xs">
                  <Key className="w-4 h-4 text-amber-700" />
                  <span>Kênh Nhận Mật Khẩu Khôi Phục (Khi Quên Mật Khẩu):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Email Khôi Phục:
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        value={adminProfileForm.adminEmail}
                        onChange={(e) => setAdminProfileForm({ ...adminProfileForm, adminEmail: e.target.value })}
                        placeholder="Ví dụ: chucuahang@gmail.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 text-xs focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Số Điện Thoại Khôi Phục:
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        value={adminProfileForm.adminPhone}
                        onChange={(e) => setAdminProfileForm({ ...adminProfileForm, adminPhone: e.target.value })}
                        placeholder="Ví dụ: 0905123456"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 font-mono font-medium text-slate-900 text-xs focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-amber-800">
                  💡 Nếu bạn quên mật khẩu, hệ thống sẽ xác minh theo Email hoặc Số điện thoại này để cấp lại mật khẩu mới ngay lập tức.
                </p>
              </div>

              {/* Khối đổi mật khẩu */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Đổi Mật Khẩu Quản Trị (Bỏ trống nếu không muốn đổi):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="password"
                      value={adminProfileForm.currentPassword}
                      onChange={(e) => setAdminProfileForm({ ...adminProfileForm, currentPassword: e.target.value })}
                      placeholder="Mật khẩu hiện tại..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      value={adminProfileForm.newPassword}
                      onChange={(e) => setAdminProfileForm({ ...adminProfileForm, newPassword: e.target.value })}
                      placeholder="Mật khẩu mới (ít nhất 4 ký tự)..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={adminProfileLoading}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  {adminProfileLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Lưu Cài Đặt Quản Trị Viên</span>
                  )}
                </button>
              </div>
            </form>
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
                  <label className="block font-bold text-slate-700 mb-1">
                    Họ và Tên Đầy Đủ:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Thị Út..."
                    value={empForm.fullName || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEmpForm(prev => ({
                        ...prev,
                        fullName: val,
                        name: prev.shortName || val
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Biệt Danh / Tên Ngắn (Hiển thị trang NV & Bảng công):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Út (hoặc Bảo, Mai...)"
                    value={empForm.shortName || ''}
                    onChange={(e) => {
                      const sName = e.target.value;
                      const genUser = !editingEmployee && sName.trim()
                        ? sName.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^a-zA-Z0-9]/g, "").toUpperCase() + 'TNV'
                        : empForm.username;
                      setEmpForm(prev => ({
                        ...prev,
                        shortName: sName,
                        name: sName,
                        username: genUser
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-amber-50/60 border border-amber-200 font-bold text-amber-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên Đăng Nhập / Mã TK:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: UTNVTNV..."
                  value={empForm.username}
                  onChange={(e) => setEmpForm({ ...empForm, username: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-black font-mono uppercase text-amber-700"
                />
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
                  <label className="block font-bold text-slate-700 mb-1">Ngày Sinh (DD/MM/YYYY): {empForm.dob && <span className="text-amber-800 font-mono">({formatDateVN(empForm.dob)})</span>}</label>
                  <div className="relative cursor-pointer group">
                    <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 pointer-events-none z-10" />
                    <input
                      type="text"
                      readOnly
                      value={formatDateVN(empForm.dob) || 'DD/MM/YYYY'}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-black text-amber-900 text-xs shadow-2xs group-hover:border-amber-400 transition-colors pointer-events-none"
                      placeholder="DD/MM/YYYY"
                    />
                    <input
                      type="date"
                      value={empForm.dob}
                      onChange={(e) => setEmpForm({ ...empForm, dob: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                      title="Nhấn để chọn ngày sinh (DD/MM/YYYY)"
                    />
                  </div>
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

              {/* Cấu hình Tài khoản Ngân Hàng để tạo VietQR */}
              <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs uppercase tracking-wider">
                  <QrCode className="w-4 h-4 text-amber-600" />
                  <span>Tài Khoản Ngân Hàng Nhận Lương (Tạo Mã VietQR)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ngân Hàng:</label>
                    <select
                      value={empForm.bankCode}
                      onChange={(e) => {
                        const bank = VIETNAM_BANKS.find(b => b.code === e.target.value);
                        setEmpForm({
                          ...empForm,
                          bankCode: e.target.value,
                          bankName: bank?.shortName || e.target.value
                        });
                      }}
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 font-bold"
                    >
                      {VIETNAM_BANKS.map(b => (
                        <option key={b.code} value={b.code}>
                          {b.shortName} - {b.name.split('-')[1]?.trim() || b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Số Tài Khoản (STK):</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: 102008151234..."
                      value={empForm.bankAccount}
                      onChange={(e) => setEmpForm({ ...empForm, bankAccount: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 font-mono font-bold text-amber-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tên Chủ Tài Khoản (Không dấu):</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: NGUYEN THI UT"
                    value={empForm.accountName}
                    onChange={(e) => setEmpForm({ ...empForm, accountName: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-200 font-mono font-bold uppercase"
                  />
                </div>

                {/* Preview VietQR live */}
                {empForm.bankAccount && (
                  <div className="pt-2 border-t border-amber-200/60 flex items-center gap-3">
                    <img
                      src={getVietQRUrl({
                        bankCode: empForm.bankCode,
                        bankAccount: empForm.bankAccount,
                        accountName: empForm.accountName || empForm.name
                      })}
                      alt="VietQR Preview"
                      className="w-16 h-16 rounded-lg bg-white p-1 border border-amber-200 object-contain shadow-2xs"
                    />
                    <div className="text-[11px] text-slate-600">
                      <span className="font-bold text-amber-800 block">✓ Đã tạo thành công mã VietQR</span>
                      <span>Chủ cửa hàng có thể quét mã từ App ngân hàng để chuyển lương 1 chạm.</span>
                    </div>
                  </div>
                )}
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">Mật Khẩu Đăng Nhập:</label>
                    <span className="text-[10px] text-amber-800 font-bold bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                      1 MK duy nhất
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showFormPassword ? "text" : "password"}
                      required
                      placeholder="Nhập mật khẩu đăng nhập..."
                      value={empForm.password}
                      onChange={(e) => setEmpForm({ ...empForm, password: e.target.value })}
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold font-mono text-center text-amber-700 text-sm focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowFormPassword(!showFormPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title={showFormPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showFormPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Mật khẩu đăng nhập mới nhất của nhân viên (mặc định hoặc đã đổi riêng). Quản lý có thể chủ động nhập mật khẩu mới tại đây để cấp lại cho nhân viên khi quên.
                  </p>
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
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20 cursor-pointer"
                >
                  {editingEmployee ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: GHI NHẬN TẠM ỨNG LƯƠNG CHO NHÂN VIÊN (QUẢN LÝ) ================= */}
      {showManagerAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 stroke-[3]" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Ghi Nhận Tạm Ứng Lương</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManagerAdvanceModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Cơ sở Trưng Nữ Vương • Chu kỳ tính lương: <strong className="text-amber-800">{formatMonthVN(selectedMonth)}</strong>
            </p>

            <form onSubmit={handleManagerAdvanceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                  1. Chọn Nhân Viên Nhận Tạm Ứng:
                </label>
                <select
                  value={mgrAdvTargetEmp?.id || ''}
                  onChange={(e) => {
                    const found = employees.find(emp => emp.id === e.target.value);
                    if (found) setMgrAdvTargetEmp(found);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                >
                  {employees.filter(e => e.active !== false).map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.username || emp.code}) - {emp.gender || 'NV'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                  2. Ngày Ghi Nhận Tạm Ứng: <span className="text-amber-800 font-mono">({formatDateVN(mgrAdvDate)})</span>
                </label>
                <div className="relative cursor-pointer group">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600 pointer-events-none z-10" />
                  <input
                    type="text"
                    readOnly
                    value={formatDateVN(mgrAdvDate) || 'DD/MM/YYYY'}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-mono font-black text-amber-900 text-xs shadow-2xs group-hover:border-amber-400 transition-colors pointer-events-none"
                  />
                  <input
                    type="date"
                    required
                    value={mgrAdvDate}
                    onChange={(e) => setMgrAdvDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                    title="Nhấn để chọn ngày tạm ứng (DD/MM/YYYY)"
                  />
                </div>
                {mgrAdvDate && (
                  <div className={`mt-2 p-2.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${
                    getSalaryMonthForAdvance(mgrAdvDate) === selectedMonth 
                      ? 'bg-amber-50 border-amber-200 text-amber-900' 
                      : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}>
                    <span>💡 {getAdvanceCycleExplanation(mgrAdvDate)?.note}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                  3. Số Tiền Tạm Ứng (VNĐ):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="50000"
                    min="50000"
                    required
                    placeholder="Ví dụ: 500000"
                    value={mgrAdvAmount}
                    onChange={(e) => setMgrAdvAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 font-black font-mono text-amber-900 text-base focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-amber-700 text-xs">
                    VNĐ
                  </span>
                </div>

                {/* Chọn nhanh số tiền */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-bold self-center">Chọn nhanh:</span>
                  {[200000, 500000, 1000000, 2000000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMgrAdvAmount(String(val))}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 font-bold font-mono text-[11px] border border-slate-200 cursor-pointer"
                    >
                      {val >= 1000000 ? `${val / 1000000} Triệu` : `${val / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                  4. Lý Do / Ghi Chú:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ứng tiền mặt chi tiêu..."
                  value={mgrAdvReason}
                  onChange={(e) => setMgrAdvReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManagerAdvanceModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={mgrAdvLoading}
                  className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                >
                  {mgrAdvLoading ? "Đang lưu..." : "Xác Nhận Tạm Ứng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: CHỈNH SỬA KHOẢN TẠM ỨNG (DÀNH RIÊNG QUẢN LÝ) ================= */}
      {showEditAdvanceModal && editingAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-7 border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Edit className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Chỉnh Sửa Khoản Tạm Ứng</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditAdvanceModal(false);
                  setEditingAdvance(null);
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Nhân viên: <strong className="text-slate-900">{editingAdvance.employeeShortName || editingAdvance.employeeName}</strong> ({editingAdvance.employeeCode})
            </p>

            <form onSubmit={handleSaveEditAdvance} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                  1. Ngày Tạm Ứng: <span className="text-amber-800 font-mono">({formatDateVN(editAdvDate)})</span>
                </label>
                <div className="relative cursor-pointer group">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600 pointer-events-none z-10" />
                  <input
                    type="text"
                    readOnly
                    value={formatDateVN(editAdvDate) || 'DD/MM/YYYY'}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-mono font-black text-amber-900 text-xs shadow-2xs group-hover:border-amber-400 transition-colors pointer-events-none"
                  />
                  <input
                    type="date"
                    required
                    value={editAdvDate}
                    onChange={(e) => setEditAdvDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                    title="Nhấn để chọn ngày tạm ứng (DD/MM/YYYY)"
                  />
                </div>
                {editAdvDate && (
                  <div className={`mt-2 p-2.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${
                    getSalaryMonthForAdvance(editAdvDate) === selectedMonth 
                      ? 'bg-amber-50 border-amber-200 text-amber-900' 
                      : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}>
                    <span>💡 {getAdvanceCycleExplanation(editAdvDate)?.note}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                  2. Số Tiền Tạm Ứng (VNĐ):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="50000"
                    min="50000"
                    required
                    placeholder="Ví dụ: 500000"
                    value={editAdvAmount}
                    onChange={(e) => setEditAdvAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 font-black font-mono text-amber-900 text-base focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-bold text-amber-700 text-xs">
                    VNĐ
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] text-slate-400 font-bold self-center">Chọn nhanh:</span>
                  {[200000, 500000, 1000000, 2000000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEditAdvAmount(String(val))}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 font-bold font-mono text-[11px] border border-slate-200 cursor-pointer"
                    >
                      {val >= 1000000 ? `${val / 1000000} Triệu` : `${val / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                  3. Lý Do / Ghi Chú:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ứng tiền mặt chi tiêu..."
                  value={editAdvReason}
                  onChange={(e) => setEditAdvReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditAdvanceModal(false);
                    setEditingAdvance(null);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={editAdvLoading}
                  className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                >
                  {editAdvLoading ? "Đang lưu..." : "Lưu Thay Đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: XEM MÃ VIETQR THANH TOÁN LƯƠNG (GLOBAL) ================= */}
      {showQrModal && qrModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6 border border-slate-100 text-center animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 leading-tight">
                    Thanh Toán Lương (VietQR)
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Kyodo Food • Cơ Sở Trưng Nữ Vương, Đà Nẵng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR Image Box */}
            <div className="p-3 bg-linear-to-b from-amber-50/70 to-yellow-50/30 rounded-2xl border border-amber-200/80 mb-3.5 inline-block w-full max-w-[280px]">
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-800 mb-1 flex items-center justify-center gap-1">
                <QrCode className="w-3.5 h-3.5 text-amber-600" />
                <span>Napas 247 • Quét Bằng App Ngân Hàng</span>
              </div>
              <img
                src={getVietQRUrl({
                  bankCode: qrModalData.bankCode,
                  bankAccount: qrModalData.bankAccount,
                  amount: qrModalData.amount,
                  accountName: qrModalData.accountName,
                  memo: qrModalData.memo || 'KyodoFoods DN Thanh Toan Tien Luong. Cam On Em'
                })}
                alt="Mã QR VietQR Thanh Toán Lương"
                className="w-56 h-56 mx-auto rounded-xl object-contain shadow-xs bg-white p-2 border border-amber-100"
              />
              <p className="text-[10px] text-slate-400 mt-1 italic">
                Tự động điền đúng Số Tiền & Nội Dung Chuyển Khoản
              </p>
            </div>

            {/* Khối Nội Dung Chuyển Khoản theo yêu cầu của user */}
            <div className="mb-3.5 p-3 rounded-2xl bg-amber-500/10 border-2 border-dashed border-amber-400 text-left">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wide flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Nội dung chuyển khoản (Đã gắn vào QR):
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(qrModalData.memo || 'KyodoFoods DN Thanh Toan Tien Luong. Cam On Em', 'memo')}
                  className="text-[11px] font-black text-amber-800 hover:text-amber-950 bg-white px-2.5 py-1 rounded-lg border border-amber-200 shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                >
                  {copiedField === 'memo' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-amber-200/80 font-mono font-bold text-xs text-amber-950 select-all break-all">
                {qrModalData.memo || 'KyodoFoods DN Thanh Toan Tien Luong. Cam On Em'}
              </div>
            </div>

            {/* Chi tiết người thụ hưởng & số tiền */}
            <div className="text-xs space-y-2 text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-left mb-4">
              <div className="flex items-center justify-between border-b border-slate-200/50 pb-1.5">
                <span className="text-slate-500 font-medium">Nhân viên thụ hưởng:</span>
                <strong className="text-slate-900 font-bold">{qrModalData.employeeName}</strong>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/50 pb-1.5">
                <span className="text-slate-500 font-medium">Ngân hàng:</span>
                <span className="font-bold text-slate-800">{qrModalData.bankName || qrModalData.bankCode}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/50 pb-1.5">
                <span className="text-slate-500 font-medium">Số tài khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-black text-amber-800 text-sm">{qrModalData.bankAccount}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(qrModalData.bankAccount, 'account')}
                    className="p-1 rounded-md hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                    title="Sao chép số tài khoản"
                  >
                    {copiedField === 'account' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-slate-200/50 pb-1.5">
                <span className="text-slate-500 font-medium">Chủ tài khoản:</span>
                <strong className="uppercase text-[11px] font-black text-slate-800">{qrModalData.accountName}</strong>
              </div>
              {qrModalData.amount > 0 && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-600 font-extrabold text-xs">Số tiền thanh toán:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base sm:text-lg font-black text-emerald-700 font-mono">
                      {Number(qrModalData.amount).toLocaleString('vi-VN')} VNĐ
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(String(qrModalData.amount), 'amount')}
                      className="p-1 rounded-md hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                      title="Sao chép số tiền"
                    >
                      {copiedField === 'amount' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
                  setShowQrModal(false);
                }}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Đã Chuyển Khoản</span>
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}