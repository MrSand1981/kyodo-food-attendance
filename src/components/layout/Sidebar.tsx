// src/components/layout/Sidebar.tsx
import { useState } from 'react';
import { 
  LayoutDashboard, Users, DollarSign, CalendarDays, Settings, 
  ChevronLeft, ChevronRight, FileSpreadsheet, Shield, Plus 
} from 'lucide-react';
import { useMediaQuery } from '@/hooks';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { 
    path: '/manager', 
    label: 'Bảng Công & Lương', 
    icon: LayoutDashboard,
    badge: null 
  },
  { 
    path: '/manager/employees', 
    label: 'Hồ Sơ Nhân Sự', 
    icon: Users,
    badge: null 
  },
  { 
    path: '/manager/advances-leaves', 
    label: 'Tạm Ứng & Đăng Ký Nghỉ', 
    icon: DollarSign,
    badge: null 
  },
  { 
    path: '/manager/settings', 
    label: 'Cài Đặt Cửa Hàng', 
    icon: Settings,
    badge: null 
  },
] as const;

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  const effectiveIsOpen = isMobile ? isOpen : (isTablet ? isHovered : true);

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'fixed lg:sticky top-14 h-[calc(100vh-3.5rem)] bg-white border-r border-neutral-200 transition-all duration-300 ease-in-out z-30 flex flex-col',
          {
            'w-64': !isMobile && (isTablet ? effectiveIsOpen : true),
            'w-16': isTablet && !effectiveIsOpen,
            '-translate-x-full': isMobile && !isOpen,
            'translate-x-0': isMobile && isOpen,
          }
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Sidebar navigation"
      >
        {/* Logo & Brand */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-neutral-200 shrink-0">
          {(!isTablet || effectiveIsOpen) && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200 p-0.5 flex items-center justify-center shadow-xs">
                <span className="font-bold text-brand-600 text-sm">KF</span>
              </div>
              <span className="font-black text-sm text-neutral-900 truncate">Kyodo Food</span>
            </div>
          )}
          <button
            onClick={onToggle}
            className={clsx(
              'w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition-colors',
              isTablet && !effectiveIsOpen && 'rotate-180'
            )}
            aria-label={effectiveIsOpen ? 'Thu gọn sidebar' : 'Mở rộng sidebar'}
            aria-expanded={effectiveIsOpen}
          >
            {effectiveIsOpen ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/manager' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive: active }) => clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                  active 
                    ? 'bg-brand-50 text-brand-700 shadow-sm' 
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
                  effectiveIsOpen ? '' : 'justify-center px-2'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={clsx(
                  'w-5 h-5 shrink-0',
                  isActive ? 'text-brand-600' : 'text-neutral-400'
                )} aria-hidden="true" />
                {effectiveIsOpen && (
                  <span className="truncate whitespace-nowrap">{item.label}</span>
                )}
                {item.badge && effectiveIsOpen && (
                  <span className="ml-auto px-2 py-0.5 text-[10px] font-bold bg-brand-100 text-brand-700 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom - Version & Toggle hint */}
        <div className="p-4 border-t border-neutral-100 shrink-0">
          {effectiveIsOpen && (
            <div className="text-center">
              <p className="text-[10px] text-neutral-400 font-medium">Bản v1.4.9</p>
              <p className="text-[10px] text-neutral-400 mt-1">Trưng Nữ Vương</p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}