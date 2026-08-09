import React from "react";
import { 
  Coins, 
  ShieldCheck 
} from "lucide-react";

export default function CheckoutPaymentStep({
  paymentMethod,
  setPaymentMethod,
  total,
  storeCurrency,
  handleNextToReview
}) {

  return (
    <div className="space-y-4.5 text-right">
      
      <h3 className="text-xs font-black text-slate-900 mb-1">طريقة الدفع</h3>

      {/* Radio Cards Stack */}
      <div className="grid grid-cols-1 gap-3.5">
        {/* Option 1: Cash on Delivery (COD) */}
        <div
          className="rounded-2xl border-2 p-5 flex flex-col justify-between gap-3.5 cursor-pointer transition-all border-blue-600 bg-blue-50/20 ring-4 ring-blue-100/40"
        >
          <div className="flex justify-between items-center w-full">
            <Coins className="w-5 h-5 text-blue-600" />
            
            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 border-blue-600">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            </div>
          </div>
          
          <div>
            <span className="font-black text-xs text-slate-900 block">
              الدفع عند الاستلام كاش
            </span>
            <span className="text-[10px] text-slate-400 font-bold block mt-1 leading-relaxed">
              ادفع نقداً عند استلام طلبك من مندوب التوصيل بعد فحصه بالكامل.
            </span>
          </div>
        </div>
      </div>

      {/* Delivery Guarantee Badge */}
      <div className="bg-[#ecfdf5] text-emerald-800 rounded-2xl p-4 flex items-center justify-between border border-emerald-100">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span className="font-black text-[#064e3b] text-xs">ضمان الفحص والمعاينة عند الاستلام</span>
        </div>
      </div>

      {/* Continue button */}
      <button
        type="button"
        onClick={handleNextToReview}
        className="w-full bg-[#072d5c] hover:bg-blue-800 text-white text-xs font-black py-4 rounded-xl transition-all cursor-pointer shadow-md shadow-blue-200/50 mt-2 active:scale-98 text-center"
      >
        الاستمرار لمراجعة وتأكيد الطلبية
      </button>
    </div>
  );
}
