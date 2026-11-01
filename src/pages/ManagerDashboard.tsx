// src/pages/ManagerDashboard.tsx
// Manager Dashboard - Complete Implementation

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, Calendar, FileSpreadsheet, Settings, 
  Clock, Plus, Edit, Trash2, Download, Printer, 
  Upload, CheckCircle, ShieldCheck, DollarSign, 
  MapPin, Key, UserPlus, Check, RefreshCw, GitBranch, ArrowUpCircle,
  UploadCloud, GitCommit, Terminal, ExternalLink, CheckCircle2,
  Bell, Copy, CalendarDays, Phone, Home, CreditCard, Sparkles,
  QrCode, Eye, EyeOff, X, Mail, Edit3, Trash, PlusCircle, 
  FileText, AlertCircle, Shield, LogOut, Search, Filter,
  ChevronDown, ChevronUp, MoreHorizontal, MoreVertical
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/shared/api';
import { VIETNAM_BANKS, getVietQRUrl } from '@/shared/api';
import { 
  formatDateVN, 
  formatMonthVN, 
  formatShortTime, 
  getSalaryMonthForAdvance, 
  getAdvanceCycleRange, 
  getAdvanceCycleExplanation,
  calculateMonthlySalary,
  formatVND,
  getVietnamTodayYMD,
  getVietnamCurrentYM
} from '@/shared/business-rules';
import { 
  Card, Button, Input, SelectComponent as Select, Modal, Badge, Avatar, Table, Toast, StatusBadge
} from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks';

interface ManagerDashboardProps {
  settings: any;
  onSettingsChange: () => void;
  shifts: any[];
}

