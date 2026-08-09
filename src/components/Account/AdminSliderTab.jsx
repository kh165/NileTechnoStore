import React, { useState } from "react";
import { Sparkles, Loader2, X, Search, ChevronDown, ChevronUp, Check, Layers, Eye, MoveLeft, Tag, ArrowRight, ShieldCheck } from "lucide-react";
import { getCategoryIcon } from "../../lib/categoryUtils";
import { getProductPrices } from "../../lib/productUtils";

export default function AdminSliderTab(props) {
  const {
    products = [],
    isLoadingFeatured = props.isLoading || false,
    isSavingFeatured = false,
  } = props;

  const selectedFeaturedIds = props.selectedFeaturedIds || props.selectedIds || [];
  const setSelectedFeaturedIds = props.setSelectedFeaturedIds || (() => {});
  const onSaveFeatured = props.onSaveFeatured || props.onSave || (() => {});
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({});
  const [previewIndex, setPreviewIndex] = useState(0);

  // Unique categories list
  const uniqueCategories = Array.from(new Set(products.map((p) => p.category || "عام"))).filter(Boolean);
  const isSearchActive = productSearchQuery.trim() !== "";

  const isCategoryExpanded = (cat) => {
    if (expandedCategories[cat] !== undefined) {
      return expandedCategories[cat];
    }
    return true; // default expanded
  };

  const toggleCategory = (cat) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [cat]: !isCategoryExpanded(cat),
    }));
  };

  // Group products by category
  const groupedProducts = {};
  uniqueCategories.forEach((cat) => {
    const catProducts = products.filter((p) => {
      if (p.category !== cat) return false;
      if (!isSearchActive) return true;
      const name = (p.name_ar || p.name || p.title || "").toLowerCase();
      const categoryText = (p.category || "").toLowerCase();
      const q = productSearchQuery.toLowerCase();
      return name.includes(q) || categoryText.includes(q);
    });
    if (catProducts.length > 0) {
      groupedProducts[cat] = catProducts;
    }
  });

  const visibleCategories = Object.keys(groupedProducts);

  // Selected products array for preview
  const selectedProducts = selectedFeaturedIds
    .map((id) => products.find((p) => String(p.id) === String(id)))
    .filter(Boolean);

  const previewProduct = selectedProducts[previewIndex] || selectedProducts[0] || products[0];

  return (
    <div className="bg-white border border-slate-200/90 rounded-[28px] p-5 sm:p-6 shadow-xs space-y-7 font-sans text-right">
      
      {/* Hero Banner Header - NileTechno Navy Style */}
      <div className="bg-gradient-to-r from-[#072d5c] via-[#093c7a] to-[#072d5c] text-white rounded-[26px] p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-blue-900/50">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-sky-200 rounded-full text-[10px] font-black">
            <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>عروض السلايدر والبانر الرئيسي</span>
          </div>
          <h2 className="text-base sm:text-xl font-black text-white">التحكم بالمنتجات المعروضة في أعلى واجهة الموقع</h2>
          <p className="text-xs text-blue-100/90 font-bold max-w-2xl leading-relaxed">
            حدد المنتجات المميزة للظهور في البانر الرئيسي بالصفحة الرئيسية لزوار المتجر.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 self-end md:self-center shrink-0">
          {isSavingFeatured ? (
            <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500/20 text-blue-300 border border-blue-400/40 rounded-2xl text-xs font-black animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-blue-300" />
              <span>جاري حفظ التعديلات...</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded-2xl text-xs font-black">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>متصل ومحدث فورياً ⚡</span>
            </span>
          )}
        </div>
      </div>

      {/* Live Interactive Hero Banner Mockup Preview */}
      {previewProduct && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[28px] p-6 text-white space-y-4 border border-slate-700/80 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
            <span className="text-xs font-black text-amber-400 flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>معاينة البانر الرئيسي:</span>
            </span>
            <div className="flex items-center gap-2">
              {selectedProducts.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPreviewIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                    previewIndex === idx ? "bg-amber-400 w-6" : "bg-white/30 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-2">
            
            {/* Image Box */}
            <div className="md:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-center h-48 relative group">
              <img 
                src={previewProduct.image} 
                alt={previewProduct.name} 
                className="max-h-full max-w-full object-contain filter drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              {previewProduct.oldPrice && (
                <span className="absolute top-3 right-3 bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                  خصم مميز 🔥
                </span>
              )}
            </div>

            {/* Product Details Box */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black">
                  {previewProduct.category || "القسم العام"}
                </span>
                <span className="text-[10px] text-amber-300/90 font-bold flex items-center gap-1">
                  <span>العرض الحصري اليوم</span>
                  <span>⭐️</span>
                </span>
              </div>

              <h3 className="text-base sm:text-xl font-black text-white line-clamp-1">
                {previewProduct.name_ar || previewProduct.name}
              </h3>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-normal">
                {previewProduct.description || "منتجات أصلية مع ضمان شامل وتوصيل سريع لجميع المحافظات."}
              </p>

              <div className="flex items-center gap-4 pt-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {previewProduct.price} <span className="text-xs">ج.م</span>
                  </span>
                  {previewProduct.oldPrice && (
                    <span className="text-xs text-slate-400 line-through font-mono">
                      {previewProduct.oldPrice} ج.م
                    </span>
                  )}
                </div>

                <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-md">
                  <span>تسوق الآن</span>
                  <MoveLeft className="w-4 h-4" />
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {isLoadingFeatured ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-xs font-bold">جاري تحميل إعدادات السلايدر...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Currently Selected Products */}
          <div className="lg:col-span-1 bg-slate-50/90 rounded-[24px] border border-slate-200 p-5 space-y-4 self-start lg:sticky lg:top-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <span className="text-xs font-black text-slate-900 border-r-3 border-amber-500 pr-2">
                المنتجات المفعلة في السلايدر ({selectedFeaturedIds.length})
              </span>
              {selectedFeaturedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFeaturedIds([]);
                    onSaveFeatured([]);
                  }}
                  className="text-[10px] font-black text-rose-600 hover:underline cursor-pointer"
                >
                  إلغاء الكل
                </button>
              )}
            </div>

            {selectedFeaturedIds.length === 0 ? (
              <div className="text-center py-10 bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2">
                <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-700 font-black">لا توجد منتجات محددة للسلايدر</p>
                <p className="text-[10px] text-slate-400 font-bold leading-normal">
                  اختر المنتجات من القائمة المجاورة لإضافتها فوراً في البانر الرئيسي.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {selectedFeaturedIds.map((id, idx) => {
                  const prod = products.find((p) => String(p.id) === String(id));
                  if (!prod) return null;
                  return (
                    <div 
                      key={id} 
                      onClick={() => setPreviewIndex(idx)}
                      className={`p-3 bg-white border rounded-2xl flex items-center justify-between gap-3 shadow-2xs transition-all cursor-pointer group ${
                        previewIndex === idx ? "border-amber-400 ring-2 ring-amber-400/20" : "border-slate-200/90 hover:border-blue-400"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-5 h-5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          className="w-10 h-10 object-contain p-0.5 border border-slate-100 rounded-xl shrink-0 bg-slate-50" 
                          referrerPolicy="no-referrer" 
                        />
                        <div className="min-w-0">
                          <span className="text-[11px] font-black text-slate-900 block truncate leading-tight group-hover:text-blue-600">
                            {prod.name_ar || prod.name}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                            {prod.category} • {prod.price} ج.م
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const updated = selectedFeaturedIds.filter((x) => x !== id);
                          setSelectedFeaturedIds(updated);
                          onSaveFeatured(updated);
                        }}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer shrink-0 border border-rose-100"
                        title="إزالة من السلايدر"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Catalog Categories List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black text-slate-900 border-r-3 border-blue-600 pr-2">
                قائمة منتجات المتجر حسب الفئات
              </span>
              <span className="text-[10px] text-slate-400 font-bold">اضغط على أي منتج لإدراجه في السلايدر</span>
            </div>

            {/* Live Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث باسم المنتج أو قسم المنتجات لتسهيل الإدراج..."
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/90 rounded-2xl py-3 pr-10 pl-4 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all text-right shadow-2xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Categories Accordions */}
            {visibleCategories.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold">لم نجد أي منتجات تطابق البحث الحالية.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {visibleCategories.map((cat) => {
                  const catProducts = groupedProducts[cat] || [];
                  const selectedInThisCategory = catProducts.filter((p) =>
                    selectedFeaturedIds.includes(String(p.id))
                  ).length;

                  const isExpanded = isCategoryExpanded(cat);

                  return (
                    <div key={cat} className="border border-slate-200/90 rounded-[22px] overflow-hidden bg-white shadow-3xs transition-all">
                      
                      {/* Accordion Trigger */}
                      <div
                        onClick={() => toggleCategory(cat)}
                        className="p-4 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-150 flex items-center justify-between cursor-pointer select-none transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-xl border border-slate-200/80 flex items-center justify-center shrink-0">
                            {getCategoryIcon(cat, true)}
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-900 block leading-none">
                              {cat}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold block mt-1">
                              ({catProducts.length} منتجات متاحة)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {selectedInThisCategory > 0 && (
                            <span className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-3 py-0.5 rounded-full shadow-2xs">
                              مفعل {selectedInThisCategory} في السلايدر
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const catProdIds = catProducts.map(p => String(p.id));
                              let updated;
                              if (selectedInThisCategory === catProducts.length) {
                                // Deselect all in category
                                updated = selectedFeaturedIds.filter(id => !catProdIds.includes(String(id)));
                              } else {
                                // Select all in category
                                const newIds = catProdIds.filter(id => !selectedFeaturedIds.includes(String(id)));
                                updated = [...selectedFeaturedIds, ...newIds];
                              }
                              setSelectedFeaturedIds(updated);
                              onSaveFeatured(updated);
                            }}
                            className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                          >
                            {selectedInThisCategory === catProducts.length ? "إلغاء القسم" : "اختيار القسم بالكامل"}
                          </button>

                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Accordion Items Grid */}
                      {isExpanded && (
                        <div className="p-4 bg-white">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {catProducts.map((p) => {
                              const isChosen = selectedFeaturedIds.includes(String(p.id));
                              return (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    let updated;
                                    if (isChosen) {
                                      updated = selectedFeaturedIds.filter((id) => id !== String(p.id));
                                    } else {
                                      updated = [...selectedFeaturedIds, String(p.id)];
                                    }
                                    setSelectedFeaturedIds(updated);
                                    onSaveFeatured(updated);
                                  }}
                                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                                    isChosen
                                      ? "bg-blue-50/60 border-blue-400 shadow-3xs"
                                      : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50"
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <img
                                      src={p.image}
                                      alt={p.name}
                                      className="w-11 h-11 object-contain p-0.5 border border-slate-100 rounded-xl bg-slate-50 shrink-0"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="min-w-0">
                                      <span className="text-[11px] font-black text-slate-800 block truncate leading-snug">
                                        {p.name_ar || p.name}
                                      </span>
                                      <span className="text-[10px] text-emerald-600 font-extrabold font-mono block mt-0.5">
                                        {p.price} ج.م
                                      </span>
                                    </div>
                                  </div>

                                  <div className="shrink-0">
                                    {isChosen ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-white bg-blue-600 px-3 py-1.2 rounded-xl shadow-xs">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                        <span>محتسب</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.2 rounded-xl border border-slate-200 transition-colors">
                                        <span>+ إدراج</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

