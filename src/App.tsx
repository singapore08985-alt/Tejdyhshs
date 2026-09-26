import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { StoreApp, StoreNotification, StoreSettings, FreeFirePanel, CustomFeature } from './types';
import { INITIAL_APPS, INITIAL_NOTIFICATIONS } from './data/initialStoreData';
import { SefaHeader } from './components/SefaHeader';
import { SefaBottomNav, NavTab } from './components/SefaBottomNav';
import { SefaAppCard } from './components/SefaAppCard';
import { TopAppsView } from './components/TopAppsView';
import { FreeFirePanelView } from './components/FreeFirePanelView';
import { SefaAppModal } from './components/SefaAppModal';
import { SefaNotificationSheet } from './components/SefaNotificationSheet';
import { AdminModal } from './components/AdminModal';
import { PaymentModal, PayableItem } from './components/PaymentModal';
import { UserDashboardModal } from './components/UserDashboardModal';
import { MaintenanceScreen } from './components/MaintenanceScreen';
import { triggerHapticFeedback, showAndroidToast } from './utils/haptics';
import { GlobalNotificationPopup } from './components/GlobalNotificationPopup';
import { notificationBus } from './utils/notificationBus';
import { SupportHelpModal } from './components/SupportHelpModal';
import { Cinematic3DBackground } from './components/Cinematic3DBackground';
import { Filter, Sparkles, Flame, Layers, MessageCircle } from 'lucide-react';

const STORAGE_KEYS = {
  APPS: 'sefa_store_apps_v4',
  USER_ID: 'sefa_store_user_id',
  THEME: 'sefa_store_theme',
};

