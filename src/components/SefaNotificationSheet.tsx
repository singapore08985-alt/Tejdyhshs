import React from 'react';
import { 
  X, 
  Bell, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  KeyRound, 
  Smartphone,
  Download,
  CheckCircle2,
  Package,
  ShieldCheck
} from 'lucide-react';
import { StoreNotification } from '../types';
import { triggerHapticFeedback, showAndroidToast } from '../utils/haptics';
import { notificationBus } from '../utils/notificationBus';

interface SefaNotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: StoreNotification[];
}

export const SefaNotificationSheet: React.FC<SefaNotificationSheetProps> = ({
  isOpen,
  onClose,
  notifications,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    triggerHapticFeedback(15);
    showAndroidToast("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 overflow-hidden mt-12 sm:mt-0">
        
        {/* Header (matching video 00:03) */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Notifications</h3>
          </div>
          <button
            onClick={() => {
              triggerHapticFeedback(10);
              onClose();
            }}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No notifications at this time.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {n.isNew && (
                      <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[9px] font-black uppercase">
                        NEW
                      </span>
                    )}
                    <h4 className="text-xs font-bold text-slate-100 leading-snug">
                      {n.title}
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap flex-shrink-0">
                    {n.date}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {n.message}
                </p>

                {/* Verified Purchase Details Box */}
                {(n.orderId || n.paymentStatus || n.downloadUrl) && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-2 mt-2">
                    <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[11px] text-slate-400">Order:</span>
                        <span className="font-mono font-bold text-slate-200 text-[11px]">{n.orderId || 'Verified'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {n.amount && (
                          <span className="text-xs font-black text-amber-400">₹{n.amount}</span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{n.paymentStatus || 'PAID'}</span>
                        </span>
                      </div>
                    </div>

                    {n.downloadUrl && (
                      <a
                        href={n.downloadUrl}
                        download
                        onClick={() => {
                          triggerHapticFeedback([40, 80, 40]);
                          notificationBus.notifyDownloadStarted({
                            itemTitle: n.itemTitle || n.title || 'Purchased File',
                          });
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
                      >
                        <Download className="w-4 h-4 stroke-[2.5]" />
                        <span>Download APK Package</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Password if available */}
                {n.password && (
                  <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/20 flex items-center justify-between text-xs text-amber-300">
                    <span className="font-mono text-[11px] truncate">{n.password}</span>
                    <button
                      onClick={() => handleCopy(n.id, n.password!)}
                      className="text-[10px] text-indigo-300 hover:underline flex items-center gap-1 ml-2 flex-shrink-0"
                    >
                      {copiedId === n.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                )}

                {/* External link if available */}
                {n.link && (
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <a
                      href={n.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono truncate max-w-[280px]"
                    >
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{n.link}</span>
                    </a>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
