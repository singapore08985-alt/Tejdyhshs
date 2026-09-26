import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Lock, 
  Unlock, 
  Plus, 
  Trash2, 
  Edit3, 
  Crown, 
  Upload, 
  Check, 
  Sparkles, 
  KeyRound, 
  FileCode, 
  Save, 
  RefreshCw, 
  ExternalLink,
  ShieldCheck,
  Send,
  Zap,
  Terminal,
  Eye,
  EyeOff,
  Radio,
  Sliders,
  DollarSign,
  Users,
  AlertTriangle,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Wrench,
  Search,
  Flame,
  Calendar,
  Image,
  Layers,
  Crosshair,
  UserCheck,
  UserX,
  UserPlus,
  FolderArchive,
  Download,
  HardDrive,
  FileArchive,
  ShieldAlert,
  RotateCcw,
  Rocket,
  MessageCircle,
  Youtube,
  Phone
} from 'lucide-react';
import { 
  StoreApp, 
  StoreCategory, 
  StoreNotification, 
  StoreSettings,
  OrderRecord,
  UserAccount,
  AdminProfile,
  AuditLog,
  OrderStatus,
  FreeFirePanel,
  CustomFeature,
  StoredApkFile
} from '../types';
import { triggerHapticFeedback, showAndroidToast } from '../utils/haptics';
import { AdminApkUploadDetector } from './AdminApkUploadDetector';
import { parseApkFile } from '../utils/apkParser';
import { ApkUploadField } from './ApkUploadField';
import { LogoUploadField } from './LogoUploadField';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  apps: StoreApp[];
  onAddApp: (app: StoreApp) => void;
  onUpdateApp: (app: StoreApp) => void;
  onDeleteApp: (appId: string) => void;
  notifications: StoreNotification[];
  onAddNotification: (notif: StoreNotification) => void;
  onDeleteNotification: (notifId: string) => void;
  settings: StoreSettings;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  onResetAllApps: () => void;
  freeFirePanels?: FreeFirePanel[];
  onUpdatePanels?: (panels: FreeFirePanel[]) => void;
  customFeatures?: CustomFeature[];
  onUpdateFeatures?: (features: CustomFeature[]) => void;
}

