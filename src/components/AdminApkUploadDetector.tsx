import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  FileCode, 
  Edit3, 
  AlertCircle, 
  Calendar, 
  Tag, 
  DollarSign, 
  ShieldCheck,
  RefreshCw,
  Eye,
  Layers,
  Zap,
  Clock,
  Download,
  HardDrive,
  Rocket,
  Image as ImageIcon,
  Key,
  Terminal,
  HelpCircle,
  X
} from 'lucide-react';
import { parseApkFile, ApkMetadata } from '../utils/apkParser';
import { StoreApp, StoreCategory } from '../types';
import { triggerHapticFeedback, showAndroidToast } from '../utils/haptics';
import { LogoUploadField } from './LogoUploadField';
import { ApkUploadField } from './ApkUploadField';

interface AdminApkUploadDetectorProps {
  onAppCreated: (newApp: StoreApp) => void;
  onClose?: () => void;
  adminToken: string | null;
}

const TODAY_STR = new Date().toISOString().split('T')[0];
const FUTURE_30_STR = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

const PRESET_ICONS = [
  { name: 'VIP Gaming', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&auto=format&fit=crop&q=80' },
  { name: 'Mod Tools', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80' },
  { name: 'Termux / Shell', url: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=160&auto=format&fit=crop&q=80' },
  { name: 'Fire Aim', url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=160&auto=format&fit=crop&q=80' },
  { name: 'Cyber Security', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=160&auto=format&fit=crop&q=80' }
];

export const AdminApkUploadDetector: React.FC<AdminApkUploadDetectorProps> = ({
  onAppCreated,
  onClose,
  adminToken,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState<string>('');
  const [detectedData, setDetectedData] = useState<ApkMetadata | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Stored APK Details from server upload
  const [uploadedApkInfo, setUploadedApkInfo] = useState<{
    originalFilename: string;
    storedFilename?: string;
    sizeFormatted: string;
    sha256?: string;
    testDownloadUrl?: string;
    downloadUrl?: string;
    storagePath?: string;
  } | null>(null);
  const [isUploadingApk, setIsUploadingApk] = useState(false);

  // Form fields (Immediately visible and pre-filled with sensible defaults)
  const [appTitle, setAppTitle] = useState('');
  const [appIcon, setAppIcon] = useState('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&auto=format&fit=crop&q=80');
  const [category, setCategory] = useState<StoreCategory>('apps');
  const [priceINR, setPriceINR] = useState<number>(0);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [version, setVersion] = useState('v1.0.0');
  const [fileSize, setFileSize] = useState('25.0 MB');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [description, setDescription] = useState('');
  const [packageName, setPackageName] = useState('');
  const [password, setPassword] = useState('');
  const [terminalCommands, setTerminalCommands] = useState('');
  const [startDate, setStartDate] = useState(TODAY_STR);
  const [expiryDate, setExpiryDate] = useState(FUTURE_30_STR);
  const [durationDays, setDurationDays] = useState(30);
  const [status, setStatus] = useState<'active' | 'expired' | 'maintenance' | 'hidden'>('active');
  const [vipBadge, setVipBadge] = useState('VIP PRO');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Date duration auto calculation
  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (newStart && expiryDate) {
      const s = new Date(newStart).getTime();
      const e = new Date(expiryDate).getTime();
      const diff = Math.max(1, Math.round((e - s) / 86400000));
      setDurationDays(diff);
    }
  };

  const handleExpiryDateChange = (newExpiry: string) => {
    setExpiryDate(newExpiry);
    if (startDate && newExpiry) {
      const s = new Date(startDate).getTime();
      const e = new Date(newExpiry).getTime();
      const diff = Math.max(1, Math.round((e - s) / 86400000));
      setDurationDays(diff);
    }
  };

  const handleDurationChange = (days: number) => {
    setDurationDays(days);
    if (startDate) {
      const s = new Date(startDate).getTime();
      const exp = new Date(s + days * 86400000).toISOString().split('T')[0];
      setExpiryDate(exp);
    }
  };

  // Main Handler: Auto-Detect from APK
  const handleApkFileSelected = async (file: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.apk')) {
      setErrorMessage('Please select a valid Android package file (.apk)');
      return;
    }

    setErrorMessage(null);
    setIsParsing(true);
    triggerHapticFeedback(20);
    setParseProgress('Analyzing APK package and metadata...');

    try {
      setParseProgress('Reading package binary & Android manifest...');
      const metadata = await parseApkFile(file);
      setDetectedData(metadata);

      // Pre-fill editable fields automatically!
      setAppTitle(metadata.detectedAppName || file.name.replace('.apk', ''));
      setVersion(metadata.detectedVersion || 'v1.0.0');
      setFileSize(metadata.fileSizeFormatted);
      if (metadata.detectedPackageName) {
        setPackageName(metadata.detectedPackageName);
      }
      
      if (metadata.detectedIconUrl) {
        setAppIcon(metadata.detectedIconUrl);
      }

      // Detect category automatically
      const lower = (metadata.detectedAppName + ' ' + (metadata.detectedPackageName || '')).toLowerCase();
      if (lower.includes('free fire') || lower.includes('pubg') || lower.includes('bgmi') || lower.includes('game')) {
        setCategory('games');
        setPriceINR(149);
        setIsPremium(true);
        setVipBadge('100% HEADSHOT VIP');
        setDescription(`Official VIP modified release of ${metadata.detectedAppName} with anti-ban protection and unlocked features.`);
      } else if (lower.includes('manager') || lower.includes('termux') || lower.includes('tool') || lower.includes('mod')) {
        setCategory('top_apps');
        setPriceINR(99);
        setIsPremium(true);
        setVipBadge('PRO VIP');
        setDescription(`High performance pro edition of ${metadata.detectedAppName} with premium features unlocked.`);
      } else {
        setCategory('apps');
        setDescription(`Latest release of ${metadata.detectedAppName} optimized for all Android devices.`);
      }

      // Upload exact APK binary file to server permanent storage
      if (adminToken) {
        setIsUploadingApk(true);
        setParseProgress('Uploading APK file to permanent server storage...');
        
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const base64Data = e.target?.result as string;
            const res = await fetch('/api/admin/upload-apk', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminToken}`,
              },
              body: JSON.stringify({
                filename: file.name,
                fileBase64: base64Data,
                appTitle: metadata.detectedAppName || file.name,
              }),
            });

            const data = await res.json();
            if (res.ok && data.success && data.apk) {
              setUploadedApkInfo(data.apk);
              setDownloadUrl(data.apk.storagePath);
              setFileSize(data.apk.sizeFormatted);
              showAndroidToast(`APK Stored on Server: ${data.apk.originalFilename}`);
              triggerHapticFeedback([40, 80, 40]);
            } else {
              setDownloadUrl(`/uploads/apks/${file.name}`);
            }
          } catch (uploadErr) {
            console.error('Failed to upload APK to backend:', uploadErr);
            setDownloadUrl(`/uploads/apks/${file.name}`);
          } finally {
            setIsUploadingApk(false);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setDownloadUrl(`/uploads/apks/${file.name}`);
      }

      showAndroidToast(`APK Loaded: ${metadata.detectedAppName}`);
    } catch (err: any) {
      console.error('APK parse error:', err);
      setErrorMessage(`APK read notice: ${err.message || 'Standard parse'}. All fields are open to edit below.`);
      setAppTitle(file.name.replace('.apk', ''));
    } finally {
      setIsParsing(false);
      setParseProgress('');
    }
  };

  // Test Download Stored APK
  const handleTestDownload = () => {
    if (!uploadedApkInfo || !adminToken) return;
    const url = `${uploadedApkInfo.testDownloadUrl}?token=${adminToken}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = uploadedApkInfo.originalFilename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showAndroidToast(`Downloading test copy of ${uploadedApkInfo.originalFilename}`);
  };

  // Direct Launch & Publish App to Public Store
  const handleDirectLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appTitle.trim()) {
      setErrorMessage('Please enter an App Name / Title');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    triggerHapticFeedback(25);

    const safePackageName = packageName.trim() || `com.sefastore.${appTitle.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const safeDownloadUrl = downloadUrl.trim() || 'https://www.mediafire.com';

    const newApp: StoreApp = {
      id: `app-${Date.now()}`,
      title: appTitle.trim(),
      category,
      author: 'Sefa Store VIP',
      icon: appIcon.trim() || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&auto=format&fit=crop&q=80',
      rating: 4.9,
      reviewsCount: 156,
      downloadsCount: 1,
      verified: true,
      isPremium,
      priceINR: isPremium ? Number(priceINR) : 0,
      version: version.trim() || 'v1.0.0',
      fileSize: fileSize.trim() || '25 MB',
      downloadUrl: safeDownloadUrl,
      packageName: safePackageName,
      password: password.trim() || undefined,
      description: description.trim() || `${appTitle.trim()} official Android APK release with full features and fast download.`,
      terminalCommands: terminalCommands.trim() || undefined,
      badges: isPremium ? [vipBadge || 'VIP PRO', 'ANTI-BAN'] : ['VERIFIED', 'FREE'],
      updatedAt: TODAY_STR,
      startDate,
      expiryDate,
      durationDays,
      status,
    };

    try {
      if (adminToken) {
        // Post to backend database
        const res = await fetch('/api/admin/apps/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(newApp),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Server error while publishing app');
        }

        const savedApp = data.app || newApp;
        onAppCreated(savedApp);
        triggerHapticFeedback([50, 100, 50]);
        showAndroidToast(`🚀 "${savedApp.title}" is now LIVE in the Public Store!`);
        setSuccessMessage(`🚀 App "${savedApp.title}" published successfully to Live Store!`);
      } else {
        onAppCreated(newApp);
        showAndroidToast(`🚀 App launched locally!`);
      }

      setTimeout(() => {
        if (onClose) onClose();
      }, 700);

    } catch (err: any) {
      console.error('Launch app error:', err);
      setErrorMessage(err.message || 'Failed to publish app to live store');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 rounded-3xl bg-slate-950 border border-emerald-500/50 space-y-5 animate-in zoom-in-95 text-xs text-slate-200 shadow-2xl">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/30">
            <Rocket className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <span>Direct APK Launch & Public Store Publisher</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                LIVE STORE
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Fill details below or drop an APK file — clicking Launch immediately publishes the app to the live user store.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Notifications / Alerts */}
      {errorMessage && (
        <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* QUICK AUTO-DETECT APK BOX (Optional drop-zone) */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleApkFileSelected(file);
        }}
        className={`p-4 sm:p-5 rounded-2xl border-2 border-dashed transition cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
          isParsing
            ? 'border-cyan-500/60 bg-cyan-950/20'
            : detectedData
            ? 'border-emerald-500/60 bg-emerald-950/20'
            : 'border-slate-800 hover:border-emerald-500/50 bg-slate-900/40 hover:bg-slate-900/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".apk,application/vnd.android.package-archive"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleApkFileSelected(f);
          }}
        />

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            {isParsing ? (
              <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
            ) : detectedData ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>
          <div className="text-left">
            <span className="text-xs font-bold text-white block">
              {isParsing
                ? parseProgress || 'Analyzing APK...'
                : detectedData
                ? `Detected from APK: ${detectedData.detectedAppName} (${detectedData.fileSizeFormatted})`
                : 'Click to select or drop an APK for instant 1-second auto-fill'}
            </span>
            <span className="text-[10px] text-slate-400">
              {detectedData
                ? 'Package parsed & stored. You can edit all details below before launching.'
                : 'Auto-extracts HD icon, app title, version, and stores the APK permanently on the server.'}
            </span>
          </div>
        </div>
      </div>

      {/* Verified Stored APK Status Banner (If an APK was uploaded) */}
      {uploadedApkInfo && (
        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in zoom-in-95">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white font-mono">{uploadedApkInfo.originalFilename}</span>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.2 rounded-full border border-emerald-500/30">
                  STORED ON SERVER
                </span>
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Size: <strong className="text-white">{uploadedApkInfo.sizeFormatted}</strong></span>
                <span>•</span>
                <span className="font-mono text-slate-500">Destination: {uploadedApkInfo.downloadUrl}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestDownload}
            className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-3 h-3" />
            <span>Test APK</span>
          </button>
        </div>
      )}

      {/* MAIN LAUNCH FORM — ALWAYS VISIBLE AND EDITABLE */}
      <form onSubmit={handleDirectLaunch} className="space-y-4">

        {/* Section 1: Basic App Details */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>1. App Details & Branding</span>
            </span>
            <span className="text-[10px] text-slate-400">All fields editable</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* App Title */}
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">
                App Title / Name: <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={appTitle}
                onChange={(e) => setAppTitle(e.target.value)}
                placeholder="e.g. Free Fire Auto Headshot VIP Injector"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold text-xs focus:border-emerald-400"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Store Category:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as StoreCategory)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium"
              >
                <option value="apps">📱 Apps (Tools & Utilities)</option>
                <option value="games">🎮 Games (Free Fire, BGMI, Action)</option>
                <option value="top_apps">⭐ Top Apps (VIP Editors, Managers)</option>
                <option value="ff_panels">🔥 FF Panels (AimBot & Headshot)</option>
                <option value="books">📜 Scripts, Books & Configs</option>
              </select>
            </div>

            {/* Access Mode: Free vs VIP Paid */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Store Access & Pricing:</label>
              <div className="flex items-center gap-2">
                <select
                  value={isPremium ? 'paid' : 'free'}
                  onChange={(e) => {
                    const isP = e.target.value === 'paid';
                    setIsPremium(isP);
                    if (!isP) setPriceINR(0);
                    else if (priceINR === 0) setPriceINR(99);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white flex-1 font-medium"
                >
                  <option value="free">🟢 FREE Access (₹0)</option>
                  <option value="paid">👑 VIP / Paid Access (₹ INR)</option>
                </select>
                {isPremium && (
                  <div className="w-28">
                    <input
                      type="number"
                      min={1}
                      value={priceINR}
                      onChange={(e) => setPriceINR(Number(e.target.value))}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-amber-500/60 text-amber-400 font-bold"
                      placeholder="₹ INR"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Version & File Size */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Version Number:</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v1.0.0"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">File Size:</label>
              <input
                type="text"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
                placeholder="25.4 MB"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Logo & APK Storage */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5" />
              <span>2. Icon & Package / APK Storage</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Logo Upload Field */}
            <div className="sm:col-span-2">
              <LogoUploadField
                label="App Icon / Logo (HD)"
                currentUrl={appIcon}
                onLogoChange={(newUrl: string) => setAppIcon(newUrl)}
                adminToken={adminToken}
                section="app_icon"
              />

              {/* Preset Icon Quick Selector */}
              <div className="flex items-center gap-2 pt-2 overflow-x-auto pb-1">
                <span className="text-[10px] text-slate-400 flex-shrink-0">Presets:</span>
                {PRESET_ICONS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAppIcon(p.url)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-400 text-[10px] text-slate-300 flex-shrink-0 transition"
                  >
                    <img src={p.url} alt="" className="w-3.5 h-3.5 rounded object-cover" />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Package / APK File Upload Component (Server permanent storage) */}
            <div className="sm:col-span-2">
              <ApkUploadField
                label="Upload Android APK Package (Permanent Server Storage)"
                currentDownloadUrl={downloadUrl}
                onApkStored={(apk) => {
                  setDownloadUrl(apk.storagePath);
                  setFileSize(apk.sizeFormatted);
                  setUploadedApkInfo({
                    originalFilename: apk.originalFilename,
                    sizeFormatted: apk.sizeFormatted,
                    sha256: apk.sha256,
                    testDownloadUrl: apk.testDownloadUrl || apk.storagePath,
                    downloadUrl: apk.storagePath,
                    storagePath: apk.storagePath,
                  });
                  showAndroidToast(`APK Attached: ${apk.originalFilename}`);
                }}
                adminToken={adminToken}
                itemId={appTitle ? `app-${appTitle.toLowerCase().replace(/[^a-z0-9]/g, '')}` : 'new-app'}
                appTitle={appTitle || 'New App Package'}
              />
            </div>

            {/* Direct Download Link */}
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">
                Download URL or Storage Path:
              </label>
              <input
                type="text"
                value={downloadUrl}
                onChange={(e) => setDownloadUrl(e.target.value)}
                placeholder="/uploads/apks/yourapp.apk or https://www.mediafire.com/file/..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Dates, Validity & Settings */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>3. Validity Dates, Status & Extra Info</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Duration Days */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                <span>Duration (Days):</span>
                <span className="text-amber-400 font-mono text-[10px]">{durationDays} Days</span>
              </label>
              <select
                value={durationDays}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              >
                <option value={7}>7 Days (Weekly)</option>
                <option value={15}>15 Days</option>
                <option value={30}>30 Days (Monthly)</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
                <option value={365}>365 Days (Annual / Lifetime)</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Expiry Date:</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => handleExpiryDateChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Store Status:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              >
                <option value="active">🟢 Active (Visible in Store)</option>
                <option value="expired">🔴 Expired</option>
                <option value="maintenance">🟠 Maintenance</option>
                <option value="hidden">⚪ Hidden</option>
              </select>
            </div>

            {/* Package Name */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Package Name (Optional):</label>
              <input
                type="text"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="com.example.app"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>

            {/* Password / License Key */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Access Key / Password (Optional):</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. VIP-SEFA-2026"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>

            {/* VIP Badge text */}
            {isPremium && (
              <div className="sm:col-span-3">
                <label className="block text-slate-300 font-semibold mb-1">VIP Badge Label:</label>
                <input
                  type="text"
                  value={vipBadge}
                  onChange={(e) => setVipBadge(e.target.value)}
                  placeholder="e.g. 100% HEADSHOT VIP or PRO EDITION"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-bold"
                />
              </div>
            )}

            {/* Description */}
            <div className="sm:col-span-3">
              <label className="block text-slate-300 font-semibold mb-1">App Description & Instructions:</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details about features, anti-ban safety, and installation guide..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON: DIRECT LAUNCH TO STORE */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="text-[11px] text-slate-400">
            Clicking Launch immediately syncs with the live database and displays in the User App.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !appTitle.trim()}
              className="flex-1 sm:flex-none px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Launching to Live Store...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 fill-slate-950" />
                  <span>🚀 Launch App to Live Store (Public Now)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>

    </div>
  );
};
