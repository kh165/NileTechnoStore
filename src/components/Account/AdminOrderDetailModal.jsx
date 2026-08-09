import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Truck, Loader2, Printer, Trash2, MessageCircle, Lock, Save, UserCheck, History, Clock, ShieldCheck } from "lucide-react";
import OrderTimeline from "./OrderTimeline";
import Tooltip from "../Common/Tooltip";
import { sendWhatsAppNotification, COMPANY_WHATSAPP_PHONE } from "../../lib/whatsappService";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import { printShippingWaybill } from "../../lib/waybillPrinter";

export default function AdminOrderDetailModal({
  selectedOrder,
  setSelectedOrder,
  formatDate,
  updatingOrderId,
  handleUpdateStatus,
  deletingOrderId,
  setDeletingOrderId,
  isDeletingOrder,
  handleDeleteOrder,
  handlePrintReceipt,
  storeCurrency = "EGP",
  onSaveInternalNote,
  onOpenCustomerProfile
}) {
  useBodyScrollLock(Boolean(selectedOrder));

  const [internalNoteText, setInternalNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSaveSuccess, setNoteSaveSuccess] = useState(false);

  useEffect(() => {
    if (selectedOrder) {
      setInternalNoteText(selectedOrder.internalNote || "");
      setNoteSaveSuccess(false);
    }
  }, [selectedOrder]);

  const handleSaveNote = async () => {
    if (!selectedOrder || !onSaveInternalNote) return;
    setIsSavingNote(true);
    try {
      await onSaveInternalNote(selectedOrder.id, internalNoteText);
      setNoteSaveSuccess(true);
      setTimeout(() => setNoteSaveSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to save internal note:", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <AnimatePresence>
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white rounded-[24px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 flex flex-col text-right"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[24px] sticky top-0 z-10 shrink-0">
              <div>
                <h3 className="text-sm font-black text-slate-950">تفاصيل الطلبية الشاملة #{selectedOrder.orderNumber}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">سجلت بتاريخ: {formatDate(selectedOrder.createdAt)}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              
              {/* Customer Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 border-r-2 border-blue-600 pr-2">بيانات العميل المستلم للتسليم</h4>
                  {onOpenCustomerProfile && (
                    <button
                      onClick={() => onOpenCustomerProfile(selectedOrder)}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-[10px] font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                      title="اضغط للفتح والاطلاع على تاريخ وسجل مشتريات العميل بالتفصيل"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>عرض ملخص وتاريخ العميل 📊</span>
                    </button>
                  )}
                </div>
                <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700 leading-relaxed">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">الاسم الكامل للعميل</span>
                    <button
                      onClick={() => onOpenCustomerProfile && onOpenCustomerProfile(selectedOrder)}
                      className="text-slate-950 font-black hover:text-blue-600 transition-colors text-right cursor-pointer underline decoration-dotted underline-offset-4"
                      title="اضغط لعرض ملف العميل بالكامل"
                    >
                      {selectedOrder.customerName}
                    </button>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">رقم هاتف التواصل</span>
                    <span className="text-slate-950 font-mono">{selectedOrder.customerPhone}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-400 block mb-0.5">العنوان الجغرافي بالتفصيل</span>
                    <span className="text-slate-950 leading-relaxed block">
                      {[selectedOrder.governorate, selectedOrder.customerAddress].filter(Boolean).join(" — ")}
                    </span>
                  </div>
                  {selectedOrder.customerNotes && (
                    <div className="sm:col-span-2 bg-amber-50/60 p-3 rounded-xl border border-amber-100/60 text-amber-800 text-[11px]">
                      <span className="text-[9px] font-black block text-amber-500 mb-0.5">ملاحظات العميل وتوجيهات الشحن:</span>
                      {selectedOrder.customerNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Internal Admin Note (خاصة بالإدارة) */}
              <div className="space-y-2 bg-gradient-to-br from-amber-50/80 to-amber-100/40 border border-amber-200/90 rounded-2xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>ملاحظة إدارية داخلية (للمدير فقط - لن تظهر للعميل)</span>
                  </div>
                  {noteSaveSuccess && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-md animate-pulse">
                      تم حفظ الملاحظة بنجاح ✅
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-amber-700/90 font-medium leading-relaxed">
                  💡 <strong>أين تظهر؟</strong> تظهر هذه الملاحظة هنا وفي قائمة الطلبات الرئيسية بشريط أصفر مخصص للمدير فقط لسهولة التنسيق مع فريق الشحن والمبيعات.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="text"
                    value={internalNoteText}
                    onChange={(e) => setInternalNoteText(e.target.value)}
                    placeholder="مثال: تم الاتصال بالعميل وتأكيد العنوان الصحيح أو تأجيل التسليم ليوم الخميس..."
                    className="flex-1 bg-white border border-amber-200/90 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveNote}
                    disabled={isSavingNote}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shrink-0 disabled:opacity-50"
                  >
                    {isSavingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>حفظ الملاحظة</span>
                  </button>
                </div>
              </div>

              {/* Visual Order Timeline Tracker */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-800 border-r-2 border-blue-600 pr-2">مراحل وخط سير الطلبية</h4>
                <OrderTimeline status={selectedOrder.status} />
              </div>

              {/* Order History & Audit Log */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-800 border-r-2 border-amber-600 pr-2 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-amber-600" />
                  <span>📜 سجل تغييرات وتاريخ الطلب (Audit & History Log)</span>
                </h4>

                <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 space-y-2 max-h-52 overflow-y-auto">
                  {Array.isArray(selectedOrder.history) && selectedOrder.history.length > 0 ? (
                    selectedOrder.history.slice().reverse().map((log, idx) => (
                      <div key={log.id || idx} className="flex items-start justify-between gap-3 text-xs bg-white p-2.5 rounded-xl border border-slate-100 shadow-2xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                            <span className="font-extrabold text-slate-900">{log.action || "تغيير في الطلب"}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium block pr-3">
                            بواسطة: {log.actor || "مدير النظام"}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 dir-ltr">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString("ar-EG") : ""}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3 text-xs bg-white p-2.5 rounded-xl border border-slate-100">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                            <span className="font-extrabold text-slate-900">تم تقديم وتثبيت الطلب بنجاح</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium block pr-3">بواسطة: العميل</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 dir-ltr">
                          {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString("ar-EG") : "تاريخ الطلب"}
                        </span>
                      </div>
                      {selectedOrder.internalNote && (
                        <div className="flex items-start justify-between gap-3 text-xs bg-white p-2.5 rounded-xl border border-slate-100">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-amber-800">ملاحظة إدارية: {selectedOrder.internalNote}</span>
                            <span className="text-[10px] text-slate-500 font-medium block">بواسطة: المشرف الإداري</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Ordered Items Details list */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-800 border-r-2 border-blue-600 pr-2">سلة المنتجات المشتراة</h4>
                <div className="border border-slate-150 rounded-2xl overflow-hidden divide-y divide-slate-100">
                  {selectedOrder.items && selectedOrder.items.map((item, idx) => {
                    if (!item) return null;
                    return (
                      <div key={idx} className="p-3.5 flex justify-between items-center text-xs bg-white">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-xl border border-slate-200" referrerPolicy="no-referrer" />
                          )}
                          <div>
                            <span className="font-extrabold text-slate-900 block text-[12px]">{item.name}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">الكمية المطلوبة: {item.quantity} × {item.price} {storeCurrency}</span>
                          </div>
                        </div>
                        <span className="font-black text-slate-900 font-mono">{(item.price * item.quantity)} {storeCurrency}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Total Summary Row */}
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">وسيلة سداد الفاتورة:</span>
                  <span className="font-extrabold text-slate-800 bg-white border border-slate-200 px-2.5 py-1 rounded-lg block mt-1">الدفع نقداً كاش عند الاستلام</span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block mb-0.5">القيمة الإجمالية للطلب:</span>
                  <span className="font-black text-lg text-blue-700 font-mono block mt-1">{selectedOrder.total} {storeCurrency}</span>
                </div>
              </div>

              {/* Control Order Status Panel */}
              <div className="bg-blue-50/40 rounded-2xl border border-blue-100/50 p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] font-black text-blue-900 flex items-center gap-1">
                    <Truck className="w-4 h-4 text-blue-700" />
                    <span>تغيير حالة الشحن والطلب للمشتري:</span>
                  </span>
                  
                  {/* Direct WhatsApp Notification Button */}
                  <button
                    type="button"
                    onClick={() => sendWhatsAppNotification(selectedOrder, selectedOrder.status, COMPANY_WHATSAPP_PHONE)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                    title={`إرسال إشعار رسمي بحالة الطلب للعميل عبر WhatsApp من الرقم ${COMPANY_WHATSAPP_PHONE}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    <span>إرسال إشعار WhatsApp للعميل 📲</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { status: "PENDING", label: "1️⃣ تم استلام الطلب (قيد المراجعة)", color: "hover:bg-amber-100 hover:text-amber-800 border-amber-200" },
                    { status: "PREPARING", label: "2️⃣ جاري تجهيز الطلب وتغليفه", color: "hover:bg-blue-100 hover:text-blue-800 border-blue-200" },
                    { status: "SHIPPED", label: "3️⃣ جاري الشحن مع المندوب", color: "hover:bg-indigo-100 hover:text-indigo-800 border-indigo-200" },
                    { status: "DELIVERED", label: "4️⃣ تم الاستلام (العميل استلم)", color: "hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200" },
                    { status: "COMPLETED", label: "5️⃣ إقفال الطلب نهائياً بنجاح", color: "hover:bg-emerald-600 hover:text-white border-emerald-300" },
                    { status: "CANCELED", label: "❌ إلغاء الطلب نهائياً", color: "hover:bg-rose-100 hover:text-rose-800 border-rose-200" }
                  ].map((act) => {
                    const isCurrent = (selectedOrder.status || "PENDING").toUpperCase() === act.status;
                    const isUpdating = updatingOrderId === selectedOrder.id;
                    return (
                      <button
                        key={act.status}
                        onClick={() => {
                          handleUpdateStatus(selectedOrder.id, act.status);
                          // Auto open WhatsApp notification for customer after status update
                          setTimeout(() => {
                            sendWhatsAppNotification(selectedOrder, act.status, COMPANY_WHATSAPP_PHONE);
                          }, 300);
                        }}
                        disabled={isUpdating}
                        className={`p-2.5 rounded-xl text-[10px] font-black transition-all cursor-pointer border text-center active:scale-95 disabled:opacity-50 ${
                          isCurrent 
                            ? "bg-slate-900 border-slate-900 text-white shadow-md scale-[1.02]" 
                            : `bg-white text-slate-700 ${act.color}`
                        }`}
                      >
                        {act.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Footer actions */}
            <div className="p-5 border-t border-slate-100 flex flex-col gap-3 bg-slate-50 shrink-0 rounded-b-[24px]">
              {deletingOrderId === selectedOrder.id && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-right space-y-2 animate-fade-in w-full">
                  <p className="text-[11px] font-bold text-rose-800">هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً من قاعدة البيانات؟ هذا الإجراء غير قابل للتراجع.</p>
                  <div className="flex justify-end gap-2">
                    <button
                      disabled={isDeletingOrder}
                      onClick={() => setDeletingOrderId(null)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-black text-slate-700 cursor-pointer"
                    >
                      إلغاء وتراجع
                    </button>
                    <button
                      disabled={isDeletingOrder}
                      onClick={() => handleDeleteOrder(selectedOrder.id)}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      {isDeletingOrder && <Loader2 className="w-3 h-3 animate-spin text-white" />}
                      <span>نعم، احذف نهائياً</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2.5 w-full">
                <button
                  onClick={() => handlePrintReceipt(selectedOrder)}
                  className="flex-1 min-w-[130px] py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الفاتورة</span>
                </button>

                <Tooltip text="طباعة ملصق حراري للمندوب بحجم 10×15سم">
                  <button
                    onClick={() => printShippingWaybill(selectedOrder, storeCurrency)}
                    className="flex-1 min-w-[150px] py-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-95"
                  >
                    <Truck className="w-4 h-4" />
                    <span>بوليسة الشحن (10×15cm)</span>
                  </button>
                </Tooltip>

                <Tooltip text="حذف الطلب نهائياً">
                  <button
                    onClick={() => setDeletingOrderId(selectedOrder.id)}
                    className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl transition-all cursor-pointer active:scale-95 shrink-0 border border-rose-150"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Tooltip>

                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-black rounded-2xl transition-all cursor-pointer active:scale-95"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
