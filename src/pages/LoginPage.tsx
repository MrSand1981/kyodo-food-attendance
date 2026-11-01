// src/pages/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { 
  User, Lock, Sparkles, LogIn, Shield, Check, 
  AlertCircle, ArrowRight, MapPin, Eye, EyeOff, ShieldCheck,
  RefreshCw, ArrowDownCircle, CheckCircle2,
  Mail, Phone, KeyRound, Settings, X, Copy, Send, HelpCircle
} from 'lucide-react';
import { api } from '@/shared/api';
import { Button, Input, Modal, AlertDialog, Card, Badge, Avatar } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useDebounce } from '@/hooks';

interface LoginPageProps {
  onLogin: (credentials: { username: string; password: string }) => Promise<any>;
  appMode: 'all' | 'employee' | 'manager';
  onSwitchMode: (mode: 'all' | 'employee' | 'manager') => void;
}

export default function LoginPage({ onLogin, appMode, onSwitchMode }: LoginPageProps) {
  const [activeTab, setActiveTab] = useState(appMode === 'manager' ? 'admin' : 'employee');
  const [username, setUsername] = useState('UTNVTNV');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminCustomUsername, setAdminCustomUsername] = useState('Admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [adminStatus, setAdminStatus] = useState<any>(null);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotResult, setForgotResult] = useState<any>(null);
  const [forgotError, setForgotError] = useState('');

  const [showChangeModal, setShowChangeModal] = useState(false);
  const [oldAdminPwd, setOldAdminPwd] = useState('');
  const [newAdminPwd, setNewAdminPwd] = useState('');
  const [confirmAdminPwd, setConfirmAdminPwd] = useState('');
  const [changePwdLoading, setChangePwdLoading] = useState(false);
  const [changePwdMsg, setChangePwdMsg] = useState('');
  const [changePwdError, setChangePwdError] = useState('');

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

  const [updateStatus, setUpdateStatus] = useState<any>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updatingApp, setUpdatingApp] = useState(false);
  const [updateMsg, setUpdateMsg] = useState('');

  const { toast } = useToast();
  const debouncedCheckUpdate = useDebounce(checkAppUpdate, 1000);

  const loadAdminStatus = async () => {
    try {
      const res = await api.auth.getAdminProfileStatus();
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

  const checkAppUpdate = async () => {
    try {
      setCheckingUpdate(true);
      const res = await api.system.checkUpdate();
      setUpdateStatus(res);
      if (res.hasUpdate) {
        setUpdateMsg(`Đã có bản cập nhật mới v${res.latestVersion}!`);
      } else {
        setUpdateMsg(`Bản v${res.currentVersion || '1.4.9'} (Mới nhất)`);
      }
    } catch (err) {
      console.warn('Lỗi kiểm tra cập nhật:', err.message);
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleApplyUpdate = async () => {
    if (!window.confirm('Ứng dụng sẽ tự động tải bản cập nhật mới từ GitHub mà không làm mất dữ liệu chấm công. Bạn có muốn tiếp tục?')) return;
    try {
      setUpdatingApp(true);
      setError('');
      const res = await api.system.applyUpdate();
      alert('🎉 ' + res.message);
      window.location.reload();
    } catch (err) {
      setError(err.message || 'Lỗi khi cập nhật phần mềm');
    } finally {
      setUpdatingApp(false);
    }
  };

  useEffect(() => {
    loadAdminStatus();
  }, []);

  useEffect(() => {
    checkAppUpdate();
    const handleFocus = () => checkAppUpdate();
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(checkAppUpdate, 60000);
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (appMode === 'manager') setActiveTab('admin');
    else if (appMode === 'employee') setActiveTab('employee');
  }, [appMode]);

  // Mock employees for quick select (in real app, fetch from API)
  const mockEmployees = [
    { id: 'emp-ut', username: 'UTNVTNV', code: 'UTNVTNV', shortName: 'Út', name: 'Út', gender: 'Nữ', avatar: '/avatar-female.svg' },
    { id: 'emp-bao', username: 'BAONVTNV', code: 'BAONVTNV', shortName: 'Bảo', name: 'Bảo', gender: 'Nam', avatar: '/avatar-male.svg' }
  ];

  const handleEmployeeLogin = async (e: React.FormEvent) => {
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
      await onLogin({ username: username.trim(), password });
    } catch (err) {
      setError(err.message || 'Tài khoản hoặc mật khẩu không đúng!');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) {
      setError('Vui lòng nhập mật khẩu Quản trị!');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await onLogin({ 
        username: (adminCustomUsername || 'admin').trim(), 
        password: adminPassword.trim() 
      });
    } catch (err) {
      setError(err.message || 'Mật khẩu Quản trị không chính xác! Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSaveAdminProfile = async (e: React.FormEvent) => {
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
      const res = await api.employees.updateAdminProfile(payload);
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

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
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
      const res = await api.auth.adminChangePassword({ oldPassword: oldAdminPwd, newPassword: newAdminPwd });
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Vui lòng nhập Email hoặc Số điện thoại đã đăng ký của bạn!');
      return;
    }
    try {
      setForgotLoading(true);
      setForgotError('');
      const res = await api.auth.forgotPassword(forgotIdentifier.trim());
      setForgotResult(res);
      await loadAdminStatus();
    } catch (err) {
      setForgotError(err.message || 'Lỗi khi khôi phục mật khẩu');
    } finally {
      setForgotLoading(false);
    }
  };

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

  const quickSelectEmployee = (emp: any) => {
    setUsername(emp.username || emp.code);
    setPassword('');
    setError('');
  };

  useEffect(() => {
    if (appMode === 'manager') setActiveTab('admin');
    else if (appMode === 'employee') setActiveTab('employee');
  }, [appMode]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pt-1 sm:pt-2 pb-6 flex flex-col items-center">
      {/* Hero Store Greeting */}
      <div className="text-center mb-2 sm:mb-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-800 text-xs font-bold mb-1.5 border border-brand-200">
          <MapPin className="w-3.5 h-3.5" />
          <span>Kyodo Food • Cơ Sở Trưng Nữ Vương, Đà Nẵng</span>
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
          <span className="font-black text-brand-950">Bản v1.5.5</span>
        </div>

        {activeTab === 'employee' || appMode === 'employee' ? (
          <>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Trang Quản Lý <span className="text-brand-600">Chấm Công</span>
            </h2>
            <p className="text-slate-600 mt-0.5 sm:mt-1 max-w-xl mx-auto text-xs sm:text-sm whitespace-nowrap">
              Mỗi nhân viên đăng nhập để chấm công và theo dõi giờ làm.
            </p>
          </>
        ) : appMode === 'manager' ? (
          <>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Cổng Quản Trị & <span className="text-brand-600">Bảng Tính Lương</span>
            </h2>
            <p className="text-slate-600 mt-0.5 sm:mt-1 max-w-xl mx-auto text-xs sm:text-sm whitespace-nowrap">
              Quản lý nhân sự, theo dõi bảng chấm công và duyệt chi lương.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Trang Quản Lý <span className="text-brand-600">Chấm Công</span>
            </h2>
            <p className="text-slate-600 mt-0.5 sm:mt-1 max-w-xl mx-auto text-xs sm:text-sm whitespace-nowrap">
              Đăng nhập tài khoản để chấm công và theo dõi giờ làm.
            </p>
          </>
        )}
      </div>

      {/* Update Banner */}
      {updateStatus?.hasUpdate && (
        <div className="w-full max-w-md mx-auto mb-2.5 sm:mb-3.5 p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-brand-500 via-brand-600 to-yellow-500 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5 text-brand-200" />
            </div>
            <div>
              <div className="font-black text-sm flex items-center gap-2">
                <span>Phần mềm đã có phiên bản mới (v{updateStatus.latestVersion})!</span>
                <span className="px-2 py-0.5 rounded-full bg-white text-brand-800 text-[10px] font-black uppercase tracking-wider">Mới</span>
              </div>
              <p className="text-xs text-brand-100 mt-0.5">
                Phần mềm đã có phiên bản mới hãy nhấn cập nhật ngay để cập nhật các tính năng mới.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={handleApplyUpdate}
            disabled={updatingApp}
            className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white hover:bg-brand-50 active:scale-95 text-brand-800 font-black text-xs shadow-md transition-all whitespace-nowrap"
          >
            {updatingApp ? (
              <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ArrowDownCircle className="w-4 h-4" />
                <span>Cập Nhật Ngay</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* Quick Select Staff Cards */}
      {activeTab === 'employee' && (
        <div className="w-full max-w-md mx-auto mb-2.5 sm:mb-3.5 flex flex-col items-center">
          <div className="text-center text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 whitespace-nowrap">
            Chọn Tài Khoản Của Bạn (Mỗi Nhân Viên Tự Nhập Mật Khẩu)
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full">
            {mockEmployees.map(emp => {
              const displayName = emp.shortName || emp.name;
              const isSelected = username.toUpperCase() === (emp.username || emp.code).toUpperCase();
              const avatarSrc = emp.avatar || (emp.gender === 'Nữ' ? '/avatar-female.svg' : '/avatar-male.svg');
              return (
                <div
                  key={emp.id}
                  onClick={() => quickSelectEmployee(emp)}
                  className={`p-2 sm:p-2.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2 text-left ${
                    isSelected 
                      ? 'border-brand-500 bg-brand-50/80 shadow-sm ring-2 ring-brand-500/20' 
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                    <img src={avatarSrc} alt={displayName} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover ring-2 ring-white shadow-xs shrink-0 bg-slate-50" />
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate whitespace-nowrap">
                        {displayName}
                      </h3>
                      <div className="text-[10px] sm:text-[11px] text-brand-700 font-bold font-mono truncate whitespace-nowrap">
                        TK: {emp.username || emp.code}
                      </div>
                    </div>
                  </div>
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    {isSelected ? (
                      <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-xs">
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
      <Card className="w-full max-w-md mx-auto">
        {/* Tab Switcher */}
        {appMode === 'all' && (
          <div className="flex rounded-2xl bg-slate-100 p-1 mb-4">
            <Button
              type="button"
              variant={activeTab === 'employee' ? 'primary' : 'ghost'}
              size="md"
              onClick={() => { setActiveTab('employee'); setError(''); }}
              className="flex-1 py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap"
            >
              <User className="w-4 h-4 shrink-0" />
              <span>Nhân Viên</span>
            </Button>
            <Button
              type="button"
              variant={activeTab === 'admin' ? 'primary' : 'ghost'}
              size="md"
              onClick={() => { setActiveTab('admin'); setError(''); }}
              className="flex-1 py-2 px-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap"
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span>Chủ Cửa Hàng (Admin)</span>
            </Button>
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
              <label className="label">
                Tài Khoản Nhân Viên:
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  required
                  placeholder="Chọn tài khoản ở trên hoặc nhập mã TK..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  iconLeft={<User className="w-4 h-4" />}
                  fullWidth
                />
              </div>
            </div>

            <div>
              <label className="label">
                Mật Khẩu Cá Nhân:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="nhập mật khẩu để đăng nhập"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  iconLeft={<Lock className="w-4 h-4" />}
                  iconRight={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  fullWidth
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              fullWidth
              className="mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Đăng Nhập Chấm Công</span>
                </>
              )}
            </Button>
          </form>
        )}

        {/* Form 2: Admin Login */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="label">
                Tài Khoản Quản Trị:
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  required
                  placeholder="Admin"
                  value={adminCustomUsername}
                  onChange={(e) => setAdminCustomUsername(e.target.value)}
                  iconLeft={<User className="w-4 h-4" />}
                  fullWidth
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label">
                  Mật Khẩu Quản Trị:
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setForgotResult(null);
                      setForgotError('');
                      setForgotIdentifier(adminStatus?.adminEmail || adminStatus?.adminPhone || '');
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] font-bold text-brand-700 hover:text-brand-900 cursor-pointer flex items-center gap-0.5"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Quên mật khẩu?</span>
                  </Button>
                  <span className="text-slate-300">•</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setOldAdminPwd('');
                      setNewAdminPwd('');
                      setConfirmAdminPwd('');
                      setChangePwdMsg('');
                      setChangePwdError('');
                      setShowChangeModal(true);
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Đổi MK
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  type={showAdminPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  iconLeft={<Lock className="w-4 h-4" />}
                  iconRight={
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  fullWidth
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              size="lg"
              fullWidth
              className="mt-1"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Shield className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Đăng Nhập Quản Lý & Bảng Lương</span>
                </>
              )}
            </Button>
          </form>
        )}

        {/* Update Check Button */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-xs no-print w-full max-w-md mx-auto">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={checkAppUpdate}
            disabled={checkingUpdate}
            className="w-full sm:w-auto text-slate-600 hover:text-brand-700 flex items-center justify-center gap-2 font-bold transition-all py-2.5 px-4 rounded-2xl hover:bg-brand-50/60 border border-slate-200/80 hover:border-brand-200 shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 shrink-0 ${checkingUpdate ? 'animate-spin text-brand-600' : ''}`} />
            <span className="whitespace-nowrap">{checkingUpdate ? 'Đang kiểm tra từ GitHub...' : (updateMsg || 'Bản v1.5.5 • Kiểm Tra Cập Nhật')}</span>
          </Button>

          {updateStatus?.hasUpdate && (
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleApplyUpdate}
              disabled={updatingApp}
              className="w-full sm:w-auto text-xs font-black py-2.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white shadow-md transition-all flex items-center justify-center gap-1.5 animate-pulse"
            >
              <ArrowDownCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Cập Nhật Bản Mới Ngay (v{updateStatus.latestVersion})</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <Modal
          open={showForgotModal}
          onOpenChange={setShowForgotModal}
          title="Khôi Phục Mật Khẩu Admin"
          description="Chỉ 1 thao tác nhận mật khẩu mới về Email hoặc Số điện thoại"
          size="md"
        >
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
                  Email hoặc Số điện thoại đã đăng ký: <span className="text-brand-600">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    required
                    placeholder="Ví dụ: chucuahang@gmail.com hoặc 0905..."
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    iconLeft={<Mail className="w-4 h-4" />}
                    fullWidth
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Nhập đúng Email hoặc Số điện thoại đã thiết lập trong thông tin Chủ Cửa Hàng.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" size="md" onClick={() => setShowForgotModal(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={forgotLoading} size="md">
                  {forgotLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Lấy Lại Mật Khẩu Ngay</span>
                    </>
                  )}
                </Button>
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
                
                <div className="p-3 bg-white rounded-xl border-2 border-emerald-300 flex items-center justify-between gap-2 shadow-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Mật Khẩu Mới Của Bạn:</span>
                    <span className="font-mono text-lg font-black text-slate-900 tracking-wider">
                      {forgotResult.newPassword}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(forgotResult.newPassword);
                      toast.success('Đã sao chép', 'Đã sao chép mật khẩu mới vào bộ nhớ đệm!');
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép</span>
                  </Button>
                </div>
              </div>

              <Button
                type="button"
                onClick={applyRecoveredPassword}
                size="lg"
                fullWidth
              >
                <LogIn className="w-4 h-4" />
                <span>Tự Điền & Đăng Nhập Ngay</span>
              </Button>
            </div>
          )}
        </Modal>
      )}

      {/* Change Password Modal */}
      {showChangeModal && (
        <Modal
          open={showChangeModal}
          onOpenChange={setShowChangeModal}
          title="Đổi Mật Khẩu Quản Trị Viên"
          description="Cập nhật mật khẩu quản trị an toàn cho cửa hàng"
          size="md"
        >
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
                Mật khẩu hiện tại: <span className="text-brand-600">*</span>
              </label>
              <Input
                type="password"
                required
                placeholder="Nhập mật khẩu quản trị hiện tại..."
                value={oldAdminPwd}
                onChange={(e) => setOldAdminPwd(e.target.value)}
                fullWidth
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mật khẩu mới: <span className="text-brand-600">*</span>
              </label>
              <Input
                type="password"
                required
                placeholder="Nhập mật khẩu mới (ít nhất 4 ký tự)..."
                value={newAdminPwd}
                onChange={(e) => setNewAdminPwd(e.target.value)}
                fullWidth
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Xác nhận mật khẩu mới: <span className="text-brand-600">*</span>
              </label>
              <Input
                type="password"
                required
                placeholder="Nhập lại mật khẩu mới..."
                value={confirmAdminPwd}
                onChange={(e) => setConfirmAdminPwd(e.target.value)}
                fullWidth
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="md" onClick={() => setShowChangeModal(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={changePwdLoading} size="md">
                {changePwdLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Lưu Mật Khẩu Mới</span>
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Register Admin Modal */}
      {showRegisterModal && (
        <Modal
          open={showRegisterModal}
          onOpenChange={setShowRegisterModal}
          title="Hồ Sơ & Khôi Phục Tài Khoản Admin"
          description="Đăng ký Email, SĐT và Tên đăng nhập để khôi phục mật khẩu khi cần"
          size="lg"
        >
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
                <label className="label">
                  Tên Chủ Cửa Hàng / Quản Lý:
                </label>
                <Input
                  type="text"
                  placeholder="Ví dụ: Chủ Cửa Hàng, Anh Hoàng..."
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  fullWidth
                />
              </div>

              <div>
                <label className="label">
                  Tên Tài Khoản Đăng Nhập: <span className="text-brand-600">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="admin hoặc tên bất kỳ..."
                  value={profileUsername}
                  onChange={(e) => setProfileUsername(e.target.value)}
                  fullWidth
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Có thể đặt là admin hoặc tên bất kỳ bạn muốn</p>
              </div>
            </div>

            <div className="p-3 bg-brand-50/60 rounded-2xl border border-brand-200/80 space-y-3">
              <div className="font-extrabold text-brand-900 flex items-center gap-1.5 text-xs">
                <KeyRound className="w-3.5 h-3.5 text-brand-700" />
                <span>Thông Tin Dùng Để Lấy Lại Mật Khẩu (Rất Quan Trọng):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">
                    Email Khôi Phục:
                  </label>
                  <Input
                    type="email"
                    placeholder="Ví dụ: chucuahang@gmail.com"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    iconLeft={<Mail className="w-3.5 h-3.5" />}
                    fullWidth
                  />
                </div>

                <div>
                  <label className="label">
                    Số Điện Thoại Khôi Phục:
                  </label>
                  <Input
                    type="tel"
                    placeholder="Ví dụ: 0905123456"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    iconLeft={<Phone className="w-3.5 h-3.5" />}
                    fullWidth
                  />
                </div>
              </div>
              <p className="text-[10px] text-brand-800">
                💡 Khi quên mật khẩu, hệ thống sẽ xác minh theo Email hoặc Số điện thoại này để cấp lại mật khẩu mới cho bạn.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="label">
                Đổi Mật Khẩu Quản Trị Mới (Không Bắt Buộc):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  type="password"
                  placeholder="Mật khẩu hiện tại (để xác nhận)..."
                  value={profileCurrentPwd}
                  onChange={(e) => setProfileCurrentPwd(e.target.value)}
                  fullWidth
                />
                <Input
                  type="password"
                  placeholder="Mật khẩu mới (nếu muốn đổi)..."
                  value={profileNewPwd}
                  onChange={(e) => setProfileNewPwd(e.target.value)}
                  fullWidth
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <Button type="button" variant="secondary" size="md" onClick={() => setShowRegisterModal(false)}>
                Hủy Bỏ
              </Button>
              <Button type="submit" disabled={profileLoading} size="md">
                {profileLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Lưu Thông Tin Quản Trị</span>
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Update Status Info */}
      {updateStatus && !updateStatus.hasUpdate && !checkingUpdate && !updatingApp && (
        <p className="mt-2 text-center text-xs text-slate-500">
          Bản v{updateStatus.currentVersion || '1.4.9'} • {updateStatus.message || 'Đã cập nhật'}
        </p>
      )}
    </div>
  );
}

export default LoginPage;