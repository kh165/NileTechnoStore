import React, { useState, useEffect, useMemo } from "react";
import { Sparkles, ArrowRight, ChevronRight, ChevronLeft, Tag } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getProductPrices } from "../../lib/productUtils";
import { getFeaturedProductsFromFirestore, listenToFeaturedProductsFromFirestore } from "../../lib/firebaseService";
import { getStoreSettings } from "../../lib/storeSettingsService";

export default function FeaturedBanner({
  allProducts = [],
  lang = "ar",
  onPromoClick,
  storeCurrency = "ج.م"
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedFeaturedIds, setSelectedFeaturedIds] = useState([]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [storeSettings, setStoreSettings] = useState(() => getStoreSettings());

  useEffect(() => {
    const handleSettingsUpdate = (e) => {
      if (e && e.detail) {
        setStoreSettings(e.detail);
      } else {
        setStoreSettings(getStoreSettings());
      }
    };
    window.addEventListener("niletechno_settings_updated", handleSettingsUpdate);
    return () => window.removeEventListener("niletechno_settings_updated", handleSettingsUpdate);
  }, []);

  useEffect(() => {
    const unsubscribe = listenToFeaturedProductsFromFirestore((ids) => {
      setSelectedFeaturedIds(ids || []);
      setIsLoadingConfig(false);
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  // 1. Compute dynamic daily featured products per category or show the custom selected ones
  const featuredSlides = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];

    // If there are custom admin-selected products, show those!
    if (selectedFeaturedIds && selectedFeaturedIds.length > 0) {
      const slides = [];
      selectedFeaturedIds.forEach((id) => {
        const product = allProducts.find((p) => String(p.id) === String(id));
        if (product) {
          slides.push({
            category: product.category || (lang === "ar" ? "مميز" : "Featured"),
            product: product,
            glowClass: getCategoryGlow(product.category)
          });
        }
      });
      if (slides.length > 0) {
        return slides;
      }
    }

    // Fallback: Group products by category and rotate deterministically per day
    const categoriesMap = {};
    allProducts.forEach((product) => {
      const cat = product.category || (lang === "ar" ? "عام" : "General");
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = [];
      }
      categoriesMap[cat].push(product);
    });

    // Compute daily date code for rotation
    const today = new Date();
    const dateCode = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

    const slides = [];

    // For each category, pick exactly one rotating featured product
    Object.entries(categoriesMap).forEach(([catName, prods]) => {
      // Prioritize products marked featured, fallback to all products in category
      let candidates = prods.filter((p) => p.featured === true || p.is_featured === true);
      if (candidates.length === 0) {
        candidates = prods;
      }

      // Sort candidates deterministically to prevent random shifts
      const sortedCandidates = [...candidates].sort((a, b) => String(a.id).localeCompare(String(b.id)));

      // Pick exactly one product based on the date rotation code
      const selectedIndex = dateCode % sortedCandidates.length;
      const product = sortedCandidates[selectedIndex];

      if (product) {
        slides.push({
          category: catName,
          product: product,
          // Premium colorful glows to style each category distinctly
          glowClass: getCategoryGlow(catName)
        });
      }
    });

    return slides;
  }, [allProducts, lang, selectedFeaturedIds]);

  // Helper to give distinct atmospheric glows to different categories
  function getCategoryGlow(categoryName) {
    if (!categoryName) return "from-blue-500/10 to-indigo-500/5";
    const lower = categoryName.toLowerCase();
    if (lower.includes("هواتف") || lower.includes("phone") || lower.includes("موبايل")) {
      return "from-blue-500/15 via-cyan-500/10 to-transparent";
    }
    if (lower.includes("لاب") || lower.includes("laptop") || lower.includes("كمبيوتر")) {
      return "from-purple-500/15 via-indigo-500/10 to-transparent";
    }
    if (lower.includes("سماعات") || lower.includes("audio") || lower.includes("headphone")) {
      return "from-emerald-500/15 via-teal-500/10 to-transparent";
    }
    if (lower.includes("ساعات") || lower.includes("watch") || lower.includes("اكسسوار")) {
      return "from-amber-500/15 via-orange-500/10 to-transparent";
    }
    return "from-pink-500/15 via-rose-500/10 to-transparent";
  }

  // 2. Set up auto-scrolling interval
  useEffect(() => {
    if (featuredSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredSlides.length);
    }, 5000); // Rotate every 5 seconds
    return () => clearInterval(interval);
  }, [featuredSlides]);

  if (featuredSlides.length === 0) return null;

  const currentSlide = featuredSlides[currentIndex];
  const { product, category, glowClass } = currentSlide;

  // Calculate pricing using unified product utility function (Martin Fowler's Extract Module pattern)
  const { originalPrice, discountedPrice, hasDiscount, discountPercentage } = getProductPrices(product);

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % featuredSlides.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + featuredSlides.length) % featuredSlides.length);
  };

  return (
    <div className="relative w-full mb-6 sm:mb-10 select-none group">
      
      {/* Slider Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={product.id}
          initial={{ opacity: 0, x: lang === "ar" ? -20 : 20, scale: 0.99 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: lang === "ar" ? 20 : -20, scale: 0.99 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="bg-slate-900 text-white rounded-[24px] sm:rounded-[32px] p-4 sm:p-8 relative overflow-hidden shadow-xl border border-slate-850 flex flex-row items-stretch justify-between gap-4 sm:gap-8 min-h-[160px] sm:h-[300px]"
        >
          {/* Ambient Glowing Background Effect */}
          <div className={`absolute top-0 inset-x-0 bottom-0 bg-gradient-to-tr ${glowClass} pointer-events-none z-0`} />

          {/* Product Image Stage (First in JSX -> Right in RTL, Left in LTR) */}
          <div 
            onClick={() => onPromoClick && onPromoClick(product)}
            className="w-20 h-20 sm:w-52 sm:h-52 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-2xl sm:rounded-3xl p-1.5 sm:p-5 flex items-center justify-center shrink-0 border border-white/10 shadow-inner z-10 cursor-pointer transition-all duration-300 transform hover:scale-105 self-center"
          >
             <img 
              src={product.image} 
              alt={product.name} 
              className="max-h-full max-w-full object-contain filter drop-shadow-lg"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Product Offer Details (Second in JSX -> Left in RTL, Right in LTR) */}
          <div className={`flex-1 flex flex-col justify-between py-1 sm:py-2 z-10 w-full min-w-0 ${lang === "ar" ? "text-right" : "text-left"}`}>
            <div>
              <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-1.5 sm:mb-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 border border-blue-500/30 px-2 sm:px-3 py-0.5 text-[8px] sm:text-[9px] font-black text-blue-400">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span>{category}</span>
                </span>
                {hasDiscount && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/20 border border-rose-500/30 px-2 sm:px-3 py-0.5 text-[8px] sm:text-[9px] font-black text-rose-400">
                    <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    <span>{lang === "ar" ? `وفر ${discountPercentage}%` : `Save ${discountPercentage}%`}</span>
                  </span>
                )}
                <span className="text-[8px] sm:text-[9px] text-amber-300 font-extrabold hidden xs:inline-block">
                  {storeSettings?.heroBadge || (lang === "ar" ? "منتج اليوم ⭐️" : "Product of the Day ⭐️")}
                </span>
              </div>

              <h3 
                onClick={() => onPromoClick && onPromoClick(product)}
                className="text-xs sm:text-2xl font-black text-white hover:text-blue-400 cursor-pointer transition-colors leading-tight line-clamp-1 sm:line-clamp-2"
                title={product.name}
              >
                {product.name}
              </h3>
              
              <p className="text-[11px] sm:text-sm text-slate-300 mt-2 leading-relaxed hidden sm:line-clamp-2 max-w-xl font-medium">
                {product.description || storeSettings?.heroSubtitle || (lang === "ar" ? "تصفح أحدث عروض NileTechno المميزة والمدعومة بضمان كامل من الوكلاء المعتمدين." : "Browse the latest featured offers from NileTechno supported by a full warranty from authorized agents.")}
              </p>
            </div>

            {/* Pricing and Button */}
            <div className="mt-3 sm:mt-5 flex items-center justify-between sm:justify-start gap-4 sm:gap-8">
              <div className="flex flex-col">
                <span className="text-xs sm:text-2xl font-black text-blue-400 font-mono">
                  {discountedPrice} {storeCurrency}
                </span>
                {hasDiscount && (
                  <span className="text-[9px] sm:text-xs text-slate-400 line-through font-mono font-bold">
                    {originalPrice} {storeCurrency}
                  </span>
                )}
              </div>

              <button 
                onClick={() => onPromoClick && onPromoClick(product)}
                className="bg-white hover:bg-slate-100 text-slate-900 font-black px-3.5 sm:px-6 py-1.5 sm:py-3 rounded-xl sm:rounded-2xl text-[10px] sm:text-xs transition-all active:scale-95 shadow-md cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0"
              >
                <span>{storeSettings?.heroCtaText || (lang === "ar" ? "تسوق الآن" : "Shop Now")}</span>
                <ArrowRight className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${lang === "ar" ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>

        </motion.div>
      </AnimatePresence>

      {/* Manual Sliding Chevron controls (Hidden on mobile touch screens, visible on hover desktop) */}
      {featuredSlides.length > 1 && (
        <>
          <button 
            onClick={handlePrev}
            className={`absolute top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-full transition-all border border-slate-200 dark:border-slate-700 backdrop-blur-xs shadow-md opacity-0 group-hover:opacity-100 z-20 cursor-pointer ${lang === "ar" ? "-right-4" : "-left-4"}`}
            title="السابق"
          >
            {lang === "ar" ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          
          <button 
            onClick={handleNext}
            className={`absolute top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-full transition-all border border-slate-200 dark:border-slate-700 backdrop-blur-xs shadow-md opacity-0 group-hover:opacity-100 z-20 cursor-pointer ${lang === "ar" ? "-left-4" : "-right-4"}`}
            title="التالي"
          >
            {lang === "ar" ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </>
      )}

      {/* Bullet Slide Indicator Dots */}
      {featuredSlides.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {featuredSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${currentIndex === idx ? "w-6 bg-blue-600" : "w-1.5 bg-slate-300 hover:bg-slate-400"}`}
              title={`الانتقال للشريحة ${idx + 1}`}
            />
          ))}
        </div>
      )}

    </div>
  );
}
