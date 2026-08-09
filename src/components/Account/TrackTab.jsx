import React, { useState, useEffect } from "react";
import { getStoreSettings } from "../../lib/storeSettingsService";
import { 
  Search, 
  MapPin, 
  Phone, 
  Mail,
  User, 
  Calendar, 
  CreditCard, 
  ShoppingBag, 
  CheckCircle2, 
  X, 
  Truck, 
  Printer, 
  Clock, 
  Package, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { printInvoice } from "../../lib/invoicePrinter";
import { shopApi } from "../../api";
import OrderTimeline from "./OrderTimeline";

export default function TrackTab({ lang = "ar", storeCurrency = "ج.م", isEmbedded = false }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [foundOrders, setFoundOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Auto-search if orderId is in URL or track_order event
  useEffect(() => {
    const checkAndSearch = (targetQuery) => {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash || "";
      let urlOrderId = params.get("order") || params.get("orderId") || params.get("id");
      if (params.get("track") && params.get("track") !== "1") {
        urlOrderId = urlOrderId || params.get("track");
      }

      let hashOrderId = null;
      if (hash.includes("?")) {
        const hashParams = new URLSearchParams(hash.split("?")[1]);
        hashOrderId = hashParams.get("order") || hashParams.get("orderId") || hashParams.get("id");
      }

      const target = targetQuery || urlOrderId || hashOrderId;

      if (target && target !== "1") {
        setSearchQuery(target);
        handleSearch(target);
      }
    };

    checkAndSearch();

    const handleCustomTrackEvent = (e) => {
      if (e.detail && e.detail !== "1") {
        setSearchQuery(e.detail);
        handleSearch(e.detail);
      }
    };

    window.addEventListener("track_order", handleCustomTrackEvent);
    return () => window.removeEventListener("track_order", handleCustomTrackEvent);
  }, []);

  const handleSearch = async (overrideQuery) => {
    const query = (overrideQuery || searchQuery || "").trim();
    if (!query) {
      setErrorMsg(lang === "ar" ? "يرجى كتابة رقم الطلب أو رقم الهاتف للبحث" : "Please enter an order number or phone number");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setFoundOrders([]);
    setSelectedOrder(null);

    try {
      // Fetch all orders from firestore/local storage mirror
      const allOrders = await shopApi.getOrders();
      
      // Clean query
      const cleanQuery = query.toLowerCase().replace(/#/g, "");

      // Filter orders by:
      // 1. Order ID (Firestore ID)
      // 2. Order Number (custom generated number like 123456)
      // 3. Customer Phone Number
      // 4. Customer Email Address
      const matches = allOrders.filter(order => {
        if (!order) return false;
        
        const oId = String(order.id || "").toLowerCase();
        const oNum = String(order.orderNumber || "").toLowerCase();
        const oPhone = String(order.customerPhone || "").toLowerCase().replace(/[\s-]/g, "");
        const oEmail = String(order.customerEmail || order.email || "").toLowerCase();
        const oName = String(order.customerName || "").toLowerCase();

        return oId.includes(cleanQuery) || 
               oNum.includes(cleanQuery) || 
               oPhone.includes(cleanQuery) ||
               oEmail.includes(cleanQuery) ||
               oName.includes(cleanQuery);
      });

      if (matches.length === 0) {
        setErrorMsg(lang === "ar" 
          ? "عذراً، لم نتمكن من العثور على أي طلبات مطابقة للبيانات المدخلة. يرجى التحقق وإعادة المحاولة." 
          : "Sorry, we couldn't find any orders matching the entered details. Please verify and try again."
        );
      } else {
        setFoundOrders(matches);
        if (matches.length === 1) {
          setSelectedOrder(matches[0]);
        }
      }
    } catch (err) {
      console.error("Order tracking search error:", err);
      setErrorMsg(lang === "ar" 
        ? "حدث خطأ غير متوقع أثناء معالجة طلبك، يرجى المحاولة مرة أخرى لاحقاً." 
        : "An unexpected error occurred. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "غير محدد";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusText = (status = "PENDING") => {
    const s = status.toUpperCase();
    if (s === "PENDING") return lang === "ar" ? "تم الطلب (قيد المراجعة)" : "Order Submitted";
    if (s === "PREPARING") return lang === "ar" ? "قيد التحضير والتغليف" : "Preparing Package";
    if (s === "SHIPPED" || s === "DELIVERING") return lang === "ar" ? "جاري التوصيل مع المندوب" : "Out for Delivery";
    if (s === "COMPLETED" || s === "DELIVERED") return lang === "ar" ? "تم التوصيل والكمال بنجاح" : "Delivered Successfully";
    if (s === "CANCELED" || s === "CANCELLED") return lang === "ar" ? "تم إلغاء الطلب" : "Order Cancelled";
    return status;
  };

  const getStatusColorClass = (status = "PENDING") => {
    const s = status.toUpperCase();
    if (s === "PENDING") return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/40";
    if (s === "PREPARING") return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/40";
    if (s === "SHIPPED" || s === "DELIVERING") return "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/40";
    if (s === "COMPLETED" || s === "DELIVERED") return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/40";
    return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800/40";
  };

  return (
    <div className={isEmbedded ? "space-y-6 font-sans text-right" : "max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans"}>
      
      {/* Page Title Header */}
      {!isEmbedded && (
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight flex items-center justify-center gap-2">
            <Truck className="w-7 h-7 text-blue-600 animate-bounce" />
            <span>{lang === "ar" ? "تتبع حالة طلبك" : "Track Your Order"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-bold max-w-lg mx-auto leading-relaxed">
            {lang === "ar" 
              ? "أدخل رقم الطلب الخاص بك أو رقم الهاتف المحمول لمتابعة الشحنة لحظة بلحظة دون الحاجة لتسجيل الدخول."
              : "Enter your reference order number or registered mobile phone to follow your shipment live without login."}
          </p>
        </div>
      )}

      {/* Modern Search Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/60 dark:border-slate-800/60 p-5 sm:p-6 shadow-sm">
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "ar" ? "رقم الطلب (مثال: 123456) أو رقم الهاتف..." : "Order ID (e.g. 123456) or phone number..."}
              className="w-full pr-12 pl-4 py-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-black focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all text-right placeholder:text-slate-400 dark:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs sm:text-sm font-extrabold rounded-2xl transition-all shadow-md shadow-blue-500/10 cursor-pointer whitespace-nowrap active:scale-98 flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              <span className="w-4 h-4 rounded-full border-2 border-solid border-white border-r-transparent animate-spin" />
            ) : (
              <Search className="w-4 h-4 shrink-0" />
            )}
            <span>{lang === "ar" ? "بحث وتتبع" : "Track Order"}</span>
          </button>
        </form>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 p-3.5 rounded-xl border border-rose-100 dark:border-rose-900/30 text-xs font-black">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Multiple Orders Selector (if query returned several matches by phone) */}
      <AnimatePresence>
        {foundOrders.length > 1 && !selectedOrder && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/60 dark:border-slate-800/60 p-5 sm:p-6 shadow-sm space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">{lang === "ar" ? "تم العثور على أكثر من طلب" : "Multiple Orders Found"}</h3>
                <span className="text-[10px] text-slate-400 block font-bold">{lang === "ar" ? "يرجى تحديد الطلب الذي تريد تتبعه من القائمة أدناه:" : "Please choose the specific order you wish to track from the list:"}</span>
              </div>
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
              {foundOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full text-right p-4 rounded-2xl border border-slate-150 dark:border-slate-800 hover:border-blue-500/60 hover:bg-blue-50/20 dark:hover:bg-slate-950/30 transition-all flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-black text-slate-900 dark:text-white block">طلب رقم #{order.orderNumber}</span>
                    <span className="text-[10px] text-slate-400 font-bold block">{formatDate(order.createdAt || order.date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border whitespace-nowrap shrink-0 inline-flex items-center justify-center ${getStatusColorClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400">
                      {order.total} {storeCurrency}
                    </span>
                    <ArrowRight className={`w-4 h-4 text-slate-400 ${lang === "ar" ? "rotate-180" : ""}`} />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Core Track and Progress Panel */}
      <AnimatePresence mode="wait">
        {selectedOrder && (
          <motion.div
            key={selectedOrder.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Go back to list button if multiple found */}
            {foundOrders.length > 1 && (
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex items-center gap-1.5 text-xs font-black text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
              >
                <span>{lang === "ar" ? "العودة لقائمة الطلبات" : "Back to orders list"}</span>
                <ArrowRight className={`w-4 h-4 ${lang === "ar" ? "rotate-180" : ""}`} />
              </button>
            )}

            {/* Quick Status Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/60 dark:border-slate-800/60 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900 dark:text-white">طلب رقم: #{selectedOrder.orderNumber}</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black border whitespace-nowrap shrink-0 inline-flex items-center justify-center ${getStatusColorClass(selectedOrder.status)}`}>
                    {getStatusText(selectedOrder.status)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>تاريخ الطلب: {formatDate(selectedOrder.createdAt || selectedOrder.date)}</span>
                </div>
              </div>

              {/* Direct Print Invoice Button */}
              <button
                onClick={() => printInvoice(selectedOrder, storeCurrency)}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-black text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Printer className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === "ar" ? "طباعة الفاتورة الرسمية" : "Print Official Invoice"}</span>
              </button>
            </div>

            {/* Interactive Timeline Rendering */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/60 dark:border-slate-800/60 p-6 shadow-sm space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-4 bg-blue-600 rounded-full" />
                  <span>{lang === "ar" ? "المسار الزمني المباشر لحركة الشحنة" : "Live Shipment Timeline Status"}</span>
                </span>
              </div>
              <div className="pt-2">
                <OrderTimeline status={selectedOrder.status} />
              </div>
            </div>

            {/* General Order and Customer Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Shipping & Delivery Address Card */}
              <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/60 dark:border-slate-800/60 p-5 shadow-sm space-y-4 md:col-span-2">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">{lang === "ar" ? "بيانات العميل وعنوان التوصيل" : "Customer & Shipping Details"}</h4>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500 font-bold w-16 shrink-0">{lang === "ar" ? "الاسم الكامل:" : "Name:"}</span>
                    <span className="text-slate-800 dark:text-slate-200 font-black">{selectedOrder.customerName || "غير مسجل"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500 font-bold w-16 shrink-0">{lang === "ar" ? "رقم الهاتف:" : "Phone:"}</span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono font-bold" dir="ltr">{selectedOrder.customerPhone || "غير مسجل"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-500 font-bold w-16 shrink-0">{lang === "ar" ? "البريد:" : "Email:"}</span>
                    <span className="text-slate-800 dark:text-slate-200 font-mono font-bold truncate">{selectedOrder.customerEmail || selectedOrder.email || "غير مسجل"}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-slate-500 font-bold w-16 shrink-0">{lang === "ar" ? "العنوان:" : "Address:"}</span>
                    <span className="text-slate-800 dark:text-slate-200 font-black leading-relaxed">{selectedOrder.customerAddress || "غير مسجل"}</span>
                  </div>
                  {selectedOrder.customerNotes && (
                    <div className="bg-amber-50/70 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-100/60 dark:border-amber-900/30 text-amber-700 dark:text-amber-300 space-y-1">
                      <span className="text-[10px] font-black block">{lang === "ar" ? "ملاحظات للتسليم:" : "Delivery Notes:"}</span>
                      <p className="text-[11px] font-bold leading-relaxed">{selectedOrder.customerNotes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details Card */}
              <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/60 dark:border-slate-800/60 p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">{lang === "ar" ? "تفاصيل الدفع" : "Payment Details"}</h4>
                </div>
                <div className="space-y-3.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between items-center">
                    <span>{lang === "ar" ? "طريقة الدفع:" : "Method:"}</span>
                    <span className="text-slate-900 dark:text-white font-black">{selectedOrder.paymentMethod || "الدفع عند الاستلام"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{lang === "ar" ? "قيمة المشتريات:" : "Items Total:"}</span>
                    <span className="text-slate-900 dark:text-white font-mono">{selectedOrder.total} {storeCurrency}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{lang === "ar" ? "رسوم الشحن:" : "Delivery Fee:"}</span>
                    <span className="text-emerald-500 font-black">{lang === "ar" ? "شحن مجاني" : "Free Shipping"}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white font-black text-sm">
                    <span>{lang === "ar" ? "المبلغ المستحق:" : "Total Amount:"}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-mono text-base">{selectedOrder.total} {storeCurrency}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Order Items Table/List */}
            <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200/60 dark:border-slate-800/60 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <ShoppingBag className="w-4 h-4 text-blue-600 shrink-0" />
                <h4 className="text-xs font-black text-slate-900 dark:text-white">{lang === "ar" ? "المنتجات داخل الطرد" : "Items in the parcel"}</h4>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {(selectedOrder.items || []).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 py-4.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-xl p-1.5 flex items-center justify-center shrink-0">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="max-h-full max-w-full rounded object-contain" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 line-clamp-1">{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold block">
                          {lang === "ar" ? `الكمية: ${item.quantity} × ` : `Qty: ${item.quantity} x `} {item.price} {storeCurrency}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-black text-slate-900 dark:text-white">
                      {item.price * item.quantity} {storeCurrency}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Support Line */}
            <div className="bg-blue-50/50 dark:bg-blue-950/10 rounded-[24px] border border-blue-100/50 dark:border-blue-900/30 p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-right">
              <HelpCircle className="w-10 h-10 text-blue-600 shrink-0" />
              <div className="space-y-1 flex-grow">
                <h5 className="text-xs font-black text-slate-900 dark:text-white">{lang === "ar" ? "هل تحتاج لمساعدة بخصوص هذا الطلب؟" : "Need help with this order?"}</h5>
                <p className="text-[10px] text-slate-500 font-bold leading-normal">
                  {lang === "ar" 
                    ? `إذا كان لديك أي استفسار حول موعد تسليم شحنتك، يرجى التواصل مع الدعم الفني مباشرة عبر الهاتف: ${getStoreSettings().supportPhone || getStoreSettings().companyWhatsapp}`
                    : `For any questions regarding your shipment delivery time, please call support directly on: ${getStoreSettings().supportPhone || getStoreSettings().companyWhatsapp}`}
                </p>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
