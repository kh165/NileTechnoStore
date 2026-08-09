// Centralized Store Settings Service for NileTechno
// Manages company phone numbers, WhatsApp, hotline, address, and side banner configurations.

const SETTINGS_KEY = "niletechno_store_settings_v1";

export const DEFAULT_STORE_SETTINGS = {
  // Company Branding & Info
  companyName: "نايل تك - NileTechno",
  companySlogan: "وجهتك الأولى لأحدث التقنيات والإلكترونيات الذكية",
  companyWhatsapp: "01019650207",
  supportPhone: "01023456789",
  hotline: "19000",
  ordersPhone: "01019650207",
  companyEmail: "support@niletechno.com",
  companyAddress: "القاهرة، مصر - شارع التحرير، الدقي",
  workHours: "يومياً من 10 صباحاً حتى 10 مساءً",
  commercialRegister: "1020304050",
  taxCardNumber: "987-654-321",

  // Announcement Bar Settings
  showAnnouncementBar: true,
  announcementText: "⚡️ شحن مجاني لجميع المحافظات للطلبات الأكثر من 1000 ج.م | استخدم كود OFF10 للحصول على خصم 10%",
  announcementBg: "bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-900",
  announcementCode: "OFF10",

  // Main Hero Banner Settings
  heroTitle: "أحدث التقنيات وأقوى العروض الحصرية 🔥",
  heroSubtitle: "تسوق أفضل الهواتف، اللابتوبات، والإكسسوارات بخصومات تصل إلى 40% مع ضمان رسمي وشحن سريع.",
  heroBadge: "عروض الموسم الحارة 💥",
  heroCtaText: "تصفح العروض الآن 🚀",
  heroProductId: "",
  heroImageUrl: "",

  // Interactive Side Banners
  sideBanner1: {
    productId: "",
    title: "عرض العمالقة الحصري ⚡️",
    badge: "تخفيض مجنون",
    subtitle: "اضغط هنا لاكتشاف مفاجأة المنتج!",
    animationType: "bouncingBall" // "bouncingBall", "popIn", "pulse"
  },
  sideBanner2: {
    productId: "",
    title: "المنتج الأكثر طلباً 🔥",
    badge: "شحن مجاني",
    subtitle: "انقر للتعرف على مواصفات الجهاز",
    animationType: "popIn"
  },

  // Social Links
  facebookUrl: "https://facebook.com",
  instagramUrl: "https://instagram.com",
  telegramUrl: "https://t.me",
  tiktokUrl: "https://tiktok.com",
  youtubeUrl: "https://youtube.com",

  // Store Policies & Financial Settings
  currency: "ج.م",
  vatPercentage: "14",
  freeShippingThreshold: "1000"
};

export function getStoreSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_STORE_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.error("Error loading store settings from storage:", err);
  }
  return DEFAULT_STORE_SETTINGS;
}

export function saveStoreSettings(newSettings) {
  try {
    const current = getStoreSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    // Dispatch custom event so listeners everywhere can update instantly
    window.dispatchEvent(new CustomEvent("niletechno_settings_updated", { detail: updated }));
    return updated;
  } catch (err) {
    console.error("Failed to save store settings:", err);
    return newSettings;
  }
}