export default function ManagerDashboard({ settings, onSettingsChange, shifts }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('timesheet'); // 'timesheet' | 'employees' | 'advances-leaves' | 'settings'
  const [selectedMonth, setSelectedMonth] = useState(getVietnamCurrentYM());
  
  // Data states
  const [report, setReport] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [allAdvances, setAllAdvances] = useState<any[]>([]);
  const [allLeaves, setAllLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tableDensity, setTableDensity] = useState('compact');

  // Modals & Forms
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrModalData, setQrModalData] = useState<any>(null);

  // Password visibility
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [showFormPassword, setShowFormPassword] = useState(false);

  // Inline hourly rate editing
  const [editingRates, setEditingRates] = useState<Record<string, string>>({});
  const [savingRateId, setSavingRateId] = useState<string | null>(null);
  const [rateSuccessId, setRateSuccessId] = useState<string | null>(null);

  // Manager Advance Modal
  const [showManagerAdvanceModal, setShowManagerAdvanceModal] = useState(false);
  const [mgrAdvTargetEmp, setMgrAdvTargetEmp] = useState<any>(null);
  const [mgrAdvDate, setMgrAdvDate] = useState('');
  const [mgrAdvAmount, setMgrAdvAmount] = useState('');
  const [mgrAdvReason, setMgrAdvReason] = useState('Chủ cửa hàng tạm ứng lương');
  const [mgrAdvLoading, setMgrAdvLoading] = useState(false);

  // Edit Advance Modal
  const [showEditAdvanceModal, setShowEditAdvanceModal] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<any>(null);
  const [editAdvDate, setEditAdvDate] = useState('');
  const [editAdvAmount, setEditAdvAmount] = useState('');
  const [editAdvReason, setEditAdvReason] = useState('');
  const [editAdvLoading, setEditAdvLoading] = useState(false);

  // Employee Form
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

  // Logo upload
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // GitHub Auto Update
  const [githubRepoUrl, setGithubRepoUrl] = useState(settings?.githubRepo || 'https://github.com/MrSand1981/kyodo-food-attendance');
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updatingApp, setUpdatingApp] = useState(false);

  // GitHub Push
  const [gitStatus, setGitStatus] = useState<any>(null);
  const [gitCommitMsg, setGitCommitMsg] = useState('Cập nhật tính năng Kyodo Food');
  const [pushingGit, setPushingGit] = useState(false);
  const [gitResult, setGitResult] = useState<any>(null);
  const [checkingGit, setCheckingGit] = useState(false);

  const { toast } = useToast();

  // Load data
  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.reports.getMasterReport(selectedMonth);
      setReport(res.report);
    } catch (err) {
      setError(err.message || 'Không thể tải bảng chấm công tổng hợp');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await api.employees.getAll(true);
      setEmployees(res.employees || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadAdvancesAndLeaves = useCallback(async () => {
    try {
      const [advRes, leaveRes] = await Promise.all([
        api.advances.getAll('', selectedMonth),
        api.leaves.getAll('', selectedMonth)
      ]);
      setAllAdvances(advRes.records || []);
      setAllLeaves(leaveRes || []);
    } catch (err) {
      console.error("Lỗi tải tạm ứng và nghỉ phép:", err);
    }
  }, [selectedMonth]);

  useEffect(() => {
    loadReport();
    loadEmployees();
    loadAdvancesAndLeaves();
  }, [selectedMonth, loadReport, loadEmployees, loadAdvancesAndLeaves]);

  // Employee CRUD
  const handleSaveEmployee = async (e: React.FormEvent) => {
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
        await api.employees.update(editingEmployee.id, payload);
        setMessage(`Đã cập nhật thông tin tài khoản "${empForm.username}" thành công!`);
      } else {
        await api.employees.create(payload);
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

  const handleQuickUpdateHourlyRate = async (emp: any, customRate?: string) => {
    const rawVal = customRate !== undefined ? customRate : editingRates[emp.id];
    const rateNum = Number(rawVal);
    if (isNaN(rateNum) || rateNum < 0) {
      toast.error("Lỗi", "Vui lòng nhập mức lương theo giờ hợp lệ (số lớn hơn hoặc bằng 0)!");
      return;
    }
    try {
      setSavingRateId(emp.id);
      await api.employees.update(emp.id, { hourlyRate: rateNum });
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, hourlyRate: rateNum } : e));
      await loadReport();
      setRateSuccessId(emp.id);
      setTimeout(() => setRateSuccessId(null), 3000);
      toast.success("Thành công", `✓ Đã cập nhật mức lương giờ của ${emp.shortName || emp.name}: ${rateNum.toLocaleString('vi-VN')} đ/h! Bảng công đã tự động tính lại.`);
    } catch (err) {
      setError(err.message || "Lỗi khi cập nhật mức lương");
    } finally {
      setSavingRateId(null);
    }
  };

  const handleDeleteEmployee = async (id: string, name: string, username: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn ngưng hoạt động tài khoản "${username}" (${name})?`)) return;
    try {
      await api.employees.delete(id);
      setMessage(`Đã ngưng hoạt động tài khoản ${username}`);
      await loadEmployees();
      await loadReport();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAdvanceByManager = async (id: string, name: string, amount: number) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bản ghi tạm ứng ${Number(amount).toLocaleString('vi-VN')} đ của nhân viên ${name}?`)) return;
    try {
      await api.advances.delete(id);
      setMessage(`Đã xóa bản ghi tạm ứng của ${name}`);
      await loadAdvancesAndLeaves();
      await loadReport();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditAdvanceModal = (adv: any, emp: any) => {
    setEditingAdvance(adv);
    setEditAdvDate(adv.date || '');
    setEditAdvAmount(String(adv.amount || ''));
    setEditAdvReason(adv.reason || '');
    setShowEditAdvanceModal(true);
  };

  const handleSaveEditAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdvance) return;
    const num = Number(editAdvAmount);
    if (isNaN(num) || num <= 0) {
      toast.error("Lỗi", "Vui lòng nhập số tiền tạm ứng hợp lệ lớn hơn 0!");
      return;
    }
    try {
      setEditAdvLoading(true);
      await api.advances.update(editingAdvance.id, {
        amount: num,
        date: editAdvDate,
        reason: editAdvReason.trim()
      });
      toast.success("Thành công", "🎉 Đã cập nhật khoản tạm ứng lương thành công!");
      setShowEditAdvanceModal(false);
      setEditingAdvance(null);
      await Promise.all([loadAdvancesAndLeaves(), loadReport()]);
    } catch (err) {
      setError(err.message || 'Lỗi khi cập nhật khoản tạm ứng');
    } finally {
      setEditAdvLoading(false);
    }
  };

  const openManagerAdvanceModal = (emp: any) => {
    setMgrAdvTargetEmp(emp);
    const todayStr = getVietnamTodayYMD();
    const currentSalaryMonth = getSalaryMonthForAdvance(todayStr);
    setMgrAdvDate(selectedMonth === currentSalaryMonth ? todayStr : `${selectedMonth}-06`);
    setMgrAdvAmount('');
    setMgrAdvReason('Chủ cửa hàng tạm ứng lương');
    setShowManagerAdvanceModal(true);
  };

  const handleManagerAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mgrAdvTargetEmp) return;
    const num = Number(mgrAdvAmount);
    if (isNaN(num) || num <= 0) {
      toast.error("Lỗi", "Vui lòng nhập số tiền tạm ứng lớn hơn 0!");
      return;
    }
    try {
      setMgrAdvLoading(true);
      await api.advances.create({
        employeeId: mgrAdvTargetEmp.id,
        date: mgrAdvDate,
        amount: num,
        reason: mgrAdvReason.trim() || 'Chủ cửa hàng tạm ứng lương'
      });
      setMessage(`🎉 Đã ghi nhận tạm ứng ${num.toLocaleString('vi-VN')} đ cho nhân viên ${mgrAdvTargetEmp.name}!`);
      toast.success("Thành công", `Đã ghi nhận tạm ứng cho ${mgrAdvTargetEmp.name}`);
      setShowManagerAdvanceModal(false);
      await loadAdvancesAndLeaves();
      await loadReport();
    } catch (err) {
      setError(err.message || "Lỗi khi ghi nhận tạm ứng");
    } finally {
      setMgrAdvLoading(false);
    }
  };

  const handleDeleteLeaveByManager = async (id: string, name: string, date: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa đơn xin nghỉ ngày ${date} của nhân viên ${name}?`)) return;
    try {
      await api.leaves.delete(id);
      setMessage(`Đã xóa đơn xin nghỉ của ${name}`);
      await loadAdvancesAndLeaves();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    try {
      setUploadingLogo(true);
      await api.system.uploadLogo(logoFile);
      setMessage('Cập nhật logo Kyodo Food thành công!');
      if (onSettingsChange) onSettingsChange();
    } catch (err) {
      setError(err.message || 'Lỗi khi tải logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCheckUpdate = async () => {
    try {
      setCheckingUpdate(true);
      setError('');
      if (githubRepoUrl !== settings?.githubRepo) {
        await api.system.updateSettings({ githubRepo: githubRepoUrl.trim() });
        if (onSettingsChange) onSettingsChange();
      }
      const res = await api.system.checkUpdate();
      setUpdateInfo(res);
      if (res.hasUpdate) {
        toast.success("Cập nhật", `Đã phát hiện bản cập nhật mới (v${res.latestVersion}) trên GitHub!`);
      } else {
        toast.info("Thông báo", res.message || 'Phần mềm đang ở phiên bản mới nhất.');
      }
    } catch (err) {
      setError(err.message || 'Không thể kiểm tra cập nhật từ GitHub');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleApplyUpdate = async () => {
    if (!window.confirm('Hệ thống sẽ tải bản cập nhật mới nhất từ GitHub và ghi đè mã nguồn. Dữ liệu chấm công hiện tại của cửa hàng sẽ được sao lưu và bảo toàn nguyên vẹn 100%. Bạn có muốn tiếp tục?')) {
      return;
    }
    try {
      setUpdatingApp(true);
      setError('');
      const res = await api.system.applyUpdate();
      toast.success("Thành công", '🎉 ' + res.message);
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Lỗi khi cập nhật phần mềm');
    } finally {
      setUpdatingApp(false);
    }
  };

  const loadGitStatus = async () => {
    try {
      setCheckingGit(true);
      const res = await api.system.getGitStatus();
      setGitStatus(res);
    } catch (err) {
      console.error('Lỗi kiểm tra git status:', err);
    } finally {
      setCheckingGit(false);
    }
  };

  const handlePushToGitHub = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!window.confirm('Hệ thống sẽ tự động đóng gói (build) giao diện mới nhất và đẩy toàn bộ mã nguồn lên GitHub. Sau đó máy tính ở Đà Nẵng chỉ cần nhấn "Cập Nhật" là nhận được ngay. Bạn có muốn tiếp tục?')) {
      return;
    }
    try {
      setPushingGit(true);
      setGitResult(null);
      setError('');
      setMessage('');
      const res = await api.system.pushToGitHub(gitCommitMsg);
      setGitResult(res);
      if (res.success) {
        setMessage(`🎉 ${res.message}`);
        toast.success("Thành công", res.message);
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
      loadAdminProfile();
    }
  }, [activeTab]);

  // Admin Profile
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
      const res = await api.employees.getAdminProfileStatus();
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

  const handleSaveAdminProfileSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAdminProfileLoading(true);
      setAdminProfileError('');
      setAdminProfileMsg('');
      const res = await api.employees.updateAdminProfile(adminProfileForm);
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

  const openEditEmployee = (emp: any) => {
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

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
      <ToastContainer />
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 mb-3 border-b border-slate-200 gap-3 no-print">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Cổng Quản Trị Cửa Hàng</span>
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Cơ sở duy nhất: Trưng Nữ Vương</span>
            </Badge>
            <Badge variant="primary" className="text-xs">Bản v1.5.6</Badge>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 whitespace-nowrap">
            Bảng Chấm Công & Quản Trị Nhân Sự
          </h2>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto shrink-0">
          <Button
            onClick={() => setActiveTab('timesheet')}
            variant={activeTab === 'timesheet' ? 'primary' : 'ghost'}
            size="sm"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Bảng Công & Lương</span>
          </Button>
          <Button
            onClick={() => setActiveTab('employees')}
            variant={activeTab === 'employees' ? 'primary' : 'ghost'}
            size="sm"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Hồ Sơ Nhân Sự ({employees.length})</span>
          </Button>
          <Button
            onClick={() => setActiveTab('advances-leaves')}
            variant={activeTab === 'advances-leaves' ? 'primary' : 'ghost'}
            size="sm"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            <DollarSign className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="whitespace-nowrap">Tạm Ứng & Đăng Ký Nghỉ ({allAdvances.length + allLeaves.length})</span>
          </Button>
          <Button
            onClick={() => setActiveTab('settings')}
            variant={activeTab === 'settings' ? 'primary' : 'ghost'}
            size="sm"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Cài Đặt Cửa Hàng</span>
          </Button>
        </div>
      </div>

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
          <Card className="mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 no-print p-5">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 whitespace-nowrap">Chọn Tháng Chấm Công:</label>
                  <SelectComponent
                    value={selectedMonth}
                    onValueChange={setSelectedMonth}
                    className="px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    options={[
                      { value: '2026-11', label: 'Tháng 11/2026 (Bắt đầu sử dụng)' },
                      { value: '2026-12', label: 'Tháng 12/2026' },
                      { value: '2027-01', label: 'Tháng 01/2027' },
                      { value: '2026-10', label: 'Tháng 10/2026' },
                      { value: '2026-09', label: 'Tháng 09/2026' },
                      { value: '2026-08', label: 'Tháng 08/2026' }
                    ]}
                  />
                </div>
                <div className="pt-5 text-xs text-slate-500 font-bold whitespace-nowrap">
                  Cơ sở: <strong>Trưng Nữ Vương</strong>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <a
                  href={api.reports.getExportExcelUrl(selectedMonth)}
                  download={`Bang_Cham_Cong_Kyodo_Trung_Nu_Vuong_${selectedMonth}.xlsx`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Xuất File Excel (.xlsx)</span>
                </a>

                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => window.print()}
                  iconLeft={<Printer className="w-4 h-4 text-slate-600 shrink-0" />}
                >
                  <span className="whitespace-nowrap">In Báo Cáo</span>
                </Button>
              </div>
            </div>
          </Card>

          {/* Store Monthly Metrics */}
          {report && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
              <Card>
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Nhân Sự</span>
                <div className="text-xl font-black text-slate-900 font-mono mt-1">{report.summary.totalEmployees} <span className="text-xs font-semibold text-slate-500">nhân viên</span></div>
              </Card>
              <Card variant="hover" className="bg-amber-50/70 border-amber-200/80">
                <span className="text-[11px] font-bold text-amber-800 uppercase block">Tổng Giờ Làm</span>
                <div className="text-xl font-black text-amber-700 font-mono mt-1">{report.summary.storeTotalHours} <span className="text-xs font-semibold text-amber-600">giờ</span></div>
              </Card>
              <Card>
                <span className="text-[11px] font-bold text-slate-600 uppercase block">Lương Ca Làm</span>
                <div className="text-xl font-black text-slate-800 font-mono mt-1">{Number(report.summary.storeTotalSalary).toLocaleString()} <span className="text-xs font-semibold text-slate-500">đ</span></div>
              </Card>
              <Card variant="hover" className="bg-amber-50/70 border-amber-200">
                <span className="text-[11px] font-bold text-amber-800 uppercase block">Tổng Tạm Ứng</span>
                <div className="text-xl font-black text-amber-700 font-mono mt-1">{Number(report.summary.storeTotalAdvance).toLocaleString()} <span className="text-xs font-semibold text-amber-600">đ</span></div>
              </Card>
              <Card variant="hover" className="bg-emerald-50/70 border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block">Thực Chi (Net)</span>
                <div className="text-xl font-black text-emerald-700 font-mono mt-1">{Number(report.summary.storeTotalNetSalary ?? report.summary.storeTotalSalary).toLocaleString()} <span className="text-xs font-semibold text-emerald-600">đ</span></div>
              </Card>
            </div>
          )}

          {/* Employee Cards */}
          {report && (
            <Card className="bg-gradient-to-br from-amber-500/10 via-white to-amber-500/10 border-amber-200/80">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-5 border-b border-amber-200/60 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5" />
                      Bảng Tổng Hợp Ca & Thông Báo Lương
                    </span>
                    <span className="text-xs font-bold text-slate-700">Áp dụng: <strong>{formatMonthVN(selectedMonth)}</strong> • Cơ sở Trưng Nữ Vương</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-1">Tổng Hợp Ca & Quyết Toán Tiền Lương Từng Nhân Viên</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold bg-white/90 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span>Ca chuẩn:</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold border border-amber-200">Sáng: 8h-17h (9h)</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold border border-amber-200">Chiều: 17h-22h (5h)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {report.rows.map((row: any) => {
                  const isUt = row.employee.name === 'Út' || row.employee.code === 'UTNVTNV';
                  const accentBg = isUt ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50 border-slate-200';
                  const avatarSrc = row.employee.avatar || (row.employee.gender === 'Nữ' ? '/avatar-female.svg' : '/avatar-male.svg');

                  const copyNotifyText = () => {
                    let advDetailsText = '- Không có tạm ứng trong chu kỳ này';
                    if (row.advances && row.advances.length > 0) {
                      advDetailsText = row.advances.map((a: any, idx: number) => 
                        `  • Đợt ${row.advances.length - idx} (${formatDateVN(a.date)}): ${Number(a.amount).toLocaleString('vi-VN')} VNĐ (${a.reason || 'Ứng lương'})`
                      ).join('\n');
                    }
                    const text = `📢 Kyodo Food Trưng Nữ Vương thông báo kết quả công & lương ${formatMonthVN(selectedMonth)} cho nhân viên ${row.employee.shortName || row.employee.name} (${row.employee.code || row.employee.username}):
- Ca Sáng (8h-17h • 9 tiếng): ${row.morningShifts || 0} ca
- Ca Chiều (17h-22h • 5 tiếng): ${row.eveningShifts || 0} ca
- Tổng số ca hoàn thành: ${row.totalShifts || 0} ca (${row.daysWorked || 0} ngày)
- Tổng số giờ làm việc: ${row.totalHours} giờ
- Mức lương: ${Number(row.hourlyRate).toLocaleString()} VNĐ/h
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
                    toast.success("Đã sao chép", `Đã sao chép tin nhắn thông báo lương cho ${row.employee.name}!`);
                  };

                  return (
                    <Card key={row.employee.id} className={`rounded-3xl p-5 sm:p-6 border ${accentBg} shadow-sm flex flex-col justify-between bg-white`}>
                      <div>
                        <div className="flex items-center justify-between mb-3.5">
                          <div className="flex items-center gap-3">
                            <img src={avatarSrc} alt={row.employee.name} className="w-13 h-13 rounded-2xl object-cover ring-2 ring-slate-200 bg-slate-50 shadow-xs" />
                            <div>
                              <div className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                                <span>{row.employee.name}</span>
                                <Badge variant="neutral" className="text-xs">{row.employee.code || row.employee.username}</Badge>
                              </div>
                              <span className="text-[11px] text-slate-500 font-semibold">Cơ sở Trưng Nữ Vương • {row.employee.gender || "Nam"}</span>
                            </div>
                            <div className="text-right">
                              <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Lương / Giờ (đ/h):</label>
                              <div className="inline-flex items-center gap-1.5 bg-emerald-50/90 px-2.5 py-1 rounded-2xl border border-emerald-300 shadow-2xs">
                                <Input
                                  type="number"
                                  step="1000"
                                  min="0"
                                  value={editingRates[row.employee.id] !== undefined ? editingRates[row.employee.id] : (row.hourlyRate ?? 25000)}
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
                                  onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                                  className="w-22 px-2 py-0.5 bg-white rounded-xl border border-emerald-300 font-mono font-black text-emerald-800 text-xs sm:text-sm text-right focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                                  placeholder="25000"
                                  title="Nhập mức lương giờ và nhấn Enter hoặc bấm ra ngoài để lưu"
                                />
                                <span className="text-[11px] font-black font-mono text-emerald-700">đ/h</span>
                                {savingRateId === row.employee.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin shrink-0" />
                                ) : rateSuccessId === row.employee.id ? (
                                  <span className="text-[9px] font-black text-emerald-800 bg-emerald-200 px-1 py-0.5 rounded-md shrink-0 animate-in fade-in">✓ Lưu</span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2.5 border-y border-slate-100 my-2.5 text-center text-xs">
                            <div className="bg-amber-50/60 rounded-xl p-2 border border-amber-200/80">
                              <span className="text-[10px] text-amber-800 font-bold block uppercase whitespace-nowrap">Ca Sáng (8-17h)</span>
                              <strong className="text-base font-mono font-black text-amber-900 whitespace-nowrap">{row.morningShifts || 0} <span className="text-xs font-normal">ca</span></strong>
                            </div>
                            <div className="bg-amber-50/50 rounded-xl p-2 border border-amber-100">
                              <span className="text-[10px] text-amber-700 font-bold block uppercase whitespace-nowrap">Ca Chiều (17-22h)</span>
                              <strong className="text-base font-mono font-black text-amber-800 whitespace-nowrap">{row.eveningShifts || 0} <span className="text-xs font-normal">ca</span></strong>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-2 border border-slate-200">
                              <span className="text-[10px] text-slate-500 font-bold block uppercase whitespace-nowrap">Số Ngày Đi Làm</span>
                              <strong className="text-base font-mono font-black text-slate-800 whitespace-nowrap">{row.daysWorked || 0} <span className="text-xs font-normal">ngày</span></strong>
                            </div>
                            <div className="bg-blue-50/60 rounded-xl p-2 border border-blue-100">
                              <span className="text-[10px] text-blue-700 font-bold block uppercase whitespace-nowrap">Số Ngày Nghỉ</span>
                              <strong className="text-base font-mono font-black text-blue-800 whitespace-nowrap">{row.leaveDaysCount || 0} <span className="text-xs font-normal">ngày</span></strong>
                            </div>
                          </div>

                          <div className="mt-4 space-y-3">
                            {/* 1. Lương ca làm */}
                            <Card variant="bordered" className="bg-slate-50 border-slate-200 p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">1</span>
                                  <div>
                                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide whitespace-nowrap block">Số Tiền Lương Đã Làm Trong Tháng:</span>
                                    <p className="text-[11px] text-slate-500 whitespace-nowrap">{row.totalHours} giờ × {Number(row.hourlyRate).toLocaleString()} đ/h ({row.totalShifts || 0} ca)</p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-lg font-black font-mono text-slate-900 whitespace-nowrap">{Number(row.totalSalary).toLocaleString()}</span>
                                  <span className="text-xs font-bold text-slate-500 ml-1 whitespace-nowrap">VNĐ</span>
                                </div>
                              </div>
                            </Card>

                            {/* 2. Tạm ứng */}
                            <Card variant="bordered" className="bg-amber-50/70 border-amber-200 p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
                                  <div>
                                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wide whitespace-nowrap block">Tổng Số Tiền Lương Đã Tạm Ứng:</span>
                                    <p className="text-[11px] text-amber-700 font-medium whitespace-nowrap"><strong>{row.advanceCount || 0} lần ứng lương</strong> trong tháng</p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-lg font-black font-mono text-amber-800 whitespace-nowrap">{Number(row.advanceTotal || 0).toLocaleString()}</span>
                                  <span className="text-xs font-bold text-amber-700 ml-1 whitespace-nowrap">VNĐ</span>
                                </div>
                              </div>

                              <div className="mt-2.5 pt-2.5 border-t border-amber-200/60">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-[11px] font-bold text-amber-800 uppercase">Chi tiết các đợt ứng ({row.advanceCount || 0} đợt):</span>
                                  <Button type="button" size="sm" onClick={() => openManagerAdvanceModal(row.employee)} iconLeft={<Plus className="w-3 h-3" />}>+ Ghi Nhận Ứng Lương</Button>
                                </div>

                                {row.advances && row.advances.length > 0 ? (
                                  <div className="space-y-1.5 mt-2">
                                    {row.advances.map((adv: any, idx: number) => (
                                      <div key={adv.id || idx} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-amber-200/70 text-xs">
                                        <div className="flex items-center gap-2">
                                          <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] font-mono whitespace-nowrap">Đợt {row.advances.length - idx}</span>
                                          <span className="font-bold text-slate-800 whitespace-nowrap">{formatDateVN(adv.date)}</span>
                                          <span className="text-slate-500 text-[11px] italic truncate max-w-44">({adv.reason || 'Ứng lương'})</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-mono font-black text-amber-800 whitespace-nowrap">-{Number(adv.amount).toLocaleString('vi-VN')} đ</span>
                                          <Button type="button" variant="ghost" size="sm" onClick={() => openEditAdvanceModal(adv, row.employee)} iconLeft={<Edit className="w-3 h-3" />} className="text-slate-400 hover:text-amber-600 p-1 rounded-md hover:bg-amber-50" title="Chỉnh sửa số tiền hoặc ngày ứng" />
                                          <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteAdvanceByManager(adv.id, row.employee.name, adv.amount)} iconLeft={<Trash2 className="w-3 h-3" />} className="text-slate-400 hover:text-amber-800 p-1 rounded-md hover:bg-amber-100" title="Xóa đợt ứng này" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-amber-700/80 italic bg-white/70 p-2 rounded-xl text-center mt-1">Nhân viên {row.employee.name} chưa có đợt tạm ứng lương nào trong tháng.</p>
                                )}
                              </div>
                            </Card>

                            {/* 3. Thực lĩnh */}
                            <Card className="p-4 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 rounded-lg bg-white text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">3</span>
                                  <div>
                                    <span className="text-xs font-black uppercase tracking-wide block whitespace-nowrap">Lương Thực Lĩnh (Sau Trừ Tạm Ứng):</span>
                                    <p className="text-[11px] text-emerald-100 whitespace-nowrap">Lương ca ({Number(row.totalSalary).toLocaleString()} đ) - Tạm ứng ({Number(row.advanceTotal || 0).toLocaleString()} đ)</p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-2xl font-black font-mono text-white whitespace-nowrap">{Number(row.netSalary ?? row.totalSalary).toLocaleString()}</span>
                                  <span className="text-xs font-bold text-emerald-100 ml-1 whitespace-nowrap">VNĐ</span>
                                </div>
                              </div>

                              {row.employee?.bankAccount && (
                                <Button type="button" size="md" onClick={() => {
                                  const transferAmount = Math.max(0, row.netSalary ?? (row.totalSalary - (row.advanceTotal || 0)));
                                  setQrModalData({
                                    bankCode: row.employee.bankCode,
                                    bankName: row.employee.bankName,
                                    bankAccount: row.employee.bankAccount,
                                    accountName: row.employee.accountName || row.employee.name,
                                    amount: transferAmount,
                                    memo: `Kyodo Luong T${selectedMonth.split('-')[1]} ${row.employee.name}`,
                                    employeeName: row.employee.name
                                  });
                                  setShowQrModal(true);
                                }} className="mt-3 w-full py-2.5 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/30 shadow-inner whitespace-nowrap" title="Tạo mã VietQR quét bằng App ngân hàng chuyển khoản đúng số tiền thực lĩnh">
                                  <QrCode className="w-4 h-4 shrink-0" />
                                  <span className="whitespace-nowrap">📲 Quét QR Chuyển Khoản Lương Ngay</span>
                                </Button>
                              )}
                            </Card>
                          </div>

                          {/* Copy notify */}
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between no-print">
                            <span className="text-[11px] text-slate-500 italic whitespace-nowrap">Thực lĩnh = Lương ca - Đã ứng</span>
                            <Button type="button" onClick={copyNotifyText} size="sm" variant="outline" iconLeft={<Copy className="w-3.5 h-3.5" />}>Sao chép tin nhắn Zalo</Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* ================= TAB 2: NHÂN SƠ ================= */}
      {activeTab === 'employees' && (
        <div>
          <Card className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-200 gap-3 no-print">
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setEditingEmployee(null);
                    setEmpForm({
                      username: '', fullName: '', shortName: '', name: '', gender: 'Nữ',
                      dob: '', cccd: '', phone: '', address: '',
                      bankCode: 'VCB', bankName: 'Vietcombank', bankAccount: '',
                      accountName: '', role: 'Nhân viên', hourlyRate: 25000, password: '1234'
                    });
                    setShowAddEmployeeModal(true);
                  }}
                  iconLeft={<Plus className="w-4 h-4" />}
                >
                  + Thêm Nhân Viên Mới
                </Button>
                <span className="text-xs text-slate-500 font-bold whitespace-nowrap pt-2">Tổng: <strong>{employees.length}</strong> nhân viên</span>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {employees.map(emp => (
              <Card key={emp.id} variant="hover" className="bg-white" padding="md">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar
                    src={emp.avatar || (emp.gender === 'Nữ' ? '/avatar-female.svg' : '/avatar-male.svg')}
                    alt={emp.shortName || emp.name}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{emp.shortName || emp.name}</h3>
                    <div className="text-xs text-amber-700 font-bold font-mono truncate">TK: {emp.username || emp.code}</div>
                    <div className="text-[10px] text-slate-500 truncate">{emp.gender || 'Nam'} • {emp.role || 'Nhân viên'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 p-2 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Lương/h:</span>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50/90 px-2.5 py-1 rounded-2xl border border-emerald-300 shadow-2xs w-full sm:w-auto">
                    <Input
                      type="number"
                      step="1000"
                      min="0"
                      value={editingRates[emp.id] !== undefined ? editingRates[emp.id] : (emp.hourlyRate ?? 25000)}
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
                      onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                      className="w-22 px-2 py-0.5 bg-white rounded-xl border border-emerald-300 font-mono font-black text-emerald-800 text-xs sm:text-sm text-right focus:outline-hidden focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                      placeholder="25000"
                      title="Nhập mức lương giờ và nhấn Enter hoặc bấm ra ngoài để lưu"
                    />
                    <span className="text-[11px] font-black font-mono text-emerald-700">đ/h</span>
                    {savingRateId === emp.id ? <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin shrink-0" /> : rateSuccessId === emp.id ? <span className="text-[9px] font-black text-emerald-800 bg-emerald-200 px-1 py-0.5 rounded-md shrink-0 animate-in fade-in">✓ Lưu</span> : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Badge variant={emp.active !== false ? 'success' : 'neutral'} size="sm" dot>{emp.active !== false ? 'Đang làm' : 'Đã nghỉ'}</Badge>
                  <div className="flex-1"></div>
                  <Button variant="ghost" size="sm" onClick={() => openEditEmployee(emp)} iconLeft={<Edit className="w-3.5 h-3.5" />} title="Chỉnh sửa">Sửa</Button>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteEmployee(emp.id, emp.name, emp.username)} iconLeft={<Trash className="w-3.5 h-3.5" />} title="Ngưng hoạt động">Xóa</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: TẠM ỨNG & ĐĂNG KÝ NGHỈ ================= */}
      {activeTab === 'advances-leaves' && (
        <div className="space-y-6">
          {/* Month Selector */}
          <Card className="mb-6 no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1 whitespace-nowrap">Chọn Tháng:</label>
              <SelectComponent
                value={selectedMonth}
                onValueChange={setSelectedMonth}
                options={[
                  { value: '2026-11', label: 'Tháng 11/2026' },
                  { value: '2026-12', label: 'Tháng 12/2026' },
                  { value: '2027-01', label: 'Tháng 01/2027' },
                  { value: '2026-10', label: 'Tháng 10/2026' }
                ]}
                className="w-auto sm:w-48"
              />
            </div>
          </Card>

          {/* Advances Table */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-200 gap-3 no-print">
              <h3 className="text-lg font-black text-slate-900">Danh Sách Tạm Ứng Lương</h3>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const todayStr = getVietnamTodayYMD();
                  const currentSalaryMonth = getSalaryMonthForAdvance(todayStr);
                  setMgrAdvDate(selectedMonth === currentSalaryMonth ? todayStr : `${selectedMonth}-06`);
                  setShowManagerAdvanceModal(true);
                }}
                iconLeft={<Plus className="w-4 h-4" />}
              >
                + Ghi Nhận Tạm Ứng
              </Button>
            </div>

            {allAdvances.length > 0 ? (
              <Table
                columns={[
                  { key: 'stt', header: 'STT', width: '50px', align: 'center', render: (_, i) => i + 1 },
                  { key: 'employeeName', header: 'Nhân Viên', width: '150px', align: 'left' },
                  { key: 'date', header: 'Ngày Ứng', width: '100px', align: 'center', render: (r) => formatDateVN(r.date) },
                  { key: 'salaryMonth', header: 'Tháng Lương', width: '100px', align: 'center' },
                  { key: 'amount', header: 'Số Tiền', align: 'right', render: (r) => formatVND(r.amount) },
                  { key: 'reason', header: 'Lý Do', align: 'left' },
                  { key: 'actions', header: '', align: 'center', width: '100px', render: (r) => (
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => {
                        const emp = employees.find(e => e.id === r.employeeId);
                        openEditAdvanceModal(r, emp);
                      }} iconLeft={<Edit className="w-3.5 h-3.5" />} title="Chỉnh sửa" />
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteAdvanceByManager(r.id, r.employeeName, r.amount)} iconLeft={<Trash2 className="w-3.5 h-3.5" />} title="Xóa" />
                    </div>
                  )}
                ]}
                data={allAdvances}
                keyExtractor={(a) => a.id}
                striped
                hoverable
                compact
              />
            ) : (
              <div className="py-8 text-center text-slate-500">Chưa có bản ghi tạm ứng nào trong tháng này.</div>
            )}
          </Card>

          {/* Leaves Table */}
          <Card className="mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-200 gap-3 no-print">
              <h3 className="text-lg font-black text-slate-900">Danh Sách Đăng Ký Nghỉ Phép</h3>
            </div>

            {allLeaves.length > 0 ? (
              <Table
                columns={[
                  { key: 'stt', header: 'STT', width: '50px', align: 'center', render: (_, i) => i + 1 },
                  { key: 'employeeName', header: 'Nhân Viên', width: '150px', align: 'left' },
                  { key: 'date', header: 'Từ Ngày', width: '100px', align: 'center', render: (r) => formatDateVN(r.date) },
                  { key: 'endDate', header: 'Đến Ngày', width: '100px', align: 'center', render: (r) => formatDateVN(r.endDate) },
                  { key: 'shift', header: 'Ca', width: '80px', align: 'center' },
                  { key: 'reason', header: 'Lý Do', align: 'left' },
                  { key: 'actions', header: '', align: 'center', width: '80px', render: (r) => (
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteLeaveByManager(r.id, r.employeeName, formatDateVN(r.date))} iconLeft={<Trash2 className="w-3.5 h-3.5" />} title="Xóa" />
                  )}
                ]}
                data={allLeaves}
                keyExtractor={(l) => l.id}
                striped
                hoverable
                compact
              />
            ) : (
              <div className="py-8 text-center text-slate-500">Chưa có đơn xin nghỉ nào trong tháng này.</div>
            )}
          </Card>
        </div>
      )}

      {/* ================= TAB 4: CÀI ĐẶT ================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Logo & Branding */}
          <Card className="mb-6">
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-amber-600" /> Logo & Thương Hiệu</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-xl bg-white border-2 border-slate-200 overflow-hidden flex-shrink-0">
                {settings?.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">Chưa có logo</div>
                )}
              </div>
              <div className="flex-1">
                <Input type="file" label="Tải lên Logo mới" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} fullWidth />
                <Button variant="primary" size="md" onClick={handleUploadLogo} disabled={uploadingLogo || !logoFile} iconLeft={<Upload className="w-4 h-4" />}>
                  {uploadingLogo ? 'Đang tải...' : 'Cập nhật Logo'}
                </Button>
              </div>
            </div>
          </Card>

          {/* GitHub Auto Update */}
          <Card className="mb-6">
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2"><GitBranch className="w-5 h-5 text-amber-600" /> Cập Nhật Tự Động Từ GitHub</h3>
            
            <div className="mb-4">
              <label className="label">GitHub Repository URL:</label>
              <Input
                value={githubRepoUrl}
                onChange={(e) => setGithubRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                fullWidth
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <Button variant={updateInfo?.hasUpdate ? 'primary' : 'outline'} size="md" onClick={() => handleCheckUpdate(false)} disabled={checkingUpdate || updatingApp} fullWidth iconLeft={updateInfo?.hasUpdate ? <Sparkles className="w-4 h-4" /> : <RefreshCw className={`w-4 h-4 ${checkingUpdate ? 'animate-spin' : ''}`} />}>
                {checkingUpdate ? 'Đang kiểm tra...' : (updateInfo?.hasUpdate ? `Cập Nhật (v${updateInfo.latestVersion})` : 'Kiểm Tra Cập Nhật')}
              </Button>
              <Button variant="primary" size="md" onClick={handleApplyUpdate} disabled={updatingApp || !updateInfo?.hasUpdate} fullWidth iconLeft={<ArrowUpCircle className="w-4 h-4" />}>
                {updatingApp ? 'Đang cập nhật...' : 'Áp Dụng Cập Nhật'}
              </Button>
            </div>

            {updateInfo && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 space-y-1">
                <p><strong>Phiên bản hiện tại:</strong> {updateInfo.currentVersion}</p>
                <p><strong>Phiên bản mới nhất:</strong> {updateInfo.latestVersion}</p>
                <p><strong>Nhánh:</strong> {updateInfo.branch}</p>
                <p><strong>Repo:</strong> {updateInfo.repo}</p>
                {updateInfo.error && <p className="text-amber-600"><strong>Lỗi:</strong> {updateInfo.message}</p>}
              </div>
            )}
          </Card>

          {/* GitHub Push */}
          <Card className="mb-6">
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2"><ArrowUpCircle className="w-5 h-5 text-emerald-600" /> Đẩy Bản Cập Nhật Lên GitHub (Tại Nghệ An)</h3>
            
            <div className="space-y-3">
              <Input label="Commit Message" value={gitCommitMsg} onChange={(e) => setGitCommitMsg(e.target.value)} placeholder="Ví dụ: Cập nhật tính năng chấm công v1.5.0" fullWidth />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button variant="outline" size="md" onClick={loadGitStatus} disabled={checkingGit || pushingGit} fullWidth iconLeft={<RefreshCw className={`w-4 h-4 ${checkingGit ? 'animate-spin' : ''}`} />}>
                  {checkingGit ? 'Đang kiểm tra...' : 'Kiểm Tra Trạng Thái Git'}
                </Button>
                <Button variant="primary" size="md" onClick={handlePushToGitHub} disabled={pushingGit} fullWidth iconLeft={<ArrowUpCircle className="w-4 h-4" />}>
                  {pushingGit ? 'Đang đẩy...' : 'Đẩy Lên GitHub'}
                </Button>
              </div>

              {gitStatus && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 space-y-1">
                  <p><strong>Nhánh:</strong> {gitStatus.branch}</p>
                  <p><strong>Remote:</strong> {gitStatus.remoteUrl}</p>
                  <p><strong>File thay đổi:</strong> {gitStatus.modifiedFiles}</p>
                  <p><strong>Commit chưa push:</strong> {gitStatus.unpushedCount}</p>
                </div>
              )}

              {gitResult && (
                <div className={`p-3 rounded-xl ${gitResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                  <p className="font-bold">{gitResult.success ? '✅ Thành công' : '❌ Thất bại'}: {gitResult.message}</p>
                  {gitResult.commitHash && <p><strong>Commit:</strong> {gitResult.commitHash}</p>}
                  {gitResult.version && <p><strong>Version:</strong> {gitResult.version}</p>}
                  {gitResult.logs && <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap">{gitResult.logs}</pre>}
                </div>
              )}
            </div>
          </Card>

          {/* Admin Profile */}
          <Card className="mb-6">
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-amber-600" /> Thiết Lập Tài Khoản Admin</h3>
            
            <form onSubmit={handleSaveAdminProfileSettings} className="space-y-4 text-xs">
              {adminProfileError && <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-600 shrink-0" /><span>{adminProfileError}</span></div>}
              {adminProfileMsg && <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /><span>{adminProfileMsg}</span></div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="Tên Chủ Cửa Hàng / Quản Lý" value={adminProfileForm.adminName} onChange={(e) => setAdminProfileForm({...adminProfileForm, adminName: e.target.value})} placeholder="Ví dụ: Chủ Cửa Hàng, Anh Hoàng..." fullWidth />
                <Input label="Tên Tài Khoản Đăng Nhập" value={adminProfileForm.adminUsername} onChange={(e) => setAdminProfileForm({...adminProfileForm, adminUsername: e.target.value})} required placeholder="admin hoặc tên bất kỳ..." fullWidth />
                <Input type="email" label="Email Khôi Phục" value={adminProfileForm.adminEmail} onChange={(e) => setAdminProfileForm({...adminProfileForm, adminEmail: e.target.value})} placeholder="chucuahang@gmail.com" fullWidth />
                <Input type="tel" label="Số Điện Thoại Khôi Phục" value={adminProfileForm.adminPhone} onChange={(e) => setAdminProfileForm({...adminProfileForm, adminPhone: e.target.value})} placeholder="0905123456" fullWidth />
              </div>

              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="font-extrabold text-amber-900 flex items-center gap-1.5 text-xs"><KeyRound className="w-3.5 h-3.5 text-amber-700" /><span>Đổi Mật Khẩu Quản Trị Mới (Không Bắt Buộc):</span></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input type="password" label="Mật Khẩu Hiện Tại" value={adminProfileForm.currentPassword} onChange={(e) => setAdminProfileForm({...adminProfileForm, currentPassword: e.target.value})} placeholder="Mật khẩu hiện tại (để xác nhận)..." fullWidth />
                  <Input type="password" label="Mật Khẩu Mới" value={adminProfileForm.newPassword} onChange={(e) => setAdminProfileForm({...adminProfileForm, newPassword: e.target.value})} placeholder="Mật khẩu mới (nếu muốn đổi)..." fullWidth />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" size="md" onClick={loadAdminProfile}>Tải Lại</Button>
                <Button type="submit" disabled={adminProfileLoading} size="md">
                  {adminProfileLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Lưu Thông Tin Quản Trị'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* QR Modal */}
      {showQrModal && qrModalData && (
        <Modal
          open={showQrModal}
          onOpenChange={setShowQrModal}
          title="Mã VietQR Chuyển Khoản Lương"
          description="Quét bằng App ngân hàng để chuyển khoản đúng số tiền thực lĩnh"
          size="md"
        >
          <div className="text-center space-y-4">
            <img
              src={getVietQRUrl({
                bankCode: qrModalData.bankCode,
                bankAccount: qrModalData.bankAccount,
                amount: qrModalData.amount,
                accountName: qrModalData.accountName,
                memo: qrModalData.memo
              })}
              alt="VietQR"
              className="w-64 h-64 mx-auto rounded-xl border border-slate-200 bg-white p-2"
            />
            <div className="text-xs text-slate-600 space-y-1">
              <p><strong>{qrModalData.bankCode}</strong> - {qrModalData.bankAccount}</p>
              <p>{qrModalData.accountName}</p>
              <p className="text-amber-700 font-bold">Số tiền: {formatVND(qrModalData.amount)} đ</p>
              <p className="text-slate-500">ND: {qrModalData.memo}</p>
              <p className="text-slate-500">Cho: {qrModalData.employeeName}</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="secondary" size="md" onClick={() => {
                navigator.clipboard.writeText(qrModalData.bankAccount);
                toast.success("Đã sao chép", "Đã sao chép số tài khoản!");
              }} iconLeft={<Copy className="w-4 h-4" />}>
                Sao Chép Số TK
              </Button>
              <Button variant="primary" size="md" onClick={() => setShowQrModal(false)} iconLeft={<X className="w-4 h-4" />}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Employee Modals */}
      {showAddEmployeeModal && (
        <Modal open={showAddEmployeeModal} onOpenChange={setShowAddEmployeeModal} title={editingEmployee ? 'Chỉnh Sửa Nhân Viên' : 'Thêm Nhân Viên Mới'} size="lg">
          <form onSubmit={handleSaveEmployee} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Tên Đăng Nhập (TK)" value={empForm.username} onChange={(e) => setEmpForm({...empForm, username: e.target.value.toUpperCase()})} required placeholder="UTNVTNV, BAONVTNV..." fullWidth />
              <Input label="Họ Và Tên Đầy Đủ" value={empForm.fullName} onChange={(e) => setEmpForm({...empForm, fullName: e.target.value})} required fullWidth />
              <Input label="Biệt Danh (Tên Ngắn)" value={empForm.shortName} onChange={(e) => setEmpForm({...empForm, shortName: e.target.value})} required fullWidth />
              <SelectComponent label="Giới Tính" value={empForm.gender} onValueChange={(v) => setEmpForm({...empForm, gender: v})} options={[{value:'Nữ',label:'Nữ'},{value:'Nam',label:'Nam'}]} required fullWidth />
              <Input type="date" label="Ngày Sinh" value={empForm.dob} onChange={(e) => setEmpForm({...empForm, dob: e.target.value})} fullWidth />
              <Input label="CCCD" value={empForm.cccd} onChange={(e) => setEmpForm({...empForm, cccd: e.target.value})} fullWidth />
              <Input type="tel" label="Số Điện Thoại" value={empForm.phone} onChange={(e) => setEmpForm({...empForm, phone: e.target.value})} fullWidth />
              <Input label="Địa Chỉ" value={empForm.address} onChange={(e) => setEmpForm({...empForm, address: e.target.value})} fullWidth />
              <SelectComponent label="Ngân Hàng" value={empForm.bankCode} onValueChange={(v) => {
                const bank = VIETNAM_BANKS.find(b => b.code === v);
                setEmpForm({...empForm, bankCode: v, bankName: bank?.shortName || ''});
              }} options={VIETNAM_BANKS.map(b => ({value: b.code, label: b.shortName}))} fullWidth />
              <Input label="Số Tài Khoản" value={empForm.bankAccount} onChange={(e) => setEmpForm({...empForm, bankAccount: e.target.value})} fullWidth />
              <Input label="Tên Chủ TK" value={empForm.accountName} onChange={(e) => setEmpForm({...empForm, accountName: e.target.value})} fullWidth />
              <Input type="number" label="Lương/Giờ (VNĐ)" value={empForm.hourlyRate} onChange={(e) => setEmpForm({...empForm, hourlyRate: Number(e.target.value) || 0})} required min="0" fullWidth />
              <Input type="password" label="Mật Khẩu Khởi Tạo" value={empForm.password} onChange={(e) => setEmpForm({...empForm, password: e.target.value})} placeholder="Mặc định: 1234" fullWidth />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="md" onClick={() => { setShowAddEmployeeModal(false); setEditingEmployee(null); }}>Hủy</Button>
              <Button type="submit" disabled={loading} size="md">
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (editingEmployee ? 'Cập Nhật' : 'Tạo Tài Khoản')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Advance Modal */}
      {showEditAdvanceModal && (
        <Modal open={showEditAdvanceModal} onOpenChange={setShowEditAdvanceModal} title="Chỉnh Sửa Tạm Ứng" size="md">
          <form onSubmit={handleSaveEditAdvance} className="space-y-4 text-xs">
            <Input type="date" label="Ngày Ứng" value={editAdvDate} onChange={(e) => setEditAdvDate(e.target.value)} required fullWidth />
            <Input type="number" label="Số Tiền (VNĐ)" value={editAdvAmount} onChange={(e) => setEditAdvAmount(e.target.value)} required min="1000" fullWidth />
            <Input label="Lý Do" value={editAdvReason} onChange={(e) => setEditAdvReason(e.target.value)} fullWidth />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="md" onClick={() => setShowEditAdvanceModal(false)}>Hủy</Button>
              <Button type="submit" disabled={editAdvLoading} size="md">{editAdvLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Lưu Thay Đổi'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Manager Advance Modal */}
      {showManagerAdvanceModal && (
        <Modal open={showManagerAdvanceModal} onOpenChange={setShowManagerAdvanceModal} title="Chủ Cửa Hàng Ghi Nhận Tạm Ứng" size="md">
          <form onSubmit={handleManagerAdvanceSubmit} className="space-y-4 text-xs">
            <div>
              <label className="label">Nhân Viên</label>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <Avatar src={mgrAdvTargetEmp?.avatar || (mgrAdvTargetEmp?.gender === 'Nữ' ? '/avatar-female.svg' : '/avatar-male.svg')} alt={mgrAdvTargetEmp?.name} size="md" />
                <div>
                  <div className="font-bold text-slate-900">{mgrAdvTargetEmp?.name}</div>
                  <div className="text-xs text-slate-500">TK: {mgrAdvTargetEmp?.username}</div>
                </div>
              </div>
            </div>
            <Input type="date" label="Ngày Ứng" value={mgrAdvDate} onChange={(e) => setMgrAdvDate(e.target.value)} required fullWidth />
            <Input type="number" label="Số Tiền (VNĐ)" value={mgrAdvAmount} onChange={(e) => setMgrAdvAmount(e.target.value)} required min="1000" placeholder="Nhập số tiền" fullWidth />
            <Input label="Lý Do" value={mgrAdvReason} onChange={(e) => setMgrAdvReason(e.target.value)} placeholder="Ví dụ: Ăn trưa, Mua xe..." fullWidth />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="md" onClick={() => setShowManagerAdvanceModal(false)}>Hủy</Button>
              <Button type="submit" disabled={mgrAdvLoading} size="md">{mgrAdvLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Ghi Nhận Ứng Lương'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Advance Modal */}
      {showEditAdvanceModal && (
        <Modal open={showEditAdvanceModal} onOpenChange={setShowEditAdvanceModal} title="Chỉnh Sửa Tạm Ứng" size="md">
          <form onSubmit={handleSaveEditAdvance} className="space-y-4 text-xs">
            <Input type="date" label="Ngày Ứng" value={editAdvDate} onChange={(e) => setEditAdvDate(e.target.value)} required fullWidth />
            <Input type="number" label="Số Tiền (VNĐ)" value={editAdvAmount} onChange={(e) => setEditAdvAmount(e.target.value)} required min="1000" fullWidth />
            <Input label="Lý Do" value={editAdvReason} onChange={(e) => setEditAdvReason(e.target.value)} fullWidth />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="md" onClick={() => setShowEditAdvanceModal(false)}>Hủy</Button>
              <Button type="submit" disabled={editAdvLoading} size="md">{editAdvLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Lưu Thay Đổi'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Profile Modal */}
      {showEditProfileModal && (
        <Modal open={showEditProfileModal} onOpenChange={setShowEditProfileModal} title="Kiểm Tra & Chỉnh Sửa Thông Tin Cá Nhân" size="lg">
          <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
            {profileError && <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-600 shrink-0" /><span>{profileError}</span></div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Họ và tên đầy đủ" value={profileForm.fullName} onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})} required fullWidth />
              <Input label="Biệt danh (Tên ngắn)" value={profileForm.shortName} onChange={(e) => setProfileForm({...profileForm, shortName: e.target.value})} required fullWidth />
              <SelectComponent label="Giới tính" value={profileForm.gender} onValueChange={(v) => setProfileForm({...profileForm, gender: v})} options={[{value:'Nữ',label:'Nữ'},{value:'Nam',label:'Nam'}]} required fullWidth />
              <Input type="date" label="Ngày sinh" value={profileForm.dob} onChange={(e) => setProfileForm({...profileForm, dob: e.target.value})} fullWidth />
              <Input label="CCCD" value={profileForm.cccd} onChange={(e) => setProfileForm({...profileForm, cccd: e.target.value})} fullWidth />
              <Input type="tel" label="Số điện thoại" value={profileForm.phone} onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})} fullWidth />
              <Input label="Địa chỉ" value={profileForm.address} onChange={(e) => setProfileForm({...profileForm, address: e.target.value})} fullWidth />
              <SelectComponent label="Ngân hàng" value={profileForm.bankCode} onValueChange={(v) => {
                const bank = VIETNAM_BANKS.find(b => b.code === v);
                setProfileForm({...profileForm, bankCode: v, bankName: bank?.shortName || ''});
              }} options={VIETNAM_BANKS.map(b => ({value: b.code, label: b.shortName}))} fullWidth />
              <Input label="Số tài khoản" value={profileForm.bankAccount} onChange={(e) => setProfileForm({...profileForm, bankAccount: e.target.value})} fullWidth />
              <Input label="Tên chủ tài khoản" value={profileForm.accountName} onChange={(e) => setProfileForm({...profileForm, accountName: e.target.value})} fullWidth />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="md" onClick={() => setShowEditProfileModal(false)}>Hủy</Button>
              <Button type="submit" disabled={profileLoading} size="md">{profileLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Lưu Thông Tin'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Avatar Modal */}
      {showAvatarModal && (
        <Modal open={showAvatarModal} onOpenChange={setShowAvatarModal} title="Đổi Ảnh Đại Diện" size="md">
          <div className="space-y-4">
            <div className="flex justify-center">
              <Avatar src={currentAvatar} alt={displayName} size="xl" />
            </div>
            <div className="border-t border-slate-200 pt-4">
              <label className="block text-center cursor-pointer">
                <input type="file" accept="image/*" onChange={handleAvatarFile} className="sr-only" />
                <Button variant="secondary" size="lg" fullWidth iconLeft={<Camera className="w-4 h-4" />}>Chọn Ảnh Từ Máy Tính</Button>
              </label>
              <p className="text-center text-xs text-slate-500">Hoặc kéo thả ảnh vào đây. Tối đa 2MB, định dạng JPG/PNG/WebP.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="md" onClick={() => setShowAvatarModal(false)} fullWidth>Hủy</Button>
              <Button variant="primary" size="md" disabled={avatarLoading} fullWidth>{avatarLoading ? 'Đang lưu...' : 'Lưu Ảnh'}</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <Modal open={showPasswordModal} onOpenChange={setShowPasswordModal} title="Đổi Mật Khẩu Cá Nhân" size="md">
          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            {pwdError && <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-600 shrink-0" /><span>{pwdError}</span></div>}
            {pwdMsg && <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /><span>{pwdMsg}</span></div>}

            <Input type="password" label="Mật khẩu hiện tại" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required placeholder="Nhập mật khẩu hiện tại..." fullWidth />
            <Input type="password" label="Mật khẩu mới" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={4} placeholder="Ít nhất 4 ký tự..." fullWidth />
            <Input type="password" label="Xác nhận mật khẩu mới" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Nhập lại mật khẩu mới..." fullWidth />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="md" onClick={() => setShowPasswordModal(false)}>Hủy</Button>
              <Button type="submit" disabled={pwdLoading} size="md">{pwdLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Lưu Mật Khẩu Mới'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Advance Modal */}
      {showAdvanceModal && (
        <Modal open={showAdvanceModal} onOpenChange={setShowAdvanceModal} title="Ghi Nhận Ứng Lương" size="md">
          <form onSubmit={handleSalaryAdvanceSubmit} className="space-y-4 text-xs">
            <Input type="date" label="Ngày Ứng" value={advDate} onChange={(e) => setAdvDate(e.target.value)} required fullWidth />
            <Input type="number" label="Số Tiền (VNĐ)" value={advAmount} onChange={(e) => setAdvAmount(e.target.value)} required placeholder="Nhập số tiền" fullWidth />
            <Input label="Lý Do" value={advReason} onChange={(e) => setAdvReason(e.target.value)} placeholder="Ví dụ: Ăn trưa, Mua xe..." fullWidth />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="md" onClick={() => setShowAdvanceModal(false)}>Hủy</Button>
              <Button type="submit" disabled={advLoading} size="md">{advLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Lưu Ứng Lương'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Leave Modal */}
      {showLeaveModal && (
        <Modal open={showLeaveModal} onOpenChange={setShowLeaveModal} title="Đăng Ký Nghỉ Làm" size="md">
          <form onSubmit={handleLeaveSubmit} className="space-y-4 text-xs">
            <Input type="date" label="Ngày Nghỉ" value={leaveDate} onChange={(e) => setLeaveDate(e.target.value)} required fullWidth />
            <Input type="date" label="Đến Ngày (nếu nghỉ nhiều ngày)" value={leaveEndDate} onChange={(e) => setLeaveEndDate(e.target.value)} fullWidth />
            <SelectComponent label="Ca Nghỉ" value={leaveShift} onValueChange={setLeaveShift} options={[{value:'Cả Ngày',label:'Cả Ngày'},{value:'Ca Sáng',label:'Ca Sáng'},{value:'Ca Chiều',label:'Ca Chiều'}]} fullWidth />
            <Input label="Lý Do" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Có việc cá nhân..." fullWidth />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="md" onClick={() => setShowLeaveModal(false)}>Hủy</Button>
              <Button type="submit" disabled={leaveLoading} size="md">{leaveLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Gửi Đơn Xin Nghỉ'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Personal QR Modal */}
      {showPersonalQrModal && localEmp.bankAccount && (
        <Modal open={showPersonalQrModal} onOpenChange={setShowPersonalQrModal} title="Mã VietQR Của Bạn" size="md">
          <div className="text-center space-y-4">
            <img src={getVietQRUrl({ bankCode: localEmp.bankCode, bankAccount: localEmp.bankAccount, accountName: localEmp.accountName || displayName })} alt="VietQR" className="w-64 h-64 mx-auto rounded-xl border border-slate-200 bg-white p-2" />
            <div className="text-xs text-slate-600"><p><strong>{localEmp.bankCode}</strong> - {localEmp.bankAccount}</p><p>{localEmp.accountName || displayName}</p></div>
            <Button variant="primary" size="md" onClick={() => { navigator.clipboard.writeText(localEmp.bankAccount); toast.success("Đã sao chép", "Đã sao chép số tài khoản!"); }} iconLeft={<Copy className="w-4 h-4" />}>Sao Chép Số TK</Button>
          </div>
        </Modal>
      )}

      {/* QR Modal for Salary Transfer */}
      {showQrModal && qrModalData && (
        <Modal open={showQrModal} onOpenChange={setShowQrModal} title="Mã VietQR Chuyển Khoản Lương" description="Quét bằng App ngân hàng để chuyển khoản đúng số tiền thực lĩnh" size="md">
          <div className="text-center space-y-4">
            <img src={getVietQRUrl({ bankCode: qrModalData.bankCode, bankAccount: qrModalData.bankAccount, amount: qrModalData.amount, accountName: qrModalData.accountName, memo: qrModalData.memo })} alt="VietQR" className="w-64 h-64 mx-auto rounded-xl border border-slate-200 bg-white p-2" />
            <div className="text-xs text-slate-600 space-y-1">
              <p><strong>{qrModalData.bankCode}</strong> - {qrModalData.bankAccount}</p>
              <p>{qrModalData.accountName}</p>
              <p className="text-amber-700 font-bold">Số tiền: {formatVND(qrModalData.amount)} đ</p>
              <p className="text-slate-500">ND: {qrModalData.memo}</p>
              <p className="text-slate-500">Cho: {qrModalData.employeeName}</p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="secondary" size="md" onClick={() => { navigator.clipboard.writeText(qrModalData.bankAccount); toast.success("Đã sao chép", "Đã sao chép số tài khoản!"); }} iconLeft={<Copy className="w-4 h-4" />}>Sao Chép Số TK</Button>
              <Button variant="primary" size="md" onClick={() => setShowQrModal(false)} iconLeft={<X className="w-4 h-4" />}>Đóng</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Footer */}
      <footer className="py-4 border-t border-slate-200 text-center text-xs text-slate-500 no-print">
        <p>© 2026 <strong>Kyodo Food</strong> • Cơ sở Trưng Nữ Vương, Đà Nẵng</p>
      </footer>
    </div>
  );
}