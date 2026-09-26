import { soundAlerts } from './soundAlerts';
import { triggerHapticFeedback, showAndroidToast } from './haptics';

export type PopupType = 
  | 'PAYMENT_SUCCESS' 
  | 'PAYMENT_PENDING' 
  | 'PAYMENT_REJECTED' 
  | 'APK_READY' 
  | 'DOWNLOAD_STARTED' 
  | 'TECHNICAL_ERROR' 
  | 'ADMIN_UPDATE';

export interface PopupAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  downloadUrl?: string;
}

export interface PopupEvent {
  id: string; // Unique deduplication key
  type: PopupType;
  title: string;
  message: string;
  timestamp: number;
  itemTitle?: string;
  badge?: string;
  details?: string;
  solution?: string; // "Kya karna hai" guidance
  action?: PopupAction;
  secondaryAction?: PopupAction;
  autoDismissMs?: number; // 0 means persistent until user interacts
  iconType?: string;
}

type Listener = (event: PopupEvent) => void;

class NotificationBus {
  private listeners: Set<Listener> = new Set();
  private seenIds: Set<string> = new Set();
  private activePopup: PopupEvent | null = null;
  private popupQueue: PopupEvent[] = [];

  constructor() {
    // Load previously dismissed IDs from session storage to avoid duplicates across fast navigation
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('sefa_seen_notifications');
        if (stored) {
          const arr = JSON.parse(stored);
          if (Array.isArray(arr)) {
            arr.forEach((id) => this.seenIds.add(id));
          }
        }
      } catch (e) {}
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    if (this.activePopup) {
      listener(this.activePopup);
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  public emit(event: PopupEvent) {
    // Deduplication check: Do not show identical notifications repeatedly
    if (this.seenIds.has(event.id)) {
      return;
    }

    this.seenIds.add(event.id);
    if (typeof window !== 'undefined') {
      try {
        const ids = Array.from(this.seenIds).slice(-100);
        sessionStorage.setItem('sefa_seen_notifications', JSON.stringify(ids));
      } catch (e) {}
    }

    // Play sound alert & haptic based on event type
    switch (event.type) {
      case 'PAYMENT_SUCCESS':
        soundAlerts.playSuccess();
        triggerHapticFeedback([40, 80, 40]);
        break;
      case 'APK_READY':
        soundAlerts.playApkReady();
        triggerHapticFeedback([50, 100, 50]);
        break;
      case 'PAYMENT_PENDING':
        soundAlerts.playPending();
        triggerHapticFeedback(20);
        break;
      case 'PAYMENT_REJECTED':
      case 'TECHNICAL_ERROR':
        soundAlerts.playWarning();
        triggerHapticFeedback([80, 40, 80]);
        break;
      case 'DOWNLOAD_STARTED':
        soundAlerts.playDownload();
        triggerHapticFeedback(25);
        break;
      case 'ADMIN_UPDATE':
        soundAlerts.playNotification();
        triggerHapticFeedback(30);
        break;
    }

    this.activePopup = event;
    this.listeners.forEach((listener) => listener(event));
  }

  public dismiss(id: string) {
    if (this.activePopup?.id === id) {
      this.activePopup = null;
    }
  }

  // --- Convenience Dispatchers ---

  public notifyPaymentSuccess(opts: {
    orderId: string;
    itemTitle: string;
    amount: number;
    downloadUrl?: string;
    token?: string;
  }) {
    this.emit({
      id: `pay_success_${opts.orderId}`,
      type: 'PAYMENT_SUCCESS',
      title: 'Payment Successful! 🎉',
      itemTitle: opts.itemTitle,
      message: `Direct UPI payment of ₹${opts.amount} has been verified and confirmed. Your license is activated.`,
      badge: 'VERIFIED',
      autoDismissMs: 0, // Keep until user views or downloads
      action: opts.downloadUrl
        ? {
            label: 'Download APK Now',
            downloadUrl: opts.downloadUrl,
            variant: 'success',
            onClick: () => {
              this.notifyDownloadStarted({ itemTitle: opts.itemTitle });
            },
          }
        : undefined,
      timestamp: Date.now(),
    });
    showAndroidToast(`Payment verified for ${opts.itemTitle}`);
  }

  public notifyPaymentPending(opts: { orderId: string; itemTitle: string; utrNumber?: string }) {
    this.emit({
      id: `pay_pending_${opts.orderId}_${Date.now()}`,
      type: 'PAYMENT_PENDING',
      title: 'Payment Verification In Progress ⏳',
      itemTitle: opts.itemTitle,
      message: opts.utrNumber
        ? `UTR Reference ${opts.utrNumber} submitted. Verifying payment confirmation...`
        : 'Payment order is active. Please complete UPI transfer.',
      badge: 'CHECKING BANK',
      solution: 'This normally takes 10 to 60 seconds. APK download will unlock automatically as soon as verified.',
      autoDismissMs: 8000,
      timestamp: Date.now(),
    });
  }

  public notifyPaymentRejected(opts: { orderId: string; itemTitle: string; reason?: string }) {
    this.emit({
      id: `pay_rejected_${opts.orderId}_${Date.now()}`,
      type: 'PAYMENT_REJECTED',
      title: 'Payment Verification Failed ⚠️',
      itemTitle: opts.itemTitle,
      message: opts.reason || 'Invalid UTR reference number or payment was not confirmed by the bank.',
      badge: 'VERIFICATION ERROR',
      solution: 'Kya karna hai: 1. Check your UPI app (PhonePe/GPay/Paytm) transaction receipt. 2. Verify the 12-digit UTR carefully. 3. Re-enter the correct reference or contact Admin on Telegram.',
      autoDismissMs: 0,
      action: {
        label: 'Contact Support on Telegram',
        variant: 'primary',
        onClick: () => {
          if (typeof window !== 'undefined') {
            window.open('https://t.me/sefastore', '_blank');
          }
        },
      },
      timestamp: Date.now(),
    });
  }

  public notifyApkReady(opts: {
    itemTitle: string;
    version?: string;
    downloadUrl: string;
    fileSize?: string;
  }) {
    this.emit({
      id: `apk_ready_${opts.itemTitle}_${opts.version || 'v1'}_${Date.now()}`,
      type: 'APK_READY',
      title: 'Your APK is Ready! 🚀',
      itemTitle: opts.itemTitle,
      message: `Version ${opts.version || 'Latest'} is prepared with full VIP authorization. Tap below to download.`,
      badge: 'APK READY',
      autoDismissMs: 0,
      action: {
        label: 'Download APK Package',
        downloadUrl: opts.downloadUrl,
        variant: 'success',
        onClick: () => {
          this.notifyDownloadStarted({ itemTitle: opts.itemTitle, fileSize: opts.fileSize });
        },
      },
      timestamp: Date.now(),
    });
  }

  public notifyDownloadStarted(opts: { itemTitle: string; fileSize?: string }) {
    this.emit({
      id: `download_started_${opts.itemTitle}_${Date.now()}`,
      type: 'DOWNLOAD_STARTED',
      title: 'APK Download Started 📥',
      itemTitle: opts.itemTitle,
      message: `Downloading "${opts.itemTitle}" ${opts.fileSize ? `(${opts.fileSize})` : ''} to your device.`,
      badge: 'DOWNLOADING',
      solution: 'Check your browser notification bar or Downloads folder. After download, tap the APK to install.',
      autoDismissMs: 6000,
      timestamp: Date.now(),
    });
    showAndroidToast(`Downloading ${opts.itemTitle}...`);
  }

  public notifyTechnicalError(opts: {
    title: string;
    message: string;
    solution: string;
    onRetry?: () => void;
  }) {
    this.emit({
      id: `tech_err_${Date.now()}`,
      type: 'TECHNICAL_ERROR',
      title: opts.title || 'Technical Notice 🛠️',
      message: opts.message,
      badge: 'NOTICE',
      solution: opts.solution,
      autoDismissMs: 9000,
      action: opts.onRetry
        ? {
            label: 'Retry Now',
            variant: 'primary',
            onClick: opts.onRetry,
          }
        : undefined,
      timestamp: Date.now(),
    });
  }

  public notifyAdminUpdate(opts: { id: string; title: string; message: string; date?: string }) {
    this.emit({
      id: `admin_update_${opts.id}`,
      type: 'ADMIN_UPDATE',
      title: opts.title || 'Store Announcement 📢',
      message: opts.message,
      badge: 'ADMIN UPDATE',
      autoDismissMs: 12000,
      timestamp: Date.now(),
    });
  }
}

export const notificationBus = new NotificationBus();
