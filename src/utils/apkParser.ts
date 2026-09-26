import JSZip from 'jszip';

export interface ApkMetadata {
  fileName: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  detectedAppName: string;
  detectedPackageName?: string;
  detectedVersion?: string;
  detectedIconUrl?: string; // Base64 data URL
  totalFiles: number;
  extractedFromManifest: boolean;
}

// Map common package names to polished product titles
const KNOWN_PACKAGES: Record<string, string> = {
  'com.dts.freefireth': 'Free Fire',
  'com.dts.freefiremax': 'Free Fire MAX',
  'bin.mt.plus': 'MT Manager VIP',
  'com.termux': 'Termux Pro VIP Edition',
  'com.spotify.music': 'Spotify Premium Mod',
  'com.instagram.android': 'Instagram Pro',
  'com.whatsapp': 'WhatsApp Plus Ultra',
  'com.tencent.ig': 'PUBG Mobile VIP',
  'com.pubg.imobile': 'BGMI VIP ESP Tool',
  'org.telegram.messenger': 'Telegram Plus VIP',
  'com.google.android.youtube': 'YouTube Revanced Premium',
  'com.netflix.mediaclient': 'Netflix Premium Mod',
  'com.adobe.psmobile': 'Photoshop Express Pro',
  'com.vanced.android.youtube': 'YouTube Vanced VIP',
  'com.kinemaster.app': 'KineMaster Diamond Edition',
  'com.alightcreative.motion': 'Alight Motion Pro XML',
};

/**
 * Parses binary AndroidManifest.xml string pool to extract package name and strings
 */
function extractStringsFromAXML(buffer: ArrayBuffer): { packageName?: string; strings: string[] } {
  const strings: string[] = [];
  let packageName: string | undefined;

  try {
    const view = new DataView(buffer);
    if (view.byteLength < 8) return { strings };

    const magic = view.getUint32(0, true);
    // Standard AXML magic is 0x00080003
    if (magic !== 0x00080003 && magic !== 0x00080001) {
      // Still search for readable ASCII / UTF-8 strings
      const bytes = new Uint8Array(buffer);
      let cur = '';
      for (let i = 0; i < Math.min(bytes.length, 30000); i++) {
        const b = bytes[i];
        if ((b >= 32 && b <= 126) || b === 10 || b === 13) {
          cur += String.fromCharCode(b);
        } else {
          if (cur.length >= 4) {
            strings.push(cur);
            if (!packageName && cur.includes('.') && /^[a-z0-9_]+(\.[a-z0-9_]+)+$/i.test(cur)) {
              packageName = cur;
            }
          }
          cur = '';
        }
      }
      return { packageName, strings };
    }

    // Binary XML parser for String Pool Chunk
    // Chunk type is 0x001C0001
    let offset = 8;
    while (offset < view.byteLength - 8) {
      const chunkType = view.getUint32(offset, true);
      const chunkSize = view.getUint32(offset + 4, true);

      if (chunkType === 0x001C0001) {
        // String Pool Chunk found!
        const stringCount = view.getUint32(offset + 8, true);
        const flags = view.getUint32(offset + 16, true);
        const stringsStart = offset + view.getUint32(offset + 20, true);
        const isUTF8 = (flags & (1 << 8)) !== 0;

        // Read string offsets
        const offsets: number[] = [];
        for (let i = 0; i < Math.min(stringCount, 500); i++) {
          offsets.push(view.getUint32(offset + 28 + i * 4, true));
        }

        const rawBytes = new Uint8Array(buffer);
        for (let i = 0; i < offsets.length; i++) {
          const sOffset = stringsStart + offsets[i];
          if (sOffset >= rawBytes.length) continue;

          let str = '';
          if (isUTF8) {
            // In UTF-8 string pool: skip length prefix
            let curOff = sOffset;
            // UTF-8 lengths are encoded in 1-2 bytes
            while (curOff < rawBytes.length && (rawBytes[curOff] & 0x80) !== 0) curOff++;
            curOff++; // skip char length
            while (curOff < rawBytes.length && (rawBytes[curOff] & 0x80) !== 0) curOff++;
            curOff++; // skip byte length

            while (curOff < rawBytes.length && rawBytes[curOff] !== 0) {
              str += String.fromCharCode(rawBytes[curOff]);
              curOff++;
            }
          } else {
            // UTF-16
            let curOff = sOffset + 2; // skip 2 bytes length
            while (curOff < view.byteLength - 1) {
              const code = view.getUint16(curOff, true);
              if (code === 0) break;
              str += String.fromCharCode(code);
              curOff += 2;
            }
          }

          if (str && str.trim().length > 0) {
            strings.push(str.trim());
            // Package name detector
            if (!packageName && str.includes('.') && /^[a-z][a-z0-9_]*(\.[a-z0-9_]+){2,}$/i.test(str)) {
              packageName = str;
            }
          }
        }
        break;
      }

      if (chunkSize <= 0) break;
      offset += chunkSize;
    }
  } catch (e) {
    console.warn('AXML string pool parse error (fallback active)', e);
  }

  return { packageName, strings };
}

/**
 * Intelligent file name cleaner to produce a high-end application title
 */
