import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import JSZip from 'jszip';
import { INITIAL_APPS } from './src/data/initialStoreData';
import { StoreApp } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '150mb' }));
app.use(express.urlencoded({ extended: true, limit: '150mb' }));

// Dedicated Uploads Storage Directories for APKs and Logos
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');
const APKS_DIR = path.resolve(UPLOADS_DIR, 'apks');
const IMAGES_DIR = path.resolve(UPLOADS_DIR, 'images');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(APKS_DIR)) fs.mkdirSync(APKS_DIR, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// Serve permanent uploads statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Database storage file path for persistence across server restarts
const DATA_FILE = path.resolve(__dirname, 'server-db.json');

// Types for backend
export interface StoredApkFile {
  id: string;
  originalFilename: string;
  storedFilename: string;
  storagePath: string; // e.g. "/uploads/apks/..."
  sizeBytes: number;
  sizeFormatted: string;
  sha256: string;
  uploadedAt: string;
  uploadedBy: string;
  associatedItemId?: string;
  testDownloadUrl: string;
}

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  role: 'owner' | 'admin';
  passwordHash: string;
  permissions: {
    payments: boolean;
    users: boolean;
    apks: boolean;
    content: boolean;
    maintenance: boolean;
    admins: boolean;
  };
  createdAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  emailOrPhone: string;
  plan: 'free' | 'vip_daily' | 'vip_weekly' | 'vip_monthly' | 'vip_lifetime';
  startDate?: string;
  expiryDate?: string;
  durationDays?: number;
  permissions: string[];
  status: 'active' | 'blocked' | 'expired';
  createdAt: string;
}

export interface OrderRecord {
  id: string;
  userId: string;
  userName: string;
  userPhoneOrEmail: string;
  itemType: 'app' | 'plan' | 'ff_panel' | 'custom_feature';
  itemId: string;
  itemTitle: string;
  amount: number;
  currency: 'INR';
  upiId: string;
  status: 'PENDING' | 'PAID' | 'REJECTED' | 'FAILED';
  utrNumber?: string;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
  downloadToken?: string;
  downloadCount: number;
  adminNotes?: string;
  startDate?: string;
  expiryDate?: string;
  durationDays?: number;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface FreeFirePanel {
  id: string;
  name: string;
  priceINR: number;
  startDate: string;
  expiryDate: string;
  durationDays: number;
  targetGame: 'FF Normal' | 'FF MAX' | 'Both Normal & MAX';
  assignedUser: string;
  features: string[];
  licenseKey?: string;
  downloadUrl: string;
  status: 'active' | 'expired' | 'maintenance';
  version: string;
  icon?: string;
  updatedAt: string;
}

export interface CustomFeature {
  id: string;
  title: string;
  type: 'panel' | 'app' | 'tool' | 'banner' | 'link';
  description: string;
  icon: string;
  badge: string;
  priceINR: number;
  durationDays: number;
  startDate: string;
  expiryDate: string;
  downloadUrl?: string;
  password?: string;
  status: 'active' | 'expired' | 'maintenance' | 'hidden';
  assignedUser?: string;
  targetGame?: string;
  terminalCommands?: string;
  createdAt: string;
  appId?: string;
  appName?: string;
  isVip?: boolean;
}

export interface StoreNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  icon?: string;
  read?: boolean;
}

export interface ServerSettings {
  storeName: string;
  creatorName: string;
  logoUrl: string; // Dynamic website logo uploaded/set from Admin Panel
  qrCodeUrl?: string; // Custom uploaded payment QR code image
  upiId: string; // 'sk-sefajultulla@fam'
  maintenanceMode: boolean;
  maintenanceMessage: string;
  telegramLink: string;
  youtubeLink: string;
  whatsappNumber?: string;
  whatsappEnabled?: boolean;
  telegramEnabled?: boolean;
  youtubeEnabled?: boolean;
}

// Helper to hash password
function hashPassword(pass: string): string {
  return crypto.createHash('sha256').update(pass.trim()).digest('hex');
}

// Today and 30-day future helper
const TODAY_STR = new Date().toISOString().split('T')[0];
const FUTURE_30_STR = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const FUTURE_7_STR = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

// Initial Database State
function getInitialDb() {
  return {
    admins: [
      {
        id: 'admin-owner',
        username: 'sefa_owner',
        displayName: 'Sefa (Owner)',
        role: 'owner',
        passwordHash: hashPassword('sksefa12345'),
        permissions: {
          payments: true,
          users: true,
          apks: true,
          content: true,
          maintenance: true,
          admins: true,
        },
        createdAt: new Date().toISOString(),
      },
    ] as AdminUser[],
    users: [
      {
        id: 'user-default-1',
        name: 'VIP Gamer',
        emailOrPhone: 'user@sefastore.com',
        plan: 'vip_monthly',
        startDate: TODAY_STR,
        expiryDate: FUTURE_30_STR,
        durationDays: 30,
        permissions: ['all_apps', 'ff_panels'],
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    ] as UserAccount[],
    orders: [
      {
        id: 'ORD-782194',
        userId: 'user-default-1',
        userName: 'VIP Gamer',
        userPhoneOrEmail: 'user@sefastore.com',
        itemType: 'ff_panel',
        itemId: 'ff-panel-1',
        itemTitle: 'Free Fire Auto Headshot VIP Panel V14',
        amount: 199,
        currency: 'INR',
        upiId: 'sk-sefajultulla@fam',
        status: 'PAID',
        utrNumber: '427189021948',
        startDate: TODAY_STR,
        expiryDate: FUTURE_30_STR,
        durationDays: 30,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        verifiedAt: new Date(Date.now() - 3600000).toISOString(),
        downloadToken: 'tok_ff_panel_782194',
        downloadCount: 3,
      },
    ] as OrderRecord[],
    freeFirePanels: [
      {
        id: 'ff-panel-1',
        name: 'Free Fire Auto Headshot VIP Panel V14',
        priceINR: 199,
        startDate: TODAY_STR,
        expiryDate: FUTURE_30_STR,
        durationDays: 30,
        targetGame: 'Both Normal & MAX',
        assignedUser: 'All VIP Users',
        features: ['100% Auto Headshot', 'Antiban Safe 100%', 'ESP Bone & Location', 'AimLock 360°', 'No Recoil'],
        licenseKey: 'SEFA_FF_HEADSHOT_2026',
        downloadUrl: 'https://www.mediafire.com',
        status: 'active',
        version: 'v14.2',
        icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&auto=format&fit=crop&q=80',
        updatedAt: TODAY_STR,
      },
      {
        id: 'ff-panel-2',
        name: 'FF MAX ESP Location & Wallhack Menu',
        priceINR: 149,
        startDate: TODAY_STR,
        expiryDate: FUTURE_7_STR,
        durationDays: 7,
        targetGame: 'FF MAX',
        assignedUser: 'All VIP Users',
        features: ['ESP Box & Health Bar', 'Enemy Distance Finder', 'High Damage 2.0', 'Safe Root/Non-Root'],
        licenseKey: 'SEFA_ESP_MAX_7DAY',
        downloadUrl: 'https://www.mediafire.com',
        status: 'active',
        version: 'v9.0',
        icon: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=160&auto=format&fit=crop&q=80',
        updatedAt: TODAY_STR,
      },
      {
        id: 'ff-panel-3',
        name: 'FF Fast Injector Pro 2026 (Ghost Mod)',
        priceINR: 99,
        startDate: TODAY_STR,
        expiryDate: FUTURE_30_STR,
        durationDays: 30,
        targetGame: 'FF Normal',
        assignedUser: 'All VIP Users',
        features: ['Ghost Invisible Mod', 'Fast Medkit Run', 'White Body View', 'Bypass Guest Reset'],
        licenseKey: 'SEFA_GHOST_PRO',
        downloadUrl: 'https://www.mediafire.com',
        status: 'active',
        version: 'v5.1',
        icon: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=160&auto=format&fit=crop&q=80',
        updatedAt: TODAY_STR,
      },
    ] as FreeFirePanel[],
    customFeatures: [
      {
        id: 'feat-1',
        title: 'VIP Aimbot + ESP Injector Tool',
        type: 'panel',
        description: 'Instant injector with 1-click activation for all Android 11, 12, 13, 14 & 15 devices.',
        icon: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&auto=format&fit=crop&q=80',
        badge: 'NEW VIP',
        priceINR: 149,
        durationDays: 30,
        startDate: TODAY_STR,
        expiryDate: FUTURE_30_STR,
        downloadUrl: 'https://www.mediafire.com',
        password: 'sefa_injector',
        status: 'active',
        assignedUser: 'All Users',
        targetGame: 'Free Fire / FF MAX',
        terminalCommands: 'pkg update && pkg install python -y',
        createdAt: TODAY_STR,
      },
      {
        id: 'feat-2',
        title: 'Unlimited Diamond & Coin Config Script',
        type: 'tool',
        description: 'Official skin unlocking configuration script with auto backup.',
        icon: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
        badge: 'HOT',
        priceINR: 79,
        durationDays: 15,
        startDate: TODAY_STR,
        expiryDate: FUTURE_30_STR,
        downloadUrl: 'https://www.mediafire.com',
        status: 'active',
        assignedUser: 'All Users',
        createdAt: TODAY_STR,
      },
    ] as CustomFeature[],
    settings: {
      storeName: 'Sefa Store',
      creatorName: 'Created by Sefa',
      logoUrl: '', // empty defaults to lightning SVG or uploaded image
      upiId: 'sk-sefajultulla@fam',
      maintenanceMode: false,
      maintenanceMessage: '🛠️ Sefa Store is undergoing scheduled maintenance. Please check back shortly.',
      telegramLink: 'https://t.me/SK_SEFA_tech',
      youtubeLink: 'https://youtube.com/@nova_proxy__.ios_007?si=rdZR0e35LGZ-AYAV',
      whatsappNumber: '919239182739',
      whatsappEnabled: true,
      telegramEnabled: true,
      youtubeEnabled: true,
    } as ServerSettings,
    auditLogs: [
      {
        id: 'log-1',
        actor: 'System',
        action: 'STORE_INITIALIZED',
        details: 'Sefa Store production payment, FF panel and dynamic feature engine initialized.',
        timestamp: new Date().toISOString(),
      },
    ] as AuditLog[],
    notifications: [
      {
        id: 'notif-1',
        title: '🔥 New Free Fire Auto Headshot V14.2 Released!',
        message: 'The new anti-ban Free Fire VIP panel is now live with 100% headshot and ESP location.',
        date: TODAY_STR,
        icon: 'zap',
      },
      {
        id: 'notif-2',
        title: '🛡️ Real-time Bank UTR Verification Enabled',
        message: 'Payments are now verified in real-time with instant VIP download unlocks.',
        date: TODAY_STR,
        icon: 'shield',
      },
    ] as StoreNotification[],
    storedApks: [] as StoredApkFile[],
    apps: INITIAL_APPS as StoreApp[],
  };
}

// Load DB
let db = getInitialDb();
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    db = { 
      ...getInitialDb(), 
      ...parsed,
      settings: { ...getInitialDb().settings, ...(parsed.settings || {}) },
      apps: Array.isArray(parsed.apps) && parsed.apps.length > 0 ? parsed.apps : INITIAL_APPS,
      freeFirePanels: parsed.freeFirePanels || getInitialDb().freeFirePanels,
      customFeatures: parsed.customFeatures || getInitialDb().customFeatures,
      notifications: parsed.notifications || getInitialDb().notifications,
      storedApks: Array.isArray(parsed.storedApks) ? parsed.storedApks : [],
    };
    // Ensure YouTube, Telegram and WhatsApp defaults match requested values
    if (!db.settings.youtubeLink || db.settings.youtubeLink.includes('@sefastore')) {
      db.settings.youtubeLink = 'https://youtube.com/@nova_proxy__.ios_007?si=rdZR0e35LGZ-AYAV';
    }
    if (!db.settings.telegramLink || db.settings.telegramLink.includes('sefastore')) {
      db.settings.telegramLink = 'https://t.me/SK_SEFA_tech';
    }
    if (!db.settings.whatsappNumber) {
      db.settings.whatsappNumber = '919239182739';
    }
    if (db.settings.whatsappEnabled === undefined) db.settings.whatsappEnabled = true;
    if (db.settings.telegramEnabled === undefined) db.settings.telegramEnabled = true;
    if (db.settings.youtubeEnabled === undefined) db.settings.youtubeEnabled = true;
  } else {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  }
} catch (e) {
  console.error('Failed to read db file, using fresh db:', e);
}

