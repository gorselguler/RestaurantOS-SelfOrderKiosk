import React from 'react';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🔥 Kiosk ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    try {
      localStorage.removeItem('kiosk_cart');
    } catch (e) {}
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen bg-slate-950 flex items-center justify-center p-6 select-none font-sans">
          <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-200 text-center flex flex-col items-center animate-fadeIn">
            
            {/* Icon */}
            <div className="w-20 h-20 rounded-3xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-5 shadow-inner">
              <AlertTriangle className="w-10 h-10" />
            </div>

            {/* Titles */}
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
              Bir Hata Oluştu
            </h2>
            <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
              Sistem geçici bir sorunla karşılaştı. Lütfen aşağıdaki butona dokunarak ekranı yenileyiniz.
            </p>

            {/* Error snippet in dev */}
            {this.state.error && (
              <div className="w-full p-3 rounded-xl bg-slate-100 border border-slate-200 text-left mb-6 overflow-hidden">
                <span className="text-[10px] font-mono text-slate-600 block break-words line-clamp-3">
                  {this.state.error.toString()}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="w-full space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-98 text-white font-black text-base shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 touch-press transition-all cursor-pointer"
              >
                <RefreshCw className="w-5 h-5 stroke-[2.5]" />
                <span>Ekranı Yenile (Tap to Reload)</span>
              </button>

              <button
                onClick={this.handleReset}
                className="w-full py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 touch-press transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Ana Ekrana Dön</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
