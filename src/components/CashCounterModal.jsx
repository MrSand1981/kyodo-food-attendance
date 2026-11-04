// src/components/CashCounterModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import { DENOMINATIONS, formatVND, convertVNDToWords } from '../utils/currency';
import { formatDateVN } from '../utils/date';

const STORAGE_KEY = 'kyodo_cash_counter_counts_v1';

export default function CashCounterModal({ isOpen, onClose, employee }) {
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

  // Tự động lưu vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
    } catch (_) {}
  }, [counts]);

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

  // Sao chép báo cáo kiểm tiền để gửi Zalo / Telegram
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

  // In phiếu kiểm tiền
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const displayList = filterNonZero
    ? DENOMINATIONS.filter((d) => (counts[d.value] || 0) > 0)
    : DENOMINATIONS;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto max-h-[95vh] flex flex-col print:border-none print:shadow-none print:max-w-none print:p-0">
        {/* Header (Ẩn khi in phiếu) */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
              <Calculator className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Máy Tính & Đếm Tiền Mặt
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                  1k - 500k
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Nhập số tờ từng mệnh giá • Hệ thống tự động tính tổng tiền & đọc số thành chữ
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

        {/* Tiêu đề in phiếu chuyên nghiệp (Chỉ hiện khi in) */}
        <div className="hidden print:block text-center pb-4 mb-4 border-b border-slate-300">
          <h2 className="text-xl font-black uppercase">KYODO FOOD - CƠ SỞ TRƯNG NỮ VƯƠNG</h2>
          <h3 className="text-base font-bold mt-1">BIÊN BẢN KIỂM ĐẾM TIỀN MẶT BÀN GIAO CA</h3>
          <p className="text-xs text-slate-600 mt-1">
            Nhân viên: {employee?.name} ({employee?.username || employee?.code}) • Thời gian:{' '}
            {formatDateVN(new Date())}
          </p>
        </div>

        {/* KHUNG TỔNG KẾT TIỀN MẶT SIÊU NỔI BẬT (Sticky Header) */}
        <div className="mb-3.5 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-lg shadow-emerald-700/20 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-2.5">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200 block">
                Tổng Tiền Mặt Đã Đếm:
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

        {/* DANH SÁCH 9 MỆNH GIÁ (Cuộn nội bộ mượt mà) */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
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

        {/* Thanh tác vụ dưới chân modal (Ẩn khi in) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 mt-3 border-t border-slate-100 shrink-0 print:hidden">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyReport}
              className="flex-1 sm:flex-none px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-900 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap"
              title="Sao chép toàn bộ danh sách tiền đã đếm để dán gửi Zalo cho Quản lý"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Đã Sao Chép Báo Cáo!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao Chép Báo Cáo (Zalo/Telegram)</span>
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

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer whitespace-nowrap"
          >
            Hoàn Tất Đếm Tiền
          </button>
        </div>
      </div>
    </div>
  );
}
