import React from 'react';
import { 
  ShoppingBag, 
  Smartphone, 
  Search, 
  Download, 
  Package, 
  SlidersHorizontal,
  FolderDown,
  Sparkles
} from 'lucide-react';
import { Currency } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { triggerHapticFeedback } from '../utils/haptics';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  currency: Currency;
  onToggleCurrency: () => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenDownloads: () => void;
  onOpenAndroidHub: () => void;
  isDeviceMode: boolean;
  onToggleDeviceMode: () => void;
  downloadsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  currency,
  onToggleCurrency,
  cartCount,
  onOpenCart,
  onOpenDownloads,
  onOpenAndroidHub,
  isDeviceMode,
  onToggleDeviceMode,
  downloadsCount,
}) => {
  const { isInstallable, install } = usePWAInstall();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        
        {/* Logo & Brand */}
        <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none" onClick={() => triggerHapticFeedback(10)}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-md shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
            </div>
            {/* Small Android green dot */}
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                JHX <span className="text-emerald-400">Digital</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                Android
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden xs:block -mt-0.5">
              Apps, UI Kits & Source Code
            </p>
          </div>
        </div>

        {/* Center Search Input */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search Android apps, Figma kits, boilerplates..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-700/70 focus:border-emerald-500 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Currency Switcher */}
          <button
            onClick={() => {
              triggerHapticFeedback(10);
              onToggleCurrency();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition"
            title="Change Currency"
          >
            {currency === 'INR' ? '₹ INR' : '$ USD'}
          </button>

          {/* Android Mobile Frame Toggle (Desktop only) */}
          <button
            onClick={() => {
              triggerHapticFeedback(10);
              onToggleDeviceMode();
            }}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              isDeviceMode
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Toggle Android Device Frame Simulation"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{isDeviceMode ? 'Exit Phone View' : 'Android View'}</span>
          </button>

          {/* Android APK Hub CTA Button */}
          <button
            onClick={() => {
              triggerHapticFeedback(15);
              onOpenAndroidHub();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs font-bold transition active:scale-95 shadow-sm"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Android APK</span>
            <span className="sm:hidden">APK</span>
          </button>

          {/* 1-Tap PWA Install Button */}
          {isInstallable && (
            <button
              onClick={() => {
                triggerHapticFeedback(20);
                install();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          {/* My Downloads button */}
          <button
            onClick={() => {
              triggerHapticFeedback(10);
              onOpenDownloads();
            }}
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            title="My Purchases & Downloads"
          >
            <FolderDown className="w-4 h-4" />
            {downloadsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-teal-500 text-[10px] font-bold text-slate-950 rounded-full flex items-center justify-center">
                {downloadsCount}
              </span>
            )}
          </button>

          {/* Cart Button */}
          <button
            onClick={() => {
              triggerHapticFeedback(15);
              onOpenCart();
            }}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:border-slate-700 transition"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold">{cartCount}</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-[10px] font-bold text-slate-950 rounded-full flex items-center justify-center shadow">
                {cartCount}
              </span>
            )}
          </button>

        </div>

      </div>

      {/* Mobile search bar */}
      <div className="px-4 pb-3 md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search apps, templates, kits..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>
    </header>
  );
};
