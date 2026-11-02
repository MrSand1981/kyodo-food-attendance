import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Kyodo Food UI Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 flex items-center justify-center mb-4 text-amber-600 shadow-sm">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Đã xảy ra sự cố hiển thị</h2>
          <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
            Phần mềm ghi nhận sự cố tải giao diện:{' '}
            {this.state.error?.message || 'Lỗi không xác định'}. Vui lòng nhấn nút bên dưới để khởi
            động lại trang.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            Tải Lại Giao Diện Phần Mềm
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
