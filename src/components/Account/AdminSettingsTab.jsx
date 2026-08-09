import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Save, 
  Sparkles, 
  Sliders, 
  CheckCircle2, 
  Server, 
  Send, 
  XCircle, 
  AlertCircle, 
  Megaphone, 
  Image as ImageIcon, 
  Share2, 
  DollarSign, 
  Clock, 
  FileText, 
  Globe, 
  Tag, 
  ShieldCheck,
  Zap
} from "lucide-react";
import { getStoreSettings, saveStoreSettings } from "../../lib/storeSettingsService";
import { emailApi } from "../../lib/emailApi";

export default function AdminSettingsTab({ products = [], lang = "ar", triggerToast = () => {} }) {
  const [settings, setSettings] = useState(getStoreSettings());
  const [isSaved, setIsSaved] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("ALL"); // "ALL", "BRANDING", "ANNOUNCEMENT", "BANNERS", "SOCIAL", "POLICIES", "SMTP"

  // Email Diagnostic State
  const [testEmailInput, setTestEmailInput] = useState("");
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [smtpStatus, setSmtpStatus] = useState(null);
  const [emailTestResult, setEmailTestResult] = useState(null);

  useEffect(() => {
    setSettings(getStoreSettings());
  }, []);

  const handleCheckSmtpStatus = async () => {
    setIsTestingSmtp(true);
    setSmtpStatus(null);
    try {
      const data = await emailApi.testSmtpConnection();
      if (data && data.success) {
        setSmtpStatus({ success: true, message: "خادم البريد SMTP متصل ويعمل بكفاءة عالية 🚀" });
      } else {
        setSmtpStatus({ success: false, message: data?.error || "تعذر الاتصال بخادم البريد (تأكد من إعداد مفاتيح Brevo SMTP وتواجد السيرفر)" });
      }
    } catch (err) {
      setSmtpStatus({ success: false, message: err.message });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmailInput || !testEmailInput.trim()) {
      triggerToast(lang === "ar" ? "يرجى إدخال بريد إلكتروني لاختبار الإرسال" : "Please enter an email address");
      return;
    }
    setIsSendingTestEmail(true);
    setEmailTestResult(null);
    try {
      const res = await emailApi.sendWelcomeEmail(testEmailInput.trim(), "عميل تجريبي");
      if (res && res.success) {
        setEmailTestResult({ success: true, message: `تم إرسال إيميل الترحيب بنجاح إلى ${testEmailInput} ✉️` });
        triggerToast(lang === "ar" ? "تم إرسال الإيميل التجريبي بنجاح ✅" : "Test email sent successfully ✅");
      } else {
        setEmailTestResult({ success: false, message: res?.error || "فشل إرسال الإيميل التجريبي" });
      }
    } catch (err) {
      setEmailTestResult({ success: false, message: err.message });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value
    }));
    setIsSaved(false);
  };

  const handleNestedChange = (parentKey, childKey, value) => {
    setSettings((prev) => ({
      ...prev,
      [parentKey]: {
        ...(prev[parentKey] || {}),
        [childKey]: value
      }
    }));
    setIsSaved(false);
  };

  const handleSave = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    saveStoreSettings(settings);
    setIsSaved(true);
    triggerToast(lang === "ar" ? "تم حفظ كافة إعدادات الشركة، البانرات والشريط العلوي بنجاح ✅" : "All company, banner & announcement settings saved successfully ✅");
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 text-right font-sans pb-10" dir={lang === "ar" ? "rtl" : "ltr"}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-blue-900/40 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h3 className="text-base sm:text-lg font-black">
              {lang === "ar" ? "إعدادات الشركة، الشريط الإعلاني وإعدادات البريد ⚙️" : "Company, Announcement Bar & Email Settings"}
            </h3>
          </div>
          <p className="text-xs text-blue-200/80 font-medium">
            {lang === "ar"
              ? "تحكم كامل ببيانات البراند، أرقام التواصل، شريط التنبيهات العلوي، وسائل التواصل، والسياسات المالية."
              : "Complete management of brand info, contacts, top announcement bar, social links & store policies."}
          </p>
        </div>

        <button
          onClick={handleSave}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-6 py-2.5 rounded-2xl text-xs transition-all active:scale-95 shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
        >
          {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? (lang === "ar" ? "تم الحفظ!" : "Saved!") : (lang === "ar" ? "حفظ التغييرات الآن" : "Save All Changes")}</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200/60 dark:border-slate-800">
        {[
          { id: "ALL", label: lang === "ar" ? "عرض كافة الإعدادات" : "All Settings", icon: Sliders },
          { id: "BRANDING", label: lang === "ar" ? "بيانات وتواصل الشركة" : "Company Info", icon: Building2 },
          { id: "ANNOUNCEMENT", label: lang === "ar" ? "الشريط الإعلاني العلوي" : "Top Announcement", icon: Megaphone },
          { id: "SOCIAL", label: lang === "ar" ? "روابط التواصل والسياسات" : "Social & Policies", icon: Share2 },
          { id: "SMTP", label: lang === "ar" ? "فحص البريد SMTP" : "Email Diagnostics", icon: Server }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* SECTION 1: Company Branding & Contact Information */}
        {(activeSubTab === "ALL" || activeSubTab === "BRANDING") && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  {lang === "ar" ? "هوية وبيانات وتواصل الشركة الرسمي" : "Company Identity & Official Contact Info"}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {lang === "ar" ? "سيتم طباعة هذه البيانات في الفواتير، بوليصات الشحن، وتذييل الموقع تلقائياً" : "Printed dynamically in invoices, waybills, and website footer"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  {lang === "ar" ? "اسم الشهرة والبراند (Company Name)" : "Brand Name"}
                </label>
                <input
                  type="text"
                  value={settings.companyName || ""}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  placeholder="نايل تك - NileTechno"
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  {lang === "ar" ? "شعار أو السلوجان الترويجي (Tagline)" : "Slogan / Tagline"}
                </label>
                <input
                  type="text"
                  value={settings.companySlogan || ""}
                  onChange={(e) => handleChange("companySlogan", e.target.value)}
                  placeholder="وجهتك الأولى لأحدث التقنيات والإلكترونيات الذكية"
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  {lang === "ar" ? "رقم الواتساب الرسمي (WhatsApp)" : "Official WhatsApp"}
                </label>
                <input
                  type="text"
                  value={settings.companyWhatsapp || ""}
                  onChange={(e) => handleChange("companyWhatsapp", e.target.value)}
                  placeholder="01019650207"
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  {lang === "ar" ? "هاتف الدعم الفني المباشر" : "Direct Support Phone"}
                </label>
                <input
                  type="text"
                  value={settings.supportPhone || ""}
                  onChange={(e) => handleChange("supportPhone", e.target.value)}
                  placeholder="01023456789"
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  {lang === "ar" ? "الخط الساخن / الرقم المختصر" : "Hotline"}
                </label>
                <input
                  type="text"
                  value={settings.hotline || ""}
                  onChange={(e) => handleChange("hotline", e.target.value)}
                  placeholder="19000"
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  {lang === "ar" ? "هاتف قسم المبيعات واستلام الطلبات" : "Orders Phone"}
                </label>
                <input
                  type="text"
                  value={settings.ordersPhone || ""}
                  onChange={(e) => handleChange("ordersPhone", e.target.value)}
                  placeholder="01019650207"
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  {lang === "ar" ? "البريد الإلكتروني للشركة والدعم" : "Company Email"}
                </label>
                <input
                  type="email"
                  value={settings.companyEmail || ""}
                  onChange={(e) => handleChange("companyEmail", e.target.value)}
                  placeholder="support@niletechno.com"
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  {lang === "ar" ? "عنوان المقر الرئيسي والمستودع" : "Headquarter Address"}
                </label>
                <input
                  type="text"
                  value={settings.companyAddress || ""}
                  onChange={(e) => handleChange("companyAddress", e.target.value)}
                  placeholder="القاهرة، مصر - شارع التحرير، الدقي"
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  {lang === "ar" ? "ساعات العمل الرسمية" : "Work Hours"}
                </label>
                <input
                  type="text"
                  value={settings.workHours || ""}
                  onChange={(e) => handleChange("workHours", e.target.value)}
                  placeholder="يومياً من 10 صباحاً حتى 10 مساءً"
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  {lang === "ar" ? "رقم السجل التجاري" : "Commercial Register"}
                </label>
                <input
                  type="text"
                  value={settings.commercialRegister || ""}
                  onChange={(e) => handleChange("commercialRegister", e.target.value)}
                  placeholder="1020304050"
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  {lang === "ar" ? "رقم البطاقة الضريبية" : "Tax Card Number"}
                </label>
                <input
                  type="text"
                  value={settings.taxCardNumber || ""}
                  onChange={(e) => handleChange("taxCardNumber", e.target.value)}
                  placeholder="987-654-321"
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: Top Announcement Bar Settings */}
        {(activeSubTab === "ALL" || activeSubTab === "ANNOUNCEMENT") && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {lang === "ar" ? "شريط الإعلانات والتنبيهات العلوي بالمتجر" : "Top Announcement & Alert Bar"}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {lang === "ar" ? "شريط متحرك يظهر في أعلى كافة الصفحات للترحيب بالعملاء وعرض العروض السريعة" : "Top ticker bar displayed across all pages for store alerts and flash promo codes"}
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 px-3.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-black">
                <input
                  type="checkbox"
                  checked={settings.showAnnouncementBar !== false}
                  onChange={(e) => handleChange("showAnnouncementBar", e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-slate-800 dark:text-slate-200">
                  {settings.showAnnouncementBar !== false ? (lang === "ar" ? "مفعل ومُشغل" : "Active") : (lang === "ar" ? "معطل" : "Disabled")}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
              <div className="md:col-span-2">
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  {lang === "ar" ? "نص الإعلان أو التنبيه العلوي" : "Announcement Message"}
                </label>
                <input
                  type="text"
                  value={settings.announcementText || ""}
                  onChange={(e) => handleChange("announcementText", e.target.value)}
                  placeholder="⚡️ شحن مجاني لجميع المحافظات للطلبات الأكثر من 1000 ج.م | استخدم كود OFF10 للحصول على خصم 10%"
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  {lang === "ar" ? "كود الخصم المرتبط بالشريط" : "Promo Code"}
                </label>
                <input
                  type="text"
                  value={settings.announcementCode || ""}
                  onChange={(e) => handleChange("announcementCode", e.target.value)}
                  placeholder="OFF10"
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1">
                  {lang === "ar" ? "لون ونمط خلفية الشريط" : "Background Style"}
                </label>
                <select
                  value={settings.announcementBg || "bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-900"}
                  onChange={(e) => handleChange("announcementBg", e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-900">🌌 الأزرق الملكي الداكن (Royal Navy Gradient)</option>
                  <option value="bg-gradient-to-r from-rose-700 via-rose-800 to-rose-900">🔥 الأحمر الناري المثير (Fire Red Alert)</option>
                  <option value="bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-800">✳️ الأخضر الزردي الفاخر (Emerald Success)</option>
                  <option value="bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900">✨ الذهبي الملكي (Dark Gold Luxury)</option>
                  <option value="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900">🟣 البنفسجي العصري (Modern Purple)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: Social Media Links & Store Policies */}
        {(activeSubTab === "ALL" || activeSubTab === "SOCIAL") && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Social Media Links */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {lang === "ar" ? "روابط منصات التواصل الاجتماعي" : "Social Media Links"}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {lang === "ar" ? "تظهر في تذييل الصفحة والقائمة الجانبية للتواصل المباشر مع الزوار" : "Displayed in page footer and mobile drawer for customer engagement"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs font-bold">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    {lang === "ar" ? "رابط صفحة الفيسبوك (Facebook URL)" : "Facebook Page"}
                  </label>
                  <input
                    type="url"
                    value={settings.facebookUrl || ""}
                    onChange={(e) => handleChange("facebookUrl", e.target.value)}
                    placeholder="https://facebook.com/niletechno"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    {lang === "ar" ? "رابط حساب الانستجرام (Instagram URL)" : "Instagram Page"}
                  </label>
                  <input
                    type="url"
                    value={settings.instagramUrl || ""}
                    onChange={(e) => handleChange("instagramUrl", e.target.value)}
                    placeholder="https://instagram.com/niletechno"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    {lang === "ar" ? "رابط قناة التليجرام (Telegram Channel)" : "Telegram Channel"}
                  </label>
                  <input
                    type="url"
                    value={settings.telegramUrl || ""}
                    onChange={(e) => handleChange("telegramUrl", e.target.value)}
                    placeholder="https://t.me/niletechno"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    {lang === "ar" ? "رابط حساب التيك توك (TikTok URL)" : "TikTok Account"}
                  </label>
                  <input
                    type="url"
                    value={settings.tiktokUrl || ""}
                    onChange={(e) => handleChange("tiktokUrl", e.target.value)}
                    placeholder="https://tiktok.com/@niletechno"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    {lang === "ar" ? "رابط قناة اليوتيوب (YouTube Channel)" : "YouTube Channel"}
                  </label>
                  <input
                    type="url"
                    value={settings.youtubeUrl || ""}
                    onChange={(e) => handleChange("youtubeUrl", e.target.value)}
                    placeholder="https://youtube.com/@niletechno"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Store Financial & Policy Settings */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {lang === "ar" ? "العملة والسياسات المالية للمتجر" : "Currency & Financial Settings"}
                  </h4>
                  <p className="text-[10px] text-slate-500">
                    {lang === "ar" ? "تطبيق عملة المتجر، الضرائب، وحسابات حد الشحن المجاني" : "Set store currency, VAT tax rate, and free shipping thresholds"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs font-bold">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    {lang === "ar" ? "رمز العملة الافتراضية" : "Store Currency Symbol"}
                  </label>
                  <input
                    type="text"
                    value={settings.currency || "ج.م"}
                    onChange={(e) => handleChange("currency", e.target.value)}
                    placeholder="ج.م"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    {lang === "ar" ? "نسبة ضريبة القيمة المضافة (%)" : "VAT Tax Rate (%)"}
                  </label>
                  <input
                    type="number"
                    value={settings.vatPercentage || "14"}
                    onChange={(e) => handleChange("vatPercentage", e.target.value)}
                    placeholder="14"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1">
                    {lang === "ar" ? "الحد الأدنى لقيمة الطلب للحصول على شحن مجاني" : "Free Shipping Threshold"}
                  </label>
                  <input
                    type="number"
                    value={settings.freeShippingThreshold || "1000"}
                    onChange={(e) => handleChange("freeShippingThreshold", e.target.value)}
                    placeholder="1000"
                    className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: Live SMTP Email Server Diagnostics & Testing Tool */}
        {(activeSubTab === "ALL" || activeSubTab === "SMTP") && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {lang === "ar" ? "فحص وتجربة إرسال الإيميلات الفورية (Brevo SMTP Diagnostics)" : "Email SMTP Live Diagnostics & Test"}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {lang === "ar" ? "تأكد من حالة ربط السيرفر وقم بتجربة إرسال إيميل حقيقي فوراً لأي عنوان" : "Test real-time email delivery and verify SMTP server status"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckSmtpStatus}
                disabled={isTestingSmtp}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Server className={`w-3.5 h-3.5 ${isTestingSmtp ? "animate-spin" : ""}`} />
                <span>{isTestingSmtp ? (lang === "ar" ? "جاري الفحص..." : "Checking...") : (lang === "ar" ? "فحص اتصال السيرفر" : "Check SMTP Status")}</span>
              </button>
            </div>

            {/* Connection status badge */}
            {smtpStatus && (
              <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 ${
                smtpStatus.success
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                  : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
              }`}>
                {smtpStatus.success ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" /> : <XCircle className="w-5 h-5 shrink-0 text-rose-600" />}
                <span>{smtpStatus.message}</span>
              </div>
            )}

            {/* Live Test Email Sender Form */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700 space-y-3">
              <label className="block text-xs font-black text-slate-800 dark:text-slate-200">
                {lang === "ar" ? "تجربة إرسال إيميل ترحيبي حقيقي (Test Real Delivery):" : "Send Test Email to:"}
              </label>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={testEmailInput}
                  onChange={(e) => setTestEmailInput(e.target.value)}
                  placeholder="ضع بريدك الإلكتروني هنا (مثال: mymail@gmail.com)"
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />

                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={isSendingTestEmail}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-black px-5 py-2 rounded-xl text-xs transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isSendingTestEmail ? "animate-bounce" : ""}`} />
                  <span>{isSendingTestEmail ? (lang === "ar" ? "جاري الإرسال..." : "Sending...") : (lang === "ar" ? "إرسال الآن ✉️" : "Send Now")}</span>
                </button>
              </div>

              {emailTestResult && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  emailTestResult.success
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
                }`}>
                  {emailTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                  <span>{emailTestResult.message}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Save Button at bottom */}
        <div className="pt-2 text-center">
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black py-4 rounded-2xl text-xs sm:text-sm shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            {isSaved ? <CheckCircle2 className="w-5 h-5 text-emerald-300" /> : <Save className="w-5 h-5" />}
            <span>{isSaved ? (lang === "ar" ? "تم حفظ كافة الإعدادات بنجاح! ✅" : "All Settings Saved!") : (lang === "ar" ? "حفظ وتفعيل كافة إعدادات الشركة، البانرات والشريط العلوي 🚀" : "Save & Apply All Store, Banner & Announcement Settings")}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
