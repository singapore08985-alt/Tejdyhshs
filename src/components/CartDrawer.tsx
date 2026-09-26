import React, { useState } from 'react';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  Tag,
  Sparkles,
  Zap
} from 'lucide-react';
import { CartItem, Currency } from '../types';
import { triggerHapticFeedback } from '../utils/haptics';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  currency: Currency;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  currency,
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const rawSubtotal = cartItems.reduce((acc, item) => acc + item.price, 0);
  const discountAmount = Math.round(rawSubtotal * appliedDiscount);
  const total = rawSubtotal - discountAmount;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHapticFeedback(15);
    const code = couponCode.trim().toUpperCase();
    if (code === 'ANDROID20' || code === 'JHX20') {
      setAppliedDiscount(0.20);
      setCouponMessage('Coupon ANDROID20 applied! 20% discount granted.');
    } else {
      setCouponMessage('Invalid coupon code. Try ANDROID20');
      setAppliedDiscount(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-100 animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Your Cart ({cartItems.length})</h2>
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

        {/* Drawer Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-500">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-200">Your cart is empty</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Explore Android source code, UI kits, and boilerplates to add them to your cart.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item, idx) => (
                <div 
                  key={`${item.product.id}-${idx}`}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3 relative group"
                >
                  <img
                    src={item.product.thumbnail}
                    alt={item.product.title}
                    className="w-14 h-14 object-cover rounded-lg bg-slate-800 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      {item.product.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="capitalize font-mono text-emerald-400/90">{item.license} license</span>
                      <span>•</span>
                      <span>{item.product.fileFormat}</span>
                    </div>
                    <div className="text-xs font-black text-white mt-1">
                      {currency === 'INR' ? '₹' : '$'}{item.price.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      triggerHapticFeedback(15);
                      onRemoveItem(idx);
                    }}
                    className="p-2 text-slate-500 hover:text-rose-400 transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    triggerHapticFeedback(10);
                    onClearCart();
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-300 transition underline"
                >
                  Clear all items
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer / Checkout */}
        {cartItems.length > 0 && (
          <div className="p-5 border-t border-slate-800 bg-slate-950/90 space-y-4">
            
            {/* Coupon Code Input */}
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Coupon: try ANDROID20"
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100 uppercase placeholder:normal-case focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
              >
                Apply
              </button>
            </form>

            {couponMessage && (
              <p className={`text-[11px] font-medium ${appliedDiscount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {couponMessage}
              </p>
            )}

            {/* Calculations */}
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono text-slate-200">
                  {currency === 'INR' ? '₹' : '$'}{rawSubtotal.toLocaleString()}
                </span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Android Special Discount (20%)</span>
                  <span className="font-mono">
                    -{currency === 'INR' ? '₹' : '$'}{discountAmount.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-black text-white">
                <span>Total Amount</span>
                <span className="font-mono text-emerald-400 text-base">
                  {currency === 'INR' ? '₹' : '$'}{total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => {
                triggerHapticFeedback(25);
                onProceedToCheckout();
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>Checkout & Instant Download</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant Digital Delivery • UPI & Cards Accepted</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
