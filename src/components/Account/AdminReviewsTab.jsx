import React from "react";
import { Star, RefreshCw, Loader2 } from "lucide-react";

export default function AdminReviewsTab(props) {
  const adminReviews = props.adminReviews || props.reviews || [];
  const loadingAdminReviews = props.loadingAdminReviews || props.isLoading || false;
  const products = props.products || [];
  const loadAdminReviews = props.loadAdminReviews || (() => {});
  const handleApproveReview = props.handleApproveReview || props.onApprove || (() => {});
  const handleDeleteReview = props.handleDeleteReview || props.onDelete || (() => {});
  return (
    <div className="space-y-6 animate-fade-in text-right">
      {/* Header Banner - NileTechno Navy Style */}
      <div className="bg-gradient-to-r from-[#072d5c] via-[#093c7a] to-[#072d5c] text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-blue-900/50">
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 rounded-full text-xs font-black">
            <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>نظام مراجعة واعتماد تقييمات المشترين (NileTechno Reviews Moderation)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">إدارة ومراجعة تقييمات العملاء</h2>
          <p className="text-xs text-blue-100/90 font-bold leading-relaxed">
            وافق على مراجعات العملاء لعرضها على صفحة المنتج، أو احذف التقييمات غير اللائقة نهائياً.
          </p>
        </div>
        <button
          onClick={loadAdminReviews}
          className="relative z-10 self-start sm:self-center flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-black rounded-2xl transition-all cursor-pointer shadow-inner backdrop-blur-md active:scale-95"
        >
          <RefreshCw className="w-3.5 h-3.5 text-sky-300" />
          <span>تحديث التقييمات الحالية</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs space-y-4">

        {loadingAdminReviews ? (
          <div className="text-center py-12 text-xs text-slate-400 font-bold flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span>جاري جلب قائمة التقييمات من الخادم...</span>
          </div>
        ) : adminReviews.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 p-8 rounded-2xl text-center">
            <p className="text-xs font-bold text-slate-500">لا توجد تقييمات مكتوبة مسجلة في المتجر حتى الآن.</p>
            <p className="text-[10px] text-slate-400 mt-1">عندما يقوم العملاء بكتابة تقييم للمنتجات، ستظهر هنا فوراً للمراجعة.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-right text-[11px] font-bold border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500">
                  <th className="py-2.5 px-3 font-black text-right">المنتج</th>
                  <th className="py-2.5 px-3 font-black text-right">العميل</th>
                  <th className="py-2.5 px-3 font-black text-center">التقييم</th>
                  <th className="py-2.5 px-3 font-black text-right">التعليق والتعقيب</th>
                  <th className="py-2.5 px-3 font-black text-center">تاريخ الإرسال</th>
                  <th className="py-2.5 px-3 font-black text-center">الحالة</th>
                  <th className="py-2.5 px-3 font-black text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adminReviews.map((rev) => {
                  const matchedProduct = products.find(p => String(p.id) === String(rev.productId));
                  return (
                    <tr key={rev.id} className="hover:bg-slate-50/40">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 max-w-[150px]">
                          {matchedProduct?.image && (
                            <img src={matchedProduct.image} alt={matchedProduct.name} className="w-8 h-8 object-cover rounded-md border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
                          )}
                          <span className="font-extrabold text-slate-800 truncate block">{matchedProduct ? matchedProduct.name : `منتج #${rev.productId}`}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-900 font-extrabold">{rev.customerName}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3 h-3 ${
                                star <= rev.rating ? "text-amber-500 fill-amber-500" : "text-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-xs break-words leading-relaxed font-sans">{rev.comment || <span className="text-slate-300 italic">بدون تعليق مكتوب</span>}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-400 font-medium">{rev.date}</td>
                      <td className="py-3 px-3 text-center">
                        {rev.approved ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-black">منشور ومقبول</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[9px] font-black">قيد المراجعة</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-left">
                        <div className="flex items-center gap-1.5 justify-end">
                          {!rev.approved && (
                            <button
                              onClick={() => handleApproveReview(rev.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-lg cursor-pointer transition-all active:scale-95 shadow-xs"
                            >
                              موافقة ونشر
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReview(rev.id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-[10px] rounded-lg cursor-pointer border border-rose-100 transition-all active:scale-95"
                          >
                            حذف نهائياً
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
