import React, { useState, useEffect, useMemo } from "react";
import { Tag, Search, Sparkles, Loader2, RefreshCw, Zap, Percent } from "lucide-react";
import { shopApi } from "../../api";
import { getDiscountsFromFirestore } from "../../lib/firebaseService";

export default function AdminDiscountsTab({ storeCurrency = "ج.م" }) {
  const [products, setProducts] = useState([]);
  const [discountsMap, setDiscountsMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, firestoreDiscounts] = await Promise.all([
        shopApi.getProducts(),
        getDiscountsFromFirestore()
      ]);
      setProducts(prods || []);
      setDiscountsMap(firestoreDiscounts || {});
    } catch (err) {
      console.error("Error loading discounts data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter products that have discounts (either via discount_price in API or discountsMap)
  const discountedProducts = useMemo(() => {
    return products.filter((p) => {
      const rawPrice = Number(p.price) || 0;
      const rawDiscPrice = Number(p.discount_price) || 0;
      const hasApiDiscount = rawDiscPrice > 0 && rawDiscPrice < rawPrice;
      const firestoreDisc = discountsMap[String(p.id)];
      
      const isDiscounted = hasApiDiscount || !!firestoreDisc;
      if (!isDiscounted) return false;

      if (!searchQuery) return true;
      const name = (p.name_ar || p.name || p.title || "").toLowerCase();
      return name.includes(searchQuery.toLowerCase());
    });
  }, [products, discountsMap, searchQuery]);

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
        <p className="text-xs font-black text-slate-600">جاري تحميل وسحب قائمة العروض والخصومات المتاحة...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#072d5c] via-[#093c7a] to-[#072d5c] text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-blue-900/50">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-sky-200 rounded-full text-xs font-black">
            <Tag className="w-3.5 h-3.5 text-sky-300" />
            <span>شاشة عرض العروض والتخفيضات القائمة (Read-Only Deals)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">العروض والتخفيضات الفعالة</h2>
          <p className="text-xs text-blue-100/90 font-bold leading-relaxed">
            استعراض مباشر لكافة العروض والخصومات
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-center min-w-[110px]">
            <span className="text-[10px] font-bold text-blue-200 block">إجمالي العروض</span>
            <span className="text-xl font-black text-amber-300 font-mono block">{discountedProducts.length}</span>
          </div>
          <button
            onClick={loadData}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all cursor-pointer border border-white/20"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4 text-sky-300" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="البحث في عروض المنتجات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 text-right"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
        </div>

        <span className="text-xs font-black text-slate-500">
          عدد المنتجات المخصومة المعروضة: <strong className="text-blue-900 font-mono">{discountedProducts.length}</strong>
        </span>
      </div>

      {/* Display List */}
      {discountedProducts.length === 0 ? (
        <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-slate-100">
          <Zap className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-xs font-bold text-slate-500">لا توجد عروض أو تخفيضات مطابقة للبحث حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {discountedProducts.map((product) => {
            const originalPrice = Number(product.price) || 0;
            const apiDisc = Number(product.discount_price) || 0;
            const firestoreDisc = discountsMap[String(product.id)];

            let discountedPrice = originalPrice;
            let percentOff = 0;

            if (firestoreDisc && firestoreDisc.newPrice) {
              discountedPrice = firestoreDisc.newPrice;
              percentOff = firestoreDisc.discountPercent || Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
            } else if (apiDisc > 0 && apiDisc < originalPrice) {
              discountedPrice = apiDisc;
              percentOff = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
            }

            return (
              <div
                key={product.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-4 shadow-xs flex items-center gap-4 hover:shadow-md transition-all"
              >
                <img
                  src={product.image || product.image_url || "/placeholder.png"}
                  alt={product.name_ar || product.name}
                  className="w-20 h-20 object-contain rounded-2xl bg-slate-50 p-2 shrink-0 border border-slate-100"
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300"; }}
                />

                <div className="space-y-1.5 min-w-0 flex-1">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 inline-block">
                    خصم {percentOff}% ⚡
                  </span>
                  <h4 className="text-xs font-black text-slate-900 truncate">
                    {product.name_ar || product.name || product.title}
                  </h4>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-emerald-700 font-mono">
                      {discountedPrice.toLocaleString()} {storeCurrency}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 line-through font-mono">
                      {originalPrice.toLocaleString()} {storeCurrency}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
