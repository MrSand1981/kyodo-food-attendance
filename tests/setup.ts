// tests/setup.ts
import { vi } from 'vitest';

// Mock canvas-confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => {
  const icons = [
    'Clock',
    'Calendar',
    'Award',
    'CheckCircle2',
    'AlertCircle',
    'Printer',
    'RefreshCw',
    'PlusCircle',
    'FileText',
    'ChevronDown',
    'Check',
    'LogOut',
    'Send',
    'MapPin',
    'Lock',
    'KeyRound',
    'ShieldCheck',
    'X',
    'Camera',
    'DollarSign',
    'CalendarDays',
    'Trash2',
    'HeartHandshake',
    'QrCode',
    'UserCheck',
    'Edit3',
    'Users',
    'FileSpreadsheet',
    'Settings',
    'Plus',
    'Edit',
    'Download',
    'Upload',
    'CheckCircle',
    'DollarSign',
    'MapPin',
    'Key',
    'UserPlus',
    'RefreshCw',
    'GitBranch',
    'ArrowUpCircle',
    'UploadCloud',
    'GitCommit',
    'Terminal',
    'ExternalLink',
    'Bell',
    'Copy',
    'Phone',
    'Home',
    'CreditCard',
    'Sparkles',
    'Eye',
    'EyeOff',
    'Mail',
    'Shield',
    'LogIn',
    'ArrowRight',
    'ArrowDownCircle',
    'HelpCircle',
    'Delete',
    'Trash2',
  ];

  const mockComponent = (name: string) => ({
    name,
    $$typeof: Symbol.for('react.element'),
    render: () => null,
  });

  return icons.reduce(
    (acc, name) => {
      acc[name] = mockComponent(name);
      return acc;
    },
    {} as Record<string, any>
  );
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Suppress console.error in tests unless explicitly needed
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (args[0]?.includes?.('Warning: ReactDOM.render is no longer supported')) return;
    if (args[0]?.includes?.('act(...)')) return;
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
