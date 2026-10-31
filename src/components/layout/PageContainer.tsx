// src/components/layout/PageContainer.tsx
import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useState } from 'react';
import { useMediaQuery } from '@/hooks';
import { Outlet } from 'react-router-dom';

interface PageContainerProps {
  appMode?: 'all' | 'employee' | 'manager';
  onLogout: () => void;
  onAdminClick: () => void;
  onBackToLogin: () => void;
}

export function PageContainer({ 
  appMode = 'all', 
  onLogout, 
  onAdminClick, 
  onBackToLogin 
}: PageContainerProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isManagerRoute = window.location.pathname.startsWith('/manager');

  const handleSidebarToggle = () => setSidebarOpen(prev => !prev);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Skip link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold"
      >
        Bỏ qua đến nội dung chính
      </a>

      {/* Header */}
      <Header
        onLogout={onLogout}
        onAdminClick={onAdminClick}
        onBackToLogin={onBackToLogin}
        appMode={appMode}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar for manager routes */}
        {isManagerRoute && (
          <Sidebar 
            isOpen={sidebarOpen} 
            onToggle={() => setSidebarOpen(prev => !prev)} 
          />
        )}

        {/* Mobile sidebar toggle button */}
        {isManagerRoute && (
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className={clsx(
              'fixed bottom-4 right-4 z-30 lg:hidden w-12 h-12 rounded-full bg-brand-600 text-white shadow-lg flex items-center justify-center',
              'hover:bg-brand-700 transition-colors'
            )}
            aria-label={sidebarOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={sidebarOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        )}

        {/* Main Content */}
        <main 
          id="main-content"
          className={clsx(
            'flex-1 overflow-y-auto transition-all duration-300',
            isManagerRoute && !isMobile ? 'lg:ml-64' : '',
            isManagerRoute && isTablet && !sidebarOpen ? 'lg:ml-16' : ''
          )}
          tabIndex={-1}
        >
          <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
}