function cleanAppNameFromFileName(fileName: string): { name: string; version?: string } {
  let base = fileName.replace(/\.apk$/i, '');

  // Extract version like v1.2.3 or 14.2
  let version: string | undefined;
  const verMatch = base.match(/[-_v\s](\d+(\.\d+)+[a-z0-9-_]*)/i);
  if (verMatch) {
    version = verMatch[1].startsWith('v') ? verMatch[1] : `v${verMatch[1]}`;
    // Remove version from title
    base = base.replace(verMatch[0], '');
  }

  // Remove common APK suffixes
  base = base
    .replace(/[-_]?(release|signed|mod|vip|premium|patched|apk|final|build|aligned)/gi, ' ')
    .replace(/[._\-+]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Capitalize words
  const words = base.split(' ').filter(Boolean).map(w => {
    if (w.toUpperCase() === 'FF') return 'Free Fire';
    if (w.toUpperCase() === 'VIP') return 'VIP';
    if (w.toUpperCase() === 'APK') return '';
    if (w.toUpperCase() === 'MAX') return 'MAX';
    if (w.toUpperCase() === 'ESP') return 'ESP';
    if (w.toUpperCase() === 'MT') return 'MT';
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  });

  const formattedName = words.filter(Boolean).join(' ') || 'Android VIP Application';
  return { name: formattedName, version };
}

/**
 * Converts Uint8Array to base64 Data URL
 */
function uint8ArrayToDataUrl(bytes: Uint8Array, mimeType: string = 'image/png'): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

/**
 * Main parser: Reads any .apk file buffer, extracts icon, name, version and size
 */
export async function parseApkFile(file: File): Promise<ApkMetadata> {
  const fileSizeBytes = file.size;
  const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(1);
  const fileSizeFormatted = `${fileSizeMB} MB`;

  const cleanedFromFilename = cleanAppNameFromFileName(file.name);
  let detectedAppName = cleanedFromFilename.name;
  let detectedVersion = cleanedFromFilename.version || 'v1.0';
  let detectedPackageName: string | undefined;
  let detectedIconUrl: string | undefined;
  let extractedFromManifest = false;

  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);
  const filesList = Object.keys(zipContent.files);

  // 1. Check AndroidManifest.xml
  const manifestFile = zipContent.file('AndroidManifest.xml');
  if (manifestFile) {
    try {
      const manifestBuffer = await manifestFile.async('arraybuffer');
      const { packageName, strings } = extractStringsFromAXML(manifestBuffer);
      if (packageName) {
        detectedPackageName = packageName;
        extractedFromManifest = true;
        if (KNOWN_PACKAGES[packageName]) {
          detectedAppName = KNOWN_PACKAGES[packageName];
        }
      }
      // Look for app label in strings if available
      for (const s of strings) {
        if (s.length >= 3 && s.length <= 40 && !s.includes('/') && !s.includes('.')) {
          if (/^[A-Za-z0-9\s-_+]+$/.test(s) && !s.startsWith('res/') && !s.startsWith('android')) {
            // Candidate label
            if (s.toLowerCase().includes('free fire') || s.toLowerCase().includes('manager')) {
              detectedAppName = s;
              break;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Could not read manifest', e);
    }
  }

  // 2. Extract Launcher Icon from Zip entries
  // Prefer high resolution mipmap icons first, then drawable icons
  const iconPriorityPatterns = [
    /res\/mipmap-xxxhdpi.*\/ic_launcher.*\.(png|webp)$/i,
    /res\/mipmap-xxhdpi.*\/ic_launcher.*\.(png|webp)$/i,
    /res\/mipmap-xhdpi.*\/ic_launcher.*\.(png|webp)$/i,
    /res\/mipmap-hdpi.*\/ic_launcher.*\.(png|webp)$/i,
    /res\/mipmap.*\/ic_launcher.*\.(png|webp)$/i,
    /res\/mipmap.*\/app_icon.*\.(png|webp)$/i,
    /res\/mipmap.*\/icon.*\.(png|webp)$/i,
    /res\/drawable-xxxhdpi.*\/ic_launcher.*\.(png|webp)$/i,
    /res\/drawable-xxhdpi.*\/ic_launcher.*\.(png|webp)$/i,
    /res\/drawable-xhdpi.*\/ic_launcher.*\.(png|webp)$/i,
    /res\/drawable.*\/ic_launcher.*\.(png|webp)$/i,
    /res\/drawable.*\/app_icon.*\.(png|webp)$/i,
    /res\/drawable.*\/icon.*\.(png|webp)$/i,
  ];

  let foundIconEntry: JSZip.JSZipObject | null = null;
  for (const pattern of iconPriorityPatterns) {
    const match = filesList.find((p) => pattern.test(p));
    if (match) {
      foundIconEntry = zipContent.file(match);
      if (foundIconEntry) break;
    }
  }

  // Fallback: search any png with "icon" or "launcher" in res/
  if (!foundIconEntry) {
    const anyIcon = filesList.find(
      (p) => p.startsWith('res/') && (p.includes('launcher') || p.includes('icon')) && (p.endsWith('.png') || p.endsWith('.webp'))
    );
    if (anyIcon) {
      foundIconEntry = zipContent.file(anyIcon);
    }
  }

  // Convert found icon to base64 Data URL
  if (foundIconEntry) {
    try {
      const iconBytes = await foundIconEntry.async('uint8array');
      const isWebp = foundIconEntry.name.toLowerCase().endsWith('.webp');
      const mime = isWebp ? 'image/webp' : 'image/png';
      detectedIconUrl = uint8ArrayToDataUrl(iconBytes, mime);
    } catch (e) {
      console.warn('Failed to convert APK icon bytes', e);
    }
  }

  return {
    fileName: file.name,
    fileSizeBytes,
    fileSizeFormatted,
    detectedAppName,
    detectedPackageName,
    detectedVersion,
    detectedIconUrl,
    totalFiles: filesList.length,
    extractedFromManifest,
  };
}
