import React from "react";
import { CheckCircle2, X, Truck } from "lucide-react";

export default function OrderTimeline({ status = "PENDING", lang = "ar" }) {
  const currentStatus = (status || "PENDING").toUpperCase();

  if (currentStatus === "CANCELED" || currentStatus === "CANCELLED") {
    return (
      <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-center flex flex-col items-center justify-center gap-1.5 w-full">
        <X className="w-8 h-8 text-rose-600 bg-rose-100 p-1.5 rounded-full animate-pulse" />
        <span className="text-xs font-black text-rose-700">
          {lang === "en" ? "This order has been cancelled" : "لقد تم إلغاء هذه الطلبية نهائياً"}
        </span>
        <span className="text-[10px] text-slate-400">
          {lang === "en" ? "No active shipment timeline for cancelled orders" : "لا يوجد خط سير جاري للطلبات الملغية"}
        </span>
      </div>
    );
  }

  const steps = [
    { key: "PENDING", label: lang === "en" ? "Submitted" : "استلام الطلب", desc: lang === "en" ? "Order received" : "تم استلام طلب العميل" },
    { key: "PREPARING", label: lang === "en" ? "Preparing" : "جاري التجهيز", desc: lang === "en" ? "Packing shipment" : "تحضير وتغليف الشحنة" },
    { key: "SHIPPED", label: lang === "en" ? "Shipped" : "جاري الشحن", desc: lang === "en" ? "Out with courier" : "مع شركة الشحن والتوصيل" },
    { key: "DELIVERED", label: lang === "en" ? "Delivered" : "تم الاستلام", desc: lang === "en" ? "Received by customer" : "العميل استلم الشحنة" },
    { key: "COMPLETED", label: lang === "en" ? "Completed" : "إقفال الطلب", desc: lang === "en" ? "Order finalized" : "اكتمل وتوثق بنجاح" }
  ];

  // Determine active index
  let activeIndex = 0;
  if (currentStatus === "PREPARING" || currentStatus === "PROCESSING") activeIndex = 1;
  else if (currentStatus === "SHIPPED" || currentStatus === "DELIVERING") activeIndex = 2;
  else if (currentStatus === "DELIVERED") activeIndex = 3;
  else if (currentStatus === "COMPLETED") activeIndex = 4;

  return (
    <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 font-sans w-full space-y-3">
      <div className="grid grid-cols-5 relative">
        {/* Horizontal Line connector */}
        <div className="absolute top-4 left-[10%] right-[10%] h-0.5 bg-slate-200/80 z-0">
          <div 
            className="h-full bg-blue-600 transition-all duration-500 rounded-full"
            style={{ width: `${(activeIndex / 4) * 100}%` }}
          />
        </div>

        {steps.map((step, idx) => {
          const isCompleted = idx <= activeIndex;
          const isCurrent = idx === activeIndex;
          return (
            <div key={step.key} className="flex flex-col items-center text-center z-10">
              {/* Dot */}
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCurrent 
                    ? "bg-blue-600 text-white ring-4 ring-blue-100 scale-105" 
                    : isCompleted 
                      ? "bg-emerald-500 text-white shadow-xs" 
                      : "bg-white text-slate-300 border border-slate-200"
                }`}
              >
                {isCompleted && !isCurrent ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : (
                  <span className="text-[10px] font-black">{idx + 1}</span>
                )}
              </div>
              
              {/* Labels */}
              <span className={`text-[10px] font-black mt-2 block ${isCurrent ? "text-blue-700 font-extrabold" : isCompleted ? "text-slate-800" : "text-slate-400"}`}>
                {step.label}
              </span>
              <span className="text-[8px] text-slate-400 block mt-0.5 px-0.5 leading-normal hidden sm:block">
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>

      {/* Estimated Delivery Time Frame Banner */}
      <div className="mt-2 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-600 font-bold px-1">
        <span className="flex items-center gap-1.5 text-slate-800 font-black">
          <Truck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{lang === "en" ? "Delivery Timeframe:" : "وقت التوصيل والتسليم المتوقع:"}</span>
        </span>
        <span className="text-blue-900 font-black bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1 text-[11px]">
          {lang === "en" ? "1 to 7 Business Days" : "من 1 إلى 7 أيام عمل"}
        </span>
      </div>
    </div>
  );
}
