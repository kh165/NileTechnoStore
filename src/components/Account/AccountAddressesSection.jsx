import React, { lazy, Suspense } from "react";
import { Edit, X, Home, Building2, MapPin, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ErrorBoundary } from "../ErrorBoundary";

const InteractiveMap = lazy(() => import("../Checkout/InteractiveMap"));

export default function AccountAddressesSection({
  addresses,
  selectedAddressId,
  handleSelectAddress,
  handleDeleteAddress,
  setEditingAddressId,
  setNewAddressTitle,
  setNewAddressDetails,
  setNewAddressType,
  setModalCoords,
  setIsAddAddressOpen,
  isAddAddressOpen,
  editingAddressId,
  closeAddressModal,
  handleAddNewAddress,
  newAddressTitle,
  newAddressDetails,
  modalCoords,
  newAddressType,
  notes,
  setNotes,
  onConfirmDefaultAddress
}) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-150 shadow-sm space-y-6 text-right">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-black text-slate-950">عناوين التوصيل واستلام الطلبات</h2>
          <p className="text-xs text-slate-400 mt-1">إدارة العناوين الجغرافية المحفوظة لتسريع عملية الشراء والتوصيل</p>
        </div>
      </div>

      <div className="space-y-3">
        {addresses.map((addr) => {
          const isSelected = addr.id === selectedAddressId;
          return (
            <div
              key={addr.id}
              onClick={() => {
                if (handleSelectAddress) {
                  handleSelectAddress(addr.id);
                }
              }}
              className={`relative rounded-2xl p-4 flex items-center justify-between cursor-pointer border-2 transition-all ${
                isSelected 
                  ? "border-[#0051a8] bg-[#f0f7ff] ring-2 ring-blue-100/50" 
                  : "border-slate-150 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  isSelected ? "border-[#0051a8]" : "border-slate-300"
                }`}>
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#0051a8]" />
                  )}
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs text-slate-950 block">{addr.title}</span>
                    {isSelected && (
                      <span className="inline-block rounded-full bg-emerald-100 text-emerald-800 text-[8px] font-black px-2 py-0.5">
                        افتراضي
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-bold block mt-1 leading-relaxed">
                    {addr.details}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingAddressId(addr.id);
                    setNewAddressTitle(addr.title);
                    setNewAddressDetails(addr.details);
                    setNewAddressType(addr.type);
                    setModalCoords({ lat: addr.lat || 30.0444, lng: addr.lng || 31.2357 });
                    setIsAddAddressOpen(true);
                  }}
                  className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  title="تعديل العنوان"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDeleteAddress(addr.id, e)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  title="حذف العنوان"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className={`p-2 rounded-xl shrink-0 ${isSelected ? "text-[#0051a8]" : "text-slate-400"}`}>
                  {addr.type === "home" ? (
                    <Home className="w-5 h-5" />
                  ) : addr.type === "work" ? (
                    <Building2 className="w-5 h-5" />
                  ) : (
                    <MapPin className="w-5 h-5" />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {addresses.length === 0 && (
          <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">لا توجد عناوين محفوظة حتى الآن.</p>
            <p className="text-[10px] text-slate-400 mt-0.5">يرجى الضغط على زر إضافة عنوان بالأسفل لتحديد موقع التوصيل.</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          setModalCoords({ lat: 30.0444, lng: 31.2357 });
          setIsAddAddressOpen(true);
        }}
        className="w-full py-3.5 border-2 border-dashed border-[#0051a8] hover:bg-blue-50/20 rounded-2xl text-[#0051a8] text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-blue-700 active:scale-98"
      >
        <Plus className="w-4 h-4 stroke-[3]" />
        <span>إضافة عنوان جديد</span>
      </button>

      <AnimatePresence>
        {isAddAddressOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-150 text-right mt-3 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-2">
              <h3 className="text-xs font-black text-[#0051a8] flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                <span>{editingAddressId ? "تعديل العنوان المحدد" : "إضافة عنوان جديد"}</span>
              </h3>
              <button
                type="button"
                onClick={closeAddressModal}
                className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewAddress} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                  اسم العنوان (مثال: المنزل، العمل)
                </label>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-800 outline-none focus:border-[#0051a8] focus:ring-4 focus:ring-blue-100/30 transition-all placeholder:text-slate-400"
                  placeholder="مثال: البيت الجديد"
                  value={newAddressTitle}
                  onChange={(e) => setNewAddressTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                  العنوان بالتفصيل
                </label>
                <input
                  type="text"
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-bold text-slate-800 outline-none focus:border-[#0051a8] focus:ring-4 focus:ring-blue-100/30 transition-all placeholder:text-slate-400"
                  placeholder="الشارع، الحي، المدينة، الرمز البريدي"
                  value={newAddressDetails}
                  onChange={(e) => setNewAddressDetails(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 text-right block">اختر موقعك بدقة على الخريطة</span>
                <ErrorBoundary>
                  <Suspense fallback={
                    <div className="h-[220px] bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-500 gap-2">
                      <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      <span>جاري تحميل الخريطة...</span>
                    </div>
                  }>
                    <InteractiveMap
                      lat={modalCoords.lat}
                      lng={modalCoords.lng}
                      height="220px"
                      onChange={(newLat, newLng, newAddr) => {
                        setModalCoords({ lat: newLat, lng: newLng });
                        setNewAddressDetails(newAddr);
                      }}
                    />
                  </Suspense>
                </ErrorBoundary>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2">
                  نوع العنوان
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNewAddressType("home")}
                    className={`flex-grow py-3 px-4 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                      newAddressType === "home"
                        ? "bg-[#0051a8] text-white border-[#0051a8] shadow-md shadow-blue-900/10"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span className="text-[10px] font-black">المنزل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewAddressType("work")}
                    className={`flex-grow py-3 px-4 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                      newAddressType === "work"
                        ? "bg-[#0051a8] text-white border-[#0051a8] shadow-md shadow-blue-900/10"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span className="text-[10px] font-black">العمل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewAddressType("other")}
                    className={`flex-grow py-3 px-4 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                      newAddressType === "other"
                        ? "bg-[#0051a8] text-white border-[#0051a8] shadow-md shadow-blue-900/10"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    <span className="text-[10px] font-black">أخرى</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#0051a8] hover:bg-blue-800 text-white text-xs font-black py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-blue-200/50 text-center active:scale-98"
                >
                  {editingAddressId ? "حفظ التعديلات" : "إضافة هذا العنوان"}
                </button>
                <button
                  type="button"
                  onClick={closeAddressModal}
                  className="flex-grow-0 px-6 bg-white hover:bg-slate-100 text-slate-700 text-xs font-black py-3 rounded-xl transition-all border border-slate-200 cursor-pointer text-center active:scale-98"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delivery Instructions notes */}
      {setNotes && (
        <div className="space-y-2.5 pt-2 text-right">
          <h3 className="text-xs font-black text-slate-900">تعليمات التوصيل (اختياري)</h3>
          <textarea
            rows={2}
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-3.5 text-xs font-bold text-slate-800 outline-none focus:border-[#0051a8] focus:ring-4 focus:ring-blue-100/30 transition-all placeholder:text-slate-400 resize-none shadow-3xs"
            placeholder="مثال: يرجى الاتصال قبل الوصول بنصف ساعة، لا يتوفر مصعد..."
            value={notes || ""}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      )}

      {/* Confirm Address Selection Button */}
      {addresses.length > 0 && onConfirmDefaultAddress && (
        <button
          type="button"
          onClick={onConfirmDefaultAddress}
          className="w-full bg-[#0051a8] hover:bg-blue-800 text-white text-xs font-black py-4 rounded-2xl transition-all cursor-pointer shadow-md shadow-blue-200/50 mt-4 active:scale-98 text-center block"
        >
          حفظ العنوان المحدد كافتراضي
        </button>
      )}
    </div>
  );
}
