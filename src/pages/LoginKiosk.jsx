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
    const handleFocus = () => checkAppUpdate();
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(checkAppUpdate, 60000); // Tự động kiểm tra mỗi 1 phút
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
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
    <div className="w-full max-w-4xl mx-auto px-4 py-1.5 sm:py-3 my-auto flex flex-col items-center justify-center">
      
      {/* Hero Store Greeting */}
      <div className="text-center mb-2 sm:mb-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-1.5 border border-amber-200">
          <MapPin className="w-3.5 h-3.5" />
          <span>Kyodo Food • Cơ Sở Trưng Nữ Vương, Đà Nẵng</span>
        </div>

        {activeTab === 'employee' || isEmployeeOnly ? (
          <>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Trang Quản Lý <span className="text-amber-600">Chấm Công</span>
            </h2>
            <p className="text-slate-600 mt-0.5 sm:mt-1 max-w-xl mx-auto text-xs sm:text-sm">
              Mỗi nhân viên tự đăng nhập tài khoản riêng biệt để chấm công và theo dõi số giờ làm việc.
            </p>
          </>
        ) : isManagerOnly ? (
          <>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Cổng Quản Trị & <span className="text-amber-600">Bảng Tính Lương</span>
            </h2>
            <p className="text-slate-600 mt-0.5 sm:mt-1 max-w-xl mx-auto text-xs sm:text-sm">
              Dành riêng cho Chủ cửa hàng quản lý nhân sự, xem chi tiết bảng công và duyệt chi lương.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Trang Quản Lý <span className="text-amber-600">Chấm Công</span>
            </h2>
            <p className="text-slate-600 mt-0.5 sm:mt-1 max-w-xl mx-auto text-xs sm:text-sm">
              Đăng nhập tài khoản nhân viên để chấm công hoặc tài khoản Quản lý để xem bảng lương.
            </p>
          </>
        )}
      </div>

      {/* THÔNG BÁO CẬP NHẬT PHIÊN BẢN MỚI (DÀNH CHO NHÂN VIÊN CHỦ ĐỘNG CẬP NHẬT) */}
      {updateStatus?.hasUpdate && (
        <div className="w-full max-w-md mx-auto mb-2.5 sm:mb-3.5 p-3.5 sm:p-4 rounded-3xl bg-linear-to-r from-amber-500 via-amber-600 to-yellow-500 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="font-black text-sm flex items-center gap-2">
                <span>Phần mềm đã có phiên bản mới (v{updateStatus.latestVersion})!</span>
                <span className="px-2 py-0.5 rounded-full bg-white text-amber-800 text-[10px] font-black uppercase tracking-wider">Mới</span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                Phần mềm đã có phiên bản mới hãy nhấn cập nhật ngay để cập nhật các tính năng mới.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleApplyUpdate}
            disabled={updatingApp}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white hover:bg-amber-50 active:scale-95 text-amber-800 font-black text-xs shadow-md transition-all whitespace-nowrap cursor-pointer flex items-center justify-center gap-2"
          >
            {updatingApp ? (
              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
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
        <div className="w-full max-w-md mx-auto mb-2.5 sm:mb-3.5 flex flex-col items-center">
          <div className="text-center text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 whitespace-nowrap">
            Chọn Tài Khoản Của Bạn (Mỗi Nhân Viên Tự Nhập Mật Khẩu)
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full">
            {employees.map(emp => {
              const displayName = emp.shortName || emp.name;
              const isSelected = username.toUpperCase() === (emp.username || emp.code).toUpperCase();
              const avatarSrc = emp.avatar || (emp.gender === 'Nữ' ? '/avatar-female.svg' : '/avatar-male.svg');
              return (
                <div
                  key={emp.id}
                  onClick={() => quickSelectEmployee(emp)}
                  className={`p-2 sm:p-2.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-2.5 text-left ${
                    isSelected 
                      ? 'border-amber-500 bg-amber-50/80 shadow-sm scale-102 ring-2 ring-amber-500/20' 
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <img src={avatarSrc} alt={displayName} className="w-10 h-10 rounded-xl object-cover ring-2 ring-white shadow-xs shrink-0 bg-slate-50" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="text-sm font-extrabold text-slate-900 truncate whitespace-nowrap">
                        {displayName}
                      </h3>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-amber-700 font-bold font-mono truncate whitespace-nowrap">
                      TK: {emp.username || emp.code}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Login Card */}
      <div className="w-full bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200 max-w-md mx-auto">
        
        {/* Tab Switcher (Chỉ hiển thị khi ở chế độ tổng hợp 'all') */}
        {appMode === 'all' && (
          <div className="flex rounded-2xl bg-slate-100 p-1 mb-4">
            <button
              type="button"
              onClick={() => { setActiveTab('employee'); setError(''); }}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'employee' 
                  ? 'bg-white text-amber-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Nhân Viên</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('admin'); setError(''); }}
              className={`flex-1 py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'admin' 
                  ? 'bg-white text-amber-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span>Chủ Cửa Hàng (Admin)</span>
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form 1: Employee Login */}
        {activeTab === 'employee' && (
          <form onSubmit={handleEmployeeLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase text-[11px] tracking-wider whitespace-nowrap">
                Tài Khoản Nhân Viên:
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Chọn tài khoản ở trên hoặc nhập mã TK..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold font-mono text-sm uppercase text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase text-[11px] tracking-wider whitespace-nowrap">
                Mật Khẩu Cá Nhân:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="nhập mật khẩu để đăng nhập"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-mono tracking-widest"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-600/25 transition-all cursor-pointer mt-2 whitespace-nowrap"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Đăng Nhập Chấm Công</span>
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
              <label className="block font-bold text-slate-700 mb-1.5 uppercase text-[11px] tracking-wider whitespace-nowrap">
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
              className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 transition-all cursor-pointer whitespace-nowrap"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Đăng Nhập Quản Lý & Bảng Lương</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>

      {/* Nút kiểm tra cập nhật chủ động dành cho Nhân Viên */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs no-print w-full max-w-md mx-auto">
        <button
          type="button"
          onClick={checkAppUpdate}
          disabled={checkingUpdate}
          className="w-full sm:w-auto text-slate-600 hover:text-amber-700 flex items-center justify-center gap-2 font-bold transition-all py-2.5 px-4 rounded-2xl hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-200 shadow-2xs cursor-pointer bg-white whitespace-nowrap"
          title="Bấm để kiểm tra xem hệ thống đã có phiên bản phần mềm mới chưa"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 shrink-0 ${checkingUpdate ? 'animate-spin text-amber-600' : ''}`} />
          <span className="whitespace-nowrap">{checkingUpdate ? 'Đang kiểm tra từ GitHub...' : (updateMsg || 'Kiểm Tra Bản Cập Nhật Mới')}</span>
        </button>

        {updateStatus?.hasUpdate && (
          <button
            type="button"
            onClick={handleApplyUpdate}
            disabled={updatingApp}
            className="w-full sm:w-auto text-xs font-black py-2.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-pulse whitespace-nowrap"
          >
            <ArrowDownCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Cập Nhật Bản Mới Ngay (v{updateStatus.latestVersion})</span>
          </button>
        )}
      </div>

    </div>
  );
}
