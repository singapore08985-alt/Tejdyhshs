import React from 'react';
import { 
  Star, 
  Download, 
  Eye, 
  ShoppingBag, 
  Share2, 
  Smartphone, 
  Check, 
  Tag 
} from 'lucide-react';
import { Product, Currency } from '../types';
import { triggerHapticFeedback, shareDigitalProduct } from '../utils/haptics';

interface ProductCardProps {
  product: Product;
  currency: Currency;
  onSelectProduct: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  isAddedToCart: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  onSelectProduct,
  onAddToCart,
  isAddedToCart,
}) => {
  const price = currency === 'INR' ? product.priceINR : product.priceUSD;
  const originalPrice = currency === 'INR' ? product.originalPriceINR : product.originalPriceUSD;
  const discountPercent = Math.round(((originalPrice - price) / originalPrice) * 100);

  const isAndroid = product.category === 'android_apps';

  return (
    <div className="group relative rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-950/20 flex flex-col overflow-hidden">
      
      {/* Thumbnail Banner */}
      <div 
        className="relative aspect-video w-full overflow-hidden bg-slate-950 cursor-pointer"
        onClick={() => {
          triggerHapticFeedback(10);
          onSelectProduct(product);
        }}
      >
        <img
          src={product.thumbnail}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          {isAndroid && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold flex items-center gap-1 shadow-md">
              <Smartphone className="w-3 h-3 stroke-[2.5]" />
              Android
            </span>
          )}
          {product.badges.map((b, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-200 text-[10px] font-semibold border border-slate-700/50"
            >
              {b}
            </span>
          ))}
        </div>

        {/* Discount Tag */}
        <div className="absolute top-2.5 right-2.5">
          <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[11px] font-extrabold shadow">
            {discountPercent}% OFF
          </span>
        </div>

        {/* Rating & Sales */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-1 bg-slate-950/70 backdrop-blur-sm px-2 py-0.5 rounded-md">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="font-bold text-white text-[11px]">{product.rating}</span>
            <span className="text-slate-400 text-[10px]">({product.reviewsCount})</span>
          </div>

          <span className="text-[11px] bg-slate-950/70 backdrop-blur-sm px-2 py-0.5 rounded-md text-slate-300">
            {product.salesCount} sold
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono text-emerald-400/90">{product.fileFormat}</span>
            <span>{product.fileSize}</span>
          </div>

          <h3
            onClick={() => {
              triggerHapticFeedback(10);
              onSelectProduct(product);
            }}
            className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-400 transition-colors cursor-pointer line-clamp-2 leading-snug"
          >
            {product.title}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Price & Action Row */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-white">
                {currency === 'INR' ? '₹' : '$'}{price.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 line-through">
                {currency === 'INR' ? '₹' : '$'}{originalPrice.toLocaleString()}
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">Instant Download</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Native Share button */}
            <button
              onClick={() => shareDigitalProduct(product.title, product.shortDescription, window.location.href)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              title="Share Product"
              aria-label="Share product"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Quick Details */}
            <button
              onClick={() => {
                triggerHapticFeedback(10);
                onSelectProduct(product);
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="View Details"
              aria-label="View product details"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Add to Cart */}
            <button
              onClick={() => {
                triggerHapticFeedback(20);
                onAddToCart(product);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
                isAddedToCart
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
              }`}
            >
              {isAddedToCart ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Buy</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
