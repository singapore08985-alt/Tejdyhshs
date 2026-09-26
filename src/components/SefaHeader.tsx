import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Mic, 
  Moon, 
  Sun, 
  Bell, 
  Home, 
  MoreVertical, 
  Zap, 
  X, 
  ExternalLink, 
  RefreshCw,
  Info,
  Youtube,
  User,
  MessageCircle,
  Send,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Flame
} from 'lucide-react';
import { StoreSettings } from '../types';
import { triggerHapticFeedback, showAndroidToast } from '../utils/haptics';

interface SefaHeaderProps {
  settings: StoreSettings;
  totalAppsCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenUserDashboard: () => void;
  onSecretAdminTrigger: () => void;
  onResetToDefault: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onGoHome: () => void;
  onOpenHelp?: () => void;
}

export const SefaHeader: React.FC<SefaHeaderProps> = ({
  settings,
  totalAppsCount,
  searchQuery,
  onSearchChange,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenUserDashboard,
  onSecretAdminTrigger,
  onResetToDefault,
  isDarkMode,
  onToggleDarkMode,
  onGoHome,
  onOpenHelp,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [secretTaps, setSecretTaps] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Hidden 5-tap on lightning bolt to trigger admin login screen
  const handleSecretTap = () => {
    const next = secretTaps + 1;
    setSecretTaps(next);
    triggerHapticFeedback(10);
    if (next >= 5) {
      setSecretTaps(0);
      triggerHapticFeedback([40, 80, 40]);
      onSecretAdminTrigger();
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setSecretTaps(0), 1800);
    return () => clearTimeout(timer);
  }, [secretTaps]);

  // Close 3-dots menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Voice search
  const handleVoiceSearch = () => {
    triggerHapticFeedback(20);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.onstart = () => {
        setIsListening(true);
        showAndroidToast("Listening for app name...");
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onSearchChange(transcript);
        setIsListening(false);
        showAndroidToast(`Searching for: ${transcript}`);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } else {
      showAndroidToast("Voice search ready. Say 'Termux' or 'Free Fire'");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/75 backdrop-blur-2xl border-b border-indigo-500/20 pb-3 pt-2.5 px-3 sm:px-5 select-none shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
      
      {/* Row 1: Top Bar with Title, Home, 3-dots Menu */}
      <div className="flex items-center justify-between h-11 mb-2.5">
        <div 
          onClick={onGoHome}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="relative">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-60 blur-xs group-hover:opacity-100 transition duration-300" />
            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-950 border border-cyan-400/50 flex items-center justify-center overflow-hidden">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400/40" />
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-base sm:text-xl font-black bg-gradient-to-r from-cyan-300 via-indigo-200 to-fuchsia-300 bg-clip-text text-transparent tracking-wide drop-shadow-[0_0_12px_rgba(99,102,241,0.4)]">
              {settings.storeName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Home button */}
          <button
            onClick={() => {
              triggerHapticFeedback(10);
              onGoHome();
            }}
            className="p-2 rounded-xl text-slate-300 hover:text-cyan-300 hover:bg-slate-800/70 border border-transparent hover:border-cyan-500/30 active:scale-95 transition"
            title="Home"
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          </button>

          {/* 3-dots Menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => {
                triggerHapticFeedback(10);
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/70 border border-transparent hover:border-slate-700 active:scale-95 transition"
              title="More options"
            >
              <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-11 w-56 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-indigo-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.8)] py-2 z-50 animate-in fade-in duration-150">
                <a
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800/80 transition"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  <span>Google Play Store</span>
                </a>

                {/* WhatsApp Support */}
                {settings.whatsappEnabled !== false && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onOpenHelp) onOpenHelp();
                      else {
                        const clean = (settings.whatsappNumber || '919239182739').replace(/[^0-9]/g, '');
                        window.open(`https://wa.me/${clean}?text=${encodeURIComponent('Hello Admin, I need help in ' + settings.storeName)}`, '_blank');
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800/80 transition text-left"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>WhatsApp Support</span>
                  </button>
                )}

                {/* Official YouTube Channel */}
                {settings.youtubeEnabled !== false && (
                  <a
                    href={settings.youtubeLink || "https://youtube.com/@nova_proxy__.ios_007?si=rdZR0e35LGZ-AYAV"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800/80 transition"
                  >
                    <Youtube className="w-4 h-4 text-rose-400" />
                    <span>Official YouTube</span>
                  </a>
                )}

                {/* Telegram Community */}
                {settings.telegramEnabled !== false && (
                  <a
                    href={settings.telegramLink || "https://t.me/SK_SEFA_tech"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800/80 transition"
                  >
                    <Send className="w-4 h-4 text-sky-400" />
                    <span>Telegram Channel</span>
                  </a>
                )}

                {/* Report a Problem / Help Modal */}
                {onOpenHelp && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenHelp();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-amber-300 hover:bg-slate-800/80 transition text-left font-semibold"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Report a Problem / Help</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsAboutOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800/80 transition text-left"
                >
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>About {settings.storeName}</span>
                </button>

                <div className="my-1 border-t border-slate-800" />

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onResetToDefault();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-[11px] text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition text-left"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Store Cache</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: FUTURISTIC HERO BANNER CARD (With Ambient Glow & Tech Badges) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900/90 via-indigo-950/60 to-purple-950/70 border border-cyan-500/35 p-3 sm:p-4 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_25px_rgba(99,102,241,0.25)] mb-3">
        
        {/* Glowing Background Light Orbs */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-500/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-2.5">
          {/* Left: Secret 5-Tap on Lightning Icon */}
          <div 
            onClick={handleSecretTap}
            className="flex items-center gap-2.5 min-[360px]:gap-3.5 cursor-pointer group select-none min-w-0 flex-1"
            title="Store Info (Secret 5-Tap for Admin)"
          >
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 opacity-60 blur-xs group-hover:opacity-100 transition duration-300" />
              <div className="relative w-11 h-11 min-[360px]:w-12 min-[360px]:h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-950 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-inner group-active:scale-95 transition overflow-hidden">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Zap className="w-6 h-6 min-[360px]:w-7 min-[360px]:h-7 fill-cyan-400 text-cyan-400 animate-pulse drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] min-[360px]:text-[10px] font-bold border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>ONLINE v4.5</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-bold hidden min-[400px]:inline">
                  ⚡ VIP HUB
                </span>
              </div>

              <h2 className="text-sm min-[360px]:text-base sm:text-lg font-black text-white flex items-center gap-1.5 leading-tight mt-0.5 truncate">
                <span className="truncate bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  {settings.storeName}
                </span>
              </h2>

              <p className="text-[10px] min-[360px]:text-[11px] text-slate-400 font-medium truncate">
                {settings.creatorName || 'Official Android Mod & Tools'}
              </p>
            </div>
          </div>

          {/* Right Action Icons: YouTube, WhatsApp, Theme, Bell, User */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* Official YouTube Channel */}
            {settings.youtubeEnabled !== false && (
              <a
                href={settings.youtubeLink || "https://youtube.com/@nova_proxy__.ios_007?si=rdZR0e35LGZ-AYAV"}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 min-[380px]:p-2 rounded-xl text-rose-400 hover:text-white bg-slate-900/80 hover:bg-rose-950/60 border border-rose-500/30 hover:border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.25)] transition active:scale-95"
                title="Official YouTube Channel"
              >
                <Youtube className="w-3.5 h-3.5 min-[380px]:w-4 min-[380px]:h-4 fill-rose-500/30" />
              </a>
            )}

            {/* WhatsApp Support Button */}
            {settings.whatsappEnabled !== false && onOpenHelp && (
              <button
                onClick={() => {
                  triggerHapticFeedback(15);
                  onOpenHelp();
                }}
                className="p-1.5 min-[380px]:p-2 rounded-xl text-emerald-400 hover:text-white bg-slate-900/80 hover:bg-emerald-950/60 border border-emerald-500/30 hover:border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)] transition active:scale-95"
                title="WhatsApp Problem Support"
              >
                <MessageCircle className="w-3.5 h-3.5 min-[380px]:w-4 min-[380px]:h-4 fill-emerald-500/30" />
              </button>
            )}

            {/* Dark/Light mode toggle */}
            <button
              onClick={() => {
                triggerHapticFeedback(10);
                onToggleDarkMode();
              }}
              className="p-1.5 min-[380px]:p-2 rounded-xl text-amber-300 hover:text-white bg-slate-900/80 border border-amber-500/20 hover:border-amber-400/50 transition active:scale-95"
              title="Toggle theme"
            >
              {isDarkMode ? (
                <Moon className="w-3.5 h-3.5 min-[380px]:w-4 min-[380px]:h-4 text-amber-300 fill-amber-300/30" />
              ) : (
                <Sun className="w-3.5 h-3.5 min-[380px]:w-4 min-[380px]:h-4 text-amber-400 fill-amber-400" />
              )}
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => {
                triggerHapticFeedback(15);
                onOpenNotifications();
              }}
              className="relative p-1.5 min-[380px]:p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900/80 border border-slate-700/60 hover:border-cyan-400/50 transition active:scale-95"
              title="Notifications"
            >
              <Bell className="w-3.5 h-3.5 min-[380px]:w-4 min-[380px]:h-4 text-slate-200" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 min-[380px]:w-4 min-[380px]:h-4 rounded-full bg-rose-500 text-white text-[8px] min-[380px]:text-[9px] font-black flex items-center justify-center shadow-md animate-bounce">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* User Profile Avatar (Dashboard) */}
            <button
              onClick={() => {
                triggerHapticFeedback(15);
                onOpenUserDashboard();
              }}
              className="w-7 h-7 min-[380px]:w-8 min-[380px]:h-8 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-500 to-purple-500 text-white font-extrabold text-xs flex items-center justify-center shadow-md ring-2 ring-cyan-400/40 hover:ring-cyan-300 active:scale-95 transition"
              title="My Orders & VIP Access"
            >
              <User className="w-3.5 h-3.5 min-[380px]:w-4 min-[380px]:h-4" />
            </button>
          </div>
        </div>

        {/* Micro Badges Row */}
        <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1 text-cyan-300 font-semibold">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{totalAppsCount}+ Verified APKs</span>
          </span>
          <span className="flex items-center gap-1 text-orange-300 font-semibold">
            <Flame className="w-3 h-3 text-orange-400 fill-orange-400/30" />
            <span>Free Fire Panels</span>
          </span>
          <span className="flex items-center gap-1 text-emerald-300 font-semibold">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Antiban Safe</span>
          </span>
        </div>

      </div>

      {/* Row 3: CYBER SEARCH BAR (With Voice Search) */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none">
          <Search className="w-4 h-4 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search VIP apps, FF injectors & games..."
          className="w-full pl-10 pr-10 py-2.5 bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 hover:border-cyan-400/60 focus:border-cyan-400 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:shadow-[0_0_20px_rgba(34,211,238,0.25)] transition-all shadow-inner"
        />

        {searchQuery ? (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleVoiceSearch}
            className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1 transition ${
              isListening ? 'text-rose-400 animate-pulse' : 'text-slate-400 hover:text-cyan-400'
            }`}
            title="Voice search"
          >
            <Mic className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* About Modal */}
      {isAboutOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900/95 border border-cyan-500/40 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(99,102,241,0.3)]">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-400/40 text-cyan-400 flex items-center justify-center mx-auto overflow-hidden shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Zap className="w-8 h-8 fill-cyan-400 text-cyan-400 animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-black bg-gradient-to-r from-cyan-300 via-indigo-200 to-fuchsia-300 bg-clip-text text-transparent">
                {settings.storeName}
              </h3>
              <p className="text-xs text-indigo-400 font-semibold">{settings.creatorName}</p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Official verified Android APKs, modded tools, Free Fire injectors and terminal packages with real-time admin sync.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsAboutOpen(false)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </header>
  );
};
