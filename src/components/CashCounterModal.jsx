// src/components/CashCounterModal.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Calculator,
  X,
  RotateCcw,
  Copy,
  Check,
  Printer,
  Sparkles,
  Coins,
  Banknote,
  FileText,
  Share2,
  ArrowRight,
  History,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  Trash2,
  Eye,
  Send,
  AlertCircle,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { DENOMINATIONS, formatVND, convertVNDToWords } from '../utils/currency';
import { formatDateVN, formatMonthVN, getVietnamTodayYMD, getVietnamCurrentYM } from '../utils/date';
import { api } from '../utils/api';

const STORAGE_KEY = 'kyodo_cash_counter_counts_v1';

const SHIFT_PRESETS = [
  'Ca Sáng ➔ Ca Chiều',
  'Ca Chiều ➔ Đóng Cửa / Quản Lý',
  'Ca Sáng ➔ Quản Lý / Két Chính',
  'Bàn Giao Giữa Ca',
  'Khác',
];

export default function CashCounterModal({
  isOpen,
  onClose,
  employee,
  employees: propEmployees = [],
  onHandoverSuccess,
}) {
  // Tab chính: 'counter' (Máy tính đếm tiền) | 'history' (Lịch sử bàn giao)
  const [activeTab, setActiveTab] = useState('counter');

  // State lưu số tờ từng mệnh giá: { 500000: 10, 200000: 5, ... }
  const [counts, setCounts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {};
  });

  const [copied, setCopied] = useState(false);
  const [shiftNote, setShiftNote] = useState('Tiền két cuối ca');
  const [filterNonZero, setFilterNonZero] = useState(false);

  // Danh sách nhân viên để chọn người nhận
  const [employeeList, setEmployeeList] = useState(propEmployees);

  // Form bàn giao ca sau
  const [showHandoverForm, setShowHandoverForm] = useState(false);
  const [receiverId, setReceiverId] = useState('');
  const [receiverCustomName, setReceiverCustomName] = useState('');
  const [shiftChoice, setShiftChoice] = useState('Ca Sáng ➔ Ca Chiều');
  const [customShiftName, setCustomShiftName] = useState('');
  const [handoverNote, setHandoverNote] = useState('Tiền két bán hàng đã khớp ca');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [lastSubmittedHandover, setLastSubmittedHandover] = useState(null);

  // Tab Lịch Sử
  const [selectedMonth, setSelectedMonth] = useState(getVietnamCurrentYM());
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewDetailItem, setViewDetailItem] = useState(null);
  const [onlyMyHandovers, setOnlyMyHandovers] = useState(false);
  const [copySlipSuccessId, setCopySlipSuccessId] = useState(null);

  // Tự động lưu counts vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
    } catch (_) {}
  }, [counts]);

  // Load danh sách nhân viên nếu chưa có từ prop
  useEffect(() => {
    if (isOpen) {
      if (propEmployees && propEmployees.length > 0) {
        setEmployeeList(propEmployees);
      } else {
        api
          .getEmployees()
          .then((res) => {
            if (res && res.success && res.employees) {
              setEmployeeList(res.employees);
            }
          })
          .catch(() => {});
      }
    }
  }, [isOpen, propEmployees]);

  // Load lịch sử giao tiền
  const loadHistory = useCallback(async () => {
    if (!isOpen) return;
    setHistoryLoading(true);
    try {
      const res = await api.getCashHandovers(
        onlyMyHandovers ? employee?.id || employee?.username : '',
        selectedMonth
      );
      if (res && res.success) {
        setHistoryList(res.records || []);
      }
    } catch (err) {
      console.error('Lỗi khi tải lịch sử giao tiền:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [isOpen, onlyMyHandovers, employee, selectedMonth]);

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      loadHistory();
    }
  }, [isOpen, activeTab, loadHistory]);

  // Cập nhật số tờ của 1 mệnh giá
  const updateCount = (value, newCount) => {
    const val = Math.max(0, parseInt(newCount, 10) || 0);
    setCounts((prev) => ({
      ...prev,
      [value]: val,
    }));
  };

  // Tăng giảm nhanh
  const stepCount = (value, delta) => {
    setCounts((prev) => {
      const current = prev[value] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [value]: next };
    });
  };

  // Đặt lại toàn bộ
  const handleResetAll = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả số tờ về 0 để đếm lại từ đầu?')) {
      setCounts({});
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
    }
  };

  // Tính tổng
  const { totalAmount, totalBills, largeAmount, smallAmount, largeBills, smallBills } =
    useMemo(() => {
      let totalAmount = 0;
      let totalBills = 0;
      let largeAmount = 0;
      let largeBills = 0;
      let smallAmount = 0;
      let smallBills = 0;

      DENOMINATIONS.forEach((d) => {
        const c = counts[d.value] || 0;
        const subtotal = c * d.value;
        totalAmount += subtotal;
        totalBills += c;

        if (d.value >= 100000) {
          largeAmount += subtotal;
          largeBills += c;
        } else {
          smallAmount += subtotal;
          smallBills += c;
        }
      });

      return { totalAmount, totalBills, largeAmount, smallAmount, largeBills, smallBills };
    }, [counts]);

  // Thống kê tháng trong tab Lịch Sử
  const historyStats = useMemo(() => {
    let totalAmt = 0;
    let totalB = 0;
    historyList.forEach((item) => {
      totalAmt += Number(item.totalAmount) || 0;
      totalB += Number(item.totalBills) || 0;
    });
    return {
      count: historyList.length,
      totalAmount: totalAmt,
      totalBills: totalB,
    };
  }, [historyList]);

  // Sao chép báo cáo kiểm tiền hiện tại để gửi Zalo / Telegram
  const handleCopyReport = () => {
    const now = new Date();
    const timeStr = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(now);

    const empName = employee?.shortName || employee?.name || 'Nhân viên';
    const empCode = employee?.username || employee?.code || '';

    let text = `🍗 BÁO CÁO KIỂM TIỀN MẶT - KYODO FOOD\n`;
    text += `📍 Cơ sở: Trưng Nữ Vương, Đà Nẵng\n`;
    text += `👤 Người đếm: ${empName} (${empCode})\n`;
    text += `⏰ Thời gian: ${timeStr}\n`;
    text += `📝 Mục đích: ${shiftNote || 'Kiểm tiền két ca làm'}\n`;
    text += `------------------------------------\n`;

    let hasAny = false;
    DENOMINATIONS.forEach((d) => {
      const c = counts[d.value] || 0;
      if (c > 0) {
        hasAny = true;
        text += `• ${d.label.padEnd(10, ' ')} : ${String(c).padStart(3, ' ')} tờ = ${formatVND(c * d.value)}\n`;
      }
    });

    if (!hasAny) {
      text += `(Chưa có mệnh giá nào được nhập)\n`;
    }

    text += `------------------------------------\n`;
    text += `💵 TỔNG SỐ TỜ: ${totalBills} tờ\n`;
    text += `💰 TỔNG TIỀN MẶT: ${formatVND(totalAmount)}\n`;
    text += `✍️ Bằng chữ: ${convertVNDToWords(totalAmount)}\n`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Sao chép chi tiết một phiếu bàn giao trong lịch sử
  const handleCopyHandoverSlip = (item) => {
    let text = `🤝 BIÊN BẢN BÀN GIAO TIỀN CA - KYODO FOOD\n`;
    text += `📍 Cơ sở: ${item.branch || 'Trưng Nữ Vương'}\n`;
    text += `⏰ Thời gian: ${item.time || ''} ngày ${formatDateVN(item.date)}\n`;
    text += `🔄 Ca làm: ${item.shift || 'Giao ca'}\n`;
    text += `👤 Người giao: ${item.giverName} (${item.giverCode || ''})\n`;
    text += `🎯 Người nhận: ${item.receiverName}\n`;
    text += `------------------------------------\n`;

    const b = item.breakdown || {};
    let hasAny = false;
    DENOMINATIONS.forEach((d) => {
      const c = b[d.value] || b[String(d.value)] || 0;
      if (c > 0) {
        hasAny = true;
        text += `• ${d.label.padEnd(10, ' ')} : ${String(c).padStart(3, ' ')} tờ = ${formatVND(c * d.value)}\n`;
      }
    });
    if (!hasAny) {
      text += `(Không có chi tiết mệnh giá)\n`;
    }

    text += `------------------------------------\n`;
    text += `💵 TỔNG SỐ TỜ: ${item.totalBills || 0} tờ\n`;
    text += `💰 TỔNG TIỀN: ${formatVND(item.totalAmount)}\n`;
    text += `✍️ Bằng chữ: ${item.amountInWords || convertVNDToWords(item.totalAmount)}\n`;
    if (item.note) {
      text += `📝 Ghi chú: ${item.note}\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopySlipSuccessId(item.id);
      setTimeout(() => setCopySlipSuccessId(null), 2500);
    });
  };

  // Xử lý gửi bàn giao ca
  const handleSubmitHandover = async (e) => {
    e.preventDefault();
    setFormError('');

    if (totalAmount <= 0) {
      setFormError('Tổng số tiền đang bằng 0 đ. Vui lòng nhập số tờ trước khi bàn giao!');
      return;
    }

    let finalReceiverName = receiverCustomName.trim();
    if (receiverId) {
      const found = employeeList.find(
        (emp) => emp.id === receiverId || emp.username === receiverId
      );
      if (found) {
        finalReceiverName = found.shortName || found.name;
      }
    }

    if (!finalReceiverName) {
      setFormError('Vui lòng chọn hoặc nhập Người nhận tiền bàn giao!');
      return;
    }

    const finalShift =
      shiftChoice === 'Khác' ? customShiftName.trim() || 'Giao ca tự chọn' : shiftChoice;

    setIsSubmitting(true);
    try {
      const now = new Date();
      const timeStr = new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(now);

      const payload = {
        giverId: employee?.id || employee?.username || 'admin',
        receiverId: receiverId || '',
        receiverName: finalReceiverName,
        date: getVietnamTodayYMD(),
        time: timeStr,
        shift: finalShift,
        totalAmount,
        totalBills,
        amountInWords: convertVNDToWords(totalAmount),
        breakdown: counts,
        note: handoverNote.trim() || 'Bàn giao tiền ca sau',
      };

      const res = await api.createCashHandover(payload);
      if (res && res.success) {
        setLastSubmittedHandover(res.record);
        if (onHandoverSuccess) onHandoverSuccess(res.record);
        // Tải lại lịch sử
        loadHistory();
      } else {
        setFormError(res?.message || 'Có lỗi xảy ra khi lưu biên bản giao tiền');
      }
    } catch (err) {
      setFormError(err.message || 'Lỗi kết nối khi gửi bàn giao');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xóa biên bản giao tiền
  const handleDeleteHandover = async (item) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa biên bản bàn giao ${formatVND(item.totalAmount)} của ngày ${formatDateVN(
          item.date
        )}?`
      )
    ) {
      return;
    }

    try {
      const res = await api.deleteCashHandover(item.id);
      if (res && res.success) {
        setHistoryList((prev) => prev.filter((h) => h.id !== item.id));
      } else {
        alert(res?.message || 'Không thể xóa biên bản này');
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa biên bản');
    }
  };

  // In phiếu kiểm tiền
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const displayList = filterNonZero
    ? DENOMINATIONS.filter((d) => (counts[d.value] || 0) > 0)
    : DENOMINATIONS;

  const currentEmpName = employee?.shortName || employee?.name || 'Nhân viên';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto max-h-[96vh] flex flex-col print:border-none print:shadow-none print:max-w-none print:p-0">
        {/* ================= HEADER (Ẩn khi in) ================= */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Calculator className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Két Tiền & Bàn Giao Ca Sau
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  1k - 500k
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Đếm tiền theo mệnh giá • Bàn giao ca sau • Thống kê lưu trữ lịch sử
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
            title="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================= TAB NAVIGATION ================= */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl mb-3 shrink-0 print:hidden">
          <button
            type="button"
            onClick={() => {
              setActiveTab('counter');
              setShowHandoverForm(false);
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'counter' && !showHandoverForm
                ? 'bg-white text-emerald-800 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Bảng Đếm Tiền Mặt</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('counter');
              setShowHandoverForm(true);
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'counter' && showHandoverForm
                ? 'bg-white text-emerald-800 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Giao Tiền Ca Sau</span>
            {totalAmount > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('history');
              setShowHandoverForm(false);
            }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-emerald-800 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Lịch Sử Bàn Giao</span>
            {historyList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                {historyList.length}
              </span>
            )}
          </button>
        </div>

        {/* Tiêu đề in phiếu chuyên nghiệp (Chỉ hiện khi in) */}
        <div className="hidden print:block text-center pb-4 mb-4 border-b border-slate-300">
          <h2 className="text-xl font-black uppercase">KYODO FOOD - CƠ SỞ TRƯNG NỮ VƯƠNG</h2>
          <h3 className="text-base font-bold mt-1">BIÊN BẢN KIỂM ĐẾM TIỀN MẶT BÀN GIAO CA</h3>
          <p className="text-xs text-slate-600 mt-1">
            Người bàn giao: {employee?.name} ({employee?.username || employee?.code}) • Thời gian:{' '}
            {formatDateVN(new Date())}
          </p>
        </div>

        {/* ================= KHUNG TỔNG KẾT TIỀN MẶT (STICKY HEADER) ================= */}
        <div className="mb-3.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-lg shadow-emerald-700/20 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-2.5">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200 block">
                Tổng Tiền Mặt Hiện Có Trong Két:
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight flex items-baseline gap-1 mt-0.5">
                <span>{formatVND(totalAmount)}</span>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-xs">
              <span className="text-[11px] font-bold text-emerald-100">Tổng Số Tờ:</span>
              <span className="text-lg font-black font-mono text-white">
                {totalBills} <span className="text-xs font-normal text-emerald-200">tờ</span>
              </span>
            </div>
          </div>

          {/* Đọc số tiền bằng chữ tiếng Việt */}
          <div className="pt-2 flex items-start gap-1.5 text-xs text-emerald-100 leading-snug">
            <span className="font-bold text-emerald-300 shrink-0">Bằng chữ:</span>
            <span className="font-medium italic text-white drop-shadow-2xs">
              {convertVNDToWords(totalAmount)}
            </span>
          </div>

          {/* Phân tách Tiền Chẵn & Tiền Lẻ */}
          <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-white/10 text-[11px]">
            <div className="flex items-center justify-between bg-black/15 px-2.5 py-1 rounded-lg">
              <span className="text-emerald-200 flex items-center gap-1">
                <Banknote className="w-3.5 h-3.5" />
                <span>Tiền chẵn (≥100k):</span>
              </span>
              <span className="font-mono font-bold text-white">
                {formatVND(largeAmount)} ({largeBills} tờ)
              </span>
            </div>
            <div className="flex items-center justify-between bg-black/15 px-2.5 py-1 rounded-lg">
              <span className="text-emerald-200 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                <span>Tiền lẻ (≤50k):</span>
              </span>
              <span className="font-mono font-bold text-white">
                {formatVND(smallAmount)} ({smallBills} tờ)
              </span>
            </div>
          </div>
        </div>

        {/* ================= NỘI DUNG CHÍNH THEO TAB ================= */}
        {activeTab === 'counter' && !showHandoverForm && (
          <>
            {/* Thanh công cụ phụ (Ghi chú mục đích, lọc, thao tác nhanh) */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs shrink-0 print:hidden">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Mục đích:</span>
                <input
                  type="text"
                  value={shiftNote}
                  onChange={(e) => setShiftNote(e.target.value)}
                  placeholder="Ví dụ: Tiền két đầu ca, kiểm tiền bàn giao..."
                  className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-full max-w-xs"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterNonZero(!filterNonZero)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    filterNonZero
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Chỉ hiển thị những mệnh giá đã có số lượng"
                >
                  {filterNonZero ? 'Hiển thị tất cả' : 'Chỉ xem mệnh giá có tiền'}
                </button>

                <button
                  type="button"
                  onClick={handleResetAll}
                  className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-bold border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                  title="Đặt lại tất cả các mệnh giá về 0"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Xóa trắng</span>
                </button>
              </div>
            </div>

            {/* DANH SÁCH 9 MỆNH GIÁ */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
              {displayList.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Chưa có mệnh giá nào được nhập số tờ.
                </div>
              ) : (
                displayList.map((denom) => {
                  const count = counts[denom.value] || 0;
                  const subtotal = count * denom.value;

                  return (
                    <div
                      key={denom.value}
                      className={`p-2.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        count > 0
                          ? `${denom.borderClass} ${denom.activeBg} shadow-xs`
                          : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                      }`}
                    >
                      {/* Cột trái: Mệnh giá Badge */}
                      <div className="flex items-center gap-2 min-w-[140px]">
                        <span
                          className={`px-3 py-1.5 rounded-xl border font-black font-mono text-xs sm:text-sm whitespace-nowrap shadow-2xs ${denom.badgeClass}`}
                        >
                          {denom.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase hidden sm:inline">
                          {denom.type}
                        </span>
                      </div>

                      {/* Cột giữa: Bộ phím nhập số tờ + stepper */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Nút giảm -1 */}
                        <button
                          type="button"
                          onClick={() => stepCount(denom.value, -1)}
                          disabled={count <= 0}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-black text-sm flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs"
                          title="Giảm 1 tờ"
                        >
                          -
                        </button>

                        {/* Ô nhập số tờ trực tiếp */}
                        <div className="relative w-20 sm:w-24">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={count === 0 ? '' : count}
                            onChange={(e) => updateCount(denom.value, e.target.value)}
                            placeholder="0"
                            className="w-full text-center py-1 rounded-xl bg-white border border-slate-300 font-mono font-black text-slate-900 text-sm sm:text-base focus:ring-2 focus:ring-emerald-500 focus:outline-hidden shadow-inner"
                          />
                        </div>

                        {/* Nút tăng +1 */}
                        <button
                          type="button"
                          onClick={() => stepCount(denom.value, 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-black text-sm flex items-center justify-center cursor-pointer shadow-2xs"
                          title="Tăng 1 tờ"
                        >
                          +
                        </button>

                        {/* Phím bấm nhanh (+5, +10, +50, +100) */}
                        <div className="flex items-center gap-1">
                          {[5, 10, 50, 100].map((step) => (
                            <button
                              key={step}
                              type="button"
                              onClick={() => stepCount(denom.value, step)}
                              className="px-1.5 py-0.5 rounded-md bg-white hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 text-[10px] font-bold border border-slate-200 shadow-2xs cursor-pointer transition-colors"
                              title={`Thêm +${step} tờ`}
                            >
                              +{step}
                            </button>
                          ))}
                        </div>

                        {/* Nút xóa nhanh dòng này */}
                        {count > 0 && (
                          <button
                            type="button"
                            onClick={() => updateCount(denom.value, 0)}
                            className="p-1 rounded-md text-slate-300 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors ml-1"
                            title="Đặt lại mệnh giá này về 0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Cột phải: Thành tiền của mệnh giá */}
                      <div className="text-right min-w-[120px] self-end sm:self-center">
                        <span className="text-[10px] text-slate-400 block sm:hidden">Thành tiền:</span>
                        <span
                          className={`font-mono font-black text-xs sm:text-sm ${
                            count > 0 ? 'text-slate-900' : 'text-slate-400'
                          }`}
                        >
                          {formatVND(subtotal)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Thanh tác vụ dưới chân modal (Bảng đếm) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 mt-3 border-t border-slate-100 shrink-0 print:hidden">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-900 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap"
                  title="Sao chép toàn bộ danh sách tiền đã đếm để dán gửi Zalo"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Đã Sao Chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao Chép (Zalo)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                  title="In biên bản kiểm đếm tiền mặt"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>In Phiếu</span>
                </button>
              </div>

              {/* NÚT BẤM GIAO TIỀN CA SAU THEO YÊU CẦU NGƯỜI DÙNG */}
              <button
                type="button"
                onClick={() => setShowHandoverForm(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap active:scale-98"
              >
                <Share2 className="w-4 h-4" />
                <span>Giao Tiền Ca Sau ➔</span>
              </button>
            </div>
          </>
        )}

        {/* ================= GIAO DIỆN BÀN GIAO TIỀN CA SAU ================= */}
        {activeTab === 'counter' && showHandoverForm && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {lastSubmittedHandover ? (
              /* THÔNG BÁO BÀN GIAO THÀNH CÔNG */
              <div className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-5 text-center space-y-3 animate-in fade-in">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-base font-black text-emerald-900">
                    Bàn Giao Tiền Ca Sau Thành Công!
                  </h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    Đã lưu biên bản bàn giao{' '}
                    <strong className="font-black text-emerald-900">
                      {formatVND(lastSubmittedHandover.totalAmount)}
                    </strong>{' '}
                    cho{' '}
                    <strong className="font-black text-emerald-900">
                      {lastSubmittedHandover.receiverName}
                    </strong>
                    .
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">
                    Hệ thống đã tự động gửi thông báo xác nhận tới Quản Lý qua Telegram & Zalo.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleCopyHandoverSlip(lastSubmittedHandover)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao Chép Phiếu Gửi Zalo</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In Biên Bản</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLastSubmittedHandover(null);
                      setActiveTab('history');
                      setShowHandoverForm(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Xem Lịch Sử Bàn Giao</span>
                  </button>
                </div>
              </div>
            ) : (
              /* FORM ĐIỀN THÔNG TIN BÀN GIAO */
              <form onSubmit={handleSubmitHandover} className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowHandoverForm(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    ← Quay lại bảng đếm tiền
                  </button>
                  <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
                    Xác Nhận Biên Bản Giao Tiền
                  </span>
                </div>

                {formError && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Người bàn giao (Cố định) */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                      1. Người Bàn Giao (Ca Hiện Tại):
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-800 block">
                          {currentEmpName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {employee?.username || employee?.code || 'Nhân viên Kyodo Food'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Người nhận tiền ca sau */}
                  <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
                    <label className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block mb-1">
                      2. Người Nhận Tiền Ca Sau: *
                    </label>
                    <select
                      value={receiverId}
                      onChange={(e) => {
                        setReceiverId(e.target.value);
                        if (e.target.value) {
                          const f = employeeList.find(
                            (emp) => emp.id === e.target.value || emp.username === e.target.value
                          );
                          setReceiverCustomName(f ? f.shortName || f.name : '');
                        } else {
                          setReceiverCustomName('');
                        }
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- Chọn nhân viên ca sau --</option>
                      <option value="admin">Quản Lý Cửa Hàng / Két Chính</option>
                      {employeeList
                        .filter(
                          (emp) =>
                            emp.id !== employee?.id && emp.username !== employee?.username
                        )
                        .map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({emp.shortName || emp.username})
                          </option>
                        ))}
                      <option value="other">Nhập tên khác...</option>
                    </select>

                    {receiverId === 'other' && (
                      <input
                        type="text"
                        value={receiverCustomName}
                        onChange={(e) => setReceiverCustomName(e.target.value)}
                        placeholder="Nhập tên người nhận tiền..."
                        className="w-full mt-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-bold text-slate-800"
                      />
                    )}
                  </div>
                </div>

                {/* Ca làm bàn giao */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    3. Phiên / Ca Bàn Giao:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SHIFT_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setShiftChoice(preset)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          shiftChoice === preset
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {shiftChoice === 'Khác' && (
                    <input
                      type="text"
                      value={customShiftName}
                      onChange={(e) => setCustomShiftName(e.target.value)}
                      placeholder="Nhập tên ca làm bàn giao..."
                      className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold"
                    />
                  )}
                </div>

                {/* Tóm tắt tiền bàn giao */}
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-600">Tổng tiền bàn giao:</span>
                    <span className="font-mono text-base font-black text-emerald-800">
                      {formatVND(totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Tổng số tờ:</span>
                    <span className="font-mono font-bold text-slate-700">{totalBills} tờ</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 italic border-t border-emerald-200/60 pt-1">
                    Bằng chữ: {convertVNDToWords(totalAmount)}
                  </div>
                </div>

                {/* Ghi chú */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                    4. Ghi Chú Khi Bàn Giao (Tùy chọn):
                  </label>
                  <input
                    type="text"
                    value={handoverNote}
                    onChange={(e) => setHandoverNote(e.target.value)}
                    placeholder="Ví dụ: Đã kiểm khớp ca, tiền lẻ còn nhiều..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* Nút hành động */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowHandoverForm(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Hủy
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || totalAmount <= 0}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black shadow-md shadow-emerald-600/25 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Đang gửi...' : 'Xác Nhận Bàn Giao Ca Sau'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ================= TAB 2: LỊCH SỬ BÀN GIAO TIỀN ================= */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {/* Bộ lọc tháng & phạm vi */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500">Tháng:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800"
                >
                  <option value="2026-11">Tháng 11/2026</option>
                  <option value="2026-12">Tháng 12/2026</option>
                  <option value="2027-01">Tháng 01/2027</option>
                  <option value="2026-10">Tháng 10/2026</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOnlyMyHandovers(!onlyMyHandovers)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    onlyMyHandovers
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {onlyMyHandovers ? 'Chỉ ca của tôi' : 'Tất cả ca cửa hàng'}
                </button>

                <button
                  type="button"
                  onClick={loadHistory}
                  className="p-1 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                  title="Tải lại danh sách"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Thống kê tổng hợp trong tháng */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700 block uppercase">
                  Tổng Bàn Giao
                </span>
                <span className="text-sm sm:text-base font-black font-mono text-emerald-900 mt-0.5 block">
                  {formatVND(historyStats.totalAmount)}
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Số Ca Giao</span>
                <span className="text-sm sm:text-base font-black font-mono text-slate-800 mt-0.5 block">
                  {historyStats.count} <span className="text-[10px] font-normal">lượt</span>
                </span>
              </div>
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Tổng Số Tờ</span>
                <span className="text-sm sm:text-base font-black font-mono text-slate-800 mt-0.5 block">
                  {historyStats.totalBills} <span className="text-[10px] font-normal">tờ</span>
                </span>
              </div>
            </div>

            {/* Danh sách các lần giao tiền */}
            {historyLoading ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Đang tải dữ liệu lịch sử bàn giao...
              </div>
            ) : historyList.length === 0 ? (
              <div className="text-center py-10 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                Chưa có biên bản giao tiền nào trong {formatMonthVN(selectedMonth)}.
              </div>
            ) : (
              <div className="space-y-2.5">
                {historyList.map((item) => {
                  const isSuccessCopied = copySlipSuccessId === item.id;
                  const isCurrentAuthor =
                    employee?.id === item.giverId ||
                    employee?.username === item.giverCode ||
                    employee?.role === 'admin';

                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-xs space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                            {item.shift || 'Giao ca'}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-700">
                            {item.time || ''} • {formatDateVN(item.date)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <span className="text-sm sm:text-base font-black font-mono text-emerald-700">
                            {formatVND(item.totalAmount)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({item.totalBills || 0} tờ)
                          </span>
                        </div>
                      </div>

                      {/* Người giao ➔ Người nhận */}
                      <div className="flex items-center justify-between text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{item.giverName}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-emerald-800">{item.receiverName}</span>
                        </div>

                        {item.note && (
                          <span className="text-[11px] text-slate-400 italic truncate max-w-[200px]">
                            {item.note}
                          </span>
                        )}
                      </div>

                      {/* Tác vụ với biên bản */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <button
                          type="button"
                          onClick={() => setViewDetailItem(item)}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Chi tiết mệnh giá</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyHandoverSlip(item)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            title="Sao chép phiếu này để dán Zalo"
                          >
                            {isSuccessCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-600">Đã chép</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Sao chép</span>
                              </>
                            )}
                          </button>

                          {isCurrentAuthor && (
                            <button
                              type="button"
                              onClick={() => handleDeleteHandover(item)}
                              className="p-1 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Xóa biên bản này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= MODAL XEM CHI TIẾT MỆNH GIÁ CỦA 1 BIÊN BẢN ================= */}
        {viewDetailItem && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
            <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-3 animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h4 className="text-sm font-black text-slate-900">Chi Tiết Mệnh Giá Bàn Giao</h4>
                  <p className="text-[11px] text-slate-500">
                    {viewDetailItem.giverName} ➔ {viewDetailItem.receiverName} •{' '}
                    {formatDateVN(viewDetailItem.date)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewDetailItem(null)}
                  className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bảng kê mệnh giá */}
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 text-xs">
                {DENOMINATIONS.map((d) => {
                  const b = viewDetailItem.breakdown || {};
                  const count = b[d.value] || b[String(d.value)] || 0;
                  if (count === 0) return null;
                  const subtotal = count * d.value;

                  return (
                    <div
                      key={d.value}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <span className="font-black font-mono text-slate-800">{d.label}</span>
                      <span className="text-slate-500 font-mono font-semibold">
                        {count} <span className="text-[10px]">tờ</span>
                      </span>
                      <span className="font-black font-mono text-slate-900">
                        {formatVND(subtotal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 block">
                    Tổng Tiền Bàn Giao:
                  </span>
                  <span className="text-xs text-emerald-600 italic">
                    {viewDetailItem.amountInWords || convertVNDToWords(viewDetailItem.totalAmount)}
                  </span>
                </div>
                <span className="text-base font-black font-mono text-emerald-900">
                  {formatVND(viewDetailItem.totalAmount)}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyHandoverSlip(viewDetailItem)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Sao Chép Báo Cáo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewDetailItem(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chữ ký khi in biên bản */}
        <div className="hidden print:grid grid-cols-2 gap-8 text-center pt-8 mt-6 border-t border-slate-300 text-xs">
          <div>
            <span className="font-bold block uppercase">Người Kiểm Tiền / Bàn Giao</span>
            <span className="italic text-[10px] block mt-0.5">(Ký và ghi rõ họ tên)</span>
            <div className="h-16"></div>
            <span className="font-bold">{employee?.name}</span>
          </div>
          <div>
            <span className="font-bold block uppercase">Người Nhận Bàn Giao / Quản Lý</span>
            <span className="italic text-[10px] block mt-0.5">(Ký và ghi rõ họ tên)</span>
            <div className="h-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
