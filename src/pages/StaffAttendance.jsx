// src/pages/StaffAttendance.jsx
import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Clock, Calendar, Award, CheckCircle2, 
  AlertCircle, Printer, RefreshCw, PlusCircle, 
  FileText, ChevronDown, Check, LogOut, Send, MapPin,
  Lock, KeyRound, ShieldCheck, X
} from 'lucide-react';
import { api } from '../utils/api';

export default function StaffAttendance({ 
  employee, 
  onLogout, 
  settings, 
  shifts = [] 
}) {
  const [activeShift, setActiveShift] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("2026-10");
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Modal đổi mật khẩu riêng biệt
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdError, setPwdError] = useState("");

  // Form: Nhập thời gian làm việc từng ngày
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryStart, setEntryStart] = useState("07:30");
  const [entryEnd, setEntryEnd] = useState("11:30");
  const [entryHours, setEntryHours] = useState("4.0");
  const [entryShiftName, setEntryShiftName] = useState("Ca Sáng");
  const [entryNote, setEntryNote] = useState("");

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      
      {/* Employee Profile Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-4 text-center sm:text-left">
          {employee.avatar ? (
            <img 
              src={employee.avatar} 
              alt={employee.name} 
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-red-100 shadow-md"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-700 font-extrabold text-2xl flex items-center justify-center ring-4 ring-red-100 shadow-md">
              {employee.name.charAt(0)}
            </div>
          )}
          
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-lg bg-red-100 text-red-700 text-xs font-black font-mono">
                TK: {employee.username || employee.code}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-red-500" />
                Cơ sở Trưng Nữ Vương
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Tài Khoản Riêng Biệt
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Nhân Viên: {employee.name}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Tài khoản tự quản lý cá nhân • Nhập thời gian làm việc từng ngày và xem tổng giờ làm cuối tháng.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowPasswordModal(true);
              setPwdError("");
              setPwdMsg("");
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200"
            title="Đổi mật khẩu tài khoản của bạn"
          >
            <KeyRound className="w-4 h-4 text-slate-500" />
            <span>Đổi Mật Khẩu</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all border border-red-200"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {feedbackMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between no-print animate-in fade-in">
          <div className="flex items-center gap-2 text-sm font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg("")} className="text-xs underline text-emerald-700">Đóng</button>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between no-print animate-in fade-in">
          <div className="flex items-center gap-2 text-sm font-bold">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg("")} className="text-xs underline text-red-700">Đóng</button>
        </div>
      )}

      {/* ================= PHẦN 1: NHẬP THỜI GIAN LÀM VIỆC TỪNG NGÀY ================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 mb-10 no-print">
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
                className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all"
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
                className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-all animate-pulse"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đang Trong Ca (Bấm Ra Ca)</span>
              </button>
            )}
          </div>
        </div>

        {/* Daily Entry Form */}
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

            {/* Giờ Vào */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                2. Giờ Vào Ca:
              </label>
              <input
                type="time"
                required
                value={entryStart}
                onChange={(e) => setEntryStart(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden font-mono text-center"
              />
            </div>

            {/* Giờ Ra */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                3. Giờ Ra Ca:
              </label>
              <input
                type="time"
                required
                value={entryEnd}
                onChange={(e) => setEntryEnd(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden font-mono text-center"
              />
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
                onChange={(e) => setEntryShiftName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              >
                <option value="Ca Sáng">Ca Sáng (07:30 - 11:30)</option>
                <option value="Ca Chiều">Ca Chiều (13:30 - 17:30)</option>
                <option value="Ca Tối">Ca Tối (17:30 - 22:00)</option>
                <option value="Ca Cả Ngày">Ca Cả Ngày (8h - 10h)</option>
                <option value="Ca Tăng Cường">Ca Tăng Cường / Tăng Ca</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                Ghi Chú Công Việc Ngày Này (Tùy chọn):
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Ví dụ: Phụ dọn kho hàng, làm thay ca cho đồng nghiệp..."
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

      {/* ================= PHẦN 2: CUỐI THÁNG NHẬN KẾT QUẢ TỔNG GIỜ LÀM ================= */}
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
              Cuối tháng, hệ thống tự động tổng hợp toàn bộ số giờ làm việc và tính tổng thu nhập của bạn.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto no-print">
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 cursor-pointer transition-colors"
              >
                <option value="2026-10">Tháng 10/2026 (Hiện tại)</option>
                <option value="2026-09">Tháng 09/2026</option>
                <option value="2026-08">Tháng 08/2026</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200"
              title="In phiếu công cá nhân"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">In Phiếu Công</span>
            </button>
          </div>
        </div>

        {/* 4 HERO KPI METRICS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          
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

          {/* Card 4: Bảo Mật Tiền Lương */}
          <div className="bg-emerald-50/70 rounded-3xl p-5 border border-emerald-200 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">Tiền Lương Tháng</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono tracking-wider">
                •••••••• <span className="text-xs font-bold">VNĐ</span>
              </div>
              <p className="text-[11px] text-emerald-700/80 font-semibold mt-1">
                Bảo mật riêng bởi Quản lý
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

      {/* Modal Đổi Mật Khẩu Cá Nhân */}
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
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
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

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mật khẩu hiện tại:
                </label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Mật khẩu cũ (mặc định: 1234)"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
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
                  className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
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