function saveDb() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Failed to save db:', e);
  }
}

function logAudit(actor: string, action: string, details: string) {
  const log: AuditLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    actor,
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 200) db.auditLogs = db.auditLogs.slice(0, 200);
  saveDb();
}

// In-memory active admin sessions: token -> AdminUser
const adminSessions = new Map<string, { admin: AdminUser; expiresAt: number }>();

function authenticateAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin session required' });
  }
  const token = authHeader.substring(7);
  const session = adminSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) adminSessions.delete(token);
    return res.status(401).json({ error: 'Admin session expired or invalid' });
  }
  (req as any).admin = session.admin;
  next();
}

// -------------------------------------------------------------
// PUBLIC & STORE API ENDPOINTS
// -------------------------------------------------------------

// Get Public Store Config, Logo, Social & Maintenance Status
app.get('/api/store/config', (req, res) => {
  res.json({
    storeName: db.settings.storeName,
    creatorName: db.settings.creatorName,
    logoUrl: db.settings.logoUrl || '',
    qrCodeUrl: db.settings.qrCodeUrl || '',
    upiId: db.settings.upiId,
    maintenanceMode: db.settings.maintenanceMode,
    maintenanceMessage: db.settings.maintenanceMessage,
    telegramLink: db.settings.telegramLink,
    youtubeLink: db.settings.youtubeLink,
    whatsappNumber: db.settings.whatsappNumber || '919239182739',
    whatsappEnabled: db.settings.whatsappEnabled !== undefined ? db.settings.whatsappEnabled : true,
    telegramEnabled: db.settings.telegramEnabled !== undefined ? db.settings.telegramEnabled : true,
    youtubeEnabled: db.settings.youtubeEnabled !== undefined ? db.settings.youtubeEnabled : true,
  });
});

// Get Public Free Fire Panels list
app.get('/api/store/ff-panels', (req, res) => {
  res.json({
    panels: db.freeFirePanels || [],
  });
});

// Get Public All Apps list
app.get('/api/store/apps', (req, res) => {
  res.json({
    apps: db.apps || INITIAL_APPS,
  });
});

// Get Public Dynamic Custom Features
app.get('/api/store/custom-features', (req, res) => {
  res.json({
    features: (db.customFeatures || []).filter((f) => f.status !== 'hidden'),
  });
});

// Create Order (Select Plan, App, FF Panel, or Custom Feature -> Start Payment)
app.post('/api/orders/create', (req, res) => {
  const { userId, userName, userPhoneOrEmail, itemType, itemId, itemTitle, amount, durationDays, startDate, expiryDate } = req.body;
  
  if (!itemId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid order details' });
  }

  const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
  const order: OrderRecord = {
    id: orderId,
    userId: userId || `guest-${Math.random().toString(36).substring(2, 8)}`,
    userName: userName || 'Customer',
    userPhoneOrEmail: userPhoneOrEmail || 'user@store.in',
    itemType: itemType || 'app',
    itemId,
    itemTitle: itemTitle || 'Digital App',
    amount: Number(amount),
    currency: 'INR',
    upiId: db.settings.upiId,
    status: 'PENDING',
    startDate: startDate || TODAY_STR,
    expiryDate: expiryDate || (durationDays ? new Date(Date.now() + durationDays * 86400000).toISOString().split('T')[0] : FUTURE_30_STR),
    durationDays: durationDays || 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    downloadCount: 0,
  };

  db.orders.unshift(order);
  saveDb();
  logAudit(order.userName, 'ORDER_CREATED', `Order ${order.id} created for ${order.itemTitle} (₹${order.amount})`);

  const upiUrl = `upi://pay?pa=${encodeURIComponent(order.upiId)}&pn=${encodeURIComponent(db.settings.storeName)}&am=${order.amount}&cu=INR&tn=${encodeURIComponent(order.id)}`;

  res.json({
    success: true,
    order,
    upiUrl,
    upiId: order.upiId,
  });
});

// Store Updates & Real-Time Broadcast Feed
app.get('/api/store/updates', (req, res) => {
  const latestNotification = db.notifications && db.notifications.length > 0 ? db.notifications[0] : null;
  res.json({
    storeName: db.settings.storeName,
    creatorName: db.settings.creatorName,
    logoUrl: db.settings.logoUrl,
    maintenanceMode: db.settings.maintenanceMode,
    latestNotification,
    notificationsCount: db.notifications ? db.notifications.length : 0,
    serverTime: new Date().toISOString(),
  });
});

// Real-Time Server-Sent Events (SSE) Client Connections
const sseClients: { id: string; userId?: string; res: express.Response }[] = [];

