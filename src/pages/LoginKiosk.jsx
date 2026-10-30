// src/pages/LoginKiosk.jsx
import React, { useState, useEffect } from 'react';
import { 
  User, Lock, Sparkles, LogIn, Shield, Check, 
  AlertCircle, ArrowRight, MapPin, Eye, EyeOff, ShieldCheck,
  RefreshCw, ArrowDownCircle, CheckCircle2
} from 'lucide-react';
import { api } from '../utils/api';

export default function LoginKiosk({ 
  employees = [], 
  onLoginSubmit, 
  settings,
  appMode = 'all', // 'all' | 'employee' | 'manager'
  onSwitchMode
}) {
  const [activeTab, setActiveTab] = useState(appMode === 'manager' ? 'admin' : 'employee');
  const [username, setUsername] = useState('UTNVTNV');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Trạng thái kiểm tra và cập nhật phiên bản mới (Dành cho nhân viên chủ động cập nhật)
  const [updateStatus, setUpdateStatus] = useState(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updatingApp, setUpdatingApp] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  const checkAppUpdate = async () => {
    try {
      setCheckingUpdate(true);
      const res = await api.checkUpdate();
      setUpdateStatus(res);
      if (res.hasUpdate) {
        setUpdateMsg(`Đã có bản cập nhật mới v${res.latestVersion}!`);
      } else {
        setUpdateMsg('Phần mềm đang ở bản mới nhất.');
      }
    } catch (err) {
      console.warn('Lỗi kiểm tra cập nhật:', err.message);
    } finally {
      setCheckingUpdate(false);
    }
  };

  useEffect(() => {
    checkAppUpdate();
  }, []);

  const handleApplyUpdate = async () => {
    if (!window.confirm('Ứng dụng sẽ tự động tải bản cập nhật mới từ GitHub mà không làm mất dữ liệu chấm công. Bạn có muốn tiếp tục?')) return;
    try {
      setUpdatingApp(true);
      setError('');
      const res = await api.applyUpdate();
      alert('🎉 ' + res.message);
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Lỗi khi cập nhật phần mềm');
    } finally {
      setUpdatingApp(false);
    }
  };

  useEffect(() => {
    if (appMode === 'manager') setActiveTab('admin');
    else if (appMode === 'employee') setActiveTab('employee');
  }, [appMode]);

  // Xử lý submit đăng nhập nhân viên
  const handleEmployeeLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Vui lòng nhập tên tài khoản (ví dụ: UTNVTNV hoặc BAONVTNV)!');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu của bạn!');
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
      setError(err.message || 'Mật khẩu Quản trị không chính xác! Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Chọn nhanh tài khoản nhân viên (Út hoặc Bảo) - KHÔNG ĐIỀN MẬT KHẨU ĐỂ BẢO MẬT
  const quickSelectEmployee = (emp) => {
    setUsername(emp.username || emp.code);
    setPassword(''); // Mật khẩu để trống để mỗi người tự nhập
    setError('');
  };

  const isEmployeeOnly = appMode === 'employee';
  const isManagerOnly = appMode === 'manager';

  // Xác định nhân viên đang được chọn có đang dùng mật khẩu khởi tạo mặc định 1234 hay đã đổi mật khẩu
  const selectedEmp = employees.find(e => 
    (e.username && e.username.toUpperCase() === username.toUpperCase()) ||
    (e.code && e.code.toUpperCase() === username.toUpperCase())
  );
  const isDefaultPassword = selectedEmp ? selectedEmp.isDefaultPassword : true;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      
      {/* Hero Store Greeting */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-bold mb-3 border border-red-200">
          <MapPin className="w-4 h-4" />
          <span>Kyodo Food • Cơ Sở Trưng Nữ Vương, Đà Nẵng</span>
        </div>

        {isEmployeeOnly ? (
          <>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Hệ Thống <span className="text-red-600">Nhân Viên Chấm Công</span>
            </h2>
            <p className="text-slate-600 mt-2 max-w-xl mx-auto text-sm sm:text-base">
              Mỗi nhân viên tự đăng nhập tài khoản riêng biệt để chấm công và theo dõi số giờ làm việc.
            </p>
          </>
        ) : isManagerOnly ? (
          <>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Cổng Quản Trị & <span className="text-amber-600">Bảng Tính Lương</span>
            </h2>
            <p className="text-slate-600 mt-2 max-w-xl mx-auto text-sm sm:text-base">
              Dành riêng cho Chủ cửa hàng quản lý nhân sự, xem chi tiết bảng công và duyệt chi lương.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Hệ Thống Chấm Công & <span className="text-red-600">Quản Lý Nhân Sự</span>
            </h2>
            <p className="text-slate-600 mt-2 max-w-xl mx-auto text-sm sm:text-base">
              Đăng nhập tài khoản nhân viên để chấm công hoặc tài khoản Quản lý để xem bảng lương.
            </p>
          </>
        )}
      </div>

      {/* THÔNG BÁO CẬP NHẬT PHIÊN BẢN MỚI (DÀNH CHO NHÂN VIÊN CHỦ ĐỘNG CẬP NHẬT) */}
      {updateStatus?.hasUpdate && (
        <div className="mb-8 p-5 rounded-3xl bg-linear-to-r from-red-600 via-amber-600 to-red-600 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <div className="font-black text-sm sm:text-base flex items-center gap-2">
                <span>Đã có phiên bản cập nhật mới (v{updateStatus.latestVersion})!</span>
                <span className="px-2 py-0.5 rounded-full bg-white text-red-700 text-[10px] font-black uppercase tracking-wider">Mới</span>
              </div>
              <p className="text-xs text-red-100 mt-0.5">
                Quản lý tại Nghệ An vừa cập nhật tính năng mới lên GitHub. Bấm nút bên cạnh để cập nhật ngay.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleApplyUpdate}
            disabled={updatingApp}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-amber-50 active:scale-95 text-red-700 font-black text-xs sm:text-sm shadow-md transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
          >
            {updatingApp ? (
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ArrowDownCircle className="w-4 h-4" />
                <span>Cập Nhật Ngay</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Quick Select Staff Cards (Chỉ hiện khi đăng nhập Nhân Viên) */}
      {activeTab === 'employee' && (
        <div className="mb-8">
          <div className="text-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Chọn Tài Khoản Của Bạn (Mỗi Nhân Viên Tự Nhập Mật Khẩu)
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
                    <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Cơ sở Trưng Nữ Vương</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Login Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 max-w-md mx-auto">
        
        {/* Tab Switcher (Chỉ hiển thị khi ở chế độ tổng hợp 'all') */}
        {appMode === 'all' && (
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
        )}

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
                Tài khoản: <strong>UTNVTNV</strong> (Út) hoặc <strong>BAONVTNV</strong> (Bảo)
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                Mật Khẩu Cá Nhân:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder={isDefaultPassword ? "Mật khẩu khởi tạo: 1234" : "Nhập mật khẩu riêng của bạn..."}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-mono tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {isDefaultPassword ? (
                <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                  <span>🔑 Tài khoản mới khởi tạo • Mật khẩu ban đầu: <strong>1234</strong> (Hãy đổi mật khẩu sau khi đăng nhập)</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 font-semibold mt-1 flex items-center gap-1">
                  <span>🔒 Tài khoản đã đặt mật khẩu riêng. Mật khẩu mặc định 1234 không còn hiệu lực.</span>
                </p>
              )}
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
              <span className="font-bold">Dành cho Chủ Cửa Hàng:</span> Xem bảng lương chi tiết từng nhân viên, sửa mức lương, cấp tài khoản và xuất file Excel.
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider">
                Mật Khẩu Quản Trị (Admin):
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showAdminPassword ? "text" : "password"}
                  required
                  placeholder="Nhập mật khẩu quản trị..."
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-mono tracking-widest text-center"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
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
                  <span>Đăng Nhập Quản Lý & Bảng Lương</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>

      {/* Nút kiểm tra cập nhật chủ động dành cho Nhân Viên */}
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs no-print">
        <button
          type="button"
          onClick={checkAppUpdate}
          disabled={checkingUpdate}
          className="text-slate-600 hover:text-red-600 flex items-center gap-2 font-bold transition-all py-2.5 px-4 rounded-2xl hover:bg-slate-50 border border-slate-200/80 shadow-2xs cursor-pointer bg-white"
          title="Bấm để kiểm tra xem Quản lý tại Nghệ An đã cập nhật phần mềm mới lên GitHub chưa"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${checkingUpdate ? 'animate-spin text-red-600' : ''}`} />
          <span>{checkingUpdate ? 'Đang kiểm tra từ GitHub...' : (updateMsg || 'Kiểm Tra Bản Cập Nhật Mới')}</span>
        </button>

        {updateStatus?.hasUpdate && (
          <button
            type="button"
            onClick={handleApplyUpdate}
            disabled={updatingApp}
            className="text-xs font-black py-2 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
            <span>Cập Nhật Bản Mới Ngay (v{updateStatus.latestVersion})</span>
          </button>
        )}
      </div>

    </div>
  );
}
