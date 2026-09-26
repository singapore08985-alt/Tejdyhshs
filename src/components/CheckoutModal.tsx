import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  CheckCircle2, 
  CreditCard, 
  Smartphone, 
  Lock, 
  ShieldCheck, 
  Download, 
  Sparkles,
  QrCode,
  Copy
} from 'lucide-react';
import { CartItem, Currency, Order } from '../types';
import { triggerHapticFeedback, showAndroidToast } from '../utils/haptics';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currency: Currency;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  currency,
  onOrderSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'gpay' | 'card'>('upi');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce((acc, item) => acc + item.price, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Please enter your email to receive download links.');
      return;
    }

    triggerHapticFeedback(20);
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      
      // Generate unique license key
      const randHex = Math.random().toString(36).substring(2, 6).toUpperCase();
      const randHex2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      const licenseKey = `JHX-ANDROID-${randHex}-${randHex2}`;

      const newOrder: Order = {
        id: `ORD-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        items: [...cartItems],
        total: totalAmount,
        currency,
        licenseKey,
        status: 'completed',
        downloadUrl: '/digital-shop-android-project.zip',
      };

      setCompletedOrder(newOrder);
      onOrderSuccess(newOrder);

      // Trigger Confetti
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#fbbf24', '#ffffff'],
        });
      } catch (ignored) {}

      triggerHapticFeedback([50, 80, 50]);
      showAndroidToast("Purchase successful! License generated.");
    }, 1200);
  };

  const handleDownloadFile = () => {
    triggerHapticFeedback(20);
    // Create license file blob to trigger actual download
    const content = `=====================================================
JHX DIGITAL SHOP - OFFICIAL LICENSE CERTIFICATE
=====================================================
Order ID: ${completedOrder?.id}
Date: ${completedOrder?.date}
Customer: ${email}
License Key: ${completedOrder?.licenseKey}

ITEMS PURCHASED:
${completedOrder?.items.map((it) => `- ${it.product.title} (${it.license.toUpperCase()} LICENSE)`).join('\n')}

ANDROID SETUP:
If you purchased Android source code, you can open the included
project directly in Android Studio.
Package: com.jhx.digitalshop
Main File: MainActivity.kt

Support: support@jhxdigital.shop
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JHX_License_${completedOrder?.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              {completedOrder ? 'Order Completed!' : 'Secure Digital Checkout'}
            </h2>
          </div>
          <button
            onClick={() => {
              triggerHapticFeedback(10);
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {completedOrder ? (
          <div className="p-6 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Thank You for Your Order!</h3>
              <p className="text-xs text-slate-400">
                Your digital products and license keys are ready for instant download.
              </p>
            </div>

            {/* License Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>License Key</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(completedOrder.licenseKey);
                    triggerHapticFeedback(15);
                    showAndroidToast("License key copied!");
                  }}
                  className="flex items-center gap-1 text-emerald-400 hover:underline"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
              <div className="font-mono text-sm font-bold text-emerald-400 bg-slate-900 px-3 py-2 rounded-lg border border-slate-800">
                {completedOrder.licenseKey}
              </div>
              <div className="text-[11px] text-slate-500">
                Order ID: {completedOrder.id} • Registered to: {email}
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <a
                href="/digital-shop-android-project.zip"
                download="digital-shop-android-project.zip"
                onClick={() => triggerHapticFeedback(20)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                Download Android Studio Project (.ZIP)
              </a>

              <button
                onClick={handleDownloadFile}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Download License Certificate (.txt)
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            
            {/* Amount Summary */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Total payable</span>
                <div className="text-lg font-black text-white">
                  {currency === 'INR' ? '₹' : '$'}{totalAmount.toLocaleString()}
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-semibold">
                Instant Access
              </span>
            </div>

            {/* User Details */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email for Digital Delivery <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name / Developer Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Select Payment Method
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(10);
                    setPaymentMethod('upi');
                  }}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'upi'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold">UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(10);
                    setPaymentMethod('gpay');
                  }}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'gpay'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold">Google Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerHapticFeedback(10);
                    setPaymentMethod('card');
                  }}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition ${
                    paymentMethod === 'card'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold">Cards / Net</span>
                </button>
              </div>

              {/* UPI Preview simulation */}
              {paymentMethod === 'upi' && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="font-semibold text-white">Instant UPI Auto-Pay</div>
                      <div className="text-[10px] text-slate-400">BHIM, PhonePe, Paytm supported</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                    Zero Fee
                  </span>
                </div>
              )}
            </div>

            {/* Pay Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition active:scale-95"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing Digital Payment...</span>
                </div>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Pay {currency === 'INR' ? '₹' : '$'}{totalAmount.toLocaleString()} & Get Files</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>256-Bit SSL Encrypted • Instant Key Generator</span>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
