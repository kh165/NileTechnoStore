import React, { useState, useEffect } from "react";
import { 
  ShoppingCart, 
  Search, 
  MessageCircle, 
  Phone, 
  User, 
  Calendar, 
  Clock, 
  Trash2, 
  Tag, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Gift, 
  ExternalLink,
  Loader2,
  Percent,
  Sparkles
} from "lucide-react";
import { 
  listenToAbandonedCartsFromFirestore, 
  deleteAbandonedCartFromFirestore 
} from "../../lib/firebaseService";
import Tooltip from "../Common/Tooltip";

export default function AdminAbandonedCartsTab({ 
  storeCurrency = "ج.م",
  triggerToast = () => {}
}) {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL, WITH_PHONE, HIGH_VALUE
  const [selectedCartForRecovery, setSelectedCartForRecovery] = useState(null);

  // WhatsApp Discount Modal state
  const [discountType, setDiscountType] = useState("PERCENTAGE"); // PERCENTAGE, FIXED, CUSTOM
  const [discountValue, setDiscountValue] = useState("10"); // e.g. "10" for 10% or "50" for 50 LE
  const [customDiscountText, setCustomDiscountText] = useState("خصم خاص 10% عند إتمام الشراء اليوم");
  const [customNote, setCustomNote] = useState("");

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToAbandonedCartsFromFirestore((data) => {
      setCarts(data || []);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDeleteCart = async (cartId) => {
    if (!window.confirm("هل أنت تأكد من رغبتك في حذف هذه السلة المتروكة؟")) return;
    try {
      await deleteAbandonedCartFromFirestore(cartId);
      setCarts(prev => prev.filter(c => c.id !== cartId));
      triggerToast("تم حذف السلة المتروكة بنجاح ✅");
    } catch (err) {
      console.error(err);
      triggerToast("حدث خطأ أثناء الحذف");
    }
  };

  const filteredCarts = carts.filter(cart => {
    if (!cart) return false;
    const nameStr = String(cart.customerName || "").toLowerCase();
    const phoneStr = String(cart.customerPhone || "");
    const searchLower = searchQuery.toLowerCase();

    const matchesSearch = nameStr.includes(searchLower) || phoneStr.includes(searchQuery);
    if (!matchesSearch) return false;

    if (filterType === "WITH_PHONE") {
      return Boolean(cart.customerPhone && cart.customerPhone.trim().length >= 8);
    }
    if (filterType === "HIGH_VALUE") {
      return (parseFloat(cart.total) || 0) >= 500;
    }
    return true;
  });

  const totalLostValue = carts.reduce((sum, c) => sum + (parseFloat(c.total) || 0), 0);
  const cartsWithPhoneCount = carts.filter(c => Boolean(c.customerPhone && c.customerPhone.trim().length >= 8)).length;

  const getTimeElapsedLabel = (dateStr) => {
    if (!dateStr) return "قبل قليل";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "قبل قليل";

    const diffMinutes = Math.floor((new Date() - date) / (1000 * 60));
    if (diffMinutes < 1) return "قبل لحظات";
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;

    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  };

  const formatWhatsAppNumber = (phone) => {
    if (!phone) return "";
    let clean = phone.replace(/\D/g, "");
    if (clean.startsWith("0")) {
      clean = "20" + clean.substring(1);
    }
    if (!clean.startsWith("20") && clean.length === 10) {
      clean = "20" + clean;
    }
    return clean;
  };

  const generateWhatsAppMessage = (cart) => {
    if (!cart) return "";
    const customerName = cart.customerName || "عزيزنا العميل";
    const totalVal = `${cart.total || 0} ${storeCurrency}`;
    
    let discountOfferText = "";
    if (discountType === "PERCENTAGE") {
      discountOfferText = `🎁 كود خصم خاص بقيمة ${discountValue}% على إجمالي سلتك`;
    } else if (discountType === "FIXED") {
      discountOfferText = `🎁 خصم مباشر بقيمة ${discountValue} ${storeCurrency} على إجمالي سلتك`;
    } else {
      discountOfferText = `🎁 ${customDiscountText}`;
    }

    const itemsSummary = Array.isArray(cart.items) 
      ? cart.items.map(i => `• ${i.name || "منتج"} (${i.quantity || 1} قطعة)`).join("\n")
      : "";

    return `مرحباً ${customerName} 👋\n\nلاحظنا أنك تركت بعض المنتجات المميزة في سلتك بمتجر NileTechno:\n${itemsSummary}\n\nإجمالي السلة: ${totalVal}\n\n${discountOfferText} ✨\n${customNote ? `ملاحظة: ${customNote}\n\n` : ""}إضغط على الرابط التالي لمتابعة الطلب واستلام الخصم المباشر 🛍️\nhttps://niletechno.com`;
  };

  const handleOpenWhatsApp = (cart) => {
    const phone = formatWhatsAppNumber(cart.customerPhone);
    if (!phone) {
      alert("رقم الهاتف غير متوفر أو غير صحيح لهذا العميل");
      return;
    }
    const message = generateWhatsAppMessage(cart);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6 animate-fadeIn" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 opacity-15 pointer-events-none">
          <ShoppingCart className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>نظام استعادة المبيعات الضائعة</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black">🛒 السلات المتروكة واستعادة المبيعات</h2>
          <p className="text-xs text-amber-100 max-w-2xl font-medium leading-relaxed">
            رصد الزوار والعملاء الذين أضافوا منتجات إلى سلتهم ولم يكملوا عملية الشراء، مع إمكانية إرسال تذكير مباشر مع خصم تشجيعي مخصص عبر الواتساب بنقرة واحدة!
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block mb-1">إجمالي السلات المتروكة</span>
            <span className="text-2xl font-black text-slate-900 font-mono">{carts.length}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block mb-1">القيمة الإجمالية المفقودة</span>
            <span className="text-2xl font-black text-rose-600 font-mono">{totalLostValue.toLocaleString()} {storeCurrency}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 block mb-1">سلات ببيانات تواصل جاهزة</span>
            <span className="text-2xl font-black text-emerald-600 font-mono">{cartsWithPhoneCount}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <Phone className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-150 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم أو رقم الهاتف..."
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              filterType === "ALL" 
                ? "bg-slate-900 text-white shadow-xs" 
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            الكل ({carts.length})
          </button>
          <button
            onClick={() => setFilterType("WITH_PHONE")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === "WITH_PHONE" 
                ? "bg-emerald-600 text-white shadow-xs" 
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>يتوفر رقم هاتف ({cartsWithPhoneCount})</span>
          </button>
          <button
            onClick={() => setFilterType("HIGH_VALUE")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === "HIGH_VALUE" 
                ? "bg-rose-600 text-white shadow-xs" 
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>سلات مرتفعة القيمة</span>
          </button>
        </div>
      </div>

      {/* Carts List / Loading / Empty State */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-slate-150 p-12 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
          <p className="text-xs font-black text-slate-500">جاري تحميل السلات المتروكة من النظام...</p>
        </div>
      ) : filteredCarts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-150 p-12 text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-black text-slate-800">لا توجد سلات متروكة مطابقة حالياً 🎉</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            ممتاز! جميع زوارك يكملون طلباتهم بنجاح أو لا توجد سلات غير المكتملة في هذا الفلتر.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCarts.map((cart) => {
            const hasPhone = Boolean(cart.customerPhone && cart.customerPhone.trim().length >= 8);
            const items = Array.isArray(cart.items) ? cart.items : [];

            return (
              <div 
                key={cart.id} 
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all space-y-4 relative flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{cart.customerName || "زائر غير مسمى"}</span>
                        {hasPhone ? (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> جاهز للواتساب
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            بدون رقم هاتف
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                        {cart.customerPhone && <span className="font-mono dir-ltr">{cart.customerPhone}</span>}
                        {cart.governorate && <span>📍 {cart.governorate}</span>}
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <span className="text-[10px] text-slate-400 block mb-0.5">زمن السلة</span>
                      <span className="text-xs font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 inline-block">
                        {getTimeElapsedLabel(cart.updatedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Cart Items List */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black text-slate-700 block">
                      محتويات السلة ({items.length} منتجات):
                    </span>
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2 max-h-40 overflow-y-auto">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs border-b border-slate-100 last:border-0 pb-1.5 last:pb-0">
                          <div className="flex items-center gap-2 truncate pr-1">
                            {item.image && (
                              <img src={item.image} alt={item.name} className="w-7 h-7 object-cover rounded-lg border border-slate-200" referrerPolicy="no-referrer" />
                            )}
                            <span className="font-bold text-slate-800 truncate">{item.name || "منتج"}</span>
                          </div>
                          <span className="font-mono font-black text-slate-600 shrink-0 mr-2">
                            {item.quantity || 1} × {item.price || 0} {storeCurrency}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">إجمالي السلة:</span>
                    <span className="text-base font-black text-rose-600 font-mono">
                      {cart.total || 0} {storeCurrency}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Tooltip text="حذف هذه السلة المتروكة">
                      <button
                        onClick={() => handleDeleteCart(cart.id)}
                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </Tooltip>

                    {hasPhone ? (
                      <button
                        onClick={() => setSelectedCartForRecovery(cart)}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-xs active:scale-95"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>إرسال خصم واستعادة 💬</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="px-3 py-2 bg-slate-100 text-slate-400 rounded-2xl text-xs font-bold cursor-not-allowed"
                      >
                        الهاتف غير مكتمل
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom WhatsApp Discount Modal */}
      {selectedCartForRecovery && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn" dir="rtl">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-black">
                  <MessageCircle className="w-4 h-4" />
                  <span>تجهيز رسالة استعادة السلة</span>
                </div>
                <h3 className="text-base font-black text-slate-900">
                  إرسال عرض خصم للعميل: {selectedCartForRecovery.customerName || "عميل بدون اسم"}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCartForRecovery(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Discount Selection Form */}
            <div className="space-y-4 text-xs">
              
              {/* Discount Type Picker */}
              <div>
                <label className="font-extrabold text-slate-700 block mb-2">نوع العرض والخصم التشجيعي:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setDiscountType("PERCENTAGE")}
                    className={`p-2.5 rounded-xl border text-center font-black transition-all cursor-pointer ${
                      discountType === "PERCENTAGE" 
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800" 
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    نسبة مئوية %
                  </button>
                  <button
                    onClick={() => setDiscountType("FIXED")}
                    className={`p-2.5 rounded-xl border text-center font-black transition-all cursor-pointer ${
                      discountType === "FIXED" 
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800" 
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    مبلغ ثابت ({storeCurrency})
                  </button>
                  <button
                    onClick={() => setDiscountType("CUSTOM")}
                    className={`p-2.5 rounded-xl border text-center font-black transition-all cursor-pointer ${
                      discountType === "CUSTOM" 
                        ? "border-emerald-600 bg-emerald-50 text-emerald-800" 
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    نص مخصص
                  </button>
                </div>
              </div>

              {/* Discount Amount Field */}
              {discountType === "PERCENTAGE" && (
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">نسبة الخصم (%):</label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="مثال: 10"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              )}

              {discountType === "FIXED" && (
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">مبلغ الخصم بالجنيه ({storeCurrency}):</label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="مثال: 50"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              )}

              {discountType === "CUSTOM" && (
                <div>
                  <label className="font-extrabold text-slate-700 block mb-1">صياغة العرض المخصص:</label>
                  <input
                    type="text"
                    value={customDiscountText}
                    onChange={(e) => setCustomDiscountText(e.target.value)}
                    placeholder="مثال: شحن مجاني خصيصاً لك اليوم"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              )}

              {/* Custom Note Input */}
              <div>
                <label className="font-extrabold text-slate-700 block mb-1">ملاحظة إضافية (اختياري):</label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="مثال: العرض ساري لمدة 24 ساعة فقط"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Preview Message */}
              <div>
                <label className="font-extrabold text-slate-700 block mb-1">معاينة الرسالة النهائية التي ستصل للعميل:</label>
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-[11px] text-slate-800 leading-relaxed font-sans whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {generateWhatsAppMessage(selectedCartForRecovery)}
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedCartForRecovery(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  handleOpenWhatsApp(selectedCartForRecovery);
                  setSelectedCartForRecovery(null);
                  triggerToast("تم فتح الواتساب وتجهيز العرض للعميل ✅");
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-md active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>فتح الواتساب وإرسال الرسالة 🚀</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
