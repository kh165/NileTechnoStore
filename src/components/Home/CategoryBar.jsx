import React from "react";
import { ArrowRight } from "lucide-react";
import { getCategoryIcon } from "../../lib/categoryUtils";

export default function CategoryBar({
  categoriesList,
  selectedCategory,
  onSelectCategory,
  onFilterChange,
  getCategoryCount,
  lang,
  setActiveTab
}) {

  return (
    <div className="mb-5 sm:mb-8">
      <div className="flex items-center justify-between mb-2.5 sm:mb-4">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white font-sans">
            {lang === "ar" ? "التصنيفات" : "Categories"}
          </h3>
        </div>
        <button
          onClick={() => setActiveTab("categories")}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-all active:translate-x-1"
        >
          <span>{lang === "ar" ? "عرض الكل" : "View All"}</span>
          <ArrowRight className={`w-3.5 h-3.5 ${lang === "ar" ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto lg:justify-center pb-3 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {categoriesList.map((cat, idx) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={idx}
              onClick={() => {
                onSelectCategory(cat.name);
                onFilterChange("all");
              }}
              className={`flex items-center gap-2.5 px-4.5 py-3 rounded-2xl text-[12px] font-black border shrink-0 transition-all duration-300 cursor-pointer relative active:opacity-85 ${
                isSelected 
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white shadow-3xs"
              }`}
            >
              {getCategoryIcon(cat.name, isSelected)}
              <span>
                {lang === "ar" ? cat.name : (cat.name === "الكل" ? "All" : cat.name)}
              </span>
              <span className={`text-[10px] w-5.5 h-5.5 shrink-0 flex items-center justify-center rounded-full font-black font-mono transition-all duration-200 ${
                isSelected 
                  ? "bg-white/20 text-white border border-white/30 font-black" 
                  : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-bold border border-slate-200/40 dark:border-slate-600"
              }`}>
                {getCategoryCount(cat.name)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
