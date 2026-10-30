// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import { Clock, Shield, LogOut, MapPin } from 'lucide-react';

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

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Store Branding */}
          <div className="flex items-center gap-3">
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={onBackToLogin}
              title="Về màn hình đăng nhập"
            >
              <div className="relative w-12 h-12 rounded-xl bg-red-50 border border-red-100 p-1 flex items-center justify-center overflow-hidden shadow-xs group-hover:scale-105 transition-transform">
                <img 
                  src={logoUrl} 
                  alt="Kyodo Food Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <span className="hidden font-bold text-red-600 text-lg">KF</span>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-red-600 transition-colors">
                    {settings?.storeName || 'KYODO FOOD'}
                  </h1>
                  <span className="px-2 py-0.5 text-[11px] font-bold bg-red-100 text-red-700 rounded-md flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Trưng Nữ Vương
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {settings?.tagline || 'Cửa hàng Kyodo Food - Trưng Nữ Vương, Đà Nẵng'}
                </p>
              </div>
            </div>
          </div>

          {/* Live Digital Vietnamese Clock */}
          <div className="hidden md:flex items-center gap-4 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl shadow-inner">
            <Clock className="w-5 h-5 text-red-600 animate-pulse" />
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-2xl font-bold text-slate-900">{h}</span>
              <span className="text-2xl font-bold text-red-500 animate-pulse">:</span>
              <span className="text-2xl font-bold text-slate-900">{m}</span>
              <span className="text-sm font-semibold text-slate-500">:{s}</span>
            </div>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <span className="text-xs font-semibold text-slate-600">
              {formatVietnameseDate(time)}
            </span>
          </div>

          {/* User Status / Action Buttons */}
          <div className="flex items-center gap-3">
            {currentRole === 'employee' && currentUser && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-bold text-slate-900">
                    {currentUser.name} ({currentUser.username || currentUser.code})
                  </div>
                  <div className="text-xs text-slate-500 font-semibold">
                    Nhân viên • Trưng Nữ Vương
                  </div>
                </div>
                {currentUser.avatar ? (
                  <img 
                    src={currentUser.avatar} 
                    alt={currentUser.name} 
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-red-500" 
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center">
                    {currentUser.name.charAt(0)}
                  </div>
                )}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-200"
                  title="Đăng xuất tài khoản"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            )}

            {currentRole === 'admin' && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>Quản Lý Cửa Hàng (Admin)</span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-red-600 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}

            {!currentRole && appMode !== 'employee' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={onAdminClick}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-red-700 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-xl transition-all shadow-2xs"
                  title="Đăng nhập tài khoản Quản Lý (Mật khẩu: 20162020)"
                >
                  <Shield className="w-4 h-4 text-red-600" />
                  <span>Chủ Cửa Hàng (Admin)</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
