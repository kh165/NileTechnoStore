import React, { useState } from "react";
import { Plus, Tag, Star, Heart } from "lucide-react";
import { motion } from "motion/react";
import { getProductPrices } from "../../lib/productUtils";

export default function ProductCard({
  product,
  onAddToCart,
  onViewDetails,
  storeCurrency = "ج.م",
  isWishlisted = false,
  onToggleWishlist,
  lang = "ar"
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const isOutOfStock = product.stock <= 0;
  
  // Calculate final pricing using unified product utility function (Martin Fowler's Extract Module pattern)
  const { originalPrice, discountedPrice, hasDiscount, discountPercentage } = getProductPrices(product);

  return (
    <motion.div
      id={`product-card-${product.id}`}
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/90 transition-all duration-300 md:hover:-translate-y-2 md:hover:shadow-[0_20px_35px_-10px_rgba(0,0,0,0.12)] md:hover:border-slate-200/80 dark:md:hover:border-slate-700 active:opacity-90 cursor-pointer"
    >
      {/* Product Image Area inside a stylish photo stage */}
      <div 
        onClick={() => !isOutOfStock && onViewDetails && onViewDetails(product)}
        className="relative aspect-square overflow-hidden bg-gradient-to-b from-slate-50/60 to-slate-100/40 dark:from-slate-900/80 dark:to-slate-900/40 rounded-2xl m-2.5 flex items-center justify-center p-5 cursor-pointer select-none border border-slate-100/50 dark:border-slate-750"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50/20 via-slate-50/10 to-slate-100/30 dark:from-blue-900/10 dark:via-slate-900/10 dark:to-slate-900/20 pointer-events-none" />

        {!imageLoaded && (
          <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-slate-200/70 dark:bg-slate-700/70" />
          </div>
        )}

        <img
          src={product.image}
          alt={product.name}
          onLoad={() => setImageLoaded(true)}
          className={`max-h-[85%] max-w-[85%] object-contain transition-all duration-500 ease-[0.16,1,0.3,1] group-hover:scale-105 group-hover:-translate-y-1 ${imageLoaded ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
          referrerPolicy="no-referrer"
          loading="lazy"
        />

        {/* Wishlist Heart Button */}
        {onToggleWishlist && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product);
            }}
            title={lang === "ar" ? (isWishlisted ? "إزالة من المفضلة" : "إضافة للمفضلة") : (isWishlisted ? "Remove from Wishlist" : "Add to Wishlist")}
            className={`absolute top-2.5 left-2.5 z-10 p-2 rounded-full shadow-sm cursor-pointer transition-all active:scale-90 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/60 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 ${
              isWishlisted ? "text-rose-500" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            }`}
          >
            <Heart className="h-4 w-4 transition-transform group-active:scale-90" fill={isWishlisted ? "currentColor" : "none"} />
          </button>
        )}

        {/* Badges */}
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1 items-end">
          {hasDiscount && (
            <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-600 to-rose-500 px-2.5 py-0.5 text-[10px] font-black text-white shadow-md border border-white/20 whitespace-nowrap shrink-0">
              <Tag className="h-3 w-3 text-amber-200" />
              <span>{product.discountBadge || product.discountType || (lang === "ar" ? `${discountPercentage}% خصم` : `${discountPercentage}% OFF`)}</span>
            </span>
          )}
          {product.featured && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#072d5c] px-2.5 py-0.5 text-[9px] font-black text-white shadow-sm border border-blue-400/30 whitespace-nowrap shrink-0">
              {lang === "ar" ? "مميز" : "Featured"}
            </span>
          )}
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-[2px] z-10">
            <span className="rounded-full bg-slate-900 px-3.5 py-1 text-[10px] font-bold text-white shadow-lg whitespace-nowrap shrink-0 inline-flex items-center justify-center">
              {lang === "ar" ? "نفذت الكمية" : "Out of Stock"}
            </span>
          </div>
        )}
      </div>

      {/* Info Content */}
      <div className="flex flex-1 flex-col px-4 pb-4 pt-1.5">
        <span className="text-[10px] text-slate-400 dark:text-slate-400 font-extrabold block mb-1 uppercase tracking-widest">{product.category || product.categoryName || (lang === "ar" ? "عام" : "General")}</span>
        
        <h3
          onClick={() => onViewDetails(product)}
          className="cursor-pointer text-[14px] font-bold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug"
        >
          {product.name}
        </h3>

        {/* Rating Row */}
        <div className="flex items-center gap-1.5 mt-2">
          <div className="flex items-center gap-0.5 text-amber-500">
            {[...Array(5)].map((_, i) => {
              const ratingVal = product.rating || 5;
              return (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${i < Math.floor(ratingVal) ? "fill-current" : "text-slate-200 dark:text-slate-700"}`}
                />
              );
            })}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-400 font-semibold font-sans">
            ({product.reviews_count || product.reviewsCount || Math.floor(20 + (product.id ? product.id.charCodeAt(0) % 80 : 35))})
          </span>
        </div>

        {/* Price & Cart button row */}
        <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-[11px] text-slate-400 dark:text-slate-400 line-through font-medium font-mono mb-0.5">
                {originalPrice} {storeCurrency}
              </span>
            )}
            <span className="text-[16px] font-extrabold text-blue-700 dark:text-blue-400 font-mono leading-none">
              {discountedPrice} <span className="text-[11px] font-bold">{storeCurrency}</span>
            </span>
          </div>

          <button
            id={`btn-add-${product.id}`}
            disabled={isOutOfStock}
            onClick={() => onAddToCart(product)}
            className={`flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-300 shadow-sm ${isOutOfStock ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 cursor-pointer hover:shadow-blue-200 hover:shadow-lg"}`}
            title={lang === "ar" ? "إضافة للسلة" : "Add to Cart"}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