const PRESET_LOGOS = [
  { name: 'Neon Lightning', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=160&auto=format&fit=crop&q=80' },
  { name: 'Cyber Skull', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=160&auto=format&fit=crop&q=80' },
  { name: 'Gaming Fire', url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&auto=format&fit=crop&q=80' },
  { name: 'Apex Shield', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80' },
];

const TODAY_STR = new Date().toISOString().split('T')[0];
const FUTURE_30_STR = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  apps,
  onAddApp,
  onUpdateApp,
  onDeleteApp,
  notifications,
  onAddNotification,
  onDeleteNotification,
  settings,
  onUpdateSettings,
  onResetAllApps,
  freeFirePanels = [],
  onUpdatePanels,
  customFeatures = [],
  onUpdateFeatures,
}) => {
  // Session & Auth state
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('sefa_admin_token'));
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'ff_panels' | 'custom_features' | 'orders' | 'users' | 'apps' | 'admins' | 'settings' | 'logs' | 'backup'
  >('overview');

  // Backend Live Data
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [serverApps, setServerApps] = useState<StoreApp[]>(apps);
  const [serverPanels, setServerPanels] = useState<FreeFirePanel[]>(freeFirePanels);
  const [serverFeatures, setServerFeatures] = useState<CustomFeature[]>(customFeatures);
  const [storedApks, setStoredApks] = useState<StoredApkFile[]>([]);
  const [adminsList, setAdminsList] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // In-modal confirmation states to replace window.confirm for iframe safety
  const [featureToDeleteId, setFeatureToDeleteId] = useState<string | null>(null);
  const [appToDeleteId, setAppToDeleteId] = useState<string | null>(null);
  const [apkToDeleteId, setApkToDeleteId] = useState<string | null>(null);
  const [userToDeleteId, setUserToDeleteId] = useState<string | null>(null);
  const [panelToDeleteId, setPanelToDeleteId] = useState<string | null>(null);

  // Search queries for various tabs
  const [userSearch, setUserSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [appSearch, setAppSearch] = useState('');

  // -------------------------------------------------------------
  // Modals & Inline Editors
  // -------------------------------------------------------------
  const [editingApp, setEditingApp] = useState<StoreApp | null>(null);
  const [editingPanel, setEditingPanel] = useState<FreeFirePanel | null>(null);
  const [editingFeature, setEditingFeature] = useState<CustomFeature | null>(null);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Forms for adding new items
  const [showAddAppForm, setShowAddAppForm] = useState(false);
  const [showAddPanelForm, setShowAddPanelForm] = useState(false);
  const [showAddFeatureForm, setShowAddFeatureForm] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showAddAdminForm, setShowAddAdminForm] = useState(false);

  // Form states for New FF Panel
  const [newPanel, setNewPanel] = useState<Partial<FreeFirePanel>>({
    name: '',
    priceINR: 149,
    startDate: TODAY_STR,
    expiryDate: FUTURE_30_STR,
    durationDays: 30,
    targetGame: 'Both Normal & MAX',
    assignedUser: 'All VIP Users',
    features: ['100% Auto Headshot', 'Antiban Safe v14', 'ESP Location', 'AimLock 360°'],
    licenseKey: 'SEFA_VIP_KEY',
    downloadUrl: 'https://www.mediafire.com',
    status: 'active',
    version: 'v14.0',
    icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&auto=format&fit=crop&q=80',
  });

  // Form states for New Custom Feature
  const [newFeature, setNewFeature] = useState<Partial<CustomFeature>>({
    title: '',
    type: 'panel',
    description: '',
    icon: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
    badge: 'NEW',
    priceINR: 99,
    durationDays: 30,
    startDate: TODAY_STR,
    expiryDate: FUTURE_30_STR,
    downloadUrl: '',
    status: 'active',
    assignedUser: 'All Users',
    appId: '',
    appName: '',
    isVip: false,
  });

  // Form states for New User
  const [newUser, setNewUser] = useState<Partial<UserAccount>>({
    name: '',
    emailOrPhone: '',
    plan: 'vip_monthly',
    startDate: TODAY_STR,
    expiryDate: FUTURE_30_STR,
    durationDays: 30,
    permissions: ['all_apps', 'ff_panels'],
    status: 'active',
  });

  // Form states for New Sub-Admin
  const [newAdminUser, setNewAdminUser] = useState({
    username: '',
    displayName: '',
    password: '',
    permissions: {
      payments: true,
      users: true,
      apks: true,
      content: true,
      maintenance: false,
    },
  });

  // Settings edit state
  const [editedSettings, setEditedSettings] = useState<StoreSettings>(settings);
  const [newOwnerPassword, setNewOwnerPassword] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Backup & export states
  const [isExportingProject, setIsExportingProject] = useState(false);
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  // Sync settings when props change
  useEffect(() => {
    setEditedSettings(settings);
  }, [settings]);

  // Sync serverApps when apps prop changes
  useEffect(() => {
    if (apps && apps.length > 0) {
      setServerApps(apps);
    }
  }, [apps]);

  // Sync session on mount
  useEffect(() => {
    if (adminToken) {
      fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Session invalid');
          return res.json();
        })
        .then((data) => {
          setAdminProfile(data.admin);
        })
        .catch(() => {
          setAdminToken(null);
          localStorage.removeItem('sefa_admin_token');
        });
    }
  }, [adminToken]);

  // Fetch Full Dashboard Data
  const fetchDashboardData = () => {
    if (!adminToken) return;
    setIsLoadingData(true);
    fetch('/api/admin/dashboard-data', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.orders) setOrders(data.orders);
          if (data.users) setUsers(data.users);
          if (data.apps && Array.isArray(data.apps)) {
            setServerApps(data.apps);
          }
          if (data.freeFirePanels) {
            setServerPanels(data.freeFirePanels);
            if (onUpdatePanels) onUpdatePanels(data.freeFirePanels);
          }
          if (data.customFeatures) {
            setServerFeatures(data.customFeatures);
            if (onUpdateFeatures) onUpdateFeatures(data.customFeatures);
          }
          if (data.storedApks) setStoredApks(data.storedApks);
          if (data.admins) setAdminsList(data.admins);
          if (data.auditLogs) setAuditLogs(data.auditLogs);
          if (data.stats) setStats(data.stats);
          if (data.settings) {
            onUpdateSettings({ ...settings, ...data.settings });
            setEditedSettings({ ...settings, ...data.settings });
          }
        }
      })
      .catch((e) => console.error('Dashboard data fetch error:', e))
      .finally(() => setIsLoadingData(false));
  };

  useEffect(() => {
    if (adminToken && isOpen) {
      fetchDashboardData();
    }
  }, [adminToken, isOpen]);

  if (!isOpen) return null;

  // -------------------------------------------------------------
  // LOGIN HANDLER
  // -------------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPassword.trim()) {
      setAuthError('Please enter password or secret key');
      return;
    }

    setIsLoggingIn(true);
    setAuthError(null);
    triggerHapticFeedback(15);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername.trim() || undefined,
          password: loginPassword.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.token) {
        setAdminToken(data.token);
        localStorage.setItem('sefa_admin_token', data.token);
        setAdminProfile(data.admin);
        setLoginPassword('');
        setAuthError(null);
        triggerHapticFeedback([40, 80, 40]);
        showAndroidToast(`Welcome ${data.admin.displayName}!`);
      } else {
        setAuthError(data.error || 'Invalid credentials');
        triggerHapticFeedback([80, 40, 80]);
      }
    } catch (err) {
      setAuthError('Connection error. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setAdminToken(null);
    setAdminProfile(null);
    localStorage.removeItem('sefa_admin_token');
    triggerHapticFeedback(10);
    showAndroidToast('Logged out of Admin');
  };

  // -------------------------------------------------------------
  // LOGO UPLOAD & LOGO CHANGE HANDLER
  // -------------------------------------------------------------
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showAndroidToast('Logo image must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setEditedSettings((prev) => ({ ...prev, logoUrl: base64 }));
        showAndroidToast('New logo loaded! Click "Save Settings" to publish across all pages.');
        triggerHapticFeedback(15);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          ...editedSettings,
          newOwnerPassword: newOwnerPassword.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.settings) {
        onUpdateSettings(data.settings);
        setNewOwnerPassword('');
        triggerHapticFeedback([40, 80, 40]);
        showAndroidToast('Settings & Logo published successfully across all pages!');
        fetchDashboardData();
      } else {
        showAndroidToast(data.error || 'Failed to save settings');
      }
    } catch (e) {
      showAndroidToast('Network error saving settings');
    }
  };

  // -------------------------------------------------------------
  // FREE FIRE PANEL HANDLERS (Dedicated Section)
  // -------------------------------------------------------------
  const handleSavePanel = async (panelData: Partial<FreeFirePanel>) => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/ff-panels/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(panelData),
      });
      const data = await res.json();
      if (data.success) {
        triggerHapticFeedback([40, 80, 40]);
        showAndroidToast('Free Fire Panel saved successfully!');
        setEditingPanel(null);
        setShowAddPanelForm(false);
        fetchDashboardData();
      } else {
        showAndroidToast(data.error || 'Failed to save FF panel');
      }
    } catch (e) {
      showAndroidToast('Error saving FF panel');
    }
  };

  const handleDeletePanel = async (id: string) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/ff-panels/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        triggerHapticFeedback(20);
        showAndroidToast('Free Fire Panel deleted');
        setPanelToDeleteId(null);
        fetchDashboardData();
      }
    } catch (e) {
      showAndroidToast('Error deleting panel');
    }
  };

  // -------------------------------------------------------------
  // DYNAMIC "ADD NEW FEATURE" HANDLERS
  // -------------------------------------------------------------
  const handleSaveFeature = async (featData: Partial<CustomFeature>) => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/custom-features/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(featData),
      });
      const data = await res.json();
      if (data.success) {
        if (data.features) {
          setServerFeatures(data.features);
          if (onUpdateFeatures) onUpdateFeatures(data.features);
        }
        triggerHapticFeedback([40, 80, 40]);
        showAndroidToast('Dynamic feature saved and published to live store!');
        setEditingFeature(null);
        setShowAddFeatureForm(false);
        fetchDashboardData();
      } else {
        showAndroidToast(data.error || 'Failed to save feature');
      }
    } catch (e) {
      showAndroidToast('Error saving feature');
    }
  };

  const handleDeleteFeature = async (id: string) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/custom-features/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        const next = serverFeatures.filter((f) => f.id !== id);
        setServerFeatures(next);
        if (onUpdateFeatures) onUpdateFeatures(next);
        setFeatureToDeleteId(null);
        triggerHapticFeedback(20);
        showAndroidToast('Feature permanently removed from live store');
        fetchDashboardData();
      } else {
        showAndroidToast(data.error || 'Failed to delete feature');
      }
    } catch (e) {
      showAndroidToast('Error deleting feature');
    }
  };

  // -------------------------------------------------------------
  // USER & PERMISSION MANAGEMENT HANDLERS
  // -------------------------------------------------------------
  const handleSaveUser = async (userData: Partial<UserAccount>) => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/users/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(userData),
      });
      const data = await res.json();
      if (data.success) {
        triggerHapticFeedback([40, 80, 40]);
        showAndroidToast('User details and permissions saved!');
        setEditingUser(null);
        setShowAddUserForm(false);
        fetchDashboardData();
      } else {
        showAndroidToast(data.error || 'Failed to save user');
      }
    } catch (e) {
      showAndroidToast('Error saving user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        triggerHapticFeedback(20);
        showAndroidToast('User deleted');
        setUserToDeleteId(null);
        fetchDashboardData();
      }
    } catch (e) {
      showAndroidToast('Error deleting user');
    }
  };

  // -------------------------------------------------------------
  // APP ITEM MANAGEMENT HANDLERS (Live Server Database Sync)
  // -------------------------------------------------------------
  const handleSaveAppEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp || !adminToken) return;

    try {
      const res = await fetch('/api/admin/apps/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(editingApp),
      });
      const data = await res.json();
      if (data.success && data.app) {
        onUpdateApp(data.app);
        if (data.apps) setServerApps(data.apps);
        triggerHapticFeedback([40, 80, 40]);
        showAndroidToast(`Updated and published "${data.app.title}"!`);
        setEditingApp(null);
        fetchDashboardData();
      } else {
        showAndroidToast(data.error || 'Failed to update app');
      }
    } catch (e) {
      showAndroidToast('Network error saving app');
    }
  };

  const handleDeleteAppConfirm = async (appId: string) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/apps/${appId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (data.success) {
        onDeleteApp(appId);
        setServerApps((prev) => prev.filter((a) => a.id !== appId));
        setAppToDeleteId(null);
        triggerHapticFeedback(20);
        showAndroidToast('App permanently removed from live store');
        fetchDashboardData();
      } else {
        showAndroidToast(data.error || 'Failed to delete app');
      }
    } catch (e) {
      showAndroidToast('Error deleting app');
    }
  };

  const handleAddNewApp = async (newApp: StoreApp) => {
    // Immediately update local store apps state
    onAddApp(newApp);
    setServerApps((prev) => {
      const exists = prev.some((a) => a.id === newApp.id);
      return exists ? prev.map((a) => a.id === newApp.id ? newApp : a) : [newApp, ...prev];
    });
    setShowAddAppForm(false);
    triggerHapticFeedback([50, 100, 50]);
    showAndroidToast(`🚀 "${newApp.title}" is now LIVE in the Public Store!`);

    // Ensure it is saved in server db if not already persisted
    if (adminToken) {
      try {
        const res = await fetch('/api/admin/apps/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(newApp),
        });
        const data = await res.json();
        if (data.success && data.apps) {
          setServerApps(data.apps);
        }
      } catch (e) {
        console.error('Background app sync notice:', e);
      }
    }
    fetchDashboardData();
  };

  // -------------------------------------------------------------
  // ORDER STATUS UPDATE (Approve / Reject)
  // -------------------------------------------------------------
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, notes?: string) => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ orderId, status, notes }),
      });
      const data = await res.json();
      if (data.success) {
        triggerHapticFeedback(status === 'PAID' ? [40, 80, 40] : 20);
        showAndroidToast(`Order marked as ${status}`);
        fetchDashboardData();
      }
    } catch (e) {
      showAndroidToast('Failed to update order');
    }
  };

  // -------------------------------------------------------------
  // SIMULATE PAYMENT GATEWAY RECONCILIATION
  // -------------------------------------------------------------
  const handleSimulateGatewayPayment = async (order: OrderRecord) => {
    try {
      triggerHapticFeedback(15);
      const res = await fetch('/api/payments/verify-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          utrNumber: order.utrNumber || '427189021948',
          amount: order.amount,
          status: 'SUCCESS',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showAndroidToast(`Gateway reconciled order ${order.id}! Status: PAID`);
        fetchDashboardData();
      } else {
        showAndroidToast(`Gateway rejection: ${data.error || 'Check details'}`);
      }
    } catch (e: any) {
      showAndroidToast('Gateway webhook failed to connect');
    }
  };

  // -------------------------------------------------------------
  // BACKUP & PROJECT EXPORT HANDLERS
  // -------------------------------------------------------------
  const handleDownloadProject = async () => {
    if (!adminToken) return;
    setIsExportingProject(true);
    triggerHapticFeedback([30, 60, 30]);
    showAndroidToast('Packaging complete website source code into ZIP...');
    try {
      const res = await fetch(`/api/admin/system/export-project?token=${adminToken}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate source code ZIP');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.download = `SefaStore_Complete_Source_Code_${dateStr}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      triggerHapticFeedback([40, 80, 40]);
      showAndroidToast('Complete Source Code ZIP downloaded successfully!');
    } catch (err: any) {
      console.error('Project export failed:', err);
      showAndroidToast(`Export failed: ${err.message || 'Error creating ZIP'}`);
    } finally {
      setIsExportingProject(false);
    }
  };

  const handleDownloadBackup = async () => {
    if (!adminToken) return;
    setIsExportingBackup(true);
    triggerHapticFeedback(20);
    showAndroidToast('Exporting database snapshot (.json)...');
    try {
      const res = await fetch(`/api/admin/system/export-backup?token=${adminToken}`);
      if (!res.ok) {
        throw new Error('Failed to download database snapshot');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.download = `SefaStore_Database_Backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      triggerHapticFeedback([40, 80, 40]);
      showAndroidToast('Database backup saved successfully!');
    } catch (err: any) {
      console.error('Backup export failed:', err);
      showAndroidToast('Failed to export database backup');
    } finally {
      setIsExportingBackup(false);
    }
  };

  const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!adminToken) return;

    setIsRestoringBackup(true);
    setRestoreMessage(null);
    triggerHapticFeedback(20);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      const res = await fetch('/api/admin/system/restore-backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(parsed),
      });

      const data = await res.json();
      if (data.success) {
        triggerHapticFeedback([50, 100, 50]);
        setRestoreMessage(`✅ Successfully restored! ${data.message}`);
        showAndroidToast('Website state restored successfully!');
        fetchDashboardData();
      } else {
        throw new Error(data.error || 'Failed to restore backup');
      }
    } catch (err: any) {
      console.error('Restore error:', err);
      setRestoreMessage(`❌ Restore failed: ${err.message || 'Invalid JSON file'}`);
      showAndroidToast(`Restore failed: ${err.message}`);
    } finally {
      setIsRestoringBackup(false);
      event.target.value = '';
    }
  };

  // Helper date duration calculation
  const calculateDaysBetween = (start: string, end: string) => {
    try {
      const diff = new Date(end).getTime() - new Date(start).getTime();
      const days = Math.round(diff / (1000 * 3600 * 24));
      return days > 0 ? days : 1;
    } catch (e) {
      return 30;
    }
  };

  // -------------------------------------------------------------
  // RENDER: LOGIN VIEW IF NOT AUTHENTICATED
  // -------------------------------------------------------------
  if (!adminToken || !adminProfile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 max-w-sm w-full space-y-5 shadow-2xl">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center overflow-hidden">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-black text-white">Admin Portal</h3>
                <p className="text-[11px] text-slate-400">{settings.storeName} Management</p>
              </div>
            </div>

            <button
              onClick={() => {
                triggerHapticFeedback(10);
                onClose();
              }}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Username (Optional for Owner):
              </label>
              <input
                type="text"
                placeholder="Username (e.g. sefa_owner)"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password or Secret Key:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? 'Verifying...' : 'Sign In to Dashboard'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: AUTHENTICATED ADMIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Admin Header */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center overflow-hidden">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Crown className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  {settings.storeName} Admin Control
                </h3>
                <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                  adminProfile.role === 'owner' 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                    : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                }`}>
                  {adminProfile.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Logged in as <strong className="text-white">{adminProfile.displayName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Download Source Code Button in Admin Header */}
            <button
              type="button"
              onClick={handleDownloadProject}
              disabled={isExportingProject}
              title="Download Complete Website Source Code (.ZIP)"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Download className={`w-3.5 h-3.5 ${isExportingProject ? 'animate-bounce' : ''}`} />
              <span className="hidden sm:inline">{isExportingProject ? 'Creating ZIP...' : 'Download Source Code'}</span>
              <span className="sm:hidden">Source ZIP</span>
            </button>

            <button
              onClick={fetchDashboardData}
              title="Refresh Data"
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:text-rose-400 text-slate-300 text-xs font-semibold transition"
            >
              Logout
            </button>
            <button
              onClick={() => {
                triggerHapticFeedback(10);
                onClose();
              }}
              className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 px-3 sm:px-6 py-2 bg-slate-950/40 border-b border-slate-800 overflow-x-auto scrollbar-none text-xs font-bold">
          
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          {/* DEDICATED FREE FIRE PANEL TAB */}
          <button
            onClick={() => setActiveTab('ff_panels')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ff_panels' ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md' : 'text-orange-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 fill-orange-400" />
            <span>Free Fire Panels</span>
            <span className="px-1.5 py-0.1 rounded-full bg-black/40 text-[10px]">
              {serverPanels.length}
            </span>
          </button>

          {/* DYNAMIC "ADD NEW FEATURE" TAB */}
          <button
            onClick={() => setActiveTab('custom_features')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'custom_features' ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md' : 'text-cyan-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Dynamic Features</span>
            <span className="px-1.5 py-0.1 rounded-full bg-black/40 text-[10px]">
              {serverFeatures.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'orders' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Payments & Orders</span>
            {orders.filter((o) => o.status === 'PENDING').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          {/* PROPER USER & PERMISSION MANAGEMENT */}
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users & Permissions</span>
          </button>

          {/* APPS & APKS EDIT OPTION FOR ALL ITEMS */}
          <button
            onClick={() => setActiveTab('apps')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'apps' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Apps & APKs</span>
          </button>

          {adminProfile.role === 'owner' && (
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'admins' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Sub-Admins</span>
            </button>
          )}

          {/* SETTINGS & LOGO UPLOAD */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Logo & Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'logs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Audit Logs</span>
          </button>

          {/* COMPLETE WEBSITE SOURCE CODE & BACKUP TAB */}
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'backup' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-bold' : 'text-emerald-400 hover:text-white'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span>Download Source & Backup</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* ========================================================= */}
          {/* TAB 1: OVERVIEW STATS                                     */}
          {/* ========================================================= */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Top KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold">Total Revenue</span>
                  <div className="text-xl font-black text-amber-400">
                    ₹{stats ? stats.totalRevenueINR : orders.filter(o => o.status === 'PAID').reduce((sum, o) => sum + o.amount, 0)}
                  </div>
                  <span className="text-[10px] text-emerald-400">Verified Direct UPI</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold">Pending Review</span>
                  <div className="text-xl font-black text-white">
                    {orders.filter(o => o.status === 'PENDING').length}
                  </div>
                  <span className="text-[10px] text-amber-400">Needs Approval</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold">Free Fire Panels</span>
                  <div className="text-xl font-black text-orange-400">
                    {serverPanels.length}
                  </div>
                  <span className="text-[10px] text-orange-300">Active VIP Panels</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[11px] text-slate-400 font-semibold">Total Users</span>
                  <div className="text-xl font-black text-cyan-400">
                    {users.length}
                  </div>
                  <span className="text-[10px] text-slate-500">Registered Accounts</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  onClick={() => {
                    setActiveTab('ff_panels');
                    setShowAddPanelForm(true);
                  }}
                  className="p-3 rounded-2xl bg-gradient-to-r from-orange-600/30 to-amber-600/30 border border-orange-500/40 text-left hover:border-orange-500 transition"
                >
                  <Flame className="w-5 h-5 text-orange-400 mb-1" />
                  <div className="text-xs font-bold text-white">+ Add FF Panel</div>
                  <span className="text-[10px] text-slate-400">Set price, dates & user</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('custom_features');
                    setShowAddFeatureForm(true);
                  }}
                  className="p-3 rounded-2xl bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 border border-cyan-500/40 text-left hover:border-cyan-500 transition"
                >
                  <Plus className="w-5 h-5 text-cyan-400 mb-1" />
                  <div className="text-xs font-bold text-white">+ Add New Feature</div>
                  <span className="text-[10px] text-slate-400">Dynamic feature builder</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('users');
                    setShowAddUserForm(true);
                  }}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-left hover:border-slate-700 transition"
                >
                  <UserPlus className="w-5 h-5 text-indigo-400 mb-1" />
                  <div className="text-xs font-bold text-white">+ Add User</div>
                  <span className="text-[10px] text-slate-400">Set plan & permissions</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-left hover:border-slate-700 transition"
                >
                  <Image className="w-5 h-5 text-pink-400 mb-1" />
                  <div className="text-xs font-bold text-white">Change Logo</div>
                  <span className="text-[10px] text-slate-400">Upload & publish store logo</span>
                </button>
              </div>

              {/* DOWNLOAD COMPLETE SOURCE CODE QUICK BANNER */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-teal-950/70 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <FolderArchive className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white">Download Complete Source Code</h4>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                        FULL PROJECT ZIP
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Download 100% of website source code, frontend (React+Vite), backend (Express), database, configuration, and static assets.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadProject}
                  disabled={isExportingProject}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition cursor-pointer flex-shrink-0 disabled:opacity-50"
                >
                  <Download className={`w-4 h-4 stroke-[2.5] ${isExportingProject ? 'animate-bounce' : ''}`} />
                  <span>{isExportingProject ? 'Generating ZIP...' : 'Download Source Code (.ZIP)'}</span>
                </button>
              </div>

              {/* Maintenance Status Widget */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <span>Store Maintenance Mode</span>
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Currently: {settings.maintenanceMode ? <span className="text-amber-400 font-bold">ACTIVE (Visitors see maintenance screen)</span> : <span className="text-emerald-400 font-bold">ONLINE & LIVE</span>}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
                >
                  Configure
                </button>
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: FREE FIRE PANEL MANAGEMENT (DEDICATED SECTION)      */}
          {/* ========================================================= */}
          {activeTab === 'ff_panels' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                    <span>Free Fire VIP Panel Management</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Set panel name, price, start date, expiry date, duration in days, and assigned user.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddPanelForm(!showAddPanelForm)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddPanelForm ? 'Close Form' : '+ Add Free Fire Panel'}</span>
                </button>
              </div>

              {/* Form to Add New Free Fire Panel */}
              {showAddPanelForm && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-orange-500/40 space-y-4 animate-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h5 className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                      New Free Fire Panel Configuration
                    </h5>
                    <button
                      onClick={() => setShowAddPanelForm(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Panel Name:</label>
                      <input
                        type="text"
                        placeholder="e.g. Free Fire Auto Headshot VIP Panel V14"
                        value={newPanel.name}
                        onChange={(e) => setNewPanel({ ...newPanel, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Price (₹ INR):</label>
                      <input
                        type="number"
                        placeholder="149"
                        value={newPanel.priceINR}
                        onChange={(e) => setNewPanel({ ...newPanel, priceINR: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>

                    {/* Date Pickers with HTML5 date */}
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-orange-400" />
                        <span>Start Date:</span>
                      </label>
                      <input
                        type="date"
                        value={newPanel.startDate || TODAY_STR}
                        onChange={(e) => {
                          const start = e.target.value;
                          const dur = newPanel.durationDays || 30;
                          const exp = new Date(new Date(start).getTime() + dur * 86400000).toISOString().split('T')[0];
                          setNewPanel({ ...newPanel, startDate: start, expiryDate: exp });
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>Expiry Date:</span>
                      </label>
                      <input
                        type="date"
                        value={newPanel.expiryDate || FUTURE_30_STR}
                        onChange={(e) => {
                          const exp = e.target.value;
                          const start = newPanel.startDate || TODAY_STR;
                          const days = calculateDaysBetween(start, exp);
                          setNewPanel({ ...newPanel, expiryDate: exp, durationDays: days });
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Duration in Days (Kitne din chalega):
                      </label>
                      <input
                        type="number"
                        placeholder="30"
                        value={newPanel.durationDays}
                        onChange={(e) => {
                          const days = Number(e.target.value);
                          const start = newPanel.startDate || TODAY_STR;
                          const exp = new Date(new Date(start).getTime() + days * 86400000).toISOString().split('T')[0];
                          setNewPanel({ ...newPanel, durationDays: days, expiryDate: exp });
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Target Game:</label>
                      <select
                        value={newPanel.targetGame}
                        onChange={(e) => setNewPanel({ ...newPanel, targetGame: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      >
                        <option value="Both Normal & MAX">Both Normal & MAX</option>
                        <option value="FF Normal">FF Normal Only</option>
                        <option value="FF MAX">FF MAX Only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Assigned User / Kaunsa user ko milega:
                      </label>
                      <input
                        type="text"
                        placeholder="All VIP Users or specific User ID/Name"
                        value={newPanel.assignedUser}
                        onChange={(e) => setNewPanel({ ...newPanel, assignedUser: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">License Key / Password:</label>
                      <input
                        type="text"
                        placeholder="e.g. SEFA_VIP_2026"
                        value={newPanel.licenseKey}
                        onChange={(e) => setNewPanel({ ...newPanel, licenseKey: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <LogoUploadField
                        label="Free Fire Panel Icon / Logo"
                        currentUrl={newPanel.icon || ''}
                        onLogoChange={(url) => setNewPanel({ ...newPanel, icon: url })}
                        adminToken={adminToken}
                        section="ff_panel_icon"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <ApkUploadField
                        label="Free Fire Panel Android APK File"
                        currentDownloadUrl={newPanel.downloadUrl || ''}
                        onApkStored={(apk) => {
                          setNewPanel({ 
                            ...newPanel, 
                            downloadUrl: apk.storagePath,
                            version: apk.sizeFormatted 
                          });
                          fetchDashboardData();
                        }}
                        adminToken={adminToken}
                        itemId={newPanel.id}
                        appTitle={newPanel.name || 'Free Fire VIP Panel'}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 font-semibold mb-1">
                        Features (comma separated):
                      </label>
                      <input
                        type="text"
                        placeholder="100% Auto Headshot, Antiban Safe, ESP Bone, AimLock 360"
                        value={Array.isArray(newPanel.features) ? newPanel.features.join(', ') : newPanel.features}
                        onChange={(e) => setNewPanel({ ...newPanel, features: e.target.value.split(',').map(s => s.trim()) })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleSavePanel(newPanel)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save & Publish Free Fire Panel</span>
                  </button>
                </div>
              )}

              {/* Free Fire Panels List */}
              <div className="space-y-3">
                {serverPanels.map((panel) => (
                  <div
                    key={panel.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={panel.icon || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&auto=format&fit=crop&q=80'}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover border border-orange-500/30 flex-shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{panel.name}</span>
                          <span className="px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 text-[10px] font-bold">
                            {panel.targetGame}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                            panel.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {panel.status}
                          </span>
                        </div>

                        {/* Dates & Duration */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                          <span className="text-amber-400 font-bold">Price: ₹{panel.priceINR}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            <span>Duration: <strong className="text-white">{panel.durationDays} Days</strong></span>
                          </span>
                          <span>Start: {panel.startDate}</span>
                          <span>Exp: {panel.expiryDate}</span>
                          <span>Assigned: <strong className="text-white">{panel.assignedUser}</strong></span>
                        </div>

                        {/* Features */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          {panel.features.map((f, i) => (
                            <span key={i} className="px-2 py-0.2 rounded bg-slate-900 text-slate-300 text-[9px] border border-slate-800">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                      <button
                        onClick={() => setEditingPanel(panel)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Edit Panel</span>
                      </button>

                      <button
                        onClick={() => handleDeletePanel(panel.id)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* EDIT PANEL POPUP MODAL */}
              {editingPanel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                  <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-orange-400" />
                        <span>Edit Free Fire Panel</span>
                      </h4>
                      <button onClick={() => setEditingPanel(null)} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Panel Name:</label>
                        <input
                          type="text"
                          value={editingPanel.name}
                          onChange={(e) => setEditingPanel({ ...editingPanel, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Price (₹ INR):</label>
                        <input
                          type="number"
                          value={editingPanel.priceINR}
                          onChange={(e) => setEditingPanel({ ...editingPanel, priceINR: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Start Date:</label>
                        <input
                          type="date"
                          value={editingPanel.startDate}
                          onChange={(e) => setEditingPanel({ ...editingPanel, startDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Expiry Date:</label>
                        <input
                          type="date"
                          value={editingPanel.expiryDate}
                          onChange={(e) => {
                            const exp = e.target.value;
                            const days = calculateDaysBetween(editingPanel.startDate, exp);
                            setEditingPanel({ ...editingPanel, expiryDate: exp, durationDays: days });
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Duration Days:</label>
                        <input
                          type="number"
                          value={editingPanel.durationDays}
                          onChange={(e) => setEditingPanel({ ...editingPanel, durationDays: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Status:</label>
                        <select
                          value={editingPanel.status}
                          onChange={(e) => setEditingPanel({ ...editingPanel, status: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        >
                          <option value="active">Active</option>
                          <option value="expired">Expired</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Assigned User:</label>
                        <input
                          type="text"
                          value={editingPanel.assignedUser}
                          onChange={(e) => setEditingPanel({ ...editingPanel, assignedUser: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Target Game:</label>
                        <select
                          value={editingPanel.targetGame}
                          onChange={(e) => setEditingPanel({ ...editingPanel, targetGame: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        >
                          <option value="Both Normal & MAX">Both Normal & MAX</option>
                          <option value="FF Normal">FF Normal Only</option>
                          <option value="FF MAX">FF MAX Only</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <LogoUploadField
                          label="Free Fire Panel Icon / Logo"
                          currentUrl={editingPanel.icon || ''}
                          onLogoChange={(url) => setEditingPanel({ ...editingPanel, icon: url })}
                          adminToken={adminToken}
                          section="ff_panel_icon"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <ApkUploadField
                          label="Free Fire Panel Android APK File"
                          currentDownloadUrl={editingPanel.downloadUrl || ''}
                          onApkStored={(apk) => {
                            setEditingPanel({ 
                              ...editingPanel, 
                              downloadUrl: apk.storagePath,
                              version: apk.sizeFormatted 
                            });
                            fetchDashboardData();
                          }}
                          adminToken={adminToken}
                          itemId={editingPanel.id}
                          appTitle={editingPanel.name}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => setEditingPanel(null)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSavePanel(editingPanel)}
                        className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 text-xs font-bold shadow"
                      >
                        Save & Update Live
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: DYNAMIC "ADD NEW FEATURE" BUILDER                   */}
          {/* ========================================================= */}
          {activeTab === 'custom_features' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-cyan-400" />
                    <span>Dynamic Store Features Builder</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Add new features, custom injectors, banners, scripts, or tools at any time without code changes.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddFeatureForm(!showAddFeatureForm)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddFeatureForm ? 'Close Form' : '+ Add New Feature'}</span>
                </button>
              </div>

              {/* Form to Add Dynamic Feature */}
              {showAddFeatureForm && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-cyan-500/40 space-y-4 animate-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h5 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Create New Dynamic Feature / Tool</span>
                    </h5>
                    <button onClick={() => setShowAddFeatureForm(false)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* 1. SELECT APP / ADD TO APP (Connect with All Apps) */}
                    <div className="sm:col-span-2 p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-cyan-300 font-bold flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-cyan-400" />
                          <span>Select App / Add to App:</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {newFeature.appId ? 'Attached to specific app' : 'Global Store Tool'}
                        </span>
                      </div>
                      <select
                        value={newFeature.appId || ''}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          const linked = serverApps.find((a) => a.id === selectedId);
                          setNewFeature({
                            ...newFeature,
                            appId: selectedId || undefined,
                            appName: linked ? linked.title : undefined,
                            isVip: linked ? (linked.isPremium || newFeature.isVip) : newFeature.isVip,
                            priceINR: linked && linked.isPremium && newFeature.priceINR === 0 ? linked.priceINR : newFeature.priceINR,
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-medium"
                      >
                        <option value="">🌐 All Store / Standalone Tool (Not attached to specific app)</option>
                        <optgroup label="Available Apps in Live Store:">
                          {serverApps.map((a) => (
                            <option key={a.id} value={a.id}>
                              📱 {a.title} ({a.category.toUpperCase()} • {a.isPremium ? `VIP ₹${a.priceINR}` : 'FREE'})
                            </option>
                          ))}
                        </optgroup>
                      </select>
                      {newFeature.appId && (
                        <div className="flex items-center justify-between text-[11px] pt-1 text-cyan-200">
                          <span>Attached Target: <strong>{newFeature.appName || 'Selected App'}</strong></span>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(newFeature.isVip)}
                              onChange={(e) => setNewFeature({ ...newFeature, isVip: e.target.checked })}
                              className="rounded text-cyan-500 focus:ring-0"
                            />
                            <span className="font-bold text-amber-300">VIP / Paid Feature</span>
                          </label>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Feature Title:</label>
                      <input
                        type="text"
                        placeholder="e.g. VIP AimBot + ESP Injector Tool"
                        value={newFeature.title}
                        onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Feature Type:</label>
                      <select
                        value={newFeature.type}
                        onChange={(e) => setNewFeature({ ...newFeature, type: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      >
                        <option value="panel">Panel / Injector</option>
                        <option value="app">Android App / APK</option>
                        <option value="tool">Mod Tool / Script</option>
                        <option value="banner">Announcement Banner</option>
                        <option value="link">Direct Download Link</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Price (₹ INR, 0 = Free):</label>
                      <input
                        type="number"
                        placeholder="99"
                        value={newFeature.priceINR}
                        onChange={(e) => setNewFeature({ ...newFeature, priceINR: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Duration Days:</label>
                      <input
                        type="number"
                        placeholder="30"
                        value={newFeature.durationDays}
                        onChange={(e) => setNewFeature({ ...newFeature, durationDays: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Start Date:</label>
                      <input
                        type="date"
                        value={newFeature.startDate || TODAY_STR}
                        onChange={(e) => setNewFeature({ ...newFeature, startDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Expiry Date:</label>
                      <input
                        type="date"
                        value={newFeature.expiryDate || FUTURE_30_STR}
                        onChange={(e) => setNewFeature({ ...newFeature, expiryDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 font-semibold mb-1">Description:</label>
                      <textarea
                        rows={2}
                        placeholder="Feature details, how it works, and instructions..."
                        value={newFeature.description}
                        onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <LogoUploadField
                        label="Feature Icon / Banner"
                        currentUrl={newFeature.icon || ''}
                        onLogoChange={(url) => setNewFeature({ ...newFeature, icon: url })}
                        adminToken={adminToken}
                        section="feature_icon"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <ApkUploadField
                        label="Feature Package / Android APK Upload (Permanent Server Storage)"
                        currentDownloadUrl={newFeature.downloadUrl || ''}
                        onApkStored={(apk) => {
                          setNewFeature({ 
                            ...newFeature, 
                            downloadUrl: apk.storagePath 
                          });
                          fetchDashboardData();
                        }}
                        adminToken={adminToken}
                        itemId={newFeature.id}
                        appTitle={newFeature.title || 'Dynamic Feature Tool'}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveFeature(newFeature)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Publish Feature to Live Store</span>
                  </button>
                </div>
              )}

              {/* EDIT DYNAMIC FEATURE MODAL */}
              {editingFeature && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                  <div className="bg-slate-900 border border-cyan-500/50 rounded-3xl p-5 max-w-lg w-full space-y-4 max-h-[92vh] overflow-y-auto">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-cyan-400" />
                        <span>Edit Dynamic Feature ({editingFeature.title})</span>
                      </h4>
                      <button onClick={() => setEditingFeature(null)} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Select App / Connect with App */}
                      <div className="sm:col-span-2 p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                        <label className="text-cyan-300 font-bold flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-cyan-400" />
                          <span>Attach to Store App:</span>
                        </label>
                        <select
                          value={editingFeature.appId || ''}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            const linked = serverApps.find((a) => a.id === selectedId);
                            setEditingFeature({
                              ...editingFeature,
                              appId: selectedId || undefined,
                              appName: linked ? linked.title : undefined,
                              isVip: linked ? (linked.isPremium || editingFeature.isVip) : editingFeature.isVip,
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-medium"
                        >
                          <option value="">🌐 All Store / Standalone Tool (Not attached to specific app)</option>
                          <optgroup label="Available Store Apps:">
                            {serverApps.map((a) => (
                              <option key={a.id} value={a.id}>
                                📱 {a.title} ({a.category.toUpperCase()} • {a.isPremium ? `VIP ₹${a.priceINR}` : 'FREE'})
                              </option>
                            ))}
                          </optgroup>
                        </select>
                        {editingFeature.appId && (
                          <div className="flex items-center justify-between text-[11px] pt-1 text-cyan-200">
                            <span>Connected App: <strong>{editingFeature.appName || 'Selected App'}</strong></span>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(editingFeature.isVip)}
                                onChange={(e) => setEditingFeature({ ...editingFeature, isVip: e.target.checked })}
                                className="rounded text-cyan-500 focus:ring-0"
                              />
                              <span className="font-bold text-amber-300">VIP / Paid Feature</span>
                            </label>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Feature Title:</label>
                        <input
                          type="text"
                          value={editingFeature.title}
                          onChange={(e) => setEditingFeature({ ...editingFeature, title: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Feature Type:</label>
                        <select
                          value={editingFeature.type}
                          onChange={(e) => setEditingFeature({ ...editingFeature, type: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        >
                          <option value="panel">Panel / Injector</option>
                          <option value="app">Android App / APK</option>
                          <option value="tool">Mod Tool / Script</option>
                          <option value="banner">Announcement Banner</option>
                          <option value="link">Direct Download Link</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Price (₹ INR, 0 = Free):</label>
                        <input
                          type="number"
                          value={editingFeature.priceINR}
                          onChange={(e) => setEditingFeature({ ...editingFeature, priceINR: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Duration Days:</label>
                        <input
                          type="number"
                          value={editingFeature.durationDays}
                          onChange={(e) => setEditingFeature({ ...editingFeature, durationDays: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Start Date:</label>
                        <input
                          type="date"
                          value={editingFeature.startDate || TODAY_STR}
                          onChange={(e) => setEditingFeature({ ...editingFeature, startDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Expiry Date:</label>
                        <input
                          type="date"
                          value={editingFeature.expiryDate || FUTURE_30_STR}
                          onChange={(e) => setEditingFeature({ ...editingFeature, expiryDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-slate-300 font-semibold mb-1">Description:</label>
                        <textarea
                          rows={2}
                          value={editingFeature.description}
                          onChange={(e) => setEditingFeature({ ...editingFeature, description: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <LogoUploadField
                          label="Feature Icon / Banner"
                          currentUrl={editingFeature.icon || ''}
                          onLogoChange={(url) => setEditingFeature({ ...editingFeature, icon: url })}
                          adminToken={adminToken}
                          section="feature_icon"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <ApkUploadField
                          label="Actual Android Package / APK File (Permanent Server Storage)"
                          currentDownloadUrl={editingFeature.downloadUrl || ''}
                          onApkStored={(apk) => {
                            setEditingFeature({ 
                              ...editingFeature, 
                              downloadUrl: apk.storagePath 
                            });
                            fetchDashboardData();
                          }}
                          adminToken={adminToken}
                          itemId={editingFeature.id}
                          appTitle={editingFeature.title}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => setEditingFeature(null)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveFeature(editingFeature)}
                        className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow"
                      >
                        Save & Publish Live
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Features List with Working Delete & Edit */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                  <span>Available Dynamic Features ({serverFeatures.length})</span>
                  <span>Instant Live Store Sync</span>
                </div>

                {serverFeatures.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/60 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                    No dynamic features configured yet. Click "+ Add New Feature" above.
                  </div>
                ) : (
                  serverFeatures.map((feat) => (
                    <div
                      key={feat.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={feat.icon}
                          alt=""
                          className="w-12 h-12 rounded-xl object-cover border border-cyan-500/40 flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h5 className="text-xs font-bold text-white">{feat.title}</h5>
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                              {feat.type}
                            </span>
                            {feat.isVip || feat.priceINR > 0 ? (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-black border border-amber-500/30">
                                👑 VIP ₹{feat.priceINR}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                FREE
                              </span>
                            )}

                            {/* Connected App Badge */}
                            {feat.appId && (
                              <span className="px-2 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold flex items-center gap-1">
                                <Layers className="w-2.5 h-2.5" />
                                <span>Attached: {feat.appName || feat.appId}</span>
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[11px] text-slate-400 mt-1">{feat.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 mt-1.5">
                            <span>Validity: <strong className="text-slate-400">{feat.durationDays}d</strong></span>
                            <span>Start: {feat.startDate}</span>
                            <span>Exp: {feat.expiryDate}</span>
                            {feat.downloadUrl && (
                              <span className="text-emerald-400 font-mono flex items-center gap-0.5">
                                <HardDrive className="w-3 h-3" />
                                <span>APK Attached</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Working Edit & Delete Buttons with Inline Confirmation */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {featureToDeleteId === feat.id ? (
                          <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-500/60 p-1.5 rounded-xl animate-in zoom-in-95">
                            <span className="text-[10px] font-bold text-rose-300 px-1">Permanently remove?</span>
                            <button
                              onClick={() => handleDeleteFeature(feat.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition cursor-pointer shadow"
                            >
                              Confirm Delete
                            </button>
                            <button
                              onClick={() => setFeatureToDeleteId(null)}
                              className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[10px] transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingFeature({ ...feat })}
                              className="px-2.5 py-1.5 rounded-xl bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-600 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                              title="Edit Feature"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setFeatureToDeleteId(feat.id)}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                              title="Delete Feature Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: USERS & PERMISSION MANAGEMENT (PROPER UI)          */}
          {/* ========================================================= */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    <span>User & Permission Management</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Add users, change plans, set validity start/expiry dates, and assign app permissions.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddUserForm(!showAddUserForm)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer self-start sm:self-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{showAddUserForm ? 'Close Form' : '+ Add New User'}</span>
                </button>
              </div>

              {/* Form to Add User */}
              {showAddUserForm && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-indigo-500/40 space-y-4 animate-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      Add New User Account
                    </h5>
                    <button onClick={() => setShowAddUserForm(false)} className="text-slate-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">User Full Name:</label>
                      <input
                        type="text"
                        placeholder="e.g. Rahul Sharma"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Email or Phone Number:</label>
                      <input
                        type="text"
                        placeholder="rahul@gmail.com or 9876543210"
                        value={newUser.emailOrPhone}
                        onChange={(e) => setNewUser({ ...newUser, emailOrPhone: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Assigned VIP Plan:</label>
                      <select
                        value={newUser.plan}
                        onChange={(e) => setNewUser({ ...newUser, plan: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      >
                        <option value="free">Free Access</option>
                        <option value="vip_daily">VIP Daily (1 Day)</option>
                        <option value="vip_weekly">VIP Weekly (7 Days)</option>
                        <option value="vip_monthly">VIP Monthly (30 Days)</option>
                        <option value="vip_lifetime">VIP Lifetime All-Access</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Status:</label>
                      <select
                        value={newUser.status}
                        onChange={(e) => setNewUser({ ...newUser, status: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      >
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Plan Start Date:</label>
                      <input
                        type="date"
                        value={newUser.startDate || TODAY_STR}
                        onChange={(e) => setNewUser({ ...newUser, startDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Plan Expiry Date:</label>
                      <input
                        type="date"
                        value={newUser.expiryDate || FUTURE_30_STR}
                        onChange={(e) => setNewUser({ ...newUser, expiryDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 font-semibold mb-1">
                        Permissions (e.g. all_apps, ff_panels, termux_pro):
                      </label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {['all_apps', 'ff_panels', 'app:mt-manager', 'app:termux', 'mod_tools'].map((perm) => (
                          <label key={perm} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newUser.permissions?.includes(perm)}
                              onChange={(e) => {
                                const current = newUser.permissions || [];
                                if (e.target.checked) {
                                  setNewUser({ ...newUser, permissions: [...current, perm] });
                                } else {
                                  setNewUser({ ...newUser, permissions: current.filter(p => p !== perm) });
                                }
                              }}
                            />
                            <span className="text-[11px] text-slate-200">{perm}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveUser(newUser)}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow"
                  >
                    Save & Create User
                  </button>
                </div>
              )}

              {/* Users Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user by name, email, phone, or ID..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500"
                />
              </div>

              {/* Users List */}
              <div className="space-y-3">
                {users
                  .filter((u) => {
                    if (!userSearch.trim()) return true;
                    const q = userSearch.toLowerCase();
                    return u.name.toLowerCase().includes(q) || u.emailOrPhone.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
                  })
                  .map((user) => (
                    <div
                      key={user.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{user.name}</span>
                          <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                            {user.plan}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                            user.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {user.status}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3">
                          <span>{user.emailOrPhone}</span>
                          <span className="text-slate-500">ID: {user.id}</span>
                          {user.startDate && <span>Start: {user.startDate}</span>}
                          {user.expiryDate && <span>Exp: {user.expiryDate}</span>}
                        </div>

                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {user.permissions.map((p, idx) => (
                            <span key={idx} className="px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 text-[9px] border border-slate-800">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Edit / Extend</span>
                        </button>

                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>

              {/* EDIT USER POPUP MODAL */}
              {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                  <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-indigo-400" />
                        <span>Edit User & Permissions</span>
                      </h4>
                      <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Name:</label>
                        <input
                          type="text"
                          value={editingUser.name}
                          onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Email or Phone:</label>
                        <input
                          type="text"
                          value={editingUser.emailOrPhone}
                          onChange={(e) => setEditingUser({ ...editingUser, emailOrPhone: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Plan:</label>
                        <select
                          value={editingUser.plan}
                          onChange={(e) => setEditingUser({ ...editingUser, plan: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        >
                          <option value="free">Free</option>
                          <option value="vip_daily">VIP Daily (1d)</option>
                          <option value="vip_weekly">VIP Weekly (7d)</option>
                          <option value="vip_monthly">VIP Monthly (30d)</option>
                          <option value="vip_lifetime">VIP Lifetime</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Status:</label>
                        <select
                          value={editingUser.status}
                          onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        >
                          <option value="active">Active</option>
                          <option value="blocked">Blocked</option>
                          <option value="expired">Expired</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Start Date:</label>
                        <input
                          type="date"
                          value={editingUser.startDate || TODAY_STR}
                          onChange={(e) => setEditingUser({ ...editingUser, startDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Expiry Date:</label>
                        <input
                          type="date"
                          value={editingUser.expiryDate || FUTURE_30_STR}
                          onChange={(e) => setEditingUser({ ...editingUser, expiryDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => setEditingUser(null)}
                        className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveUser(editingUser)}
                        className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow"
                      >
                        Save & Update Live
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: APPS & APKS EDIT OPTION FOR ALL EXISTING ITEMS      */}
          {/* ========================================================= */}
          {activeTab === 'apps' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-indigo-400" />
                    <span>Store Apps & APK Management</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Edit any existing item's name, price, plan, dates, duration, status, and download links.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddAppForm(!showAddAppForm)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95 cursor-pointer self-start sm:self-auto"
                >
                  <Rocket className="w-4 h-4 fill-slate-950" />
                  <span>{showAddAppForm ? 'Close Launch Form' : '🚀 Launch New APK / App (Direct Public)'}</span>
                </button>
              </div>

              {/* AUTOMATIC APK DETECTION & BRANDING FORM */}
              {showAddAppForm && (
                <AdminApkUploadDetector
                  adminToken={adminToken}
                  onAppCreated={(newApp) => {
                    handleAddNewApp(newApp);
                  }}
                  onClose={() => setShowAddAppForm(false)}
                />
              )}

              {/* Search Bar for Apps */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search app to edit price, name, dates..."
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500"
                />
              </div>

              {/* Apps List with Edit & Working Delete */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-1">
                  <span>Store Apps Collection ({serverApps.length})</span>
                  <span>Instant Database Sync</span>
                </div>

                {serverApps
                  .filter((a) => !appSearch.trim() || a.title.toLowerCase().includes(appSearch.toLowerCase()))
                  .map((app) => (
                    <div
                      key={app.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={app.icon}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover border border-slate-700 flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80';
                          }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-white">{app.title}</h5>
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                              {app.category}
                            </span>
                            {app.isPremium ? (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                                VIP ₹{app.priceINR}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                FREE
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                            <span>Ver: {app.version}</span>
                            <span>Size: {app.fileSize}</span>
                            <span>Downloads: {app.downloadsCount}</span>
                            {app.startDate && <span>Dates: {app.startDate} to {app.expiryDate}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons with inline confirmation */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {appToDeleteId === app.id ? (
                          <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-500/60 p-1.5 rounded-xl animate-in zoom-in-95">
                            <span className="text-[10px] font-bold text-rose-300 px-1">Delete "{app.title}"?</span>
                            <button
                              onClick={() => handleDeleteAppConfirm(app.id)}
                              className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition cursor-pointer shadow"
                            >
                              Confirm Delete
                            </button>
                            <button
                              onClick={() => setAppToDeleteId(null)}
                              className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[10px] transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingApp({ ...app })}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white hover:bg-indigo-600 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => setAppToDeleteId(app.id)}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                              title="Delete App"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {/* EDIT APP MODAL (Price, Name, Plan, Duration, Date, Status Edit) */}
              {editingApp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
                  <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-lg w-full space-y-4 max-h-[92vh] overflow-y-auto">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-cyan-400" />
                        <span>Edit Item Details ({editingApp.title})</span>
                      </h4>
                      <button onClick={() => setEditingApp(null)} className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveAppEdit} className="space-y-3 text-xs">
                      
                      {/* Quick APK Auto-Detection for Existing Item */}
                      <div className="p-3 rounded-2xl bg-slate-950 border border-indigo-500/30 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <span className="text-[11px] text-slate-300">Update branding directly from new APK:</span>
                        </div>
                        <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[11px] cursor-pointer flex items-center gap-1 transition">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Detect from APK</span>
                          <input
                            type="file"
                            accept=".apk"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  showAndroidToast('Analyzing APK...');
                                  const meta = await parseApkFile(file);
                                  setEditingApp({
                                    ...editingApp,
                                    title: meta.detectedAppName || editingApp.title,
                                    icon: meta.detectedIconUrl || editingApp.icon,
                                    version: meta.detectedVersion || editingApp.version,
                                    fileSize: meta.fileSizeFormatted || editingApp.fileSize,
                                  });
                                  showAndroidToast(`Detected: ${meta.detectedAppName}`);
                                } catch (err: any) {
                                  showAndroidToast('Failed to auto-detect APK');
                                }
                              }
                            }}
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Item Title / Name:</label>
                          <input
                            type="text"
                            value={editingApp.title}
                            onChange={(e) => setEditingApp({ ...editingApp, title: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Category:</label>
                          <select
                            value={editingApp.category}
                            onChange={(e) => setEditingApp({ ...editingApp, category: e.target.value as StoreCategory })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                          >
                            <option value="apps">Apps</option>
                            <option value="games">Games</option>
                            <option value="top_apps">Top Apps</option>
                            <option value="books">Books & Scripts</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Price (₹ INR):</label>
                          <input
                            type="number"
                            value={editingApp.priceINR}
                            onChange={(e) => setEditingApp({ ...editingApp, priceINR: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Access Type:</label>
                          <select
                            value={editingApp.isPremium ? 'premium' : 'free'}
                            onChange={(e) => setEditingApp({ ...editingApp, isPremium: e.target.value === 'premium' })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                          >
                            <option value="free">Free App</option>
                            <option value="premium">VIP Paid App</option>
                          </select>
                        </div>

                        {/* Date Pickers */}
                        <div>
                          <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-cyan-400" />
                            <span>Start Date:</span>
                          </label>
                          <input
                            type="date"
                            value={editingApp.startDate || TODAY_STR}
                            onChange={(e) => setEditingApp({ ...editingApp, startDate: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-amber-400" />
                            <span>Expiry Date:</span>
                          </label>
                          <input
                            type="date"
                            value={editingApp.expiryDate || FUTURE_30_STR}
                            onChange={(e) => setEditingApp({ ...editingApp, expiryDate: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Duration Days:</label>
                          <input
                            type="number"
                            value={editingApp.durationDays || 30}
                            onChange={(e) => setEditingApp({ ...editingApp, durationDays: Number(e.target.value) })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-300 font-semibold mb-1">Status:</label>
                          <select
                            value={editingApp.status || 'active'}
                            onChange={(e) => setEditingApp({ ...editingApp, status: e.target.value as any })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                          >
                            <option value="active">Active</option>
                            <option value="expired">Expired</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="hidden">Hidden</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <LogoUploadField
                            label="App Icon / Logo"
                            currentUrl={editingApp.icon || ''}
                            onLogoChange={(url) => setEditingApp({ ...editingApp, icon: url })}
                            adminToken={adminToken}
                            section="app_icon"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <ApkUploadField
                            label="Actual Android APK File (Stored Binary)"
                            currentDownloadUrl={editingApp.downloadUrl || ''}
                            onApkStored={(apk) => {
                              setEditingApp({
                                ...editingApp,
                                downloadUrl: apk.storagePath,
                                fileSize: apk.sizeFormatted,
                              });
                              fetchDashboardData();
                            }}
                            adminToken={adminToken}
                            itemId={editingApp.id}
                            appTitle={editingApp.title}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-slate-300 font-semibold mb-1">Password / Key (Optional):</label>
                          <input
                            type="text"
                            value={editingApp.password || ''}
                            onChange={(e) => setEditingApp({ ...editingApp, password: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingApp(null)}
                          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow"
                        >
                          Save & Publish Live
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Stored Server APK Archives */}
              <div className="pt-6 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                    <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                      Stored Server APK Archives ({storedApks.length})
                    </h5>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Exact binary files stored on permanent disk
                  </span>
                </div>

                {storedApks.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center text-slate-500 text-xs">
                    No APK binary packages stored yet. Upload an APK above or use "Auto-Detect APK".
                  </div>
                ) : (
                  <div className="space-y-2">
                    {storedApks.map((stored) => (
                      <div
                        key={stored.id}
                        className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileCode className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold text-white font-mono">{stored.originalFilename}</span>
                            <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                              {stored.sizeFormatted}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                            {stored.appTitle && <span>Item: <strong className="text-slate-300">{stored.appTitle}</strong></span>}
                            <span>SHA256: <strong className="font-mono text-slate-400">{stored.sha256.substring(0, 12)}...</strong></span>
                            <span>Uploaded: {new Date(stored.uploadedAt).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <a
                            href={`/api/admin/apks/download/${stored.storedFilename}?token=${adminToken}`}
                            download={stored.originalFilename}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download / Test</span>
                          </a>

                          {apkToDeleteId === stored.id ? (
                            <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-500/60 p-1.5 rounded-xl animate-in zoom-in-95">
                              <span className="text-[10px] font-bold text-rose-300 px-1">Delete from disk?</span>
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/admin/apks/${stored.id}`, {
                                      method: 'DELETE',
                                      headers: { Authorization: `Bearer ${adminToken}` },
                                    });
                                    if (res.ok) {
                                      showAndroidToast('APK package deleted');
                                      setApkToDeleteId(null);
                                      fetchDashboardData();
                                    }
                                  } catch (e) {
                                    showAndroidToast('Failed to delete APK');
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] transition cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setApkToDeleteId(null)}
                                className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px] transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setApkToDeleteId(stored.id)}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                              title="Delete APK"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: PAYMENTS & ORDERS                                  */}
          {/* ========================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white">Payment Orders & UTR Verification</h4>
                  <p className="text-[11px] text-slate-400">Review, approve, or reject customer UPI payments.</p>
                </div>
                <span className="text-xs font-mono text-amber-400 font-bold">
                  UPI: {settings.upiId}
                </span>
              </div>

              <div className="space-y-2.5">
                {orders.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">No orders recorded yet.</div>
                ) : (
                  orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-white">{ord.id}</span>
                          <span className="text-xs font-bold text-amber-400">₹{ord.amount}</span>
                          <span className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                            ord.status === 'PAID'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : ord.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {ord.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-200">
                          Item: <strong>{ord.itemTitle}</strong> | Customer: {ord.userName} ({ord.userPhoneOrEmail})
                        </p>

                        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-3">
                          <span>UTR: <strong className="text-amber-300 font-mono">{ord.utrNumber || 'None'}</strong></span>
                          <span>Time: {new Date(ord.createdAt).toLocaleTimeString()}</span>
                          <span>Downloads: {ord.downloadCount}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                        {ord.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.id, 'PAID')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow transition active:scale-95 cursor-pointer"
                              title="Verify genuine payment and issue download license"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve & Unlock</span>
                            </button>
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.id, 'REJECTED', 'Payment reference not found in bank statements')}
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 shadow transition active:scale-95 cursor-pointer"
                              title="Reject fake or unverified UTR"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject Fake</span>
                            </button>
                            <button
                              onClick={() => handleSimulateGatewayPayment(ord)}
                              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                              title="Simulate bank rail webhook automated settlement"
                            >
                              <Zap className="w-3 h-3 text-amber-400" />
                              <span>Simulate Gateway</span>
                            </button>
                          </>
                        )}
                        {ord.status === 'REJECTED' && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rejected</span>
                            </span>
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.id, 'PAID')}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                            >
                              Re-Approve
                            </button>
                          </div>
                        )}
                        {ord.status === 'PAID' && (
                          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verified & Unlocked ({ord.downloadCount} dl)</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: SETTINGS & WEBSITE LOGO UPLOAD/CHANGE              */}
          {/* ========================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-150 max-w-2xl">
              
              <div className="pb-3 border-b border-slate-800">
                <h4 className="text-base font-black text-white flex items-center gap-2">
                  <Image className="w-5 h-5 text-indigo-400" />
                  <span>Store Branding & Website Logo</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Upload a new logo or provide an image link. It automatically updates on the header, banner, and all pages.
                </p>
              </div>

              {/* LOGO SECTION */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <LogoUploadField
                  label="Website Brand Logo (Header, Banner, & Brandings)"
                  currentUrl={editedSettings.logoUrl}
                  onLogoChange={(url) => setEditedSettings({ ...editedSettings, logoUrl: url })}
                  adminToken={adminToken}
                  section="website_logo"
                />

                {/* Preset Logos */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block mb-2 font-semibold">Or pick a preset gaming logo:</span>
                  <div className="flex items-center gap-3 overflow-x-auto pb-1">
                    {PRESET_LOGOS.map((pre, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditedSettings({ ...editedSettings, logoUrl: pre.url })}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-400 text-slate-300 text-[11px] flex-shrink-0"
                      >
                        <img src={pre.url} alt="" className="w-5 h-5 rounded-md object-cover" />
                        <span>{pre.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* PAYMENT QR CODE UPLOAD SECTION */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <LogoUploadField
                  label="Payment UPI Scanner QR Code Image"
                  currentUrl={editedSettings.qrCodeUrl || ''}
                  onLogoChange={(url) => setEditedSettings({ ...editedSettings, qrCodeUrl: url })}
                  adminToken={adminToken}
                  section="payment_qr"
                />
                <p className="text-[10px] text-slate-500">
                  Customers scan this QR code directly inside the Payment Modal to complete UPI transactions.
                </p>
              </div>

              {/* STORE GENERAL SETTINGS */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Store Details & UPI
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Store Name:</label>
                    <input
                      type="text"
                      value={editedSettings.storeName}
                      onChange={(e) => setEditedSettings({ ...editedSettings, storeName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">UPI ID for Payments:</label>
                    <input
                      type="text"
                      value={editedSettings.upiId}
                      onChange={(e) => setEditedSettings({ ...editedSettings, upiId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Maintenance Mode Toggle */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Maintenance Mode</span>
                      <span className="text-[11px] text-slate-400">Lock the store with a maintenance message.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editedSettings.maintenanceMode}
                        onChange={(e) => setEditedSettings({ ...editedSettings, maintenanceMode: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {editedSettings.maintenanceMode && (
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Visitor Maintenance Message:</label>
                      <textarea
                        rows={2}
                        value={editedSettings.maintenanceMessage}
                        onChange={(e) => setEditedSettings({ ...editedSettings, maintenanceMessage: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* WHATSAPP SUPPORT & PROBLEM RESOLUTION */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/40 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 fill-emerald-500/30" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">WhatsApp Problem Support Number</span>
                      <span className="text-[10px] text-slate-400">Users can tap to directly chat with admin on WhatsApp when facing any problem.</span>
                    </div>
                  </div>

                  {/* Toggle WhatsApp Support ON/OFF */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold ${editedSettings.whatsappEnabled !== false ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {editedSettings.whatsappEnabled !== false ? 'ACTIVE (ON)' : 'DISABLED (OFF)'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editedSettings.whatsappEnabled !== false}
                        onChange={(e) => setEditedSettings({ ...editedSettings, whatsappEnabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">
                      Admin WhatsApp Number (Country Code + Number):
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={editedSettings.whatsappNumber || '919239182739'}
                        onChange={(e) => setEditedSettings({ ...editedSettings, whatsappNumber: e.target.value })}
                        placeholder="919239182739"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 font-mono font-bold focus:border-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <a
                      href={`https://wa.me/${(editedSettings.whatsappNumber || '919239182739').replace(/[^0-9]/g, '')}?text=Test%20Admin%20Support`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Test WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* OFFICIAL YOUTUBE & TELEGRAM CHANNELS */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Official Social Channels & Community
                </span>

                {/* YouTube Channel */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                        <Youtube className="w-3.5 h-3.5 fill-rose-500/30" />
                      </div>
                      <span className="font-bold text-slate-200">YouTube Channel Link:</span>
                    </div>

                    {/* YouTube ON/OFF Toggle */}
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${editedSettings.youtubeEnabled !== false ? 'text-rose-400' : 'text-slate-500'}`}>
                        {editedSettings.youtubeEnabled !== false ? 'ACTIVE (ON)' : 'HIDDEN (OFF)'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editedSettings.youtubeEnabled !== false}
                          onChange={(e) => setEditedSettings({ ...editedSettings, youtubeEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={editedSettings.youtubeLink || 'https://youtube.com/@nova_proxy__.ios_007?si=rdZR0e35LGZ-AYAV'}
                      onChange={(e) => setEditedSettings({ ...editedSettings, youtubeLink: e.target.value })}
                      placeholder="https://youtube.com/@yourchannel"
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-rose-400"
                    />
                    <a
                      href={editedSettings.youtubeLink || 'https://youtube.com/@nova_proxy__.ios_007?si=rdZR0e35LGZ-AYAV'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open</span>
                    </a>
                  </div>
                </div>

                {/* Telegram Channel */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                        <Send className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-200">Telegram Channel Link:</span>
                    </div>

                    {/* Telegram ON/OFF Toggle */}
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${editedSettings.telegramEnabled !== false ? 'text-sky-400' : 'text-slate-500'}`}>
                        {editedSettings.telegramEnabled !== false ? 'ACTIVE (ON)' : 'HIDDEN (OFF)'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editedSettings.telegramEnabled !== false}
                          onChange={(e) => setEditedSettings({ ...editedSettings, telegramEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={editedSettings.telegramLink || 'https://t.me/SK_SEFA_tech'}
                      onChange={(e) => setEditedSettings({ ...editedSettings, telegramLink: e.target.value })}
                      placeholder="https://t.me/yourchannel"
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs focus:border-sky-400"
                    />
                    <a
                      href={editedSettings.telegramLink || 'https://t.me/SK_SEFA_tech'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* SAVE BUTTON */}
              <button
                onClick={handleSaveSettings}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-cyan-600 to-indigo-600 hover:opacity-95 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save & Publish Changes Live</span>
              </button>

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 8: AUDIT LOGS                                         */}
          {/* ========================================================= */}
          {activeTab === 'logs' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white">System Security & Audit Trail</h4>
                <span className="text-xs text-slate-500">{auditLogs.length} events logged</span>
              </div>

              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="font-bold text-indigo-400">{log.actor}</span>
                      <span className="text-[10px]">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-200">{log.details}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 9: COMPLETE WEBSITE BACKUP & FULL PROJECT EXPORT     */}
          {/* ========================================================= */}
          {activeTab === 'backup' && (
            <div className="space-y-6 animate-in fade-in duration-150 max-w-3xl">
              <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <FolderArchive className="w-5 h-5 text-emerald-400" />
                    <span>Complete Website Backup & Project Export</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Download complete project source code, database snapshots, or restore previous backups.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                  Full-Stack Ready
                </span>
              </div>

              {/* CARD 1: FULL PROJECT SOURCE CODE EXPORT (.zip) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-emerald-500/30 space-y-4 shadow-xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <FolderArchive className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-white flex items-center gap-2">
                        <span>Download Complete Source Code</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">.ZIP ARCHIVE</span>
                      </h5>
                      <p className="text-xs text-slate-400">
                        Exports 100% of website source code with all files, folders, HTML, CSS, JavaScript, React components, Express server, database, configurations, and static assets in a ZIP file.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-2">
                  <span className="font-bold text-slate-200 block text-[11px] uppercase tracking-wider">
                    Included in Source Code Package:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>Frontend (React 19, Vite, Tailwind CSS, TypeScript)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>Full Admin Panel & RBAC Sub-Admin Management</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>Backend APIs (`server.ts`, Express, SSE WebSockets)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>Live Database Snapshot (`server-db.json` All Apps & Panels)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>Public Assets, Icons, Audio Alerts, PWA Manifests</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>Complete Setup & Local Run Guide (`README.md`)</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    <strong>100% Ready-to-Run:</strong> Extract the ZIP, run <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded">npm install</code> followed by <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded">npm run dev</code> to launch locally.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadProject}
                  disabled={isExportingProject}
                  className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-lg shadow-emerald-600/20 ${
                    isExportingProject
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950'
                  }`}
                >
                  {isExportingProject ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Packaging Source Code & Assets into ZIP...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>Download Complete Source Code (.ZIP)</span>
                    </>
                  )}
                </button>
              </div>

              {/* CARD 2: DATABASE BACKUP (.json) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/30 space-y-4 shadow-xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center flex-shrink-0">
                      <HardDrive className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-white flex items-center gap-2">
                        <span>Download Current Database Backup</span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">.JSON SNAPSHOT</span>
                      </h5>
                      <p className="text-xs text-slate-400">
                        Export all live store data, orders, UTR receipts, user accounts, and VIP panel configs.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-slate-200 font-semibold block">Live Database State</span>
                    <span className="text-slate-400 text-[11px]">
                      {orders.length} orders, {users.length} users, {serverPanels.length} VIP panels, {serverFeatures.length} features
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    Live In-Memory + Disk
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  disabled={isExportingBackup}
                  className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-lg shadow-amber-600/20 ${
                    isExportingBackup
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950'
                  }`}
                >
                  {isExportingBackup ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Exporting Database Snapshot...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 stroke-[2.5]" />
                      <span>Download Backup (.json)</span>
                    </>
                  )}
                </button>
              </div>

              {/* CARD 3: RESTORE DATABASE BACKUP */}
              {adminProfile.role === 'owner' && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-indigo-500/30 space-y-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center flex-shrink-0">
                      <RotateCcw className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-white flex items-center gap-2">
                        <span>Restore Website From Backup</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">OWNER ONLY</span>
                      </h5>
                      <p className="text-xs text-slate-400">
                        Upload a previously exported JSON backup to instantly restore settings, apps, orders, and panels.
                      </p>
                    </div>
                  </div>

                  {restoreMessage && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-medium">
                      {restoreMessage}
                    </div>
                  )}

                  <label className="block">
                    <div className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition">
                      <Upload className="w-4 h-4" />
                      <span>{isRestoringBackup ? 'Restoring Database...' : 'Choose Backup .JSON File to Restore'}</span>
                    </div>
                    <input
                      type="file"
                      accept=".json,application/json"
                      disabled={isRestoringBackup}
                      className="hidden"
                      onChange={handleRestoreBackup}
                    />
                  </label>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
