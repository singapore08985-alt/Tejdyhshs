// Android Haptics and Native Bridge Utilities

interface AndroidBridgeInterface {
  showToast?: (message: string) => void;
  triggerHaptic?: (durationMs: number) => void;
  shareContent?: (title: string, text: string, url: string) => void;
  isNativeAndroid?: () => boolean;
}

declare global {
  interface Window {
    AndroidBridge?: AndroidBridgeInterface;
  }
}

export function isAndroidNativeApp(): boolean {
  return typeof window !== 'undefined' && !!window.AndroidBridge && window.AndroidBridge.isNativeAndroid?.() === true;
}

export function triggerHapticFeedback(pattern: number | number[] = 25) {
  try {
    if (typeof window !== 'undefined' && window.AndroidBridge?.triggerHaptic) {
      const duration = Array.isArray(pattern) ? pattern[0] : pattern;
      window.AndroidBridge.triggerHaptic(duration);
      return;
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch (ignored) {}
}

export function showAndroidToast(message: string) {
  if (typeof window !== 'undefined' && window.AndroidBridge?.showToast) {
    window.AndroidBridge.showToast(message);
  }
}

export async function shareDigitalProduct(title: string, text: string, url: string) {
  triggerHapticFeedback(20);
  
  // Try Android native bridge first
  if (typeof window !== 'undefined' && window.AndroidBridge?.shareContent) {
    window.AndroidBridge.shareContent(title, text, url);
    return;
  }

  // Next try Web Share API
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return;
    } catch (e) {
      // Ignore user cancellation
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(`${title} - ${url}`);
    alert('Product link copied to clipboard!');
  } catch (e) {
    // Clipboard failed
  }
}
