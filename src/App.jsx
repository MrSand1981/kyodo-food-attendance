// src/App.jsx
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import LoginKiosk from './pages/LoginKiosk';
import StaffAttendance from './pages/StaffAttendance';
import ManagerDashboard from './pages/ManagerDashboard';
import { api } from './utils/api';

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
        api.getEmployees(false) // Che giấu tuyệt đối lương khi khởi tạo
      ]);
      setSettings(settingsRes.settings);
      setShifts(settingsRes.shifts || []);
      setEmployees(employeesRes.employees || []);
    } catch (err) {
      console.error("Lỗi khởi tạo hệ thống:", err);
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
        throw new Error("Phiên bản Nhân Viên chỉ dành cho nhân viên chấm công!");
      }
      setCurrentRole(res.role);
      setCurrentUser(res.user);
    }
    return res;
  };

  const handleLogout = () => {
    setCurrentRole(null);
    setCurrentUser(null);
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
          <div className="w-8 h-8 rounded-full border-2 border-amber-600 flex items-center justify-center font-bold text-lg">!</div>
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">Đang kết nối máy chủ Kyodo Food Cloud</h3>
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

      {/* Main Viewport */}
      <main className={`flex-1 flex flex-col ${!currentRole ? 'items-center pt-3 sm:pt-5 pb-8' : 'pb-16'}`}>
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

        {/* 2. MÀN HÌNH NHÂN VIÊN: NHẬP GIỜ LÀM TỪNG NGÀY & XEM TỔNG CÔNG CUỐI THÁNG (BẢO MẬT LƯƠNG) */}
        {currentRole === 'employee' && currentUser && (
          <StaffAttendance
            employee={currentUser}
            onUpdateEmployee={(updated) => {
              setCurrentUser(prev => ({ ...prev, ...updated }));
              // Cập nhật cả trong danh sách employees
              setEmployees(prev => prev.map(e => e.id === updated.id ? { ...e, ...updated } : e));
            }}
            onLogout={handleLogout}
            settings={settings}
            shifts={shifts}
          />
        )}

        {/* 3. MÀN HÌNH QUẢN LÝ / CHỦ CỬA HÀNG: XEM BẢNG LƯƠNG, BẢNG CÔNG, TẠO TÀI KHOẢN, XUẤT EXCEL */}
        {currentRole === 'admin' && (
          <ManagerDashboard
            settings={settings}
            onSettingsChange={loadInitialData}
            shifts={shifts}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-200 text-center text-xs text-slate-500 no-print">
        <p>© 2026 <strong>Kyodo Food</strong> • Cơ sở Trưng Nữ Vương, Đà Nẵng</p>
      </footer>
    </div>
  );
}
