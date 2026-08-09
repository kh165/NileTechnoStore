import React, { useState, useMemo } from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Calendar, 
  Filter, 
  PieChart as PieIcon, 
  BarChart3, 
  PackageCheck, 
  Award,
  RefreshCw
} from "lucide-react";

export default function AdminAnalyticsChartsTab({ orders = [], storeCurrency = "ج.م" }) {
  const [filterPreset, setFilterPreset] = useState("LAST_7_DAYS");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [salesChartType, setSalesChartType] = useState("area"); // "area" or "bar"

  // 1. Date Filtering Logic
  const filteredOrders = useMemo(() => {
    if (!Array.isArray(orders)) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return orders.filter((order) => {
      const orderDateStr = order.createdAt || order.date;
      if (!orderDateStr) return true;
      const oDate = new Date(orderDateStr);
      if (isNaN(oDate.getTime())) return true;

      if (filterPreset === "TODAY") {
        return oDate >= today;
      }
      if (filterPreset === "LAST_7_DAYS") {
        const d = new Date(today);
        d.setDate(d.getDate() - 6);
        return oDate >= d;
      }
      if (filterPreset === "LAST_30_DAYS") {
        const d = new Date(today);
        d.setDate(d.getDate() - 29);
        return oDate >= d;
      }
      if (filterPreset === "THIS_MONTH") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return oDate >= startOfMonth;
      }
      if (filterPreset === "CUSTOM") {
        if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          if (oDate < s) return false;
        }
        if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          if (oDate > e) return false;
        }
        return true;
      }
      return true; // ALL
    });
  }, [orders, filterPreset, startDate, endDate]);

  // 2. Metrics Summary for Filtered Period
  const metrics = useMemo(() => {
    let totalSales = 0;
    let totalItemsCount = 0;

    filteredOrders.forEach((o) => {
      const val = Number(o.total || o.totalPrice || o.amount) || 0;
      totalSales += val;

      if (Array.isArray(o.items)) {
        o.items.forEach((item) => {
          totalItemsCount += Number(item.quantity) || 1;
        });
      }
    });

    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;

    return {
      totalSales,
      totalOrders,
      totalItemsCount,
      avgOrderValue,
    };
  }, [filteredOrders]);

  // 3. Group Daily Sales & Orders Count Data for Charts
  const dailySalesData = useMemo(() => {
    const map = {};

    filteredOrders.forEach((o) => {
      const rawDate = o.createdAt || o.date;
      if (!rawDate) return;
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return;

      const dateKey = d.toISOString().split("T")[0]; // YYYY-MM-DD
      const dayFormatted = d.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });

      if (!map[dateKey]) {
        map[dateKey] = {
          dateKey,
          displayDate: dayFormatted,
          rawDate: d,
          sales: 0,
          ordersCount: 0,
        };
      }

      map[dateKey].sales += Number(o.total || o.totalPrice || o.amount) || 0;
      map[dateKey].ordersCount += 1;
    });

    // Convert map to sorted array ascending
    const sorted = Object.values(map).sort((a, b) => a.rawDate - b.rawDate);

    // If empty or very few days, fill with default placeholders if last 7 days selected
    if (sorted.length === 0 && filterPreset === "LAST_7_DAYS") {
      const result = [];
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayFormatted = d.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
        result.push({
          dateKey: d.toISOString().split("T")[0],
          displayDate: dayFormatted,
          sales: 0,
          ordersCount: 0,
        });
      }
      return result;
    }

    return sorted;
  }, [filteredOrders, filterPreset]);

  // 4. Top Requested / Best Selling Products
  const topProductsData = useMemo(() => {
    const map = {};

    filteredOrders.forEach((o) => {
      if (Array.isArray(o.items)) {
        o.items.forEach((item) => {
          const name = item.name || item.title || "منتج غير معنون";
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price) || 0;

          if (!map[name]) {
            map[name] = { name, quantity: 0, revenue: 0 };
          }
          map[name].quantity += qty;
          map[name].revenue += qty * price;
        });
      }
    });

    return Object.values(map)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 7); // Top 7 products
  }, [filteredOrders]);

  // 5. Orders Status Distribution Data
  const statusDistributionData = useMemo(() => {
    const counts = {
      PENDING: 0,
      PREPARING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELED: 0,
    };

    filteredOrders.forEach((o) => {
      const st = String(o.status || "PENDING").toUpperCase();
      if (st in counts) counts[st] += 1;
      else counts.PENDING += 1;
    });

    const statusLabels = {
      DELIVERED: { name: "تم الاستلام", color: "#10b981" },
      SHIPPED: { name: "جاري التوصيل", color: "#3b82f6" },
      PREPARING: { name: "قيد التجهيز", color: "#f59e0b" },
      PENDING: { name: "قيد المعالجة", color: "#f97316" },
      CANCELED: { name: "ملغي", color: "#ef4444" },
    };

    return Object.keys(counts)
      .filter((k) => counts[k] > 0)
      .map((k) => ({
        name: statusLabels[k]?.name || k,
        value: counts[k],
        color: statusLabels[k]?.color || "#64748b",
      }));
  }, [filteredOrders]);

  // Custom Chart Tooltips
  const CustomSalesTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-right space-y-1 font-sans text-xs" dir="rtl">
          <p className="font-black text-amber-300 text-xs border-b border-slate-700/80 pb-1 mb-1">
            📅 {data.displayDate} ({data.dateKey})
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300">إجمالي المبيعات:</span>
            <strong className="text-emerald-400 font-mono text-sm">{data.sales.toLocaleString()} {storeCurrency}</strong>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300">عدد الطلبات:</span>
            <strong className="text-blue-300 font-mono text-sm">{data.ordersCount} طلبات</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomProductsTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-right space-y-1 font-sans text-xs" dir="rtl">
          <p className="font-black text-amber-300 text-xs border-b border-slate-700/80 pb-1 mb-1">
            📦 {data.name}
          </p>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300">إجمالي الطلبات (الكمية):</span>
            <strong className="text-blue-400 font-mono text-sm">{data.quantity} قطعة</strong>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-300">إجمالي الإيرادات:</span>
            <strong className="text-emerald-400 font-mono text-sm">{data.revenue.toLocaleString()} {storeCurrency}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#072d5c] via-[#093c7a] to-[#072d5c] text-white p-6 rounded-3xl shadow-xl border border-blue-900/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg font-black text-white">لوحة البيانات والتحليلات المباشرة</h2>
          </div>
          <p className="text-xs text-blue-100 font-bold max-w-xl leading-relaxed">
            متابعة دقيقة وإحصائيات بيانية تفاعلية لإجمالي المبيعات اليومية، عدد الطلبات الجديدة، وأكثر المنتجات طلباً بالمتجر.
          </p>
        </div>

        {/* Quick Date Presets */}
        <div className="flex items-center gap-2 flex-wrap bg-white/10 p-2 rounded-2xl border border-white/15 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setFilterPreset("TODAY")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterPreset === "TODAY" ? "bg-amber-400 text-slate-900 shadow-md" : "text-white hover:bg-white/15"
            }`}
          >
            اليوم
          </button>
          <button
            type="button"
            onClick={() => setFilterPreset("LAST_7_DAYS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterPreset === "LAST_7_DAYS" ? "bg-amber-400 text-slate-900 shadow-md" : "text-white hover:bg-white/15"
            }`}
          >
            آخر 7 أيام
          </button>
          <button
            type="button"
            onClick={() => setFilterPreset("LAST_30_DAYS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterPreset === "LAST_30_DAYS" ? "bg-amber-400 text-slate-900 shadow-md" : "text-white hover:bg-white/15"
            }`}
          >
            آخر 30 يوماً
          </button>
          <button
            type="button"
            onClick={() => setFilterPreset("THIS_MONTH")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterPreset === "THIS_MONTH" ? "bg-amber-400 text-slate-900 shadow-md" : "text-white hover:bg-white/15"
            }`}
          >
            هذا الشهر
          </button>
          <button
            type="button"
            onClick={() => setFilterPreset("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterPreset === "ALL" ? "bg-amber-400 text-slate-900 shadow-md" : "text-white hover:bg-white/15"
            }`}
          >
            كل الأوقات
          </button>
        </div>
      </div>

      {/* Date Filter Bar & Range Selection */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-black text-slate-800">التصفية حسب تاريخ محدد:</span>
          <select
            value={filterPreset}
            onChange={(e) => setFilterPreset(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-black text-slate-800 rounded-xl px-3 py-1.5 outline-none cursor-pointer"
          >
            <option value="LAST_7_DAYS">آخر 7 أيام</option>
            <option value="LAST_30_DAYS">آخر 30 يوماً</option>
            <option value="TODAY">اليوم فقط</option>
            <option value="THIS_MONTH">الشهر الحالي</option>
            <option value="ALL">جميع البيانات المسجلة</option>
            <option value="CUSTOM">تحديد فترة مخصصة (من - إلى)</option>
          </select>
        </div>

        {filterPreset === "CUSTOM" && (
          <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-700">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>من:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs font-bold outline-none cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>إلى:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs font-bold outline-none cursor-pointer"
              />
            </div>
          </div>
        )}

        <div className="text-xs font-bold text-slate-500">
          عدد الطلبات المشمولة: <strong className="text-blue-900 font-mono font-black">{filteredOrders.length}</strong> طلب
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">إجمالي المبيعات</span>
            <strong className="text-base font-black text-emerald-700 font-mono block mt-0.5">
              {metrics.totalSales.toLocaleString()} {storeCurrency}
            </strong>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">عدد الطلبات الجديدة</span>
            <strong className="text-base font-black text-blue-900 font-mono block mt-0.5">
              {metrics.totalOrders} طلبات
            </strong>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">القطع المباعة</span>
            <strong className="text-base font-black text-indigo-900 font-mono block mt-0.5">
              {metrics.totalItemsCount} قطعة
            </strong>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-amber-300 transition-all flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 block">متوسط قيمة الطلب</span>
            <strong className="text-base font-black text-slate-900 font-mono block mt-0.5">
              {metrics.avgOrderValue.toLocaleString()} {storeCurrency}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Section 1: Daily Sales Revenue Chart */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">إجمالي المبيعات اليومية ({storeCurrency})</h3>
              <p className="text-[11px] text-slate-400 font-bold">منحنى المبيعات والإيرادات اليومية بالمتجر خلال الفترة المحددة</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-700">
            <button
              type="button"
              onClick={() => setSalesChartType("area")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                salesChartType === "area" ? "bg-white text-emerald-700 font-black shadow-xs" : "hover:text-slate-900"
              }`}
            >
              مخطط مساحي (Area)
            </button>
            <button
              type="button"
              onClick={() => setSalesChartType("bar")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                salesChartType === "bar" ? "bg-white text-emerald-700 font-black shadow-xs" : "hover:text-slate-900"
              }`}
            >
              أعمدة (Bar)
            </button>
          </div>
        </div>

        <div className="h-72 w-full pt-2" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            {salesChartType === "area" ? (
              <AreaChart data={dailySalesData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomSalesTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  name="المبيعات" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#salesGradient)" 
                />
              </AreaChart>
            ) : (
              <BarChart data={dailySalesData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomSalesTooltip />} />
                <Bar dataKey="sales" name="المبيعات" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid Row: New Orders Daily + Top Requested Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 2: New Orders Count Daily */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">عدد الطلبات الجديدة اليومية</h3>
              <p className="text-[11px] text-slate-400 font-bold">توزيع كمية وحجم الطلبات الواردة يومياً</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailySalesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomSalesTooltip />} />
                <Bar dataKey="ordersCount" name="عدد الطلبات" fill="#0051a8" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Top Requested / Best-Selling Products */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">أكثر المنتجات طلباً بالمتجر</h3>
              <p className="text-[11px] text-slate-400 font-bold">ترتيب المنتجات الأكثر مبيعاً حسـب عدد القطع المباعة</p>
            </div>
          </div>

          {topProductsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-slate-400 gap-2">
              <Award className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-bold">لا توجد بيانات مبيعات منتجات متوفرة لهذه الفترة</p>
            </div>
          ) : (
            <div className="h-64 w-full pt-2" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={10} width={110} tickLine={false} />
                  <Tooltip content={<CustomProductsTooltip />} />
                  <Bar dataKey="quantity" name="الكمية" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Chart 4: Order Status Breakdown (Pie Chart) */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="p-2 bg-violet-50 text-violet-700 rounded-xl">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">توزيع حالات الطلبات</h3>
            <p className="text-[11px] text-slate-400 font-bold">نسب وتوزيع الطلبات حسب حالة المتابعة والتوصيل</p>
          </div>
        </div>

        {statusDistributionData.length === 0 ? (
          <div className="text-center py-10 text-xs font-bold text-slate-400">لا توجد طلبات مسجلة في هذه الفترة</div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="w-64 h-64" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} طلبات`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
              {statusDistributionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-black text-slate-800">{item.name}</span>
                  </div>
                  <strong className="text-xs font-mono font-black text-slate-900">{item.value} طلبات</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
