import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, RotateCcw, AlertTriangle, ShieldCheck, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Sefa Store App Uncaught Error Caught by Boundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      // Clear non-critical localStorage if needed to recover corrupted state
      const adminToken = localStorage.getItem('sefa_admin_token');
      localStorage.clear();
      if (adminToken) {
        localStorage.setItem('sefa_admin_token', adminToken);
      }
    } catch (e) {
      console.error('Storage clear error:', e);
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 select-none">
          {/* Subtle Ambient Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 pointer-events-none" />

          <div className="relative w-full max-w-sm rounded-3xl bg-slate-900/90 border border-indigo-500/40 p-6 text-center shadow-2xl backdrop-blur-md space-y-4">
            
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mx-auto flex items-center justify-center shadow-inner">
              <RotateCcw className="w-8 h-8 animate-spin-slow text-cyan-400" />
            </div>

            {/* Title & Explanation */}
            <div>
              <h2 className="text-lg font-black text-white flex items-center justify-center gap-2">
                <span>Sefa Store Protected</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                  SAFE MODE
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                White screen prevention is active. The application safely prevented a crash. Tap below to refresh and resume immediately.
              </p>
            </div>

            {/* Error snippet if available */}
            {this.state.error && (
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-rose-300/80 text-left overflow-x-auto max-h-24">
                {this.state.error.message || 'Transient layout state error'}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 stroke-[2.5]" />
                <span>Instant Reload & Restore</span>
              </button>

              <button
                onClick={this.handleResetCache}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Store Cache & Home</span>
              </button>
            </div>

            <div className="pt-2 text-[10px] text-slate-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Anti-Crash Protection System Active</span>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
