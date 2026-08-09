import React from 'react';
import { Printer, X } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export default function PrintOptionsModal({ isOpen, onClose, onConfirmPrint, reportTitle = "التقرير" }) {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleSelect = (size) => {
    onConfirmPrint(size);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn" dir="rtl">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">خيارات المقاس والطباعة</h3>
              <p className="text-[11px] font-bold text-slate-400 mt-0.5">{reportTitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper Size Cards */}
        <div className="space-y-3">
          <p className="text-xs font-black text-slate-700">اختر قياس الورق للطباعة الآن:</p>
          
          <div className="grid grid-cols-1 gap-2.5">
            {/* A4 Option */}
            <button
              onClick={() => handleSelect("A4")}
              className="p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-600 hover:bg-blue-50/50 text-right transition-all cursor-pointer group flex items-start justify-between gap-3 shadow-xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 group-hover:text-blue-900">📄 ورق A4 (قياسي كامل)</span>
                  <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full group-hover:bg-blue-100 group-hover:text-blue-800">
                    210 × 297 مم
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                  المقاس القياسي المتعارف عليه للتقارير الشاملة، الفواتير الرسمية، وأرشيف الشركة.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-600 transition-all shrink-0 mt-0.5">
                <Printer className="w-5 h-5" />
              </div>
            </button>

            {/* A5 Option */}
            <button
              onClick={() => handleSelect("A5")}
              className="p-4 rounded-2xl border-2 border-slate-200 hover:border-amber-600 hover:bg-amber-50/50 text-right transition-all cursor-pointer group flex items-start justify-between gap-3 shadow-xs"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 group-hover:text-amber-900">📝 ورق A5 (نصف ورقة A4 - مدمج)</span>
                  <span className="text-[9px] font-black px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full">
                    148 × 210 مم
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  مقاس مصغر عالي الكثافة (نصف حجم A4) يوفر في الورق ومثالي لإيصالات التسليم وبوالص الشحن السريعة.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 group-hover:bg-amber-600 group-hover:text-white text-slate-600 transition-all shrink-0 mt-0.5">
                <Printer className="w-5 h-5" />
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-1 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all cursor-pointer"
          >
            إلغاء
          </button>
        </div>

      </div>
    </div>
  );
}
