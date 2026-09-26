import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Download, 
  Sparkles, 
  ExternalLink, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Info, 
  ArrowRight,
  HelpCircle,
  Megaphone,
  ShieldAlert
} from 'lucide-react';
import { PopupEvent, notificationBus } from '../utils/notificationBus';
import { soundAlerts } from '../utils/soundAlerts';
import { triggerHapticFeedback } from '../utils/haptics';

export const GlobalNotificationPopup: React.FC = () => {
  const [currentPopup, setCurrentPopup] = useState<PopupEvent | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => soundAlerts.isEnabled());
  const [isClosing, setIsClosing] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = notificationBus.subscribe((event) => {
      setCurrentPopup(event);
      setIsClosing(false);
    });
    return unsubscribe;
  }, []);

  // Handle auto-dismiss if specified
  useEffect(() => {
    if (!currentPopup || !currentPopup.autoDismissMs || currentPopup.autoDismissMs <= 0) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, currentPopup.autoDismissMs);

    return () => clearTimeout(timer);
  }, [currentPopup]);

  const handleDismiss = () => {
    setIsClosing(true);
    triggerHapticFeedback(10);
    setTimeout(() => {
      if (currentPopup) {
        notificationBus.dismiss(currentPopup.id);
      }
      setCurrentPopup(null);
      setIsClosing(false);
    }, 200);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundAlerts.setEnabled(next);
    triggerHapticFeedback(15);
    if (next) {
      soundAlerts.playNotification();
    }
  };

  if (!currentPopup) return null;

  // Visual theming based on event type
  const getTheme = () => {
    switch (currentPopup.type) {
      case 'PAYMENT_SUCCESS':
        return {
          border: 'border-emerald-500/50',
          bgGradient: 'from-emerald-950/90 via-slate-900 to-slate-950',
          iconBg: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          Icon: CheckCircle2,
          glow: 'shadow-emerald-500/10',
        };
      case 'APK_READY':
        return {
          border: 'border-cyan-500/50',
          bgGradient: 'from-cyan-950/90 via-slate-900 to-slate-950',
          iconBg: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400',
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          Icon: Sparkles,
          glow: 'shadow-cyan-500/10',
        };
      case 'PAYMENT_PENDING':
        return {
          border: 'border-amber-500/50',
          bgGradient: 'from-amber-950/90 via-slate-900 to-slate-950',
          iconBg: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          Icon: Clock,
          glow: 'shadow-amber-500/10',
        };
      case 'PAYMENT_REJECTED':
        return {
          border: 'border-rose-500/50',
          bgGradient: 'from-rose-950/90 via-slate-900 to-slate-950',
          iconBg: 'bg-rose-500/20 border-rose-500/40 text-rose-400',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          Icon: ShieldAlert,
          glow: 'shadow-rose-500/10',
        };
      case 'TECHNICAL_ERROR':
        return {
          border: 'border-rose-500/50',
          bgGradient: 'from-rose-950/90 via-slate-900 to-slate-950',
          iconBg: 'bg-rose-500/20 border-rose-500/40 text-rose-400',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          Icon: AlertTriangle,
          glow: 'shadow-rose-500/10',
        };
      case 'DOWNLOAD_STARTED':
        return {
          border: 'border-indigo-500/50',
          bgGradient: 'from-indigo-950/90 via-slate-900 to-slate-950',
          iconBg: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400',
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          Icon: Download,
          glow: 'shadow-indigo-500/10',
        };
      case 'ADMIN_UPDATE':
      default:
        return {
          border: 'border-indigo-500/50',
          bgGradient: 'from-indigo-950/90 via-slate-900 to-slate-950',
          iconBg: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400',
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          Icon: Megaphone,
          glow: 'shadow-indigo-500/10',
        };
    }
  };

  const theme = getTheme();
  const IconComponent = theme.Icon;

  return (
    <div className="fixed inset-x-0 bottom-4 sm:bottom-6 z-50 flex justify-center px-3 sm:px-4 pointer-events-none select-none">
      <div 
        className={`pointer-events-auto max-w-md w-full bg-gradient-to-b ${theme.bgGradient} border ${theme.border} rounded-3xl p-4 sm:p-5 shadow-2xl ${theme.glow} backdrop-blur-xl transition-all duration-300 ${
          isClosing ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100 animate-in slide-in-from-bottom-5'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${theme.iconBg} flex-shrink-0`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-white leading-tight">
                  {currentPopup.title}
                </h4>
                {currentPopup.badge && (
                  <span className={`px-2 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider border ${theme.badgeBg}`}>
                    {currentPopup.badge}
                  </span>
                )}
              </div>
              {currentPopup.itemTitle && (
                <p className="text-[11px] text-slate-400 font-medium">
                  {currentPopup.itemTitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Sound Toggle Button */}
            <button
              onClick={handleToggleSound}
              title={soundEnabled ? 'Sound Alerts On' : 'Sound Alerts Muted'}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Body */}
        <div className="py-3 space-y-2.5 text-xs text-slate-200">
          <p className="leading-relaxed">
            {currentPopup.message}
          </p>

          {/* Actionable Guidance / "Kya karna hai" box for errors or pending states */}
          {currentPopup.solution && (
            <div className="p-2.5 rounded-2xl bg-black/40 border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Next Step / Kya karna hai:</span>
              </span>
              <p className="text-slate-400 leading-normal pl-4">
                {currentPopup.solution}
              </p>
            </div>
          )}
        </div>

        {/* Action Button Row */}
        <div className="pt-1 flex items-center gap-2">
          {currentPopup.action && (
            currentPopup.action.downloadUrl ? (
              <a
                href={currentPopup.action.downloadUrl}
                download
                onClick={() => {
                  triggerHapticFeedback([40, 80, 40]);
                  currentPopup.action?.onClick?.();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>{currentPopup.action.label}</span>
              </a>
            ) : (
              <button
                onClick={() => {
                  triggerHapticFeedback(15);
                  currentPopup.action?.onClick?.();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition active:scale-95 cursor-pointer"
              >
                <span>{currentPopup.action.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )
          )}

          {currentPopup.secondaryAction ? (
            <button
              onClick={() => {
                triggerHapticFeedback(10);
                currentPopup.secondaryAction?.onClick?.();
              }}
              className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition active:scale-95 cursor-pointer"
            >
              {currentPopup.secondaryAction.label}
            </button>
          ) : (
            <button
              onClick={handleDismiss}
              className="py-2.5 px-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition active:scale-95 cursor-pointer"
            >
              Dismiss
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
