// src/pages/LoginKiosk.jsx
import React, { useState } from 'react';
import { User, Lock, Sparkles, LogIn, Shield, Check, AlertCircle, ArrowRight, MapPin } from 'lucide-react';

export default function LoginKiosk({ 
  employees = [], 
  onLoginSubmit, 
  settings 
}) {
  const [activeTab, setActiveTab] = useState('employee'); // 'employee' | 'admin'
  const [username, setUsername] = useState('UTNVTNV');
  const [password, setPassword] = useState('1234');
  const [adminPassword, setAdminPassword] = useState('20162020');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Xử lý submit đăng nhập nhân viên
  const handleEmployeeLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Vui lòng nhập tên tài khoản (ví dụ: UTNVTNV hoặc BAONVTNV)!');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await onLoginSubmit({ username: username.trim(), password });
    } catch (err) {
      setError(err.message || 'Tài khoản hoặc mật khẩu không đúng!');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý submit đăng nhập admin
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminPassword.trim()) {
      setError('Vui lòng nhập mật khẩu Admin!');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await onLoginSubmit({ username: 'admin', password: adminPassword.trim() });
    } catch (err) {
      setError(err.message || 'Mật khẩu Admin không đúng (Mặc định: 20162020)!');
    } finally {
      setLoading(false);
    }
  };

  // Chọn nhanh nhân viên (Út hoặc Bảo)
  const quickSelectEmployee = (emp) => {
    setUsername(emp.username || emp.code);
    setPassword(emp.password || '1234');
    setError('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* Hero Store Greeting */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-bold mb-3 border border-red-200">
          <MapPin className="w-4 h-4" />
          <span>Kyodo Food • Cơ Sở Trưng Nữ Vương, Đà Nẵng</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Hệ Thống Chấm Công & <span className="text-red-600">Tính Giờ Làm Việc</span>
        </h2>
        <p className="text-slate-600 mt-2 max-w-xl mx-auto text-sm sm:text-base">
          Dành riêng cho nhân viên tự đăng nhập, ghi nhận giờ làm từng ngày và nhận kết quả tổng giờ làm việc cuối tháng.
        </p>
      </div>

      {/* Quick Select Staff Cards */}
      <div className="mb-8">
        <div className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Chọn Nhanh Tài Khoản Nhân Viên
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
          {employees.map(emp => {
            const isSelected = username.toUpperCase() === (emp.username || emp.code).toUpperCase();
            return (
              <div
                key={emp.id}
                onClick={() => quickSelectEmployee(emp)}
                className={`p-4 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                  isSelected 
                    ? 'border-red-500 bg-red-50/70 shadow-md scale-102' 
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {emp.avatar ? (
                  <img src={emp.avatar} alt={emp.name} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white shadow-xs" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-700 font-extrabold text-2xl flex items-center justify-center">
                    {emp.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-slate-900 truncate">
                      {emp.name}
                    </h3>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-red-600 font-bold font-mono">
                    TK: {emp.username || emp.code}
                  </div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">
                    Lương: <strong className="text-slate-800">{Number(emp.hourlyRate).toLocaleString()} đ/h</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 max-w-md mx-auto">
        
        {/* Tab Switcher */}
        <div className="flex rounded-2xl bg-slate-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => { setActiveTab('employee'); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'employee' 
                ? 'bg-white text-red-600 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Nhân Viên</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'admin' 
                ? 'bg-white text-amber-700 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Chủ Cửa Hàng (Admin)</span>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form 1: Employee Login */}
        {activeTab === 'employee' && (
          <form onSubmit={handleEmployeeLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                Tài Khoản Nhân Viên:
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: UTNVTNV hoặc BAONVTNV"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold font-mono text-sm uppercase text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Gợi ý: Tài khoản của Út là <strong>UTNVTNV</strong>, của Bảo là <strong>BAONVTNV</strong>
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                Mật Khẩu / Mã PIN:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  placeholder="Mật khẩu của bạn"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-mono tracking-widest"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-red-600/20 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Đăng Nhập Chấm Công</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Form 2: Admin Login (Mật khẩu: 20162020) */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs">
              <span className="font-bold">Dành cho Chủ Cửa Hàng:</span> Có toàn quyền xem bảng công tổng hợp, tạo tài khoản mới cho nhân viên và xuất file Excel.
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                Mật Khẩu Quản Trị (Admin):
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu: 20162020"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-mono tracking-widest text-center"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 text-center">
                Mật khẩu quản trị mặc định: <strong>20162020</strong>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Đăng Nhập Quản Lý Cửa Hàng</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>

    </div>
  );
}
