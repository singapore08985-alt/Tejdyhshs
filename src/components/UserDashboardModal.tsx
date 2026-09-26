import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Crown, 
  Download, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Package, 
  RefreshCw, 
  Key,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { OrderRecord, UserAccount } from '../types';
import { triggerHapticFeedback, showAndroidToast } from '../utils/haptics';

interface UserDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const UserDashboardModal: React.FC<UserDashboardModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserData = () => {
    if (!userId) return;
    setIsLoading(true);
    fetch(`/api/user/${userId}/dashboard`)
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
        if (Array.isArray(data.orders)) setOrders(data.orders);
      })
      .catch((err) => console.error('Failed to load user dashboard:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (!isOpen || !userId) return;

    fetchUserData();

    // SSE Real-time Listener for immediate dashboard order update
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/events?userId=${userId}`);
      eventSource.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data && (data.type === 'ORDER_VERIFIED' || data.type === 'ORDER_REJECTED' || data.userId === userId)) {
            fetchUserData();
          }
        } catch (e) {
          // ignore heartbeat
        }
      };
    } catch (e) {
      console.error('SSE error:', e);
    }

    // Auto-polling interval every 2.5 seconds while modal is open
    const interval = setInterval(() => {
      fetchUserData();
    }, 2500);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white leading-none">
                My Sefa Dashboard
              </h3>
              <span className="text-[10px] text-slate-400">Orders, VIP Access & Downloads</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchUserData}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* User Profile Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950/40 to-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-black text-lg flex items-center justify-center shadow-md">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div>
                <h4 className="text-sm font-black text-white">{user?.name || 'Customer Account'}</h4>
                <div className="text-[11px] text-slate-400 font-mono">ID: {userId}</div>
              </div>
            </div>

            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase flex items-center gap-1">
                <Crown className="w-3 h-3" />
                {user?.plan === 'vip_lifetime' ? 'VIP Lifetime' : user?.plan === 'vip_monthly' ? 'VIP Monthly' : 'Standard'}
              </span>
            </div>
          </div>

          {/* Section: My Orders & Payments */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-indigo-400" />
                <span>My Orders & Transactions ({orders.length})</span>
              </h4>
            </div>

            {orders.length === 0 ? (
              <div className="py-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80 p-4 space-y-2">
                <p className="text-xs text-slate-400">No orders placed yet.</p>
                <p className="text-[11px] text-slate-500">
                  Select any VIP App or plan in the store to unlock direct downloads.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-white">{o.itemTitle}</h5>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Order ID: <span className="font-mono text-indigo-300">{o.id}</span> • ₹{o.amount}
                        </div>
                      </div>

                      {/* Status Pill */}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                        o.status === 'PAID'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : o.status === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : o.status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {o.status === 'PAID' && <CheckCircle2 className="w-3 h-3" />}
                        {o.status === 'PENDING' && <Clock className="w-3 h-3 animate-spin" />}
                        <span>{o.status}</span>
                      </span>
                    </div>

                    {/* Download Button if PAID */}
                    {o.status === 'PAID' && o.downloadToken && (
                      <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-900">
                        <span className="text-[10px] text-slate-500 font-mono">
                          Downloads: {o.downloadCount}
                        </span>
                        <a
                          href={`/api/downloads/${o.downloadToken}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow hover:scale-105 transition"
                        >
                          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Download APK</span>
                        </a>
                      </div>
                    )}

                    {o.status === 'PENDING' && (
                      <div className="text-[10px] text-amber-400/90 pt-1 flex items-center gap-1 border-t border-slate-900">
                        <Clock className="w-3 h-3" />
                        <span>Awaiting payment verification (UTR: {o.utrNumber || 'Not submitted'})</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
