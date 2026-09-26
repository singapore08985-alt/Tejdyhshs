import React, { useState, useEffect } from 'react';
import { Wrench, Shield, Sparkles, Lock, RefreshCw } from 'lucide-react';
import { triggerHapticFeedback } from '../utils/haptics';

interface MaintenanceScreenProps {
  message: string;
  storeName: string;
  logoUrl?: string;
  onOpenHiddenAdmin: () => void;
  onRefresh: () => void;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({
  message,
  storeName,
  logoUrl,
  onOpenHiddenAdmin,
  onRefresh,
}) => {
  const [tapCount, setTapCount] = useState(0);

  // Hidden 5-tap sequence on the Logo / Wrench icon to open Admin Login
  const handleTap = () => {
    const next = tapCount + 1;
    setTapCount(next);
    triggerHapticFeedback(10);
    if (next >= 5) {
      setTapCount(0);
      triggerHapticFeedback([40, 80, 40]);
      onOpenHiddenAdmin();
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setTapCount(0), 2000);
    return () => clearTimeout(timer);
  }, [tapCount]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="max-w-md w-full space-y-6">
        
        {/* Logo / Wrench icon with secret tap handler */}
        <div 
          onClick={handleTap}
          className="w-20 h-20 rounded-3xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-400 flex items-center justify-center mx-auto shadow-2xl shadow-indigo-950/50 active:scale-95 transition cursor-pointer overflow-hidden"
          title="Status"
        >
          {logoUrl ? (
            <img src={logoUrl} alt={storeName} className="w-full h-full object-cover" />
          ) : (
            <Wrench className="w-10 h-10 animate-bounce" />
          )}
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest">
            MAINTENANCE IN PROGRESS
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            {storeName} Under Maintenance
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto">
            {message || 'We are currently upgrading server systems and APK repositories. Please check back shortly.'}
          </p>
        </div>

        <div className="pt-4 flex flex-col items-center gap-3">
          <button
            onClick={() => {
              triggerHapticFeedback(15);
              onRefresh();
            }}
            className="px-6 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-2 hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Check if Online</span>
          </button>

          <p className="text-[10px] text-slate-600">
            Authorized administrators can access the console via configured secret shortcut.
          </p>
        </div>

      </div>
    </div>
  );
};
