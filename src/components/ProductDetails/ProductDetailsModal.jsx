import React, { useState, useEffect } from "react";
import { X, ShoppingBag, Zap, Minus, Plus, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ProductImageGallery from "./ProductImageGallery";
import ProductHighlights from "./ProductHighlights";
import ProductReviewsSection from "./ProductReviewsSection";
import { stockService } from "../../lib/stockService";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

export default function ProductDetailsModal({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
  onRequestLogin,
  storeCurrency = "ج.م",
  isWishlisted = false,
  isInWishlist = false,
  onToggleWishlist,
  lang = "ar",
  currentUser
}) {
  useBodyScrollLock(Boolean(product));

  // Safe parsing helper functions
  const safeArray = (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string" && val?.trim()) {
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  };

  const colorsList = product ? safeArray(product.colors || product.color) : [];
  const sizesList = product ? safeArray(product.sizes || product.size) : [];
  
  const rawImages = product ? safeArray(product.images) : [];
  const rawGallery = product ? safeArray(product.gallery_urls) : [];
  
  const mainImgFallback = product ? (product.image || (rawImages.length > 0 ? rawImages[0] : "/placeholder.jpg")) : "/placeholder.jpg";

  // Declarations of ALL hooks at top level before ANY return statement
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(colorsList[0] || "");
  const [selectedSize, setSelectedSize] = useState(sizesList[0] || "");
  const [mainImage, setMainImage] = useState(mainImgFallback);
  const [copiedShare, setCopiedShare] = useState(false);

  // Sync main image when product changes
  useEffect(() => {
    if (product) {
      const colors = safeArray(product.colors || product.color);
      const sizes = safeArray(product.sizes || product.size);
      const imgs = safeArray(product.images);
      const fallback = product.image || (imgs.length > 0 ? imgs[0] : "/placeholder.jpg");

      setMainImage(fallback);
      setSelectedColor(colors[0] || "");
      setSelectedSize(sizes[0] || "");
      setQuantity(1);
    }
  }, [product]);

  // NOW we can safely do early return if product is null
  if (!product) return null;

  const productId = product.id || product._id || "prod_default";
  const stockCount = stockService.getStock(productId, product.stock ?? 10);
  const isOutOfStock = stockCount <= 0;

  // Gallery array creation without spreading non-iterables
  const gallery = [
    product.image,
    ...rawImages,
    ...rawGallery
  ].filter(Boolean);
  const uniqueGallery = Array.from(new Set(gallery));

  // Calculate discount percentage
  const price = parseFloat(product.price || 0);
  const oldPrice = parseFloat(product.oldPrice || product.originalPrice || 0);
  const discountPercentage = oldPrice > price && oldPrice > 0
    ? Math.round(((oldPrice - price) / oldPrice) * 100)
    : 0;

  const handleShareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name || "منتج المميز",
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    if (onAddToCart) {
      onAddToCart(product, quantity, selectedColor, selectedSize);
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    if (onBuyNow) {
      onBuyNow(product, quantity, selectedColor, selectedSize);
    } else if (onAddToCart) {
      onAddToCart(product, quantity, selectedColor, selectedSize);
    }
  };

  const activeWishlistState = isWishlisted || isInWishlist;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="relative w-full max-w-lg sm:max-w-xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-100 my-auto flex flex-col max-h-[85vh]"
        >
          {/* Header Close & Back Bar */}
          <div className="flex items-center justify-between p-2.5 px-3.5 sm:px-4 border-b border-slate-100 bg-slate-50/90 shrink-0">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-200/80 hover:bg-slate-300 text-slate-800 font-black text-xs transition-all cursor-pointer active:scale-95"
            >
              <ArrowRight className={`w-3.5 h-3.5 ${lang === "ar" ? "" : "rotate-180"}`} />
              <span>{lang === "ar" ? "رجوع" : "Back"}</span>
            </button>

            <span className="text-xs font-extrabold text-slate-800 tracking-wide">
              {lang === "ar" ? "تفاصيل المنتج" : "Product Details"}
            </span>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title={lang === "ar" ? "إغلاق" : "Close"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-3 sm:p-4 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 items-start">
              {/* Image Gallery Column */}
              <ProductImageGallery
                product={product}
                mainImage={mainImage}
                setMainImage={setMainImage}
                productGallery={uniqueGallery}
                isFavorite={activeWishlistState}
                toggleFavorite={() => onToggleWishlist && onToggleWishlist(product)}
                handleShareProduct={handleShareProduct}
                copiedShare={copiedShare}
                discountPercentage={discountPercentage}
                rating={product.rating || 4.9}
                reviewsCount={product.reviewsCount || 12}
                lang={lang}
              />

              {/* Highlights & Customization Column */}
              <ProductHighlights
                product={product}
                storeCurrency={storeCurrency}
                stockCount={stockCount}
                colorsList={colorsList}
                sizesList={sizesList}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                selectedSize={selectedSize}
                setSelectedSize={setSelectedSize}
                lang={lang}
              />
            </div>

            {/* Reviews Section from Firestore */}
            <ProductReviewsSection
              productId={productId}
              productName={product.name || "المنتج"}
              currentUser={currentUser}
              onRequestLogin={onRequestLogin}
              lang={lang}
            />
          </div>

          {/* Fixed Bottom Action Bar */}
          <div className="p-2.5 sm:p-3 px-3.5 sm:px-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-2.5 shrink-0" dir="rtl">
            {/* Quantity Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-bold text-slate-600 hidden xs:inline">
                {lang === "ar" ? "الكمية:" : "Qty:"}
              </span>
              <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 shadow-2xs">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-xs font-bold text-slate-900 font-mono">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(stockCount, quantity + 1))}
                  disabled={quantity >= stockCount || isOutOfStock}
                  className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-1">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1 shadow-sm disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{lang === "ar" ? "إضافة للسلة" : "Add to Cart"}</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-[11px] sm:text-xs flex items-center justify-center gap-1 shadow-sm shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{lang === "ar" ? "شراء الآن" : "Buy Now"}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
