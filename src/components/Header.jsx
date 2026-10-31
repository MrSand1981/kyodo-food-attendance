// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { Clock, Shield, LogOut, MapPin, RefreshCw, Sparkles, ArrowDownCircle } from 'lucide-react';
import { api } from '../utils/api';

export default function Header({ 
  currentUser, 
  currentRole, 
  onLogout, 
  onAdminClick, 
  onBackToLogin,
  settings,
  appMode = 'all' // 'all' | 'employee' | 'manager'
}) {
  const [time, setTime] = useState(new Date());
  const [updateInfo, setUpdateInfo] = useState(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const checkHeaderUpdate = async (silent = true) => {
    try {
      setIsCheckingUpdate(true);
      const res = await api.checkUpdate();
      setUpdateInfo(res);
      if (!silent) {
        if (res.hasUpdate) {
          if (window.confirm(`🎉 Phần mềm đã có phiên bản mới (v${res.latestVersion})!\nBạn có muốn cập nhật ngay bây giờ để sử dụng các tính năng mới không? (Dữ liệu chấm công được bảo toàn 100%)`)) {
            applyHeaderUpdate();
          }
        } else {
          alert(`Phần mềm đang ở phiên bản mới nhất (v${res.currentVersion}).`);
        }
      }
    } catch (err) {
      if (!silent) alert(`Lỗi kiểm tra cập nhật: ${err.message}`);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const applyHeaderUpdate = async () => {
    try {
      setIsUpdating(true);
      const res = await api.applyUpdate();
      alert('🎉 ' + res.message);
      window.location.reload();
    } catch (err) {
      alert(`Lỗi khi cập nhật phần mềm: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    checkHeaderUpdate(true);
    const handleFocus = () => checkHeaderUpdate(true);
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(() => checkHeaderUpdate(true), 60000);
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const formatVietnameseDate = (date) => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[date.getDay()];
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${dayName}, ${d}/${m}/${y}`;
  };

  const formatVietnameseTime = (date) => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return { h, m, s };
  };

  const { h, m, s } = formatVietnameseTime(time);
  const logoUrl = settings?.logoUrl || '/logo-kyodo.png';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print w-full">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 gap-2 sm:gap-4">
          
          {/* Logo & Store Branding */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div 
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group"
              onClick={onBackToLogin}
              title="Về màn hình đăng nhập"
            >
              <div className="relative w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 p-0.5 flex items-center justify-center overflow-hidden shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <img 
                  src={logoUrl} 
                  alt="Kyodo Food Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <span className="hidden font-bold text-amber-600 text-sm">KF</span>
              </div>
              
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors whitespace-nowrap">
                    {settings?.storeName || 'KYODO FOOD'}
                  </h1>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 rounded-md flex items-center gap-1 whitespace-nowrap shrink-0">
                    <MapPin className="w-2.5 h-2.5" />
                    Trưng Nữ Vương
                  </span>
                </div>
                <p className="hidden md:block text-[10px] text-slate-500 font-medium truncate max-w-[200px] lg:max-w-none whitespace-nowrap">
                  {settings?.tagline || 'Cửa hàng Kyodo Food - Trưng Nữ Vương, Đà Nẵng'}
                </p>
              </div>
            </div>
          </div>

          {/* Live Digital Vietnamese Clock & Update status */}
          <div className="hidden sm:flex items-center justify-center gap-2 lg:gap-2.5 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 border border-slate-200 px-2.5 sm:px-3 py-1 rounded-xl shadow-inner">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 animate-pulse shrink-0" />
              <div className="flex items-baseline gap-0.5 font-mono whitespace-nowrap">
                <span className="text-base sm:text-lg font-bold text-slate-900">{h}</span>
                <span className="text-base sm:text-lg font-bold text-amber-500 animate-pulse">:</span>
                <span className="text-base sm:text-lg font-bold text-slate-900">{m}</span>
                <span className="text-xs font-semibold text-slate-500">:{s}</span>
              </div>
              <div className="hidden lg:block h-4 w-px bg-slate-200 mx-0.5"></div>
              <span className="hidden lg:inline text-xs font-semibold text-slate-600 whitespace-nowrap">
                {formatVietnameseDate(time)}
              </span>
            </div>

            {/* Nút cập nhật phiên bản nhanh trong Header */}
            {updateInfo?.hasUpdate ? (
              <button
                type="button"
                onClick={applyHeaderUpdate}
                disabled={isUpdating}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-2xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-extrabold shadow-sm animate-pulse transition-all cursor-pointer shrink-0 whitespace-nowrap"
                title={`Phần mềm đã có phiên bản mới (v${updateInfo.latestVersion})! Nhấn để cập nhật ngay.`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span className="whitespace-nowrap">Cập Nhật (v{updateInfo.latestVersion})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => checkHeaderUpdate(false)}
                disabled={isCheckingUpdate}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-extrabold text-amber-900 transition-all cursor-pointer shrink-0 whitespace-nowrap shadow-2xs"
                title="Bấm để kiểm tra xem có bản cập nhật mới hay chưa"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-700 ${isCheckingUpdate ? 'animate-spin text-amber-800' : ''}`} />
                <span className="whitespace-nowrap">Bản v{updateInfo?.currentVersion || '1.5.0'}</span>
              </button>
            )}
          </div>

          {/* User Status / Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {currentRole === 'employee' && currentUser && (
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-black text-slate-900 whitespace-nowrap">
                    {currentUser.shortName || currentUser.name} ({currentUser.username || currentUser.code})
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">
                    Nhân viên • Trưng Nữ Vương
                  </div>
                </div>
                <img 
                  src={currentUser.avatar || (currentUser.gender === 'Nữ' ? '/avatar-female.svg' : '/avatar-male.svg')} 
                  alt={currentUser.shortName || currentUser.name} 
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-amber-500 shrink-0 bg-slate-50" 
                />
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-all border border-slate-200 cursor-pointer shrink-0 whitespace-nowrap"
                  title="Đăng xuất tài khoản"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            )}

            {currentRole === 'admin' && (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold whitespace-nowrap shrink-0">
                  <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Quản Lý Cửa Hàng (Admin)</span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-semibold text-slate-700 hover:text-amber-700 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 shrink-0 whitespace-nowrap cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}

            {!currentRole && appMode !== 'employee' && (
              <div className="flex items-center shrink-0">
                <button
                  onClick={onAdminClick}
                  className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold text-slate-700 hover:text-amber-800 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl transition-all shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
                  title="Đăng nhập tài khoản Quản Lý"
                >
                  <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="whitespace-nowrap">Chủ Cửa Hàng (Admin)</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
