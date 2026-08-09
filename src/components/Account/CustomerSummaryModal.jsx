import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  User, 
  ShoppingBag, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Eye,
  ShieldCheck,
  TrendingUp,
  Award
} from "lucide-react";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

export default function CustomerSummaryModal({ 
  customer, 
  allOrders = [], 
  isOpen, 
  onClose, 
  onSelectOrder,
  storeCurrency = "ج.م" 
}) {
  useBodyScrollLock(isOpen);

  if (!isOpen || !customer) return null;

  // Find all orders belonging to this customer by matching phone, email, or customerName
  const customerPhone = (customer.phone || customer.customerPhone || "").trim();
  const customerEmail = (customer.email || customer.customerEmail || "").toLowerCase().trim();
  const customerName = (customer.name || customer.customerName || "").toLowerCase().trim();

  const customerOrders = allOrders.filter(order => {
    const oPhone = (order.customerPhone || order.phone || "").trim();
    const oEmail = (order.customerEmail || order.email || "").toLowerCase().trim();
    const oName = (order.customerName || order.name || "").toLowerCase().trim();

    if (customerPhone && oPhone && (customerPhone === oPhone || oPhone.includes(customerPhone) || customerPhone.includes(oPhone))) return true;
    if (customerEmail && oEmail && customerEmail === oEmail) return true;
    if (customerName && oName && customerName === oName) return true;
    return false;
  });

  // Calculate Stats
  const totalOrdersCount = customerOrders.length;
  const totalSpent = customerOrders.reduce((sum, o) => {
    // Only include non-canceled orders in total spent
    if ((o.status || "").toUpperCase() !== "CANCELED") {
      return sum + (parseFloat(o.total) || 0);
    }
    return sum;
  }, 0);

  const completedOrders = customerOrders.filter(o => {
    const st = (o.status || "").toUpperCase();
    return st === "DELIVERED" || st === "COMPLETED";
  }).length;

  const canceledOrders = customerOrders.filter(o => {
    return (o.status || "").toUpperCase() === "CANCELED";
  }).length;

  const activeOrders = customerOrders.filter(o => {
    const st = (o.status || "").toUpperCase();
    return st === "PENDING" || st === "PREPARING" || st === "SHIPPED";
  }).length;

  // Delivery Commitment Rate (نسبة الالتزام بالاستلام)
  // If no orders yet, 100%. If orders exist, non-canceled out of total.
  const commitmentRate = totalOrdersCount > 0 
    ? Math.round(((totalOrdersCount - canceledOrders) / totalOrdersCount) * 100)
    : 100;

  const getCommitmentBadge = (rate) => {
    if (rate >= 80) {
      return {
        label: "التزام ممتاز بالاستلام 🌟",
        color: "bg-emerald-50 text-emerald-800 border-emerald-200",
        barColor: "bg-emerald-500"
      };
    } else if (rate >= 50) {
      return {
        label: "التزام متوسط بالاستلام ⚠️",
        color: "bg-amber-50 text-amber-800 border-amber-200",
        barColor: "bg-amber-500"
      };
    } else {
      return {
        label: "نسبة إلغاء مرتفعة 🛑",
        color: "bg-rose-50 text-rose-800 border-rose-200",
        barColor: "bg-rose-500"
      };
    }
  };

  const badgeInfo = getCommitmentBadge(commitmentRate);

  const formatDate = (dateVal) => {
    if (!dateVal) return "غير مدون";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
  };

  const getStatusBadge = (status) => {
    const st = (status || "PENDING").toUpperCase();
    switch (st) {
      case "DELIVERED":
      case "COMPLETED":
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black whitespace-nowrap shrink-0 inline-flex items-center justify-center">مكتمل ومستلم ✅</span>;
      case "SHIPPED":
        return <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-black whitespace-nowrap shrink-0 inline-flex items-center justify-center">جاري الشحن 🚚</span>;
      case "PREPARING":
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-[10px] font-black whitespace-nowrap shrink-0 inline-flex items-center justify-center">جاري التجهيز 📦</span>;
      case "CANCELED":
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-[10px] font-black whitespace-nowrap shrink-0 inline-flex items-center justify-center">ملغي ❌</span>;
      default:
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black whitespace-nowrap shrink-0 inline-flex items-center justify-center">قيد المراجعة ⏳</span>;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[120] flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-[28px] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col text-right"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white rounded-t-[28px] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-blue-300 font-black text-lg shadow-inner">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <span>ملخص وسجل العميل: {customer.name || customer.customerName || "عميل بدون اسم"}</span>
                  {customer.role === "admin" && (
                    <span className="text-[9px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-bold">مدير</span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5 font-medium">سجل المشتريات ونسبة الالتزام بالاستلام</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            
            {/* Customer Information Bar */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-slate-400 font-bold">الهاتف:</span>
                <span className="font-mono font-black dir-ltr text-slate-900">{customerPhone || "غير مسجل"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-slate-400 font-bold">البريد:</span>
                <span className="font-mono font-bold truncate text-slate-900">{customerEmail || "غير مسجل"}</span>
              </div>
              {customer.address && (
                <div className="sm:col-span-2 flex items-start gap-2 text-slate-700 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-slate-400 font-bold shrink-0">العنوان المسجل:</span>
                  <span className="font-bold text-slate-900">{customer.address}</span>
                </div>
              )}
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Total Spent Card */}
              <div className="bg-blue-50/60 border border-blue-100/80 p-4 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-blue-700 mb-2">
                  <span className="text-[10px] font-black">إجمالي المشتريات السابقة</span>
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className="text-lg font-black text-blue-950 font-mono">
                  {totalSpent.toLocaleString()} <span className="text-xs">{storeCurrency}</span>
                </div>
                <span className="text-[9px] text-blue-600 font-bold mt-1">المبلغ الإجمالي المكتمل</span>
              </div>

              {/* Total Orders Card */}
              <div className="bg-indigo-50/60 border border-indigo-100/80 p-4 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-indigo-700 mb-2">
                  <span className="text-[10px] font-black">عدد الطلبات الكلي</span>
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="text-lg font-black text-indigo-950 font-mono">
                  {totalOrdersCount} <span className="text-xs">طلبات</span>
                </div>
                <span className="text-[9px] text-indigo-600 font-bold mt-1">
                  {completedOrders} مستلم | {activeOrders} نشط | {canceledOrders} ملغي
                </span>
              </div>

              {/* Delivery Commitment Rate */}
              <div className={`border p-4 rounded-2xl flex flex-col justify-between ${badgeInfo.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black">نسبة الالتزام بالاستلام</span>
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xl font-black font-mono leading-none">
                    {commitmentRate}%
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full mt-2 overflow-hidden">
                    <div className={`h-full ${badgeInfo.barColor} transition-all duration-500`} style={{ width: `${commitmentRate}%` }}></div>
                  </div>
                </div>
                <span className="text-[10px] font-black mt-2 block">{badgeInfo.label}</span>
              </div>
            </div>

            {/* Orders History List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 border-r-3 border-blue-600 pr-2.5">
                  سجل طلبات العميل بالتفصيل ({customerOrders.length})
                </h4>
              </div>

              {customerOrders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                  <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">لا توجد طلبات سابقة مسجلة لبريد أو هاتف هذا العميل حتى الآن</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {customerOrders.map(order => (
                    <div key={order.id} className="p-3.5 bg-white hover:bg-slate-50/80 transition-colors flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-blue-900 font-mono">#{order.orderNumber || order.id}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium flex items-center gap-2">
                          <span>{formatDate(order.createdAt || order.date)}</span>
                          <span>•</span>
                          <span>{(order.items || []).length} منتجات</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          {(parseFloat(order.total) || 0).toLocaleString()} {storeCurrency}
                        </span>
                        {onSelectOrder && (
                          <button
                            onClick={() => {
                              onClose();
                              onSelectOrder(order);
                            }}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                            title="فتح تفاصيل هذه الطلبية"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>التفاصيل</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all cursor-pointer active:scale-95"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