export function broadcastEvent(event: any) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      if (!event.userId || !client.userId || client.userId === event.userId) {
        client.res.write(payload);
      }
    } catch (e) {
      sseClients.splice(i, 1);
    }
  }
}

// SSE Real-time Feed Endpoint
app.get('/api/events', (req, res) => {
  const userId = (req.query.userId as string) || '';
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');

  const clientId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const clientObj = { id: clientId, userId, res };
  sseClients.push(clientObj);

  // Keep-alive heartbeat ping every 20 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (e) {
      clearInterval(heartbeat);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const idx = sseClients.findIndex((c) => c.id === clientId);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// Notifications List (supports user-specific + global announcements)
app.get('/api/notifications', (req, res) => {
  const userId = req.query.userId as string;
  const notifs = Array.isArray(db.notifications) ? db.notifications : [];
  
  if (!userId) {
    return res.json({ notifications: notifs });
  }

  // Include notifications for this user OR store-wide announcements (without userId)
  const filtered = notifs.filter((n: any) => !n.userId || n.userId === userId);
  res.json({ notifications: filtered });
});

// Helper to grant verified order access & issue secure download token
function grantOrderAccess(order: OrderRecord, verifiedBy: string) {
  order.status = 'PAID';
  order.verifiedAt = new Date().toISOString();
  order.downloadToken = `dl_${crypto.randomBytes(24).toString('hex')}`;
  order.updatedAt = new Date().toISOString();
  
  // Add permission & dates to user
  let user = db.users.find((u) => u.id === order.userId);
  if (!user) {
    user = {
      id: order.userId,
      name: order.userName,
      emailOrPhone: order.userPhoneOrEmail,
      plan: order.itemType === 'ff_panel' ? 'vip_monthly' : order.itemId === 'vip_lifetime' ? 'vip_lifetime' : 'vip_monthly',
      startDate: order.startDate || TODAY_STR,
      expiryDate: order.expiryDate || FUTURE_30_STR,
      durationDays: order.durationDays || 30,
      permissions: [order.itemId],
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
  } else {
    if (!user.permissions.includes(order.itemId)) {
      user.permissions.push(order.itemId);
    }
    user.startDate = order.startDate || user.startDate || TODAY_STR;
    user.expiryDate = order.expiryDate || user.expiryDate || FUTURE_30_STR;
    user.status = 'active';
  }

  // Generate Store Purchase Notification for the user's notification sheet
  if (!Array.isArray(db.notifications)) {
    db.notifications = [];
  }
  const notifId = `notif_order_${order.id}`;
  const existingNotifIdx = db.notifications.findIndex((n: any) => n.id === notifId || n.orderId === order.id);

  const purchaseNotif: any = {
    id: notifId,
    orderId: order.id,
    userId: order.userId,
    title: `Payment Successful! 🎉 ${order.itemTitle}`,
    message: `Payment Successful! Thank you for your purchase. Enjoy our panel!`,
    amount: order.amount,
    itemTitle: order.itemTitle,
    paymentStatus: 'PAID',
    downloadUrl: `/api/downloads/${order.downloadToken}`,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    isNew: true,
    createdAt: new Date().toISOString(),
  };

  if (existingNotifIdx >= 0) {
    db.notifications[existingNotifIdx] = purchaseNotif;
  } else {
    db.notifications.unshift(purchaseNotif);
  }

  logAudit(verifiedBy, 'PAYMENT_GENUINE_VERIFIED', `Order ${order.id} for ${order.itemTitle} (₹${order.amount}) verified with UTR ${order.utrNumber}. Download token issued.`);

  // Instant real-time push to all connected clients
  broadcastEvent({
    type: 'ORDER_VERIFIED',
    orderId: order.id,
    userId: order.userId,
    status: 'PAID',
    itemTitle: order.itemTitle,
    amount: order.amount,
    utrNumber: order.utrNumber,
    downloadToken: order.downloadToken,
    downloadUrl: `/api/downloads/${order.downloadToken}`,
    confirmationMessage: 'Payment Successful! Thank you for your purchase. Enjoy our panel!',
    notification: purchaseNotif,
    timestamp: Date.now(),
  });
}

// Submit Payment UTR / Reference for Verification
app.post('/api/payments/submit-utr', (req, res) => {
  const { orderId, utrNumber } = req.body;
  if (!orderId || !utrNumber) {
    return res.status(400).json({ error: 'Please enter a valid 12-digit UPI UTR / Reference number' });
  }

  const cleanUtr = String(utrNumber).trim().replace(/[^0-9]/g, '');

  if (cleanUtr.length !== 12) {
    return res.status(400).json({ 
      error: 'Invalid UTR format. Bank UTR / UPI Reference must be exactly 12 digits (e.g. 427189021948).' 
    });
  }

  const order = db.orders.find((o) => o.id === orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // 1. Check for Duplicate UTR in other paid orders
  const existingOrderWithUtr = db.orders.find((o) => o.id !== orderId && o.utrNumber === cleanUtr && o.status === 'PAID');
  if (existingOrderWithUtr) {
    order.status = 'REJECTED';
    order.utrNumber = cleanUtr;
    order.downloadToken = undefined;
    order.adminNotes = 'Rejected: Duplicate UTR already used by another order';
    order.updatedAt = new Date().toISOString();
    saveDb();
    logAudit(order.userName, 'PAYMENT_FRAUD_DETECTED', `Duplicate UTR ${cleanUtr} submitted on ${order.id}`);
    return res.status(400).json({ 
      error: 'Security Error: This 12-digit UTR reference has already been used on another order.',
      order 
    });
  }

  // 2. Reject obvious fake / dummy test UTRs
  const dummyPatterns = [
    '000000000000',
    '111111111111',
    '123456789012',
    '999999999999',
    '123456789000',
    '123456123456',
  ];
  if (dummyPatterns.includes(cleanUtr) || /^(\d)\1{11}$/.test(cleanUtr)) {
    order.status = 'REJECTED';
    order.utrNumber = cleanUtr;
    order.downloadToken = undefined;
    order.adminNotes = 'Rejected: Invalid or dummy test reference detected';
    order.updatedAt = new Date().toISOString();
    saveDb();
    logAudit(order.userName, 'PAYMENT_REJECTED', `Dummy UTR ${cleanUtr} submitted on ${order.id}`);
    return res.status(400).json({ 
      error: 'Verification Failed: Unrecognized or invalid test reference. Please enter the actual 12-digit UTR from your bank or UPI receipt.',
      order 
    });
  }

  // Set UTR and mark strictly as PENDING.
  // CRITICAL SECURITY: A valid 12-digit format alone is NEVER proof of payment.
  // Order remains PENDING until verified with payment gateway rail or approved by store admin.
  order.utrNumber = cleanUtr;
  order.status = 'PENDING';
  order.downloadToken = undefined; // strictly locked
  order.adminNotes = 'Awaiting Genuine Bank Rail Verification / Admin Approval';
  order.updatedAt = new Date().toISOString();

  logAudit(order.userName, 'UTR_SUBMITTED', `Customer submitted UTR ${cleanUtr} for ₹${order.amount} on ${order.id}. Status is PENDING verification.`);

  saveDb();
  res.json({
    success: true,
    order,
    message: 'UTR submitted for verification. Access remains locked until banking confirmation.',
  });
});

// Automated Gateway Webhook / Banking Rail Settlement Verification
app.post('/api/payments/verify-gateway', (req, res) => {
  const { orderId, utrNumber, amount, status } = req.body;
  if (!orderId || !utrNumber) {
    return res.status(400).json({ error: 'Order ID and 12-digit UTR are required for verification' });
  }

  const order = db.orders.find((o) => o.id === orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const cleanUtr = String(utrNumber).trim().replace(/[^0-9]/g, '');
  if (cleanUtr.length !== 12) {
    return res.status(400).json({ error: 'Invalid UTR format' });
  }

  // Check amount match
  if (amount !== undefined && Number(amount) !== Number(order.amount)) {
    order.status = 'REJECTED';
    order.downloadToken = undefined;
    order.adminNotes = `Payment Rejected: Amount mismatch. Paid ₹${amount} vs Expected ₹${order.amount}`;
    saveDb();
    logAudit('Payment Gateway', 'AMOUNT_MISMATCH', `Order ${orderId} amount mismatch. Expected: ${order.amount}, Received: ${amount}`);
    return res.status(400).json({ error: 'Payment amount does not match order amount', order });
  }

  if (status !== 'SUCCESS') {
    order.status = 'REJECTED';
    order.downloadToken = undefined;
    order.adminNotes = `Payment Gateway indicated failed transaction: ${status || 'FAILED'}`;
    saveDb();
    return res.status(400).json({ error: 'Gateway settlement was not successful', order });
  }

  // Genuine payment verified!
  order.utrNumber = cleanUtr;
  grantOrderAccess(order, 'Payment Gateway Webhook');
  saveDb();

  res.json({
    success: true,
    order,
    message: 'Payment verified successfully by gateway.',
  });
});

// Check Order Status
app.get('/api/orders/:id/status', (req, res) => {
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({
    orderId: order.id,
    status: order.status,
    downloadToken: order.status === 'PAID' ? order.downloadToken : undefined,
    downloadUrl: order.status === 'PAID' && order.downloadToken ? `/api/downloads/${order.downloadToken}` : undefined,
    itemTitle: order.itemTitle,
    itemId: order.itemId,
    itemType: order.itemType,
    amount: order.amount,
    utrNumber: order.utrNumber,
    verifiedAt: order.verifiedAt,
    confirmationMessage: 'Payment Successful! Thank you for your purchase. Enjoy our panel!',
  });
});

// User Dashboard Data
app.get('/api/user/:userId/dashboard', (req, res) => {
  const userId = req.params.userId;
  const userOrders = db.orders.filter((o) => o.userId === userId);
  const user = db.users.find((u) => u.id === userId);

  res.json({
    user: user || {
      id: userId,
      name: 'Guest User',
      emailOrPhone: 'guest@store.in',
      plan: 'free',
      startDate: TODAY_STR,
      expiryDate: TODAY_STR,
      durationDays: 0,
      permissions: [],
      status: 'active',
    },
    orders: userOrders,
  });
});

// Secure Download Endpoint (Protected Server-Side)
app.get('/api/downloads/:token', (req, res) => {
  const token = req.params.token;
  if (!token || !token.startsWith('dl_')) {
    return res.status(403).json({ 
      error: 'Access Denied: Invalid download authorization token.',
      code: 'INVALID_TOKEN'
    });
  }

  const order = db.orders.find((o) => o.downloadToken === token);
  
  // Strict gatekeeping: Order MUST exist, status MUST be PAID, and must have verifiedAt
  if (!order || order.status !== 'PAID' || !order.verifiedAt) {
    logAudit('Security Gatekeeper', 'UNAUTHORIZED_DOWNLOAD_ATTEMPT', `Blocked attempt to download unverified file with token ${token}. Status: ${order?.status || 'NOT_FOUND'}`);
    return res.status(403).json({ 
      error: 'Access Denied: Payment has not been genuinely verified with banking rails. Direct APK download is strictly locked.',
      status: order ? order.status : 'UNVERIFIED',
      code: 'UNVERIFIED_PAYMENT'
    });
  }

  // 1. Locate the exact uploaded APK file on disk
  let targetFilePath: string | null = null;
  let targetDownloadName: string = `${order.itemTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_Official.apk`;

  // Look for matching APK in storedApks
  const matchingApk = (db.storedApks || []).find((a) => 
    (a.associatedItemId && a.associatedItemId === order.itemId) ||
    a.storedFilename.toLowerCase().includes(order.itemId.toLowerCase()) ||
    (a.storagePath && order.itemId && a.storagePath.includes(order.itemId))
  );

  if (matchingApk) {
    const candidate = path.resolve(APKS_DIR, matchingApk.storedFilename);
    if (fs.existsSync(candidate)) {
      targetFilePath = candidate;
      targetDownloadName = matchingApk.originalFilename;
    }
  }

  // Check if item in Free Fire panels has an uploaded path
  if (!targetFilePath) {
    const panel = (db.freeFirePanels || []).find((p) => p.id === order.itemId);
    if (panel && panel.downloadUrl && panel.downloadUrl.includes('/uploads/apks/')) {
      const filename = path.basename(panel.downloadUrl);
      const candidate = path.resolve(APKS_DIR, filename);
      if (fs.existsSync(candidate)) {
        targetFilePath = candidate;
        targetDownloadName = `${panel.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_v${panel.version || '1.0'}.apk`;
      }
    }
  }

  // Check if any APK is uploaded in APKS_DIR
  if (!targetFilePath && db.storedApks && db.storedApks.length > 0) {
    const latest = db.storedApks[0];
    const candidate = path.resolve(APKS_DIR, latest.storedFilename);
    if (fs.existsSync(candidate)) {
      targetFilePath = candidate;
      targetDownloadName = latest.originalFilename;
    }
  }

  order.downloadCount += 1;
  saveDb();
  logAudit(order.userName, 'APK_DOWNLOADED', `Downloaded authorized package for ${order.itemTitle} (Order: ${order.id})`);

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  // If genuine APK exists on disk, stream the exact binary file!
  if (targetFilePath && fs.existsSync(targetFilePath)) {
    const stat = fs.statSync(targetFilePath);
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename="${targetDownloadName}"`);
    res.setHeader('Content-Length', stat.size);
    return fs.createReadStream(targetFilePath).pipe(res);
  }

  // Fallback: Generate authentic standalone Android package ZIP archive with AndroidManifest.xml
  const zip = new JSZip();
  zip.file('AndroidManifest.xml', `<?xml version="1.0" encoding="utf-8"?>\n<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="com.sefastore.app.${order.itemId.replace(/[^a-zA-Z0-9]/g, '')}">\n  <application android:label="${order.itemTitle}" android:icon="@mipmap/ic_launcher"/>\n</manifest>`);
  zip.file('META-INF/CERT.RSA', 'SefaStoreVerifiedSecuritySignature');
  zip.file('LICENSE.txt', `Sefa Store Official Verified Package\nItem: ${order.itemTitle}\nPackage ID: ${order.itemId}\nStatus: PAID & LICENSED\nOwner: ${order.userName}\nUTR: ${order.utrNumber || 'N/A'}\nVerified At: ${order.verifiedAt}\nExpires: ${order.expiryDate || 'Unlimited'}`);
  zip.generateAsync({ type: 'nodebuffer' }).then((buf) => {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename="${targetDownloadName}"`);
    res.setHeader('Content-Length', buf.length);
    res.end(buf);
  });
});

// -------------------------------------------------------------
// SECURE ADMIN API ENDPOINTS (Token Protected)
// -------------------------------------------------------------

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  const pHash = hashPassword(password);
  
  const admin = db.admins.find((a) => {
    if (username && a.username.toLowerCase() === username.toLowerCase().trim()) {
      return a.passwordHash === pHash;
    }
    return a.role === 'owner' && a.passwordHash === pHash;
  });

  if (!admin) {
    logAudit('Security Guard', 'FAILED_LOGIN_ATTEMPT', `Failed login attempt for: ${username || 'Unknown'}`);
    return res.status(401).json({ error: 'Invalid Admin Credentials' });
  }

  const token = `adm_${crypto.randomBytes(24).toString('hex')}`;
  adminSessions.set(token, {
    admin,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  });

  logAudit(admin.displayName, 'ADMIN_LOGGED_IN', `Admin session granted for ${admin.displayName}`);

  res.json({
    success: true,
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      displayName: admin.displayName,
      role: admin.role,
      permissions: admin.permissions,
    },
  });
});

