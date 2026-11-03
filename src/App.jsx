// src/App.jsx
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Shield, Users, Eye, Sparkles } from 'lucide-react';
import Header from './components/Header';
import LoginKiosk from './pages/LoginKiosk';
import { api } from './utils/api';

// Tách nhỏ bundle (Code Splitting & Lazy Loading) giúp tải trang ban đầu cực nhanh
const StaffAttendance = lazy(() => import('./pages/StaffAttendance'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));

function getInitialAppMode() {
  const path = window.location.pathname.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  const m = search.get('mode');
  if (m === 'employee' || path.includes('/employee')) return 'employee';
  if (m === 'manager' || path.includes('/manager') || path.includes('/admin')) return 'manager';
  return 'all';
}

export default function App() {
  const [appMode, setAppMode] = useState(getInitialAppMode()); // 'all' | 'employee' | 'manager'
  const [currentRole, setCurrentRole] = useState(null); // null | 'employee' | 'admin'
  const [currentUser, setCurrentUser] = useState(null);
  const [employees, setEmployees] = useState([]);

  // Chế độ 2 trong 1 dành riêng cho Bản Quản Lý (Admin)
  const [adminActiveTab, setAdminActiveTab] = useState('manager'); // 'manager' | 'staff-view'
  const [inspectedEmployeeId, setInspectedEmployeeId] = useState(null);

  const isManagerEdition = appMode !== 'employee';
  const inspectedEmployee = employees.find((e) => e.id === inspectedEmployeeId) || employees[0];
  const [settings, setSettings] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState(null);
  const [retryCountdown, setRetryCountdown] = useState(null);

  // Tải dữ liệu hệ thống
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setInitError(null);
      setRetryCountdown(null);
      const [settingsRes, employeesRes] = await Promise.all([
        api.getSettings(),
        api.getEmployees(false), // Che giấu tuyệt đối lương khi khởi tạo
      ]);
      setSettings(settingsRes.settings);
      setShifts(settingsRes.shifts || []);
      setEmployees(employeesRes.employees || []);
    } catch (err) {
      console.error('Lỗi khởi tạo hệ thống:', err);
      setInitError(err.message || 'Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Tự động thử kết nối lại sau 4 giây nếu máy chủ đang khởi động hoặc chưa phản hồi
  useEffect(() => {
    let timer;
    if (initError && !settings) {
      setRetryCountdown(4);
      timer = setInterval(() => {
        setRetryCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            loadInitialData();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [initError]);

  // Xử lý đăng nhập (Nhân viên: UTNVTNV, BAONVTNV | Admin: 20162020)
  const handleLoginSubmit = async ({ username, password }) => {
    const res = await api.login({ username, password });
    if (res.success) {
      // Nếu đang ở phiên bản nhân viên thì không cho phép đăng nhập admin
      if (appMode === 'employee' && res.role === 'admin') {
        throw new Error('Phiên bản Nhân Viên chỉ dành cho nhân viên chấm công!');
      }
      setCurrentRole(res.role);
      setCurrentUser(res.user);

      // Nạp lại danh sách nhân viên đầy đủ hồ sơ (với token xác thực vừa lưu)
      try {
        const empRes = await api.getEmployees();
        if (empRes?.employees && empRes.employees.length > 0) {
          setEmployees(empRes.employees);
          if (!inspectedEmployeeId) {
            setInspectedEmployeeId(empRes.employees[0].id);
          }
        }
      } catch (e) {
        console.error('Lỗi nạp danh sách nhân viên sau khi đăng nhập:', e);
      }
    }
    return res;
  };

  const handleSwitchToStaffView = async (targetId = null) => {
    try {
      const empRes = await api.getEmployees();
      if (empRes?.employees && empRes.employees.length > 0) {
        setEmployees(empRes.employees);
        const resolvedId = targetId || inspectedEmployeeId || empRes.employees[0].id;
        setInspectedEmployeeId(resolvedId);
      } else if (targetId) {
        setInspectedEmployeeId(targetId);
      }
    } catch (e) {
      console.error('Lỗi cập nhật danh sách nhân viên khi xem góc nhìn:', e);
      if (targetId) setInspectedEmployeeId(targetId);
    }
    setAdminActiveTab('staff-view');
  };

  const handleLogout = () => {
    api.logout();
    setCurrentRole(null);
    setCurrentUser(null);
    setAdminActiveTab('manager');
    setInspectedEmployeeId(null);
    loadInitialData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 flex items-center justify-center mb-4">
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="text-lg font-black text-slate-800">Đang khởi tạo hệ thống Kyodo Food...</h3>
        <p className="text-xs text-slate-500 mt-1">Cơ sở Trưng Nữ Vương</p>
      </div>
    );
  }

  if (initError && !settings) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 flex items-center justify-center mb-4 text-amber-600 shadow-sm animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-amber-600 flex items-center justify-center font-bold text-lg">
            !
          </div>
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">
          Đang kết nối máy chủ Kyodo Food Cloud
        </h3>
        <p className="text-sm text-slate-500 max-w-md mb-4 leading-relaxed">
          {initError}. Đang duy trì kết nối đám mây giữa Đà Nẵng và Nghệ An...
        </p>
        {retryCountdown !== null && (
          <p className="text-xs font-semibold text-amber-600 mb-6 bg-amber-50 px-3 py-1.5 rounded-full inline-block border border-amber-200">
            ⏳ Tự động kết nối lại sau {retryCountdown} giây...
          </p>
        )}
        <div>
          <button
            type="button"
            onClick={loadInitialData}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>Thử Kết Nối Ngay</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-amber-500 selection:text-white">
      {/* Universal Top Header */}
      <Header
        currentUser={currentUser}
        currentRole={currentRole}
        onLogout={handleLogout}
        onAdminClick={() => {
          setCurrentRole(null);
          setCurrentUser(null);
          if (appMode !== 'employee') {
            setAppMode('manager');
          }
        }}
        onBackToLogin={handleLogout}
        settings={settings}
        appMode={appMode}
      />

      {/* ================= THANH ĐIỀU HƯỚNG 2 TRONG 1 DÀNH RIÊNG CHO BẢN QUẢN LÝ (ADMIN) ================= */}
      {currentRole === 'admin' && isManagerEdition && (
        <div className="bg-white border-b border-amber-200/90 shadow-xs sticky top-14 z-30 no-print">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            {/* 2 Tabs chuyển đổi chính */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setAdminActiveTab('manager')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  adminActiveTab === 'manager'
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>🏢 Bảng Quản Lý Cửa Hàng (Admin)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchToStaffView()}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  adminActiveTab === 'staff-view'
                    ? 'bg-linear-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>👤 Góc Nhìn Nhân Viên (2 Trong 1)</span>
                <span className="px-1.5 py-0.2 rounded-md bg-amber-400 text-amber-950 text-[10px] font-black uppercase">
                  Mới
                </span>
              </button>
            </div>

            {/* Khi đang ở Góc Nhìn Nhân Viên: Cho phép đổi nhanh giữa Út, Bảo,... */}
            {adminActiveTab === 'staff-view' && (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-300 shadow-2xs">
                  <span className="text-xs font-bold text-amber-950 whitespace-nowrap flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                    Đang xem màn hình:
                  </span>
                  <select
                    value={inspectedEmployee?.id || ''}
                    onChange={(e) => setInspectedEmployeeId(e.target.value)}
                    className="bg-white px-2.5 py-1 rounded-lg border border-amber-300 text-xs font-black text-slate-800 shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.shortName || emp.name} ({emp.username || emp.code})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setAdminActiveTab('manager')}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-all cursor-pointer whitespace-nowrap"
                >
                  ← Về Quản Lý
                </button>
              </div>
            )}

            {/* Tiện ích gợi ý khi đang ở Bảng Quản Lý */}
            {adminActiveTab === 'manager' && (
              <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>
                  Hệ thống 2 trong 1: Bấm "Góc Nhìn Nhân Viên" để xem màn hình chấm công của từng
                  bạn
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <main
        className={`flex-1 flex flex-col ${!currentRole ? 'items-center pt-3 sm:pt-5 pb-8' : 'pb-16'}`}
      >
        {/* 1. MÀN HÌNH ĐĂNG NHẬP */}
        {!currentRole && (
          <LoginKiosk
            employees={employees}
            onLoginSubmit={handleLoginSubmit}
            settings={settings}
            appMode={appMode}
            onSwitchMode={(mode) => setAppMode(mode)}
          />
        )}

        {/* 2. MÀN HÌNH NHÂN VIÊN & 3. MÀN HÌNH QUẢN LÝ (LAZY LOADED) */}
        <Suspense
          fallback={
            <div className="flex-1 flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-sm font-medium text-slate-600">Đang tải mô-đun ứng dụng...</p>
            </div>
          }
        >
          {/* Nhân viên đăng nhập thông thường (chỉ xem màn hình của chính mình) */}
          {currentRole === 'employee' && currentUser && (
            <StaffAttendance
              employee={currentUser}
              onUpdateEmployee={(updated) => {
                setCurrentUser((prev) => ({ ...prev, ...updated }));
                setEmployees((prev) =>
                  prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e))
                );
              }}
              onLogout={handleLogout}
              settings={settings}
              shifts={shifts}
            />
          )}

          {/* Quản lý đăng nhập (Bản Admin 2 trong 1: Chuyển đổi giữa Quản trị và Góc nhìn nhân viên) */}
          {currentRole === 'admin' && (
            <>
              {adminActiveTab === 'manager' ? (
                <ManagerDashboard
                  settings={settings}
                  onSettingsChange={loadInitialData}
                  shifts={shifts}
                  onEmployeesChange={(updated) => setEmployees(updated)}
                  onInspectEmployee={(emp) => {
                    handleSwitchToStaffView(emp.id);
                  }}
                />
              ) : (
                <StaffAttendance
                  employee={inspectedEmployee}
                  onUpdateEmployee={(updated) => {
                    setEmployees((prev) =>
                      prev.map((e) => (e.id === updated.id ? { ...e, ...updated } : e))
                    );
                  }}
                  onLogout={handleLogout}
                  settings={settings}
                  shifts={shifts}
                  isAdminInspect={true}
                  onBackToAdmin={() => setAdminActiveTab('manager')}
                />
              )}
            </>
          )}
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-200 text-center text-xs text-slate-500 no-print">
        <p>
          © 2026 <strong>Kyodo Food</strong> • Cơ sở Trưng Nữ Vương, Đà Nẵng
        </p>
      </footer>
    </div>
  );
}
