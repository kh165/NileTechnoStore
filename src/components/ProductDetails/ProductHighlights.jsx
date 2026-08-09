import React from "react";
import { 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Tag
} from "lucide-react";

export default function ProductHighlights({
  product,
  storeCurrency = "ج.م",
  stockCount,
  colorsList = [],
  sizesList = [],
  selectedColor,
  setSelectedColor,
  selectedSize,
  setSelectedSize,
  lang = "ar"
}) {
  const currentPrice = parseFloat(product.price || 0);
  const originalPrice = parseFloat(product.originalPrice || product.oldPrice || 0);
  const safeCurrentPrice = isNaN(currentPrice) ? 0 : currentPrice;
  const safeOriginalPrice = isNaN(originalPrice) ? 0 : originalPrice;

  const isOutOfStock = stockCount <= 0;
  const isLowStock = stockCount > 0 && stockCount <= 5;

  return (
    <div className={`space-y-3 ${lang === "ar" ? "text-right" : "text-left"}`} dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Category & Title */}
      <div>
        {product.category && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 mb-1 border border-blue-100/60">
            <Tag className="w-2.5 h-2.5" />
            {product.category}
          </span>
        )}
        <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
          {product.name || "منتج بدون اسم"}
        </h1>
        {product.modelNumber && (
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
            {lang === "ar" ? "الموديل: " : "Model: "}{product.modelNumber}
          </p>
        )}
      </div>

      {/* Pricing Banner */}
      <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-slate-50 via-blue-50/20 to-slate-50 border border-slate-200/60 flex items-center justify-between flex-wrap gap-1.5">
        <div>
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-[10px] text-slate-500 font-bold block">
              {lang === "ar" ? "السعر" : "Price"}
            </span>
            {(product.discountBadge || product.discountType) && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[8px] font-black inline-flex items-center gap-0.5">
                <Tag className="w-2 h-2" />
                <span>{product.discountBadge || product.discountType}</span>
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-black text-blue-900 font-mono">
              {safeCurrentPrice.toLocaleString("ar-EG")} {storeCurrency}
            </span>
            {safeOriginalPrice > safeCurrentPrice && (
              <span className="text-xs text-slate-400 line-through font-mono">
                {safeOriginalPrice.toLocaleString("ar-EG")} {storeCurrency}
              </span>
            )}
          </div>
        </div>

        {/* Stock Status Pill */}
        <div>
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 font-bold text-[10px] whitespace-nowrap shrink-0">
              <AlertTriangle className="w-3 h-3" />
              {lang === "ar" ? "نفذت الكمية" : "Out of Stock"}
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 font-bold text-[10px] animate-pulse whitespace-nowrap shrink-0">
              <Clock className="w-3 h-3 text-amber-600" />
              {lang === "ar" ? `متبقي ${stockCount}` : `Only ${stockCount}`}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[10px] whitespace-nowrap shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {lang === "ar" ? "متوفر" : "In Stock"}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="text-[11px] text-slate-600 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100 max-h-20 overflow-y-auto scrollbar-thin">
          {product.description}
        </div>
      )}

      {/* Colors Selector */}
      {colorsList.length > 0 && (
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-700 flex items-center justify-between">
            <span>{lang === "ar" ? "اللون:" : "Color:"}</span>
            <span className="text-blue-600 font-bold">{selectedColor || colorsList[0]}</span>
          </label>
          <div className="flex items-center gap-1 flex-wrap">
            {colorsList.map((color, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all border cursor-pointer ${
                  selectedColor === color
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sizes Selector */}
      {sizesList.length > 0 && (
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-700 flex items-center justify-between">
            <span>{lang === "ar" ? "المقاس:" : "Size:"}</span>
            <span className="text-blue-600 font-bold">{selectedSize || sizesList[0]}</span>
          </label>
          <div className="flex items-center gap-1 flex-wrap">
            {sizesList.map((size, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all border cursor-pointer ${
                  selectedSize === size
                    ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Value Badges Grid */}
      <div className="grid grid-cols-3 gap-1 pt-0.5">
        <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-center">
          <Truck className="w-3.5 h-3.5 text-blue-600 mx-auto mb-0.5" />
          <span className="text-[9px] font-bold text-slate-700 block">
            {lang === "ar" ? "شحن سريع" : "Fast Shipping"}
          </span>
        </div>

        <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mx-auto mb-0.5" />
          <span className="text-[9px] font-bold text-slate-700 block">
            {lang === "ar" ? "ضمان أصلي" : "100% Genuine"}
          </span>
        </div>

        <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-center">
          <RotateCcw className="w-3.5 h-3.5 text-indigo-600 mx-auto mb-0.5" />
          <span className="text-[9px] font-bold text-slate-700 block">
            {lang === "ar" ? "إرجاع مجاني" : "Free Return"}
          </span>
        </div>
      </div>
    </div>
  );
}