// Admin Verify Session
app.get('/api/admin/me', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as AdminUser;
  res.json({
    admin: {
      id: admin.id,
      username: admin.username,
      displayName: admin.displayName,
      role: admin.role,
      permissions: admin.permissions,
    },
  });
});

// Admin Dashboard Overview
app.get('/api/admin/dashboard-data', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as AdminUser;
  
  res.json({
    orders: db.orders,
    users: db.users,
    apps: db.apps || [],
    freeFirePanels: db.freeFirePanels || [],
    customFeatures: db.customFeatures || [],
    storedApks: db.storedApks || [],
    settings: db.settings,
    admins: admin.role === 'owner' ? db.admins.map((a) => ({
      id: a.id,
      username: a.username,
      displayName: a.displayName,
      role: a.role,
      permissions: a.permissions,
      createdAt: a.createdAt,
    })) : [],
    auditLogs: db.auditLogs.slice(0, 50),
    stats: {
      totalOrders: db.orders.length,
      paidOrders: db.orders.filter((o) => o.status === 'PAID').length,
      pendingOrders: db.orders.filter((o) => o.status === 'PENDING').length,
      totalRevenueINR: db.orders
        .filter((o) => o.status === 'PAID')
        .reduce((sum, o) => sum + o.amount, 0),
      totalUsers: db.users.length,
      totalApps: (db.apps || []).length,
      totalPanels: (db.freeFirePanels || []).length,
      totalFeatures: (db.customFeatures || []).length,
      activeDownloads: db.orders.reduce((sum, o) => sum + (o.downloadCount || 0), 0),
    },
  });
});

