import React, { useState } from 'react';
import { 
  Flame, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Download, 
  Lock, 
  Key, 
  Check, 
  ExternalLink,
  Crosshair,
  Zap,
  Sparkles
} from 'lucide-react';
import { FreeFirePanel } from '../types';
import { triggerHapticFeedback } from '../utils/haptics';

interface FreeFirePanelViewProps {
  panels: FreeFirePanel[];
  onSelectPanel: (panel: FreeFirePanel) => void;
}

export const FreeFirePanelView: React.FC<FreeFirePanelViewProps> = ({
  panels,
  onSelectPanel,
}) => {
  const [filter, setFilter] = useState<'all' | 'FF Normal' | 'FF MAX'>('all');

  const filtered = panels.filter((p) => {
    if (filter === 'all') return true;
    if (p.targetGame === 'Both Normal & MAX') return true;
    return p.targetGame === filter;
  });

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      
      {/* Hero Header for Free Fire Panel Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-950/80 via-amber-950/60 to-red-950/80 border border-orange-500/30 p-4 sm:p-5 shadow-xl shadow-orange-950/40">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-orange-500/30">
                <Flame className="w-3 h-3 fill-orange-400" />
                OFFICIAL FF VIP HUB
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                Antiban Safe v14.2
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-black text-white flex items-center gap-1.5">
              <span>Free Fire VIP Panels & Injectors</span>
            </h2>
            <p className="text-xs text-orange-200/80 max-w-sm">
              Auto Headshot, ESP Location, 360° Aimlock & Antiban safe panels for Free Fire & FF MAX.
            </p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center flex-shrink-0 shadow-lg animate-pulse">
            <Crosshair className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Target Game Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none text-xs font-bold">
        {(['all', 'FF Normal', 'FF MAX'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => {
              triggerHapticFeedback(10);
              setFilter(cat);
            }}
            className={`px-3.5 py-1.5 rounded-xl transition whitespace-nowrap ${
              filter === cat
                ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat === 'all' ? '🔥 All FF Panels' : cat}
          </button>
        ))}
      </div>

      {/* Panels Grid */}
      <div className="grid grid-cols-1 min-[601px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
        {filtered.map((panel) => {
          const isExpired = panel.status === 'expired';
          return (
            <div
              key={panel.id}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/85 via-slate-900/70 to-orange-950/30 backdrop-blur-md border border-orange-500/30 hover:border-orange-400/80 p-4 space-y-3.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_12px_35px_rgba(249,115,22,0.25)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              {/* Card Top */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={panel.icon || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&auto=format&fit=crop&q=80'}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover border border-orange-500/30"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-orange-400 px-1.5 py-0.2 rounded bg-orange-500/15 border border-orange-500/25">
                          {panel.targetGame}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{panel.version}</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-black text-white mt-0.5 leading-tight">
                        {panel.name}
                      </h4>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-black text-amber-400">
                      ₹{panel.priceINR}
                    </div>
                    <span className="text-[9px] text-slate-400 uppercase">
                      {panel.durationDays} Days
                    </span>
                  </div>
                </div>

                {/* Date & Duration Info */}
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-orange-400" />
                    <span>Validity: <strong className="text-white">{panel.durationDays} Days</strong></span>
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-mono">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>Exp: {panel.expiryDate}</span>
                  </span>
                </div>

                {/* Features List */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                    Panel Inclusions:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {panel.features.map((feat, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 text-[10px] border border-slate-800 flex items-center gap-1"
                      >
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                        <span>{feat}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    triggerHapticFeedback(15);
                    onSelectPanel(panel);
                  }}
                  disabled={isExpired}
                  className={`w-full py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow transition active:scale-95 cursor-pointer ${
                    isExpired
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 shadow-orange-500/20'
                  }`}
                >
                  <Key className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Get VIP Panel (₹{panel.priceINR})</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
