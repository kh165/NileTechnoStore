import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[350px] w-full flex flex-col items-center justify-center p-6 text-center bg-slate-50 border border-slate-200 rounded-2xl shadow-sm my-6">
          <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-3 border border-red-200">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-slate-800 mb-1">
            حدث خطأ غير متوقع
          </h2>
          <p className="text-xs text-slate-600 max-w-md mb-5 leading-relaxed font-bold">
            عذراً، حدث خطأ أثناء عرض هذا الجزء من الصفحة. يمكنك إعادة المحاولة أو تحديث الصفحة.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              إعادة المحاولة
            </button>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-black px-4 py-2.5 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              تحديث الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
