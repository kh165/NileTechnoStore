import i18n from "i18next";
import { initReactI18next } from "react-i18next";

export const resources = {
  ar: {
    translation: {
      // Navigation & Header
      home: "الرئيسية",
      store: "المتجر والقطاعات",
      wishlist: "المفضلة",
      account: "حسابي",
      welcome: "مرحباً بك!",
      cart: "السلة",
      myCart: "سلة المشتريات",
      emptyCart: "سلتك فارغة حالياً",
      startShopping: "ابدأ التسوق الآن",
      total: "الإجمالي",
      subtotal: "المجموع الفرعي",
      checkout: "متابعة إتمام الطلب",
      viewCart: "عرض السلة",
      trackOrder: "تتبع حالة الطلب",
      searchPlaceholder: "ابحث بالاسم، الفئة، المواصفات...",
      allCategories: "الكل",
      allProducts: "جميع المنتجات",
      offers: "العروض الحصرية 🔥",
      newArrivals: "وصل حديثاً 🆕",
      featured: "الأكثر مبيعاً ⭐",
      filterBy: "تصفية حسب",
      sortBy: "ترتيب حسب",
      defaultSort: "الافتراضي",
      priceLowToHigh: "السعر: من الأقل للأعلى",
      priceHighToLow: "السعر: من الأعلى للأقل",
      ratingHighToLow: "التقييم: الأعلى تقييماً",
      inStockOnly: "المتوفر فقط",
      priceRange: "نطاق السعر",
      applyFilter: "تطبيق التصفية",
      resetFilter: "إعادة ضبط",
      noProductsFound: "لم نجد أي منتجات تطابق بحثك",
      tryDifferentSearch: "جرب البحث بكلمات أخرى أو اختر قسم آخر",

      // Product Details
      addToCart: "إضافة للسلة",
      addedToCart: "تمت الإضافة للسلة",
      outOfStock: "غير متوفر بالمخزون",
      inStock: "متوفر بالمخزون",
      quantity: "الكمية",
      description: "وصف المنتج",
      specifications: "المواصفات",
      reviews: "التقييمات والآراء",
      writeReview: "أضف تقييمك",
      price: "السعر",
      discount: "خصم",
      discountPrice: "سعر الخصم",
      saveAmount: "وفرت",
      currency: "ج.م",
      guarantee: "ضمان جودة الأصالة 100%",
      fastDelivery: "توصيل سريع لكافة المحافظات",
      securePayment: "دفع آمن عند الاستلام",

      // Checkout & Orders
      checkoutTitle: "إتمام الطلب وإدخال البيانات",
      fullName: "الاسم بالكامل",
      phone: "رقم الهاتف / الواتساب",
      governorate: "المحافظة",
      city: "المدينة / المنطقة",
      address: "العنوان التفصيلي (الشارع / رقم المبنى)",
      notes: "ملاحظات إضافية على الطلب (اختياري)",
      paymentMethod: "طريقة الدفع",
      cashOnDelivery: "الدفع عند الاستلام (كاش)",
      shippingFee: "مصاريف الشحن",
      freeShipping: "شحن مجاني",
      confirmOrder: "تأكيد وإرسال الطلب 🚀",
      orderSuccessTitle: "تم استلام طلبك بنجاح! 🎉",
      orderNumber: "رقم الطلب",
      thankYou: "شكراً لتسوقك معنا في NileTechno. سنتواصل معك قريباً لتأكيد الشحن.",

      // Track Order
      trackOrderTitle: "تتبع حالة طلبك",
      trackOrderSubtitle: "أدخل رقم الطلب أو رقم الهاتف للاستعلام عن تفاصيل وسير الشحنة",
      searchOrderPlaceholder: "رقم الطلب (مثال: 123456) أو رقم الهاتف...",
      multipleOrdersFound: "تم العثور على أكثر من طلب",
      chooseOrderPrompt: "يرجى تحديد الطلب الذي تريد تتبعه من القائمة أدناه:",
      backToOrders: "العودة لقائمة الطلبات",
      printInvoice: "طباعة الفاتورة الرسمية",
      shipmentTimeline: "المسار الزمني المباشر لحركة الشحنة",
      customerShippingDetails: "بيانات العميل وعنوان التوصيل",
      paymentDetails: "تفاصيل الدفع",
      itemsTotal: "قيمة المشتريات:",
      deliveryFee: "رسوم الشحن:",

      // User Account
      loginTitle: "تسجيل الدخول / إنشاء حساب",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      login: "تسجيل الدخول",
      signup: "إنشاء حساب جديد",
      logout: "تسجيل الخروج",
      myOrders: "طلباتي السابقة",
      noOrders: "لا توجد طلبات سابقة حتى الآن",
      profile: "الملف الشخصي",
      adminDashboard: "لوحة تحكم الأدمن",

      // Admin Dashboard & Statuses
      inventory: "المخزون والمنتجات",
      ordersManagement: "إدارة الطلبات",
      coupons: "كوبونات الخصم",
      bannerSlider: "بنرات العرض",
      reports: "التقارير والإحصائيات",
      activityLog: "سجل نشاطات الأدمن 📋",
      adminPermissions: "صلاحيات المدراء",
      shippingZones: "مناطق وأسعار الشحن",
      customerReviews: "تقييمات العملاء",

      // Order Statuses
      pending: "قيد الانتظار",
      processing: "جاري التحضير",
      delivering: "جاري التوصيل",
      completed: "مكتمل وتسلم",
      cancelled: "ملغي",

      // Common Controls
      save: "حفظ",
      cancel: "إلغاء",
      edit: "تعديل",
      delete: "حذف",
      confirm: "تأكيد",
      close: "إغلاق",
      back: "رجوع",
      loading: "جاري التحميل...",
      success: "تم بنجاح",
      error: "حدث خطأ",
      allRightsReserved: "جميع الحقوق محفوظة © NileTechno Store"
    }
  },
  en: {
    translation: {
      // Navigation & Header
      home: "Home",
      store: "Store & Categories",
      wishlist: "Wishlist",
      account: "My Account",
      welcome: "Welcome!",
      cart: "Cart",
      myCart: "Shopping Cart",
      emptyCart: "Your cart is currently empty",
      startShopping: "Start Shopping Now",
      total: "Total",
      subtotal: "Subtotal",
      checkout: "Proceed to Checkout",
      viewCart: "View Cart",
      trackOrder: "Track Order Status",
      searchPlaceholder: "Search name, category, specs...",
      allCategories: "All",
      allProducts: "All Products",
      offers: "Hot Deals 🔥",
      newArrivals: "New Arrivals 🆕",
      featured: "Top Sellers ⭐",
      filterBy: "Filter By",
      sortBy: "Sort By",
      defaultSort: "Default",
      priceLowToHigh: "Price: Low to High",
      priceHighToLow: "Price: High to Low",
      ratingHighToLow: "Rating: Highest Rated",
      inStockOnly: "In Stock Only",
      priceRange: "Price Range",
      applyFilter: "Apply Filters",
      resetFilter: "Reset",
      noProductsFound: "No products match your search",
      tryDifferentSearch: "Try searching with different keywords or select another category",

      // Product Details
      addToCart: "Add to Cart",
      addedToCart: "Added to Cart",
      outOfStock: "Out of Stock",
      inStock: "In Stock",
      quantity: "Quantity",
      description: "Description",
      specifications: "Specifications",
      reviews: "Reviews & Ratings",
      writeReview: "Write a Review",
      price: "Price",
      discount: "Discount",
      discountPrice: "Sale Price",
      saveAmount: "You Save",
      currency: "EGP",
      guarantee: "100% Genuine Quality Guarantee",
      fastDelivery: "Fast Shipping to All Governorates",
      securePayment: "Secure Cash on Delivery",

      // Checkout & Orders
      checkoutTitle: "Complete Order & Delivery Details",
      fullName: "Full Name",
      phone: "Phone Number / WhatsApp",
      governorate: "Governorate",
      city: "City / Area",
      address: "Detailed Address (Street / Building No.)",
      notes: "Order Notes (Optional)",
      paymentMethod: "Payment Method",
      cashOnDelivery: "Cash on Delivery (COD)",
      shippingFee: "Shipping Fee",
      freeShipping: "Free Shipping",
      confirmOrder: "Confirm Order 🚀",
      orderSuccessTitle: "Order Received Successfully! 🎉",
      orderNumber: "Order #",
      thankYou: "Thank you for shopping at NileTechno. We will contact you shortly to confirm delivery.",

      // Track Order
      trackOrderTitle: "Track Your Order Status",
      trackOrderSubtitle: "Enter order number or phone number to check shipment details and progress",
      searchOrderPlaceholder: "Order ID (e.g. 123456) or phone number...",
      multipleOrdersFound: "Multiple Orders Found",
      chooseOrderPrompt: "Please choose the specific order you wish to track from the list below:",
      backToOrders: "Back to orders list",
      printInvoice: "Print Official Invoice",
      shipmentTimeline: "Live Shipment Timeline Status",
      customerShippingDetails: "Customer & Shipping Details",
      paymentDetails: "Payment Details",
      itemsTotal: "Items Total:",
      deliveryFee: "Delivery Fee:",

      // User Account
      loginTitle: "Login / Create Account",
      email: "Email Address",
      password: "Password",
      login: "Sign In",
      signup: "Create Account",
      logout: "Log Out",
      myOrders: "My Orders",
      noOrders: "No previous orders found",
      profile: "Profile",
      adminDashboard: "Admin Control Panel",

      // Admin Dashboard & Statuses
      inventory: "Inventory & Products",
      ordersManagement: "Orders Management",
      coupons: "Discount Coupons",
      bannerSlider: "Banners & Sliders",
      reports: "Reports & Analytics",
      activityLog: "Admin Activity Log 📋",
      adminPermissions: "Admin Permissions",
      shippingZones: "Shipping Zones & Rates",
      customerReviews: "Customer Reviews",

      // Order Statuses
      pending: "Pending",
      processing: "Processing",
      delivering: "Out for Delivery",
      completed: "Completed",
      cancelled: "Cancelled",

      // Common Controls
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      confirm: "Confirm",
      close: "Close",
      back: "Back",
      loading: "Loading...",
      success: "Success",
      error: "An error occurred",
      allRightsReserved: "All Rights Reserved © NileTechno Store"
    }
  }
};

import { storage } from "./storage";

const savedLang = storage.getLang("ar");

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLang,
    fallbackLng: "ar",
    interpolation: {
      escapeValue: false, // React handles escaping safely
    },
    react: {
      useSuspense: false, // Prevents layout flashes
    },
  });

export const changeAppLanguage = (lang) => {
  const newLang = lang === "en" ? "en" : "ar";
  if (typeof window !== "undefined") {
    storage.setLang(newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  }
  i18n.changeLanguage(newLang);
  return newLang;
};

export function getTranslation(lang, key, defaultValue) {
  if (i18n.isInitialized) {
    return i18n.t(key, { lng: lang || i18n.language, defaultValue: defaultValue || key });
  }
  const dict = resources[lang]?.translation || resources["ar"].translation;
  return dict[key] || defaultValue || key;
}

export default i18n;
