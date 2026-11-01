// src/pages/StaffAttendance.tsx
// Staff Attendance Page - Core Features
// Daily entry, Active shift, Shift history, Overlap detection

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, Calendar, Award, CheckCircle2, 
  AlertCircle, PlusCircle, FileText, ChevronDown, 
  Check, LogOut, Send, MapPin,
  Lock, KeyRound, ShieldCheck, X, Camera, DollarSign,
  CalendarDays, Trash2, HeartHandshake, QrCode, UserCheck, Edit3,
  RefreshCw, Bell, AlertTriangle
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
  checkShiftOverlap,
  calculateHours,
  getShiftNameFromTime,
  getVietnamTodayYMD,
  getVietnamCurrentYM
} from '@/shared/business-rules';
import { 
  Card, Button, Input, SelectComponent as Select, Modal, Badge, Avatar, Table, Toast, StatusBadge
} from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks';

interface StaffAttendanceProps {
  employee: any;
  onUpdateEmployee: (updated: any) => void;
  onLogout: () => void;
  settings: any;
  shifts: any[];
}

export default function StaffAttendance({ 
  employee, 
  onUpdateEmployee,
  onLogout, 
  settings, 
  shifts = [] 
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser, logout: authLogout } = useAuth();
  
  const [localEmp, setLocalEmp] = useState(employee);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const todayYM = getVietnamCurrentYM();
  const [selectedMonth, setSelectedMonth] = useState(todayYM);
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Modal states
  const [showPersonalQrModal, setShowPersonalQrModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    shortName: '',
    gender: 'Nữ',
    dob: '',
    cccd: '',
    phone: '',
    address: '',
    bankCode: 'VCB',
    bankName: 'Vietcombank',
    bankAccount: '',
    accountName: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdError, setPwdError] = useState("");

  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advDate, setAdvDate] = useState(getVietnamTodayYMD());
  const [advAmount, setAdvAmount] = useState("");
  const [advReason, setAdvReason] = useState("");
  const [advLoading, setAdvLoading] = useState(false);

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveDate, setLeaveDate] = useState(getVietnamTodayYMD());
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [leaveShift, setLeaveShift] = useState("Cả Ngày");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveLoading, setLeaveLoading] = useState(false);

  // Daily Entry Form
  const [entryDate, setEntryDate] = useState(getVietnamTodayYMD());
  const [entryStart, setEntryStart] = useState("08:00");
  const [entryEnd, setEntryEnd] = useState("17:00");
  const [entryHours, setEntryHours] = useState("9");
  const [entryShiftName, setEntryShiftName] = useState("Ca Sáng");
  const [entryNote, setEntryNote] = useState("");

  const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const MINUTES_LIST = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  // Quick shift selection
  const selectQuickShift = (shiftType: 'SANG' | 'CHIEU') => {
    if (shiftType === 'SANG') {
      setEntryShiftName("Ca Sáng");
      setEntryStart("08:00");
      setEntryEnd("17:00");
      setEntryHours("9");
    } else if (shiftType === 'CHIEU') {
      setEntryShiftName("Ca Chiều");
      setEntryStart("17:00");
      setEntryEnd("22:00");
      setEntryHours("5");
    }
  };

  // Auto calculate hours
  useEffect(() => {
    if (entryStart && entryEnd) {
      const [sh, sm] = entryStart.split(':').map(Number);
      const [eh, em] = entryEnd.split(':').map(Number);
      let diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
      if (diffMinutes < 0) diffMinutes += 24 * 60;
      const roundedHours = Math.round(diffMinutes / 60);
      if (!isNaN(roundedHours) && roundedHours >= 0) {
        setEntryHours(String(roundedHours));
      }
    }
  }, [entryStart, entryEnd]);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const [activeRes, summaryRes] = await Promise.all([
        api.attendance.getActiveShift(employee.id),
        api.reports.getMySummary(employee.id, selectedMonth)
      ]);
      
      setActiveShift(activeRes.activeShift);
      setSummaryData(summaryData.data);
    } catch (err) {
      console.error("Lỗi tải thông tin chấm công:", err);
      setErrorMsg("Không thể đồng bộ dữ liệu với máy chủ. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  }, [employee.id, selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Sync localEmp when employee prop changes
  useEffect(() => {
    setLocalEmp(employee);
  }, [employee]);

  // Save Avatar
  const saveAvatar = async (avatarUrl: string) => {
    try {
      setAvatarLoading(true);
      const res = await api.employees.updateAvatar({ employeeId: employee.id, avatar: avatarUrl });
      if (onUpdateEmployee) {
        onUpdateEmployee({ ...employee, avatar: avatarUrl });
      }
      setShowAvatarModal(false);
      toast.success("Thành công", "Đã cập nhật ảnh đại diện cá nhân thành công!");
      await loadData();
    } catch (err) {
      toast.error("Lỗi", err.message || "Lỗi khi cập nhật ảnh đại diện");
    } finally {
      setAvatarLoading(false);
    }
  };

  // Handle avatar file selection
  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        saveAvatar(dataUrl);
      };
      img.src = event.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle Salary Advance Submit
  const handleSalaryAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(advAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Lỗi", "Vui lòng nhập số tiền ứng lương hợp lệ lớn hơn 0!");
      return;
    }

    try {
      setAdvLoading(true);
      const res = await api.advances.create({
        employeeId: employee.id,
        date: advDate,
        amount: amountNum,
        reason: advReason.trim() || "Ứng tiền lương chi tiêu"
      });
      toast.success("Thành công", res.message);
      setShowAdvanceModal(false);
      setAdvAmount("");
      setAdvReason("");
      await loadData();
    } catch (err) {
      toast.error("Lỗi", err.message || "Lỗi khi gửi yêu cầu ứng lương!");
    } finally {
      setAdvLoading(false);
    }
  };

  // Open profile modal
  const openProfileModal = () => {
    setProfileForm({
      fullName: localEmp.fullName || localEmp.name || '',
      shortName: localEmp.shortName || localEmp.name || '',
      gender: localEmp.gender || 'Nữ',
      dob: localEmp.dob || '',
      cccd: localEmp.cccd || '',
      phone: localEmp.phone || '',
      address: localEmp.address || '',
      bankCode: localEmp.bankCode || 'VCB',
      bankName: localEmp.bankName || 'Vietcombank',
      bankAccount: localEmp.bankAccount || '',
      accountName: localEmp.accountName || (localEmp.fullName || localEmp.name || '').toUpperCase()
    });
    setProfileError('');
    setShowEditProfileModal(true);
  };

  // Save profile
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.fullName.trim()) {
      setProfileError('Vui lòng nhập họ và tên đầy đủ!');
      return;
    }
    try {
      setProfileLoading(true);
      setProfileError('');

      const selectedBank = VIETNAM_BANKS.find(b => b.code === profileForm.bankCode);
      const bankName = selectedBank ? selectedBank.shortName : profileForm.bankName;

      const payload = {
        fullName: profileForm.fullName.trim(),
        shortName: (profileForm.shortName || profileForm.fullName).trim(),
        name: (profileForm.shortName || profileForm.fullName).trim(),
        gender: profileForm.gender,
        dob: profileForm.dob,
        cccd: profileForm.cccd.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim(),
        bankCode: profileForm.bankCode,
        bankName: bankName,
        bankAccount: profileForm.bankAccount.trim(),
        accountName: (profileForm.accountName || profileForm.fullName).trim().toUpperCase()
      };

      const res = await api.employees.update(employee.id, payload);
      const updated = res.employee || { ...localEmp, ...payload };

      setLocalEmp(updated);
      if (onUpdateEmployee) {
        onUpdateEmployee(updated);
      }

      toast.success("Thành công", 'Đã cập nhật thông tin cá nhân thành công! Thông tin mới đã được đồng bộ sang trang Quản Lý.');
      setShowEditProfileModal(false);
      await loadData();
    } catch (err) {
      setProfileError(err.message || 'Lỗi khi cập nhật thông tin cá nhân');
    } finally {
      setProfileLoading(false);
    }
  };

  // Delete advance
  const handleDeleteAdvance = async (id: string, amount: number) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy bản ghi ứng lương ${Number(amount).toLocaleString('vi-VN')} đ này?`)) return;
    try {
      await api.advances.delete(id);
      toast.success("Thành công", "Đã hủy bản ghi ứng lương thành công");
      await loadData();
    } catch (err) {
      toast.error("Lỗi", err.message || "Lỗi khi xóa bản ghi ứng lương");
    }
  };

  // Handle Leave Submit
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveDate) {
      toast.error("Lỗi", "Vui lòng chọn ngày muốn xin nghỉ!");
      return;
    }

    try {
      setLeaveLoading(true);
      const res = await api.leaves.create({
        employeeId: employee.id,
        date: leaveDate,
        endDate: leaveEndDate || leaveDate,
        shift: leaveShift,
        reason: leaveReason.trim() || "Có việc cá nhân"
      });
      toast.success("Thành công", res.message);
      setShowLeaveModal(false);
      setLeaveReason("");
      setLeaveEndDate("");
      await loadData();
    } catch (err) {
      toast.error("Lỗi", err.message || "Lỗi khi gửi đơn xin nghỉ!");
    } finally {
      setLeaveLoading(false);
    }
  };

  // Delete leave
  const handleDeleteLeave = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn xin nghỉ này?")) return;
    try {
      await api.leaves.delete(id);
      toast.success("Thành công", "Đã hủy đơn xin nghỉ");
      await loadData();
    } catch (err) {
      toast.error("Lỗi", err.message || "Lỗi khi xóa đơn xin nghỉ");
    }
  };

  // Handle Daily Entry Submit
  const handleDailyEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryDate) {
      setErrorMsg("Vui lòng chọn ngày làm việc!");
      return;
    }
    if (entryStart === entryEnd) {
      setErrorMsg("Giờ vào ca và giờ ra ca không được trùng nhau! Vui lòng chọn thời gian hợp lệ.");
      return;
    }
    const h = Number(entryHours);
    if (isNaN(h) || h <= 0) {
      setErrorMsg("Vui lòng nhập số giờ làm việc hợp lệ!");
      return;
    }

    // Client-side overlap check
    const dayRecords = (summaryData?.records || []).filter(
      r => r.date === entryDate && r.status === 'completed'
    );

    const [sh, sm] = entryStart.split(':').map(Number);
    const [eh, em] = entryEnd.split(':').map(Number);
    const newStartMins = sh * 60 + sm;
    let newEndMins = eh * 60 + em;
    if (newEndMins <= newStartMins) newEndMins += 24 * 60;

    for (const rec of dayRecords) {
      if (rec.checkIn && rec.checkOut) {
        const dStart = new Date(rec.checkIn);
        const dEnd = new Date(rec.checkOut);
        const existStartMins = dStart.getHours() * 60 + dStart.getMinutes();
        let existEndMins = dEnd.getHours() * 60 + dEnd.getMinutes();
        if (existEndMins <= existStartMins) existEndMins += 24 * 60;

        if (newStartMins < existEndMins && newEndMins > existStartMins) {
          const existStartStr = `${String(dStart.getHours()).padStart(2, '0')}:${String(dStart.getMinutes()).padStart(2, '0')}`;
          const existEndStr = `${String(dEnd.getHours()).padStart(2, '0')}:${String(dEnd.getMinutes()).padStart(2, '0')}`;
          
          if (entryStart === existStartStr && entryEnd === existEndStr) {
            setErrorMsg(`⚠️ Trùng lặp thời gian! Bạn đã chấm công ca ${existStartStr} - ${existEndStr} (${rec.totalHours}h) trong ngày hôm nay rồi. Không được khai báo lặp lại 2 lần!`);
          } else {
            setErrorMsg(`⚠️ Trùng thời gian làm việc! Khoảng giờ ${entryStart} - ${entryEnd} bị giao thoa/trùng với ca đã có (${existStartStr} - ${existEndStr}) trong ngày hôm nay. Vui lòng chọn khoảng giờ khác!`);
          }
          return;
        }
      }
    }

    try {
      setLoading(true);
      setErrorMsg("");
      const res = await api.attendance.dailyEntry({
        employeeId: employee.id,
        date: entryDate,
        startTime: entryStart,
        endTime: entryEnd,
        hours: h,
        shiftName: entryShiftName,
        note: entryNote.trim()
      });

      toast.success("Thành công", res.message);
      setEntryNote("");
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || "Lỗi khi lưu thời gian làm việc!");
    } finally {
      setLoading(false);
    }
  };

  // Delete attendance
  const handleDeleteAttendance = async (id: string, timeLabel: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bản ghi ca làm việc "${timeLabel}" này không?`)) return;
    try {
      setLoading(true);
      await api.attendance.delete(id);
      toast.success("Thành công", `Đã xóa ca làm việc "${timeLabel}" thành công!`);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || "Lỗi khi xóa ca làm việc");
    } finally {
      setLoading(false);
    }
  };

  // Live Check In
  const handleLiveCheckIn = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await api.attendance.checkIn({
        employeeId: employee.id,
        shiftCode: "CA1",
        note: "Vào ca trực tiếp"
      });

      toast.success("Thành công", "Bạn đã VÀO CA trực tiếp thành công!");
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || "Lỗi khi vào ca!");
    } finally {
      setLoading(false);
    }
  };

  // Live Check Out
  const handleLiveCheckOut = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn KẾT THÚC CA làm việc ngay bây giờ?")) return;
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await api.attendance.checkOut({
        employeeId: employee.id,
        attendanceId: activeShift?.id
      });

      toast.success("Thành công", res.message);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || "Lỗi khi kết thúc ca!");
    } finally {
      setLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setPwdError("Mật khẩu mới phải có ít nhất 4 ký tự!");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("Xác nhận mật khẩu mới không khớp!");
      return;
    }

    try {
      setPwdLoading(true);
      setPwdError("");
      const res = await api.auth.changePassword({
        employeeId: employee.id,
        oldPassword: oldPassword,
        newPassword: newPassword
      });
      setPwdMsg(res.message);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPasswordModal(false);
        setPwdMsg("");
      }, 2000);
    } catch (err) {
      setPwdError(err.message || "Lỗi khi đổi mật khẩu!");
    } finally {
      setPwdLoading(false);
    }
  };

  const getDayOfWeekName = (dateStr: string) => {
    const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const d = new Date(dateStr);
    return days[d.getDay()];
  };

  const currentAvatar = localEmp.avatar || (localEmp.gender === 'Nữ' ? '/avatar-female.svg' : '/avatar-male.svg');
  const displayName = localEmp.shortName || localEmp.name;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
      {/* Toast Container */}
      <ToastContainer />

      {/* Security Warning */}
      {(localEmp.isDefaultPassword || (!localEmp.passwordChanged && localEmp.password === '1234')) && (
        <div className="mb-3 p-3 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 shadow-xs">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-amber-950 flex items-center gap-1.5 whitespace-nowrap">
                <span>⚠️ Bạn Đang Dùng Mật Khẩu Khởi Tạo (1234)!</span>
              </h4>
              <p className="text-[11px] text-amber-800 mt-0.5 whitespace-nowrap">
                Vui lòng đổi sang mật khẩu riêng để bảo vệ tài khoản và số giờ làm.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => { setShowPasswordModal(true); setPwdError(""); setPwdMsg(""); }}
            className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Đổi Mật Khẩu Ngay</span>
          </Button>
        </div>
      )}

      {/* Personal Header */}
      <Card className="mb-3 no-print">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar 
              src={currentAvatar} 
              alt={displayName} 
              size="lg"
              status="online"
            />
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">
                  {displayName}
                </h2>
                <Badge variant="primary">TK: {localEmp.username || localEmp.code}</Badge>
                <Badge variant="neutral">{localEmp.gender || "Nam"}</Badge>
                <Badge variant="neutral" className="hidden sm:inline-block">Cơ sở Trưng Nữ Vương</Badge>
                <Badge variant="primary" className="text-[10px]">Bản v1.5.5</Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-1 font-medium">
                <span className="whitespace-nowrap inline-flex items-center gap-1">NS: <strong className="text-slate-700">{formatDateVN(localEmp.dob) || 'Chưa cập nhật'}</strong></span>
                <span className="whitespace-nowrap inline-flex items-center gap-1">SĐT: <strong className="text-slate-700 font-mono">{localEmp.phone || 'Chưa cập nhật'}</strong></span>
                <span className="whitespace-nowrap inline-flex items-center gap-1">CCCD: <strong className="text-slate-700 font-mono">{localEmp.cccd || 'Chưa cập nhật'}</strong></span>
                {localEmp.address && <span className="whitespace-nowrap inline-flex items-center gap-1">ĐC: <strong className="text-slate-700">{localEmp.address}</strong></span>}
                {localEmp.bankAccount && (
                  <span className="whitespace-nowrap inline-flex items-center gap-1">TK: <strong className="text-amber-800 font-mono">{localEmp.bankCode || 'NH'} - {localEmp.bankAccount}</strong> ({localEmp.accountName || displayName})</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <Button variant="primary" size="sm" onClick={openProfileModal} iconLeft={<UserCheck className="w-3.5 h-3.5" />}>
              Sửa Thông Tin
            </Button>
            {localEmp.bankAccount && (
              <Button variant="secondary" size="sm" onClick={() => setShowPersonalQrModal(true)} iconLeft={<QrCode className="w-3.5 h-3.5 text-amber-600" />}>
                {localEmp.bankCode || 'VietQR'}: {localEmp.bankAccount}
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => { setShowPasswordModal(true); setPwdError(""); setPwdMsg(""); }} iconLeft={<KeyRound className="w-3.5 h-3.5 text-slate-500" />}>
              Đổi MK
            </Button>
            <Button variant="secondary" size="sm" onClick={onLogout} iconLeft={<LogOut className="w-3.5 h-3.5 text-amber-600" />}>
              Đăng Xuất
            </Button>
          </div>
        </div>
      </Card>

      {/* Feedback Messages */}
      {feedbackMsg && (
        <div className="mb-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between no-print animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg("")} className="text-xs underline text-emerald-700 cursor-pointer">Đóng</button>
        </div>
      )}

      {errorMsg && (
        <div className="mb-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between no-print animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-xs underline text-amber-800 cursor-pointer">Đóng</button>
        </div>
      )}

      {/* DAILY ENTRY SECTION */}
      <Card className="mb-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 stroke-[2.5]" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight whitespace-nowrap">
                Nhập Thời Gian Làm Việc Từng Ngày
              </h3>
              <p className="text-[11px] text-slate-500 whitespace-nowrap">
                Bấm chọn nhanh ca làm hoặc chỉnh giờ vào/ra rồi bấm <strong>Xác Nhận Giờ Làm</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant={entryShiftName === 'Ca Sáng' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => selectQuickShift('SANG')}
              className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span className="whitespace-nowrap">🌅 Ca Sáng (08:00 - 17:00 • 9h)</span>
            </Button>
            <Button
              type="button"
              variant={entryShiftName === 'Ca Chiều' ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => selectQuickShift('CHIEU')}
              className="flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <span className="whitespace-nowrap">🌆 Ca Chiều (17:00 - 22:00 • 5h)</span>
            </Button>
          </div>
        </div>

        <form onSubmit={handleDailyEntrySubmit} className="text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 items-end">
            {/* Date */}
            <div className="col-span-2 sm:col-span-1">
              <label className="label">1. Ngày Làm Việc:</label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input
                  type="date"
                  required
                  value={entryDate}
                  onChange={(e) => {
                    const d = e.target.value;
                    setEntryDate(d);
                    if (d && d.length >= 7) {
                      const ym = d.substring(0, 7);
                      if (ym !== selectedMonth) setSelectedMonth(ym);
                    }
                  }}
                  fullWidth
                />
              </div>
            </div>

            {/* Start Time */}
            <div className="col-span-1">
              <div className="flex items-center justify-between mb-1">
                <label className="label">2. Giờ Đến (Vào):</label>
                <span className="text-[10px] font-extrabold text-amber-700 font-mono whitespace-nowrap">{entryStart}</span>
              </div>
              <div className="flex items-center gap-1">
                <SelectComponent
                  value={entryStart.split(':')[0] || '08'}
                  onValueChange={(v) => { const m = entryStart.split(':')[1] || '00'; setEntryStart(`${v}:${m}`); }}
                  options={HOURS_24.map(h => ({ value: h, label: `${h}h` }))}
                  className="w-1/2"
                />
                <span className="font-bold text-slate-400">:</span>
                <SelectComponent
                  value={entryStart.split(':')[1] || '00'}
                  onValueChange={(v) => { const h = entryStart.split(':')[0] || '08'; setEntryStart(`${h}:${v}`); }}
                  options={MINUTES_LIST.map(m => ({ value: m, label: `${m}p` }))}
                  className="w-1/2"
                />
              </div>
            </div>

            {/* End Time */}
            <div className="col-span-1">
              <div className="flex items-center justify-between mb-1">
                <label className="label">3. Ra Về (Ra):</label>
                <span className="text-[10px] font-extrabold text-amber-700 font-mono whitespace-nowrap">{entryEnd}</span>
              </div>
              <div className="flex items-center gap-1">
                <SelectComponent
                  value={entryEnd.split(':')[0] || '17'}
                  onValueChange={(v) => { const m = entryEnd.split(':')[1] || '00'; setEntryEnd(`${v}:${m}`); }}
                  options={HOURS_24.map(h => ({ value: h, label: `${h}h` }))}
                  className="w-1/2"
                />
                <span className="font-bold text-slate-400">:</span>
                <SelectComponent
                  value={entryEnd.split(':')[1] || '00'}
                  onValueChange={(v) => { const h = entryEnd.split(':')[0] || '17'; setEntryEnd(`${h}:${v}`); }}
                  options={MINUTES_LIST.map(m => ({ value: m, label: `${m}p` }))}
                  className="w-1/2"
                />
              </div>
            </div>

            {/* Hours */}
            <div className="col-span-1">
              <label className="label">4. Tổng Giờ Làm:</label>
              <div className="relative">
                <Input
                  type="number"
                  step="1"
                  required
                  value={entryHours}
                  onChange={(e) => setEntryHours(e.target.value)}
                  className="font-extrabold text-amber-800 text-sm font-mono text-center"
                  fullWidth
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-700 whitespace-nowrap">tiếng</span>
              </div>
            </div>

            {/* Note & Submit */}
            <div className="col-span-2 sm:col-span-2 flex items-center gap-2">
              <div className="flex-1">
                <label className="label">Ghi chú (tùy chọn):</label>
                <Input
                  type="text"
                  placeholder="Ví dụ: Phụ dọn kho, đổi ca..."
                  value={entryNote}
                  onChange={(e) => setEntryNote(e.target.value)}
                  fullWidth
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                fullWidth
                className="h-[37px] mt-[18px] shrink-0"
                iconLeft={<Send className="w-3.5 h-3.5" />}
              >
                <span className="whitespace-nowrap">Xác Nhận Giờ Làm</span>
              </Button>
            </div>
          </div>
        </form>

        {/* Today's Shifts List */}
        {(() => {
          const dayRecords = (summaryData?.records || []).filter(
            r => r.date === entryDate && r.status === 'completed'
          );
          const dayTotalHours = dayRecords.reduce((sum, r) => sum + Number(r.totalHours || 0), 0);
          if (dayRecords.length === 0) return null;

          return (
            <div className="mt-3.5 pt-3 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  Đã ghi nhận <strong>{dayRecords.length} ca làm việc</strong> trong ngày {formatDateVN(entryDate)}:
                </span>
                <span className="text-[11px] font-black text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-lg w-fit">
                  Tổng thời gian ngày: {dayTotalHours} giờ
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {dayRecords.map((r, idx) => (
                  <div key={r.id || idx} className="flex items-center justify-between bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded-md bg-white border border-amber-200 font-mono font-bold text-[10px] text-amber-800">
                        Ca {idx + 1}
                      </span>
                      <div>
                        <span className="font-mono font-black text-slate-800 block">
                          {formatShortTime(r.checkIn)} ➔ {formatShortTime(r.checkOut)}
                        </span>
                        <span className="text-[10px] text-slate-500 italic block">
                          {r.note || r.shiftName || 'Làm việc'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-lg text-xs">
                        {r.totalHours}h
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAttendance(r.id, `${formatShortTime(r.checkIn)} - ${formatShortTime(r.checkOut)}`)}
                        className="text-slate-400 hover:text-amber-800 p-1 rounded-lg hover:bg-amber-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </Card>

      {/* ACTIVE SHIFT */}
      {activeShift && (
        <Card className="mb-3 bg-amber-50 border-amber-200 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Đang trong ca làm việc</h3>
                <p className="text-xs text-slate-500">Vào lúc {formatShortTime(activeShift.checkIn)} • Ca {activeShift.shiftName}</p>
              </div>
            </div>
            <Button
              variant="danger"
              size="md"
              onClick={handleLiveCheckOut}
              disabled={loading}
              iconLeft={<Clock className="w-4 h-4" />}
            >
              Kết Thúc Ca
            </Button>
          </div>
        </Card>
      )}

      {/* LIVE CHECK IN/OUT BUTTONS (when no active shift) */}
      {!activeShift && (
        <div className="flex gap-3 mb-3 no-print">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleLiveCheckIn}
            disabled={loading}
            iconLeft={<Clock className="w-4 h-4" />}
            className="flex-1"
          >
            <span>🌅 Vào Ca Trực Tiếp</span>
          </Button>
        </div>
      )}

      {/* ADVANCES & LEAVES GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3 no-print">
        {/* ADVANCES */}
        <Card className="bg-gradient-to-br from-amber-500/10 via-white to-amber-500/10 border-amber-200/80">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-200/60 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <DollarSign className="w-4 h-4 stroke-[3]" />
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight whitespace-nowrap">
                Ứng Tiền Lương Trước
              </h3>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const todayStr = getVietnamTodayYMD();
                const currentSalaryMonth = getSalaryMonthForAdvance(todayStr);
                setAdvDate(selectedMonth === currentSalaryMonth ? todayStr : `${selectedMonth}-06`);
                setShowAdvanceModal(true);
              }}
              iconLeft={<DollarSign className="w-3.5 h-3.5" />}
            >
              + Ghi Nhận Ứng Lương
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-white rounded-xl p-2.5 border border-amber-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block whitespace-nowrap">Số Lần Đã Ứng</span>
                <div className="text-xl font-black text-amber-700 font-mono mt-0.5 whitespace-nowrap">
                  {summaryData?.advanceCount || 0} <span className="text-xs font-bold">lần</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-2.5 border border-amber-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block whitespace-nowrap">Tổng Tiền Đã Ứng</span>
                <div className="text-xl font-black text-amber-700 font-mono mt-0.5 whitespace-nowrap">
                  {Number(summaryData?.advanceTotal || 0).toLocaleString('vi-VN')} <span className="text-xs font-bold">đ</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-amber-200/80 bg-white">
            {summaryData?.advances && summaryData.advances.length > 0 ? (
              <Table
                columns={[
                  { key: 'stt', header: 'Đợt', width: '60px', align: 'center' },
                  { key: 'date', header: 'Ngày Ứng', align: 'left' },
                  { key: 'amount', header: 'Số Tiền', align: 'right' },
                  { key: 'reason', header: 'Lý Do', align: 'left' },
                  { key: 'status', header: 'Trạng Thái', align: 'center', width: '100px' },
                  { key: 'actions', header: '', align: 'center', width: '80px' }
                ]}
                data={summaryData.advances}
                keyExtractor={(adv) => adv.id}
                striped
                hoverable
                compact
                onRowClick={() => {}}
              />
            ) : (
              <div className="py-4 text-center text-slate-400 text-xs italic whitespace-nowrap">
                Chưa có đợt tạm ứng lương nào trong tháng.
              </div>
            )}
          </div>
        </Card>

        {/* LEAVES */}
        <Card>
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4 stroke-[2.5]" />
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight whitespace-nowrap">
                Thông Báo Nghỉ Làm
              </h3>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setShowLeaveModal(true)}
              iconLeft={<CalendarDays className="w-3.5 h-3.5" />}
            >
              + Đăng Ký Ngày Nghỉ
            </Button>
          </div>

          <div className="mb-3 p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-900 uppercase block whitespace-nowrap">
                  Tổng Số Ngày Nghỉ ({formatMonthVN(selectedMonth)})
                </span>
                <div className="text-xl font-black text-blue-800 font-mono mt-0.5 whitespace-nowrap">
                  {summaryData?.totalLeaveDays || 0} <span className="text-xs font-bold">ngày nghỉ</span>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            {summaryData?.leaveRequests && summaryData.leaveRequests.length > 0 ? (
              <Table
                columns={[
                  { key: 'date', header: 'Ngày Nghỉ', align: 'left' },
                  { key: 'endDate', header: 'Đến Ngày', align: 'left' },
                  { key: 'shift', header: 'Ca', align: 'left' },
                  { key: 'reason', header: 'Lý Do', align: 'left' },
                  { key: 'status', header: 'Trạng Thái', align: 'center', width: '100px' },
                  { key: 'actions', header: '', align: 'center', width: '60px' }
                ]}
                data={summaryData.leaveRequests}
                keyExtractor={(lv) => lv.id}
                striped
                hoverable
                compact
              />
            ) : (
              <div className="py-4 text-center text-slate-400 text-xs italic whitespace-nowrap">
                Chưa có đơn xin nghỉ nào trong tháng.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* MONTHLY SUMMARY */}
      <Card className="mb-3 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-extrabold text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              Bảng Tổng Hợp Ca & Thông Báo Lương
            </span>
            <span className="text-xs font-bold text-slate-700">Áp dụng: <strong>{formatMonthVN(selectedMonth)}</strong> • Cơ sở Trưng Nữ Vương</span>
          </div>
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

        {summaryData && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <Card className="bg-blue-50 border-blue-200">
                <span className="text-[10px] font-bold text-blue-800 uppercase block">Tổng Giờ</span>
                <div className="text-xl font-black text-blue-700 font-mono mt-1">{summaryData.totalHours} giờ</div>
              </Card>
              <Card className="bg-amber-50 border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Ca Sáng</span>
                <div className="text-xl font-black text-amber-700 font-mono mt-1">{summaryData.totalShifts} ca</div>
              </Card>
              <Card className="bg-emerald-50 border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Lương Ca</span>
                <div className="text-xl font-black text-emerald-700 font-mono mt-1">{summaryData.estimatedSalary?.toLocaleString() || '0'} đ</div>
              </Card>
              <Card className="bg-amber-50 border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Đã Ứng</span>
                <div className="text-xl font-black text-amber-700 font-mono mt-1">{summaryData.advanceTotal.toLocaleString()} đ</div>
              </Card>
            </div>

            {/* Net Salary Card */}
            <Card className="bg-emerald-600 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase block">Lương Thực Lĩnh</span>
                  <p className="text-[11px] text-emerald-100 mt-0.5">Sau khi trừ tạm ứng</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black font-mono text-white">
                    {(summaryData.estimatedSalary - summaryData.advanceTotal).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-emerald-100 ml-1">đ</span>
                </div>
              </div>
            </Card>
          )}

          {/* Shift Detail Table */}
          {summaryData?.records && summaryData.records.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <Table
                columns={[
                  { key: 'date', header: 'Ngày', width: '100px', align: 'center' },
                  { key: 'dayOfWeek', header: 'Thứ', width: '60px', align: 'center' },
                  { key: 'checkIn', header: 'Giờ Vào', width: '90px', align: 'center', render: (r) => formatShortTime(r.checkIn) },
                  { key: 'checkOut', header: 'Giờ Ra', width: '90px', align: 'center', render: (r) => formatShortTime(r.checkOut) },
                  { key: 'totalHours', header: 'Giờ', width: '60px', align: 'center', render: (r) => `${r.totalHours}h` },
                  { key: 'shiftName', header: 'Ca', width: '100px', align: 'left' },
                  { key: 'note', header: 'Ghi Chú', align: 'left', render: (r) => r.note || '-' },
                  { key: 'status', header: 'Trạng Thái', width: '100px', align: 'center', render: (r) => <StatusBadge status={r.status} size="sm" /> }
                ]}
                data={summaryData.records.filter(r => r.status === 'completed' || r.status === 'working')}
                keyExtractor={(r) => r.id}
                striped
                hoverable
                compact
              />
            </div>
          )}
        </Card>
      </Card>

      {/* MODALS */}
      {/* Profile Modal */}
      <Modal
        open={showEditProfileModal}
        onOpenChange={setShowEditProfileModal}
        title="Kiểm Tra & Chỉnh Sửa Thông Tin Cá Nhân"
        description="Cập nhật SĐT, CCCD, Ngày sinh, Ngân hàng, Avatar..."
        size="lg"
      >
        <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
          {profileError && (
            <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

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
            <Button type="submit" disabled={profileLoading} size="md">
              {profileLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Lưu Thông Tin'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Avatar Modal */}
      <Modal
        open={showAvatarModal}
        onOpenChange={setShowAvatarModal}
        title="Đổi Ảnh Đại Diện"
        description="Tải lên ảnh mới hoặc chụp từ camera"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <Avatar src={currentAvatar} alt={displayName} size="xl" />
          </div>
          <div className="border-t border-slate-200 pt-4">
            <label className="block text-center cursor-pointer">
              <input type="file" accept="image/*" onChange={handleAvatarFile} className="sr-only" />
              <Button variant="secondary" size="lg" fullWidth iconLeft={<Camera className="w-4 h-4" />}>
                Chọn Ảnh Từ Máy Tính
              </Button>
            </label>
            <p className="text-center text-xs text-slate-500">Hoặc kéo thả ảnh vào đây. Tối đa 2MB, định dạng JPG/PNG/WebP.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="md" onClick={() => setShowAvatarModal(false)} fullWidth>Hủy</Button>
            <Button variant="primary" size="md" disabled={avatarLoading} fullWidth>Lưu Ảnh</Button>
          </div>
        </Modal>
      </Modal>

      {/* Password Modal */}
      <Modal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        title="Đổi Mật Khẩu Cá Nhân"
        size="md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
          {pwdError && <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-600 shrink-0" /><span>{pwdError}</span></div>}
          {pwdMsg && <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0"/><span>{pwdMsg}</span></div>}

          <Input type="password" label="Mật khẩu hiện tại" value={oldPassword} onChange={(e)=>setOldPassword(e.target.value)} required placeholder="Nhập mật khẩu hiện tại..." fullWidth />
          <Input type="password" label="Mật khẩu mới" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} required minLength={4} placeholder="Ít nhất 4 ký tự..." fullWidth />
          <Input type="password" label="Xác nhận mật khẩu mới" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} required placeholder="Nhập lại mật khẩu mới..." fullWidth />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={() => setShowPasswordModal(false)}>Hủy</Button>
            <Button type="submit" disabled={pwdLoading} size="md">{pwdLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : 'Lưu Mật Khẩu Mới'}</Button>
          </div>
        </form>
      </Modal>

      {/* Advance Modal */}
      <Modal open={showAdvanceModal} onOpenChange={setShowAdvanceModal} title="Ghi Nhận Ứng Lương" size="md">
        <form onSubmit={handleSalaryAdvanceSubmit} className="space-y-4 text-xs">
          <Input type="date" label="Ngày Ứng" value={advDate} onChange={(e)=>setAdvDate(e.target.value)} required fullWidth />
          <Input type="number" label="Số Tiền (VNĐ)" value={advAmount} onChange={(e)=>setAdvAmount(e.target.value)} required placeholder="Nhập số tiền" fullWidth />
          <Input label="Lý Do" value={advReason} onChange={(e)=>setAdvReason(e.target.value)} placeholder="Ví dụ: Ăn trưa, Mua xe..." fullWidth />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={()=>setShowAdvanceModal(false)}>Hủy</Button>
            <Button type="submit" disabled={advLoading} size="md">{advLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : 'Lưu Ứng Lương'}</Button>
          </div>
        </form>
      </Modal>

      {/* Leave Modal */}
      <Modal open={showLeaveModal} onOpenChange={setShowLeaveModal} title="Đăng Ký Nghỉ Làm" size="md">
        <form onSubmit={handleLeaveSubmit} className="space-y-4 text-xs">
          <Input type="date" label="Ngày Nghỉ" value={leaveDate} onChange={(e)=>setLeaveDate(e.target.value)} required fullWidth />
          <Input type="date" label="Đến Ngày (nếu nghỉ nhiều ngày)" value={leaveEndDate} onChange={(e)=>setLeaveEndDate(e.target.value)} fullWidth />
          <SelectComponent label="Ca Nghỉ" value={leaveShift} onValueChange={setLeaveShift} options={[{value:'Cả Ngày',label:'Cả Ngày'},{value:'Ca Sáng',label:'Ca Sáng'},{value:'Ca Chiều',label:'Ca Chiều'}]} fullWidth />
          <Input label="Lý Do" value={leaveReason} onChange={(e)=>setLeaveReason(e.target.value)} placeholder="Có việc cá nhân..." fullWidth />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" size="md" onClick={()=>setShowLeaveModal(false)}>Hủy</Button>
            <Button type="submit" disabled={leaveLoading} size="md">{leaveLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : 'Gửi Đơn Xin Nghỉ'}</Button>
          </div>
        </form>
      </Modal>

      {/* Personal QR Modal */}
      {showPersonalQrModal && localEmp.bankAccount && (
        <Modal open={showPersonalQrModal} onOpenChange={setShowPersonalQrModal} title="Mã VietQR Của Bạn" size="md">
          <div className="text-center space-y-4">
            <img 
              src={getVietQRUrl({ bankCode: localEmp.bankCode, bankAccount: localEmp.bankAccount, accountName: localEmp.accountName || displayName })} 
              alt="VietQR" 
              className="w-64 h-64 mx-auto rounded-xl border border-slate-200 bg-white p-2"
            />
            <div className="text-xs text-slate-600">
              <p><strong>{localEmp.bankCode}</strong> - {localEmp.bankAccount}</p>
              <p>{localEmp.accountName || displayName}</p>
            </div>
            <Button variant="primary" size="md" onClick={() => {
              navigator.clipboard.writeText(localEmp.bankAccount);
              toast.success("Đã sao chép", "Đã sao chép số tài khoản!");
            }} iconLeft={<Copy className="w-4 h-4" />}>
              Sao Chép Số TK
            </Button>
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