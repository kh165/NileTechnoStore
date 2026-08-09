import React, { useState } from "react";
import { motion } from "motion/react";
import { Search, X, HelpCircle, Sparkles } from "lucide-react";
import FeaturedBanner from "./FeaturedBanner";
import QuickLinks from "./QuickLinks";
import CategoryBar from "./CategoryBar";
import SmartFilters from "./SmartFilters";
import ProductCard from "./ProductCard";
import ProductSkeleton from "./ProductSkeleton";
import AiSmartSearchModal from "../Common/AiSmartSearchModal";

export default function HomeTab(props) {
  const {
    lang = "ar",
    allProducts = [],
    searchQuery = "",
    setSearchQuery = () => {},
    setActiveTab = () => {},
    promoProduct,
    promoImage,
    promoTitle,
    promoDesc,
    promoTagline,
    setSelectedProduct = props.onProductClick || (() => {}),
    productFilter = "all",
    setProductFilter = () => {},
    selectedCategory = "الكل",
    setSelectedCategory = () => {},
    categoriesList = [],
    getCategoryCount = () => 0,
    isFilterPanelOpen = false,
    setIsFilterPanelOpen = () => {},
    sortBy = "default",
    setSortBy = () => {},
    minPrice = 0,
    setMinPrice = () => {},
    maxPrice = 10000,
    setMaxPrice = () => {},
    showOnlyInStock = false,
    setShowOnlyInStock = () => {},
    processedProducts = props.products || [],
    storeCurrency = "ج.م",
    isInitialLoading = false,
    isLoading = false,
    handleAddToCart = props.onAddToCart || (() => {}),
    wishlist = [],
    toggleWishlist = props.onToggleWishlist || (() => {}),
    getGridColsClass = props.getGridColsClass || ((count) => {
      if (count === 1) return "grid-cols-1 max-w-sm mx-auto";
      if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto";
      if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      return "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
    })
  } = props;
  const [isAiSearchOpen, setIsAiSearchOpen] = useState(false);

  return (
    <div className="w-full pb-16">
      {/* Redesigned Search bar section with Gemini AI Button */}
      <div className="max-w-xl mx-auto px-4 mt-1 relative z-10 space-y-2">
        <div className="relative w-full shadow-3xs hover:shadow-2xs focus-within:shadow-xs focus-within:ring-4 focus-within:ring-slate-100/50 bg-white border border-slate-200 focus-within:border-slate-300 rounded-2xl transition-all duration-300 flex items-center p-1">
          <div className={`absolute ${lang === "ar" ? "right-3.5" : "left-3.5"} text-slate-400 pointer-events-none`}>
            <Search className="w-4 h-4" />
          </div>
          <input 
            type="text"
            placeholder={lang === "ar" ? "ابحث بالاسم، الفئة، المواصفات..." : "Search name, category, specs..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full py-2.5 text-xs text-slate-800 outline-none placeholder-slate-400 bg-transparent font-bold ${
              lang === "ar" ? "pr-10 pl-12 text-right" : "pl-10 pr-12 text-left"
            }`}
          />
          
          <div className={`absolute ${lang === "ar" ? "left-3" : "right-3"} flex items-center`}>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Gemini AI Smart Search Trigger Button */}
        <button
          onClick={() => setIsAiSearchOpen(true)}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-[#072d5c] via-[#0b3e7a] to-[#0d4f9c] hover:opacity-95 text-white text-xs font-black rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer border border-sky-400/20 active:scale-98"
        >
          <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
          <span>البحث السريع واقتراحات المنتجات ✨</span>
        </button>
      </div>

      {/* Gemini AI Modal */}
      <AiSmartSearchModal
        isOpen={isAiSearchOpen}
        onClose={() => setIsAiSearchOpen(false)}
        allProducts={allProducts}
        setSelectedProduct={setSelectedProduct}
        handleAddToCart={handleAddToCart}
        storeCurrency={storeCurrency}
        lang={lang}
      />

      {/* Central content container */}
      <div className="max-w-7xl xl:max-w-[1450px] 2xl:max-w-[1700px] 3xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 mt-3">
        
        {/* Main Hero Featured Banner */}
        {allProducts && allProducts.length > 0 && (
          <FeaturedBanner
            allProducts={allProducts}
            lang={lang}
            onPromoClick={setSelectedProduct}
            storeCurrency={storeCurrency}
          />
        )}

        {/* 4 Quick Links Grid */}
        <QuickLinks
          productFilter={productFilter}
          onFilterChange={setProductFilter}
          setSelectedCategory={setSelectedCategory}
          setActiveTab={setActiveTab}
          lang={lang}
        />

        {/* Fast Categories Navigation Bar */}
        <CategoryBar
          categoriesList={categoriesList}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onFilterChange={setProductFilter}
          getCategoryCount={getCategoryCount}
          lang={lang}
          setActiveTab={setActiveTab}
        />

        {/* Dynamic Product Grid */}
        <div id="products-grid-section" className="scroll-mt-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {productFilter === "offers" && (lang === "ar" ? "عروض خاصة وتخفيضات" : "Special Offers & Discounts")}
                {productFilter === "new" && (lang === "ar" ? "وصلنا حديثاً" : "New Arrivals")}
                {productFilter === "featured" && (lang === "ar" ? "المنتجات المميزة" : "Featured Products")}
                {productFilter === "all" && (lang === "ar" ? `منتجات قسم: ${selectedCategory}` : `Products of: ${selectedCategory}`)}
              </h3>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 font-black px-2.5 py-1 rounded-full border border-slate-200/50 dark:border-slate-700">
                {processedProducts.length} {lang === "ar" ? "منتج" : "products"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {productFilter !== "all" && (
                <button
                  onClick={() => setProductFilter("all")}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  {lang === "ar" ? "عرض كافة المنتجات ×" : "Show all products ×"}
                </button>
              )}

              <SmartFilters
                isFilterPanelOpen={isFilterPanelOpen}
                setIsFilterPanelOpen={setIsFilterPanelOpen}
                sortBy={sortBy}
                setSortBy={setSortBy}
                minPrice={minPrice}
                setMinPrice={setMinPrice}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                showOnlyInStock={showOnlyInStock}
                setShowOnlyInStock={setShowOnlyInStock}
                processedProductsLength={processedProducts.length}
                storeCurrency={storeCurrency}
                lang={lang}
              />
            </div>
          </div>

          {isInitialLoading ? (
            <ProductSkeleton count={10} lang={lang} />
          ) : processedProducts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-12 text-center border border-slate-100 text-slate-400 max-w-lg mx-auto shadow-sm"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 mb-4 animate-bounce">
                <HelpCircle className="h-8 w-8" />
              </div>
              <h4 className="text-base font-extrabold text-slate-800 mb-1.5">
                {lang === "ar" ? "عذراً، لم نجد أي نتائج تطابق اختيارك" : "Sorry, no products match your filter"}
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mb-6">
                {lang === "ar" 
                  ? "جرب إزالة كلمات البحث أو تصفح الأقسام الأخرى لاستكشاف منتجات مميزة." 
                  : "Try clearing search queries or browse different categories."}
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("الكل");
                  setProductFilter("all");
                  setSortBy("default");
                  setShowOnlyInStock(false);
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-md"
              >
                {lang === "ar" ? "عرض جميع المنتجات" : "View All Products"}
              </button>
            </motion.div>
          ) : (
            <div className="relative w-full">
              {isLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-50/40 backdrop-blur-[1px] transition-all duration-300 min-h-[250px]">
                  <div className="flex flex-col items-center gap-3 bg-white px-6 py-5 rounded-3xl shadow-xl border border-slate-100/80 animate-in fade-in-0 zoom-in-95 duration-200">
                    <div className="relative flex items-center justify-center w-14 h-14">
                      <div className="absolute inset-0 rounded-full border-2 border-slate-100 border-t-blue-600 border-r-emerald-500 animate-spin"></div>
                      <img
                        src="/logo3.webp"
                        alt="Loading"
                        className="w-8 h-8 rounded-full object-contain animate-pulse"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="text-[10px] font-black text-slate-700 tracking-wide select-none">
                      {lang === "ar" ? "جاري تحديث المنتجات..." : "Updating products..."}
                    </span>
                  </div>
                </div>
              )}
              <div className={`grid gap-4 sm:gap-6 transition-all duration-300 ${isLoading ? "opacity-60 pointer-events-none" : "opacity-100"} ${getGridColsClass(processedProducts.length)}`}>
                {processedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                    onViewDetails={setSelectedProduct}
                    storeCurrency={storeCurrency}
                    isWishlisted={wishlist.some(item => item.id === product.id)}
                    onToggleWishlist={toggleWishlist}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
