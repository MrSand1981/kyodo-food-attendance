// src/pages/StaffAttendance.jsx
import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Clock, Calendar, Award, CheckCircle2, 
  AlertCircle, Printer, RefreshCw, PlusCircle, 
  FileText, ChevronDown, Check, LogOut, Send, MapPin,
  Lock, KeyRound, ShieldCheck, X, Camera, DollarSign,
  CalendarDays, Trash2, Sparkles, HeartHandshake, QrCode, UserCheck, Edit3
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

export default function StaffAttendance({ 
  employee, 
  onUpdateEmployee,
  onLogout, 
  settings, 
  shifts = [] 
}) {
  const [localEmp, setLocalEmp] = useState(employee);
  useEffect(() => {
    setLocalEmp(employee);
  }, [employee]);

  const [activeShift, setActiveShift] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const todayYM = getVietnamCurrentYM();
  const [selectedMonth, setSelectedMonth] = useState("2026-11");
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showPersonalQrModal, setShowPersonalQrModal] = useState(false);

  // Modal tự kiểm tra & cập nhật thông tin cá nhân (SĐT, CCCD, Ngày sinh, Ngân hàng...)
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

  // Modal đổi ảnh đại diện cá nhân
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Modal đổi mật khẩu riêng biệt
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdError, setPwdError] = useState("");

  // Modal ứng tiền lương trước
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advDate, setAdvDate] = useState(getVietnamTodayYMD());
  const [advAmount, setAdvAmount] = useState("");
  const [advReason, setAdvReason] = useState("");
  const [advLoading, setAdvLoading] = useState(false);

  // Modal xin ngày nghỉ phép
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveDate, setLeaveDate] = useState(getVietnamTodayYMD());
  const [leaveShift, setLeaveShift] = useState("Cả Ngày");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveLoading, setLeaveLoading] = useState(false);

  // Form: Nhập thời gian làm việc từng ngày (2 ca: Sáng 8-17h, Chiều 17-22h | Định dạng 24h từ 0-23h, không có AM/PM)
  const [entryDate, setEntryDate] = useState(getVietnamTodayYMD());
  const [entryStart, setEntryStart] = useState("08:00");
  const [entryEnd, setEntryEnd] = useState("17:00");
  const [entryHours, setEntryHours] = useState("9.0");
  const [entryShiftName, setEntryShiftName] = useState("Ca Sáng");
  const [entryNote, setEntryNote] = useState("");

  // Quản lý Ngày Lễ (Lương x2)
  const [holidaysList, setHolidaysList] = useState([]);

  useEffect(() => {
    api.getHolidays().then(res => {
      if (res && res.success) {
        setHolidaysList(res.holidays || []);
      }
    }).catch(err => console.warn("Lỗi tải ngày lễ:", err.message));
  }, []);

  const activeHolidaySelected = holidaysList.find(h => h.date === entryDate && h.active !== false);

  // Mảng 24 giờ (00 -> 23) và phút (00 -> 55) theo chuẩn 24H (KHÔNG AM/PM)
  const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const MINUTES_LIST = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  // Hàm chọn nhanh ca làm việc
  const selectQuickShift = (shiftType) => {
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

  // Tự động tính số giờ khi đổi giờ vào / giờ ra (làm tròn số giờ, không tính lẻ phút: 5h10p -> 5h, 4h50p -> 5h)
  useEffect(() => {
    if (entryStart && entryEnd) {
      const [sh, sm] = entryStart.split(':').map(Number);
      const [eh, em] = entryEnd.split(':').map(Number);
      let diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
      if (diffMinutes < 0) diffMinutes += 24 * 60; // qua đêm
      const roundedHours = Math.round(diffMinutes / 60);
      if (!isNaN(roundedHours) && roundedHours >= 0) {
        setEntryHours(String(roundedHours));
      }
    }
  }, [entryStart, entryEnd]);

  // Tải dữ liệu ban đầu
  const loadData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const activeRes = await api.getActiveShift(employee.id);
      setActiveShift(activeRes.activeShift);

      const summaryRes = await api.getMySummary(employee.id, selectedMonth);
      setSummaryData(summaryRes.data);
    } catch (err) {
      console.error("Lỗi tải thông tin chấm công:", err);
      setErrorMsg("Không thể đồng bộ dữ liệu với máy chủ. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [employee.id, selectedMonth]);

  // Xử lý LƯU ẢNH ĐẠI DIỆN MỚI
  const saveAvatar = async (avatarUrl) => {
    try {
      setAvatarLoading(true);
      const res = await api.updateAvatar({
        employeeId: employee.id,
        avatar: avatarUrl
      });
      if (onUpdateEmployee) {
        onUpdateEmployee({ ...employee, avatar: avatarUrl });
      }
      setShowAvatarModal(false);
      setFeedbackMsg("🎉 Đã cập nhật ảnh đại diện cá nhân thành công!");
      confetti({ particleCount: 60, spread: 50 });
      await loadData();
    } catch (err) {
      alert("Lỗi khi cập nhật ảnh đại diện: " + err.message);
    } finally {
      setAvatarLoading(false);
    }
  };

  // Xử lý chọn file ảnh từ máy tính
  const handleAvatarFile = (e) => {
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
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        saveAvatar(dataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Xử lý ỨNG TIỀN LƯƠNG TRƯỚC
  const handleSalaryAdvanceSubmit = async (e) => {
    e.preventDefault();
    const amountNum = Number(advAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Vui lòng nhập số tiền ứng lương hợp lệ lớn hơn 0!");
      return;
    }

    try {
      setAdvLoading(true);
      const res = await api.requestSalaryAdvance({
        employeeId: employee.id,
        date: advDate,
        amount: amountNum,
        reason: advReason.trim() || "Ứng tiền lương chi tiêu"
      });
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      setFeedbackMsg(`💸 ${res.message}`);
      setShowAdvanceModal(false);
      setAdvAmount("");
      setAdvReason("");
      await loadData();
    } catch (err) {
      alert(err.message || "Lỗi khi gửi yêu cầu ứng lương!");
    } finally {
      setAdvLoading(false);
    }
  };

  // Mở modal kiểm tra & chỉnh sửa thông tin cá nhân
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

  // Lưu chỉnh sửa thông tin cá nhân của nhân viên
  const handleProfileSubmit = async (e) => {
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

      const res = await api.updateEmployee(localEmp.id, payload);
      const updated = res.employee || { ...localEmp, ...payload };

      setLocalEmp(updated);
      if (onUpdateEmployee) {
        onUpdateEmployee(updated);
      }

      confetti({ particleCount: 80, spread: 70 });
      setFeedbackMsg('🎉 Đã cập nhật thông tin cá nhân thành công! Thông tin mới đã được đồng bộ sang trang Quản Lý.');
      setShowEditProfileModal(false);
      await loadData();
    } catch (err) {
      setProfileError(err.message || 'Lỗi khi cập nhật thông tin cá nhân');
    } finally {
      setProfileLoading(false);
    }
  };

  // Xóa bản ghi ứng lương
  const handleDeleteAdvance = async (id, amount) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy bản ghi ứng lương ${Number(amount).toLocaleString('vi-VN')} đ này?`)) return;
    try {
      await api.deleteSalaryAdvance(id);
      setFeedbackMsg("Đã hủy bản ghi ứng lương thành công");
      await loadData();
    } catch (err) {
      alert(err.message || "Lỗi khi xóa bản ghi ứng lương");
    }
  };

  // Xử lý XIN NGÀY NGHỈ
  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (!leaveDate) {
      alert("Vui lòng chọn ngày muốn xin nghỉ!");
      return;
    }

    try {
      setLeaveLoading(true);
      const res = await api.requestLeave({
        employeeId: employee.id,
        date: leaveDate,
        shift: leaveShift,
        reason: leaveReason.trim() || "Có việc cá nhân"
      });
      setFeedbackMsg(`📅 ${res.message}`);
      setShowLeaveModal(false);
      setLeaveReason("");
      await loadData();
    } catch (err) {
      alert(err.message || "Lỗi khi gửi đơn xin nghỉ!");
    } finally {
      setLeaveLoading(false);
    }
  };

  // Xóa đơn xin nghỉ
  const handleDeleteLeave = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đơn xin nghỉ này?")) return;
    try {
      await api.deleteLeaveRequest(id);
      setFeedbackMsg("Đã hủy đơn xin nghỉ");
      await loadData();
    } catch (err) {
      alert(err.message || "Lỗi khi xóa đơn xin nghỉ");
    }
  };

  // Xử lý NHẬP THỜI GIAN LÀM VIỆC TỪNG NGÀY (HỖ TRỢ NHIỀU CA TRONG NGÀY & CHỐNG TRÙNG LẶP)
  const handleDailyEntrySubmit = async (e) => {
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

    // Kiểm tra chống trùng lặp / giao thoa thời gian ngay tại client
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
      const res = await api.recordDailyWork({
        employeeId: employee.id,
        date: entryDate,
        startTime: entryStart,
        endTime: entryEnd,
        hours: h,
        shiftName: entryShiftName,
        note: entryNote.trim()
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setFeedbackMsg(`🎉 ${res.message}`);
      setEntryNote("");
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || "Lỗi khi lưu thời gian làm việc!");
    } finally {
      setLoading(false);
    }
  };

  // Xóa bản ghi ca làm việc (nếu nhập nhầm)
  const handleDeleteAttendance = async (id, timeLabel) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bản ghi ca làm việc "${timeLabel}" này không?`)) return;
    try {
      setLoading(true);
      await api.deleteAttendance(id);
      setFeedbackMsg(`Đã xóa ca làm việc "${timeLabel}" thành công!`);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || "Lỗi khi xóa ca làm việc");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý VÀO CA TRỰC TIẾP
  const handleLiveCheckIn = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await api.checkIn({
        employeeId: employee.id,
        shiftCode: "CA1",
        note: "Vào ca trực tiếp"
      });

      confetti({ particleCount: 70, spread: 60 });
      setFeedbackMsg("🎉 Bạn đã VÀO CA trực tiếp thành công!");
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || "Lỗi khi vào ca!");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý RA CA TRỰC TIẾP
  const handleLiveCheckOut = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn KẾT THÚC CA làm việc ngay bây giờ?")) return;
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await api.checkOut({
        employeeId: employee.id,
        attendanceId: activeShift?.id
      });

      confetti({ particleCount: 90, spread: 80 });
      setFeedbackMsg(`👏 ${res.message}`);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message || "Lỗi khi kết thúc ca!");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
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
      const res = await api.changePassword({
        employeeId: employee.id,
        oldPassword: oldPassword,
        newPassword: newPassword
      });
      setPwdMsg(res.message || "Đổi mật khẩu thành công!");
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

  const getDayOfWeekName = (dateStr) => {
    const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const d = new Date(dateStr);
    return days[d.getDay()];
  };

  const formatShortTime = (isoString) => {
    if (!isoString) return '--:--';
    const d = new Date(isoString);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  // Avatar hiển thị ưu tiên
  const currentAvatar = localEmp.avatar || (localEmp.gender === 'Nữ' ? '/avatar-female.svg' : '/avatar-male.svg');

  const displayName = localEmp.shortName || localEmp.name;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
      
      {/* CẢNH BÁO BẢO MẬT: NHẮC ĐỔI MẬT KHẨU KHI DÙNG 1234 */}
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
          <button
            type="button"
            onClick={() => {
              setShowPasswordModal(true);
              setPwdError("");
              setPwdMsg("");
            }}
            className="w-full sm:w-auto px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-xs transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap">Đổi Mật Khẩu Ngay</span>
          </button>
        </div>
      )}

      {/* ================= PHẦN 0: TRANG CÁ NHÂN CỦA NHÂN VIÊN (COMPACT HEADER) ================= */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-200 mb-3 no-print">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            {/* Avatar cá nhân hóa có nút đổi ảnh */}
            <div className="relative group shrink-0">
              <img 
                src={currentAvatar} 
                alt={displayName} 
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-200 shadow-xs bg-slate-50"
              />
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-transform hover:scale-110 cursor-pointer"
                title="Thay đổi ảnh đại diện cá nhân của bạn"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>
            
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight whitespace-nowrap">
                  {displayName}
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-black font-mono whitespace-nowrap">
                  TK: {localEmp.username || localEmp.code}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold whitespace-nowrap">
                  {localEmp.gender || "Nam"}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium hidden sm:inline-block whitespace-nowrap">
                  Cơ sở Trưng Nữ Vương
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-black whitespace-nowrap">
                  Bản v1.5.4
                </span>
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

          {/* Nút tác vụ tài khoản: Sửa thông tin cá nhân, Xem VietQR, Hướng Dẫn PDF, Đổi MK, Đăng xuất */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            
            {/* Nút xem File Hướng Dẫn Sử Dụng PDF */}
            <a
              href="/Huong_Dan_Su_Dung_Kyodo_Food_Nhan_Vien.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-black transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              title="Xem và tải file PDF hướng dẫn sử dụng phần mềm dành cho nhân viên"
            >
              <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="whitespace-nowrap">Hướng Dẫn (PDF)</span>
            </a>

            {/* Nút tự kiểm tra & chỉnh sửa thông tin cá nhân */}
            <button
              type="button"
              onClick={openProfileModal}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              title="Tự kiểm tra và chỉnh sửa thông tin cá nhân (SĐT, CCCD, Ngày sinh, Số tài khoản ngân hàng...)"
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Sửa Thông Tin</span>
            </button>

            {localEmp.bankAccount && (
              <button
                type="button"
                onClick={() => setShowPersonalQrModal(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-all cursor-pointer whitespace-nowrap shrink-0"
                title="Xem mã VietQR tài khoản ngân hàng của bạn"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="whitespace-nowrap font-bold">{localEmp.bankCode || 'VietQR'}: {localEmp.bankAccount}</span>
              </button>
            )}

            <button
              onClick={() => {
                setShowPasswordModal(true);
                setPwdError("");
                setPwdMsg("");
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Đổi mật khẩu tài khoản cá nhân"
            >
              <KeyRound className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="whitespace-nowrap">Đổi MK</span>
            </button>

            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all border border-amber-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <LogOut className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="whitespace-nowrap">Đăng Xuất</span>
            </button>
          </div>

        </div>
      </div>

      {/* Messages */}
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
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-xs underline text-amber-800 cursor-pointer">Đóng</button>
        </div>
      )}

      {/* ================= PHẦN 1: NHẬP THỜI GIAN LÀM VIỆC TỪNG NGÀY (COMPACT TOOLBAR) ================= */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 mb-3 no-print">
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

          {/* Quick Shifts Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => selectQuickShift('SANG')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                entryShiftName === 'Ca Sáng'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-amber-50 border border-slate-200'
              }`}
            >
              <span className="whitespace-nowrap">🌅 Ca Sáng (08:00 - 17:00 • 9h)</span>
            </button>
            <button
              type="button"
              onClick={() => selectQuickShift('CHIEU')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                entryShiftName === 'Ca Chiều'
                  ? 'bg-amber-700 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-amber-50 border border-slate-200'
              }`}
            >
              <span className="whitespace-nowrap">🌆 Ca Chiều (17:00 - 22:00 • 5h)</span>
            </button>
          </div>
        </div>

        {/* Daily Entry Form */}
        {activeHolidaySelected && (
          <div className="mb-3 p-3 rounded-2xl bg-linear-to-r from-amber-500 via-amber-600 to-yellow-500 text-white shadow-sm flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🎉</span>
              <div>
                <div className="font-black text-xs sm:text-sm flex items-center gap-2">
                  <span>Hôm nay là Ngày Lễ: {activeHolidaySelected.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white text-amber-900 text-[10px] font-black uppercase tracking-wider">Lương ×{activeHolidaySelected.multiplier || 2}</span>
                </div>
                <p className="text-[11px] text-amber-100 mt-0.5">
                  Ca làm việc trong ngày này được tự động nhân {activeHolidaySelected.multiplier || 2} lần tiền lương theo quy định của Kyodo Food!
                </p>
              </div>
            </div>
          </div>
        )}
        <form onSubmit={handleDailyEntrySubmit} className="text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 items-end">
            
            {/* 1. Ngày Làm Việc */}
            <div className="col-span-2 sm:col-span-1">
              <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px] tracking-wider whitespace-nowrap">
                1. Ngày Làm Việc: <span className="text-amber-800 font-mono">({formatDateVN(entryDate)})</span>
              </label>
              <div className="relative cursor-pointer group">
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 pointer-events-none z-10" />
                <input
                  type="text"
                  readOnly
                  value={formatDateVN(entryDate) || 'DD/MM/YYYY'}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-black text-amber-900 text-xs shadow-2xs group-hover:border-amber-400 transition-colors pointer-events-none"
                  placeholder="DD/MM/YYYY"
                />
                <input
                  type="date"
                  required
                  value={entryDate}
                  onChange={(e) => {
                    const d = e.target.value;
                    if (d) {
                      setEntryDate(d);
                      if (d.length >= 7) {
                        const ym = d.substring(0, 7);
                        if (ym !== selectedMonth) {
                          setSelectedMonth(ym);
                        }
                      }
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                  title="Nhấn để chọn ngày làm việc (DD/MM/YYYY)"
                />
              </div>
            </div>

            {/* 2. Giờ Đến Cửa Hàng (Giờ Vào) */}
            <div className="col-span-1">
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider whitespace-nowrap">
                  2. Giờ Đến (Vào):
                </label>
                <span className="text-[10px] font-extrabold text-amber-700 font-mono whitespace-nowrap">
                  {entryStart}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <select
                  aria-label="Giờ vào"
                  value={entryStart.split(':')[0] || '08'}
                  onChange={(e) => {
                    const m = entryStart.split(':')[1] || '00';
                    setEntryStart(`${e.target.value}:${m}`);
                  }}
                  className="w-1/2 px-1 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 font-mono text-center cursor-pointer"
                >
                  {HOURS_24.map(h => (
                    <option key={h} value={h}>{h}h</option>
                  ))}
                </select>
                <span className="font-bold text-slate-400">:</span>
                <select
                  aria-label="Phút vào"
                  value={entryStart.split(':')[1] || '00'}
                  onChange={(e) => {
                    const h = entryStart.split(':')[0] || '08';
                    setEntryStart(`${h}:${e.target.value}`);
                  }}
                  className="w-1/2 px-1 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 font-mono text-center cursor-pointer"
                >
                  {MINUTES_LIST.map(m => (
                    <option key={m} value={m}>{m}p</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Thời Gian Ra Về (Giờ Ra) */}
            <div className="col-span-1">
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 uppercase text-[10px] tracking-wider whitespace-nowrap">
                  3. Ra Về (Ra):
                </label>
                <span className="text-[10px] font-extrabold text-amber-700 font-mono whitespace-nowrap">
                  {entryEnd}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <select
                  aria-label="Giờ ra"
                  value={entryEnd.split(':')[0] || '17'}
                  onChange={(e) => {
                    const m = entryEnd.split(':')[1] || '00';
                    setEntryEnd(`${e.target.value}:${m}`);
                  }}
                  className="w-1/2 px-1 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 font-mono text-center cursor-pointer"
                >
                  {HOURS_24.map(h => (
                    <option key={h} value={h}>{h}h</option>
                  ))}
                </select>
                <span className="font-bold text-slate-400">:</span>
                <select
                  aria-label="Phút ra"
                  value={entryEnd.split(':')[1] || '00'}
                  onChange={(e) => {
                    const h = entryEnd.split(':')[0] || '17';
                    setEntryEnd(`${h}:${e.target.value}`);
                  }}
                  className="w-1/2 px-1 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 font-mono text-center cursor-pointer"
                >
                  {MINUTES_LIST.map(m => (
                    <option key={m} value={m}>{m}p</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Tổng Số Giờ Làm */}
            <div className="col-span-1">
              <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px] tracking-wider whitespace-nowrap">
                4. Tổng Giờ Làm:
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  required
                  value={entryHours}
                  onChange={(e) => setEntryHours(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl bg-amber-50 border border-amber-200 font-extrabold text-amber-800 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono text-center"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-700 whitespace-nowrap">
                  tiếng
                </span>
              </div>
            </div>

            {/* 5. Ghi Chú & Nút Xác Nhận */}
            <div className="col-span-2 sm:col-span-2 flex items-center gap-2">
              <div className="flex-1">
                <label className="block font-bold text-slate-700 mb-1 uppercase text-[10px] tracking-wider whitespace-nowrap">
                  Ghi chú (tùy chọn):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Phụ dọn kho, đổi ca..."
                  value={entryNote}
                  onChange={(e) => setEntryNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-600/25 transition-all cursor-pointer whitespace-nowrap h-[37px] mt-[18px] shrink-0"
              >
                <Send className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Xác Nhận Giờ Làm</span>
              </button>
            </div>

          </div>
        </form>

        {/* Danh sách các ca làm đã khai báo trong ngày đã chọn (Hỗ trợ làm nhiều lần/ngày & chống trùng) */}
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
                      <button
                        type="button"
                        onClick={() => handleDeleteAttendance(r.id, `${formatShortTime(r.checkIn)} - ${formatShortTime(r.checkOut)}`)}
                        className="text-slate-400 hover:text-amber-800 p-1 rounded-lg hover:bg-amber-100 cursor-pointer transition-colors"
                        title="Xóa ca này nếu nhập nhầm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ================= PHẦN 2 & 3: GRID 2 CỘT (ỨNG LƯƠNG & BÁO NGHỈ) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3 no-print">
        
        {/* CỘT TRÁI: ỨNG TIỀN LƯƠNG TRƯỚC */}
        <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-500/10 rounded-2xl p-4 shadow-xs border border-amber-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-amber-200/60 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <DollarSign className="w-4 h-4 stroke-[3]" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight whitespace-nowrap">
                    Ứng Tiền Lương Trước
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const todayStr = getVietnamTodayYMD();
                  const currentSalaryMonth = getSalaryMonthForAdvance(todayStr);
                  setAdvDate(selectedMonth === currentSalaryMonth ? todayStr : `${selectedMonth}-06`);
                  setShowAdvanceModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-black text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <DollarSign className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">+ Ghi Nhận Ứng Lương</span>
              </button>
            </div>

            {/* Thống kê Ứng Lương Trong Chu Kỳ */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-white rounded-xl p-2.5 border border-amber-200 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block whitespace-nowrap">
                    Số Lần Đã Ứng
                  </span>
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
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block whitespace-nowrap">
                    Tổng Tiền Đã Ứng
                  </span>
                  <div className="text-xl font-black text-amber-700 font-mono mt-0.5 whitespace-nowrap">
                    {Number(summaryData?.advanceTotal || 0).toLocaleString('vi-VN')} <span className="text-xs font-bold">đ</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
            </div>

            {/* Chi tiết từng đợt ứng lương (KHÔNG CÓ CỘT HỦY, ĐỢT 1 KHÔNG NHẢY 2 HÀNG) */}
            <div className="overflow-x-auto rounded-xl border border-amber-200/80 bg-white">
              {summaryData?.advances && summaryData.advances.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-amber-50/70 border-b border-amber-100 text-amber-900 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2 px-3 text-center whitespace-nowrap">Đợt</th>
                      <th className="py-2 px-3 whitespace-nowrap">Ngày Ứng</th>
                      <th className="py-2 px-3 text-right whitespace-nowrap">Số Tiền</th>
                      <th className="py-2 px-3 whitespace-nowrap">Lý Do</th>
                      <th className="py-2 px-3 text-center whitespace-nowrap">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summaryData.advances.map((adv, idx) => (
                      <tr key={adv.id || idx} className="hover:bg-amber-50/30">
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] font-mono whitespace-nowrap">
                            Đợt {summaryData.advances.length - idx}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-800 whitespace-nowrap">
                          {formatDateVN(adv.date)}
                        </td>
                        <td className="py-2 px-3 font-mono font-black text-amber-700 text-right whitespace-nowrap">
                          {Number(adv.amount).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-2 px-3 text-slate-600 truncate max-w-28 whitespace-nowrap">
                          {adv.reason || "Ứng tiền lương"}
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold whitespace-nowrap">
                            Đã Khấu Trừ
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-4 text-center text-slate-400 text-xs italic whitespace-nowrap">
                  Chưa có đợt tạm ứng lương nào trong tháng.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: THÔNG BÁO NGHỈ LÀM */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4 h-4 stroke-[2.5]" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight whitespace-nowrap">
                    Thông Báo Nghỉ Làm
                  </h3>
                  <p className="text-[11px] text-slate-500 whitespace-nowrap">
                    Báo ngày/ca nghỉ cho cửa hàng
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLeaveModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-black text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">+ Đăng Ký Ngày Nghỉ</span>
              </button>
            </div>

            {/* Thống kê Tổng số ngày nghỉ trong tháng */}
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

            {/* Lịch sử thông báo nghỉ */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              {summaryData?.leaveRequests && summaryData.leaveRequests.length > 0 ? (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2 px-3 whitespace-nowrap">Ngày Nghỉ</th>
                      <th className="py-2 px-3 whitespace-nowrap">Ca Nghỉ</th>
                      <th className="py-2 px-3 whitespace-nowrap">Lý Do</th>
                      <th className="py-2 px-3 text-center whitespace-nowrap">Trạng Thái</th>
                      <th className="py-2 px-3 text-center whitespace-nowrap">Hủy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summaryData.leaveRequests.map(leave => (
                      <tr key={leave.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-800 whitespace-nowrap">{formatDateVN(leave.date)}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200 text-[10px] whitespace-nowrap">
                            {leave.shift}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600 truncate max-w-28 whitespace-nowrap">{leave.reason}</td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold whitespace-nowrap">
                            Đã Báo
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteLeave(leave.id)}
                            className="p-1 rounded-md hover:bg-amber-100 text-slate-400 hover:text-amber-800 transition-colors cursor-pointer"
                            title="Hủy thông báo nghỉ này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-xs text-slate-400 italic py-4 text-center whitespace-nowrap">
                  Chưa có thông báo nghỉ nào trong tháng.
                </p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ================= PHẦN 4: KẾT QUẢ TỔNG GIỜ LÀM VIỆC CỦA BẠN ================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200">
        
        {/* Header with Month Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Kết Quả Tổng Giờ Làm Việc Của Bạn
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 whitespace-nowrap">
              Tổng hợp giờ làm việc, số ca và ngày nghỉ trong tháng.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto no-print">
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer transition-colors"
              >
                <option value="2026-11">Tháng 11/2026 (Bắt đầu sử dụng)</option>
                <option value="2026-12">Tháng 12/2026</option>
                <option value="2027-01">Tháng 01/2027</option>
                <option value="2026-10">Tháng 10/2026</option>
                <option value="2026-09">Tháng 09/2026</option>
                <option value="2026-08">Tháng 08/2026</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer"
              title="In phiếu công cá nhân"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">In Phiếu Công</span>
            </button>
          </div>
        </div>

        {/* 3 HERO KPI METRICS CARDS (TỔNG GIỜ - SỐ CA - SỐ NGÀY ĐÃ NGHỈ) */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          
          {/* Card 1: Tổng Số Giờ Làm Việc */}
          <div className="bg-amber-50/80 rounded-2xl p-3 sm:p-4 border border-amber-200 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] sm:text-xs font-black text-amber-900 uppercase tracking-wider whitespace-nowrap">Tổng Giờ Làm</span>
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-amber-800 font-mono whitespace-nowrap">
                {summaryData?.totalHours ?? 0} <span className="text-xs sm:text-sm font-bold">giờ</span>
              </div>
              <p className="text-[10px] text-amber-700/80 font-semibold mt-0.5 whitespace-nowrap">
                Tổng số giờ đã làm trong tháng
              </p>
            </div>
          </div>

          {/* Card 2: Số Ca Làm Việc (Gộp Số ngày đi làm / Số ca làm thành 1 chỉ số duy nhất) */}
          <div className="bg-blue-50/70 rounded-2xl p-3 sm:p-4 border border-blue-200 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] sm:text-xs font-black text-blue-800 uppercase tracking-wider whitespace-nowrap">Số Ca Làm Việc</span>
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Calendar className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-blue-800 font-mono whitespace-nowrap">
                {summaryData?.totalShifts ?? summaryData?.totalDays ?? 0} <span className="text-xs sm:text-sm font-bold">ca</span>
              </div>
              <p className="text-[10px] text-blue-700/80 font-semibold mt-0.5 whitespace-nowrap">
                Ca làm hoàn thành
              </p>
            </div>
          </div>

          {/* Card 3: Số Ngày Đã Nghỉ Trong Tháng */}
          <div className="bg-amber-50/70 rounded-2xl p-3 sm:p-4 border border-amber-200 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] sm:text-xs font-black text-amber-800 uppercase tracking-wider whitespace-nowrap">Số Ngày Đã Nghỉ</span>
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <CalendarDays className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-amber-800 font-mono whitespace-nowrap">
                {summaryData?.totalLeaveDays ?? 0} <span className="text-xs sm:text-sm font-bold">ngày</span>
              </div>
              <p className="text-[10px] text-amber-700/80 font-semibold mt-0.5 whitespace-nowrap">
                Tổng ngày nghỉ trong tháng
              </p>
            </div>
          </div>

        </div>

        {/* Detailed Breakdown Table (FORMAT DD/MM/YYYY) */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3 whitespace-nowrap">Ngày Làm (DD/MM/YYYY)</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Thứ</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Ca Làm Việc</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Giờ Vào</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Giờ Ra</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Tổng Giờ</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Trạng Thái</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Ghi Chú</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summaryData?.records && summaryData.records.length > 0 ? (
                summaryData.records.map((rec) => {
                  return (
                    <tr 
                      key={rec.id} 
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-2 px-3 font-bold text-slate-900 whitespace-nowrap">
                        {formatDateVN(rec.date)}
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-semibold whitespace-nowrap">
                        {getDayOfWeekName(rec.date)}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-bold whitespace-nowrap">
                            {rec.shiftName || rec.shiftCode}
                          </span>
                          {(rec.isHoliday || holidaysList.some(h => h.date === rec.date && h.active !== false)) && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black whitespace-nowrap">
                              🎉 Lễ (×{rec.holidayMultiplier || 2})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {formatShortTime(rec.checkIn)}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {formatShortTime(rec.checkOut)}
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-100/70 text-amber-800 font-bold font-mono whitespace-nowrap">
                          {rec.totalHours} giờ
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] font-bold whitespace-nowrap">Đã chốt giờ</span>
                      </td>
                      <td className="py-2 px-3 text-slate-500 max-w-xs truncate text-[11px] whitespace-nowrap">
                        {rec.note || '-'}
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteAttendance(rec.id, `${formatDateVN(rec.date)} (${formatShortTime(rec.checkIn)} - ${formatShortTime(rec.checkOut)})`)}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                          title="Xóa bản ghi ca làm này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-400">
                    Chưa có lịch sử làm việc trong {formatMonthVN(selectedMonth)}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Print-only footer for payroll signing */}
        <div className="hidden print-only mt-12 pt-8 border-t border-slate-300">
          <div className="flex justify-between items-end text-xs">
            <div className="text-center w-48">
              <p className="font-bold">Nhân Viên Ký Tên</p>
              <div className="h-20"></div>
              <p>{displayName} ({employee.username || employee.code})</p>
            </div>
            <div className="text-center w-48">
              <p className="font-bold">Quản Lý Kyodo Food</p>
              <div className="h-20"></div>
              <p>Cơ sở Trưng Nữ Vương</p>
            </div>
          </div>
        </div>

      </div>

      {/* ================= MODAL: THAY ĐỔI ẢNH ĐẠI DIỆN CÁ NHÂN ================= */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Cá Nhân Hóa Avatar Của Bạn</h3>
              </div>
              <button 
                onClick={() => setShowAvatarModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-5">
              Bạn có thể tải ảnh chụp chân dung của bạn từ máy tính, hoặc lựa chọn hình đại diện chuẩn Nam/Nữ bên dưới.
            </p>

            {/* Xem trước ảnh hiện tại */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-5">
              <img 
                src={currentAvatar} 
                alt="Avatar Preview" 
                className="w-24 h-24 rounded-3xl object-cover ring-4 ring-white shadow-md bg-white"
              />
              <span className="text-xs font-bold text-slate-700 mt-2">
                {employee.name} ({employee.username || employee.code})
              </span>
            </div>

            {/* Nút tải ảnh lên */}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleAvatarFile} 
              className="hidden" 
            />

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                className="w-full py-3 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-amber-600/25 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>{avatarLoading ? "Đang xử lý ảnh..." : "Tải Ảnh Từ Thiết Bị Của Bạn"}</span>
              </button>

              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400 uppercase">Hoặc Chọn Hình Đại Diện Mặc Định</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => saveAvatar('/avatar-female.svg')}
                  disabled={avatarLoading}
                  className="p-3 rounded-2xl border border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/50 flex flex-col items-center gap-2 transition-all cursor-pointer"
                >
                  <img src="/avatar-female.svg" alt="Nữ" className="w-12 h-12 rounded-2xl" />
                  <span className="text-xs font-bold text-slate-700">Avatar Nữ</span>
                </button>

                <button
                  type="button"
                  onClick={() => saveAvatar('/avatar-male.svg')}
                  disabled={avatarLoading}
                  className="p-3 rounded-2xl border border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/50 flex flex-col items-center gap-2 transition-all cursor-pointer"
                >
                  <img src="/avatar-male.svg" alt="Nam" className="w-12 h-12 rounded-2xl" />
                  <span className="text-xs font-bold text-slate-700">Avatar Nam</span>
                </button>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ỨNG TIỀN LƯƠNG TRƯỚC ================= */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 stroke-[3]" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Ứng Tiền Lương Trước</h3>
              </div>
              <button 
                onClick={() => setShowAdvanceModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Nhân viên: <strong className="text-slate-800">{employee.name}</strong> • Tháng tính lương: <strong className="text-amber-800">{formatMonthVN(selectedMonth)}</strong>
            </p>

            <form onSubmit={handleSalaryAdvanceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                  1. Chọn Ngày Ứng Lương: <span className="text-amber-800 font-mono">({formatDateVN(advDate)})</span>
                </label>
                <div className="relative cursor-pointer group">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600 pointer-events-none z-10" />
                  <input
                    type="text"
                    readOnly
                    value={formatDateVN(advDate) || 'DD/MM/YYYY'}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-mono font-black text-amber-900 text-xs shadow-2xs group-hover:border-amber-400 transition-colors pointer-events-none"
                  />
                  <input
                    type="date"
                    required
                    value={advDate}
                    onChange={(e) => setAdvDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                    title="Nhấn để chọn ngày ứng lương (DD/MM/YYYY)"
                  />
                </div>
                {advDate && (
                  <div className={`mt-2 p-2.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 ${
                    getSalaryMonthForAdvance(advDate) === selectedMonth 
                      ? 'bg-amber-50 border-amber-200 text-amber-900' 
                      : 'bg-blue-50 border-blue-200 text-blue-900'
                  }`}>
                    <span>💡 {getAdvanceCycleExplanation(advDate)?.note}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                  2. Số Tiền Ứng (VNĐ):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="50000"
                    min="50000"
                    required
                    placeholder="Ví dụ: 500000"
                    value={advAmount}
                    onChange={(e) => setAdvAmount(e.target.value)}
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
                      onClick={() => setAdvAmount(String(val))}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 font-bold font-mono text-[11px] border border-slate-200 cursor-pointer"
                    >
                      {val >= 1000000 ? `${val / 1000000} Triệu` : `${val / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                  3. Lý Do Ứng Lương (Tùy chọn):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đóng tiền trọ, chi tiêu sinh hoạt..."
                  value={advReason}
                  onChange={(e) => setAdvReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={advLoading}
                  className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                >
                  {advLoading ? "Đang lưu..." : "Lưu Ghi Nhận Ứng Lương"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: THÔNG BÁO NGHỈ LÀM (KHÔNG CẦN DUYỆT) ================= */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Đăng Ký Ngày Nghỉ</h3>
              </div>
              <button 
                onClick={() => setShowLeaveModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Đăng ký ngày và ca nghỉ của bạn cho cửa hàng để thuận tiện theo dõi và tổng hợp số ngày nghỉ trong tháng.
            </p>

            <form onSubmit={handleLeaveSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                  1. Chọn Ngày Nghỉ: <span className="text-blue-800 font-mono">({formatDateVN(leaveDate)})</span>
                </label>
                <div className="relative cursor-pointer group">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none z-10" />
                  <input
                    type="text"
                    readOnly
                    value={formatDateVN(leaveDate) || 'DD/MM/YYYY'}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-mono font-black text-blue-900 text-xs shadow-2xs group-hover:border-blue-400 transition-colors pointer-events-none"
                  />
                  <input
                    type="date"
                    required
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                    title="Nhấn để chọn ngày nghỉ (DD/MM/YYYY)"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                  2. Ca Làm Việc Nghỉ:
                </label>
                <select
                  value={leaveShift}
                  onChange={(e) => setLeaveShift(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="Cả Ngày">Cả Ngày</option>
                  <option value="Ca Sáng (08:00 - 17:00)">Ca Sáng (08:00 - 17:00)</option>
                  <option value="Ca Chiều (17:00 - 22:00)">Ca Chiều (17:00 - 22:00)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                  3. Lý Do / Ghi Chú:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Về quê có việc gia đình, đi khám bệnh..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={leaveLoading}
                  className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                >
                  {leaveLoading ? "Đang lưu..." : "Xác Nhận Đăng Ký Nghỉ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ĐỔI MẬT KHẨU CÁ NHÂN ================= */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Đổi Mật Khẩu Cá Nhân</h3>
              </div>
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Tài khoản: <strong className="text-slate-800">{employee.name} ({employee.username || employee.code})</strong>. Hãy đặt mật khẩu riêng chỉ mình bạn biết để bảo mật thông tin tài khoản.
            </p>

            {pwdMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pwdMsg}</span>
              </div>
            )}

            {pwdError && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{pwdError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mật khẩu hiện tại:
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  (Nếu là tài khoản mới khởi tạo, mật khẩu ban đầu là 1234)
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mật khẩu mới (ít nhất 4 ký tự):
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nhập lại mật khẩu mới:
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận mật khẩu mới..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {pwdLoading ? "Đang lưu..." : "Xác Nhận Đổi Mật Khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: XEM MÃ VIETQR TÀI KHOẢN CÁ NHÂN ================= */}
      {showPersonalQrModal && localEmp.bankAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900">Mã VietQR Nhận Lương</h3>
              </div>
              <button 
                onClick={() => setShowPersonalQrModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200 mb-4 inline-block">
              <img
                src={getVietQRUrl({
                  bankCode: localEmp.bankCode,
                  bankAccount: localEmp.bankAccount,
                  accountName: localEmp.accountName || localEmp.fullName || localEmp.name
                })}
                alt="Mã QR VietQR"
                className="w-56 h-56 mx-auto rounded-xl object-contain shadow-xs bg-white p-2"
              />
            </div>

            <div className="text-xs space-y-1 text-slate-700">
              <p className="font-extrabold text-slate-900 text-sm">{localEmp.fullName || localEmp.name}</p>
              <p>Ngân hàng: <strong>{localEmp.bankName || localEmp.bankCode}</strong></p>
              <p className="font-mono text-base font-extrabold text-amber-700">{localEmp.bankAccount}</p>
              <p className="uppercase text-[11px] font-bold text-slate-500">{localEmp.accountName || localEmp.fullName || localEmp.name}</p>
            </div>

            <button
              onClick={() => setShowPersonalQrModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: TỰ KIỂM TRA & CẬP NHẬT THÔNG TIN CÁ NHÂN ================= */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Kiểm Tra & Cập Nhật Hồ Sơ Cá Nhân
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tự sửa thông tin nếu sai sót • Tự động đồng bộ sang trang Quản Lý
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {profileError && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-3.5 text-xs">
              
              {/* 1. Họ Tên & Biệt Danh */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Họ và tên đầy đủ: <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    placeholder="Ví dụ: Hoàng Thị Lệ"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tên gọi / Biệt danh:
                  </label>
                  <input
                    type="text"
                    value={profileForm.shortName}
                    onChange={(e) => setProfileForm({ ...profileForm, shortName: e.target.value })}
                    placeholder="Ví dụ: Út"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 2. Giới tính & Ngày sinh */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Giới tính:
                  </label>
                  <select
                    value={profileForm.gender}
                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="Nữ">Nữ</option>
                    <option value="Nam">Nam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Ngày sinh (DD/MM/YYYY): {profileForm.dob && <span className="text-amber-800 font-mono">({formatDateVN(profileForm.dob)})</span>}
                  </label>
                  <div className="relative cursor-pointer group">
                    <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 pointer-events-none z-10" />
                    <input
                      type="text"
                      readOnly
                      value={formatDateVN(profileForm.dob) || 'DD/MM/YYYY'}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-black text-amber-900 text-xs shadow-2xs group-hover:border-amber-400 transition-colors pointer-events-none"
                    />
                    <input
                      type="date"
                      value={profileForm.dob}
                      onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                      title="Nhấn để chọn ngày sinh (DD/MM/YYYY)"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Số CCCD & Số điện thoại */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Số CCCD (Căn cước công dân):
                  </label>
                  <input
                    type="text"
                    value={profileForm.cccd}
                    onChange={(e) => setProfileForm({ ...profileForm, cccd: e.target.value })}
                    placeholder="Ví dụ: 048300002347"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Số điện thoại liên hệ:
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="Ví dụ: 0796163630"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* 4. Địa chỉ nơi ở */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Địa chỉ liên hệ:
                </label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="Ví dụ: Hải Châu, Đà Nẵng"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              {/* 5. Tài Khoản Ngân Hàng Nhận Lương (VietQR) */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs">
                  <QrCode className="w-4 h-4 text-amber-600" />
                  <span>Tài Khoản Ngân Hàng Nhận Lương (VietQR)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Ngân hàng Việt Nam:
                    </label>
                    <select
                      value={profileForm.bankCode}
                      onChange={(e) => {
                        const b = VIETNAM_BANKS.find(x => x.code === e.target.value);
                        setProfileForm({
                          ...profileForm,
                          bankCode: e.target.value,
                          bankName: b ? b.shortName : ''
                        });
                      }}
                      className="w-full px-2.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                      {VIETNAM_BANKS.map(b => (
                        <option key={b.code} value={b.code}>{b.shortName} - {b.name.split(' - ')[1] || b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Số tài khoản ngân hàng:
                    </label>
                    <input
                      type="text"
                      value={profileForm.bankAccount}
                      onChange={(e) => setProfileForm({ ...profileForm, bankAccount: e.target.value })}
                      placeholder="Ví dụ: 0796163630"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Tên chủ tài khoản (In hoa không dấu):
                  </label>
                  <input
                    type="text"
                    value={profileForm.accountName}
                    onChange={(e) => setProfileForm({ ...profileForm, accountName: e.target.value.toUpperCase() })}
                    placeholder="Ví dụ: HOANG THI LE"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 font-bold uppercase text-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white text-xs font-black shadow-md shadow-amber-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{profileLoading ? "Đang lưu..." : "Lưu Thông Tin Cá Nhân"}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}