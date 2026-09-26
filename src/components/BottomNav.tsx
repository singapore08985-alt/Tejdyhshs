import React from 'react';
import { 
  Store, 
  Smartphone, 
  FolderDown, 
  ShoppingBag, 
  Layers
} from 'lucide-react';
import { triggerHapticFeedback } from '../utils/haptics';

interface BottomNavProps {
  activeTab: 'shop' | 'categories' | 'android' | 'downloads' | 'cart';
  onSelectTab: (tab: 'shop' | 'categories' | 'android' | 'downloads' | 'cart') => void;
  cartCount: number;
  downloadsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  cartCount,
  downloadsCount,
}) => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
      
      {/* Store */}
      <button
        onClick={() => {
          triggerHapticFeedback(15);
          onSelectTab('shop');
        }}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
          activeTab === 'shop' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Store className="w-5 h-5" />
        <span className="text-[10px] font-medium">Store</span>
      </button>

      {/* Categories */}
      <button
        onClick={() => {
          triggerHapticFeedback(15);
          onSelectTab('categories');
        }}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
          activeTab === 'categories' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Layers className="w-5 h-5" />
        <span className="text-[10px] font-medium">Categories</span>
      </button>

      {/* Android Center Hub */}
      <button
        onClick={() => {
          triggerHapticFeedback(20);
          onSelectTab('android');
        }}
        className="flex flex-col items-center gap-1 -mt-4 py-1 px-3 rounded-2xl bg-gradient-to-t from-emerald-600 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/30 active:scale-95 transition"
      >
        <div className="w-6 h-6 flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-slate-950 font-bold stroke-[2.5]" />
        </div>
        <span className="text-[10px] font-extrabold text-slate-950">Android</span>
      </button>

      {/* Downloads */}
      <button
        onClick={() => {
          triggerHapticFeedback(15);
          onSelectTab('downloads');
        }}
        className={`relative flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
          activeTab === 'downloads' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <FolderDown className="w-5 h-5" />
        <span className="text-[10px] font-medium">Downloads</span>
        {downloadsCount > 0 && (
          <span className="absolute top-0 right-1.5 w-4 h-4 bg-teal-500 text-slate-950 text-[9px] font-bold rounded-full flex items-center justify-center">
            {downloadsCount}
          </span>
        )}
      </button>

      {/* Cart */}
      <button
        onClick={() => {
          triggerHapticFeedback(15);
          onSelectTab('cart');
        }}
        className={`relative flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
          activeTab === 'cart' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <ShoppingBag className="w-5 h-5" />
        <span className="text-[10px] font-medium">Cart</span>
        {cartCount > 0 && (
          <span className="absolute top-0 right-1.5 w-4 h-4 bg-emerald-500 text-slate-950 text-[9px] font-bold rounded-full flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>

    </nav>
  );
};
