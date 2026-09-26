import React, { useState } from 'react';
import { 
  X, 
  MessageCircle, 
  Youtube, 
  Send, 
  Phone, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles,
  HelpCircle,
  CreditCard,
  Download,
  Key
} from 'lucide-react';
import { StoreSettings } from '../types';
import { triggerHapticFeedback, showAndroidToast } from '../utils/haptics';

interface SupportHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
}

const COMMON_ISSUES = [
  {
    id: 'payment',
    icon: CreditCard,
    label: 'Payment Done / UTR Verification',
    template: 'Hello Admin, I have completed the UPI payment on Sefa Store. Please verify my UTR number and unlock my download.',
  },
  {
    id: 'download',
    icon: Download,
    label: 'APK Download / Install Issue',
    template: 'Hello Admin, I am facing an issue downloading or installing the APK file from Sefa Store. Please guide me.',
  },
  {
    id: 'key',
    icon: Key,
    label: 'VIP Key / Password Not Working',
    template: 'Hello Admin, my VIP password or activation key is not working on the app. Please provide assistance.',
  },
  {
    id: 'general',
    icon: MessageCircle,
    label: 'General Query / Other Problem',
    template: 'Hello Admin, I need help regarding Sefa Store products and VIP access.',
  },
];

export const SupportHelpModal: React.FC<SupportHelpModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [customMsg, setCustomMsg] = useState('');

  if (!isOpen) return null;

  // Clean WhatsApp number
  const rawNumber = settings.whatsappNumber || '919239182739';
  const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
  const displayPhone = cleanNumber.startsWith('91') && cleanNumber.length === 12
    ? `+91 ${cleanNumber.substring(2, 7)} ${cleanNumber.substring(7)}`
    : `+${cleanNumber}`;

  const openWhatsApp = (customText?: string) => {
    triggerHapticFeedback(15);
    const textToSend = customText || customMsg.trim() || `Hello Admin, I have a problem in ${settings.storeName}. Please help me.`;
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(textToSend)}`;
    window.open(url, '_blank');
  };

  const handleCopyNumber = () => {
    triggerHapticFeedback(10);
    navigator.clipboard.writeText(cleanNumber);
    setCopiedNumber(true);
    showAndroidToast(`Copied WhatsApp Number: ${cleanNumber}`);
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-4 sm:p-5 max-w-md w-full space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <MessageCircle className="w-5 h-5 fill-emerald-500/30" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>Support & Problem Help</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </h3>
              <p className="text-[11px] text-slate-400">
                Direct WhatsApp contact with {settings.creatorName || 'Store Admin'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHapticFeedback(10);
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* WhatsApp Direct Chat Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-950 to-emerald-950/40 border border-emerald-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Official WhatsApp Support</span>
            </span>
            <span className="text-[10px] text-emerald-300 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Online
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-white tracking-wider">{displayPhone}</span>
            </div>
            <button
              onClick={handleCopyNumber}
              className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-white px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition cursor-pointer"
            >
              {copiedNumber ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedNumber ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Big Green Direct WhatsApp Button */}
          <button
            onClick={() => openWhatsApp()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-slate-950" />
            <span>Chat on WhatsApp Directly</span>
          </button>
        </div>

        {/* 1-Click Problem Templates */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1 px-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Select Your Problem (1-Click Send on WhatsApp):</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {COMMON_ISSUES.map((issue) => {
              const IconComp = issue.icon;
              return (
                <button
                  key={issue.id}
                  onClick={() => openWhatsApp(issue.template)}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-left transition flex items-center gap-2.5 group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-900 group-hover:bg-emerald-500/20 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 flex-shrink-0 transition">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white leading-tight">
                    {issue.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Message Box */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] font-semibold text-slate-400 block px-1">
            Or describe your problem in your own words:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              placeholder="e.g. Mere account me VIP access nahi mila..."
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:border-emerald-500"
            />
            <button
              onClick={() => openWhatsApp(customMsg)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 flex-shrink-0 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>

        {/* Official Channels (YouTube & Telegram) */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 px-1 block">Official Channels:</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* YouTube Channel Button */}
            {settings.youtubeEnabled !== false && (
              <a
                href={settings.youtubeLink || 'https://youtube.com/@nova_proxy__.ios_007?si=rdZR0e35LGZ-AYAV'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHapticFeedback(10)}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 hover:bg-rose-950/20 text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Youtube className="w-4 h-4 fill-rose-500/30" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-white block group-hover:text-rose-300">YouTube Channel</span>
                    <span className="text-[9px] text-slate-500">Tutorials & Updates</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400" />
              </a>
            )}

            {/* Telegram Channel Button */}
            {settings.telegramEnabled !== false && (
              <a
                href={settings.telegramLink || 'https://t.me/SK_SEFA_tech'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHapticFeedback(10)}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/50 hover:bg-sky-950/20 text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-white block group-hover:text-sky-300">Telegram Community</span>
                    <span className="text-[9px] text-slate-500">Latest APK Drops</span>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400" />
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
