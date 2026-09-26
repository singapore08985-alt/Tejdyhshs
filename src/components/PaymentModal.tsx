import React, { useState, useEffect } from 'react';
import { 
  X, 
  Crown, 
  CheckCircle2, 
  ShieldCheck, 
  QrCode, 
  Copy, 
  Check, 
  ArrowRight, 
  Download, 
  AlertCircle, 
  ExternalLink,
  Clock,
  Sparkles,
  Calendar,
  Flame,
  Lock,
  RefreshCw,
  ShieldAlert,
  RotateCcw
} from 'lucide-react';
import { OrderRecord } from '../types';
import { triggerHapticFeedback, showAndroidToast } from '../utils/haptics';
import { notificationBus } from '../utils/notificationBus';

export interface PayableItem {
  id: string;
  title: string;
  priceINR: number;
  icon?: string;
  version?: string;
  fileSize?: string;
  durationDays?: number;
  startDate?: string;
  expiryDate?: string;
  type?: 'app' | 'ff_panel' | 'custom_feature' | 'plan';
  downloadUrl?: string;
  description?: string;
}

interface PaymentModalProps {
  item: PayableItem | null;
  onClose: () => void;
  onSuccessUnlock: (item: PayableItem) => void;
  currentUserId?: string;
  currentUserName?: string;
  logoUrl?: string;
  qrCodeUrl?: string;
  upiId?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  item,
  onClose,
  onSuccessUnlock,
  currentUserId = 'user-guest',
  currentUserName = 'Customer',
  logoUrl,
  qrCodeUrl,
  upiId,
}) => {
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [upiUrl, setUpiUrl] = useState<string>('');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isSubmittingUTR, setIsSubmittingUTR] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const ACTIVE_UPI_ID = upiId || 'sk-sefajultulla@fam';

  // 1. Initialize / Create Order on Server when modal opens
  useEffect(() => {
    if (!item) return;

    let isMounted = true;
    setIsCreatingOrder(true);
    setErrorMsg(null);

    fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUserId,
        userName: currentUserName,
        userPhoneOrEmail: 'customer@sefastore.in',
        itemType: item.type || 'app',
        itemId: item.id,
        itemTitle: item.title,
        amount: item.priceINR || 99,
        durationDays: item.durationDays || 30,
        startDate: item.startDate,
        expiryDate: item.expiryDate,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.order) {
          setOrder(data.order);
          setUpiUrl(data.upiUrl);
        } else {
          setErrorMsg(data.error || 'Failed to initialize payment order');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Order creation error:', err);
        setErrorMsg('Unable to connect to payment server. Please check internet.');
        notificationBus.notifyTechnicalError({
          title: 'Order Connection Failed',
          message: 'Unable to connect to payment server.',
          solution: 'Please verify your internet connection and retry.',
        });
      })
      .finally(() => {
        if (isMounted) setIsCreatingOrder(false);
      });

    return () => {
      isMounted = false;
    };
  }, [item, currentUserId, currentUserName]);

  // 2. Poll & Listen to Order Status in background if in PENDING state
  useEffect(() => {
    if (!order || order.status === 'PAID' || order.status === 'REJECTED') return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/events?userId=${currentUserId}`);
      eventSource.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data && (data.orderId === order.id || data.type === 'ORDER_VERIFIED')) {
            if (data.orderId === order.id && data.status === 'PAID') {
              setOrder((prev) => (prev ? { ...prev, status: 'PAID', downloadToken: data.downloadToken, verifiedAt: new Date().toISOString() } : prev));
              if (item) {
                triggerHapticFeedback([50, 100, 50]);
                notificationBus.notifyPaymentSuccess({
                  orderId: order.id,
                  itemTitle: item.title,
                  amount: order.amount,
                  downloadUrl: data.downloadToken ? `/api/downloads/${data.downloadToken}` : undefined,
                });
                notificationBus.notifyApkReady({
                  itemTitle: item.title,
                  version: item.version,
                  downloadUrl: data.downloadToken ? `/api/downloads/${data.downloadToken}` : (item.downloadUrl || '#'),
                  fileSize: item.fileSize,
                });
                onSuccessUnlock(item);
              }
            } else if (data.orderId === order.id && data.status === 'REJECTED') {
              setOrder((prev) => (prev ? { ...prev, status: 'REJECTED' } : prev));
              if (item) {
                notificationBus.notifyPaymentRejected({
                  orderId: order.id,
                  itemTitle: item.title,
                  reason: data.reason || 'Payment reference could not be verified by the bank.',
                });
              }
            }
          }
        } catch (err) {
          // ignore heartbeat / keep-alive
        }
      };
    } catch (err) {
      console.error('SSE connect error:', err);
    }

    const interval = setInterval(() => {
      fetch(`/api/orders/${order.id}/status`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.status) {
            if (data.status === 'PAID' && order.status !== 'PAID') {
              setOrder((prev) => (prev ? { ...prev, status: data.status, downloadToken: data.downloadToken, verifiedAt: data.verifiedAt } : prev));
              if (item) {
                triggerHapticFeedback([50, 100, 50]);
                notificationBus.notifyPaymentSuccess({
                  orderId: order.id,
                  itemTitle: item.title,
                  amount: order.amount,
                  downloadUrl: data.downloadToken ? `/api/downloads/${data.downloadToken}` : undefined,
                });
                notificationBus.notifyApkReady({
                  itemTitle: item.title,
                  version: item.version,
                  downloadUrl: data.downloadToken ? `/api/downloads/${data.downloadToken}` : (item.downloadUrl || '#'),
                  fileSize: item.fileSize,
                });
                onSuccessUnlock(item);
              }
              clearInterval(interval);
            } else if (data.status === 'REJECTED' && order.status !== 'REJECTED') {
              setOrder((prev) => (prev ? { ...prev, status: 'REJECTED' } : prev));
              if (item) {
                notificationBus.notifyPaymentRejected({
                  orderId: order.id,
                  itemTitle: item.title,
                  reason: 'Payment reference could not be verified by the bank.',
                });
              }
              clearInterval(interval);
            }
          }
        })
        .catch((e) => console.error('Status poll error:', e));
    }, 1200);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [order?.id, order?.status, currentUserId, item, onSuccessUnlock]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(ACTIVE_UPI_ID);
    setCopiedUpi(true);
    triggerHapticFeedback(15);
    showAndroidToast("UPI ID copied to clipboard!");
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !item) return;
    
    const cleanUtr = utrNumber.trim().replace(/[^0-9]/g, '');
    if (cleanUtr.length !== 12) {
      const msg = 'Please enter a valid 12-digit UPI UTR / Transaction Reference Number (e.g. 427189021948)';
      setErrorMsg(msg);
      notificationBus.notifyTechnicalError({
        title: 'Invalid UTR Length',
        message: 'The reference number must be exactly 12 digits.',
        solution: 'Check your UPI app (PhonePe, GPay, Paytm) transaction receipt and enter the 12-digit UTR.',
      });
      return;
    }

    setIsSubmittingUTR(true);
    setErrorMsg(null);
    triggerHapticFeedback(20);

    // Show pending verification status popup
    notificationBus.notifyPaymentPending({
      orderId: order.id,
      itemTitle: item.title,
      utrNumber: cleanUtr,
    });

    try {
      const res = await fetch('/api/payments/submit-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          utrNumber: cleanUtr,
        }),
      });
      const data = await res.json();

      if (data.success && data.order) {
        setOrder(data.order);
        if (data.order.status === 'PAID') {
          triggerHapticFeedback([40, 80, 40]);
          notificationBus.notifyPaymentSuccess({
            orderId: order.id,
            itemTitle: item.title,
            amount: order.amount,
            downloadUrl: data.order.downloadToken ? `/api/downloads/${data.order.downloadToken}` : undefined,
          });
          notificationBus.notifyApkReady({
            itemTitle: item.title,
            version: item.version,
            downloadUrl: data.order.downloadToken ? `/api/downloads/${data.order.downloadToken}` : (item.downloadUrl || '#'),
            fileSize: item.fileSize,
          });
          onSuccessUnlock(item);
        } else {
          showAndroidToast("UTR submitted! Verifying with banking network...");
          notificationBus.notifyPaymentPending({
            orderId: order.id,
            itemTitle: item.title,
            utrNumber: cleanUtr,
          });
        }
      } else {
        const errorText = data.error || 'Failed to verify payment reference';
        setErrorMsg(errorText);
        notificationBus.notifyPaymentRejected({
          orderId: order.id,
          itemTitle: item.title,
          reason: errorText,
        });
      }
    } catch (err) {
      const netErr = 'Network error verifying payment. Please retry.';
      setErrorMsg(netErr);
      notificationBus.notifyTechnicalError({
        title: 'Network Communication Error',
        message: 'Could not connect to payment gateway.',
        solution: 'Check your internet connection and re-tap "Submit UTR & Unlock Download".',
      });
    } finally {
      setIsSubmittingUTR(false);
    }
  };

  const handleManualCheckStatus = async () => {
    if (!order || !item) return;
    setIsCheckingStatus(true);
    triggerHapticFeedback(15);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`);
      const data = await res.json();
      if (data && data.status) {
        setOrder((prev) => (prev ? { ...prev, status: data.status, downloadToken: data.downloadToken } : prev));
        if (data.status === 'PAID') {
          triggerHapticFeedback([40, 80, 40]);
          notificationBus.notifyPaymentSuccess({
            orderId: order.id,
            itemTitle: item.title,
            amount: order.amount,
            downloadUrl: data.downloadToken ? `/api/downloads/${data.downloadToken}` : undefined,
          });
          notificationBus.notifyApkReady({
            itemTitle: item.title,
            version: item.version,
            downloadUrl: data.downloadToken ? `/api/downloads/${data.downloadToken}` : (item.downloadUrl || '#'),
            fileSize: item.fileSize,
          });
          onSuccessUnlock(item);
        } else if (data.status === 'REJECTED') {
          notificationBus.notifyPaymentRejected({
            orderId: order.id,
            itemTitle: item.title,
            reason: 'Payment reference was rejected by bank or admin.',
          });
        } else {
          showAndroidToast("Still verifying with bank rail. Please wait...");
        }
      }
    } catch (err) {
      showAndroidToast("Network check failed. Retrying...");
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const qrImageUrl = qrCodeUrl 
    ? qrCodeUrl 
    : order
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
        `upi://pay?pa=${ACTIVE_UPI_ID}&pn=Sefa%20Store&am=${order.amount}&cu=INR&tn=${order.id}`
      )}`
    : '';

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="w-full h-full object-cover" />
              ) : item.type === 'ff_panel' ? (
                <Flame className="w-5 h-5 text-orange-400" />
              ) : (
                <Crown className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>Direct UPI Checkout</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  Instant Auto-Unlock
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Order Ref: {order?.id || 'Generating...'}</p>
            </div>
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

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          
          {/* Item Preview Card */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-3">
              <img
                src={item.icon || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&auto=format&fit=crop&q=80'}
                alt=""
                className="w-12 h-12 rounded-xl object-cover border border-slate-700"
              />
              <div>
                <h4 className="text-sm font-bold text-white leading-tight">{item.title}</h4>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                  {item.durationDays && (
                    <span className="flex items-center gap-1 text-amber-400">
                      <Calendar className="w-3 h-3" />
                      <span>{item.durationDays} Days</span>
                    </span>
                  )}
                  {item.version && <span>{item.version}</span>}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Amount</span>
              <span className="text-lg font-black text-amber-400">₹{item.priceINR}</span>
            </div>
          </div>

          {/* 1. PAID STATE: Download Button Unlocked & Full Order Summary */}
          {order?.status === 'PAID' ? (
            <div className="py-6 px-4 rounded-3xl bg-gradient-to-b from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/50 text-center space-y-4 animate-in zoom-in-95 shadow-xl shadow-emerald-950/40">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>

              {/* Exact confirmation message requested by user */}
              <div className="space-y-1.5">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Success / Paid</span>
                </span>
                <h4 className="text-lg font-black text-white">Payment Successful!</h4>
                <p className="text-sm font-semibold text-emerald-300 max-w-sm mx-auto leading-relaxed">
                  “Payment Successful! Thank you for your purchase. Enjoy our panel!”
                </p>
              </div>

              {/* Purchased Price & Details Card */}
              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-emerald-500/20 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300 pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Purchased Item:</span>
                  <span className="font-bold text-white text-right truncate max-w-[200px]">{item.title}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Order ID:</span>
                  <span className="font-mono font-bold text-indigo-300">{order.id}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Purchased Price:</span>
                  <span className="font-black text-amber-400 text-sm">₹{order.amount || item.priceINR}</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Payment Status:</span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-black text-[10px] uppercase">
                    Success / Paid
                  </span>
                </div>
                {order.utrNumber && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Verified UTR:</span>
                    <span className="font-mono text-emerald-300 text-[11px]">{order.utrNumber}</span>
                  </div>
                )}
                {item.durationDays && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400">Access Validity:</span>
                    <span className="font-semibold text-indigo-300">{item.durationDays} Days VIP Access</span>
                  </div>
                )}
              </div>

              {/* Clear Download Button */}
              <div className="pt-2 space-y-2">
                <a
                  href={`/api/downloads/${order.downloadToken}`}
                  download
                  onClick={() => {
                    triggerHapticFeedback([40, 80, 40]);
                    notificationBus.notifyDownloadStarted({
                      itemTitle: item.title,
                      fileSize: item.fileSize,
                    });
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
                >
                  <Download className="w-5 h-5 stroke-[2.5]" />
                  <span>Download Purchased APK / Panel Now</span>
                </a>

                <p className="text-[11px] text-slate-400">
                  This purchase is also saved in your <span className="text-indigo-400 font-semibold">Notifications</span> and <span className="text-indigo-400 font-semibold">My Orders</span> section.
                </p>
              </div>
            </div>
          ) : order?.status === 'PENDING' && order?.utrNumber ? (
            /* 2. PENDING STATE: UTR Submitted, Awaiting Genuine Bank Rail or Admin Settlement */
            <div className="py-6 px-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-center space-y-4 animate-in zoom-in-95">
              <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping"></div>
                <div className="relative w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Lock className="w-7 h-7" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                  <Clock className="w-3 h-3 animate-spin" />
                  <span>Reconciling with Banking Rails</span>
                </span>
                <h4 className="text-base font-black text-white pt-1">UTR Verification In Progress</h4>
                <p className="text-xs text-slate-300 max-w-xs mx-auto">
                  APK access is strictly locked until genuine payment is verified. Verification occurs in real-time.
                </p>
              </div>

              {/* Order & UTR Details */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Order Reference:</span>
                  <span className="font-mono text-slate-200">{order.id}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Submitted UTR:</span>
                  <span className="font-mono font-bold text-amber-400 tracking-wider">{order.utrNumber}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Amount to Verify:</span>
                  <span className="font-bold text-emerald-400">₹{order.amount}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-800">
                  <span>Status:</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase text-[10px]">
                    Pending Verification
                  </span>
                </div>
              </div>

              {/* Real-time actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleManualCheckStatus}
                  disabled={isCheckingStatus}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                  <span>{isCheckingStatus ? 'Checking...' : 'Check Status Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOrder({ ...order, utrNumber: undefined });
                    setUtrNumber('');
                    setErrorMsg(null);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Edit UTR</span>
                </button>
              </div>

              <span className="text-[10px] text-slate-400 block">
                ⚡ Automatic sound alert & instant unlock will trigger as soon as bank settles.
              </span>
            </div>
          ) : order?.status === 'REJECTED' ? (
            /* 3. REJECTED STATE: UTR Invalid or Not Received in Bank Statement */
            <div className="py-6 px-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-center space-y-4 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-black text-white">Payment Reference Rejected</h4>
                <p className="text-xs text-rose-300 max-w-xs mx-auto">
                  {order.adminNotes || errorMsg || 'The submitted 12-digit UTR could not be reconciled with banking records.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-900/50 text-left text-xs text-slate-300 space-y-1">
                <span className="font-bold text-rose-400 block text-[11px] uppercase">What to do next:</span>
                <p className="text-[11px] text-slate-400">
                  1. Check your PhonePe / GPay / Paytm payment receipt.
                </p>
                <p className="text-[11px] text-slate-400">
                  2. Ensure you copied the full 12-digit UTR / UPI Reference without typos.
                </p>
                <p className="text-[11px] text-slate-400">
                  3. Enter the genuine UTR below to verify again.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOrder({ ...order, status: 'PENDING', utrNumber: undefined });
                  setUtrNumber('');
                  setErrorMsg(null);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer shadow-lg shadow-rose-600/20"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Re-enter Genuine 12-Digit UTR</span>
              </button>
            </div>
          ) : (
            /* 4. DEFAULT STATE: Scan UPI QR & Submit UTR */
            <>
              {/* QR Code & Pay Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300 pb-1 border-b border-slate-800">
                  <span className="font-semibold flex items-center gap-1">
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>Scan with Any UPI App</span>
                  </span>
                  <span className="text-[11px] text-amber-400 font-mono">GPay / PhonePe / Paytm</span>
                </div>

                {/* QR Code Image */}
                <div className="w-48 h-48 mx-auto bg-white p-2 rounded-2xl shadow-lg border-2 border-amber-500/30 flex items-center justify-center">
                  {qrImageUrl ? (
                    <img
                      src={qrImageUrl}
                      alt="UPI QR Code"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-xs text-slate-600 animate-pulse">Generating QR...</div>
                  )}
                </div>

                {/* UPI ID Copy Field */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">UPI ID (Copy & Pay)</span>
                    <span className="text-xs font-mono font-bold text-amber-300">{ACTIVE_UPI_ID}</span>
                  </div>
                  <button
                    onClick={handleCopyUpi}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUpi ? 'Copied' : 'Copy UPI'}</span>
                  </button>
                </div>

                {/* Direct Mobile UPI App Button */}
                {upiUrl && (
                  <a
                    href={upiUrl}
                    onClick={() => triggerHapticFeedback(10)}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Pay directly via UPI App on Phone</span>
                  </a>
                )}
              </div>

              {/* Step 2: Enter 12-Digit UTR Number */}
              <form onSubmit={handleSubmitUtr} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Enter 12-Digit UPI Ref / UTR Number:</span>
                    <span className="text-[10px] text-emerald-400 font-normal">Strict Bank Verification</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 427189021948"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={16}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-amber-500 transition tracking-widest placeholder:tracking-normal placeholder:text-slate-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Found in payment receipt on PhonePe, GPay, Paytm, or BHIM.
                  </span>
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmittingUTR || !utrNumber.trim()}
                  className={`w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-lg ${
                    isSubmittingUTR || !utrNumber.trim()
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-amber-500/20'
                  }`}
                >
                  {isSubmittingUTR ? (
                    <span>Verifying UTR...</span>
                  ) : (
                    <>
                      <span>Submit UTR for Verification</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
