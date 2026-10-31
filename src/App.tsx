// src/App.tsx
// Main App component with providers and routing

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PageContainer } from './components/layout';
import { ToastContainer } from './components/ui';
import { api } from './shared/api';
import { queryClient } from './shared/api';
import { useAuth } from './hooks';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const StaffAttendance = lazy(() => import('./pages/StaffAttendance'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 rounded-3xl bg-brand-100 flex items-center justify-center mb-4">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <h3 className="text-lg font-black text-slate-800">Đang tải trang...</h3>
      <p className="text-xs text-slate-500 mt-1">Cơ sở Trưng Nữ Vương</p>
    </div>
  );
}

// Auth wrapper component
function AuthWrapper() {
  const { login, logout, checkAuth } = useAuth();
  const [appMode, setAppMode] = useState<'all' | 'employee' | 'manager'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const handleLogin = async ({ username, password }: { username: string; password: string }) => {
    const res = await api.auth.login({ username, password });
    if (appMode === 'employee' && res.role === 'admin') {
      throw new Error('Phiên bản Nhân Viên chỉ dành cho nhân viên chấm công!');
    }
    return res;
  };

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    checkAuth().finally(() => setIsLoading(false));
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-3xl bg-brand-100 flex items-center justify-center mb-4">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h3 className="text-lg font-black text-slate-800">Đang khởi tạo hệ thống Kyodo Food...</h3>
        <p className="text-xs text-slate-500 mt-1">Cơ sở Trưng Nữ Vương</p>
      </div>
    );
  }

  return (
    <PageContainer
      onLogout={handleLogout}
      onAdminClick={() => setAppMode('manager')}
      onBackToLogin={handleLogout}
      appMode={appMode}
    >
      <Routes>
        <Route 
          path="/" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <LoginPage 
                onLogin={handleLogin}
                appMode={appMode}
                onSwitchMode={setAppMode}
              />
            </Suspense>
          } 
        />
        <Route 
          path="/employee/*" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <StaffAttendance />
            </Suspense>
          } 
        />
        <Route 
          path="/manager/*" 
          element={
            <Suspense fallback={<LoadingFallback />}>
              <ManagerDashboard />
            </Suspense>
          } 
        />
      </Routes>
    </PageContainer>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastContainer />
        <AuthWrapper />
      </BrowserRouter>
    </QueryClientProvider>
  );
}