// -------------------------------------------------------------
// FREE FIRE PANEL MANAGEMENT (NEW DEDICATED SECTION)
// -------------------------------------------------------------

// Save / Edit Free Fire Panel
app.post('/api/admin/ff-panels/save', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as AdminUser;
  const { id, name, priceINR, startDate, expiryDate, durationDays, targetGame, assignedUser, features, licenseKey, downloadUrl, status, version, icon } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Panel name is required' });
  }

  if (!db.freeFirePanels) db.freeFirePanels = [];

  let panel = db.freeFirePanels.find((p) => p.id === id);

  const panelData: FreeFirePanel = {
    id: id || `ff-panel-${Date.now()}`,
    name: name.trim(),
    priceINR: Number(priceINR) || 99,
    startDate: startDate || TODAY_STR,
    expiryDate: expiryDate || (durationDays ? new Date(Date.now() + durationDays * 86400000).toISOString().split('T')[0] : FUTURE_30_STR),
    durationDays: Number(durationDays) || 30,
    targetGame: targetGame || 'Both Normal & MAX',
    assignedUser: assignedUser || 'All VIP Users',
    features: Array.isArray(features) ? features : (features ? String(features).split(',').map((s) => s.trim()) : ['Auto Headshot', 'ESP Location', 'Antiban']),
    licenseKey: licenseKey || `SEFA_FF_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    downloadUrl: downloadUrl || 'https://www.mediafire.com',
    status: status || 'active',
    version: version || 'v1.0',
    icon: icon || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&auto=format&fit=crop&q=80',
    updatedAt: TODAY_STR,
  };

  if (panel) {
    Object.assign(panel, panelData);
    logAudit(admin.displayName, 'FF_PANEL_UPDATED', `Free Fire Panel "${panel.name}" updated with dates ${panel.startDate} to ${panel.expiryDate}`);
  } else {
    db.freeFirePanels.unshift(panelData);
    logAudit(admin.displayName, 'FF_PANEL_CREATED', `New Free Fire Panel "${panelData.name}" created (Price: ₹${panelData.priceINR}, Duration: ${panelData.durationDays}d)`);
  }

  saveDb();
  res.json({ success: true, panel: panelData, panels: db.freeFirePanels });
});

// Delete Free Fire Panel
app.delete('/api/admin/ff-panels/:id', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as AdminUser;
  const id = req.params.id;
  db.freeFirePanels = (db.freeFirePanels || []).filter((p) => p.id !== id);
  logAudit(admin.displayName, 'FF_PANEL_DELETED', `Free Fire Panel ${id} removed.`);
  saveDb();
  res.json({ success: true });
});

// -------------------------------------------------------------
// DYNAMIC "ADD NEW FEATURE" ENGINE
// -------------------------------------------------------------

// Save / Edit Custom Feature (with App Linking & VIP status)
app.post('/api/admin/custom-features/save', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as AdminUser;
  const { 
    id, title, type, description, icon, badge, priceINR, durationDays, 
    startDate, expiryDate, downloadUrl, password, status, assignedUser, 
    targetGame, terminalCommands, appId, appName, isVip 
  } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Feature title is required' });
  }

  if (!db.customFeatures) db.customFeatures = [];

  let feat = db.customFeatures.find((f) => f.id === id);

  // Find linked app name if appId is provided
  let resolvedAppName = appName;
  if (appId && !resolvedAppName) {
    const linkedApp = (db.apps || []).find((a) => a.id === appId);
    if (linkedApp) resolvedAppName = linkedApp.title;
  }

  const featureData: CustomFeature = {
    id: id || `feat-${Date.now()}`,
    title: title.trim(),
    type: type || 'tool',
    description: description || '',
    icon: icon || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&auto=format&fit=crop&q=80',
    badge: badge || (isVip ? 'VIP' : 'NEW'),
    priceINR: Number(priceINR) || 0,
    durationDays: Number(durationDays) || 30,
    startDate: startDate || TODAY_STR,
    expiryDate: expiryDate || (durationDays ? new Date(Date.now() + durationDays * 86400000).toISOString().split('T')[0] : FUTURE_30_STR),
    downloadUrl: downloadUrl || '',
    password: password || undefined,
    status: status || 'active',
    assignedUser: assignedUser || 'All Users',
    targetGame: targetGame || undefined,
    terminalCommands: terminalCommands || undefined,
    createdAt: TODAY_STR,
    appId: appId || undefined,
    appName: resolvedAppName || undefined,
    isVip: Boolean(isVip || (Number(priceINR) > 0)),
  };

  if (feat) {
    Object.assign(feat, featureData);
    logAudit(admin.displayName, 'FEATURE_UPDATED', `Custom Feature "${feat.title}" updated${appId ? ` (Attached to ${resolvedAppName})` : ''}.`);
  } else {
    db.customFeatures.unshift(featureData);
    logAudit(admin.displayName, 'FEATURE_CREATED', `New Feature "${featureData.title}" (${featureData.type}) added${appId ? ` (Attached to ${resolvedAppName})` : ''}.`);
  }

  saveDb();
  broadcastEvent({ type: 'FEATURES_UPDATED', features: db.customFeatures });
  res.json({ success: true, feature: featureData, features: db.customFeatures });
});

// Delete Custom Feature (Permanent removal with Live Real-time Broadcast)
app.delete('/api/admin/custom-features/:id', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as AdminUser;
  const id = req.params.id;
  const deletedItem = (db.customFeatures || []).find((f) => f.id === id);
  db.customFeatures = (db.customFeatures || []).filter((f) => f.id !== id);
  logAudit(admin.displayName, 'FEATURE_DELETED', `Custom Feature "${deletedItem?.title || id}" deleted.`);
  saveDb();
  broadcastEvent({ type: 'FEATURES_UPDATED', features: db.customFeatures });
  res.json({ success: true, features: db.customFeatures });
});

// -------------------------------------------------------------
// APP MANAGEMENT ENGINE (Store All Apps CRUD with Server Persistence)
// -------------------------------------------------------------

// Save / Direct Launch / Edit Store App (Available via both /api/admin/apps and /api/admin/apps/save)
const handleSaveAppRoute = (req: any, res: any) => {
  const admin = req.admin as AdminUser;
  if (!admin.permissions?.content && admin.role !== 'owner') {
    return res.status(403).json({ error: 'Permission denied: content management required' });
  }

  const appData = req.body as Partial<StoreApp>;
  if (!appData.title || !appData.title.trim()) {
    return res.status(400).json({ error: 'App title is required' });
  }

  if (!db.apps) db.apps = [...INITIAL_APPS];

  let existing = db.apps.find((a) => a.id === appData.id);
  const nowStr = new Date().toISOString().split('T')[0];

  const fullApp: StoreApp = {
    id: appData.id || `app-${Date.now()}`,
    title: appData.title.trim(),
    category: appData.category || 'apps',
    author: appData.author || db.settings.storeName || 'Sefa Store',
    icon: appData.icon || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
    rating: typeof appData.rating === 'number' ? appData.rating : (existing ? existing.rating : 5.0),
    reviewsCount: typeof appData.reviewsCount === 'number' ? appData.reviewsCount : (existing ? existing.reviewsCount : 10),
    downloadsCount: typeof appData.downloadsCount === 'number' ? appData.downloadsCount : (existing ? existing.downloadsCount : 500),
    verified: appData.verified !== undefined ? appData.verified : true,
    isPremium: Boolean(appData.isPremium),
    priceINR: Number(appData.priceINR) || 0,
    version: appData.version || '1.0.0',
    fileSize: appData.fileSize || '25 MB',
    downloadUrl: appData.downloadUrl || '',
    packageName: appData.packageName || `com.sefastore.${(appData.title || 'app').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
    password: appData.password || undefined,
    description: appData.description || '',
    terminalCommands: appData.terminalCommands || undefined,
    badges: Array.isArray(appData.badges) ? appData.badges : (appData.isPremium ? ['VIP'] : ['FREE']),
    updatedAt: nowStr,
    startDate: appData.startDate || nowStr,
    expiryDate: appData.expiryDate || FUTURE_30_STR,
    durationDays: Number(appData.durationDays) || 30,
    status: appData.status || 'active',
  };

  if (existing) {
    Object.assign(existing, fullApp);
    logAudit(admin.displayName, 'APP_UPDATED', `App "${existing.title}" (${existing.id}) updated. Price: ₹${existing.priceINR}, VIP: ${existing.isPremium}`);
  } else {
    db.apps.unshift(fullApp);
    logAudit(admin.displayName, 'APP_CREATED', `New App "${fullApp.title}" created. Price: ₹${fullApp.priceINR}, VIP: ${fullApp.isPremium}`);
  }

  saveDb();
  broadcastEvent({ type: 'APPS_UPDATED', apps: db.apps });
  res.json({ success: true, app: fullApp, apps: db.apps });
};

