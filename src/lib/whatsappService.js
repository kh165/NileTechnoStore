/**
 * WhatsApp Notification Service for NileTechno Store
 * Company Sender Mobile: 01019650207
 */

import { getStoreSettings } from "./storeSettingsService";

export const getCompanyWhatsappPhone = () => {
  return getStoreSettings().companyWhatsapp || "01019650207";
};

export const COMPANY_WHATSAPP_PHONE = getCompanyWhatsappPhone();

/**
 * Format a phone number for WhatsApp international URL format (e.g. 01019650207 -> 201019650207)
 */
export function formatEgyptianPhoneForWhatsApp(phoneStr = "") {
  if (!phoneStr) return "";
  let cleaned = String(phoneStr).replace(/\D/g, "");
  if (cleaned.startsWith("01")) {
    cleaned = "2" + cleaned;
  } else if (!cleaned.startsWith("20") && cleaned.length === 10) {
    cleaned = "20" + cleaned;
  }
  return cleaned;
}

/**
 * Generate accurate, prestigious, and polite Arabic notification message for order status change
 */
export function generateWhatsAppOrderMessage(order, statusStr, companyPhone = getCompanyWhatsappPhone()) {
  if (!order) return "";
  
  const customerName = order.customerName || "عميلنا العزيز";
  const orderNum = order.orderNumber || order.id || "N/A";
  const totalAmount = order.total || "0";
  const status = (statusStr || order.status || "PENDING").toUpperCase();

  const header = `🛒 *NileTechno Store | متجر نيل تكنو*
━━━━━━━━━━━━━━━━━━━━━`;

  let body = "";

  switch (status) {
    case "PENDING":
    case "RECEIVED":
      body = `أهلاً بك عزيزنا *${customerName}* ✨
يسعدنا إبلاغك بأنه قد تم تسجيل طلبك رقم (*#${orderNum}*) بنجاح!

💰 *إجمالي الشحنة:* ${totalAmount} ج.م
📌 *الحالة الحالية:* تم استلام الطلب وقيد المراجعة.

نشكرك على اختيارك NileTechno. سنقوم بإبلاغك تلقائياً بأولى خطوات التجهيز.
📞 *للدعم والاستفسار:* ${companyPhone}`;
      break;

    case "PREPARING":
    case "PROCESSING":
      body = `عزيزي العميل *${customerName}* 📦
نفيدك علماً بأنه جاري الآن تجهيز وتغليف شحنتك رقم (*#${orderNum}*) بكل عناية.

📌 *الحالة الحالية:* جاري التحضير والتغليف.
💰 *المبلغ الإجمالي:* ${totalAmount} ج.م

سنقوم بإرسال التحديث القادم فور تسليم الشحنة لمندوب التوصيل.
📞 *خدمة العملاء:* ${companyPhone}`;
      break;

    case "SHIPPED":
    case "DELIVERING":
      body = `عزيزي العميل *${customerName}* 🚚
تم تسليم شحنتك رقم (*#${orderNum}*) لشركة الشحن المعتمدة وهي الآن (في طريقها للتوصيل إليك)!

📌 *حالة الشحنة:* جاري التوصيل مع المندوب.
💵 *المبلغ المطلوب عند الاستلام:* ${totalAmount} ج.م

يرجى التكرم بالاستعداد لاستلام الشحنة.
📞 *للتواصل مع الدعم:* ${companyPhone}`;
      break;

    case "DELIVERED":
      body = `عزيزي العميل *${customerName}* 🎉
تم تسليم طلبك رقم (*#${orderNum}*) بنجاح بالكامل! (تم الاستلام ✅)

نتمنى أن تكون المنتجات قد حازت على إعجابك. يسعدنا تقييمك للتجربة عبر موقعنا.
شكراً لاختيارك NileTechno 💙
📞 *لأي استفسار:* ${companyPhone}`;
      break;

    case "COMPLETED":
      body = `عزيزي العميل *${customerName}* ⭐️
تم إقفال وتوثيق الطلب رقم (*#${orderNum}*) بنجاح في سجلات NileTechno Store.

نشكرك جزيل الشكر على ثقتك، ونسعد دائماً بتقديم أفضل المنتجات لك.
📞 *خدمة العملاء:* ${companyPhone}`;
      break;

    case "CANCELLED":
    case "CANCELED":
      body = `عزيزي العميل *${customerName}* ⚠️
تم إلغاء الطلب رقم (*#${orderNum}*) في متجر NileTechno.

إذا كان لديك أي استفسار أو ترغب في إعادة التوثيق، يسعدنا تواصلك معنا: ${companyPhone}`;
      break;

    default:
      body = `عزيزي العميل *${customerName}*، تم تحديث حالة طلبك رقم (*#${orderNum}*) في متجر NileTechno إلى: ${statusStr}.
📞 *للتواصل:* ${companyPhone}`;
      break;
  }

  return `${header}\n${body}`;
}

/**
 * Open WhatsApp directly with pre-formatted message to customer's phone number
 */
export function sendWhatsAppNotification(order, newStatus, companyPhone = getCompanyWhatsappPhone()) {
  if (!order || !order.customerPhone) {
    alert("رقم هاتف العميل غير متوفر لإرسال رسالة WhatsApp");
    return false;
  }

  const targetPhone = formatEgyptianPhoneForWhatsApp(order.customerPhone);
  const messageText = generateWhatsAppOrderMessage(order, newStatus, companyPhone);
  const encodedText = encodeURIComponent(messageText);

  const waUrl = `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodedText}`;
  window.open(waUrl, "_blank", "noopener,noreferrer");
  return true;
}

