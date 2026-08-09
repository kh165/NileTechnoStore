import React from "react";
import { getCategoryIcon } from "../../lib/categoryUtils";

export default function CategoriesTab(props) {
  const {
    categoriesList = props.categories || [],
    selectedCategory = "الكل",
    getCategoryCount = () => 0,
    setSelectedCategory = () => {},
    setActiveTab = () => {},
    lang = "ar",
    setProductFilter = () => {}
  } = props;

  return (
    <div className="p-5 max-w-7xl xl:max-w-[1450px] 2xl:max-w-[1700px] 3xl:max-w-[1920px] mx-auto pt-1 pb-8">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
        <h2 className="text-base font-extrabold text-slate-950">{lang === "ar" ? "المتجر والقطاعات" : "Store Categories"}</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {categoriesList.map((cat, idx) => {
          const isSelected = selectedCategory === cat.name;
          const prodCount = getCategoryCount(cat.name);
          return (
            <button
              key={idx}
              onClick={() => {
                setSelectedCategory(cat.name);
                if (setProductFilter) {
                  setProductFilter("all");
                }
                setActiveTab("home");
              }}
              className={`p-6 rounded-[28px] border ${lang === "ar" ? "text-right" : "text-left"} transition-all flex flex-col justify-between items-slate-stretch min-h-[170px] h-auto w-full cursor-pointer relative overflow-hidden group hover:-translate-y-1 bg-gradient-to-br from-[#06244a] to-[#0a356b] text-white ${
                isSelected 
                  ? "border-amber-400 shadow-xl shadow-blue-950/40 ring-4 ring-amber-500/20 scale-[1.02]" 
                  : "border-slate-800/20 shadow-md hover:border-blue-700/60"
              }`}
              dir={lang === "ar" ? "rtl" : "ltr"}
            >
              {/* Background glows */}
              <div className="absolute -right-10 -bottom-10 w-28 h-28 rounded-full bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-all duration-500"></div>

              <div className="flex items-center justify-between w-full flex-row">
                <div className={`p-3 rounded-2xl ${isSelected ? "bg-amber-500/25 text-amber-300" : "bg-white/10 text-blue-200"} shrink-0`}>
                  {getCategoryIcon(cat.name, isSelected)}
                </div>
                <span className={`text-[9px] font-black px-3 py-1 rounded-full ${isSelected ? "bg-amber-400 text-slate-950 shadow-sm" : "bg-white/10 text-blue-200/80"}`}>
                  {isSelected ? "القسم النشط" : `${prodCount} ${lang === "ar" ? "منتج" : "products"}`}
                </span>
              </div>
              <div className="w-full text-right mt-auto pt-6 space-y-1 z-10">
                <span className={`block text-[10px] font-bold tracking-wider transition-colors ${isSelected ? "text-amber-300" : "text-blue-300/80"}`}>
                  {lang === "ar" ? "تصفح المنتجات" : "Browse products"} &larr;
                </span>
                <span className="block text-sm sm:text-base font-black leading-snug">
                  {cat.name === "الكل" ? (lang === "ar" ? "كافة المجموعات والمنتجات" : "All Collections & Products") : cat.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
