import React from 'react';
import { 
  LayoutGrid, 
  Gamepad2, 
  Trophy, 
  Flame, 
  Crown 
} from 'lucide-react';
import { StoreCategory } from '../types';
import { triggerHapticFeedback } from '../utils/haptics';

export type NavTab = StoreCategory | 'my_orders';

interface SefaBottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  hasActiveOrders?: boolean;
}

export const SefaBottomNav: React.FC<SefaBottomNavProps> = ({
  activeTab,
  onSelectTab,
  hasActiveOrders = false,
}) => {
  return (
    <nav 
      aria-label="Store navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-t border-cyan-500/20 px-2 py-1.5 safe-area-bottom shadow-[0_-8px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(34,211,238,0.1)] pointer-events-auto transition-all duration-300 md:bottom-5 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-auto md:min-w-[580px] md:max-w-2xl md:rounded-2xl md:border md:border-cyan-500/30 md:bg-slate-900/90 md:shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(99,102,241,0.25)] md:px-6 md:py-2 md:border-t md:pb-2"
    >
      <div className="max-w-md md:max-w-none mx-auto flex items-center justify-around md:justify-center md:gap-3">
        
        {/* 1. Apps Tab */}
        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback(10);
            onSelectTab('apps');
          }}
          className={`flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 py-1.5 px-2 md:px-3.5 rounded-xl transition duration-200 cursor-pointer touch-manipulation min-h-[44px] ${
            activeTab === 'apps'
              ? 'text-cyan-300 font-bold bg-cyan-500/20 border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.35)] scale-102'
              : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/40 border border-transparent'
          }`}
          title="Browse All Apps"
        >
          <div className="p-0.5 md:p-1 rounded-lg">
            <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] sm:text-xs whitespace-nowrap tracking-wide font-medium">Apps</span>
        </button>

        {/* 2. Free Fire Panels Tab */}
        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback(10);
            onSelectTab('ff_panels');
          }}
          className={`flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 py-1.5 px-2 md:px-3.5 rounded-xl transition duration-200 cursor-pointer touch-manipulation min-h-[44px] ${
            activeTab === 'ff_panels'
              ? 'text-orange-400 font-bold bg-orange-500/20 border border-orange-500/50 shadow-[0_0_18px_rgba(249,115,22,0.4)] scale-102'
              : 'text-slate-400 hover:text-orange-400 hover:bg-slate-800/40 border border-transparent'
          }`}
          title="Free Fire VIP Panels"
        >
          <div className="p-0.5 md:p-1 rounded-lg">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2] fill-orange-500/40" />
          </div>
          <span className="text-[10px] sm:text-xs whitespace-nowrap tracking-wide font-medium">FF Panels</span>
        </button>

        {/* 3. Games Tab */}
        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback(10);
            onSelectTab('games');
          }}
          className={`flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 py-1.5 px-2 md:px-3.5 rounded-xl transition duration-200 cursor-pointer touch-manipulation min-h-[44px] ${
            activeTab === 'games'
              ? 'text-indigo-300 font-bold bg-indigo-500/20 border border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.35)] scale-102'
              : 'text-slate-400 hover:text-indigo-300 hover:bg-slate-800/40 border border-transparent'
          }`}
          title="Android Games"
        >
          <div className="p-0.5 md:p-1 rounded-lg">
            <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] sm:text-xs whitespace-nowrap tracking-wide font-medium">Games</span>
        </button>

        {/* 4. Top Apps Tab */}
        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback(10);
            onSelectTab('top_apps');
          }}
          className={`flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 py-1.5 px-2 md:px-3.5 rounded-xl transition duration-200 cursor-pointer touch-manipulation min-h-[44px] ${
            activeTab === 'top_apps'
              ? 'text-purple-300 font-bold bg-purple-500/20 border border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.35)] scale-102'
              : 'text-slate-400 hover:text-purple-300 hover:bg-slate-800/40 border border-transparent'
          }`}
          title="Top Apps Leaderboard"
        >
          <div className="p-0.5 md:p-1 rounded-lg">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          </div>
          <span className="text-[10px] sm:text-xs whitespace-nowrap tracking-wide font-medium">Top Apps</span>
        </button>

        {/* 5. My VIP Tab */}
        <button
          type="button"
          onClick={() => {
            triggerHapticFeedback(10);
            onSelectTab('my_orders');
          }}
          className={`flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-2 py-1.5 px-2 md:px-3.5 rounded-xl transition duration-200 cursor-pointer touch-manipulation min-h-[44px] relative ${
            activeTab === 'my_orders'
              ? 'text-amber-300 font-bold bg-amber-500/20 border border-amber-400/50 shadow-[0_0_18px_rgba(245,158,11,0.4)] scale-102'
              : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/40 border border-transparent'
          }`}
          title="My VIP Orders and Downloads"
        >
          <div className="p-0.5 md:p-1 rounded-lg relative">
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            {hasActiveOrders && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
            )}
          </div>
          <span className="text-[10px] sm:text-xs whitespace-nowrap tracking-wide font-medium">My VIP</span>
        </button>

      </div>
    </nav>
  );
};
