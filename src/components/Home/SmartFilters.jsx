import React from "react";
import { SlidersHorizontal, ArrowUpDown, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function SmartFilters({
  isFilterPanelOpen,
  setIsFilterPanelOpen,
  sortBy,
  setSortBy,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  showOnlyInStock,
  setShowOnlyInStock,
  processedProductsLength,
  storeCurrency,
  lang
}) {
  const hasActiveFilters = sortBy !== "default" || showOnlyInStock || minPrice !== "" || maxPrice !== "";

  return (
    <div className="w-full">
      <div className="flex items-center justify-end">
        {/* Advanced Filters Button */}
        <button
          onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
          className={`flex items-center gap-2.5 px-4.5 py-3 rounded-2xl text-[12px] font-black transition-all duration-300 cursor-pointer border relative active:opacity-85 ${
            isFilterPanelOpen 
              ? "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-slate-950 shadow-md shadow-slate-950/20"
              : hasActiveFilters
                ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100/50 shadow-xs animate-pulse"
                : "bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 shadow-3xs hover:bg-slate-50"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{lang === "ar" ? "فلتر" : "Smart Filter & Sort"}</span>
          {hasActiveFilters && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-white"></span>
          )}
        </button>
      </div>

      {/* Expanded Smart Filter Panel */}
      <AnimatePresence>
        {isFilterPanelOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
            className="overflow-hidden mb-6 mt-4"
          >
            <div className="bg-slate-50/80 backdrop-blur-md border border-slate-200/50 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm text-right" dir="rtl">
              <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
                
                {/* 1. Compact Sorting Section */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 lg:gap-3">
                  <span className="text-[11px] font-black text-slate-800 flex items-center gap-1.5 shrink-0">
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    <span>{lang === "ar" ? "الترتيب:" : "Sort:"}</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: "default", labelAr: "الأحدث", labelEn: "Newest" },
                      { id: "price_asc", labelAr: "السعر: من الأقل", labelEn: "Price: Low-High" },
                      { id: "price_desc", labelAr: "السعر: من الأعلى", labelEn: "Price: High-Low" },
                      { id: "rating", labelAr: "التقييم الأعلى", labelEn: "Best Rating" },
                    ].map((opt) => {
                      const isSelected = sortBy === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setSortBy(opt.id)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-slate-900 text-white border-slate-950 shadow-xs"
                              : "bg-white hover:bg-slate-100 border-slate-200/60 text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {lang === "ar" ? opt.labelAr : opt.labelEn}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Precision Price Inputs */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/40 grow max-w-[280px]">
                  <span className="text-[10px] font-black text-slate-800 shrink-0">
                    {lang === "ar" ? "السعر:" : "Price:"}
                  </span>
                  <div className="flex items-center gap-1 w-full">
                    <input
                      type="number"
                      placeholder={lang === "ar" ? "من" : "Min"}
                      value={minPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || parseFloat(val) >= 0) {
                          setMinPrice(val);
                        }
                      }}
                      className="w-full text-center text-[11px] font-extrabold border border-slate-100 rounded-lg py-1 bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 placeholder-slate-400 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-slate-300 text-[10px] font-bold shrink-0">—</span>
                    <input
                      type="number"
                      placeholder={lang === "ar" ? "إلى" : "Max"}
                      value={maxPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || parseFloat(val) >= 0) {
                          setMaxPrice(val);
                        }
                      }}
                      className="w-full text-center text-[11px] font-extrabold border border-slate-100 rounded-lg py-1 bg-slate-50/50 focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800 placeholder-slate-400 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-[9px] font-black text-blue-600 font-mono shrink-0">
                      {storeCurrency}
                    </span>
                  </div>
                </div>

                {/* 3. Availability Toggle & Stats */}
                <div className="flex items-center justify-between lg:justify-end gap-3 flex-wrap sm:flex-nowrap">
                  <button
                    onClick={() => setShowOnlyInStock(!showOnlyInStock)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black transition-all cursor-pointer ${
                      showOnlyInStock
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-white border-slate-200/60 text-slate-600 hover:bg-slate-100/50"
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${showOnlyInStock ? "bg-blue-600" : "bg-slate-300"}`} />
                    <span>{lang === "ar" ? "المتوفر بالمخزن فقط" : "In Stock Only"}</span>
                  </button>

                  {/* Tiny stats indicator */}
                  <div className="bg-slate-200/50 text-slate-700 px-2.5 py-1.5 rounded-xl text-[10px] font-black font-mono flex items-center gap-1.5 shrink-0">
                    <span>{processedProductsLength}</span>
                    <span className="text-slate-400 font-medium">
                      {lang === "ar" ? "منتج مطابق" : "matched"}
                    </span>
                  </div>

                  {/* Reset Button */}
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        setSortBy("default");
                        setShowOnlyInStock(false);
                        setMinPrice("");
                        setMaxPrice("");
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black transition-all cursor-pointer border border-rose-100/40 shrink-0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{lang === "ar" ? "إعادة تعيين" : "Reset"}</span>
                    </button>
                  )}
                </div>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
