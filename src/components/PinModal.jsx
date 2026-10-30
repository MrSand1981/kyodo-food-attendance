// src/components/PinModal.jsx
import React, { useState, useEffect } from 'react';
import { Lock, X, Delete, Check, AlertCircle } from 'lucide-react';

export default function PinModal({
  isOpen,
  onClose,
  onSubmit,
  title = "Nhập Mã PIN Chấm Công",
  subtitle = "Vui lòng nhập 4 số PIN của bạn",
  targetUser = null,
  isAdmin = false
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError("");
      setLoading(false);
    }
  }, [isOpen]);

  // Lắng nghe bàn phím số vật lý
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 6) {
          handleDigit(e.key);
        }
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        if (pin.length >= 4) {
          handleSubmit();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin]);

  if (!isOpen) return null;

  const handleDigit = (digit) => {
    if (pin.length >= 6) return;
    setError("");
    const newPin = pin + digit;
    setPin(newPin);

    // Tự động submit khi đủ 4 số nếu không phải admin
    if (!isAdmin && newPin.length === 4) {
      triggerSubmit(newPin);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  const triggerSubmit = async (pinValue) => {
    try {
      setLoading(true);
      setError("");
      await onSubmit(pinValue);
    } catch (err) {
      setError(err.message || "Mã PIN không đúng, vui lòng thử lại!");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (pin.length < 4) {
      setError("Vui lòng nhập đủ mã PIN (tối thiểu 4 số)");
      return;
    }
    triggerSubmit(pin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-slate-100 transform transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-amber-100 text-amber-800'}`}>
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User preview if selecting an employee */}
        {targetUser && (
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 mb-5">
            <img 
              src={targetUser.avatar || (targetUser.gender === 'Nữ' ? '/avatar-female.svg' : '/avatar-male.svg')} 
              alt={targetUser.name} 
              className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-400 bg-slate-50" 
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">{targetUser.name}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <span className="font-semibold text-amber-700">{targetUser.code}</span>
                <span>•</span>
                <span>{targetUser.branch}</span>
                <span>•</span>
                <span className="truncate">{targetUser.role}</span>
              </div>
            </div>
          </div>
        )}

        {/* PIN Dots Indicator */}
        <div className="flex justify-center items-center gap-4 my-6">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-amber-500 scale-125 shadow-xs shadow-amber-300'
                    : 'bg-slate-200 scale-100'
                }`}
              />
            );
          })}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-amber-900 font-semibold mb-4 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Touch Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              disabled={loading}
              onClick={() => handleDigit(String(num))}
              className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-2xl font-bold text-slate-800 transition-all flex items-center justify-center border border-slate-200 shadow-2xs hover:scale-102"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            disabled={loading}
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-xs font-bold text-slate-600 transition-all flex items-center justify-center border border-slate-200"
          >
            Xóa hết
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleDigit("0")}
            className="h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-2xl font-bold text-slate-800 transition-all flex items-center justify-center border border-slate-200 shadow-2xs hover:scale-102"
          >
            0
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 transition-all flex items-center justify-center border border-slate-200"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Submit button (especially for admin or when 4 digits typed) */}
        <button
          type="button"
          disabled={loading || pin.length < 4}
          onClick={handleSubmit}
          className={`w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md ${
            pin.length >= 4 && !loading
              ? 'bg-amber-600 hover:bg-amber-700 active:scale-98 shadow-amber-600/25'
              : 'bg-slate-300 cursor-not-allowed text-slate-500'
          }`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Check className="w-5 h-5" />
              <span>Xác Nhận & Đăng Nhập</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-center text-slate-400 mt-3">
          (Mẹo: Bạn có thể gõ phím số trên bàn phím máy tính)
        </p>
      </div>
    </div>
  );
}