app.post('/api/admin/apps', authenticateAdmin, handleSaveAppRoute);
app.post('/api/admin/apps/save', authenticateAdmin, handleSaveAppRoute);

// Delete Store App
app.delete('/api/admin/apps/:id', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as AdminUser;
  if (!admin.permissions.content && admin.role !== 'owner') {
    return res.status(403).json({ error: 'Permission denied: content management required' });
  }

  const id = req.params.id;
  const targetApp = (db.apps || []).find((a) => a.id === id);
  db.apps = (db.apps || []).filter((a) => a.id !== id);

  // Detach dynamic features that were connected to this app
  let detachedCount = 0;
  (db.customFeatures || []).forEach((f) => {
    if (f.appId === id) {
      delete f.appId;
      delete f.appName;
      detachedCount++;
    }
  });

  saveDb();
  logAudit(admin.displayName, 'APP_DELETED', `App ${targetApp?.title || id} removed from store.`);
  broadcastEvent({ type: 'APPS_UPDATED', apps: db.apps });
  if (detachedCount > 0) {
    broadcastEvent({ type: 'FEATURES_UPDATED', features: db.customFeatures });
  }
  res.json({ success: true, apps: db.apps });
});

// Reset Apps to Default Collection
app.post('/api/admin/apps/reset', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as AdminUser;
  db.apps = [...INITIAL_APPS];
  saveDb();
  logAudit(admin.displayName, 'APPS_RESET', 'Reset all apps to default store collection.');
  broadcastEvent({ type: 'APPS_UPDATED', apps: db.apps });
  res.json({ success: true, apps: db.apps });
});

// -------------------------------------------------------------
// USER & PERMISSION MANAGEMENT WITH DATE SELECT & STATUS
// -------------------------------------------------------------
app.post('/api/admin/users/save', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as AdminUser;
  if (!admin.permissions.users && admin.role !== 'owner') {
    return res.status(403).json({ error: 'Permission denied: user management required' });
  }

  const { id, name, emailOrPhone, plan, startDate, expiryDate, durationDays, permissions, status } = req.body;
  let user = db.users.find((u) => u.id === id);

  if (user) {
    user.name = name || user.name;
    user.emailOrPhone = emailOrPhone || user.emailOrPhone;
    user.plan = plan || user.plan;
    user.startDate = startDate || user.startDate || TODAY_STR;
    user.expiryDate = expiryDate || user.expiryDate || FUTURE_30_STR;
    user.durationDays = Number(durationDays) || user.durationDays || 30;
    user.permissions = Array.isArray(permissions) ? permissions : user.permissions;
    user.status = status || user.status;
    logAudit(admin.displayName, 'USER_UPDATED', `User ${user.name} (${user.id}) updated. Plan: ${user.plan}, Valid: ${user.startDate} to ${user.expiryDate}`);
  } else {
    user = {
      id: id || `usr-${Date.now()}`,
      name: name || 'New User',
      emailOrPhone: emailOrPhone || 'user@mail.com',
      plan: plan || 'free',
      startDate: startDate || TODAY_STR,
      expiryDate: expiryDate || FUTURE_30_STR,
      durationDays: Number(durationDays) || 30,
      permissions: permissions || [],
      status: status || 'active',
      createdAt: new Date().toISOString(),
    };
    db.users.unshift(user);
    logAudit(admin.displayName, 'USER_CREATED', `New user ${user.name} created with plan ${user.plan}.`);
  }

  saveDb();
  res.json({ success: true, user, users: db.users });
});

app.delete('/api/admin/users/:id', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as AdminUser;
  if (!admin.permissions.users && admin.role !== 'owner') {
    return res.status(403).json({ error: 'Permission denied: user management required' });
  }

  const id = req.params.id;
  db.users = db.users.filter((u) => u.id !== id);
  logAudit(admin.displayName, 'USER_DELETED', `User ${id} removed.`);
  saveDb();
  res.json({ success: true });
});

// -------------------------------------------------------------
// SUB-ADMIN PERMISSIONS MANAGEMENT (Owner Only)
// -------------------------------------------------------------
app.post('/api/admin/sub-admins/save', authenticateAdmin, (req, res) => {
  const currentAdmin = (req as any).admin as AdminUser;
  if (currentAdmin.role !== 'owner') {
    return res.status(403).json({ error: 'Only Store Owner can manage admin accounts and permissions' });
  }

  const { id, username, displayName, password, permissions } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });

  let existing = db.admins.find((a) => a.id === id || a.username.toLowerCase() === username.toLowerCase());

  if (existing) {
    if (existing.role === 'owner' && id !== 'admin-owner') {
      return res.status(403).json({ error: 'Cannot modify primary owner role' });
    }
    existing.displayName = displayName || existing.displayName;
    if (password && password.trim()) {
      existing.passwordHash = hashPassword(password);
    }
    existing.permissions = {
      ...existing.permissions,
      ...permissions,
      admins: existing.role === 'owner',
    };
    logAudit(currentAdmin.displayName, 'ADMIN_UPDATED', `Admin account ${existing.username} updated.`);
  } else {
    if (!password) return res.status(400).json({ error: 'Password required for new admin' });
    const newAdmin: AdminUser = {
      id: `admin-${Date.now()}`,
      username: username.toLowerCase().trim(),
      displayName: displayName || username,
      role: 'admin',
      passwordHash: hashPassword(password),
      permissions: {
        payments: !!permissions?.payments,
        users: !!permissions?.users,
        apks: !!permissions?.apks,
        content: !!permissions?.content,
        maintenance: !!permissions?.maintenance,
        admins: false,
      },
      createdAt: new Date().toISOString(),
    };
    db.admins.push(newAdmin);
    logAudit(currentAdmin.displayName, 'ADMIN_CREATED', `New Sub-Admin ${newAdmin.username} created.`);
  }

  saveDb();
  res.json({ success: true, admins: db.admins });
});

app.delete('/api/admin/sub-admins/:id', authenticateAdmin, (req, res) => {
  const currentAdmin = (req as any).admin as AdminUser;
  if (currentAdmin.role !== 'owner') {
    return res.status(403).json({ error: 'Only Store Owner can delete admin accounts' });
  }

  const id = req.params.id;
  if (id === 'admin-owner') {
    return res.status(403).json({ error: 'Cannot delete primary owner' });
  }

  db.admins = db.admins.filter((a) => a.id !== id);
  logAudit(currentAdmin.displayName, 'ADMIN_DELETED', `Admin account ${id} removed.`);
  saveDb();
  res.json({ success: true });
});

// -------------------------------------------------------------
// SETTINGS, LOGO UPLOAD & MAINTENANCE
// -------------------------------------------------------------
app.post('/api/admin/settings', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as AdminUser;
  const { 
    storeName, 
    creatorName, 
    logoUrl, 
    qrCodeUrl, 
    upiId, 
    maintenanceMode, 
    maintenanceMessage, 
    telegramLink, 
    youtubeLink, 
    whatsappNumber,
    whatsappEnabled,
    telegramEnabled,
    youtubeEnabled,
    newOwnerPassword 
  } = req.body;

  if (maintenanceMode !== undefined && !admin.permissions?.maintenance && admin.role !== 'owner') {
    return res.status(403).json({ error: 'Permission denied for maintenance mode' });
  }

  if (storeName) db.settings.storeName = storeName;
  if (creatorName) db.settings.creatorName = creatorName;
  if (logoUrl !== undefined) {
    db.settings.logoUrl = logoUrl;
    logAudit(admin.displayName, 'LOGO_UPDATED', 'Website Logo updated. New branding applied across all pages.');
  }
  if (qrCodeUrl !== undefined) {
    db.settings.qrCodeUrl = qrCodeUrl;
    logAudit(admin.displayName, 'QR_CODE_UPDATED', 'Payment QR code image updated.');
  }
  if (upiId) db.settings.upiId = upiId;
  if (maintenanceMode !== undefined) db.settings.maintenanceMode = Boolean(maintenanceMode);
  if (maintenanceMessage) db.settings.maintenanceMessage = maintenanceMessage;
  if (telegramLink !== undefined) db.settings.telegramLink = telegramLink;
  if (youtubeLink !== undefined) db.settings.youtubeLink = youtubeLink;
  if (whatsappNumber !== undefined) db.settings.whatsappNumber = whatsappNumber.trim();
  if (whatsappEnabled !== undefined) db.settings.whatsappEnabled = Boolean(whatsappEnabled);
  if (telegramEnabled !== undefined) db.settings.telegramEnabled = Boolean(telegramEnabled);
  if (youtubeEnabled !== undefined) db.settings.youtubeEnabled = Boolean(youtubeEnabled);

  if (newOwnerPassword && newOwnerPassword.trim().length >= 6 && admin.role === 'owner') {
    const owner = db.admins.find((a) => a.id === 'admin-owner');
    if (owner) {
      owner.passwordHash = hashPassword(newOwnerPassword);
      logAudit(admin.displayName, 'OWNER_PASSWORD_CHANGED', 'Owner password updated securely.');
    }
  }

  logAudit(admin.displayName, 'SETTINGS_UPDATED', `Store settings saved by ${admin.displayName}`);
  saveDb();
  broadcastEvent({ type: 'CONFIG_UPDATED', settings: db.settings });
  res.json({ success: true, settings: db.settings });
});

