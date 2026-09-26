import React, { useState } from 'react';
import { 
  X, 
  Star, 
  ShieldCheck, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  Terminal, 
  Key, 
  ExternalLink,
  Crown,
  Sparkles,
  Lock
} from 'lucide-react';
import { StoreApp, CustomFeature } from '../types';
import { triggerHapticFeedback, showAndroidToast, shareDigitalProduct } from '../utils/haptics';
import { notificationBus } from '../utils/notificationBus';

interface SefaAppModalProps {
  app: StoreApp | null;
  onClose: () => void;
  onDownloadApp: (app: StoreApp) => void;
  onRateApp: (appId: string, rating: number) => void;
  onBuyPremium: (app: StoreApp) => void;
  customFeatures?: CustomFeature[];
  onSelectFeature?: (feat: CustomFeature) => void;
}

export const SefaAppModal: React.FC<SefaAppModalProps> = ({
  app,
  onClose,
  onDownloadApp,
  onRateApp,
  onBuyPremium,
  customFeatures = [],
  onSelectFeature,
}) => {
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [hasRated, setHasRated] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!app) return null;

  const handleCopyPassword = () => {
    if (!app.password) return;
    navigator.clipboard.writeText(app.password);
    setCopiedKey(true);
    triggerHapticFeedback(15);
    showAndroidToast("Copied to clipboard!");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyCommands = () => {
    if (!app.terminalCommands) return;
    navigator.clipboard.writeText(app.terminalCommands);
    setCopiedCmd(true);
    triggerHapticFeedback(15);
    showAndroidToast("Terminal commands copied!");
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleRate = (star: number) => {
    setUserRating(star);
    setHasRated(true);
    triggerHapticFeedback([30, 60]);
    onRateApp(app.id, star);
    showAndroidToast(`Rated ${star} stars! Thank you.`);
  };

  const handleDownloadClick = () => {
    triggerHapticFeedback(25);
    if (app.isPremium) {
      onBuyPremium(app);
      return;
    }

    setIsDownloading(true);
    showAndroidToast("Starting APK download...");

    setTimeout(() => {
      setIsDownloading(false);
      onDownloadApp(app);
      notificationBus.notifyDownloadStarted({
        itemTitle: app.title,
        fileSize: app.fileSize,
      });

      // Trigger actual download if valid link
      if (app.downloadUrl) {
        window.open(app.downloadUrl, '_blank');
      } else {
        // Generate mock APK receipt
        const blob = new Blob([`Sefa Store Package: ${app.title}\nVersion: ${app.version}\nStatus: Verified`], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${app.title.replace(/\s+/g, '_')}_${app.version}.apk`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Top Header Row (matching video at 00:13) */}
        <div className="relative p-5 pb-4 border-b border-slate-800 bg-slate-950/70 flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            {/* App Icon */}
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shadow-lg flex-shrink-0">
              <img
                src={app.icon}
                alt={app.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80';
                }}
              />
            </div>

            {/* Title & Author */}
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                {app.title}
              </h2>
              <div className="text-xs text-slate-400 font-medium">
                {app.author || 'Sefa Store'}
              </div>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider">
                  {app.category}
                </span>
                {app.isPremium && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5" />
                    VIP PREMIUM
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => {
              triggerHapticFeedback(10);
              onClose();
            }}
            className="p-1.5 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Key Stats Row (Exact match to video: Rating, Downloads, Verified) */}
          <div className="grid grid-cols-3 gap-2 text-center py-2 px-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <div>
              <div className="flex items-center justify-center gap-1 text-sm font-bold text-white">
                <span>{app.rating.toFixed(1)}</span>
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {app.reviewsCount} reviews
              </div>
            </div>

            <div className="border-x border-slate-800">
              <div className="text-sm font-bold text-white">
                {app.downloadsCount.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Downloads
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Safe & Clean
              </div>
            </div>
          </div>

          {/* App Specs Row */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
            <span>Version: {app.version}</span>
            <span>Size: {app.fileSize}</span>
            <span>Updated: {app.updatedAt}</span>
          </div>

          {/* About this app Section (Exact match to video 00:13) */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              About this app
            </h3>

            {/* Password Box if present (matching video 00:13) */}
            {app.password && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Key className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span className="text-xs text-amber-300 font-mono truncate select-all">
                    {app.password}
                  </span>
                </div>
                <button
                  onClick={handleCopyPassword}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/40 hover:bg-indigo-600 text-indigo-200 text-[11px] font-bold flex items-center gap-1 transition flex-shrink-0"
                >
                  {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}

            {/* Terminal Commands Box if present (matching Termux in video) */}
            {app.terminalCommands && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-mono">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Terminal Commands</span>
                  </div>
                  <button
                    onClick={handleCopyCommands}
                    className="text-slate-400 hover:text-white text-[10px] flex items-center gap-1"
                  >
                    {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCmd ? 'Copied' : 'Copy All'}</span>
                  </button>
                </div>
                <pre className="text-xs font-mono text-slate-300 bg-slate-900 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap select-all">
                  {app.terminalCommands}
                </pre>
              </div>
            )}

            {/* Description Text */}
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {app.description}
            </p>
          </div>

          {/* Connected VIP Features & Add-ons attached to this App */}
          {(() => {
            const attached = customFeatures.filter((f) => f.appId === app.id);
            if (attached.length === 0) return null;

            return (
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Attached VIP Features & Add-ons ({attached.length})</span>
                  </h3>
                  <span className="text-[10px] text-cyan-300 font-mono">Dynamic Packages</span>
                </div>

                <div className="space-y-2.5">
                  {attached.map((feat) => (
                    <div
                      key={feat.id}
                      className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-cyan-950/30 to-slate-950 border border-cyan-500/30 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={feat.icon}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-cyan-500/40 flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h4 className="text-xs font-bold text-white truncate">{feat.title}</h4>
                              {feat.isVip || feat.priceINR > 0 ? (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-black border border-amber-500/30">
                                  👑 VIP {feat.priceINR > 0 ? `₹${feat.priceINR}` : 'PASS'}
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                                  FREE
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              <span>Type: <strong className="text-slate-300 uppercase">{feat.type}</strong></span>
                              <span>•</span>
                              <span>Validity: {feat.durationDays}d</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            triggerHapticFeedback(15);
                            if (onSelectFeature) {
                              onSelectFeature(feat);
                            } else if (feat.downloadUrl) {
                              window.open(feat.downloadUrl, '_blank');
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 flex-shrink-0 transition active:scale-95 cursor-pointer ${
                            feat.priceINR > 0
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:brightness-110 shadow-sm'
                              : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                          }`}
                        >
                          {feat.priceINR > 0 ? (
                            <>
                              <Crown className="w-3.5 h-3.5" />
                              <span>Unlock ₹{feat.priceINR}</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Get Tool</span>
                            </>
                          )}
                        </button>
                      </div>

                      {feat.description && (
                        <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                          {feat.description}
                        </p>
                      )}

                      {feat.password && (
                        <div className="flex items-center justify-between text-[11px] text-amber-300 bg-amber-950/30 border border-amber-500/30 px-2.5 py-1 rounded-lg font-mono">
                          <span>Key: {feat.password}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(feat.password || '');
                              showAndroidToast('Password copied!');
                            }}
                            className="text-[10px] text-amber-400 underline hover:text-white"
                          >
                            Copy
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Interactive "Rate this app" Section (matching video at 00:13) */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-center space-y-2">
            <div className="text-xs font-bold text-slate-300">
              {hasRated ? 'Your rating submitted!' : '★ Rate this app'}
            </div>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hoverRating || userRating) >= star;
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => handleRate(star)}
                    className="p-1 text-slate-600 hover:text-amber-400 transition hover:scale-125 active:scale-95"
                  >
                    <Star
                      className={`w-6 h-6 transition ${
                        filled ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ratings Distribution (matching video at 00:13) */}
          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="font-semibold text-slate-300 text-[11px]">Ratings Distribution</div>
            <div className="space-y-1">
              {[
                { stars: 5, pct: '85%' },
                { stars: 4, pct: '10%' },
                { stars: 3, pct: '3%' },
                { stars: 2, pct: '1%' },
                { stars: 1, pct: '1%' },
              ].map((row) => (
                <div key={row.stars} className="flex items-center gap-2 text-[10px]">
                  <span className="w-3">{row.stars}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: row.pct }}
                    />
                  </div>
                  <span className="w-6 text-right">{row.pct}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom Actions Row (Exact match to video: Download + Share) */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center gap-2.5">
          
          {/* Download / Buy Button */}
          {app.isPremium ? (
            <button
              onClick={() => onBuyPremium(app)}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Crown className="w-4 h-4 fill-slate-950" />
              <span>Unlock VIP (₹{app.priceINR})</span>
            </button>
          ) : (
            <button
              onClick={handleDownloadClick}
              disabled={isDownloading}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition active:scale-95"
            >
              {isDownloading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Downloading APK...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download APK ({app.fileSize})</span>
                </>
              )}
            </button>
          )}

          {/* Share Button (matching video 00:13) */}
          <button
            onClick={() => {
              triggerHapticFeedback(15);
              shareDigitalProduct(
                `${app.title} - Sefa Store`,
                `Download ${app.title} (${app.fileSize}) for Android from Sefa Store!`,
                window.location.href
              );
            }}
            className="p-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95"
            title="Share"
          >
            <Share2 className="w-5 h-5" />
          </button>

        </div>

      </div>
    </div>
  );
};
