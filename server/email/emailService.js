import { sendMailWithRetry } from "./smtp.js";
import { renderTemplate, buildOrderItemsTableHtml, sanitizeHeader } from "./templateEngine.js";

/**
 * Helper to clean email string from quotes and brackets
 */
function cleanEmailString(str) {
  if (!str) return "";
  let cleaned = String(str).replace(/['"]/g, "").trim();
  const match = cleaned.match(/<([^>]+)>/);
  if (match) return match[1].trim();
  return cleaned;
}

/**
 * Helper to clean name string from quotes and email brackets
 */
function cleanNameString(str) {
  if (!str) return "";
  let cleaned = String(str).replace(/['"]/g, "").trim();
  return cleaned.replace(/<[^>]+>/g, "").trim();
}

/**
 * Default Sender Address helper
 * Priority: SMTP_FROM_NAME + SMTP_FROM_EMAIL → SMTP_FROM (combined) → SMTP_USER → fallback
 */
function getFromAddress() {
  // Priority 1: explicit name + email env vars
  let fromName = cleanNameString(process.env.SMTP_FROM_NAME);
  let fromEmail = cleanEmailString(process.env.SMTP_FROM_EMAIL);

  // Priority 2: parse combined SMTP_FROM = "Name <email@domain.com>"
  if ((!fromName || !fromEmail) && process.env.SMTP_FROM) {
    const combined = String(process.env.SMTP_FROM).replace(/['"]/g, "").trim();
    const match = combined.match(/^(.+?)\s*<([^>]+)>$/);
    if (match) {
      if (!fromName) fromName = cleanNameString(match[1]);
      if (!fromEmail) fromEmail = cleanEmailString(match[2]);
    } else if (!fromEmail) {
      fromEmail = cleanEmailString(combined);
    }
  }

  // Priority 3: fallback to SMTP_USER as sender email
  if (!fromEmail && process.env.SMTP_USER) {
    fromEmail = cleanEmailString(process.env.SMTP_USER);
  }

  // Final fallbacks
  if (!fromName) fromName = "Nile Techno | متجر النيل للتكنولوجيا";
  if (!fromEmail) fromEmail = "noreply@niletechno.com";

  return `"${sanitizeHeader(fromName)}" <${sanitizeHeader(fromEmail)}>`;
}

/**
 * Centralized helper to get clean frontend URL (no trailing slash)
 */
function getFrontendUrl() {
  return (process.env.FRONTEND_URL || process.env.APP_URL || "https://niletechnostore.vercel.app")
    .replace(/['"]/g, "").trim().replace(/\/+$/, "");
}

/**
 * Status template and subject line mapping
 */
const STATUS_EMAIL_MAP = {
  CREATED: { template: "order-created", subject: "تم استلام طلبك الجديد #{{orderNumber}} - Nile Techno" },
  PENDING: { template: "order-created", subject: "تم استلام طلبك الجديد #{{orderNumber}} - Nile Techno" },
  RECEIVED: { template: "order-created", subject: "تم استلام طلبك الجديد #{{orderNumber}} - Nile Techno" },
  CONFIRMED: { template: "order-confirmed", subject: "تم تأكيد طلبك #{{orderNumber}} - Nile Techno" },
  APPROVED: { template: "order-confirmed", subject: "تم تأكيد طلبك #{{orderNumber}} - Nile Techno" },
  PROCESSING: { template: "order-processing", subject: "طلبك #{{orderNumber}} قيد التجهيز - Nile Techno" },
  PREPARING: { template: "order-processing", subject: "طلبك #{{orderNumber}} قيد التجهيز - Nile Techno" },
  PACKED: { template: "order-packed", subject: "تم تغليف طلبك #{{orderNumber}} وجاهز للشحن - Nile Techno" },
  READY: { template: "order-packed", subject: "تم تغليف طلبك #{{orderNumber}} وجاهز للشحن - Nile Techno" },
  SHIPPED: { template: "order-shipped", subject: "تم شحن طلبك #{{orderNumber}} - Nile Techno" },
  IN_TRANSIT: { template: "order-shipped", subject: "تم شحن طلبك #{{orderNumber}} - Nile Techno" },
  OUT_FOR_DELIVERY: { template: "order-out-for-delivery", subject: "طلبك #{{orderNumber}} مع مندوب الشحن الآن - Nile Techno" },
  DELIVERING: { template: "order-out-for-delivery", subject: "طلبك #{{orderNumber}} مع مندوب الشحن الآن - Nile Techno" },
  DELIVERED: { template: "order-delivered", subject: "تم تسليم طلبك #{{orderNumber}} بنجاح - Nile Techno" },
  COMPLETED: { template: "order-delivered", subject: "تم تسليم طلبك #{{orderNumber}} بنجاح - Nile Techno" },
  CANCELLED: { template: "order-cancelled", subject: "إشعار بخصوص إلغاء الطلب #{{orderNumber}} - Nile Techno" },
  CANCELED: { template: "order-cancelled", subject: "إشعار بخصوص إلغاء الطلب #{{orderNumber}} - Nile Techno" },
  REFUNDED: { template: "order-refunded", subject: "تم استرداد مبلغ الطلب #{{orderNumber}} - Nile Techno" }
};

export class EmailService {
  /**
   * 1. Send Welcome Email upon registration
   */
  static async sendWelcomeEmail({ email, name }) {
    if (!email) throw new Error("Recipient email is required.");
    const customerName = name || email.split("@")[0] || "عميلنا العزيز";

    const html = renderTemplate("welcome", {
      emailTitle: "مرحباً بك في Nile Techno",
      customerName
    });

    return await sendMailWithRetry(
      {
        from: getFromAddress(),
        to: sanitizeHeader(email),
        subject: "مرحباً بك في عائلة Nile Techno! 🚀",
        html
      },
      { template: "welcome", orderNumber: "N/A" }
    );
  }

  /**
   * 2. Send Verification Email
   */
  static async sendVerificationEmail({ email, name, verificationLink }) {
    if (!email) throw new Error("Recipient email is required.");
    const customerName = name || email.split("@")[0] || "عميلنا العزيز";
    const frontendUrl = getFrontendUrl();
    const link = verificationLink || `${frontendUrl}/verify-email?email=${encodeURIComponent(email)}`;

    const html = renderTemplate("verify-email", {
      emailTitle: "تأكيد بريدك الإلكتروني - Nile Techno",
      customerName,
      verificationLink: link
    });

    return await sendMailWithRetry(
      {
        from: getFromAddress(),
        to: sanitizeHeader(email),
        subject: "تأكيد البريد الإلكتروني الخاص بحسابك - Nile Techno",
        html
      },
      { template: "verify-email", orderNumber: "N/A" }
    );
  }

  /**
   * 3. Send Password Reset Email
   */
  static async sendPasswordResetEmail({ email, name, resetLink }) {
    if (!email) throw new Error("Recipient email is required.");
    const customerName = name || email.split("@")[0] || "عميلنا العزيز";
    const frontendUrl = getFrontendUrl();
    const link = resetLink || `${frontendUrl}/reset-password?email=${encodeURIComponent(email)}`;

    const html = renderTemplate("password-reset", {
      emailTitle: "إعادة تعيين كلمة المرور - Nile Techno",
      customerName,
      resetLink: link
    });

    return await sendMailWithRetry(
      {
        from: getFromAddress(),
        to: sanitizeHeader(email),
        subject: "طلب إعادة تعيين كلمة المرور - Nile Techno",
        html
      },
      { template: "password-reset", orderNumber: "N/A" }
    );
  }

  /**
   * 4. Send Login Notification Email
   */
  static async sendLoginNotification({ email, name, ip, browser, os, loginTime, location }) {
    if (!email) throw new Error("Recipient email is required.");
    const customerName = name || email.split("@")[0] || "عميلنا العزيز";
    const formattedTime = loginTime || new Date().toLocaleString("ar-EG", { dateStyle: "full", timeStyle: "medium" });

    const html = renderTemplate("login-notification", {
      emailTitle: "تنبيه أمني - تسجيل دخول جديد",
      customerName,
      ip: ip || "",
      browser: browser || "",
      os: os || "",
      location: location || "",
      loginTime: formattedTime
    });

    return await sendMailWithRetry(
      {
        from: getFromAddress(),
        to: sanitizeHeader(email),
        subject: "🛡️ تنبيه أمني: تم تسجيل الدخول إلى حسابك في Nile Techno",
        html
      },
      { template: "login-notification", orderNumber: "N/A" }
    );
  }

  /**
   * 5. Send Order Status Notification Email (Handles all statuses)
   */
  static async sendOrderStatusEmail({ email, name, order, newStatus }) {
    if (!order) {
      console.warn("[EMAIL SERVICE WARNING] No order object provided for order status notification.");
      return { success: false, error: "No order object provided" };
    }

    const recipientEmail = email || order.customerEmail || order.email || order.userEmail || order.shippingDetails?.email || order.customerInfo?.email;

    if (!recipientEmail) {
      console.warn("[EMAIL SERVICE WARNING] No recipient email found for order status notification. Order ID:", order.id || order.orderNumber);
      return { success: false, error: "No recipient email found" };
    }

    const customerName = name || order.customerName || order.name || order.userName || order.customerInfo?.name || recipientEmail.split("@")[0] || "عميلنا العزيز";

    const normalizedStatus = String(newStatus || order.status || "PENDING").toUpperCase().trim();
    const statusConfig = STATUS_EMAIL_MAP[normalizedStatus] || STATUS_EMAIL_MAP.PENDING;

    const orderNumber = order.orderNumber || order.id || "N/A";

    const safeFormatDate = (rawDate) => {
      if (!rawDate) return new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
      if (typeof rawDate === "string") {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          return parsed.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
        }
        return rawDate;
      }
      if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
        return rawDate.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
      }
      return new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
    };

    const orderDate = safeFormatDate(order.createdAt || order.date);

    const currency = order.currency || "EGP";
    const items = Array.isArray(order.items) ? order.items : [];
    const itemsTableHtml = buildOrderItemsTableHtml(items, currency);

    const subtotal = order.subtotal !== undefined ? Number(order.subtotal).toLocaleString("en-US") : Number(order.total || 0).toLocaleString("en-US");
    const shippingCost = order.shippingCost !== undefined ? Number(order.shippingCost).toLocaleString("en-US") : "0";
    const discount = order.discount ? Number(order.discount).toLocaleString("en-US") : null;
    const totalPrice = Number(order.total || order.totalPrice || 0).toLocaleString("en-US");

    let shippingAddress = "العنوان المسجل بالطلب";
    if (typeof order.customerAddress === "string" && order.customerAddress.trim()) {
      shippingAddress = order.customerAddress.trim();
    } else if (typeof order.address === "string" && order.address.trim()) {
      shippingAddress = order.address.trim();
    } else if (typeof order.shippingAddress === "string" && order.shippingAddress.trim()) {
      shippingAddress = order.shippingAddress.trim();
    } else if (order.shippingDetails?.address) {
      shippingAddress = order.shippingDetails.address;
    }

    const customerPhone = order.customerPhone || order.phone || "غير مسجل";
    const paymentMethod = order.paymentMethodName || order.paymentMethod || "الدفع عند الاستلام";

    const trackingNumber = order.trackingNumber || `NT-${orderNumber}`;

    const subject = statusConfig.subject.replace("{{orderNumber}}", orderNumber);

    const html = renderTemplate(statusConfig.template, {
      emailTitle: subject,
      customerName,
      orderNumber,
      orderDate,
      itemsTableHtml,
      subtotal,
      shippingCost,
      discount,
      totalPrice,
      currency,
      shippingAddress,
      customerPhone,
      paymentMethod,
      trackingNumber,
      cancelReason: order.cancelReason || ""
    });

    return await sendMailWithRetry(
      {
        from: getFromAddress(),
        to: sanitizeHeader(recipientEmail),
        subject,
        html
      },
      { template: statusConfig.template, orderNumber }
    );
  }

  /**
   * 6. Send Generic Notification Email
   */
  static async sendGenericEmail({ to, subject, title, messageHtml, actionText, actionUrl, badgeText }) {
    if (!to) throw new Error("Recipient email 'to' is required.");

    const html = renderTemplate("generic-notification", {
      emailTitle: subject || "إشعار من Nile Techno",
      title: title || subject || "إشعار جديد",
      messageHtml: messageHtml || "",
      actionText: actionText || "",
      actionUrl: actionUrl || "",
      badgeText: badgeText || "📢 إشعار هام"
    });

    return await sendMailWithRetry(
      {
        from: getFromAddress(),
        to: sanitizeHeader(to),
        subject: subject || "إشعار من Nile Techno",
        html
      },
      { template: "generic-notification", orderNumber: "N/A" }
    );
  }
}

export default EmailService;
