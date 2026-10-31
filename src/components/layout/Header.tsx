// src/components/layout/Header.tsx
import { useState, useEffect } from 'react';
import { Clock, Shield, LogOut, MapPin, RefreshCw, Sparkles, ArrowDownCircle } from 'lucide-react';
import { api } from '@/shared/api';
import { useAuth } from '@/hooks';
import { Button, Badge, Avatar } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';

interface HeaderProps {
  onLogout: () => void;
  onAdminClick: () => void;
  onBackToLogin: () => void;
  appMode?: 'all' | 'employee' | 'manager';
}

export function Header({ onLogout, onAdminClick, onBackToLogin, appMode = 'all' }: HeaderProps) {
  const { user, role, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [time, setTime] = useState(new Date());
  const [updateInfo, setUpdateInfo] = useState<{ hasUpdate: boolean; latestVersion?: string; currentVersion?: string } | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const checkHeaderUpdate = useCallback(async (silent = true) => {
    try {
      setIsCheckingUpdate(true);
      const res = await api.system.checkUpdate();
      setUpdateInfo(res);
      if (!silent) {
        if (res.hasUpdate) {
          if (window.confirm(`🎉 Phần mềm đã có phiên bản mới (v${res.latestVersion})!\nBạn có muốn cập nhật ngay bây giờ để sử dụng các tính năng mới không? (Dữ liệu chấm công được bảo toàn 100%)`)) {
            applyHeaderUpdate();
          }
        } else {
          toast.success('Thông báo', `Phần mềm đang ở phiên bản mới nhất (v${res.currentVersion}).`);
        }
      }
    } catch (err) {
      if (!silent) toast.error('Lỗi', `Lỗi kiểm tra cập nhật: ${err.message}`);
    } finally {
      setIsCheckingUpdate(false);
    }
  }, [toast]);

  const applyHeaderUpdate = async () => {
    try {
      setIsUpdating(true);
      const res = await api.system.applyUpdate();
      toast.success('Thành công', res.message);
      window.location.reload();
    } catch (err) {
      toast.error('Lỗi', `Lỗi khi cập nhật phần mềm: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  }, [toast]);

  useEffect(() => {
    checkHeaderUpdate(true);
    const handleFocus = () => checkHeaderUpdate(true);
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(() => checkHeaderUpdate(true), 60000);
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [checkHeaderUpdate]);

  const formatVietnameseDate = (date: Date) => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[date.getDay()];
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${dayName}, ${d}/${m}/${y}`;
  };

  const formatVietnameseTime = (date: Date) => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return { h, m, s };
  };

  const { h, m, s } = formatVietnameseTime(time);
  const logoUrl = '/logo-kyodo.png';

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-xs no-print w-full">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 gap-2 sm:gap-4">
          {/* Logo & Store Branding */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div 
              className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group"
              onClick={onBackToLogin}
              title="Về màn hình đăng nhập"
            >
              <div className="relative w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 p-0.5 flex items-center justify-center overflow-hidden shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <img 
                  src={logoUrl} 
                  alt="Kyodo Food Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <span className="hidden font-bold text-brand-600 text-sm">KF</span>
              </div>
              
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm sm:text-base font-black tracking-tight text-neutral-900 group-hover:text-brand-600 transition-colors whitespace-nowrap">
                    KYODO FOOD
                  </h1>
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-brand-100 text-brand-800 border border-brand-200 rounded-md flex items-center gap-1 whitespace-nowrap shrink-0">
                    <MapPin className="w-2.5 h-2.5" />
                    Trưng Nữ Vương
                  </span>
                </div>
                <p className="hidden md:block text-[10px] text-neutral-500 font-medium truncate max-w-[200px] lg:max-w-none whitespace-nowrap">
                  Cửa hàng Kyodo Food - Trưng Nữ Vương, Đà Nẵng
                </p>
              </div>
            </div>
          </div>

          {/* Live Digital Vietnamese Clock & Update status */}
          <div className="hidden sm:flex items-center justify-center gap-2 lg:gap-2.5 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 bg-neutral-50 border border-neutral-200 px-2.5 sm:px-3 py-1 rounded-xl shadow-inner">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-600 animate-pulse shrink-0" />
              <div className="flex items-baseline gap-0.5 font-mono whitespace-nowrap">
                <span className="text-base sm:text-lg font-bold text-neutral-900">{h}</span>
                <span className="text-base sm:text-lg font-bold text-brand-500 animate-pulse">:</span>
                <span className="text-base sm:text-lg font-bold text-neutral-900">{m}</span>
                <span className="text-xs font-semibold text-neutral-500">:{s}</span>
              </div>
              <div className="hidden lg:block h-4 w-px bg-neutral-200 mx-0.5"></div>
              <span className="hidden lg:inline text-xs font-semibold text-neutral-600 whitespace-nowrap">
                {formatVietnameseDate(time)}
              </span>
            </div>

            {/* Update status button */}
            {updateInfo?.hasUpdate ? (
              <Button
                variant="primary"
                size="sm"
                onClick={applyHeaderUpdate}
                disabled={isUpdating}
                iconLeft={<Sparkles className="w-3.5 h-3.5 text-brand-200" />}
                className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-sm animate-pulse"
              >
                Cập Nhật (v{updateInfo.latestVersion})
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => checkHeaderUpdate(false)}
                disabled={isCheckingUpdate}
                iconLeft={<RefreshCw className={`w-3.5 h-3.5 text-brand-700 ${isCheckingUpdate ? 'animate-spin text-brand-800' : ''}`} />}
              >
                Bản v{updateInfo?.currentVersion || '1.4.9'}
              </Button>
            )}
          </div>

          {/* User Status / Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isAuthenticated && role === 'employee' && user && (
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-black text-neutral-900 whitespace-nowrap">
                    {user.shortName || user.name} ({user.username || user.code})
                  </div>
                  <div className="text-[10px] text-neutral-500 font-semibold whitespace-nowrap">
                    Nhân viên • Trưng Nữ Vương
                  </div>
                </div>
                <Avatar 
                  src={user.avatar || (user.gender === 'Nữ' ? '/avatar-female.svg' : '/avatar-male.svg')} 
                  alt={user.shortName || user.name} 
                  size="sm" 
                  status="online"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  iconLeft={<LogOut className="w-3.5 h-3.5" />}
                >
                  <span className="hidden sm:inline">Đăng xuất</span>
                </Button>
              </div>
            )}

            {isAuthenticated && role === 'admin' && (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-brand-50 border border-brand-200 rounded-xl text-brand-800 text-xs font-bold whitespace-nowrap shrink-0">
                  <Shield className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>Quản Lý Cửa Hàng (Admin)</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onLogout}
                  iconLeft={<LogOut className="w-4 h-4" />}
                >
                  Đăng xuất
                </Button>
              </div>
            )}

            {!isAuthenticated && appMode !== 'employee' && (
              <div className="flex items-center shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onAdminClick}
                  iconLeft={<Shield className="w-4 h-4 text-brand-600 shrink-0" />}
                >
                  <span className="whitespace-nowrap">Chủ Cửa Hàng (Admin)</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}