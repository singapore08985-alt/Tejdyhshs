import React from 'react';
import { Smartphone, Download, Sparkles, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import { triggerHapticFeedback } from '../utils/haptics';

interface BannerHeroProps {
  onOpenAndroidHub: () => void;
  onFilterAndroid: () => void;
}

export const BannerHero: React.FC<BannerHeroProps> = ({
  onOpenAndroidHub,
  onFilterAndroid,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 p-6 sm:p-8 md:p-10 mb-8 shadow-2xl">
      
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl space-y-4">
        
        {/* Android pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          <Smartphone className="w-3.5 h-3.5 animate-bounce" />
          <span>Android Ready • PWA & Native Kotlin APK</span>
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.15]">
          Premium Digital Shop & <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Android Source Code Store
          </span>
        </h1>

        <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
          एंड्रॉयड ऐप्स, Kotlin WebView शेल्स, Figma UI किट्स और फुल-स्टैक बॉइलरप्लेट्स का ऑफिशियल डिजिटल स्टोर। 
          सीधे अपने Android फोन में इंस्टॉल करें या Android Studio से APK जनरेट करें।
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => {
              triggerHapticFeedback(20);
              onOpenAndroidHub();
            }}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition active:scale-95"
          >
            <Smartphone className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>Android APK & Setup Hub</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              triggerHapticFeedback(15);
              onFilterAndroid();
            }}
            className="px-4 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700/60 flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>View Android Apps</span>
          </button>

          <a
            href="/digital-shop-android-project.zip"
            download="digital-shop-android-project.zip"
            onClick={() => triggerHapticFeedback(20)}
            className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-semibold text-xs sm:text-sm border border-emerald-500/30 flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Project (.ZIP)</span>
          </a>
        </div>

        {/* Key perks */}
        <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-slate-400 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>Instant Key Delivery</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-teal-400" />
            <span>1-Tap Phone Install</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Clean Kotlin Code</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Lifetime Updates</span>
          </div>
        </div>

      </div>

    </div>
  );
};
