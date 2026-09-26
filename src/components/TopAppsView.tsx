import React from 'react';
import { Trophy, Star, Download, ChevronRight, Crown } from 'lucide-react';
import { StoreApp } from '../types';
import { triggerHapticFeedback } from '../utils/haptics';

interface TopAppsViewProps {
  apps: StoreApp[];
  onSelectApp: (app: StoreApp) => void;
}

export const TopAppsView: React.FC<TopAppsViewProps> = ({ apps, onSelectApp }) => {
  // Sort apps by rating and download count to get Top 10-15
  const rankedApps = [...apps]
    .sort((a, b) => (b.downloadsCount + b.rating * 100) - (a.downloadsCount + a.rating * 100))
    .slice(0, 15);

  return (
    <div className="space-y-4 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="text-base sm:text-lg font-black text-white">
            Top Apps & Games Leaderboard
          </h2>
        </div>
        <span className="text-xs text-slate-400 font-mono">Ranked by Community</span>
      </div>

      {/* Ranked List (Exact match to video 00:23) */}
      <div className="space-y-2.5">
        {rankedApps.map((app, index) => {
          const rank = index + 1;
          const isTop3 = rank <= 3;
          
          return (
            <div
              key={app.id}
              onClick={() => {
                triggerHapticFeedback(10);
                onSelectApp(app);
              }}
              className="group flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-indigo-950/40 backdrop-blur-md border border-white/10 hover:border-cyan-400/60 transition-all duration-300 cursor-pointer active:scale-[0.99] shadow-md hover:shadow-[0_8px_25px_rgba(99,102,241,0.2)]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Rank Number Badge */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 shadow-inner ${
                  rank === 1
                    ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 ring-2 ring-amber-400/40'
                    : rank === 2
                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white'
                    : rank === 3
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {rank}
                </div>

                {/* App Icon */}
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-slate-700/80 flex-shrink-0 shadow">
                  <img
                    src={app.icon}
                    alt={app.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80';
                    }}
                  />
                  {app.isPremium && (
                    <div className="absolute top-0.5 right-0.5 bg-amber-500 text-slate-950 text-[7px] font-black px-1 rounded">
                      VIP
                    </div>
                  )}
                </div>

                {/* Title & Metadata */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300 transition truncate">
                    {app.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="capitalize text-indigo-400 font-medium">{app.category}</span>
                    <span>•</span>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span className="font-semibold text-slate-300">{app.rating.toFixed(1)}</span>
                    </div>
                    <span>•</span>
                    <span>{app.downloadsCount.toLocaleString()} dl</span>
                  </div>
                </div>
              </div>

              {/* Action arrow */}
              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                {app.isPremium ? (
                  <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-extrabold">
                    ₹{app.priceINR}
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold">
                    FREE
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
