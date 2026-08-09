import React from "react";
import { Tag, Sparkles, Award, Grid } from "lucide-react";

export default function QuickLinks({
  productFilter,
  onFilterChange,
  setSelectedCategory,
  setActiveTab,
  lang
}) {
  const handleScrollToProducts = () => {
    document.getElementById("products-grid-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-10 mt-3 sm:mt-6">
      {/* 1. Offers / العروض */}
      <button
        onClick={() => {
          onFilterChange("offers");
          setSelectedCategory("الكل");
          handleScrollToProducts();
        }}
        className={`group flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-300 active:opacity-85 cursor-pointer relative ${
          productFilter === "offers"
            ? "bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 shadow-xs scale-102"
            : "bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-750 border-slate-100 dark:border-slate-700/80 hover:border-slate-200 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white shadow-3xs"
        }`}
      >
        <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-all duration-300 shadow-3xs ${
          productFilter === "offers"
            ? "bg-indigo-600 text-white"
            : "bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 group-hover:bg-indigo-100/80 dark:group-hover:bg-indigo-900/80 group-hover:scale-105"
        }`}>
          <Tag className="w-5 h-5" />
        </div>
        <div className="flex flex-col items-center sm:items-start text-center sm:text-right">
          <span className={`text-[11px] sm:text-[13px] font-black tracking-tight ${
            productFilter === "offers" ? "text-indigo-700 dark:text-indigo-300" : "text-slate-800 dark:text-slate-100"
          }`}>
            {lang === "ar" ? "العروض" : "Offers"}
          </span>
          <span className="hidden sm:inline-block text-[10px] text-slate-400 dark:text-slate-400 font-bold leading-none mt-0.5">
            {lang === "ar" ? "خصومات حصرية" : "Exclusive deals"}
          </span>
        </div>
      </button>

      {/* 2. New / الجديد */}
      <button
        onClick={() => {
          onFilterChange("new");
          setSelectedCategory("الكل");
          handleScrollToProducts();
        }}
        className={`group flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-300 active:opacity-85 cursor-pointer relative ${
          productFilter === "new"
            ? "bg-teal-50/90 dark:bg-teal-950/70 border-teal-200 dark:border-teal-800 text-teal-950 dark:text-teal-200 shadow-xs scale-102"
            : "bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-750 border-slate-100 dark:border-slate-700/80 hover:border-slate-200 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white shadow-3xs"
        }`}
      >
        <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-all duration-300 shadow-3xs ${
          productFilter === "new"
            ? "bg-teal-600 text-white"
            : "bg-teal-50 dark:bg-teal-900/50 text-teal-600 dark:text-teal-300 group-hover:bg-teal-100/80 dark:group-hover:bg-teal-900/80 group-hover:scale-105"
        }`}>
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex flex-col items-center sm:items-start text-center sm:text-right">
          <span className={`text-[11px] sm:text-[13px] font-black tracking-tight ${
            productFilter === "new" ? "text-teal-700 dark:text-teal-300" : "text-slate-800 dark:text-slate-100"
          }`}>
            {lang === "ar" ? "الجديد" : "New"}
          </span>
          <span className="hidden sm:inline-block text-[10px] text-slate-400 dark:text-slate-400 font-bold leading-none mt-0.5">
            {lang === "ar" ? "وصل حديثاً" : "Just arrived"}
          </span>
        </div>
      </button>

      {/* 3. Featured / المميز */}
      <button
        onClick={() => {
          onFilterChange("featured");
          setSelectedCategory("الكل");
          handleScrollToProducts();
        }}
        className={`group flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-300 active:opacity-85 cursor-pointer relative ${
          productFilter === "featured"
            ? "bg-amber-50/90 dark:bg-amber-950/70 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 shadow-xs scale-102"
            : "bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-750 border-slate-100 dark:border-slate-700/80 hover:border-slate-200 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white shadow-3xs"
        }`}
      >
        <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-all duration-300 shadow-3xs ${
          productFilter === "featured"
            ? "bg-amber-500 text-white"
            : "bg-amber-50 dark:bg-amber-900/50 text-amber-600 dark:text-amber-300 group-hover:bg-amber-100/80 dark:group-hover:bg-amber-900/80 group-hover:scale-105"
        }`}>
          <Award className="w-5 h-5" />
        </div>
        <div className="flex flex-col items-center sm:items-start text-center sm:text-right">
          <span className={`text-[11px] sm:text-[13px] font-black tracking-tight ${
            productFilter === "featured" ? "text-amber-700 dark:text-amber-300" : "text-slate-800 dark:text-slate-100"
          }`}>
            {lang === "ar" ? "المميز" : "Featured"}
          </span>
          <span className="hidden sm:inline-block text-[10px] text-slate-400 dark:text-slate-400 font-bold leading-none mt-0.5">
            {lang === "ar" ? "الأكثر طلباً" : "Most popular"}
          </span>
        </div>
      </button>

      {/* 4. Store / المتجر */}
      <button
        onClick={() => {
          setActiveTab("categories");
        }}
        className="group flex flex-col sm:flex-row items-center gap-1.5 sm:gap-3 p-2.5 sm:p-3.5 rounded-2xl border transition-all duration-300 active:opacity-85 cursor-pointer relative bg-white dark:bg-slate-800/90 hover:bg-rose-50/20 dark:hover:bg-slate-750 border-slate-100 dark:border-slate-700/80 hover:border-rose-150 dark:hover:border-slate-600 shadow-3xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white"
      >
        <div className="w-11 h-11 shrink-0 rounded-xl bg-rose-50 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300 flex items-center justify-center transition-all duration-300 shadow-3xs group-hover:bg-rose-100/80 dark:group-hover:bg-rose-900/80 group-hover:scale-105">
          <Grid className="w-5 h-5" />
        </div>
        <div className="flex flex-col items-center sm:items-start text-center sm:text-right">
          <span className="text-[11px] sm:text-[13px] font-black tracking-tight text-slate-800 dark:text-slate-100">
            {lang === "ar" ? "أقسام" : "Categories"}
          </span>
          <span className="hidden sm:inline-block text-[10px] text-slate-400 dark:text-slate-400 font-bold leading-none mt-0.5">
            {lang === "ar" ? "تصفح الأقسام" : "All categories"}
          </span>
        </div>
      </button>
    </div>
  );
}