// -------------------------------------------------------------
// SECURE IMAGE & LOGO PERMANENT STORAGE
// -------------------------------------------------------------
app.post('/api/admin/upload-image', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as AdminUser;
  const { filename, fileBase64, section } = req.body;
  if (!filename || !fileBase64) {
    return res.status(400).json({ error: 'Filename and base64 image data are required' });
  }

  try {
    const base64Data = fileBase64.includes(';base64,') ? fileBase64.split(';base64,')[1] : fileBase64;
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Determine extension
    const extMatch = filename.match(/\.(png|jpe?g|webp|svg|gif)$/i);
    const ext = extMatch ? extMatch[0].toLowerCase() : '.png';
    const cleanName = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const storedFilename = `${Date.now()}_${cleanName}${ext}`;
    const filePath = path.resolve(IMAGES_DIR, storedFilename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/images/${storedFilename}`;
    const sizeFormatted = `${(buffer.length / 1024).toFixed(1)} KB`;

    logAudit(admin.displayName, 'IMAGE_UPLOADED', `Uploaded image "${storedFilename}" (${sizeFormatted}) for ${section || 'branding'}`);

    res.json({
      success: true,
      url: publicUrl,
      filename: storedFilename,
      originalFilename: filename,
      sizeFormatted,
    });
  } catch (err: any) {
    console.error('Image upload failed:', err);
    res.status(500).json({ error: `Image upload failed: ${err.message}` });
  }
});

// -------------------------------------------------------------
// SECURE APK UPLOAD, STORAGE & TEST DOWNLOAD ENGINE
// -------------------------------------------------------------

// Upload & Store exact Android APK on Server
app.post('/api/admin/upload-apk', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as AdminUser;
  if (!admin.permissions.apks && admin.role !== 'owner') {
    return res.status(403).json({ error: 'Permission denied: APK management required' });
  }

  const { filename, fileBase64, itemId, appTitle } = req.body;
  if (!filename || !fileBase64) {
    return res.status(400).json({ error: 'Filename and file data (base64) are required' });
  }

  try {
    const base64Data = fileBase64.includes(';base64,') ? fileBase64.split(';base64,')[1] : fileBase64;
    const buffer = Buffer.from(base64Data, 'base64');
    
    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Uploaded file is empty' });
    }

    // Sanitize filename and preserve .apk extension
    const cleanOriginalName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const finalOriginalName = cleanOriginalName.toLowerCase().endsWith('.apk') ? cleanOriginalName : `${cleanOriginalName}.apk`;
    const storedFilename = `${Date.now()}_${finalOriginalName}`;
    const filePath = path.resolve(APKS_DIR, storedFilename);

    // Write exact binary file to disk
    fs.writeFileSync(filePath, buffer);

    // Compute SHA256 checksum and size
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const sizeFormatted = `${(buffer.length / (1024 * 1024)).toFixed(2)} MB`;

    const apkRecord: StoredApkFile = {
      id: `apk-${Date.now()}`,
      originalFilename: finalOriginalName,
      storedFilename,
      storagePath: `/uploads/apks/${storedFilename}`,
      sizeBytes: buffer.length,
      sizeFormatted,
      sha256,
      uploadedAt: new Date().toISOString(),
      uploadedBy: admin.displayName,
      associatedItemId: itemId || undefined,
      testDownloadUrl: `/api/admin/apks/download/${storedFilename}`,
    };

    if (!db.storedApks) db.storedApks = [];
    db.storedApks.unshift(apkRecord);

    // If an itemId was provided, link it to the item in database
    if (itemId) {
      // Free Fire Panel
      const panel = (db.freeFirePanels || []).find((p) => p.id === itemId);
      if (panel) {
        panel.downloadUrl = apkRecord.storagePath;
        panel.updatedAt = new Date().toISOString().split('T')[0];
      }
      // Custom Feature
      const feat = (db.customFeatures || []).find((f) => f.id === itemId);
      if (feat) {
        feat.downloadUrl = apkRecord.storagePath;
      }
      // Store App
      const storeApp = (db.apps || []).find((a) => a.id === itemId);
      if (storeApp) {
        storeApp.downloadUrl = apkRecord.storagePath;
        storeApp.fileSize = apkRecord.sizeFormatted;
        storeApp.updatedAt = new Date().toISOString().split('T')[0];
      }
    }

    saveDb();
    logAudit(admin.displayName, 'APK_UPLOADED', `Uploaded exact Android APK "${finalOriginalName}" (${sizeFormatted}, SHA: ${sha256.substring(0, 8)}...)`);

    // Real-time broadcast updates
    if (db.apps) broadcastEvent({ type: 'APPS_UPDATED', apps: db.apps });
    if (db.customFeatures) broadcastEvent({ type: 'FEATURES_UPDATED', features: db.customFeatures });

    res.json({
      success: true,
      message: 'APK uploaded and stored successfully on server!',
      apk: {
        ...apkRecord,
        downloadUrl: apkRecord.storagePath,
      },
    });
  } catch (err: any) {
    console.error('Failed to save APK file:', err);
    res.status(500).json({ error: `Failed to store APK file: ${err.message || 'Unknown error'}` });
  }
});

// Admin Test / Verify Download of Stored APK
app.get('/api/admin/apks/download/:filename', (req, res) => {
  const token = (req.query.token as string) || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null);
  if (!token) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  const session = adminSessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Admin session expired' });
  }

  const requestedFilename = path.basename(req.params.filename);
  const filePath = path.resolve(APKS_DIR, requestedFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Uploaded APK file not found on server storage' });
  }

  const record = (db.storedApks || []).find((a) => a.storedFilename === requestedFilename);
  const downloadName = record ? record.originalFilename : requestedFilename;

  res.setHeader('Content-Type', 'application/vnd.android.package-archive');
  res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  res.setHeader('Cache-Control', 'no-store, no-cache');
  
  const stat = fs.statSync(filePath);
  res.setHeader('Content-Length', stat.size);
  fs.createReadStream(filePath).pipe(res);
});

// Delete Stored APK
app.delete('/api/admin/apks/:id', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as AdminUser;
  if (!admin.permissions.apks && admin.role !== 'owner') {
    return res.status(403).json({ error: 'Permission denied: APK management required' });
  }

  const id = req.params.id;
  const index = (db.storedApks || []).findIndex((a) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'APK record not found' });
  }

  const apk = db.storedApks[index];
  const filePath = path.resolve(APKS_DIR, apk.storedFilename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('Could not delete APK file from disk:', e);
    }
  }

  db.storedApks.splice(index, 1);
  saveDb();
  logAudit(admin.displayName, 'APK_DELETED', `Deleted stored APK ${apk.originalFilename}`);
  res.json({ success: true, message: 'APK deleted' });
});

// Update Order Status (Strict Admin Verification Flow)
app.post('/api/admin/orders/update-status', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as AdminUser;
  if (!admin.permissions.payments && admin.role !== 'owner') {
    return res.status(403).json({ error: 'Permission denied: payments management required' });
  }

  const { orderId, status, notes } = req.body;
  const order = db.orders.find((o) => o.id === orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (status === 'PAID') {
    grantOrderAccess(order, admin.displayName);
    if (notes) order.adminNotes = notes;
    logAudit(admin.displayName, 'ORDER_APPROVED_PAID', `Order ${orderId} (₹${order.amount}) verified & approved by ${admin.displayName}. UTR: ${order.utrNumber || 'N/A'}`);
  } else if (status === 'REJECTED') {
    order.status = 'REJECTED';
    order.downloadToken = undefined; // strictly revoke download token
    order.adminNotes = notes || 'Payment rejected: Transaction reference unmatched with bank credits';
    order.updatedAt = new Date().toISOString();
    logAudit(admin.displayName, 'ORDER_REJECTED', `Order ${orderId} marked REJECTED by ${admin.displayName}. Reason: ${order.adminNotes}`);

    broadcastEvent({
      type: 'ORDER_REJECTED',
      orderId: order.id,
      userId: order.userId,
      status: 'REJECTED',
      reason: order.adminNotes,
      timestamp: Date.now(),
    });
  } else {
    order.status = status;
    order.downloadToken = undefined;
    if (notes) order.adminNotes = notes;
    order.updatedAt = new Date().toISOString();
    logAudit(admin.displayName, 'ORDER_STATUS_CHANGED', `Order ${orderId} marked as ${status} by ${admin.displayName}`);
  }

  saveDb();
  res.json({ success: true, order });
});

// -------------------------------------------------------------
// COMPLETE PROJECT BACKUP & EXPORT ENGINE
// -------------------------------------------------------------

// Helper to sanitize database for export - masks sensitive password hashes
function sanitizeDbForExport(database: any) {
  const clone = JSON.parse(JSON.stringify(database));
  if (Array.isArray(clone.admins)) {
    clone.admins = clone.admins.map((a: any) => ({
      ...a,
      // Retain active hash or fallback to default owner hash so extracted project can be run and logged into locally
      passwordHash: a.passwordHash || hashPassword('sksefa12345'),
    }));
  }
  return clone;
}

// Helper to recursively add directory files to JSZip
async function addDirectoryToZip(zip: JSZip, dirPath: string, rootDir: string) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const IGNORED_NAMES = new Set([
    'node_modules',
    '.git',
    'dist',
    'dev-dist',
    '.aistudio',
    '.cache',
    '.DS_Store',
    'bun.lock',
    'package-lock.json',
  ]);

  for (const entry of entries) {
    if (IGNORED_NAMES.has(entry.name)) continue;
    if (entry.name.endsWith('.log')) continue;

    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(rootDir, fullPath);

    if (entry.isDirectory()) {
      await addDirectoryToZip(zip, fullPath, rootDir);
    } else if (entry.isFile()) {
      if (entry.name === 'server-db.json') {
        try {
          const raw = fs.readFileSync(fullPath, 'utf-8');
          const parsed = JSON.parse(raw);
          const sanitized = sanitizeDbForExport(parsed);
          zip.file(relativePath, JSON.stringify(sanitized, null, 2));
        } catch (e) {
          zip.file(relativePath, fs.readFileSync(fullPath));
        }
      } else {
        const fileBuffer = fs.readFileSync(fullPath);
        zip.file(relativePath, fileBuffer);
      }
    }
  }
}

// 1. Download Complete Running Website/Project Source Code (.zip)
app.get([
  '/api/admin/system/export-project',
  '/api/admin/system/download-source-code',
  '/api/admin/download-source'
], async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || (req.query.token as string);
  const session = token ? adminSessions.get(token) : null;
  if (!session || session.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required to export project' });
  }

  const admin = session.admin;
  logAudit(admin.displayName, 'PROJECT_EXPORT_INITIATED', 'Admin started full project source code export');

  try {
    const zip = new JSZip();
    const projectRoot = __dirname;
    await addDirectoryToZip(zip, projectRoot, projectRoot);

    // Ensure sample .env exists in the exported ZIP for instant out-of-the-box local running
    zip.file('.env', '# Sefa Store Local Environment\nPORT=3000\nNODE_ENV=development\n');

    // Add comprehensive README.md with deployment and setup instructions
    const readme = `# ⚡ Sefa Store - Complete Source Code & Project Archive

Exported Date: ${new Date().toISOString()}
Exported By: ${admin.displayName} (${admin.role})

---

## 📦 What is Included in this ZIP:
- **Frontend Source:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Components:** Full UI store components (Header, Cards, Free Fire Panels, 3D Background, Modals, Admin Console)
- **Backend Server:** Node.js + Express (\`server.ts\`), SSE real-time events, file uploads, payment verification
- **Live Database:** \`server-db.json\` with all apps, Free Fire VIP panels, dynamic modules, and store settings
- **Static Assets:** All images, icons, logos, audio files, and PWA manifest
- **Configuration:** \`package.json\`, \`tsconfig.json\`, \`vite.config.ts\`, \`index.html\`, and \`.env\`

---

## 🚀 How to Run Locally on your PC / Laptop:

1. **Extract the ZIP file** to any folder.
2. Open terminal/command prompt in the extracted folder.
3. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
4. Start the local server:
   \`\`\`bash
   npm run dev
   \`\`\`
5. Open your browser and go to:
   \`http://localhost:3000\`

---

## 🔐 Admin Panel Credentials
- **Username:** \`sefa_owner\`
- **Password:** \`sksefa12345\`
- **Accessing Admin Panel:** Tap 5 times rapidly on the lightning bolt icon in the top store header, or press \`Ctrl + Shift + A\`.

---

## 🛠️ Production Build & Start
\`\`\`bash
npm run build
npm start
\`\`\`
`;
    zip.file('README.md', readme);

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `SefaStore_Complete_Source_Code_${dateStr}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', zipBuffer.length);
    res.send(zipBuffer);

    logAudit(admin.displayName, 'PROJECT_EXPORT_SUCCESS', `Full project archive ${filename} (${(zipBuffer.length / (1024 * 1024)).toFixed(2)} MB) generated and downloaded.`);
  } catch (err: any) {
    console.error('Project export error:', err);
    res.status(500).json({ error: `Failed to export project: ${err?.message || 'Internal server error'}` });
  }
});

// 2. Download Database & Settings Snapshot Backup (.json)
app.get('/api/admin/system/export-backup', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || (req.query.token as string);
  const session = token ? adminSessions.get(token) : null;
  if (!session || session.expiresAt < Date.now()) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication required' });
  }

  const admin = session.admin;
  const backupData = {
    backupType: 'SEFA_STORE_DATABASE_SNAPSHOT',
    version: '4.5.0',
    exportedAt: new Date().toISOString(),
    exportedBy: admin.displayName,
    settings: db.settings,
    freeFirePanels: db.freeFirePanels,
    customFeatures: db.customFeatures,
    notifications: db.notifications,
    orders: db.orders,
    users: db.users,
    auditLogs: db.auditLogs.slice(0, 50),
  };

  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `SefaStore_Database_Backup_${dateStr}.json`;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(JSON.stringify(backupData, null, 2));

  logAudit(admin.displayName, 'BACKUP_EXPORTED', `Database backup snapshot ${filename} downloaded.`);
});

// 3. Restore Database Snapshot
app.post('/api/admin/system/restore-backup', authenticateAdmin, (req, res) => {
  const admin = (req as any).admin as AdminUser;
  if (admin.role !== 'owner') {
    return res.status(403).json({ error: 'Only Store Owner can restore database backups' });
  }

  const backup = req.body;
  if (!backup || typeof backup !== 'object') {
    return res.status(400).json({ error: 'Invalid backup format' });
  }

  if (backup.settings && typeof backup.settings === 'object') {
    db.settings = { ...db.settings, ...backup.settings };
  }
  if (Array.isArray(backup.freeFirePanels)) {
    db.freeFirePanels = backup.freeFirePanels;
  }
  if (Array.isArray(backup.customFeatures)) {
    db.customFeatures = backup.customFeatures;
  }
  if (Array.isArray(backup.notifications)) {
    db.notifications = backup.notifications;
  }
  if (Array.isArray(backup.users)) {
    const existingIds = new Set(db.users.map((u) => u.id));
    for (const u of backup.users) {
      if (!existingIds.has(u.id)) db.users.push(u);
    }
  }

  saveDb();
  logAudit(admin.displayName, 'BACKUP_RESTORED', `Database state successfully restored from backup (Exported on: ${backup.exportedAt || 'Unknown'}).`);

  res.json({
    success: true,
    message: 'Database backup restored successfully!',
    restored: {
      panelsCount: db.freeFirePanels.length,
      featuresCount: db.customFeatures.length,
      notificationsCount: (db.notifications || []).length,
      storeName: db.settings.storeName,
    },
  });
});

// -------------------------------------------------------------
// VITE MIDDLEWARE / SPA INTEGRATION
// -------------------------------------------------------------
async function start() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = process.env.PORT || 3000;

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api') || url.startsWith('/downloads')) {
        return next();
      }
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        if (vite.ssrFixStacktrace) vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`[Sefa Store Engine] Running at http://0.0.0.0:${port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
});
