import React, { useState } from 'react';
import { 
  X, 
  Star, 
  Check, 
  Download, 
  ShoppingBag, 
  Share2, 
  Smartphone, 
  FileArchive, 
  Layers, 
  Clock, 
  ShieldCheck, 
  Zap,
  Tag
} from 'lucide-react';
import { Product, Currency } from '../types';
import { triggerHapticFeedback, shareDigitalProduct } from '../utils/haptics';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  currency: Currency;
  onAddToCart: (p: Product, license: 'personal' | 'commercial' | 'extended') => void;
  onInstantBuy: (p: Product, license: 'personal' | 'commercial' | 'extended') => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  onClose,
  currency,
  onAddToCart,
  onInstantBuy,
}) => {
  const [selectedLicense, setSelectedLicense] = useState<'personal' | 'commercial' | 'extended'>('commercial');
  const [activeTab, setActiveTab] = useState<'features' | 'specs' | 'license'>('features');

  if (!product) return null;

  const basePrice = currency === 'INR' ? product.priceINR : product.priceUSD;
  const originalBasePrice = currency === 'INR' ? product.originalPriceINR : product.originalPriceUSD;

  // License multiplier
  const multiplier = selectedLicense === 'personal' ? 0.75 : selectedLicense === 'commercial' ? 1 : 2.2;
  const price = Math.round(basePrice * multiplier);
  const originalPrice = Math.round(originalBasePrice * multiplier);

  const isAndroid = product.category === 'android_apps';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2">
            {isAndroid && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" />
                Android Compatible
              </span>
            )}
            <span className="text-xs text-slate-400 font-mono">
              Version {product.version}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => shareDigitalProduct(product.title, product.shortDescription, window.location.href)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                triggerHapticFeedback(10);
                onClose();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Main Visual & Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-xl overflow-hidden aspect-video bg-slate-950 relative border border-slate-800">
              <img
                src={product.thumbnail}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                <span className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md text-slate-200 font-mono">
                  {product.fileFormat}
                </span>
                <span className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-md font-bold text-xs">
                  {product.fileSize}
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-amber-400">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="font-bold text-white ml-1">{product.rating}</span>
                  <span className="text-slate-400">({product.reviewsCount} reviews)</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 font-medium">{product.salesCount} downloads</span>
                </div>

                <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">
                  {product.title}
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Sample Download button if available */}
              {product.sampleDownloadUrl && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-semibold text-emerald-400">Android Studio Sample</span>
                    <p className="text-[11px] text-slate-400">Complete Android wrapper .zip available</p>
                  </div>
                  <a
                    href={product.sampleDownloadUrl}
                    download
                    onClick={() => triggerHapticFeedback(20)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download ZIP
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* License Selection Tier */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select License Tier
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              {/* Personal */}
              <button
                onClick={() => {
                  triggerHapticFeedback(10);
                  setSelectedLicense('personal');
                }}
                className={`p-3 rounded-xl border text-left transition ${
                  selectedLicense === 'personal'
                    ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Personal</span>
                  {selectedLicense === 'personal' && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="text-sm font-extrabold text-white mt-1">
                  {currency === 'INR' ? '₹' : '$'}{Math.round(basePrice * 0.75).toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">1 Single End Project (Non-commercial)</p>
              </button>

              {/* Commercial (Default) */}
              <button
                onClick={() => {
                  triggerHapticFeedback(10);
                  setSelectedLicense('commercial');
                }}
                className={`p-3 rounded-xl border text-left transition ${
                  selectedLicense === 'commercial'
                    ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200">Commercial</span>
                    <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-1.5 py-0.2 rounded">POPULAR</span>
                  </div>
                  {selectedLicense === 'commercial' && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="text-sm font-extrabold text-white mt-1">
                  {currency === 'INR' ? '₹' : '$'}{basePrice.toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Unlimited Client & Commercial Apps</p>
              </button>

              {/* Extended */}
              <button
                onClick={() => {
                  triggerHapticFeedback(10);
                  setSelectedLicense('extended');
                }}
                className={`p-3 rounded-xl border text-left transition ${
                  selectedLicense === 'extended'
                    ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Extended Resale</span>
                  {selectedLicense === 'extended' && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="text-sm font-extrabold text-white mt-1">
                  {currency === 'INR' ? '₹' : '$'}{Math.round(basePrice * 2.2).toLocaleString()}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Full Resale & SaaS Redistribution</p>
              </button>

            </div>
          </div>

          {/* Details Tabs */}
          <div className="border-b border-slate-800 flex gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('features')}
              className={`pb-2 border-b-2 transition ${
                activeTab === 'features'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              What's Included ({product.features.length})
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`pb-2 border-b-2 transition ${
                activeTab === 'specs'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Compatibility & Specs
            </button>
          </div>

          {/* Tab 1: Features */}
          {activeTab === 'features' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {product.features.map((f, idx) => (
                <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-950/50 border border-slate-800 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Specs */}
          {activeTab === 'specs' && (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">File Format</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{product.fileFormat}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Download Size</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{product.fileSize}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Last Updated</span>
                  <p className="font-semibold text-slate-200 mt-0.5">{product.updatedDate}</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-300 mb-1.5">Compatible Software & SDKs:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {product.compatibleWith.map((c, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px]">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Sticky Bottom Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-white">
                {currency === 'INR' ? '₹' : '$'}{price.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 line-through">
                {currency === 'INR' ? '₹' : '$'}{originalPrice.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">
              Instant License Key + Automatic Updates
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => {
                triggerHapticFeedback(20);
                onAddToCart(product, selectedLicense);
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              Add to Cart
            </button>

            <button
              onClick={() => {
                triggerHapticFeedback(25);
                onInstantBuy(product, selectedLicense);
              }}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              Buy Now (Instant Access)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
