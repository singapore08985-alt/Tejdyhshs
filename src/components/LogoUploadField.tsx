import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, CheckCircle2, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { triggerHapticFeedback, showAndroidToast } from '../utils/haptics';

interface LogoUploadFieldProps {
  label: string;
  description?: string;
  currentValue?: string;
  currentUrl?: string;
  onChange?: (newUrl: string) => void;
  onLogoChange?: (newUrl: string) => void;
  adminToken: string | null;
  recommendedDimensions?: string;
  defaultPlaceholder?: string;
  compact?: boolean;
  sectionName?: string;
  section?: string;
}

export const LogoUploadField: React.FC<LogoUploadFieldProps> = ({
  label,
  description,
  currentValue,
  currentUrl,
  onChange,
  onLogoChange,
  adminToken,
  recommendedDimensions = '512x512 PNG, WebP or SVG',
  defaultPlaceholder = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&auto=format&fit=crop&q=80',
  compact = false,
  sectionName,
  section = 'branding',
}) => {
  const activeValue = currentValue ?? currentUrl ?? '';
  const activeChange = onChange || onLogoChange || (() => {});
  const activeSection = sectionName || section;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const hasCustomLogo = Boolean(activeValue && activeValue !== defaultPlaceholder);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WebP, SVG)');
      showAndroidToast('Invalid file: Must be an image');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size must be under 10MB');
      showAndroidToast('Image is too large (max 10MB)');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    triggerHapticFeedback(15);

    try {
      // 1. Read as Data URL for immediate responsive preview
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        if (!base64Data) return;

        // Apply immediately for seamless instant feedback
        activeChange(base64Data);

        // 2. Persist to server permanent uploads storage
        if (adminToken) {
          try {
            const res = await fetch('/api/admin/upload-image', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${adminToken}`,
              },
              body: JSON.stringify({
                filename: file.name,
                fileBase64: base64Data,
                section: activeSection,
              }),
            });

            const data = await res.json();
            if (data.success && data.url) {
              activeChange(data.url);
              triggerHapticFeedback([40, 80, 40]);
              showAndroidToast(`Logo uploaded & saved to permanent storage! (${data.sizeFormatted})`);
            }
          } catch (serverErr) {
            console.warn('Server storage warning, retained high-res base64 image:', serverErr);
          }
        } else {
          showAndroidToast('Logo updated in current draft session');
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Logo upload error:', err);
      setUploadError(err.message || 'Failed to process logo file');
    } finally {
      setIsUploading(false);
      // Reset input value so re-selecting same file triggers change
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    triggerHapticFeedback(15);
    activeChange(defaultPlaceholder);
    showAndroidToast('Logo reset to default placeholder');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const displayImage = activeValue || defaultPlaceholder;

  if (compact) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 block">{label}</label>
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
            <img src={displayImage} alt="" className="w-full h-full object-cover" />
            {isUploading && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp, image/svg+xml"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer shadow transition active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{hasCustomLogo ? 'Change' : 'Upload'}</span>
            </button>

            {hasCustomLogo && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-200 block">{label}</span>
          {description && <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>}
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            hasCustomLogo
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {hasCustomLogo ? 'Custom Logo Active' : 'Default Logo'}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3.5">
        {/* Logo Preview Box */}
        <div className="relative w-20 h-20 rounded-2xl bg-slate-900 border-2 border-slate-700/80 p-1 overflow-hidden shrink-0 flex items-center justify-center shadow-inner group">
          <img
            src={displayImage}
            alt="Preview"
            className="w-full h-full object-cover rounded-xl transition group-hover:scale-105"
          />
          {isUploading && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center gap-1 text-[10px] text-amber-400 font-bold">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex-1 w-full space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/svg+xml"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 transition active:scale-95 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{hasCustomLogo ? 'Replace Logo' : 'Upload Image File'}</span>
            </button>

            {hasCustomLogo && (
              <button
                type="button"
                onClick={handleRemove}
                className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Logo</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>Recommended: {recommendedDimensions}</span>
            <span>•</span>
            <span>Max: 10MB</span>
          </div>

          {uploadError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
