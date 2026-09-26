import React from 'react';
import { Smartphone, Monitor, Wifi, BatteryCharging, Signal } from 'lucide-react';

interface DeviceFrameWrapperProps {
  isDeviceMode: boolean;
  onToggleDeviceMode: () => void;
  children: React.ReactNode;
}

export const DeviceFrameWrapper: React.FC<DeviceFrameWrapperProps> = ({
  isDeviceMode,
  onToggleDeviceMode,
  children,
}) => {
  if (!isDeviceMode) {
    return <>{children}</>;
  }

  // Current time formatted for Android status bar
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4 flex flex-col items-center justify-start">
      
      {/* Top Controller Bar */}
      <div className="mb-4 flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <Smartphone className="w-4 h-4" />
          <span>Android Pixel 8 Simulator Mode</span>
        </div>
        <span className="text-slate-700">|</span>
        <button
          onClick={onToggleDeviceMode}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Switch to Full Web</span>
        </button>
      </div>

      {/* Android Device Outer Frame */}
      <div className="relative w-full max-w-[420px] h-[860px] max-h-[92vh] rounded-[48px] p-3 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-2xl ring-1 ring-slate-600/50 flex flex-col">
        
        {/* Device Inner Bezel */}
        <div className="relative w-full h-full rounded-[40px] bg-slate-950 overflow-hidden flex flex-col border border-slate-800 shadow-inner">
          
          {/* Android Status Bar */}
          <div className="h-7 bg-slate-950 px-6 flex items-center justify-between text-[11px] font-medium text-slate-300 z-50 flex-shrink-0 select-none">
            <span>{currentTime}</span>

            {/* Front Camera Punch-hole */}
            <div className="w-3.5 h-3.5 bg-black rounded-full ring-2 ring-slate-900" />

            <div className="flex items-center gap-1.5">
              <Signal className="w-3 h-3 text-slate-300" />
              <Wifi className="w-3 h-3 text-slate-300" />
              <div className="flex items-center text-[10px]">
                <span>98%</span>
              </div>
            </div>
          </div>

          {/* Android Screen Viewport */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-none flex flex-col">
            {children}
          </div>

          {/* Android Gesture Bar */}
          <div className="h-5 bg-slate-950 flex items-center justify-center z-50 flex-shrink-0">
            <div className="w-28 h-1 bg-slate-600/80 rounded-full" />
          </div>

        </div>

      </div>

    </div>
  );
};
