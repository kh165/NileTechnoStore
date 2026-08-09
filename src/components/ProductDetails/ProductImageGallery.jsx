import React, { useState } from "react";
import { Heart, Share2, ZoomIn, Check, Star, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function ProductImageGallery({
  product,
  mainImage,
  setMainImage,
  productGallery = [],
  isFavorite,
  toggleFavorite,
  handleShareProduct,
  copiedShare,
  discountPercentage,
  rating,
  reviewsCount,
  lang = "ar"
}) {
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  return (
    <div className="space-y-2.5">
      {/* Main Image Container - Compact & responsive */}
      <div className="relative group rounded-xl sm:rounded-2xl overflow-hidden bg-slate-50/80 border border-slate-100 shadow-2xs h-44 sm:h-52 md:h-56 flex items-center justify-center p-2">
        {/* Badges */}
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1 items-end">
          {discountPercentage > 0 && (
            <span className="bg-rose-500 text-white font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
              {lang === "ar" ? `خصم ${discountPercentage}%` : `-${discountPercentage}% OFF`}
            </span>
          )}
          {product.isNew && (
            <span className="bg-blue-600 text-white font-bold text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-full shadow-2xs">
              {lang === "ar" ? "جديد" : "NEW"}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              if (toggleFavorite) toggleFavorite(product);
            }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-xs backdrop-blur-md transition-all cursor-pointer ${
              isFavorite
                ? "bg-rose-500 text-white shadow-rose-500/20"
                : "bg-white/90 text-slate-700 hover:bg-white border border-slate-200/60"
            }`}
            title={lang === "ar" ? "إضافة للمفضلة" : "Favorite"}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-current" : ""}`} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleShareProduct}
            className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-slate-700 border border-slate-200/60 flex items-center justify-center shadow-xs backdrop-blur-md transition-all relative cursor-pointer"
            title={lang === "ar" ? "مشاركة المنتج" : "Share"}
          >
            {copiedShare ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsZoomOpen(true)}
            className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-slate-700 border border-slate-200/60 flex items-center justify-center shadow-xs backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            title={lang === "ar" ? "تكبير الصورة" : "Zoom"}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {/* Display Image */}
        <motion.img
          key={mainImage}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          src={mainImage}
          alt={product.name || "صورة المنتج"}
          className="w-full h-full object-contain cursor-pointer transition-transform duration-300 group-hover:scale-105"
          onClick={() => setIsZoomOpen(true)}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/placeholder.jpg";
          }}
        />

        {/* Rating overlay pill */}
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-200/60 shadow-2xs flex items-center gap-1 text-[10px] font-bold text-slate-800">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>{rating}</span>
          <span className="text-slate-400 font-normal">({reviewsCount})</span>
        </div>
      </div>

      {/* Gallery Thumbnails */}
      {productGallery.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {productGallery.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setMainImage(img)}
              className={`relative w-10 h-10 rounded-lg overflow-hidden border-2 transition-all shrink-0 bg-slate-50 p-0.5 cursor-pointer ${
                mainImage === img
                  ? "border-blue-600 shadow-2xs scale-105"
                  : "border-slate-200/70 hover:border-slate-300 opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={img}
                alt={`${product.name || 'المنتج'} ${idx + 1}`}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/placeholder.jpg";
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomOpen(false)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={mainImage}
              alt={product.name || "صورة المكبرة"}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
