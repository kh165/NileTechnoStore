import * as XLSX from 'xlsx';

/**
 * Helper to translate order status to Arabic label
 */
const getStatusLabel = (status) => {
  switch (String(status).toUpperCase()) {
    case "PENDING": return "قيد المراجعة";
    case "PREPARING": return "جاري التجهيز";
    case "SHIPPED": return "جاري الشحن";
    case "DELIVERED": return "تم الاستلام";
    case "COMPLETED": return "مكتمل";
    case "CANCELED": return "ملغي";
    default: return status || "غير محدد";
  }
};

/**
 * Export Orders List to Genuine Microsoft Excel (.xlsx)
 */
export const exportOrdersToExcel = (orders = [], filename = "تقرير_الطلبات_NileTechno") => {
  if (!orders || orders.length === 0) {
    alert("لا توجد طلبات للتصدير حالياً");
    return;
  }

  const data = orders.map(order => {
    const items = Array.isArray(order.items) ? order.items : [];
    const itemsText = items.map(i => `${i.name || "منتج"} (${i.quantity || 1}×${i.price || 0})`).join(" | ");
    const itemCount = items.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);

    return {
      "رقم الطلب": order.orderNumber || order.id || "",
      "تاريخ الطلب": order.createdAt ? new Date(order.createdAt).toLocaleString("ar-EG") : "",
      "اسم العميل": order.customerName || order.name || "غير مسجل",
      "رقم الهاتف": order.customerPhone || order.phone || "غير محدد",
      "المحافظة": order.governorate || order.shippingLocationName || "",
      "العنوان بالتفصيل": order.customerAddress || order.address || "",
      "إجمالي المبلغ (ج.م)": parseFloat(order.total) || 0,
      "حالة الطلب": getStatusLabel(order.status),
      "طريقة الدفع": order.paymentMethod || "الدفع عند الاستلام",
      "عدد القطع": itemCount,
      "تفاصيل المنتجات": itemsText,
      "ملاحظات العميل": order.customerNotes || "",
      "ملاحظة الإدارة الداخلية": order.internalNote || ""
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set Right-To-Left view for Arabic Excel
  if (!worksheet['!views']) worksheet['!views'] = [];
  worksheet['!views'].push({ RTL: true });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "قائمة الطلبات");

  const cleanFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, cleanFilename);
};

/**
 * Export Products/Inventory List to Genuine Microsoft Excel (.xlsx)
 */
export const exportProductsToExcel = (products = [], filename = "تقرير_المنتجات_والخزينة_NileTechno") => {
  if (!products || products.length === 0) {
    alert("لا توجد منتجات للتصدير حالياً");
    return;
  }

  const data = products.map(prod => ({
    "معرف المنتج": prod.id || "",
    "اسم المنتج": prod.name || "",
    "القسم / التصنيف": prod.category || "عام",
    "السعر الحالي (ج.م)": parseFloat(prod.price) || 0,
    "السعر السابق (ج.م)": parseFloat(prod.originalPrice || prod.oldPrice) || 0,
    "المخزون المتاح (قطع)": prod.stock !== undefined ? prod.stock : (prod.inStock ? "متوفر" : 0),
    "سعر التكلفة (ج.م)": parseFloat(prod.costPrice) || 0,
    "حالة التوفر": prod.inStock ? "متوفر للبيع" : "نفد من المخزن",
    "مميز بالصفحة الرئيسية": prod.isFeatured ? "نعم" : "لا"
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  if (!worksheet['!views']) worksheet['!views'] = [];
  worksheet['!views'].push({ RTL: true });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "مخزون المنتجات");

  const cleanFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, cleanFilename);
};

/**
 * Export Users List to Genuine Microsoft Excel (.xlsx)
 */
export const exportUsersToExcel = (users = [], filename = "سجل_العملاء_والمستخدمين_NileTechno") => {
  if (!users || users.length === 0) {
    alert("لا يوجد مستخدمين للتصدير حالياً");
    return;
  }

  const data = users.map(u => ({
    "الاسم الكامل": u.name || "غير مسمى",
    "البريد الإلكتروني": u.email || "",
    "رقم الهاتف": u.phone || "",
    "العنوان المسجل": u.address || "",
    "الرتبة / الصلاحية": u.role === "admin" ? "مدير نظام" : (u.role === "superadmin" ? "مدير عام" : "عميل"),
    "نقاط الولاء": u.points || 0,
    "تاريخ التسجيل": u.createdAt ? new Date(u.createdAt).toLocaleDateString("ar-EG") : "",
    "حالة الحساب": u.isBlocked ? "محظور" : "نشط"
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  if (!worksheet['!views']) worksheet['!views'] = [];
  worksheet['!views'].push({ RTL: true });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "سجل العملاء");

  const cleanFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, cleanFilename);
};
