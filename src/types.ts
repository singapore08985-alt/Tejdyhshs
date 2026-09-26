// Store Category & App Models for Sefa Store
export type StoreCategory = 'apps' | 'games' | 'top_apps' | 'books' | 'ff_panels';

export interface StoreApp {
  id: string;
  title: string;
  category: StoreCategory;
  author: string;
  icon: string;
  rating: number;
  reviewsCount: number;
  downloadsCount: number;
  verified: boolean;
  isPremium: boolean;
  priceINR: number;
  version: string;
  fileSize: string;
  downloadUrl: string;
  packageName?: string;
  password?: string;
  description: string;
  terminalCommands?: string;
  rank?: number;
  badges: string[];
  updatedAt: string;
  userRatings?: number[];
  // Extended Date & Duration fields requested by user
  startDate?: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
  durationDays?: number;
  status?: 'active' | 'expired' | 'maintenance' | 'hidden';
  assignedUser?: string;
}

// Free Fire Panel Model (Dedicated Section requested by user)
export interface FreeFirePanel {
  id: string;
  name: string;
  priceINR: number;
  startDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  durationDays: number;
  targetGame: 'FF Normal' | 'FF MAX' | 'Both Normal & MAX';
  assignedUser: string; // "All Users", "VIP Only", or specific User ID/Name
  features: string[]; // e.g. ["100% Auto Headshot", "ESP Line & Box", "Antiban Bypass v14", "AimLock 360°"]
  licenseKey?: string;
  downloadUrl: string;
  status: 'active' | 'expired' | 'maintenance';
  version: string;
  icon?: string;
  updatedAt: string;
}

// Custom Feature Model (Add New Feature dynamically)
export interface CustomFeature {
  id: string;
  title: string;
  type: 'panel' | 'app' | 'tool' | 'banner' | 'link';
  description: string;
  icon: string;
  badge: string;
  priceINR: number;
  durationDays: number;
  startDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  downloadUrl?: string;
  password?: string;
  status: 'active' | 'expired' | 'maintenance' | 'hidden';
  assignedUser?: string;
  targetGame?: string;
  terminalCommands?: string;
  createdAt: string;
  appId?: string; // Connected App ID from All Apps list
  appName?: string; // Connected App Title
  isVip?: boolean; // VIP / Paid feature status
}

export interface StoreNotification {
  id: string;
  title: string;
  message: string;
  link?: string;
  password?: string;
  date: string;
  isNew: boolean;
  orderId?: string;
  userId?: string;
  amount?: number;
  paymentStatus?: 'PAID' | 'PENDING' | 'REJECTED';
  downloadUrl?: string;
  itemTitle?: string;
}

export interface StoreSettings {
  storeName: string;
  creatorName: string;
  logoUrl: string; // Dynamic website logo uploaded/set from Admin Panel
  qrCodeUrl?: string; // Custom uploaded payment QR code image
  upiId: string; // 'sk-sefajultulla@fam'
  maintenanceMode: boolean;
  maintenanceMessage: string;
  telegramLink: string;
  youtubeLink: string;
  whatsappNumber?: string; // Admin WhatsApp number for direct user support (e.g. 919239182739)
  whatsappEnabled?: boolean; // Toggle WhatsApp support button on/off
  telegramEnabled?: boolean; // Toggle Telegram channel link on/off
  youtubeEnabled?: boolean; // Toggle YouTube channel link on/off
}

export interface StoredApkFile {
  id: string;
  originalFilename: string;
  storedFilename: string;
  storagePath: string;
  sizeBytes: number;
  sizeFormatted: string;
  sha256: string;
  uploadedAt: string;
  uploadedBy: string;
  associatedItemId?: string;
  appTitle?: string;
  testDownloadUrl: string;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'REJECTED' | 'FAILED';

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
  status: OrderStatus;
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

export interface UserAccount {
  id: string;
  name: string;
  emailOrPhone: string;
  plan: 'free' | 'vip_daily' | 'vip_weekly' | 'vip_monthly' | 'vip_lifetime';
  startDate?: string; // YYYY-MM-DD
  expiryDate?: string; // YYYY-MM-DD
  durationDays?: number;
  permissions: string[]; // e.g. ["all_apps", "ff_panels", "app:termux"]
  status: 'active' | 'blocked' | 'expired';
  createdAt: string;
}

export interface AdminPermissions {
  payments: boolean;
  users: boolean;
  apks: boolean;
  content: boolean;
  maintenance: boolean;
  admins: boolean;
}

export interface AdminProfile {
  id: string;
  username: string;
  displayName: string;
  role: 'owner' | 'admin';
  permissions: AdminPermissions;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  details: string;
  timestamp: string;
}

// Legacy types for backwards compatibility
export type Currency = 'INR' | 'USD';
export type ProductCategory = 'all' | 'android_apps' | 'ui_kits' | 'web_templates' | 'ai_scripts' | 'ebooks';

export interface Product {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  category: ProductCategory;
  priceINR: number;
  priceUSD: number;
  originalPriceINR: number;
  originalPriceUSD: number;
  rating: number;
  reviewsCount: number;
  salesCount: number;
  thumbnail: string;
  badges: string[];
  fileFormat: string;
  fileSize: string;
  version: string;
  updatedDate: string;
  compatibleWith: string[];
  features: string[];
  sampleDownloadUrl?: string;
  liveDemoUrl?: string;
}

export interface CartItem {
  product: Product;
  license: 'personal' | 'commercial' | 'extended';
  price: number;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  currency: Currency;
  licenseKey: string;
  status: 'completed' | 'processing';
  downloadUrl: string;
}

export interface CategoryInfo {
  id: ProductCategory;
  name: string;
  nameHindi: string;
  icon: string;
  count: number;
}
