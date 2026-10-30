// src/pages/StaffAttendance.jsx
import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Clock, Calendar, Award, CheckCircle2, 
  AlertCircle, Printer, RefreshCw, PlusCircle, 
  FileText, ChevronDown, Check, LogOut, Send, MapPin,
  Lock, KeyRound, ShieldCheck, X, Camera, DollarSign,
  CalendarDays, Trash2, HeartHandshake
} from 'lucide-react';
import { api } from '../utils/api';

export default function StaffAttendance({ 
  employee, 
  onUpdateEmployee,
  onLogout, 
  settings, 
  shifts = [] 
}) {
  const [activeShift, setActiveShift] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("2026-11");
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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
  const [advDate, setAdvDate] = useState(new Date().toISOString().split('T')[0]);
  const [advAmount, setAdvAmount] = useState("");
  const [advReason, setAdvReason] = useState("");
  const [advLoading, setAdvLoading] = useState(false);

  // Modal xin ngày nghỉ phép
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveShift, setLeaveShift] = useState("Cả Ngày");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveLoading, setLeaveLoading] = useState(false);

  // Form: Nhập thời gian làm việc từng ngày (2 ca: Sáng 8-17h, Chiều 17-22h | Định dạng 24h từ 0-23h, không có AM/PM)
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryStart, setEntryStart] = useState("08:00");
  const [entryEnd, setEntryEnd] = useState("17:00");
  const [entryHours, setEntryHours] = useState("9.0");
  const [entryShiftName, setEntryShiftName] = useState("Ca Sáng");
  const [entryNote, setEntryNote] = useState("");

  // Mảng 24 giờ (00 -> 23) và phút (00 -> 55) theo chuẩn 24H (KHÔNG AM/PM)
  const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const MINUTES_LIST = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  // Hàm chọn nhanh ca làm việc
  const selectQuickShift = (shiftType) => {
    if (shiftType === 'SANG') {
      setEntryShiftName("Ca Sáng");
      setEntryStart("08:00");
      setEntryEnd("17:00");
      setEntryHours("9.0");
    } else if (shiftType === 'CHIEU') {
      setEntryShiftName("Ca Chiều");
      setEntryStart("17:00");
      setEntryEnd("22:00");
      setEntryHours("5.0");
    }
  };

  // Tự động tính số giờ khi đổi giờ vào / giờ ra
  useEffect(() => {
    if (entryStart && entryEnd) {
      const [sh, sm] = entryStart.split(':').map(Number);
      const [eh, em] = entryEnd.split(':').map(Number);
      let diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
      if (diffMinutes < 0) diffMinutes += 24 * 60; // qua đêm
      const calculatedH = Number((diffMinutes / 60).toFixed(2));
      if (!isNaN(calculatedH) && calculatedH > 0) {
        setEntryHours(String(calculatedH));
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

  // Xử lý NHẬP THỜI GIAN LÀM VIỆC TỪNG NGÀY
  const handleDailyEntrySubmit = async (e) => {
    e.preventDefault();
    if (!entryDate) {
      setErrorMsg("Vui lòng chọn ngày làm việc!");
      return;
    }
    const h = Number(entryHours);
    if (isNaN(h) || h <= 0) {
      setErrorMsg("Vui lòng nhập số giờ làm việc hợp lệ!");
      return;
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
  const currentAvatar = employee.avatar || (employee.gender === 'Nữ' ? '/avatar-female.svg' : '/avatar-male.svg');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      
      {/* ================= PHẦN 0: TRANG CÁ NHÂN CỦA NHÂN VIÊN ================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 mb-8 no-print">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-6 border-b border-slate-100">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Avatar cá nhân hóa có nút đổi ảnh */}
            <div className="relative group shrink-0">
              <img 
                src={currentAvatar} 
                alt={employee.name} 
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-4 ring-red-100 shadow-md bg-slate-50"
              />
              <button
                type="button"
                onClick={() => setShowAvatarModal(true)}
                className="absolute -bottom-1.5 -right-1.5 p-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-lg transition-transform hover:scale-110 cursor-pointer"
                title="Thay đổi ảnh đại diện cá nhân của bạn"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="px-3 py-1 rounded-xl bg-red-100 text-red-700 text-xs font-black font-mono">
                  TK: {employee.username || employee.code}
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  Cơ sở Trưng Nữ Vương
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Trang Cá Nhân Riêng Biệt
                </span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Nhân Viên: {employee.name}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Tài khoản tự quản lý cá nhân • Đổi ảnh đại diện, ứng tiền lương, xin nghỉ phép và khai báo giờ làm.
              </p>
            </div>
          </div>

          {/* Nút tác vụ tài khoản */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowPasswordModal(true);
                setPwdError("");
                setPwdMsg("");
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer"
              title="Đổi mật khẩu tài khoản cá nhân"
            >
              <KeyRound className="w-4 h-4 text-slate-500" />
              <span>Đổi Mật Khẩu</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all border border-red-200 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Đăng Xuất</span>
            </button>
          </div>
        </div>

        {/* Thông tin hồ sơ cá nhân của nhân viên */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Giới Tính</span>
            <strong className="text-slate-800 font-bold text-sm">{employee.gender || "Nam"}</strong>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ngày Sinh</span>
            <strong className="text-slate-800 font-bold text-sm">{employee.dob || "Chưa cập nhật"}</strong>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Số CCCD</span>
            <strong className="text-slate-800 font-bold font-mono text-sm">{employee.cccd || "Chưa cập nhật"}</strong>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Số Điện Thoại</span>
            <strong className="text-slate-800 font-bold font-mono text-sm">{employee.phone || "Chưa cập nhật"}</strong>
          </div>
        </div>
      </div>

      {/* Messages */}
      {feedbackMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between no-print animate-in fade-in">
          <div className="flex items-center gap-2 text-sm font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg("")} className="text-xs underline text-emerald-700 cursor-pointer">Đóng</button>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between no-print animate-in fade-in">
          <div className="flex items-center gap-2 text-sm font-bold">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-xs underline text-red-700 cursor-pointer">Đóng</button>
        </div>
      )}

      {/* ================= PHẦN 1: ỨNG TIỀN LƯƠNG TRƯỚC (SALARY ADVANCE) ================= */}
      <div className="bg-gradient-to-br from-amber-500/10 via-white to-red-500/10 rounded-3xl p-6 sm:p-8 shadow-sm border border-amber-200/80 mb-8 no-print">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 mb-5 border-b border-amber-200/60 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <DollarSign className="w-4 h-4 stroke-[3]" />
              </span>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Ứng Tiền Lương Trước
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Bạn có thể tạo yêu cầu ứng lương khi cần thiết. Số tiền ứng sẽ được khấu trừ vào kỳ lương cuối tháng.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanceModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-extrabold text-xs shadow-md shadow-amber-600/20 transition-all cursor-pointer"
          >
            <DollarSign className="w-4 h-4" />
            <span>Ứng Lương Ngay</span>
          </button>
        </div>

        {/* Thống kê Ứng Lương: SỐ LẦN ỨNG LƯƠNG & TỔNG SỐ LƯƠNG ĐÃ ỨNG */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                Số Lần Ứng Lương (Tháng {selectedMonth})
              </span>
              <div className="text-3xl font-black text-amber-700 font-mono mt-1">
                {summaryData?.advanceCount || 0} <span className="text-base font-bold">lần</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-red-800 uppercase tracking-wider block">
                Tổng Số Lương Đã Ứng
              </span>
              <div className="text-3xl font-black text-red-700 font-mono mt-1">
                {Number(summaryData?.advanceTotal || 0).toLocaleString('vi-VN')} <span className="text-base font-bold">VNĐ</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center">
              <DollarSign className="w-6 h-6 stroke-[2.5]" />
            </div>
          </div>
        </div>

        {/* Lịch sử ứng lương trong tháng */}
        {summaryData?.advances && summaryData.advances.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-amber-200/80 bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-amber-50/70 border-b border-amber-100 text-amber-900 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-4">Ngày Ứng</th>
                  <th className="py-2.5 px-4 text-right">Số Tiền Ứng</th>
                  <th className="py-2.5 px-4">Lý Do / Ghi Chú</th>
                  <th className="py-2.5 px-4 text-center">Trạng Thái</th>
                  <th className="py-2.5 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaryData.advances.map(adv => (
                  <tr key={adv.id} className="hover:bg-amber-50/30">
                    <td className="py-2.5 px-4 font-bold text-slate-800">{adv.date}</td>
                    <td className="py-2.5 px-4 font-mono font-black text-red-600 text-right">
                      {Number(adv.amount).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{adv.reason || "Ứng tiền lương"}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Đã Ghi Nhận
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteAdvance(adv.id, adv.amount)}
                        className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Hủy bản ghi ứng lương này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= PHẦN 2: XIN NGÀY NGHỈ (LEAVE REQUEST) ================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 mb-8 no-print">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 mb-5 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Xin Ngày Nghỉ Phép
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Gửi đơn xin nghỉ ca làm hoặc nghỉ cả ngày để quản lý sắp xếp người thay thế.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowLeaveModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <CalendarDays className="w-4 h-4" />
            <span>Tạo Đơn Xin Nghỉ</span>
          </button>
        </div>

        {/* Lịch sử xin nghỉ */}
        {summaryData?.leaveRequests && summaryData.leaveRequests.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-4">Ngày Xin Nghỉ</th>
                  <th className="py-2.5 px-4">Ca Nghỉ</th>
                  <th className="py-2.5 px-4">Lý Do</th>
                  <th className="py-2.5 px-4 text-center">Trạng Thái</th>
                  <th className="py-2.5 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summaryData.leaveRequests.map(leave => (
                  <tr key={leave.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-slate-800">{leave.date}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
                        {leave.shift}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{leave.reason}</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Đã Tiếp Nhận
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteLeave(leave.id)}
                        className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Hủy đơn xin nghỉ này"
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
          <p className="text-xs text-slate-400 italic">
            Chưa có đơn xin nghỉ phép nào được ghi nhận trong tháng {selectedMonth}.
          </p>
        )}
      </div>

      {/* ================= PHẦN 3: NHẬP THỜI GIAN LÀM VIỆC TỪNG NGÀY ================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 mb-8 no-print">
        <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Nhập Thời Gian Làm Việc Từng Ngày
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Bạn có thể tự khai báo thời gian làm việc của ngày hôm nay hoặc bất kỳ ngày nào trong tháng.
            </p>
          </div>

          {/* Quick live check-in / check-out */}
          <div>
            {!activeShift ? (
              <button
                type="button"
                onClick={handleLiveCheckIn}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Bấm nếu bạn muốn chấm công theo thời gian thực"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Vào Ca Trực Tiếp</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLiveCheckOut}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-all animate-pulse cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đang Trong Ca (Bấm Ra Ca)</span>
              </button>
            )}
          </div>
        </div>

        {/* Thanh chọn nhanh ca làm việc (Sáng 8-17h, Chiều 17-22h) */}
        <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-red-50/60 rounded-2xl border border-red-100">
          <span className="text-[11px] font-bold text-red-800 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-red-600" />
            Chọn Nhanh Ca:
          </span>
          <button
            type="button"
            onClick={() => selectQuickShift('SANG')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              entryShiftName === 'Ca Sáng'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-red-100 border border-slate-200'
            }`}
          >
            <span>🌅 Ca Sáng (08:00 - 17:00 • 9 tiếng)</span>
          </button>
          <button
            type="button"
            onClick={() => selectQuickShift('CHIEU')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              entryShiftName === 'Ca Chiều'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-amber-100 border border-slate-200'
            }`}
          >
            <span>🌆 Ca Chiều (17:00 - 22:00 • 5 tiếng)</span>
          </button>
        </div>

        {/* Daily Entry Form (Định dạng 24H từ 0-23h, KHÔNG DÙNG AM/PM) */}
        <form onSubmit={handleDailyEntrySubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Chọn Ngày */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                1. Ngày Làm Việc:
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Giờ Vào (Chuẩn 24H: 0h - 23h, KHÔNG CÓ AM/PM) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                  2. Giờ Vào Ca:
                </label>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 font-mono">
                  {entryStart} (24H)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={entryStart.split(':')[0] || '08'}
                  onChange={(e) => {
                    const m = entryStart.split(':')[1] || '00';
                    setEntryStart(`${e.target.value}:${m}`);
                  }}
                  className="w-1/2 px-2.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-red-500 font-mono text-center cursor-pointer"
                  title="Chọn giờ vào từ 0 đến 23 giờ"
                >
                  {HOURS_24.map(h => (
                    <option key={h} value={h}>{h} giờ</option>
                  ))}
                </select>
                <span className="font-bold text-slate-400">:</span>
                <select
                  value={entryStart.split(':')[1] || '00'}
                  onChange={(e) => {
                    const h = entryStart.split(':')[0] || '08';
                    setEntryStart(`${h}:${e.target.value}`);
                  }}
                  className="w-1/2 px-2.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-red-500 font-mono text-center cursor-pointer"
                  title="Chọn phút vào"
                >
                  {MINUTES_LIST.map(m => (
                    <option key={m} value={m}>{m}p</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Giờ Ra (Chuẩn 24H: 0h - 23h, KHÔNG CÓ AM/PM) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                  3. Giờ Ra Ca:
                </label>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700 font-mono">
                  {entryEnd} (24H)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={entryEnd.split(':')[0] || '17'}
                  onChange={(e) => {
                    const m = entryEnd.split(':')[1] || '00';
                    setEntryEnd(`${e.target.value}:${m}`);
                  }}
                  className="w-1/2 px-2.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-red-500 font-mono text-center cursor-pointer"
                  title="Chọn giờ ra từ 0 đến 23 giờ"
                >
                  {HOURS_24.map(h => (
                    <option key={h} value={h}>{h} giờ</option>
                  ))}
                </select>
                <span className="font-bold text-slate-400">:</span>
                <select
                  value={entryEnd.split(':')[1] || '00'}
                  onChange={(e) => {
                    const h = entryEnd.split(':')[0] || '17';
                    setEntryEnd(`${h}:${e.target.value}`);
                  }}
                  className="w-1/2 px-2.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-red-500 font-mono text-center cursor-pointer"
                  title="Chọn phút ra"
                >
                  {MINUTES_LIST.map(m => (
                    <option key={m} value={m}>{m}p</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Số giờ làm */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                4. Tổng Số Giờ Làm:
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  required
                  value={entryHours}
                  onChange={(e) => setEntryHours(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-red-50 border border-red-200 font-extrabold text-red-700 text-sm focus:ring-2 focus:ring-red-500 focus:outline-hidden font-mono text-center"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-red-600">
                  giờ
                </span>
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                Ca Làm Việc:
              </label>
              <select
                value={entryShiftName}
                onChange={(e) => {
                  const val = e.target.value;
                  setEntryShiftName(val);
                  if (val === 'Ca Sáng') selectQuickShift('SANG');
                  else if (val === 'Ca Chiều') selectQuickShift('CHIEU');
                }}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              >
                <option value="Ca Sáng">Ca Sáng (08:00 - 17:00 • 9 tiếng)</option>
                <option value="Ca Chiều">Ca Chiều (17:00 - 22:00 • 5 tiếng)</option>
                <option value="Ca Tùy Chọn">Ca Tùy Chọn / Tăng Cường</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                Ghi Chú Công Việc Ngày Này (Tùy chọn):
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Ví dụ: Phụ dọn kho hàng, đổi ca cùng đồng nghiệp..."
                  value={entryNote}
                  onChange={(e) => setEntryNote(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-red-600/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Lưu Giờ Làm</span>
                </button>
              </div>
            </div>
          </div>
        </form>

      </div>

      {/* ================= PHẦN 4: CUỐI THÁNG NHẬN KẾT QUẢ TỔNG GIỜ LÀM ================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
        
        {/* Header with Month Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-slate-100 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-red-600" />
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Kết Quả Tổng Giờ Làm Việc Của Bạn
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Cuối tháng, hệ thống tự động tổng hợp toàn bộ số giờ làm việc và số ca hoàn thành của bạn.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto no-print">
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 cursor-pointer transition-colors"
              >
                <option value="2026-11">Tháng 11/2026 (Bắt đầu sử dụng)</option>
                <option value="2026-12">Tháng 12/2026</option>
                <option value="2027-01">Tháng 01/2027</option>
                <option value="2026-10">Tháng 10/2026</option>
                <option value="2026-09">Tháng 09/2026</option>
                <option value="2026-08">Tháng 08/2026</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 cursor-pointer"
              title="In phiếu công cá nhân"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">In Phiếu Công</span>
            </button>
          </div>
        </div>

        {/* 3 HERO KPI METRICS CARDS (BẢO MẬT LƯƠNG HOÀN TOÀN) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          
          {/* Card 1: Tổng Số Giờ Làm Việc */}
          <div className="bg-red-50/70 rounded-3xl p-5 border border-red-200 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-red-800 uppercase tracking-wider">Tổng Giờ Làm Việc</span>
              <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-red-700 font-mono">
                {summaryData?.totalHours ?? 0} <span className="text-base font-bold">giờ</span>
              </div>
              <p className="text-[11px] text-red-700/80 font-semibold mt-1">
                Tích lũy trong {selectedMonth}
              </p>
            </div>
          </div>

          {/* Card 2: Số Ngày Đi Làm */}
          <div className="bg-blue-50/70 rounded-3xl p-5 border border-blue-200 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-blue-800 uppercase tracking-wider">Số Ngày Đi Làm</span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-blue-800 font-mono">
                {summaryData?.totalDays ?? 0} <span className="text-base font-bold">ngày</span>
              </div>
              <p className="text-[11px] text-blue-700/80 font-semibold mt-1">
                Ngày phát sinh ca làm
              </p>
            </div>
          </div>

          {/* Card 3: Tổng Số Ca Làm Hoàn Thành */}
          <div className="bg-amber-50/70 rounded-3xl p-5 border border-amber-200 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-amber-800 uppercase tracking-wider">Tổng Số Ca Làm</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-amber-800 font-mono">
                {summaryData?.totalShifts ?? 0} <span className="text-base font-bold">ca</span>
              </div>
              <p className="text-[11px] text-amber-700/80 font-semibold mt-1">
                Ca làm việc hoàn thành
              </p>
            </div>
          </div>

        </div>

        {/* Detailed Breakdown Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-4">Ngày Làm</th>
                <th className="py-3.5 px-4">Thứ</th>
                <th className="py-3.5 px-4">Ca Làm Việc</th>
                <th className="py-3.5 px-4">Giờ Vào</th>
                <th className="py-3.5 px-4">Giờ Ra</th>
                <th className="py-3.5 px-4 text-center">Tổng Giờ</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4">Ghi Chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summaryData?.records && summaryData.records.length > 0 ? (
                summaryData.records.map((rec) => {
                  const isWorking = rec.status === 'working';
                  
                  return (
                    <tr 
                      key={rec.id} 
                      className={`hover:bg-slate-50 transition-colors ${isWorking ? 'bg-emerald-50/50 font-bold' : ''}`}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {rec.date}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-semibold whitespace-nowrap">
                        {getDayOfWeekName(rec.date)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-bold">
                          {rec.shiftName || rec.shiftCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {formatShortTime(rec.checkIn)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {isWorking ? (
                          <span className="text-emerald-600 animate-pulse">Đang làm việc...</span>
                        ) : (
                          formatShortTime(rec.checkOut)
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isWorking ? (
                          <span className="text-xs text-emerald-600 font-bold">Đang tính</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-red-100/70 text-red-700 font-bold font-mono">
                            {rec.totalHours} giờ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isWorking ? (
                          <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-700 text-[11px] font-bold">Đang chạy</span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-700 text-[11px] font-bold">Đã chốt giờ</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate text-xs">
                        {rec.note || '-'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Chưa có lịch sử làm việc trong tháng {selectedMonth}.
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
              <p>{employee.name} ({employee.username || employee.code})</p>
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
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
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
                className="w-full py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md shadow-red-600/20 transition-all cursor-pointer"
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
                  className="p-3 rounded-2xl border border-slate-200 hover:border-red-400 bg-slate-50 hover:bg-red-50/50 flex flex-col items-center gap-2 transition-all cursor-pointer"
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
              Nhân viên: <strong className="text-slate-800">{employee.name}</strong> • Cơ sở Trưng Nữ Vương
            </p>

            <form onSubmit={handleSalaryAdvanceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                  1. Chọn Ngày Ứng Lương:
                </label>
                <input
                  type="date"
                  required
                  value={advDate}
                  onChange={(e) => setAdvDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
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
                  {advLoading ? "Đang gửi..." : "Xác Nhận Ứng Lương"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: XIN NGÀY NGHỈ ================= */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Tạo Đơn Xin Nghỉ Phép</h3>
              </div>
              <button 
                onClick={() => setShowLeaveModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLeaveSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                  1. Chọn Ngày Xin Nghỉ:
                </label>
                <input
                  type="date"
                  required
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                  2. Ca Làm Việc Muốn Xin Nghỉ:
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
                  3. Lý Do Xin Nghỉ:
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
                  {leaveLoading ? "Đang gửi..." : "Gửi Đơn Xin Nghỉ"}
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
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
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
              <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
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
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
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
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
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
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
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
                  className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {pwdLoading ? "Đang lưu..." : "Xác Nhận Đổi Mật Khẩu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}