import React, { useState, useMemo } from "react";
import { 
  MapPin, 
  Printer, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Calendar, 
  PieChart as PieIcon, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  BarChart3,
  Percent,
  Truck,
  FileText,
  FileSpreadsheet
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { 
  printFinancialReport, 
  printInventoryReport, 
  printGeographicalReport, 
  printTopProductsReport, 
  printGeneralLedgerReport,
  printPeriodComparisonReport
} from "../../lib/reportPrinter";
import { exportOrdersToExcel } from "../../lib/exportToExcel";
import PrintOptionsModal from "./PrintOptionsModal";
import CustomTooltip from "../Common/Tooltip";

export default function AdminReportsTab({
  totalSales = 0,
  completedRevenue = 0,
  activeRevenue = 0,
  cancelledRevenue = 0,
  allOrders = [],
  orders = [],
  completedCount = 0,
  cancelledCount = 0,
  averageOrderValue = "0.00",
  storeCurrency = "ج.م",
  products = [],
  analyticsData = {},
  getWeeklySalesData,
  getCategorySalesData,
  getTopSellingProducts,
  getGeographicalSales,
}) {
  const safeAllOrders = useMemo(() => {
    if (Array.isArray(orders) && orders.length > 0) return orders;
    if (Array.isArray(allOrders)) return allOrders;
    return [];
  }, [orders, allOrders]);
  // Time, Manual Custom Dates & Print Modal state
  const [timeRange, setTimeRange] = useState("ALL"); // "ALL" | "TODAY" | "WEEK" | "MONTH" | "CUSTOM"
  const [comparisonMode, setComparisonMode] = useState("MONTH_VS_PREV_MONTH"); // "MONTH_VS_PREV_MONTH" | "MONTH_VS_SAME_MONTH_PREV_YEAR" | "WEEK_VS_PREV_WEEK" | "YEAR_VS_PREV_YEAR" | "CUSTOM"
  const [compStartDateA, setCompStartDateA] = useState("");
  const [compEndDateA, setCompEndDateA] = useState("");
  const [compStartDateB, setCompStartDateB] = useState("");
  const [compEndDateB, setCompEndDateB] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [printModalConfig, setPrintModalConfig] = useState({ isOpen: false, title: "", onConfirm: null });

  const triggerPrintWithOptions = (title, printFn) => {
    setPrintModalConfig({
      isOpen: true,
      title,
      onConfirm: (selectedSize) => printFn(selectedSize)
    });
  };

  const handleSelectComparisonMode = (mode) => {
    setComparisonMode(mode);
    const now = new Date();
    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (mode === "MONTH_VS_PREV_MONTH") {
      const startA = new Date(now.getFullYear(), now.getMonth(), 1);
      const endA = now;
      const startB = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endB = new Date(now.getFullYear(), now.getMonth(), 0);
      setCompStartDateA(formatDate(startA));
      setCompEndDateA(formatDate(endA));
      setCompStartDateB(formatDate(startB));
      setCompEndDateB(formatDate(endB));
    } else if (mode === "MONTH_VS_SAME_MONTH_PREV_YEAR") {
      const startA = new Date(now.getFullYear(), now.getMonth(), 1);
      const endA = now;
      const startB = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      const endB = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0);
      setCompStartDateA(formatDate(startA));
      setCompEndDateA(formatDate(endA));
      setCompStartDateB(formatDate(startB));
      setCompEndDateB(formatDate(endB));
    } else if (mode === "WEEK_VS_PREV_WEEK") {
      const endA = now;
      const startA = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const endB = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startB = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      setCompStartDateA(formatDate(startA));
      setCompEndDateA(formatDate(endA));
      setCompStartDateB(formatDate(startB));
      setCompEndDateB(formatDate(endB));
    } else if (mode === "YEAR_VS_PREV_YEAR") {
      const startA = new Date(now.getFullYear(), 0, 1);
      const endA = now;
      const startB = new Date(now.getFullYear() - 1, 0, 1);
      const endB = new Date(now.getFullYear() - 1, 11, 31);
      setCompStartDateA(formatDate(startA));
      setCompEndDateA(formatDate(endA));
      setCompStartDateB(formatDate(startB));
      setCompEndDateB(formatDate(endB));
    }
  };

  // Filter orders by time range or manual date inputs
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return safeAllOrders.filter(o => {
      const orderDateVal = o.createdAt || o.date;

      if (timeRange === "CUSTOM" || startDate || endDate) {
        if (!orderDateVal) return false;
        const orderDate = new Date(orderDateVal);
        if (isNaN(orderDate.getTime())) return false;

        if (startDate) {
          const sDate = new Date(startDate);
          sDate.setHours(0, 0, 0, 0);
          if (orderDate < sDate) return false;
        }
        if (endDate) {
          const eDate = new Date(endDate);
          eDate.setHours(23, 59, 59, 999);
          if (orderDate > eDate) return false;
        }
        return true;
      }

      if (timeRange === "ALL") return true;
      if (!orderDateVal) return true;
      const orderDate = new Date(orderDateVal);
      if (isNaN(orderDate.getTime())) return true;

      if (timeRange === "TODAY") {
        return orderDate.toDateString() === now.toDateString();
      }
      if (timeRange === "WEEK") {
        const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      }
      if (timeRange === "MONTH") {
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [safeAllOrders, timeRange, startDate, endDate]);

  // Recalculate metrics for filtered orders
  const stats = useMemo(() => {
    let sales = 0;
    let compRev = 0;
    let actRev = 0;
    let cancRev = 0;
    let compCnt = 0;
    let cancCnt = 0;
    let totalShipping = 0;

    filteredOrders.forEach(o => {
      const tot = Number(o.total) || 0;
      const st = (o.status || "PENDING").toUpperCase();
      sales += tot;
      totalShipping += (Number(o.shippingCost) || 0);

      if (["COMPLETED", "DELIVERED"].includes(st)) {
        compRev += tot;
        compCnt++;
      } else if (["CANCELED", "CANCELLED"].includes(st)) {
        cancRev += tot;
        cancCnt++;
      } else {
        actRev += tot;
      }
    });

    const activeOrdersCount = filteredOrders.length - cancCnt;
    const avgVal = activeOrdersCount > 0 ? ((sales - cancRev) / activeOrdersCount).toFixed(2) : "0.00";

    return {
      totalSales: sales,
      completedRevenue: compRev,
      activeRevenue: actRev,
      cancelledRevenue: cancRev,
      completedCount: compCnt,
      cancelledCount: cancCnt,
      averageOrderValue: avgVal,
      totalShipping
    };
  }, [filteredOrders]);

  // Inventory Valuation Stats
  const inventoryStats = useMemo(() => {
    let totalStock = 0;
    let totalValue = 0;
    let outOfStock = 0;
    let lowStock = 0;

    products.forEach(p => {
      const qty = Number(p.stock) || 0;
      const price = Number(p.price) || 0;
      totalStock += qty;
      totalValue += qty * price;

      if (qty === 0) outOfStock++;
      else if (qty < 5) lowStock++;
    });

    return { totalStock, totalValue, outOfStock, lowStock };
  }, [products]);

  // Period Comparison (Growth Analysis)
  const periodComparison = useMemo(() => {
    const now = new Date();
    let titleA = "";
    let titleB = "";
    let filterFnA = () => false;
    let filterFnB = () => false;

    if (comparisonMode === "MONTH_VS_PREV_MONTH") {
      titleA = "الشهر الحالي";
      titleB = "الشهر السابق";
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      filterFnA = (date) => date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      filterFnB = (date) => date.getMonth() === prevMonth && date.getFullYear() === prevYear;
    } else if (comparisonMode === "MONTH_VS_SAME_MONTH_PREV_YEAR") {
      titleA = "الشهر الحالي";
      titleB = "نفس الشهر من السنة السابقة";
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      filterFnA = (date) => date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      filterFnB = (date) => date.getMonth() === currentMonth && date.getFullYear() === (currentYear - 1);
    } else if (comparisonMode === "WEEK_VS_PREV_WEEK") {
      titleA = "الأسبوع الحالي (آخر 7 أيام)";
      titleB = "الأسبوع السابق (7 أيام سابقة)";
      const msPerDay = 24 * 60 * 60 * 1000;
      
      filterFnA = (date) => {
        const diff = (now - date) / msPerDay;
        return diff >= 0 && diff <= 7;
      };
      filterFnB = (date) => {
        const diff = (now - date) / msPerDay;
        return diff > 7 && diff <= 14;
      };
    } else if (comparisonMode === "YEAR_VS_PREV_YEAR") {
      titleA = "السنة الحالية";
      titleB = "السنة الماضية";
      const currentYear = now.getFullYear();
      const prevYear = currentYear - 1;

      filterFnA = (date) => date.getFullYear() === currentYear;
      filterFnB = (date) => date.getFullYear() === prevYear;
    } else if (comparisonMode === "CUSTOM") {
      titleA = (compStartDateA && compEndDateA)
        ? `الفترة (أ): ${compStartDateA} إلى ${compEndDateA}`
        : compStartDateA ? `من ${compStartDateA}` : "الفترة الأولى المخصصة";
      titleB = (compStartDateB && compEndDateB)
        ? `الفترة (ب): ${compStartDateB} إلى ${compEndDateB}`
        : compStartDateB ? `من ${compStartDateB}` : "الفترة الثانية المخصصة";

      filterFnA = (date) => {
        if (!compStartDateA && !compEndDateA) return true;
        let s = compStartDateA ? new Date(compStartDateA) : new Date(0);
        s.setHours(0, 0, 0, 0);
        let e = compEndDateA ? new Date(compEndDateA) : new Date(8640000000000000);
        e.setHours(23, 59, 59, 999);
        return date >= s && date <= e;
      };

      filterFnB = (date) => {
        if (!compStartDateB && !compEndDateB) return true;
        let s = compStartDateB ? new Date(compStartDateB) : new Date(0);
        s.setHours(0, 0, 0, 0);
        let e = compEndDateB ? new Date(compEndDateB) : new Date(8640000000000000);
        e.setHours(23, 59, 59, 999);
        return date >= s && date <= e;
      };
    }

    const computeMetrics = (filterFn) => {
      let sales = 0;
      let ordersCount = 0;
      let completedCount = 0;

      safeAllOrders.forEach(o => {
        let d = null;
        const dVal = o.createdAt || o.date;
        if (!dVal) return;
        if (typeof dVal?.toDate === "function") d = dVal.toDate();
        else if (dVal?.seconds) d = new Date(dVal.seconds * 1000);
        else d = new Date(dVal);

        if (!d || isNaN(d.getTime())) return;

        if (filterFn(d)) {
          ordersCount++;
          const tot = Number(o.total) || 0;
          const st = (o.status || "PENDING").toUpperCase();
          if (!["CANCELED", "CANCELLED"].includes(st)) {
            sales += tot;
          }
          if (["COMPLETED", "DELIVERED"].includes(st)) {
            completedCount++;
          }
        }
      });

      const aov = ordersCount > 0 ? sales / ordersCount : 0;
      return { sales, ordersCount, completedCount, aov };
    };

    const periodA = computeMetrics(filterFnA);
    const periodB = computeMetrics(filterFnB);

    const calcGrowth = (a, b) => {
      if (b > 0) return ((a - b) / b) * 100;
      if (a > 0) return 100;
      return 0;
    };

    const growth = {
      sales: calcGrowth(periodA.sales, periodB.sales),
      orders: calcGrowth(periodA.ordersCount, periodB.ordersCount),
      completed: calcGrowth(periodA.completedCount, periodB.completedCount),
      aov: calcGrowth(periodA.aov, periodB.aov),
    };

    return { titleA, titleB, periodA, periodB, growth };
  }, [safeAllOrders, comparisonMode, compStartDateA, compEndDateA, compStartDateB, compEndDateB]);

  // Dynamic calculations for selected date range
  const parseVal = (v) => {
    if (v === null || v === undefined) return 0;
    if (typeof v === "number") return isNaN(v) ? 0 : v;
    const clean = String(v).replace(/[^0-9.]/g, "");
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  const topSellingProducts = useMemo(() => {
    const counts = {};
    filteredOrders.forEach(order => {
      const isCancelled = order.status && ["CANCELED", "CANCELLED"].includes(order.status.toUpperCase());
      if (isCancelled) return;
      if (order.items) {
        order.items.forEach(item => {
          if (!item || (!item.name && !item.productName && !item.title)) return;
          const itemName = item.name || item.productName || item.title || "منتج";
          if (!counts[itemName]) {
            counts[itemName] = {
              name: itemName,
              quantity: 0,
              totalValue: 0,
              image: item.image || item.productImage || ""
            };
          }
          const qty = parseInt(item.quantity) || 1;
          const price = parseVal(item.price || item.discount_price);
          counts[itemName].quantity += qty;
          counts[itemName].totalValue += qty * price;
        });
      }
    });
    return Object.values(counts).sort((a, b) => b.quantity - a.quantity);
  }, [filteredOrders]);

  const geographicalSales = useMemo(() => {
    const geo = {};
    filteredOrders.forEach(order => {
      const isCancelled = order.status && ["CANCELED", "CANCELLED"].includes(order.status.toUpperCase());
      if (isCancelled) return;
      let loc = order.shippingLocationName || order.governorate || "شحن للمنزل / غير محدد";
      if (!geo[loc]) {
        geo[loc] = {
          name: loc,
          location: loc,
          ordersCount: 0,
          revenue: 0,
          sales: 0
        };
      }
      geo[loc].ordersCount += 1;
      const tot = parseVal(order.total);
      geo[loc].revenue += tot;
      geo[loc].sales += tot;
    });
    return Object.values(geo).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  const categorySalesData = useMemo(() => {
    const catMap = {};
    filteredOrders.forEach(order => {
      const isCancelled = order.status && ["CANCELED", "CANCELLED"].includes(order.status.toUpperCase());
      if (isCancelled) return;
      (order.items || []).forEach(item => {
        let catName = item.category;
        if (!catName && products) {
          const p = products.find(p => String(p.id) === String(item.productId));
          if (p) catName = p.category;
        }
        catName = catName || "أخرى";
        const revenue = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1);
        catMap[catName] = (catMap[catName] || 0) + revenue;
      });
    });
    return Object.entries(catMap).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    })).sort((a, b) => b.value - a.value);
  }, [filteredOrders, products]);

  const weeklySalesData = useMemo(() => {
    const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const result = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayIndex = d.getDay();
      const dayName = dayNames[dayIndex];
      const dateStr = d.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
      
      result.push({
        dayName,
        dateStr,
        sales: 0,
        ordersCount: 0,
        formattedDay: `${dayName} (${dateStr})`,
        matchKey: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      });
    }

    filteredOrders.forEach(order => {
      const isCancelled = order.status && ["CANCELED", "CANCELLED"].includes(order.status.toUpperCase());
      if (isCancelled) return;
      
      const orderDateVal = order.createdAt || order.date;
      if (!orderDateVal) return;
      const oDate = new Date(orderDateVal);
      if (isNaN(oDate.getTime())) return;
      
      const matchKey = `${oDate.getFullYear()}-${oDate.getMonth()}-${oDate.getDate()}`;
      const match = result.find(r => r.matchKey === matchKey);
      if (match) {
        match.sales += parseFloat(order.total) || 0;
        match.ordersCount += 1;
      }
    });

    return result;
  }, [filteredOrders]);

  // Status breakdown funnel
  const statusFunnel = useMemo(() => {
    const counts = { PENDING: 0, PROCESSING: 0, SHIPPED: 0, COMPLETED: 0, CANCELLED: 0 };
    filteredOrders.forEach(o => {
      const st = (o.status || "PENDING").toUpperCase();
      if (st === "DELIVERED" || st === "COMPLETED") counts.COMPLETED++;
      else if (st === "CANCELED" || st === "CANCELLED") counts.CANCELLED++;
      else if (st === "SHIPPED") counts.SHIPPED++;
      else if (st === "PROCESSING") counts.PROCESSING++;
      else counts.PENDING++;
    });
    return counts;
  }, [filteredOrders]);

  // Ultra-sleek Recharts Tooltip
  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && Array.isArray(payload) && payload.length) {
      const data = payload[0]?.payload || {};
      const title = label || data.dayName || data.name || data.location || data.formattedDay || "مؤشرات التحليل المالي";

      return (
        <div className="bg-slate-950/95 backdrop-blur-md text-white p-3.5 sm:p-4 rounded-2xl border border-slate-800 shadow-2xl text-right font-sans space-y-2 min-w-[210px] animate-fade-in z-50">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-black text-sky-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span>{title}</span>
            </span>
            <span className="text-[9px] bg-sky-950 text-sky-300 border border-sky-800/50 font-mono px-2 py-0.5 rounded-full font-extrabold">
              BI Analytics
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            {payload.map((entry, index) => {
              if (!entry) return null;
              const rawVal = entry.value;
              const val = typeof rawVal === "number" && !isNaN(rawVal) ? rawVal : parseFloat(rawVal) || 0;
              const entryName = entry.name || "المقدار";
              const color = entry.color || entry.fill || "#3b82f6";

              return (
                <div key={index} className="flex items-center justify-between gap-3 font-bold">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0 shadow-xs" style={{ backgroundColor: color }} />
                    <span>{entryName}:</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-black">
                    {val.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} {entry.unit || storeCurrency}
                  </span>
                </div>
              );
            })}

            {data.ordersCount !== undefined && (
              <div className="flex items-center justify-between gap-3 text-xs font-bold pt-1.5 border-t border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                  <span>إجمالي الطلبات:</span>
                </span>
                <span className="font-mono text-amber-300 font-black">
                  {data.ordersCount} طلبات
                </span>
              </div>
            )}

            {data.percentage !== undefined && (
              <div className="flex items-center justify-between gap-3 text-xs font-bold pt-1 border-t border-slate-800/80">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-sky-400" />
                  <span>النسبة المئوية:</span>
                </span>
                <span className="font-mono text-sky-300 font-black">
                  {data.percentage}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Helper for human time range string
  const getTimeRangeLabel = () => {
    if (startDate || endDate || timeRange === "CUSTOM") {
      if (startDate && endDate) {
        return `من ${new Date(startDate).toLocaleDateString("ar-EG")} إلى ${new Date(endDate).toLocaleDateString("ar-EG")}`;
      } else if (startDate) {
        return `من تاريخ ${new Date(startDate).toLocaleDateString("ar-EG")}`;
      } else if (endDate) {
        return `حتى تاريخ ${new Date(endDate).toLocaleDateString("ar-EG")}`;
      }
    }
    if (timeRange === "TODAY") return "اليوم الحالي";
    if (timeRange === "WEEK") return "آخر 7 أيام";
    if (timeRange === "MONTH") return "هذا الشهر";
    return "كافة الفترات المسجلة";
  };

  return (
    <div className="space-y-6 animate-fade-in text-right font-sans">
      
      {/* Header Banner - NileTechno Navy Style */}
      <div className="bg-gradient-to-r from-[#072d5c] via-[#093c7a] to-[#072d5c] text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-blue-900/50">
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 rounded-full text-xs font-black">
            <BarChart3 className="w-3.5 h-3.5 text-sky-300" />
            <span>التقارير المالية والتحليلات</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">التقارير والمؤشرات المالية والمبيعات</h2>
          <p className="text-xs text-blue-100/90 font-bold leading-relaxed">
            عرض أداء المبيعات، تحليل الأرباح، وتقارير الشحن والمحافظات مع تحديد الفترات الزمنية.
          </p>
        </div>
      </div>

      {/* Top Filter & Report Header Bar */}
      <div className="bg-white p-5 rounded-[24px] border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#072d5c]" />
            <div>
              <h3 className="text-sm font-black text-slate-900">تصفية الفترة الزمنية وتحديد تواريخ التقرير:</h3>
              <p className="text-[10px] text-slate-500 font-bold">حدد النطاق الزمني يدويًا باليوم أو اختر من الخيارات السريعة واطبع تقريرك المستقل</p>
            </div>
          </div>

          <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-black">
            النطاق الحالي: {getTimeRangeLabel()} ({filteredOrders.length} طلب)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Preset Buttons (Cols 5) */}
          <div className="md:col-span-5 space-y-1">
            <label className="text-[10px] font-black text-slate-500 block">فترات سريعة جاهزة:</label>
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => { setTimeRange("ALL"); setStartDate(""); setEndDate(""); }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer text-center ${
                  timeRange === "ALL" && !startDate && !endDate ? "bg-[#072d5c] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => { setTimeRange("TODAY"); setStartDate(""); setEndDate(""); }}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                  timeRange === "TODAY" && !startDate && !endDate ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                اليوم
              </button>
              <button
                onClick={() => { setTimeRange("WEEK"); setStartDate(""); setEndDate(""); }}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                  timeRange === "WEEK" && !startDate && !endDate ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                آخر 7 أيام
              </button>
              <button
                onClick={() => { setTimeRange("MONTH"); setStartDate(""); setEndDate(""); }}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer text-center ${
                  timeRange === "MONTH" && !startDate && !endDate ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                هذا الشهر
              </button>
            </div>
          </div>

          {/* Manual Start Date Picker (Cols 3) */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] font-black text-slate-500 block flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>تاريخ البداية (من):</span>
            </label>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setTimeRange("CUSTOM");
              }}
              className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-bold text-slate-800 outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
            />
          </div>

          {/* Manual End Date Picker (Cols 3) */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] font-black text-slate-500 block flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>تاريخ النهاية (إلى):</span>
            </label>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setTimeRange("CUSTOM");
              }}
              className="w-full bg-white border border-slate-200 rounded-xl py-1.5 px-3 text-xs font-bold text-slate-800 outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
            />
          </div>

          {/* Actions / Reset Button (Col 1) */}
          <div className="md:col-span-1 flex items-center gap-1">
            {(startDate || endDate || timeRange !== "ALL") && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setTimeRange("ALL");
                }}
                className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black border border-rose-200 transition-all cursor-pointer text-center"
                title="مسح وتصفير الفلتر الزمني"
              >
                تصفير
              </button>
            )}
          </div>
        </div>

        {/* Master Print Financial Statement Button Row */}
        <div className="pt-2 border-t border-slate-100 flex justify-between items-center flex-wrap gap-2">
          <span className="text-[10px] font-bold text-slate-500">
            تأثير التصفية: يتم تحديث كافة الرسومات البيانية وتقارير المحافظات والأصناف تلقائياً حسب التاريخ المحدد.
          </span>

          <CustomTooltip text="تصدير بيانات وأرقام التقارير المالية والطلبات الحالية إلى ملف Excel / CSV">
            <button
              onClick={() => exportOrdersToExcel(filteredOrders, `تقرير_المؤشرات_المالية_${getTimeRangeLabel()}`)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير Excel (CSV) 📊</span>
            </button>
          </CustomTooltip>

          <CustomTooltip text="طباعة تقرير الإيرادات والتحصيل الرسمي للفترة المحددة">
            <button
              onClick={() => triggerPrintWithOptions("تقرير المؤشرات المالية والإيرادات", (size) => printFinancialReport(stats, filteredOrders, getTimeRangeLabel(), storeCurrency, size))}
              className="px-4 py-2 bg-[#072d5c] hover:bg-[#093c7a] text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Printer className="w-3.5 h-3.5 text-sky-300" />
              <span>طباعة التقرير المالي</span>
            </button>
          </CustomTooltip>
        </div>
      </div>

      {/* Detailed Financial Summary Box */}
      <div className="bg-slate-900 text-white rounded-[28px] p-6 shadow-xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h5 className="text-xs font-black text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            <span>موجز المؤشرات المالية والمحاسبية بالتفصيل ({filteredOrders.length} طلب)</span>
          </h5>
          <button 
            onClick={() => triggerPrintWithOptions("بيان مالي معتمد", (size) => printFinancialReport(stats, filteredOrders, getTimeRangeLabel(), storeCurrency, size))}
            className="text-[10px] bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/30 px-3 py-1 rounded-xl font-black transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3 h-3 text-blue-300" />
            <span>استخراج بيان مالي معتمد</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 block font-black">إجمالي مبيعات المتجر المحققة</span>
            <span className="text-2xl font-mono font-black text-blue-400 block">{(stats?.totalSales || 0).toFixed(2)} {storeCurrency}</span>
            <span className="text-[9px] text-slate-500 block">إجمالي القيمة للطلبات المختارة</span>
          </div>
          
          <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 block font-black">الإيرادات المكتملة والمستلمة</span>
            <span className="text-2xl font-mono font-black text-emerald-400 block">{(stats?.completedRevenue || 0).toFixed(2)} {storeCurrency}</span>
            <span className="text-[9px] text-slate-500 block">نسبة {((stats?.totalSales || 0) > 0 ? ((stats?.completedRevenue || 0) / stats.totalSales * 100) : 0).toFixed(1)}% من الإجمالي</span>
          </div>

          <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 block font-black">المبيعات قيد التحضير والشحن</span>
            <span className="text-2xl font-mono font-black text-amber-400 block">{(stats?.activeRevenue || 0).toFixed(2)} {storeCurrency}</span>
            <span className="text-[9px] text-slate-500 block">إيراد نشط متوقع تحصيله قريباً</span>
          </div>

          <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 block font-black">المبيعات الملغاة كلياً</span>
            <span className="text-2xl font-mono font-black text-rose-400 block">{(stats?.cancelledRevenue || 0).toFixed(2)} {storeCurrency}</span>
            <span className="text-[9px] text-slate-500 block">مفقودة بسبب طلبات ملغية</span>
          </div>
        </div>
        
        {/* Rates & Performance indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-400 block font-black">معدل اكتمال الطلبات</span>
              <span className="text-sm font-mono font-black text-emerald-400 mt-0.5 block">
                {(filteredOrders?.length || 0) > 0 ? (((stats?.completedCount || 0) / filteredOrders.length) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono font-bold">{stats?.completedCount || 0} / {filteredOrders?.length || 0}</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-400 block font-black">معدل إلغاء المشتريات</span>
              <span className="text-sm font-mono font-black text-rose-400 mt-0.5 block">
                {(filteredOrders?.length || 0) > 0 ? (((stats?.cancelledCount || 0) / filteredOrders.length) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono font-bold">{stats?.cancelledCount || 0} ملغي</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-400 block font-black">متوسط قيمة الطلب (AOV)</span>
              <span className="text-sm font-mono font-black text-blue-400 mt-0.5 block">
                {stats?.averageOrderValue || "0.0"} {storeCurrency}
              </span>
            </div>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-400 block font-black">إجمالي عائدات الشحن</span>
              <span className="text-sm font-mono font-black text-sky-400 mt-0.5 block">
                {stats?.totalShipping || "0.0"} {storeCurrency}
              </span>
            </div>
            <Truck className="w-4 h-4 text-sky-400" />
          </div>
        </div>
      </div>

      {/* Inventory Valuation & Stock Analytics Box */}
      <div className="bg-white border border-slate-200/90 rounded-[28px] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-xs font-black text-slate-900">تقييم وحجم مخزون المتجر الحالي (Inventory Valuation)</h3>
              <p className="text-[10px] text-slate-400 font-bold">القيمة المالية الإجمالية للمخزون القائم وعدد الوحدات الجاهزة</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-mono font-black text-xs rounded-xl">
              {products.length} اصناف
            </span>
            <button
              onClick={() => printInventoryReport(inventoryStats, products, storeCurrency)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Printer className="w-3 h-3" />
              <span>طباعة تقرير المخزون</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
            <span className="text-[10px] text-slate-500 font-bold block">القيمة المالية للمخزون:</span>
            <span className="text-base font-black text-slate-900 font-mono mt-1 block">
              {inventoryStats.totalValue.toLocaleString()} {storeCurrency}
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
            <span className="text-[10px] text-slate-500 font-bold block">إجمالي القطع المخزنة:</span>
            <span className="text-base font-black text-indigo-600 font-mono mt-1 block">
              {inventoryStats.totalStock} قطعة
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
            <span className="text-[10px] text-slate-500 font-bold block">منتجات منتهية المخزون:</span>
            <span className="text-base font-black text-rose-600 font-mono mt-1 block">
              {inventoryStats.outOfStock} صنف
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
            <span className="text-[10px] text-slate-500 font-bold block">مخزون حرج (أقل من 5):</span>
            <span className="text-base font-black text-amber-600 font-mono mt-1 block">
              {inventoryStats.lowStock} صنف
            </span>
          </div>
        </div>
      </div>

      {/* 📉 مقارنة الأداء المالي بالفترات (Period Comparison - Growth Analysis) */}
      <div className="bg-white border border-slate-200/90 rounded-[28px] p-4 sm:p-6 shadow-xs space-y-6">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100/80 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-slate-900">مقارنة الأداء المالي وتحليل النمو بالفترات (Period Comparison)</h3>
                <span className="text-[9px] font-black bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-mono">BI Analytics</span>
              </div>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                اختر فترتين مخصصتين أو استخدم الجاهزة لمقارنة المبيعات والطلبات ومتوسط الشراء ونسبة النمو
              </p>
            </div>
          </div>

          <button
            onClick={() => triggerPrintWithOptions("تقرير مقارنة الأداء المالي بالفترات", (size) => printPeriodComparisonReport(periodComparison, storeCurrency, size, `مقارنة: ${periodComparison.titleA} ضد ${periodComparison.titleB}`))}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#072d5c] hover:bg-[#093c7a] text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs shrink-0"
          >
            <Printer className="w-4 h-4 text-sky-300" />
            <span>طباعة تقرير المقارنة</span>
          </button>
        </div>

        {/* Preset Selector Grid */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-700 block">اختر نمط المقارنة أو الاختصارات السريعة:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <button
              onClick={() => handleSelectComparisonMode("CUSTOM")}
              className={`p-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 border text-center ${
                comparisonMode === "CUSTOM"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.01]"
                  : "bg-slate-50 text-indigo-900 border-indigo-100 hover:bg-indigo-50"
              }`}
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>فترات مخصصة 🗓️</span>
            </button>

            <button
              onClick={() => handleSelectComparisonMode("MONTH_VS_PREV_MONTH")}
              className={`p-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 border text-center ${
                comparisonMode === "MONTH_VS_PREV_MONTH"
                  ? "bg-blue-600 text-white border-blue-600 shadow-md scale-[1.01]"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>الشهر الحالي vs السابق</span>
            </button>

            <button
              onClick={() => handleSelectComparisonMode("MONTH_VS_SAME_MONTH_PREV_YEAR")}
              className={`p-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 border text-center ${
                comparisonMode === "MONTH_VS_SAME_MONTH_PREV_YEAR"
                  ? "bg-blue-600 text-white border-blue-600 shadow-md scale-[1.01]"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>الشهر vs العام الماضي</span>
            </button>

            <button
              onClick={() => handleSelectComparisonMode("WEEK_VS_PREV_WEEK")}
              className={`p-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 border text-center ${
                comparisonMode === "WEEK_VS_PREV_WEEK"
                  ? "bg-blue-600 text-white border-blue-600 shadow-md scale-[1.01]"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>الأسبوع vs السابق</span>
            </button>

            <button
              onClick={() => handleSelectComparisonMode("YEAR_VS_PREV_YEAR")}
              className={`p-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 border text-center ${
                comparisonMode === "YEAR_VS_PREV_YEAR"
                  ? "bg-blue-600 text-white border-blue-600 shadow-md scale-[1.01]"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>السنة vs السابقة</span>
            </button>
          </div>
        </div>

        {/* Always open / accessible Custom Date Selector Boxes */}
        <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-blue-50/80 border border-indigo-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100/90 pb-3">
            <div className="flex items-center gap-2 text-xs font-black text-indigo-950">
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>تحديد نطاق التواريخ المباشر للفترتين المراد مقاربتهما (المقارنة المفتوحة):</span>
            </div>
            <div className="flex items-center gap-2">
              {comparisonMode !== "CUSTOM" && (
                <span className="text-[10px] text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full font-bold">
                  مفعل مسبقاً (يمكن التعديل)
                </span>
              )}
              <span className="text-[10px] text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full font-extrabold">
                Full Range Control
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Period A */}
            <div className="bg-white p-4 rounded-xl border border-indigo-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-900 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-600 shadow-2xs shrink-0" />
                  <span>الفترة الأولى (Period A - الأساسية):</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold">الفترة المراد اختبارها</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">من تاريخ:</label>
                  <input 
                    type="date"
                    value={compStartDateA}
                    onChange={(e) => {
                      setCompStartDateA(e.target.value);
                      setComparisonMode("CUSTOM");
                    }}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 font-mono text-slate-800 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">إلى تاريخ:</label>
                  <input 
                    type="date"
                    value={compEndDateA}
                    onChange={(e) => {
                      setCompEndDateA(e.target.value);
                      setComparisonMode("CUSTOM");
                    }}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 font-mono text-slate-800 text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Period B */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-400 shadow-2xs shrink-0" />
                  <span>الفترة الثانية للمقارنة (Period B - المرجع):</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold">فترة المقارنة المرجعية</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">من تاريخ:</label>
                  <input 
                    type="date"
                    value={compStartDateB}
                    onChange={(e) => {
                      setCompStartDateB(e.target.value);
                      setComparisonMode("CUSTOM");
                    }}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 font-mono text-slate-800 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">إلى تاريخ:</label>
                  <input 
                    type="date"
                    value={compEndDateB}
                    onChange={(e) => {
                      setCompEndDateB(e.target.value);
                      setComparisonMode("CUSTOM");
                    }}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 font-mono text-slate-800 text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Card 1: Total Sales */}
          <div className="bg-slate-50 border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl space-y-2 overflow-hidden">
            <div className="flex items-center justify-between gap-1.5 min-w-0">
              <span className="text-xs font-black text-slate-700 truncate min-w-0 flex-1" title="حجم المبيعات الإجمالي">حجم المبيعات الإجمالي</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono flex items-center gap-0.5 shrink-0 whitespace-nowrap ${
                (periodComparison?.growth?.sales || 0) >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              }`}>
                {(periodComparison?.growth?.sales || 0) >= 0 ? <ArrowUpRight className="w-3 h-3 shrink-0" /> : <ArrowDownRight className="w-3 h-3 shrink-0" />}
                <span>{(periodComparison?.growth?.sales || 0) >= 0 ? `+${(periodComparison?.growth?.sales || 0).toFixed(1)}%` : `${(periodComparison?.growth?.sales || 0).toFixed(1)}%`}</span>
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1 gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-500 block font-bold truncate" title={periodComparison?.titleA || ""}>{periodComparison?.titleA || "الفترة أ"}</span>
                <span className="text-base sm:text-lg font-black text-blue-900 font-mono block truncate">{(periodComparison?.periodA?.sales || 0).toFixed(1)} {storeCurrency}</span>
              </div>
              <div className="text-left shrink-0 max-w-[45%]">
                <span className="text-[10px] text-slate-400 block font-bold truncate" title={periodComparison?.titleB || ""}>{periodComparison?.titleB || "الفترة ب"}</span>
                <span className="text-xs font-bold text-slate-500 font-mono block truncate">{(periodComparison?.periodB?.sales || 0).toFixed(1)} {storeCurrency}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="bg-slate-50 border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl space-y-2 overflow-hidden">
            <div className="flex items-center justify-between gap-1.5 min-w-0">
              <span className="text-xs font-black text-slate-700 truncate min-w-0 flex-1" title="عدد الطلبات الكلي">عدد الطلبات الكلي</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono flex items-center gap-0.5 shrink-0 whitespace-nowrap ${
                (periodComparison?.growth?.orders || 0) >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              }`}>
                {(periodComparison?.growth?.orders || 0) >= 0 ? <ArrowUpRight className="w-3 h-3 shrink-0" /> : <ArrowDownRight className="w-3 h-3 shrink-0" />}
                <span>{(periodComparison?.growth?.orders || 0) >= 0 ? `+${(periodComparison?.growth?.orders || 0).toFixed(1)}%` : `${(periodComparison?.growth?.orders || 0).toFixed(1)}%`}</span>
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1 gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-500 block font-bold truncate" title={periodComparison?.titleA || ""}>{periodComparison?.titleA || "الفترة أ"}</span>
                <span className="text-base sm:text-lg font-black text-slate-900 font-mono block truncate">{periodComparison?.periodA?.ordersCount || 0} طلبات</span>
              </div>
              <div className="text-left shrink-0 max-w-[45%]">
                <span className="text-[10px] text-slate-400 block font-bold truncate" title={periodComparison?.titleB || ""}>{periodComparison?.titleB || "الفترة ب"}</span>
                <span className="text-xs font-bold text-slate-500 font-mono block truncate">{periodComparison?.periodB?.ordersCount || 0} طلبات</span>
              </div>
            </div>
          </div>

          {/* Card 3: Completed Orders */}
          <div className="bg-slate-50 border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl space-y-2 overflow-hidden">
            <div className="flex items-center justify-between gap-1.5 min-w-0">
              <span className="text-xs font-black text-slate-700 truncate min-w-0 flex-1" title="الطلبات المكتملة والمحصلة">الطلبات المكتملة والمحصلة</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono flex items-center gap-0.5 shrink-0 whitespace-nowrap ${
                (periodComparison?.growth?.completed || 0) >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              }`}>
                {(periodComparison?.growth?.completed || 0) >= 0 ? <ArrowUpRight className="w-3 h-3 shrink-0" /> : <ArrowDownRight className="w-3 h-3 shrink-0" />}
                <span>{(periodComparison?.growth?.completed || 0) >= 0 ? `+${(periodComparison?.growth?.completed || 0).toFixed(1)}%` : `${(periodComparison?.growth?.completed || 0).toFixed(1)}%`}</span>
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1 gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-500 block font-bold truncate" title={periodComparison?.titleA || ""}>{periodComparison?.titleA || "الفترة أ"}</span>
                <span className="text-base sm:text-lg font-black text-emerald-700 font-mono block truncate">{periodComparison?.periodA?.completedCount || 0} طلبات</span>
              </div>
              <div className="text-left shrink-0 max-w-[45%]">
                <span className="text-[10px] text-slate-400 block font-bold truncate" title={periodComparison?.titleB || ""}>{periodComparison?.titleB || "الفترة ب"}</span>
                <span className="text-xs font-bold text-slate-500 font-mono block truncate">{periodComparison?.periodB?.completedCount || 0} طلبات</span>
              </div>
            </div>
          </div>

          {/* Card 4: Average Order Value (AOV) */}
          <div className="bg-slate-50 border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl space-y-2 overflow-hidden">
            <div className="flex items-center justify-between gap-1.5 min-w-0">
              <span className="text-xs font-black text-slate-700 truncate min-w-0 flex-1" title="متوسط قيمة الطلب (AOV)">متوسط قيمة الطلب (AOV)</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono flex items-center gap-0.5 shrink-0 whitespace-nowrap ${
                (periodComparison?.growth?.aov || 0) >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              }`}>
                {(periodComparison?.growth?.aov || 0) >= 0 ? <ArrowUpRight className="w-3 h-3 shrink-0" /> : <ArrowDownRight className="w-3 h-3 shrink-0" />}
                <span>{(periodComparison?.growth?.aov || 0) >= 0 ? `+${(periodComparison?.growth?.aov || 0).toFixed(1)}%` : `${(periodComparison?.growth?.aov || 0).toFixed(1)}%`}</span>
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1 gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-slate-500 block font-bold truncate" title={periodComparison?.titleA || ""}>{periodComparison?.titleA || "الفترة أ"}</span>
                <span className="text-base sm:text-lg font-black text-indigo-900 font-mono block truncate">{(periodComparison?.periodA?.aov || 0).toFixed(1)} {storeCurrency}</span>
              </div>
              <div className="text-left shrink-0 max-w-[45%]">
                <span className="text-[10px] text-slate-400 block font-bold truncate" title={periodComparison?.titleB || ""}>{periodComparison?.titleB || "الفترة ب"}</span>
                <span className="text-xs font-bold text-slate-500 font-mono block truncate">{(periodComparison?.periodB?.aov || 0).toFixed(1)} {storeCurrency}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Visual Comparison Chart */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-xs font-black text-slate-800">مقارنة بصرية بين الفترتين ({periodComparison.titleA} مقارنةً بـ {periodComparison.titleB})</span>
            <div className="flex items-center gap-4 text-[10px] font-black flex-wrap">
              <span className="flex items-center gap-1.5 text-blue-800">
                <span className="w-3 h-3 bg-blue-600 rounded-sm shrink-0" />
                <span>{periodComparison.titleA}</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 bg-slate-400 rounded-sm shrink-0" />
                <span>{periodComparison.titleB}</span>
              </span>
            </div>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "المبيعات الإجمالية", [periodComparison.titleA]: periodComparison.periodA.sales, [periodComparison.titleB]: periodComparison.periodB.sales },
                  { name: "عدد الطلبات (×100)", [periodComparison.titleA]: periodComparison.periodA.ordersCount * 100, [periodComparison.titleB]: periodComparison.periodB.ordersCount * 100 },
                  { name: "متوسط قيمة الطلب", [periodComparison.titleA]: periodComparison.periodA.aov, [periodComparison.titleB]: periodComparison.periodB.aov },
                ]}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 'bold', fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomChartTooltip />} cursor={{ fill: '#f1f5f9', radius: 8 }} />
                <Bar dataKey={periodComparison.titleA} fill="#2563eb" radius={[6, 6, 0, 0]} barSize={28} />
                <Bar dataKey={periodComparison.titleB} fill="#94a3b8" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 🍩 Executive Donut & Regional Distribution Dashboard (inspired by reference image) */}
      <div className="bg-white border border-slate-200/90 rounded-[28px] p-5 sm:p-6 shadow-xs space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900">مخطط دائري يوضح توزيع بيانات مبيعات المتجر حسب المنطقة والكتالوج</h3>
                <span className="text-[9px] font-black bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-mono">SC- KPI Dashboard</span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                توزيع كلي للمبيعات والحصص السوقية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-black rounded-xl border border-slate-200">
              إجمالي {geographicalSales.length} مناطق شحن
            </span>
            <button
              onClick={() => triggerPrintWithOptions("تقرير التوزيع الجغرافي والأقسام", (size) => printGeographicalReport(geographicalSales, storeCurrency, size, getTimeRangeLabel()))}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة التوزيع</span>
            </button>
          </div>
        </div>

        {/* Dashboard Grid: Donut Left + Category/Region Cards & Bar Chart Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left: Multi-Layer Donut / Pie Chart */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 border border-slate-200/80 rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[320px]">
            <span className="text-xs font-black text-slate-700 mb-2 block self-start">مخطط التوزيع الدائري (Donut Distribution)</span>
            
            <div className="w-full h-64 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomChartTooltip />} />
                  <Pie
                    data={geographicalSales.length > 0 ? geographicalSales : [{ name: "لا توجد بيانات", sales: 1 }]}
                    dataKey="sales"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    cornerRadius={6}
                  >
                    {geographicalSales.map((entry, index) => {
                      const colors = ["#6366f1", "#06b6d4", "#f59e0b", "#ec4899", "#10b981", "#8b5cf6", "#3b82f6"];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="#ffffff" strokeWidth={2} />;
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] text-slate-400 font-bold">إجمالي المبيعات</span>
                <span className="text-sm font-black text-indigo-950 font-mono">
                  {(stats?.totalSales || 0).toLocaleString("ar-EG", { maximumFractionDigits: 0 })} {storeCurrency}
                </span>
                <span className="text-[9px] text-emerald-600 font-extrabold mt-0.5">
                  {filteredOrders.length} طلبات
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 flex-wrap pt-2 text-[10px] font-bold text-slate-600 border-t border-slate-200/60 w-full">
              {geographicalSales.slice(0, 4).map((geo, idx) => {
                const colors = ["#6366f1", "#06b6d4", "#f59e0b", "#ec4899"];
                return (
                  <span key={idx} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                    <span>{geo.name}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Right: Connector Cards (Top Regions) & Horizontal Total Sales Bar Chart */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Top Connector Cards (Regional / Category Breakdowns) */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-800 block">أبرز المناطق والقطاعات الأعلى أداءً (Continent / Region Cards):</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {geographicalSales.slice(0, 3).map((geo, idx) => {
                  const cardStyles = [
                    { border: "border-indigo-500", bg: "bg-indigo-600", text: "text-indigo-900", lightBg: "bg-indigo-50/80" },
                    { border: "border-teal-500", bg: "bg-teal-600", text: "text-teal-900", lightBg: "bg-teal-50/80" },
                    { border: "border-amber-500", bg: "bg-amber-500", text: "text-amber-900", lightBg: "bg-amber-50/80" },
                  ][idx % 3];

                  const pct = (stats?.totalSales || 0) > 0 ? (((geo.sales || 0) / stats.totalSales) * 100).toFixed(1) : 0;

                  return (
                    <div key={idx} className={`${cardStyles.lightBg} border-r-4 ${cardStyles.border} border border-slate-200/80 p-3 rounded-2xl space-y-1.5 shadow-2xs`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black ${cardStyles.text} truncate`}>{geo.name}</span>
                        <span className={`px-2 py-0.5 ${cardStyles.bg} text-white rounded-full text-[9px] font-black font-mono`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-xs font-mono font-black text-slate-900">{geo.sales.toLocaleString()} {storeCurrency}</span>
                        <span className="text-[10px] text-slate-500 font-bold">{geo.ordersCount} طلب</span>
                      </div>
                    </div>
                  );
                })}

                {geographicalSales.length === 0 && (
                  <div className="col-span-3 text-center py-4 bg-slate-50 text-slate-400 text-xs rounded-xl border border-dashed border-slate-200">
                    لا توجد بيانات شحن للمناطق حالياً
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Horizontal Bar Chart (Total Sales) matching reference image */}
            <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800">إجمالي المبيعات الإقليمية (Total Sales)</span>
                <span className="text-[10px] text-slate-400 font-bold">مقارنة حجم المبيعات بين أعلى المناطق</span>
              </div>

              <div className="h-44 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="yx"
                    data={geographicalSales.slice(0, 5)}
                    margin={{ top: 5, right: 15, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#334155' }} width={80} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar dataKey="sales" name="المبيعات الإجمالية" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Weekly Sales Volume Bar Chart using Recharts */}
      <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-blue-600 rounded-full" />
              <span>مخطط أداء وحجم المبيعات اليومية خلال الأسبوع الحالي</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block font-bold">رسم بياني تفاعلي يوضح الإيرادات الإجمالية بالعملة المحلية وعدد الطلبات لكل يوم</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 rounded-xl px-3 py-1 shrink-0">
            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full" />
            <span className="text-[10px] font-black text-slate-600">المبيعات الإجمالية ({storeCurrency})</span>
          </div>
        </div>

        <div className="h-[280px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklySalesData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="dayName" 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#64748b', fontSize: 9, fontWeight: 'medium' }} 
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip content={<CustomChartTooltip />} cursor={{ fill: '#f8fafc', radius: 10 }} />
              <Bar dataKey="sales" fill="#2563eb" radius={[10, 10, 0, 0]}>
                {weeklySalesData.map((entry, index) => {
                  const isToday = index === 6;
                  return <Cell key={`cell-${index}`} fill={isToday ? '#1d4ed8' : '#3b82f6'} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 pt-2 border-t border-slate-100">
          {weeklySalesData.map((day, idx) => (
            <div key={idx} className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
              <span className="text-[9px] text-slate-400 block font-bold">{day.dayName}</span>
              <span className="text-[10px] text-slate-800 font-extrabold block mt-0.5 truncate">{(day?.sales || 0).toFixed(0)} {storeCurrency}</span>
              <span className="text-[8px] text-slate-500 font-medium block mt-0.5">{day.ordersCount} طلبات</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category Distribution Chart & Order Status Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Distribution */}
        <div className="bg-white border border-slate-200/90 rounded-[28px] p-5 shadow-xs space-y-4">
          <div>
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-emerald-600 rounded-full" />
              <span>توزيع الإيرادات حسب أقسام المنتجات</span>
            </span>
            <span className="text-[10px] text-slate-400 mt-1 block font-bold">حجم المبيعات وقوة الطلب لكل قسم من أقسام المتجر</span>
          </div>

          <div className="h-[250px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="yx"
                data={categorySalesData}
                margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<CustomChartTooltip />} cursor={{ fill: '#f8fafc', radius: 8 }} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Breakdown Funnel */}
        <div className="bg-white border border-slate-200/90 rounded-[28px] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-sky-600 rounded-full" />
              <span>مراحل وحالات الطلبات النشطة (Order Funnel)</span>
            </span>
            <span className="text-[10px] text-slate-400 font-bold">توزيع الطلبات حسب المرحلة</span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-black">
                <span className="text-amber-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>جديدة / قيد الانتظار (Pending)</span>
                </span>
                <span className="font-mono">{statusFunnel.PENDING} طلبات</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                  style={{ width: `${filteredOrders.length > 0 ? (statusFunnel.PENDING / filteredOrders.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-black">
                <span className="text-blue-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>جاري التجهيز والتعبئة (Processing)</span>
                </span>
                <span className="font-mono">{statusFunnel.PROCESSING} طلبات</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                  style={{ width: `${filteredOrders.length > 0 ? (statusFunnel.PROCESSING / filteredOrders.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-black">
                <span className="text-sky-700 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  <span>خرجت مع مندوب الشحن (Shipped)</span>
                </span>
                <span className="font-mono">{statusFunnel.SHIPPED} طلبات</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-sky-500 rounded-full transition-all duration-500" 
                  style={{ width: `${filteredOrders.length > 0 ? (statusFunnel.SHIPPED / filteredOrders.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-black">
                <span className="text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تم التسليم والاستلام (Completed)</span>
                </span>
                <span className="font-mono">{statusFunnel.COMPLETED} طلبات</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${filteredOrders.length > 0 ? (statusFunnel.COMPLETED / filteredOrders.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-black">
                <span className="text-rose-700 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>ملغاة ومسترجعة (Cancelled)</span>
                </span>
                <span className="font-mono">{statusFunnel.CANCELLED} طلبات</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-rose-500 rounded-full transition-all duration-500" 
                  style={{ width: `${filteredOrders.length > 0 ? (statusFunnel.CANCELLED / filteredOrders.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Top Products & Geographical Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Selling Products List */}
        <div className="bg-white border border-slate-200/90 rounded-[28px] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-blue-600 rounded-full" />
              <span>المنتجات الأكثر مبيعاً ورواجاً</span>
            </span>
            <button
              onClick={() => triggerPrintWithOptions("تقرير المنتجات الأكثر طلباً", (size) => printTopProductsReport(topSellingProducts, Object.entries(analyticsData.searches || {}).map(([term, count]) => ({ term, count })), storeCurrency, size, `النطاق: ${getTimeRangeLabel()}`))}
              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1"
            >
              <Printer className="w-3 h-3" />
              <span>طباعة التقرير</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-1">
            {topSellingProducts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">لا تتوفر مبيعات سابقة لحساب المنتجات الأكثر مبيعاً</p>
            ) : (
              topSellingProducts.map((prod, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-500 text-[10px]">
                      {idx + 1}
                    </span>
                    {prod.image && (
                      <img src={prod.image} alt={prod.name} className="w-9 h-9 object-cover rounded-lg border border-slate-200" referrerPolicy="no-referrer" />
                    )}
                    <div>
                      <span className="font-extrabold text-slate-800 block">{prod.name}</span>
                      <span className="text-[9px] text-slate-400 mt-0.5 block font-bold">الكمية الإجمالية المباعة: {prod.quantity} قطعة</span>
                    </div>
                  </div>
                  <span className="font-black text-blue-700 font-mono bg-blue-50 px-2.5 py-1 rounded-lg">
                    {(prod?.totalValue || 0).toFixed(1)} {storeCurrency}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Geographical Performance Table */}
        <div className="bg-white border border-slate-200/90 rounded-[28px] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-emerald-600 rounded-full" />
              <span>المبيعات حسب المحافظات</span>
            </span>
            <button
              onClick={() => triggerPrintWithOptions("تقرير مبيعات المحافظات", (size) => printGeographicalReport(geographicalSales, storeCurrency, size, `النطاق: ${getTimeRangeLabel()}`))}
              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1"
            >
              <Printer className="w-3 h-3" />
              <span>طباعة تقرير المحافظات</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-1">
            {geographicalSales.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">لا تتوفر مبيعات لحساب التوزيع الجغرافي للمحافظات</p>
            ) : (
              geographicalSales.map((geoLoc, idx) => (
                <div key={idx} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="font-extrabold text-slate-800 block">{geoLoc.name}</span>
                      <span className="text-[9px] text-slate-400 mt-0.5 block font-bold">إجمالي المعاملات الناجحة: {geoLoc.ordersCount} طلب</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="font-black text-emerald-700 font-mono bg-emerald-50 px-2.5 py-1 rounded-lg">
                      +{(geoLoc?.revenue || 0).toFixed(1)} {storeCurrency}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Customer Intent Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Search Terms */}
        <div className="bg-white border border-slate-200/90 rounded-[28px] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-indigo-600 rounded-full" />
              <span>الكلمات والعبارات الأكثر بحثاً من العملاء</span>
            </span>
            <span className="text-[9px] text-slate-400 font-black">رصد اهتمامات الزوار المباشرة</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[250px] overflow-y-auto pr-1 space-y-1">
            {Object.keys(analyticsData.searches || {}).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">لا توجد عمليات بحث مسجلة حتى الآن</p>
            ) : (
              Object.entries(analyticsData.searches || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([term, count], idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-black flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="text-slate-800 font-extrabold">"{term}"</span>
                    </div>
                    <span className="text-[10px] font-mono font-black bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                      {count} مرات بحث
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Most Viewed Products */}
        <div className="bg-white border border-slate-200/90 rounded-[28px] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-amber-500 rounded-full" />
              <span>المنتجات الأكثر مشاهدة وزيارة من الزوار</span>
            </span>
            <span className="text-[9px] text-slate-400 font-black">تحليل النقرات والاهتمام بالمنتج</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[250px] overflow-y-auto pr-1">
            {Object.keys(analyticsData.productViews || {}).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12">لا توجد نقرات مسجلة على المنتجات حتى الآن</p>
            ) : (
              Object.entries(analyticsData.productViews || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([productId, count], idx) => {
                  const matchedProduct = products.find(p => String(p.id) === String(productId));
                  return (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs font-bold text-slate-700">
                      <div className="flex items-center gap-2.5 max-w-[70%]">
                        <span className="w-5 h-5 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-black flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        {matchedProduct?.image && (
                          <img src={matchedProduct.image} alt={matchedProduct.name} className="w-8 h-8 object-cover rounded-md border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
                        )}
                        <span className="truncate text-slate-800 font-extrabold">{matchedProduct ? matchedProduct.name : `منتج رقم ${productId}`}</span>
                      </div>
                      <span className="text-[10px] font-mono font-black bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full shrink-0">
                        {count} مشاهدات
                      </span>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* Historical Order Breakdown detailed financial ledger */}
      <div className="bg-white border border-slate-200/90 rounded-[28px] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-slate-900 rounded-full" />
            <span className="text-xs font-black text-slate-900">دفتر المحاسبة والأستاذ المالي المفصل للطلبات ({filteredOrders.length})</span>
            <button
              onClick={() => triggerPrintWithOptions("دفتر المحاسبة والأستاذ العام", (size) => printGeneralLedgerReport(filteredOrders, storeCurrency, size, `النطاق: ${getTimeRangeLabel()}`))}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs mr-2"
            >
              <Printer className="w-3 h-3 text-emerald-400" />
              <span>طباعة دفتر الأستاذ العام</span>
            </button>
          </div>

          <div className="relative max-w-xs w-full">
            <input 
              type="text"
              placeholder="تصفية برقم الطلب أو اسم العميل..."
              value={ledgerSearch}
              onChange={(e) => setLedgerSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pr-8 pl-3 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-right text-[11px] font-bold border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <th className="py-2.5 px-3 font-black">الرقم المرجعي</th>
                <th className="py-2.5 px-3 font-black">العميل والموقع</th>
                <th className="py-2.5 px-3 font-black text-center">عدد الأصناف</th>
                <th className="py-2.5 px-3 font-black text-center">حالة الطلب</th>
                <th className="py-2.5 px-3 font-black text-center">تكلفة الشحن</th>
                <th className="py-2.5 px-3 font-black text-left">الصافي الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders
                .filter(o => {
                  if (!ledgerSearch) return true;
                  const query = ledgerSearch.toLowerCase();
                  return (String(o.orderNumber || "").toLowerCase().includes(query) ||
                          (o.customerName || "").toLowerCase().includes(query));
                })
                .map(order => {
                  const itemsCount = (order.items || []).reduce((sum, item) => sum + (item?.quantity || 1), 0);
                  const isCancelled = order.status && ["CANCELED", "CANCELLED"].includes(order.status.toUpperCase());
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 text-slate-900 font-mono font-bold">#{order.orderNumber}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-slate-900 font-extrabold">{order.customerName}</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{order.shippingLocationName || "القاهرة وباقي المحافظات"}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{itemsCount} أصناف</td>
                      <td className="py-2.5 px-3 text-center">
                        {isCancelled ? (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-rose-50 text-rose-600 font-bold whitespace-nowrap inline-block">ملغي ومسترجع</span>
                        ) : order.status && ["COMPLETED", "DELIVERED"].includes(order.status.toUpperCase()) ? (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold font-mono whitespace-nowrap inline-block">مكتمل ومسدد</span>
                        ) : (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-amber-50 text-amber-600 font-bold font-mono whitespace-nowrap inline-block">قيد المعالجة</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600 font-bold">
                        {order.shippingCost ? `+${order.shippingCost} ${storeCurrency}` : "مجاني"}
                      </td>
                      <td className={`py-2.5 px-3 text-left font-mono font-black ${isCancelled ? "text-slate-400 line-through" : "text-slate-900"}`}>
                        {order.total} {storeCurrency}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <PrintOptionsModal 
        isOpen={printModalConfig.isOpen}
        onClose={() => setPrintModalConfig({ ...printModalConfig, isOpen: false })}
        onConfirmPrint={(size) => printModalConfig.onConfirm?.(size)}
        reportTitle={printModalConfig.title}
      />

    </div>
  );
}
