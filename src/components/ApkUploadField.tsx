import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileCode, 
  CheckCircle2, 
  Download, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  ShieldCheck, 
  Sparkles,
  HardDrive
} from 'lucide-react';
import { parseApkFile, ApkMetadata } from '../utils/apkParser';
import { triggerHapticFeedback, showAndroidToast } from '../utils/haptics';

interface ApkUploadFieldProps {
  label?: string;
  currentDownloadUrl?: string;
  currentVersion?: string;
  itemId?: string;
  appTitle?: string;
  adminToken: string | null;
  onApkUploaded?: (data: {
    downloadUrl: string;
    fileSize: string;
    originalFilename: string;
    sha256?: string;
    detectedAppName?: string;
    detectedVersion?: string;
    detectedIconUrl?: string;
    testDownloadUrl?: string;
  }) => void;
  onApkStored?: (apk: {
    storagePath: string;
    sizeFormatted: string;
    originalFilename: string;
    sha256?: string;
    testDownloadUrl?: string;
  }) => void;
  compact?: boolean;
}

export const ApkUploadField: React.FC<ApkUploadFieldProps> = ({
  label = 'Android APK Package (.apk)',
  currentDownloadUrl = '',
  currentVersion = '',
  itemId,
  appTitle,
  adminToken,
  onApkUploaded,
  onApkStored,
  compact = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Uploaded APK details state
  const [uploadedInfo, setUploadedInfo] = useState<{
    originalFilename: string;
    fileSizeFormatted: string;
    sha256?: string;
    downloadUrl: string;
    testDownloadUrl?: string;
  } | null>(() => {
    if (currentDownloadUrl && currentDownloadUrl.includes('/uploads/apks/')) {
      const parts = currentDownloadUrl.split('/');
      const stored = parts[parts.length - 1];
      const orig = stored.replace(/^\d+_/, '');
      return {
        originalFilename: orig || 'Uploaded_Package.apk',
        fileSizeFormatted: 'Stored on Server',
        downloadUrl: currentDownloadUrl,
        testDownloadUrl: `/api/admin/apks/download/${stored}`,
      };
    }
    return null;
  });

  const handleFileSelected = async (file: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.apk')) {
      setErrorMessage('Please select a valid Android package file (.apk)');
      showAndroidToast('Invalid file format: Must be .apk');
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);
    triggerHapticFeedback(20);
    setUploadProgress('Inspecting APK package architecture...');

    try {
      // 1. Inspect package with client-side APK parser
      let metadata: ApkMetadata | null = null;
      try {
        metadata = await parseApkFile(file);
        setUploadProgress(`Detected: ${metadata.detectedAppName} (${metadata.fileSizeFormatted}). Uploading to server storage...`);
      } catch (parseErr) {
        console.warn('APK inspection warning:', parseErr);
        setUploadProgress('Uploading exact APK binary directly to server storage...');
      }

      // 2. Read full binary file as Base64 to transfer exact bytes to server
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;
          if (!base64Data) throw new Error('Failed to read file content');

          setUploadProgress('Saving APK on disk (/uploads/apks/)...');

          // Send exact file bytes to server
          const res = await fetch('/api/admin/upload-apk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: adminToken ? `Bearer ${adminToken}` : '',
            },
            body: JSON.stringify({
              filename: file.name,
              fileBase64: base64Data,
              itemId: itemId || undefined,
              appTitle: metadata?.detectedAppName || file.name.replace(/\.apk$/i, ''),
            }),
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Server storage error while saving APK');
          }

          const apkData = data.apk;
          const tokenParam = adminToken ? `?token=${adminToken}` : '';
          const fullTestUrl = apkData.testDownloadUrl + tokenParam;

          setUploadedInfo({
            originalFilename: apkData.originalFilename || file.name,
            fileSizeFormatted: apkData.sizeFormatted || `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            sha256: apkData.sha256,
            downloadUrl: apkData.downloadUrl,
            testDownloadUrl: fullTestUrl,
          });

          // Callback to parent forms
          if (onApkUploaded) {
            onApkUploaded({
              downloadUrl: apkData.downloadUrl,
              fileSize: apkData.sizeFormatted,
              originalFilename: apkData.originalFilename,
              sha256: apkData.sha256,
              detectedAppName: metadata?.detectedAppName,
              detectedVersion: metadata?.detectedVersion,
              detectedIconUrl: metadata?.detectedIconUrl,
              testDownloadUrl: fullTestUrl,
            });
          }

          if (onApkStored) {
            onApkStored({
              storagePath: apkData.downloadUrl,
              sizeFormatted: apkData.sizeFormatted,
              originalFilename: apkData.originalFilename,
              sha256: apkData.sha256,
              testDownloadUrl: fullTestUrl,
            });
          }

          triggerHapticFeedback([40, 80, 40]);
          showAndroidToast(`APK Uploaded: ${apkData.originalFilename} (${apkData.sizeFormatted})`);
        } catch (uploadErr: any) {
          console.error('APK upload failed:', uploadErr);
          setErrorMessage(uploadErr.message || 'Error uploading APK to server');
        } finally {
          setIsUploading(false);
          setUploadProgress('');
        }
      };

      reader.onerror = () => {
        setErrorMessage('Failed to read selected APK file from device');
        setIsUploading(false);
        setUploadProgress('');
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Process error:', err);
      setErrorMessage(err.message || 'Error processing APK file');
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const handleRemoveApk = () => {
    triggerHapticFeedback(15);
    setUploadedInfo(null);
    if (onApkUploaded) {
      onApkUploaded({
        downloadUrl: '',
        fileSize: '',
        originalFilename: '',
      });
    }
    if (onApkStored) {
      onApkStored({
        storagePath: '',
        sizeFormatted: '',
        originalFilename: '',
      });
    }
    showAndroidToast('Attached APK file removed');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span>{label}</span>
        </label>

        {uploadedInfo && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Exact APK Stored on Server</span>
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".apk"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFileSelected(f);
        }}
      />

      {/* Uploaded File Info Card */}
      {uploadedInfo ? (
        <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                <FileCode className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h5 className="text-xs font-bold text-white truncate max-w-[220px] sm:max-w-xs">
                  {uploadedInfo.originalFilename}
                </h5>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <span className="font-semibold text-emerald-400">{uploadedInfo.fileSizeFormatted}</span>
                  {uploadedInfo.sha256 && (
                    <span>• SHA256: {uploadedInfo.sha256.substring(0, 10)}...</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Test / Download Uploaded APK button */}
              {uploadedInfo.testDownloadUrl && (
                <a
                  href={uploadedInfo.testDownloadUrl}
                  download={uploadedInfo.originalFilename}
                  className="py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition active:scale-95 shadow"
                  title="Test download to verify exact file"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Test APK</span>
                </a>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                title="Replace with another APK file"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Replace</span>
              </button>

              <button
                type="button"
                onClick={handleRemoveApk}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                title="Remove attached APK"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Dropzone / Select Trigger */
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFileSelected(f);
          }}
          className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition bg-slate-900/50 hover:bg-cyan-950/20 group"
        >
          {isUploading ? (
            <div className="py-2 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
              <span className="text-xs font-bold text-white">{uploadProgress || 'Uploading APK...'}</span>
              <span className="text-[10px] text-slate-400">Writing byte-for-byte stream to server storage</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto group-hover:scale-110 transition">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-white">Click or drag & drop actual Android .apk file</p>
              <p className="text-[11px] text-slate-400">
                Stored permanently on the server — preserves original filename, package signatures & binary integrity.
              </p>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
