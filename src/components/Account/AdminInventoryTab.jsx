import React, { useState, useMemo } from "react";
import { Package, AlertTriangle, Search, Loader2, Printer, Filter, ListFilter, FileSpreadsheet, TrendingUp, Clock, ShoppingCart, ArrowDownRight, Sparkles } from "lucide-react";
import { stockService } from "../../lib/stockService";
import { printInventoryReport } from "../../lib/reportPrinter";
import { exportProductsToExcel } from "../../lib/exportToExcel";
import PrintOptionsModal from "./PrintOptionsModal";
import Tooltip from "../Common/Tooltip";

export default function AdminInventoryTab({
  products = [],
  allOrders = [],
  isProductsLoading = false,
  storeCurrency = "ج.م"
}) {
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedStockCondition, setSelectedStockCondition] = useState("ALL"); // "ALL" | "LOW" | "ZERO" | "AVAILABLE" | "CRITICAL_PREDICTION"
  const [printModalConfig, setPrintModalConfig] = useState({ isOpen: false, title: "", onConfirm: null });

  // Compute sales per product over the last 14 days
  const salesByProduct = useMemo(() => {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const map = {};
    (allOrders || []).forEach(o => {
      if (!o) return;
      const status = (o.status || "").toUpperCase();
      if (status === "CANCELED" || status === "CANCELLED") return;

      const orderDate = new Date(o.createdAt || o.date || 0);
      if (isNaN(orderDate.getTime()) || orderDate < fourteenDaysAgo) return;

      if (Array.isArray(o.items)) {
        o.items.forEach(item => {
          const key = item.productId || item.id || item.name;
          if (key) {
            map[key] = (map[key] || 0) + (parseInt(item.quantity) || 1);
          }
        });
      }
    });
    return map;
  }, [allOrders]);

  // Stockout Prediction Logic
  const getStockPrediction = (p) => {
    const currentStock = stockService.getProductStock(p.id, p);
    const sold14Days = salesByProduct[p.id] || salesByProduct[p.name] || salesByProduct[p.title] || 0;
    const dailyRate = sold14Days / 14;

    let daysLeft = Infinity;
    if (dailyRate > 0) {
      daysLeft = Math.floor(currentStock / dailyRate);
    } else if (currentStock === 0) {
      daysLeft = 0;
    }

    const recommendedRestock = Math.max(0, Math.ceil((dailyRate * 30) - currentStock));

    return {
      sold14Days,
      dailyRate: dailyRate.toFixed(1),
      dailyRateNum: dailyRate,
      daysLeft,
      recommendedRestock
    };
  };

  const lowStockItems = stockService.getLowStockProducts(products);

  // Critical items (will run out in 7 days or already 0)
  const criticalItems = useMemo(() => {
    return products.filter(p => {
      const pred = getStockPrediction(p);
      return pred.daysLeft <= 7;
    });
  }, [products, salesByProduct]);

  // Total restock needed for store
  const totalRestockNeeded = useMemo(() => {
    return products.reduce((sum, p) => {
      const pred = getStockPrediction(p);
      return sum + pred.recommendedRestock;
    }, 0);
  }, [products, salesByProduct]);

  // Extract unique categories
  const categoriesList = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  // Filter products based on controls
  const filteredProducts = products.filter(p => {
    const name = (p.name_ar || p.name || p.title || "").toLowerCase();
    const matchesSearch = name.includes(productSearchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedCategory !== "ALL" && p.category !== selectedCategory) {
      return false;
    }

    const currentStock = stockService.getProductStock(p.id, p);
    const pred = getStockPrediction(p);

    if (selectedStockCondition === "LOW" && (currentStock >= 5 || currentStock === 0)) return false;
    if (selectedStockCondition === "ZERO" && currentStock > 0) return false;
    if (selectedStockCondition === "AVAILABLE" && currentStock === 0) return false;
    if (selectedStockCondition === "CRITICAL_PREDICTION" && pred.daysLeft > 7) return false;

    return true;
  });

  const handlePrintFilteredInventory = () => {
    let catLabel = selectedCategory === "ALL" ? "جميع الأقسام" : `قسم ${selectedCategory}`;
    let stockLabel = "";
    if (selectedStockCondition === "LOW") stockLabel = " (المخزون الحرج < 5)";
    else if (selectedStockCondition === "ZERO") stockLabel = " (الأصناف المنتهية)";
    else if (selectedStockCondition === "AVAILABLE") stockLabel = " (الأصناف المتوفرة)";

    const fullFilterLabel = `${catLabel}${stockLabel}`;

    const totalValue = filteredProducts.reduce((acc, p) => acc + (stockService.getProductStock(p.id, p) * (Number(p.price) || 0)), 0);
    const totalStock = filteredProducts.reduce((acc, p) => acc + stockService.getProductStock(p.id, p), 0);
    const lowStock = filteredProducts.filter(p => stockService.getProductStock(p.id, p) < 5 && stockService.getProductStock(p.id, p) > 0).length;
    const outOfStock = filteredProducts.filter(p => stockService.getProductStock(p.id, p) === 0).length;

    setPrintModalConfig({
      isOpen: true,
      title: "تقرير حالة ومستويات المخزون",
      onConfirm: (pageSize) => {
        printInventoryReport(
          { totalValue, totalStock, lowStock, outOfStock },
          filteredProducts,
          storeCurrency,
          fullFilterLabel,
          pageSize
        );
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in text-right">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#072d5c] via-[#093c7a] to-[#072d5c] text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-blue-900/50">
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 rounded-full text-xs font-black">
            <Package className="w-3.5 h-3.5 text-sky-300" />
            <span>تتبع حالة المخزون والكميات المتاحة</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">عرض وتتبع حالة المخزون</h2>
          <p className="text-xs text-blue-100/90 font-bold leading-relaxed">
            متابعة دقيقة للكميات المتاحة وتنبيهات النقص في المخزون.
          </p>
        </div>
      </div>

      {/* Low Stock Alerts Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="bg-rose-50 border border-rose-200/60 rounded-3xl p-5 space-y-3.5">
          <div className="flex items-center gap-2 text-rose-800 font-black">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
            <h4 className="text-xs font-black text-rose-950">تنبيهات انخفاض المخزون (أقل من 5 قطع)!</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {lowStockItems.map(item => (
              <div key={item.id} className="bg-white/80 border border-rose-100 p-3 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <img src={item.image} alt={item.name} className="w-9 h-9 object-contain rounded p-0.5 border border-slate-150" referrerPolicy="no-referrer" />
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-slate-800 line-clamp-1">{item.name}</span>
                    <span className="text-[9px] text-slate-400 font-bold block">القسم: {item.category}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-rose-600 text-white font-mono text-[10px] font-black rounded-lg shrink-0">
                  متبقي: {item.stock} قطع
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stock Out Prediction & Restock Suggestion Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-4.5 rounded-3xl shadow-sm border border-indigo-800/50 space-y-1">
          <div className="flex items-center justify-between text-indigo-200">
            <span className="text-[11px] font-bold">المنتجات المهددة بالنفاذ</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-amber-400">{criticalItems.length}</span>
            <span className="text-[10px] text-indigo-200">منتج (نفاذ متوقع &le; 7 أيام)</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold">مبيعات آخر 14 يوماً</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-slate-900">
              {Object.values(salesByProduct).reduce((a, b) => a + b, 0)}
            </span>
            <span className="text-[10px] text-slate-400">قطعة مباعة إجمالاً</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-3xl border border-slate-200/90 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold">إعادة التزويد الموصى به</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-blue-700">+{totalRestockNeeded}</span>
            <span className="text-[10px] text-slate-400">قطعة مطلوبة لتغطية 30 يوماً</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          {/* Search Bar */}
          <div className="relative flex-1">
            <input 
              type="text"
              placeholder="ابحث باسم المنتج لتصفية العرض..."
              value={productSearchQuery}
              onChange={(e) => setProductSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 pr-9 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 transition-all text-right shadow-xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shrink-0 shadow-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-700 outline-none cursor-pointer pr-1"
            >
              <option value="ALL">جميع الأقسام ({products.length})</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Stock Condition Filter */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 border border-slate-200 rounded-xl shrink-0 shadow-xs">
            <ListFilter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedStockCondition}
              onChange={(e) => setSelectedStockCondition(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-700 outline-none cursor-pointer pr-1"
            >
              <option value="ALL">جميع كميات المخزون</option>
              <option value="CRITICAL_PREDICTION">⚠️ مهدد بالنفاذ (توقع &le; 7 أيام)</option>
              <option value="LOW">مخزون حرج (&lt; 5)</option>
              <option value="ZERO">نفد المخزون (0)</option>
              <option value="AVAILABLE">متوفر بالكامل</option>
            </select>
          </div>

          {/* Dedicated Inventory Excel Export Button */}
          <Tooltip text="تصدير بيانات المخزون المفلترة إلى Excel / CSV">
            <button
              onClick={() => exportProductsToExcel(filteredProducts, "تقرير_المخزون_والمنتجات")}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-sm active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير Excel (CSV) 📊</span>
            </button>
          </Tooltip>

          {/* Dedicated Inventory Print Button */}
          <Tooltip text="طباعة التقرير بالفلتر المختار">
            <button
              onClick={handlePrintFilteredInventory}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-sm active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة تقرير المخزون</span>
            </button>
          </Tooltip>
        </div>

        <div className="flex items-center justify-between text-[10px] font-black text-slate-500 border-t border-slate-200/60 pt-2.5">
          <span>المنتجات المعروضة بالفلتر: <strong className="text-indigo-600 font-mono">{filteredProducts.length}</strong> صنف</span>
          <span>إجمالي قيمة المخزون المعروض: <strong className="text-emerald-600 font-mono">{filteredProducts.reduce((acc, p) => acc + (stockService.getProductStock(p.id, p) * (Number(p.price) || 0)), 0).toLocaleString()} {storeCurrency}</strong></span>
        </div>
      </div>

      {/* Products Inventory List */}
      {isProductsLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 bg-white rounded-3xl border border-slate-100">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-xs font-bold">جاري تحميل مستويات المخزون والمنتجات...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="hidden md:block bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-[10px] font-black">
                    <th className="py-3 px-4 font-black">المنتج والقسم</th>
                    <th className="py-3 px-4 font-black text-center">السعر</th>
                    <th className="py-3 px-4 font-black text-center">المخزون الحالي</th>
                    <th className="py-3 px-4 font-black text-center">معدل السحب (14 يوم)</th>
                    <th className="py-3 px-4 font-black text-center">تنبؤ النفاذ</th>
                    <th className="py-3 px-4 font-black text-center">مقترح إعادة التزويد (30 يوم)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                  {filteredProducts.map(p => {
                    const currentStock = stockService.getProductStock(p.id, p);
                    const isLow = currentStock > 0 && currentStock < 5;
                    const isZero = currentStock === 0;
                    const pred = getStockPrediction(p);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <img src={p.image} alt={p.name} className="w-10 h-10 object-contain rounded p-1 border border-slate-100 shrink-0" referrerPolicy="no-referrer" />
                            <div className="space-y-1">
                              <span className="text-xs font-black text-slate-900 block line-clamp-1">{p.name || p.title}</span>
                              <span className="text-[9px] text-slate-400 font-mono block">ID: {p.id} • {p.category}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-mono font-black text-slate-800">
                          {p.price} {storeCurrency}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-mono font-black border whitespace-nowrap shrink-0 inline-flex items-center justify-center ${
                            isZero
                              ? "bg-rose-100 text-rose-800 border-rose-200"
                              : isLow 
                                ? "bg-amber-100 text-amber-800 border-amber-200" 
                                : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          }`}>
                            {isZero ? "نفذ المخزون" : `${currentStock} قطع`}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="font-mono font-black text-slate-900 block text-xs">{pred.dailyRate} قطعة/يوم</span>
                            <span className="text-[9px] text-slate-400 font-bold block">مباع: {pred.sold14Days} قطعة</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {isZero ? (
                            <span className="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-lg text-[10px] font-black border border-rose-200 whitespace-nowrap shrink-0 inline-flex items-center justify-center">
                              🛑 نافد حالياً
                            </span>
                          ) : pred.daysLeft <= 7 ? (
                            <span className="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg text-[10px] font-black border border-amber-300 whitespace-nowrap shrink-0 inline-flex items-center justify-center">
                              ⚠️ متوقع النفاذ خلال {pred.daysLeft} أيام
                            </span>
                          ) : pred.daysLeft <= 14 ? (
                            <span className="bg-sky-50 text-sky-800 px-2.5 py-1 rounded-lg text-[10px] font-black border border-sky-200 whitespace-nowrap shrink-0 inline-flex items-center justify-center">
                              ⚡ متوقع النفاذ خلال {pred.daysLeft} يوماً
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg text-[10px] font-black border border-emerald-200 whitespace-nowrap shrink-0 inline-flex items-center justify-center">
                              🟢 مريح ({pred.daysLeft === Infinity ? "سحب هادئ" : `${pred.daysLeft} يوم`})
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {pred.recommendedRestock > 0 ? (
                            <span className="font-mono font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200 text-xs whitespace-nowrap shrink-0 inline-flex items-center justify-center">
                              طلب +{pred.recommendedRestock} قطعة
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">لا يوجد نقص متوقع</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 md:hidden">
            {filteredProducts.map(p => {
              const currentStock = stockService.getProductStock(p.id, p);
              const isLow = currentStock > 0 && currentStock < 5;
              const isZero = currentStock === 0;
              const pred = getStockPrediction(p);

              return (
                <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <img src={p.image} alt={p.name} className="w-12 h-12 object-contain rounded-xl p-1 border border-slate-100 shrink-0" referrerPolicy="no-referrer" />
                      <div className="space-y-1 flex-1 min-w-0">
                        <span className="text-xs font-black text-slate-900 block leading-snug line-clamp-2">{p.name || p.title}</span>
                        <span className="text-[10px] text-slate-500 font-extrabold bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block">{p.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold">السعر</span>
                      <span className="font-mono font-black text-slate-900">{p.price} {storeCurrency}</span>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block font-bold">المخزون</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black border whitespace-nowrap shrink-0 inline-flex items-center justify-center ${
                        isZero
                          ? "bg-rose-100 text-rose-800 border-rose-200"
                          : isLow 
                            ? "bg-amber-100 text-amber-800 border-amber-200" 
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}>
                        {isZero ? "نفد المخزون" : `${currentStock} قطع`}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 text-[11px]">
                    <div className="flex justify-between items-center text-slate-600 font-bold">
                      <span>معدل السحب (14 يوم):</span>
                      <span className="font-mono font-black text-slate-900">{pred.dailyRate} قطعة/يوم ({pred.sold14Days} مباع)</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/50">
                      <span className="font-bold text-slate-600">توقع النفاذ:</span>
                      {isZero ? (
                        <span className="text-rose-700 font-black">🛑 نافد</span>
                      ) : (
                        <span className="font-black text-amber-700 font-mono">
                          {pred.daysLeft <= 7 ? `⚠️ خلال ${pred.daysLeft} أيام` : `${pred.daysLeft} يوماً`}
                        </span>
                      )}
                    </div>
                    {pred.recommendedRestock > 0 && (
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200/50 text-blue-700 font-black">
                        <span>مقترح التزويد (30 يوم):</span>
                        <span className="font-mono bg-blue-100/80 px-2 py-0.5 rounded border border-blue-200">+{pred.recommendedRestock} قطعة</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <PrintOptionsModal 
        isOpen={printModalConfig.isOpen}
        onClose={() => setPrintModalConfig({ ...printModalConfig, isOpen: false })}
        onConfirmPrint={(size) => printModalConfig.onConfirm?.(size)}
        reportTitle={printModalConfig.title}
      />

    </div>
  );
}