export default function App() {
  // 1. Persistent User Identity
  const [currentUserId] = useState<string>(() => {
    let id = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!id) {
      id = `usr_${Math.floor(100000 + Math.random() * 900000)}`;
      localStorage.setItem(STORAGE_KEYS.USER_ID, id);
    }
    return id;
  });

  // 2. Apps State (Initialized from storage or defaults)
  const [apps, setApps] = useState<StoreApp[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APPS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_APPS;
  });

  // 3. Free Fire Panels State
  const [freeFirePanels, setFreeFirePanels] = useState<FreeFirePanel[]>([]);

  // 4. Dynamic Custom Features State
  const [customFeatures, setCustomFeatures] = useState<CustomFeature[]>([]);

  // 5. Store Settings & Website Logo (Synchronized with Server)
  const [settings, setSettings] = useState<StoreSettings>({
    storeName: 'Sefa Store',
    creatorName: 'Created by Sefa',
    logoUrl: '',
    upiId: 'sk-sefajultulla@fam',
    maintenanceMode: false,
    maintenanceMessage: '🛠️ Sefa Store is undergoing scheduled maintenance. Please check back shortly.',
    telegramLink: 'https://t.me/SK_SEFA_tech',
    youtubeLink: 'https://youtube.com/@nova_proxy__.ios_007?si=rdZR0e35LGZ-AYAV',
    whatsappNumber: '919239182739',
    whatsappEnabled: true,
    telegramEnabled: true,
    youtubeEnabled: true,
  });

  // 6. Notifications
  const [notifications, setNotifications] = useState<StoreNotification[]>(INITIAL_NOTIFICATIONS);

  // 7. Dark/Light Theme
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.THEME) !== 'light';
  });

  // 8. Navigation & Modals
  const [activeTab, setActiveTab] = useState<NavTab>('apps');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<StoreApp | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [buyingItem, setBuyingItem] = useState<PayableItem | null>(null);
  const [isUserDashboardOpen, setIsUserDashboardOpen] = useState(false);
  const [isSupportHelpOpen, setIsSupportHelpOpen] = useState(false);

  // 9. HIDDEN Admin Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const lastSeenNoteIdRef = useRef<string | null>(null);

  // Poll server for store settings, logo, FF panels & custom features (Live Sync)
  const syncServerData = useCallback(() => {
    // Config & Logo
    fetch('/api/store/config')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.storeName) {
          setSettings((prev) => ({
            ...prev,
            storeName: data.storeName,
            creatorName: data.creatorName || prev.creatorName,
            logoUrl: data.logoUrl !== undefined ? data.logoUrl : prev.logoUrl,
            qrCodeUrl: data.qrCodeUrl !== undefined ? data.qrCodeUrl : prev.qrCodeUrl,
            upiId: data.upiId || prev.upiId,
            maintenanceMode: Boolean(data.maintenanceMode),
            maintenanceMessage: data.maintenanceMessage || prev.maintenanceMessage,
            telegramLink: data.telegramLink || prev.telegramLink,
            youtubeLink: data.youtubeLink || prev.youtubeLink,
            whatsappNumber: data.whatsappNumber || prev.whatsappNumber,
            whatsappEnabled: data.whatsappEnabled !== undefined ? Boolean(data.whatsappEnabled) : prev.whatsappEnabled,
            telegramEnabled: data.telegramEnabled !== undefined ? Boolean(data.telegramEnabled) : prev.telegramEnabled,
            youtubeEnabled: data.youtubeEnabled !== undefined ? Boolean(data.youtubeEnabled) : prev.youtubeEnabled,
          }));
        }
      })
      .catch((e) => console.log('Config sync skipped:', e));

    // Real-Time Store Announcements & Admin Updates Broadcast
    fetch('/api/store/updates')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.latestNotification && data.latestNotification.id) {
          const currentId = data.latestNotification.id;
          if (lastSeenNoteIdRef.current && lastSeenNoteIdRef.current !== currentId) {
            notificationBus.notifyAdminUpdate({
              id: currentId,
              title: data.latestNotification.title,
              message: data.latestNotification.message,
              date: data.latestNotification.date,
            });
          }
          lastSeenNoteIdRef.current = currentId;
        }
      })
      .catch(() => {});

    // Free Fire Panels
    fetch('/api/store/ff-panels')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.panels)) {
          setFreeFirePanels(data.panels);
        }
      })
      .catch(() => {});

    // Custom Features Live Sync
    fetch('/api/store/custom-features')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.features)) {
          setCustomFeatures(data.features);
        }
      })
      .catch(() => {});

    // Store Apps Live Sync (Real-time Database Sync)
    fetch('/api/store/apps')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.apps)) {
          setApps(data.apps);
        }
      })
      .catch(() => {});

    // Real-Time Notifications Sync (Orders, Verifications & Announcements)
    fetch(`/api/notifications?userId=${currentUserId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      })
      .catch(() => {});
  }, [currentUserId]);

  useEffect(() => {
    syncServerData();
    const interval = setInterval(syncServerData, 3000);
    return () => clearInterval(interval);
  }, [syncServerData]);

  // Real-Time SSE Listener for Instant Notifications, Apps, Features, and Order Status Updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`/api/events?userId=${currentUserId}`);
      eventSource.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data && data.type === 'ORDER_VERIFIED') {
            triggerHapticFeedback([50, 100, 50]);
            if (data.notification) {
              setNotifications((prev) => {
                const filtered = prev.filter((n) => n.id !== data.notification.id && n.orderId !== data.orderId);
                return [data.notification, ...filtered];
              });
            }
            notificationBus.notifyPaymentSuccess({
              orderId: data.orderId,
              itemTitle: data.itemTitle,
              amount: data.amount,
              downloadUrl: data.downloadUrl,
            });
            notificationBus.notifyApkReady({
              itemTitle: data.itemTitle,
              downloadUrl: data.downloadUrl,
            });
          } else if (data && data.type === 'APPS_UPDATED' && Array.isArray(data.apps)) {
            setApps(data.apps);
          } else if (data && data.type === 'FEATURES_UPDATED' && Array.isArray(data.features)) {
            setCustomFeatures(data.features);
          } else if (data && data.type === 'CONFIG_UPDATED' && data.settings) {
            setSettings((prev) => ({ ...prev, ...data.settings }));
          }
        } catch (e) {
          // ignore heartbeat
        }
      };
    } catch (e) {
      console.error('SSE App listener error:', e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [currentUserId]);

  // Persist Apps whenever modified by admin
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(apps));
    } catch (e) {}
  }, [apps]);

  // Apply Theme
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // -------------------------------------------------------------
  // HIDDEN ADMIN ACCESS LISTENERS:
  // 1. Secret 3-Finger Touch Gesture (Mobile)
  // 2. Secret Keyboard Shortcut: Ctrl + Shift + A (Desktop)
  // -------------------------------------------------------------
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 3) {
        triggerHapticFeedback([50, 100, 50]);
        setIsAdminModalOpen(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        triggerHapticFeedback(20);
        setIsAdminModalOpen(true);
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Handle Tab Selection
  const handleSelectTab = (tab: NavTab) => {
    if (tab === 'my_orders') {
      setIsUserDashboardOpen(true);
      return;
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter apps based on active category & search query
  const filteredApps = useMemo(() => {
    let result = apps;

    if (activeTab === 'apps') {
      result = result.filter((a) => a.category === 'apps');
    } else if (activeTab === 'games') {
      result = result.filter((a) => a.category === 'games');
    } else if (activeTab === 'books') {
      result = result.filter((a) => a.category === 'books');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = apps.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.category.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.badges.some((b) => b.toLowerCase().includes(q))
      );
    }

    return result;
  }, [apps, activeTab, searchQuery]);

  // App handlers for admin management
  const handleAddApp = (newApp: StoreApp) => {
    setApps((prev) => [newApp, ...prev]);
  };

  const handleUpdateApp = (updatedApp: StoreApp) => {
    setApps((prev) => prev.map((a) => (a.id === updatedApp.id ? updatedApp : a)));
    if (selectedApp && selectedApp.id === updatedApp.id) {
      setSelectedApp(updatedApp);
    }
  };

  const handleDeleteApp = (appId: string) => {
    setApps((prev) => prev.filter((a) => a.id !== appId));
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp(null);
    }
  };

  const handleRateApp = (appId: string, rating: number) => {
    setApps((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          const newReviewsCount = app.reviewsCount + 1;
          const newRating = Number(((app.rating * app.reviewsCount + rating) / newReviewsCount).toFixed(1));
          return { ...app, rating: newRating, reviewsCount: newReviewsCount };
        }
        return app;
      })
    );
  };

  const handleDownloadApp = (app: StoreApp) => {
    setApps((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, downloadsCount: a.downloadsCount + 1 } : a))
    );
  };

  const handleResetToDefault = () => {
    setApps(INITIAL_APPS);
    localStorage.removeItem(STORAGE_KEYS.APPS);
    showAndroidToast('Store refreshed to default');
  };

  // Section title based on tab
  const sectionTitle = useMemo(() => {
    if (searchQuery.trim()) return `🔍 Search Results ("${searchQuery}")`;
    switch (activeTab) {
      case 'apps':
        return '📱 All Apps';
      case 'games':
        return '🎮 Android Games';
      case 'ff_panels':
        return '🔥 Free Fire VIP Panels';
      case 'top_apps':
        return '🏆 Top Apps Leaderboard';
      case 'books':
        return '📚 Books & Scripts';
      default:
        return '📱 All Apps';
    }
  }, [activeTab, searchQuery]);

  // If Maintenance Mode is Active on Server & Admin is NOT in Admin modal, show Maintenance Screen
  if (settings.maintenanceMode && !isAdminModalOpen) {
    return (
      <>
        {/* Global Real-Time Event & Sound Popups */}
        <GlobalNotificationPopup />

        <MaintenanceScreen
          storeName={settings.storeName}
          message={settings.maintenanceMessage}
          logoUrl={settings.logoUrl}
          onOpenHiddenAdmin={() => setIsAdminModalOpen(true)}
          onRefresh={syncServerData}
        />
        {/* Hidden Admin Modal accessible during maintenance */}
        <AdminModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          apps={apps}
          onAddApp={handleAddApp}
          onUpdateApp={handleUpdateApp}
          onDeleteApp={handleDeleteApp}
          notifications={notifications}
          onAddNotification={(n) => setNotifications((prev) => [n, ...prev])}
          onDeleteNotification={(id) => setNotifications((prev) => prev.filter((x) => x.id !== id))}
          settings={settings}
          onUpdateSettings={setSettings}
          onResetAllApps={handleResetToDefault}
          freeFirePanels={freeFirePanels}
          onUpdatePanels={setFreeFirePanels}
          customFeatures={customFeatures}
          onUpdateFeatures={setCustomFeatures}
        />
      </>
    );
  }

  return (
    <div className={`min-h-screen w-full max-w-full overflow-x-hidden text-slate-100 flex flex-col items-center justify-start relative ${isDarkMode ? 'dark' : ''}`}>
      
      {/* Cinematic 3D Parallax Ambient Depth Layers */}
      <Cinematic3DBackground />

      {/* Main Responsive Glass Container (expands naturally on desktop, mobile-first) */}
      <div className="w-full max-w-7xl min-h-screen bg-slate-950/30 backdrop-blur-[2px] relative flex flex-col shadow-2xl md:border-x md:border-indigo-500/20">
        
        {/* Header (Clean, 100% public, secret 5-tap on lightning bolt) */}
        <SefaHeader
          settings={settings}
          totalAppsCount={apps.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          unreadNotificationsCount={notifications.filter((n) => n.isNew).length}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenUserDashboard={() => setIsUserDashboardOpen(true)}
          onSecretAdminTrigger={() => setIsAdminModalOpen(true)}
          onResetToDefault={handleResetToDefault}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onGoHome={() => {
            setActiveTab('apps');
            setSearchQuery('');
          }}
          onOpenHelp={() => setIsSupportHelpOpen(true)}
        />

        {/* Content Area with ample bottom padding so last row is never hidden */}
        <main className="flex-1 px-3 sm:px-4 md:px-6 py-4 pb-28 sm:pb-36 space-y-5">
          
          {/* Dynamic Custom Features Carousel / Banner if configured by Admin */}
          {customFeatures.length > 0 && !searchQuery.trim() && activeTab === 'apps' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-black text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>Featured VIP Tools & Modules</span>
                </span>
                <span className="text-[10px] sm:text-xs text-indigo-300 font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30">
                  Live Modules
                </span>
              </div>
              
              <div className="grid grid-cols-1 min-[601px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {customFeatures.slice(0, 8).map((feat) => (
                  <div
                    key={feat.id}
                    onClick={() => {
                      triggerHapticFeedback(10);
                      setBuyingItem({
                        id: feat.id,
                        title: feat.title,
                        priceINR: feat.priceINR,
                        icon: feat.icon,
                        durationDays: feat.durationDays,
                        startDate: feat.startDate,
                        expiryDate: feat.expiryDate,
                        type: 'custom_feature',
                        downloadUrl: feat.downloadUrl,
                        description: feat.description,
                      });
                    }}
                    className="group p-3.5 rounded-2xl bg-gradient-to-r from-slate-900/85 via-slate-900/65 to-indigo-950/45 backdrop-blur-md border border-cyan-500/35 hover:border-cyan-400/80 flex items-center justify-between gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_30px_rgba(34,211,238,0.25)] cursor-pointer transition-all duration-300 active:scale-98 hover:-translate-y-1"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={feat.icon}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover border border-cyan-400/50 shadow-[0_0_12px_rgba(34,211,238,0.3)] flex-shrink-0 group-hover:scale-105 transition"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[9px] font-bold text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-500/25 border border-cyan-400/40">
                            {feat.badge || (feat.isVip ? 'VIP' : 'NEW')}
                          </span>
                          <span className="text-[10px] text-slate-300">{feat.durationDays}d Plan</span>
                          {feat.appName && (
                            <span className="text-[9px] text-indigo-300 font-semibold px-1 rounded bg-indigo-500/25 border border-indigo-500/30 truncate max-w-[120px]">
                              📱 {feat.appName}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors leading-tight mt-1 truncate">{feat.title}</h4>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-xs sm:text-sm font-black text-amber-400 block drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]">
                        {feat.priceINR > 0 ? `₹${feat.priceINR}` : 'FREE'}
                      </span>
                      <span className="text-[9px] text-cyan-400 font-semibold group-hover:underline">Tap to Unlock</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DEDICATED FREE FIRE PANEL TAB VIEW */}
          {activeTab === 'ff_panels' ? (
            <FreeFirePanelView
              panels={freeFirePanels}
              onSelectPanel={(panel) => {
                setBuyingItem({
                  id: panel.id,
                  title: panel.name,
                  priceINR: panel.priceINR,
                  icon: panel.icon,
                  version: panel.version,
                  durationDays: panel.durationDays,
                  startDate: panel.startDate,
                  expiryDate: panel.expiryDate,
                  type: 'ff_panel',
                  downloadUrl: panel.downloadUrl,
                });
              }}
            />
          ) : activeTab === 'top_apps' && !searchQuery.trim() ? (
            <TopAppsView apps={apps} onSelectApp={setSelectedApp} />
          ) : (
            <div>
              {/* Section Header */}
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-indigo-500/25">
                <h3 className="text-sm sm:text-base font-black text-white tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  <span className="bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                    {sectionTitle}
                  </span>
                </h3>
                <span className="text-xs text-cyan-300 font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30">
                  {filteredApps.length} items
                </span>
              </div>

              {/* Responsive App Cards Grid:
                  - Mobile (<= 600px): 2 cards per row
                  - Tablet (601px - 1024px): 3–4 cards per row
                  - Desktop (> 1024px): 5–6 cards per row
              */}
              {filteredApps.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <Filter className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-300">No apps found</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Try searching for another app name.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveTab('apps');
                    }}
                    className="px-4 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    Clear Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 min-[601px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 md:gap-4.5">
                  {filteredApps.map((app) => (
                    <SefaAppCard
                      key={app.id}
                      app={app}
                      onSelect={(selected) => setSelectedApp(selected)}
                      attachedFeaturesCount={customFeatures.filter((f) => f.appId === app.id).length}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        </main>

        {/* Bottom Navigation Bar */}
        <SefaBottomNav
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
        />

      </div>

      {/* App Details Modal */}
      <SefaAppModal
        app={selectedApp}
        onClose={() => setSelectedApp(null)}
        onDownloadApp={handleDownloadApp}
        onRateApp={handleRateApp}
        customFeatures={customFeatures}
        onSelectFeature={(feat) => {
          setSelectedApp(null);
          setBuyingItem({
            id: feat.id,
            title: feat.title,
            priceINR: feat.priceINR,
            icon: feat.icon,
            durationDays: feat.durationDays,
            startDate: feat.startDate,
            expiryDate: feat.expiryDate,
            type: 'custom_feature',
            downloadUrl: feat.downloadUrl,
            description: feat.description,
          });
        }}
        onBuyPremium={(app) => {
          setBuyingItem({
            id: app.id,
            title: app.title,
            priceINR: app.priceINR,
            icon: app.icon,
            version: app.version,
            fileSize: app.fileSize,
            durationDays: app.durationDays || 30,
            startDate: app.startDate,
            expiryDate: app.expiryDate,
            type: 'app',
            downloadUrl: app.downloadUrl,
          });
        }}
      />

      {/* Notifications Announcement Sheet */}
      <SefaNotificationSheet
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
      />

      {/* Private User Dashboard Modal (My Orders & Downloads) */}
      <UserDashboardModal
        isOpen={isUserDashboardOpen}
        onClose={() => setIsUserDashboardOpen(false)}
        userId={currentUserId}
      />

      {/* Online UPI Payment Modal (Supports Apps, FF Panels & Custom Features) */}
      {buyingItem && (
        <PaymentModal
          item={buyingItem}
          onClose={() => setBuyingItem(null)}
          currentUserId={currentUserId}
          logoUrl={settings.logoUrl}
          qrCodeUrl={settings.qrCodeUrl}
          upiId={settings.upiId}
          onSuccessUnlock={(unlockedItem) => {
            showAndroidToast(`Unlocked ${unlockedItem.title}!`);
          }}
        />
      )}

      {/* Hidden Admin Console (Triggered via 3-finger touch, 5-tap on logo, or Ctrl+Shift+A) */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        apps={apps}
        onAddApp={handleAddApp}
        onUpdateApp={handleUpdateApp}
        onDeleteApp={handleDeleteApp}
        notifications={notifications}
        onAddNotification={(n) => setNotifications((prev) => [n, ...prev])}
        onDeleteNotification={(id) => setNotifications((prev) => prev.filter((x) => x.id !== id))}
        settings={settings}
        onUpdateSettings={setSettings}
        onResetAllApps={handleResetToDefault}
        freeFirePanels={freeFirePanels}
        onUpdatePanels={setFreeFirePanels}
        customFeatures={customFeatures}
        onUpdateFeatures={setCustomFeatures}
      />

      {/* WhatsApp Problem Support & Help Modal */}
      <SupportHelpModal
        isOpen={isSupportHelpOpen}
        onClose={() => setIsSupportHelpOpen(false)}
        settings={settings}
      />

      {/* Real-time Global Event Popups & Audio Alerts */}
      <GlobalNotificationPopup />

    </div>
  );
}
