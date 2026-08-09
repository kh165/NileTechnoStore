import React from "react";
import { ShoppingBag, DollarSign, Clock, Truck, FileText } from "lucide-react";

export default function AdminStatsCards({
  allOrdersCount = 0,
  totalSales = 0,
  pendingCount = 0,
  preparingCount = 0,
  deliveringCount = 0,
  averageOrderValue = 0,
  storeCurrency = "ج.م"
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* Stat 1 */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center text-center hover:border-blue-400 hover:shadow-md transition-all">
        <div className="p-2.5 rounded-xl bg-blue-50 text-[#072d5c] mb-2 border border-blue-100">
          <ShoppingBag className="w-5 h-5" />
        </div>
        <span className="text-xs font-black text-slate-800">إجمالي الطلبات</span>
        <span className="text-xl font-black text-[#072d5c] font-mono mt-1">{allOrdersCount}</span>
      </div>

      {/* Stat 2 */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center text-center hover:border-emerald-300 transition-all">
        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 mb-2 border border-emerald-100">
          <DollarSign className="w-5 h-5" />
        </div>
        <span className="text-xs font-black text-slate-800">إجمالي المبيعات</span>
        <span className="text-lg font-black text-emerald-700 font-mono mt-1">
          {totalSales.toLocaleString()} {storeCurrency}
        </span>
      </div>

      {/* Stat 3 */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center text-center hover:border-amber-300 transition-all">
        <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 mb-2 border border-amber-100">
          <Clock className="w-5 h-5" />
        </div>
        <span className="text-xs font-black text-slate-800">قيد المعالجة والتحضير</span>
        <span className="text-xl font-black text-amber-700 font-mono mt-1">
          {pendingCount + preparingCount}
        </span>
      </div>

      {/* Stat 4 */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center text-center hover:border-indigo-300 transition-all">
        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 mb-2 border border-indigo-100">
          <Truck className="w-5 h-5" />
        </div>
        <span className="text-xs font-black text-slate-800">جاري التوصيل</span>
        <span className="text-xl font-black text-indigo-700 font-mono mt-1">
          {deliveringCount}
        </span>
      </div>

      {/* Stat 5 */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col items-center justify-center text-center col-span-2 lg:col-span-1 hover:border-violet-300 transition-all">
        <div className="p-2.5 rounded-xl bg-violet-50 text-violet-700 mb-2 border border-violet-100">
          <FileText className="w-5 h-5" />
        </div>
        <span className="text-xs font-black text-slate-800">متوسط قيمة الطلب</span>
        <span className="text-lg font-black text-violet-800 font-mono mt-1">
          {averageOrderValue} {storeCurrency}
        </span>
      </div>
    </div>
  );
}
