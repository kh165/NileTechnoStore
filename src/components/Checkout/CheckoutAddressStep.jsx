import React, { lazy, Suspense } from "react";
import { 
  User, 
  Smartphone, 
  MapPin, 
  ChevronDown, 
  Edit, 
  X, 
  Home, 
  Building2, 
  Plus, 
  Navigation,
  Mail,
  Truck,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ErrorBoundary } from "../ErrorBoundary";
import { matchGovernorateZone } from "../../lib/geoService";
import { EGYPT_GOVERNORATES_DEFAULT } from "../../lib/firebaseService";

const InteractiveMap = lazy(() => import("./InteractiveMap"));

export default function CheckoutAddressStep({
  shippingDetails,
  setShippingDetails,
  shippingConfig,
  selectedLocationId,
  setSelectedLocationId,
  shippingLocations,
  storeCurrency,
  addresses,
  selectedAddressId,
  setSelectedAddressId,
  setEditingAddressId,
  setNewAddressTitle,
  setNewAddressDetails,
  setNewAddressType,
  setModalCoords,
  setIsAddAddressOpen,
  handleDeleteAddress,
  mainCoords,
  setMainCoords,
  setAddresses,
  handleNextToPayment,
  isAddAddressOpen,
  closeAddressModal,
  editingAddressId,
  handleAddNewAddress,
  newAddressTitle,
  newAddressDetails,
  modalCoords,
  newAddressType,
  user,
  onOneClickCheckout,
  isSubmitting
}) {
  const { name, phone, address, notes, email, governorate } = shippingDetails;
  const setName = (val) => setShippingDetails(prev => ({ ...prev, name: val }));
  const setPhone = (val) => setShippingDetails(prev => ({ ...prev, phone: val }));
  const setAddress = (val) => setShippingDetails(prev => ({ ...prev, address: val }));
  const setNotes = (val) => setShippingDetails(prev => ({ ...prev, notes: val }));
  const setEmail = (val) => setShippingDetails(prev => ({ ...prev, email: val }));

  const zonesList = (shippingConfig?.zones && shippingConfig.zones.length > 0)
    ? shippingConfig.zones
    : EGYPT_GOVERNORATES_DEFAULT;

  const currentGovName = governorate || "القاهرة";
  const matchedZone = zonesList.find(
    z => z.name === currentGovName || z.id === selectedLocationId
  );

  const isShippingUnavailable = matchedZone && matchedZone.active === false;
  return (
    <div className="space-y-5 text-right">
      
      {/* Recipient Information (Name & Phone) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-black text-slate-800 mb-2">اسم المستلم بالكامل *</label>
          <div className="relative">
            <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 pointer-events-none">
              <User className="h-4 w-4" />
            </span>
            <input
              type="text"
              className="w-full bg-white border border-slate-200 rounded-xl py-3 pr-10 pl-4 text-xs font-bold text-slate-800 outline-none focus:border-[#0051a8] focus:ring-4 focus:ring-blue-100/30 transition-all placeholder:text-slate-400 shadow-3xs"
              placeholder="مثال: خالد صلاح"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-800 mb-2">رقم الهاتف النشط للتواصل *</label>
          <div className="relative">
            <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 pointer-events-none">
              <Smartphone className="h-4 w-4" />
            </span>
            <input
              type="tel"
              className="w-full bg-white border border-slate-200 rounded-xl py-3 pr-10 pl-4 text-xs font-bold text-slate-800 outline-none focus:border-[#0051a8] focus:ring-4 focus:ring-blue-100/30 transition-all placeholder:text-slate-400 font-mono text-left"
              placeholder="01xxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Email Address */}
      <div>
        <label className="block text-xs font-black text-slate-800 mb-2">البريد الإلكتروني لاستلام الفاتورة وتتبع طلبك *</label>
        <div className="relative">
          <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 pointer-events-none">
            <Mail className="h-4 w-4" />
          </span>
          <input
            type="email"
            className="w-full bg-white border border-slate-200 rounded-xl py-3 pr-10 pl-4 text-xs font-bold text-slate-800 outline-none focus:border-[#0051a8] focus:ring-4 focus:ring-blue-100/30 transition-all placeholder:text-slate-400 shadow-3xs"
            placeholder="example@domain.com"
            value={email || ""}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Detailed Address & Dynamic Map Location */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-black text-slate-800 mb-2">العنوان بالتفصيل (الشارع / العمارة / الشقة) *</label>
          <div className="relative">
            <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 pointer-events-none">
              <Navigation className="h-4 w-4 text-[#0051a8]" />
            </span>
            <input
              type="text"
              className="w-full bg-white border border-slate-200 rounded-xl py-3 pr-10 pl-4 text-xs font-bold text-slate-800 outline-none focus:border-[#0051a8] focus:ring-4 focus:ring-blue-100/30 transition-all placeholder:text-slate-400 shadow-3xs"
              placeholder="مثال: شارع مصطفى النحاس، عمارة 15، الشقة 4"
              value={address || ""}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Embedded Interactive Location Pinpoint Map */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-black text-slate-800">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#0051a8]" />
              <span>تحديد الموقع بدقة على الخريطة (Google Maps)</span>
            </span>
            <span className="text-[10px] text-slate-500 font-bold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100/60">
              حرك المؤشر لتحديث العنوان والمحافظة تلقائياً
            </span>
          </div>
          
          <ErrorBoundary>
            <Suspense fallback={
              <div className="h-[220px] bg-slate-100 rounded-2xl flex items-center justify-center text-xs text-slate-500 gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>جاري تحميل الخريطة...</span>
              </div>
            }>
              <InteractiveMap
                lat={mainCoords?.lat || 30.0444}
                lng={mainCoords?.lng || 31.2357}
                height="220px"
                searchPlaceholder="ابحث عن شارعك، حيك، أو معلم قريب لتحديد العنوان..."
                onChange={(newLat, newLng, newAddr, detectedGov) => {
                  if (setMainCoords) setMainCoords({ lat: newLat, lng: newLng });
                  if (newAddr) setAddress(newAddr);
                  
                  const fullText = `${detectedGov || ""} ${newAddr || ""}`;
                  const matched = matchGovernorateZone(fullText, zonesList);
                  if (matched) {
                    setShippingDetails(prev => ({ ...prev, governorate: matched.name }));
                  } else if (detectedGov) {
                    setShippingDetails(prev => ({ ...prev, governorate: detectedGov }));
                  }
                }}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>

      {/* Governorate Selector for Dynamic Shipping Cost */}
      <div>
        <label className="block text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
          <span>المحافظة (تتحدث تلقائياً مع خريطتك وتحدد سعر الشحن) *</span>
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 pointer-events-none">
            <Truck className="h-4 w-4 text-[#0051a8]" />
          </span>
          <select
            className={`w-full bg-white border rounded-xl py-3 pr-10 pl-8 text-xs font-bold outline-none focus:ring-4 transition-all appearance-none cursor-pointer shadow-3xs ${
              isShippingUnavailable
                ? "border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-100"
                : "border-slate-200 text-slate-800 focus:border-[#0051a8] focus:ring-blue-100/30"
            }`}
            value={currentGovName}
            onChange={(e) => setShippingDetails(prev => ({ ...prev, governorate: e.target.value }))}
          >
            {zonesList.map((zone) => (
              <option key={zone.id || zone.name} value={zone.name}>
                {zone.name} {zone.active === false ? "— 🔴 (غير متاح الشحن لهذا المكان حالياً)" : zone.price > 0 ? `— ${zone.price} ${storeCurrency}` : '— شحن مجاني'}
              </option>
            ))}
          </select>
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
            <ChevronDown className="h-4 w-4" />
          </span>
        </div>
      </div>

      {/* Unavailable Shipping Alert Box */}
      {isShippingUnavailable && (
        <div className="bg-rose-50 border-2 border-rose-300/80 rounded-2xl p-4 flex items-start gap-3 text-rose-950 shadow-xs animate-fade-in">
          <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 border border-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-600" />
          </div>
          <div className="space-y-1 text-right">
            <h4 className="text-xs font-black text-rose-950">غير متاح الشحن لمحافظة ({currentGovName}) حالياً 🔴</h4>
            <p className="text-[11px] font-bold text-rose-800 leading-relaxed">
              عذراً، التوصيل والشحن لهذه المنطقة متوقف حالياً من قِبل الإدارة. لا يمكنك إكمال طلب الشراء لهذه المنطقة في الوقت الحالي. يرجى تغيير العنوان أو اختيار محافظة أخرى متاح فيها الشحن.
            </p>
          </div>
        </div>
      )}

      {/* Choose Delivery Address Section */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-black text-slate-900">اختر عنوان التوصيل</h3>
        
        <div className="space-y-3">
          {addresses.map((addr) => {
            const isSelected = selectedAddressId === addr.id;
            return (
              <div
                key={addr.id}
                onClick={() => setSelectedAddressId(addr.id)}
                className={`relative rounded-2xl p-4 flex items-center justify-between cursor-pointer border-2 transition-all ${
                  isSelected 
                    ? "border-[#0051a8] bg-[#f0f7ff] ring-2 ring-blue-100/50" 
                    : "border-slate-150 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Radio Indicator */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected ? "border-[#0051a8]" : "border-slate-300"
                  }`}>
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#0051a8]" />
                    )}
                  </div>
                  
                  {/* Title and Details */}
                  <div className="text-right">
                    <span className="font-black text-xs text-slate-950 block">{addr.title}</span>
                    <span className="text-[10px] text-slate-500 font-bold block mt-1 leading-relaxed">
                      {addr.details}
                    </span>
                  </div>
                </div>

                {/* Icon & Action Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingAddressId(addr.id);
                      setNewAddressTitle(addr.title);
                      setNewAddressDetails(addr.details);
                      setNewAddressType(addr.type);
                      setModalCoords({
                        lat: addr.lat || 30.0444,
                        lng: addr.lng || 31.2357
                      });
                      setIsAddAddressOpen(true);
                    }}
                    className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="تعديل العنوان"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  {true && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteAddress(addr.id, e)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="حذف العنوان"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

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

        {/* Add New Address trigger button */}
        <button
          type="button"
          onClick={() => setIsAddAddressOpen(true)}
          className="w-full py-3.5 border-2 border-dashed border-[#0051a8] hover:bg-blue-50/20 rounded-2xl text-[#0051a8] text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-blue-700 active:scale-98"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>إضافة عنوان جديد</span>
        </button>
      </div>

      {/* Inline Add/Edit Address Section */}
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
              {/* Address Name Title Input */}
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

              {/* Detailed Address Text Input */}
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

              {/* Interactive Map inside Inline Form */}
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

              {/* Address Type Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2">
                  نوع العنوان
                </label>
                <div className="flex items-center gap-3">
                  {/* Home button */}
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

                  {/* Work / Office button */}
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

                  {/* MapPin / Other button */}
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

              {/* Form actions */}
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
      <div className="space-y-2.5 pt-2">
        <h3 className="text-xs font-black text-slate-900">تعليمات التوصيل (اختياري)</h3>
        <textarea
          rows={2}
          className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-3.5 text-xs font-bold text-slate-800 outline-none focus:border-[#0051a8] focus:ring-4 focus:ring-blue-100/30 transition-all placeholder:text-slate-400 resize-none shadow-3xs"
          placeholder="مثال: يرجى الاتصال قبل الوصول بنصف ساعة، لا يتوفر مصعد..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Continue Button */}
      <button
        type="button"
        disabled={isShippingUnavailable}
        onClick={handleNextToPayment}
        className={`w-full text-xs font-black py-4 rounded-2xl transition-all shadow-md text-center block ${
          isShippingUnavailable
            ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none opacity-80"
            : "bg-[#0051a8] hover:bg-blue-800 text-white cursor-pointer shadow-blue-200/50 active:scale-98"
        }`}
      >
        {isShippingUnavailable ? "الشحن غير متاح لهذه المنطقة حالياً 🔴" : "المتابعة إلى الدفع"}
      </button>

      {/* One-Click Fast Checkout Option (Only for registered users with a saved address) */}
      {user && addresses && addresses.length > 0 && (
        <div className="border-t border-slate-100 pt-5 mt-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-[#0284c7]">
            <span className="animate-pulse">✨</span>
            <span>ميزة الشراء السريع بلمسة واحدة متاحة لك!</span>
          </div>
          <button
            type="button"
            disabled={isSubmitting || isShippingUnavailable || !name.trim() || !phone.trim() || !address.trim()}
            onClick={onOneClickCheckout}
            className={`w-full text-xs font-extrabold py-4 rounded-2xl transition-all mt-1 text-center flex items-center justify-center gap-2 border-2 ${
              isShippingUnavailable
                ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed shadow-none opacity-80"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white cursor-pointer shadow-lg shadow-emerald-100 active:scale-95 border-emerald-400 disabled:opacity-50"
            }`}
          >
            {isSubmitting ? (
              <span>جاري إرسال طلب الشراء السريع...</span>
            ) : isShippingUnavailable ? (
              <span>غير متاح الشحن لهذه المنطقة 🔴</span>
            ) : (
              <span>⚡ الشراء السريع بلمسة واحدة (One-Click Checkout)</span>
            )}
          </button>
          <p className="text-[10px] text-slate-400 font-bold text-center leading-normal">
            سيتم طلب المنتجات فوراً وشحنها إلى عنوانك المختار بالتوصيل السريع والدفع نقداً عند الاستلام.
          </p>
        </div>
      )}

    </div>
  );
}
