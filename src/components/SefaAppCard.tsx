import React from 'react';
import { 
  Star, 
  ShieldCheck, 
  Crown, 
  Sparkles,
  Zap
} from 'lucide-react';
import { StoreApp } from '../types';
import { triggerHapticFeedback } from '../utils/haptics';

interface SefaAppCardProps {
  app: StoreApp;
  onSelect: (app: StoreApp) => void;
  attachedFeaturesCount?: number;
}

export const SefaAppCard: React.FC<SefaAppCardProps> = ({ app, onSelect, attachedFeaturesCount = 0 }) => {
  return (
    <div
      onClick={() => {
        triggerHapticFeedback(10);
        onSelect(app);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(app);
        }
      }}
      className="group relative flex flex-col items-center justify-between text-center p-3 rounded-2xl bg-gradient-to-b from-slate-900/85 via-slate-900/65 to-indigo-950/45 backdrop-blur-md border border-white/10 hover:border-cyan-400/70 transition-all duration-300 cursor-pointer select-none active:scale-[0.97] hover:-translate-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_30px_rgba(99,102,241,0.25),0_0_20px_rgba(34,211,238,0.25)] pointer-events-auto overflow-hidden"
    >
      {/* Top subtle light reflection sheen */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

      {/* 3D App Icon Container with Neon Glow */}
      <div className="relative w-16 h-16 min-[380px]:w-18 min-[380px]:h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-950 border border-indigo-500/30 group-hover:border-cyan-400/80 group-hover:ring-2 group-hover:ring-cyan-400/30 shadow-md group-hover:shadow-[0_0_22px_rgba(34,211,238,0.4)] group-hover:-translate-y-0.5 transition-all duration-300 flex-shrink-0">
        <img
          src={app.icon}
          alt={app.title}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80';
          }}
        />

        {/* Premium / VIP Badge */}
        {app.isPremium && (
          <div className="absolute top-1 right-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-md shadow-md shadow-amber-500/40 flex items-center gap-0.5 border border-amber-300/40">
            <Crown className="w-2.5 h-2.5 fill-slate-950" />
            <span>₹{app.priceINR}</span>
          </div>
        )}

        {/* Verified green dot with glow */}
        {app.verified && !app.isPremium && (
          <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
        )}
      </div>

      {/* App Title */}
      <h3 className="mt-2 text-xs sm:text-sm font-bold text-slate-100 group-hover:text-cyan-300 line-clamp-1 w-full text-center transition-colors duration-200 px-0.5">
        {app.title}
      </h3>

      {/* Rating & Category Row */}
      <div className="flex items-center justify-center gap-1.5 mt-1 text-[10px] sm:text-xs text-slate-400 w-full">
        <div className="flex items-center gap-0.5 text-amber-400">
          <Star className="w-3 h-3 fill-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]" />
          <span className="font-semibold text-slate-200">{app.rating.toFixed(1)}</span>
        </div>
        <span className="text-slate-600">•</span>
        <span className="capitalize text-slate-300 truncate max-w-[70px] sm:max-w-none">{app.category}</span>
        {app.isPremium && (
          <span className="text-[10px] text-amber-400 font-black ml-0.5 px-1 rounded bg-amber-500/15 border border-amber-500/30">VIP</span>
        )}
      </div>

      {/* Attached VIP Add-ons Pill */}
      {attachedFeaturesCount > 0 && (
        <div className="mt-1.5 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[9px] font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
          <Sparkles className="w-2.5 h-2.5 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span>{attachedFeaturesCount} Add-on{attachedFeaturesCount > 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
};
