// src/components/layout/Footer.tsx
import { Heart, Shield } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-neutral-200 py-4 no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-neutral-600">
            <span className="font-semibold text-neutral-900">Kyodo Food</span>
            <Shield className="w-4 h-4 text-brand-600" />
            <span>Trưng Nữ Vương, Đà Nẵng</span>
          </div>
          <div className="flex items-center justify-center sm:justify-end gap-2 text-xs text-neutral-500">
            <span>© {currentYear}</span>
            <Heart className="w-3.5 h-3.5 text-error-main" aria-label="Made with love" />
            <span>Được xây dựng cho Kyodo Food</span>
          </div>
        </div>
      </div>
    </footer>
  );
}