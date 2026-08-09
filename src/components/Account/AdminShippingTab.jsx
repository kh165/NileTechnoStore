import React, { useState, useEffect } from "react";
import Tooltip from "../Common/Tooltip";
import { 
  Truck, 
  MapPin, 
  Save, 
  Plus, 
  Trash2, 
  Search, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Loader2,
  Gift,
  RefreshCw
} from "lucide-react";
import { 
  getShippingRatesFromFirestore, 
  saveShippingRatesToFirestore,
  EGYPT_GOVERNORATES_DEFAULT 
} from "../../lib/firebaseService";

export default function AdminShippingTab({ storeCurrency = "ج.م", onShowToast: propOnShowToast, triggerToast }) {
  const onShowToast = triggerToast || propOnShowToast;
  const [zones, setZones] = useState([]);
  const [freeShippingMin, setFreeShippingMin] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // New Zone Form State
  const [newZoneName, setNewZoneName] = useState("");
  const [newZonePrice, setNewZonePrice] = useState("");

  const loadShippingData = async () => {
    setIsLoading(true);
    try {
      const data = await getShippingRatesFromFirestore();
      setZones(data.zones || EGYPT_GOVERNORATES_DEFAULT);
      setFreeShippingMin(data.freeShippingMin || 0);
    } catch (err) {
      console.error("Error loading shipping rates:", err);
      if (onShowToast) onShowToast("فشل تحميل بيانات الشحن، تم استخدام العرض الافتراضي");
      setZones(EGYPT_GOVERNORATES_DEFAULT);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShippingData();
  }, []);

  const handlePriceChange = (zoneId, newPrice) => {
    const val = parseFloat(newPrice);
    setZones(prev => prev.map(z => z.id === zoneId ? { ...z, price: isNaN(val) ? 0 : Math.max(0, val) } : z));
  };

  const handleToggleActive = (zoneId) => {
    setZones(prev => prev.map(z => z.id === zoneId ? { ...z, active: !z.active } : z));
  };

  const handleAddZone = (e) => {
    e.preventDefault();
    if (!newZoneName.trim()) {
      if (onShowToast) onShowToast("يرجى كتابة اسم المنطقة أو المحافظة");
      return;
    }
    const priceVal = parseFloat(newZonePrice) || 0;
    const newId = `custom_${Date.now()}`;
    const newZoneObj = {
      id: newId,
      name: newZoneName.trim(),
      price: priceVal,
      active: true
    };

    setZones(prev => [newZoneObj, ...prev]);
    setNewZoneName("");
    setNewZonePrice("");
    if (onShowToast) onShowToast("تمت إضافة المنطقة الجديدة، لا تنس الضغط على حفظ التغييرات ✨");
  };

  const handleDeleteZone = (zoneId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه المنطقة من تكاليف الشحن؟")) return;
    setZones(prev => prev.filter(z => z.id !== zoneId));
    if (onShowToast) onShowToast("تم إزالة المنطقة من القائمة");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveShippingRatesToFirestore(zones, freeShippingMin);
      if (onShowToast) onShowToast("تم حفظ جميع مناطق وأسعار الشحن وسقف الشحن المجاني بنجاح! 🚚✨");
    } catch (err) {
      console.error("Error saving shipping rates:", err);
      if (onShowToast) onShowToast("حدث خطأ أثناء حفظ أسعار الشحن في قاعدة البيانات");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredZones = zones.filter(z => 
    z.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div className="space-y-6 text-right">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-black text-blue-200">
            <Truck className="w-3.5 h-3.5 text-sky-400" />
            <span>إدارة تكاليف ومناطق الشحن والتوصيل</span>
          </div>
          <h3 className="text-xl font-black text-white">أسعار الشحن للمحافظات والمناطق</h3>
          <p className="text-xs text-blue-200/90 font-medium">
            تحديد تكلفة الشحن لكل محافظة بدقة، والتي سيتم إضافتها تلقائياً في فاتورة المشتري عند تحديد عنوانه.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={loadShippingData}
            disabled={isLoading || isSaving}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/20 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 shrink-0"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>حفظ كل التغييرات</span>
          </button>
        </div>
      </div>

      {/* Free Shipping Minimum Threshold Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <span>عرض الشحن المجاني للطلبات الكبيرة</span>
            <span className="text-xs font-bold text-slate-500 block">
              إذا تجاوز إجمالي المشتريات هذا المبلغ، يصبح الشحن 0 ج.م تلقائياً (ضع 0 لتعطيل العرض).
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 max-w-md">
          <div className="relative flex-1">
            <input
              type="number"
              min="0"
              value={freeShippingMin}
              onChange={(e) => setFreeShippingMin(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="مثال: 1000"
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl px-3.5 py-2 text-sm font-black font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              {storeCurrency}
            </span>
          </div>
          {freeShippingMin > 0 ? (
            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 shrink-0">
              شحن مجاني للطلبات فوق {freeShippingMin} {storeCurrency} 🎉
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl shrink-0">
              الشحن المجاني معطل
            </span>
          )}
        </div>
      </div>

      {/* Add New Custom Region Box */}
      <form onSubmit={handleAddZone} className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
        <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" />
          <span>إضافة محافظة أو منطقة شحن جديدة</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            value={newZoneName}
            onChange={(e) => setNewZoneName(e.target.value)}
            placeholder="اسم المحافظة أو المدينة (مثل: الساحل الشمالي)"
            className="bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none"
          />
          <div className="relative">
            <input
              type="number"
              min="0"
              value={newZonePrice}
              onChange={(e) => setNewZonePrice(e.target.value)}
              placeholder="سعر الشحن (مثال: 80)"
              className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
              {storeCurrency}
            </span>
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة إلى القائمة</span>
          </button>
        </div>
      </form>

      {/* Zones List Grid */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث باسم المحافظة..."
              className="w-full bg-white border border-slate-200 focus:border-blue-600 rounded-xl pr-9 pl-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none shadow-2xs"
            />
          </div>
          <span className="text-xs font-bold text-slate-500">
            إجمالي المناطق: <strong className="text-slate-900 font-mono">{filteredZones.length}</strong>
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs font-bold">جاري تحميل مناطق وأسعار الشحن...</span>
          </div>
        ) : filteredZones.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold">لا توجد مناطق تطابق بحثك</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {filteredZones.map((zone) => (
              <div 
                key={zone.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  zone.active 
                    ? "bg-white border-slate-200/80 hover:border-blue-300 shadow-2xs" 
                    : "bg-slate-50 border-slate-200 opacity-60"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${zone.active ? "bg-blue-50 text-blue-600" : "bg-slate-200 text-slate-500"}`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-black text-slate-900 block truncate">
                      {zone.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(zone.id)}
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border mt-0.5 cursor-pointer ${
                        zone.active 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {zone.active ? "الشحن متاح 🟢" : "غير متاح حالياً 🔴"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative w-24">
                    <input
                      type="number"
                      min="0"
                      value={zone.price}
                      onChange={(e) => handlePriceChange(zone.id, e.target.value)}
                      disabled={!zone.active}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-600 rounded-xl pl-8 pr-2 py-1 text-xs font-mono font-black text-slate-900 focus:outline-none disabled:bg-slate-100"
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">
                      {storeCurrency}
                    </span>
                  </div>

                  <Tooltip text="حذف منطقة الشحن">
                    <button
                      type="button"
                      onClick={() => handleDeleteZone(zone.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
