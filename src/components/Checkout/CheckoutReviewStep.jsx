import React from "react";
import { MapPin, CreditCard } from "lucide-react";

export default function CheckoutReviewStep({
  shippingDetails,
  paymentMethod,
  senderAccount,
  handleSubmitOrder,
  isSubmitting
}) {
  const { name, address, governorate, phone, email } = shippingDetails;
  // عرض العنوان الكامل: المحافظة + العنوان التفصيلي
  const fullAddress = [governorate, address].filter(Boolean).join(" — ");
  return (
    <div className="space-y-4.5 text-right">
      
      {/* Delivery Estimate Banner */}
      <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-3.5 flex items-center justify-between text-right">
        <div className="flex items-center gap-2.5">
          <span className="text-base">🚚</span>
          <div>
            <h5 className="text-xs font-black text-blue-950">وقت التسليم والتوصيل المتوقع</h5>
            <p className="text-[10px] text-blue-700 font-bold mt-0.5">من يوم واحد إلى 7 أيام عمل كحد أقصى للوصول حتى باب منزلك</p>
          </div>
        </div>
      </div>

      {/* Confirmation Summaries Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Shipping Info Card */}
        <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-black text-slate-800">عنوان التوصيل المختار</h4>
            </div>
            <p className="text-xs font-bold text-slate-900 leading-tight">
              {name}
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-1.5 leading-relaxed line-clamp-2">
              {fullAddress}
            </p>
          </div>
        </div>

        {/* Payment Method Card */}
        <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-black text-slate-800">طريقة تسوية الدفع</h4>
            </div>
            <p className="text-xs font-bold text-slate-900 leading-tight">
              الدفع نقداً عند الاستلام (كاش)
            </p>
            <p className="text-[10px] text-slate-400 font-bold mt-1.5 leading-relaxed">
              سيتم تسليم الأموال للمندوب يداً بيد عند الاستلام والتأكد من سلامة المنتجات.
            </p>
          </div>
        </div>
      </div>

      {/* Final warning block */}
      <div className="bg-amber-50 border border-amber-200/70 rounded-2xl p-4 text-right flex items-start gap-3">
        <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs shrink-0 mt-0.5">💡</div>
        <div className="text-xs font-bold text-amber-900 leading-relaxed">
          بموافقتك وإتمامك الطلب، يتم حجز المنتجات وإصدار فاتورة مبيعات رسمية باسمك. يرجى التواجد لتلقي اتصال المندوب قريباً لتجنب إلغاء الطلبية.
        </div>
      </div>

      {/* Place Order Button */}
      <button
        type="button"
        onClick={handleSubmitOrder}
        disabled={isSubmitting}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-black py-4.5 rounded-2xl transition-all cursor-pointer shadow-lg active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-center flex items-center justify-center gap-2.5"
      >
        {isSubmitting ? (
          <>
            <div className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span>جاري تأكيد وتسجيل طلبيتك...</span>
          </>
        ) : (
          <span>تأكيد وإرسال الطلبية</span>
        )}
      </button>
    </div>
  );
}
