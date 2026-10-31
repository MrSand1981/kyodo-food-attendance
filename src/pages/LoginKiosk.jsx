// src/pages/LoginKiosk.jsx
import React, { useState, useEffect } from 'react';
import { 
  User, Lock, Sparkles, LogIn, Shield, Check, 
  AlertCircle, ArrowRight, MapPin, Eye, EyeOff, ShieldCheck,
  RefreshCw, ArrowDownCircle, CheckCircle2, FileText,
  Mail, Phone, KeyRound, Settings, X, Copy, Send, HelpCircle
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
  const [adminCustomUsername, setAdminCustomUsername] = useState('Admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Trạng thái tài khoản Quản trị & Email/SĐT khôi phục
  const [adminStatus, setAdminStatus] = useState(null);

  // Modal 1: Quên mật khẩu Admin (1 chạm gửi/nhận mật khẩu mới)
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotResult, setForgotResult] = useState(null);
  const [forgotError, setForgotError] = useState('');

  // Modal 2: Đổi mật khẩu Admin
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [oldAdminPwd, setOldAdminPwd] = useState('');
  const [newAdminPwd, setNewAdminPwd] = useState('');
  const [confirmAdminPwd, setConfirmAdminPwd] = useState('');
  const [changePwdLoading, setChangePwdLoading] = useState(false);
  const [changePwdMsg, setChangePwdMsg] = useState('');
  const [changePwdError, setChangePwdError] = useState('');

  // Modal 3: Đăng ký / Thiết lập hồ sơ Admin (Email, SĐT, Tên tùy chọn)
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileUsername, setProfileUsername] = useState('admin');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCurrentPwd, setProfileCurrentPwd] = useState('');
  const [profileNewPwd, setProfileNewPwd] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');

  // Trạng thái kiểm tra và cập nhật phiên bản mới (Dành cho nhân viên chủ động cập nhật)
  const [updateStatus, setUpdateStatus] = useState(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updatingApp, setUpdatingApp] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  const loadAdminStatus = async () => {
    try {
      const res = await api.getAdminProfileStatus();
      if (res && res.success) {
        setAdminStatus(res);
        if (res.adminUsername) {
          setAdminCustomUsername(res.adminUsername);
        }
      }
    } catch (err) {
      console.warn('Lỗi đọc trạng thái admin:', err.message);
    }
  };

  useEffect(() => {
    loadAdminStatus();
  }, []);

  const checkAppUpdate = async () => {
    try {
      setCheckingUpdate(true);
      const res = await api.checkUpdate();
      setUpdateStatus(res);
      if (res.hasUpdate) {
        setUpdateMsg(`Đã có bản cập nhật mới v${res.latestVersion}!`);
      } else {
        setUpdateMsg(`Bản v${res.currentVersion || '1.5.0'} (Mới nhất)`);
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
      setError('Vui lòng nhập mật khẩu Quản trị!');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await onLoginSubmit({ 
        username: (adminCustomUsername || 'admin').trim(), 
        password: adminPassword.trim() 
      });
    } catch (err) {
      setError(err.message || 'Mật khẩu Quản trị không chính xác! Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Mở modal đăng ký / cập nhật hồ sơ Admin
  const openRegisterModal = () => {
    setProfileName(adminStatus?.adminName || 'Chủ Cửa Hàng (Admin)');
    setProfileUsername(adminStatus?.adminUsername || 'admin');
    setProfileEmail(adminStatus?.adminEmail || '');
    setProfilePhone(adminStatus?.adminPhone || '');
    setProfileCurrentPwd('');
    setProfileNewPwd('');
    setProfileMsg('');
    setProfileError('');
    setShowRegisterModal(true);
  };

  // Xử lý lưu hồ sơ Admin
  const handleSaveAdminProfile = async (e) => {
    e.preventDefault();
    if (!profileUsername.trim()) {
      setProfileError('Vui lòng nhập tên tài khoản Admin (Ví dụ: admin hoặc tên bất kỳ)!');
      return;
    }
    if (!profileEmail.trim() && !profilePhone.trim()) {
      setProfileError('Vui lòng nhập ít nhất Email hoặc Số điện thoại để dùng khôi phục mật khẩu khi cần!');
      return;
    }
    try {
      setProfileLoading(true);
      setProfileError('');
      const payload = {
        adminName: profileName.trim(),
        adminUsername: profileUsername.trim(),
        adminEmail: profileEmail.trim(),
        adminPhone: profilePhone.trim(),
        currentPassword: profileCurrentPwd,
        newPassword: profileNewPwd
      };
      const res = await api.updateAdminProfile(payload);
      setProfileMsg(res.message);
      setAdminCustomUsername(profileUsername.trim());
      await loadAdminStatus();
      setTimeout(() => {
        setShowRegisterModal(false);
        setProfileMsg('');
      }, 1800);
    } catch (err) {
      setProfileError(err.message || 'Lỗi khi lưu thông tin Quản trị');
    } finally {
      setProfileLoading(false);
    }
  };

  // Xử lý đổi mật khẩu Admin
  const handleChangeAdminPassword = async (e) => {
    e.preventDefault();
    if (!oldAdminPwd) {
      setChangePwdError('Vui lòng nhập mật khẩu hiện tại!');
      return;
    }
    if (!newAdminPwd || newAdminPwd.length < 4) {
      setChangePwdError('Mật khẩu mới phải có ít nhất 4 ký tự!');
      return;
    }
    if (newAdminPwd !== confirmAdminPwd) {
      setChangePwdError('Xác nhận mật khẩu mới không trùng khớp!');
      return;
    }
    try {
      setChangePwdLoading(true);
      setChangePwdError('');
      const res = await api.changeAdminPassword({ oldPassword: oldAdminPwd, newPassword: newAdminPwd });
      setChangePwdMsg(res.message);
      setAdminPassword(newAdminPwd);
      await loadAdminStatus();
      setTimeout(() => {
        setShowChangeModal(false);
        setChangePwdMsg('');
        setOldAdminPwd('');
        setNewAdminPwd('');
        setConfirmAdminPwd('');
      }, 1800);
    } catch (err) {
      setChangePwdError(err.message || 'Lỗi khi đổi mật khẩu');
    } finally {
      setChangePwdLoading(false);
    }
  };

  // Xử lý lấy lại mật khẩu Admin (1 thao tác gửi về Email hoặc Số điện thoại)
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Vui lòng nhập Email hoặc Số điện thoại đã đăng ký của bạn!');
      return;
    }
    try {
      setForgotLoading(true);
      setForgotError('');
      const res = await api.forgotAdminPassword(forgotIdentifier.trim());
      setForgotResult(res);
      await loadAdminStatus();
    } catch (err) {
      setForgotError(err.message || 'Lỗi khi khôi phục mật khẩu');
    } finally {
      setForgotLoading(false);
    }
  };

  // Sử dụng mật khẩu mới khôi phục để đăng nhập ngay
  const applyRecoveredPassword = () => {
    if (forgotResult?.newPassword) {
      setAdminPassword(forgotResult.newPassword);
      if (forgotResult.adminUsername) {
        setAdminCustomUsername(forgotResult.adminUsername);
      }
      setShowForgotModal(false);
      setForgotResult(null);
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
    <div className="w-full max-w-4xl mx-auto px-4 pt-1 sm:pt-2 pb-6 flex flex-col items-center">
      
      {/* Hero Store Greeting */}
      <div className="text-center mb-2 sm:mb-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-1.5 border border-amber-200">
          <MapPin className="w-3.5 h-3.5" />
          <span>Kyodo Food • Cơ Sở Trưng Nữ Vương, Đà Nẵng</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span className="font-black text-amber-950">Bản v1.5.2</span>
        </div>

        {activeTab === 'employee' || isEmployeeOnly ? (
          <>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Trang Quản Lý <span className="text-amber-600">Chấm Công</span>
            </h2>
            <p className="text-slate-600 mt-0.5 sm:mt-1 max-w-xl mx-auto text-xs sm:text-sm whitespace-nowrap">
              Mỗi nhân viên đăng nhập để chấm công và theo dõi giờ làm.
            </p>
          </>
        ) : isManagerOnly ? (
          <>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Cổng Quản Trị & <span className="text-amber-600">Bảng Tính Lương</span>
            </h2>
            <p className="text-slate-600 mt-0.5 sm:mt-1 max-w-xl mx-auto text-xs sm:text-sm whitespace-nowrap">
              Quản lý nhân sự, theo dõi bảng chấm công và duyệt chi lương.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Trang Quản Lý <span className="text-amber-600">Chấm Công</span>
            </h2>
            <p className="text-slate-600 mt-0.5 sm:mt-1 max-w-xl mx-auto text-xs sm:text-sm whitespace-nowrap">
              Đăng nhập tài khoản để chấm công và theo dõi giờ làm.
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
                  className={`p-2 sm:p-2.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2 text-left ${
                    isSelected 
                      ? 'border-amber-500 bg-amber-50/80 shadow-sm ring-2 ring-amber-500/20' 
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <img src={avatarSrc} alt={displayName} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover ring-2 ring-white shadow-xs shrink-0 bg-slate-50" />
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate whitespace-nowrap">
                        {displayName}
                      </h3>
                      <div className="text-[10px] sm:text-[11px] text-amber-700 font-bold font-mono truncate whitespace-nowrap">
                        TK: {emp.username || emp.code}
                      </div>
                    </div>
                  </div>
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    {isSelected ? (
                      <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-slate-300"></span>
                    )}
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

        {/* Form 2: Admin Login */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-3.5 text-xs">
            {/* Ô Tên Tài Khoản Admin */}
            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase text-[11px] tracking-wider whitespace-nowrap">
                Tài Khoản Quản Trị:
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Admin"
                  value={adminCustomUsername}
                  onChange={(e) => setAdminCustomUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            {/* Ô Mật Khẩu Admin */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-700 uppercase text-[11px] tracking-wider whitespace-nowrap">
                  Mật Khẩu Quản Trị:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotResult(null);
                      setForgotError('');
                      setForgotIdentifier(adminStatus?.adminEmail || adminStatus?.adminPhone || '');
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-900 cursor-pointer flex items-center gap-0.5"
                    title="Lấy lại mật khẩu mới gửi về Email hoặc Số điện thoại"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Quên mật khẩu?</span>
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOldAdminPwd('');
                      setNewAdminPwd('');
                      setConfirmAdminPwd('');
                      setChangePwdMsg('');
                      setChangePwdError('');
                      setShowChangeModal(true);
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                    title="Đổi mật khẩu tài khoản Quản trị"
                  >
                    Đổi MK
                  </button>
                </div>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showAdminPassword ? "text" : "password"}
                  required
                  placeholder="20162020"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-mono tracking-widest text-center"
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
              className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-600/20 transition-all cursor-pointer whitespace-nowrap mt-1"
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

      {/* ================= MODAL 1: QUÊN MẬT KHẨU ADMIN (1 THAO TÁC LẤY LẠI MẬT KHẨU) ================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Khôi Phục Mật Khẩu Admin
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Chỉ 1 thao tác nhận mật khẩu mới về Email hoặc Số điện thoại
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {!forgotResult ? (
              <form onSubmit={handleForgotPassword} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email hoặc Số điện thoại đã đăng ký: <span className="text-amber-600">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: chucuahang@gmail.com hoặc 0905..."
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Nhập đúng Email hoặc Số điện thoại đã thiết lập trong thông tin Chủ Cửa Hàng.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {forgotLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Lấy Lại Mật Khẩu Ngay</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs animate-in fade-in">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <div className="flex items-center gap-2 mb-2 font-black text-sm text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Khôi Phục Mật Khẩu Thành Công!</span>
                  </div>
                  <p className="text-xs text-emerald-800 mb-3 leading-relaxed">
                    Mật khẩu mới đã được cập nhật vào hệ thống và xác nhận gửi tới <strong>{forgotResult.sentTo}</strong>:
                  </p>
                  
                  {/* Hộp mật khẩu mới nổi bật */}
                  <div className="p-3 bg-white rounded-xl border-2 border-emerald-300 flex items-center justify-between gap-2 shadow-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Mật Khẩu Mới Của Bạn:</span>
                      <span className="font-mono text-lg font-black text-slate-900 tracking-wider">
                        {forgotResult.newPassword}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(forgotResult.newPassword);
                        alert('Đã sao chép mật khẩu mới vào bộ nhớ đệm!');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={applyRecoveredPassword}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Tự Điền & Đăng Nhập Ngay</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ĐỔI MẬT KHẨU ADMIN ================= */}
      {showChangeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Đổi Mật Khẩu Quản Trị Viên
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cập nhật mật khẩu quản trị an toàn cho cửa hàng
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowChangeModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {changePwdError && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{changePwdError}</span>
              </div>
            )}

            {changePwdMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{changePwdMsg}</span>
              </div>
            )}

            <form onSubmit={handleChangeAdminPassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mật khẩu hiện tại: <span className="text-amber-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu hiện tại (mặc định: 20162020)..."
                  value={oldAdminPwd}
                  onChange={(e) => setOldAdminPwd(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mật khẩu mới: <span className="text-amber-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Nhập mật khẩu mới (ít nhất 4 ký tự)..."
                  value={newAdminPwd}
                  onChange={(e) => setNewAdminPwd(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Xác nhận mật khẩu mới: <span className="text-amber-600">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Nhập lại mật khẩu mới..."
                  value={confirmAdminPwd}
                  onChange={(e) => setConfirmAdminPwd(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={changePwdLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {changePwdLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Lưu Mật Khẩu Mới</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: ĐĂNG KÝ / THIẾT LẬP HỒ SƠ ADMIN ================= */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Hồ Sơ & Khôi Phục Tài Khoản Admin
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Đăng ký Email, SĐT và Tên đăng nhập để khôi phục mật khẩu khi cần
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {profileError && (
              <div className="mb-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {profileMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdminProfile} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tên Chủ Cửa Hàng / Quản Lý:
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Chủ Cửa Hàng, Anh Hoàng..."
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tên Tài Khoản Đăng Nhập: <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="admin hoặc tên bất kỳ..."
                    value={profileUsername}
                    onChange={(e) => setProfileUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold font-mono text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Có thể đặt là admin hoặc tên bất kỳ bạn muốn</p>
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="font-extrabold text-amber-900 flex items-center gap-1.5 text-xs">
                  <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                  <span>Thông Tin Dùng Để Lấy Lại Mật Khẩu (Rất Quan Trọng):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Email Khôi Phục:
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        placeholder="Ví dụ: chucuahang@gmail.com"
                        value={profileEmail}
                        onChange={(e) => setProfileEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 font-medium text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Số Điện Thoại Khôi Phục:
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="Ví dụ: 0905123456"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 font-mono font-medium text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-amber-800">
                  💡 Khi quên mật khẩu, hệ thống sẽ xác minh theo Email hoặc Số điện thoại này để cấp lại mật khẩu mới cho bạn.
                </p>
              </div>

              {/* Tùy chọn đổi mật khẩu nếu muốn */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Đổi Mật Khẩu Quản Trị Mới (Không Bắt Buộc):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="password"
                    placeholder="Mật khẩu hiện tại (để xác nhận)..."
                    value={profileCurrentPwd}
                    onChange={(e) => setProfileCurrentPwd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <input
                    type="password"
                    placeholder="Mật khẩu mới (nếu muốn đổi)..."
                    value={profileNewPwd}
                    onChange={(e) => setProfileNewPwd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {profileLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Lưu Thông Tin Quản Trị</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nút kiểm tra cập nhật chủ động & Xem hướng dẫn sử dụng PDF */}
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs no-print w-full max-w-lg mx-auto">
        <a
          href="/Huong_Dan_Su_Dung_Kyodo_Food_Nhan_Vien.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto text-amber-800 hover:text-amber-950 flex items-center justify-center gap-1.5 font-bold transition-all py-2.5 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 shadow-2xs cursor-pointer whitespace-nowrap"
          title="Mở hoặc tải file PDF hướng dẫn sử dụng phần mềm Kyodo Food dành cho nhân viên"
        >
          <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>Hướng Dẫn Nhân Viên (PDF)</span>
        </a>

        <button
          type="button"
          onClick={checkAppUpdate}
          disabled={checkingUpdate}
          className="w-full sm:w-auto text-slate-600 hover:text-amber-700 flex items-center justify-center gap-2 font-bold transition-all py-2.5 px-4 rounded-2xl hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-200 shadow-2xs cursor-pointer bg-white whitespace-nowrap"
          title="Bấm để kiểm tra xem hệ thống đã có phiên bản phần mềm mới chưa"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-400 shrink-0 ${checkingUpdate ? 'animate-spin text-amber-600' : ''}`} />
          <span className="whitespace-nowrap">{checkingUpdate ? 'Đang kiểm tra từ GitHub...' : (updateMsg || 'Bản v1.5.2 • Kiểm Tra Cập Nhật')}</span>
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
