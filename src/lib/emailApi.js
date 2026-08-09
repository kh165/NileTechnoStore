import { auth } from "./firebase";

/**
 * Get dynamic API URL supporting VITE_API_BASE_URL or relative fallbacks
 */
export function getApiUrl(endpoint) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  if (baseUrl) {
    baseUrl = baseUrl.trim().replace(/\/+$/, '');
    if (baseUrl.includes('fakestoreapi.com')) {
      return cleanEndpoint;
    }
    if (baseUrl.endsWith('/api') && cleanEndpoint.startsWith('/api')) {
      return `${baseUrl}${cleanEndpoint.substring(4)}`;
    }
    return `${baseUrl}${cleanEndpoint}`;
  }
  return cleanEndpoint;
}

/**
 * Helper to safely parse JSON response or extract HTML error message
 */
async function safeJsonResponse(response) {
  try {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await response.json();
    }
    const text = await response.text();
    return {
      success: false,
      error: `استجابة غير متوقعة من السيرفر (${response.status}): ${text.substring(0, 120)}`
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Client-Side API Helper for Centralized Email & Order Services
 */

export const emailApi = {
  /**
   * Test SMTP Connection Status
   */
  async testSmtpConnection() {
    try {
      const response = await fetch(getApiUrl("/api/email/test"));
      return await safeJsonResponse(response);
    } catch (err) {
      console.error("[EMAIL API] testSmtpConnection failed:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Send Welcome Email on user registration
   */
  async sendWelcomeEmail(email, name) {
    try {
      const response = await fetch(getApiUrl("/api/email/welcome"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name })
      });
      return await safeJsonResponse(response);
    } catch (err) {
      console.error("[EMAIL API] sendWelcomeEmail failed:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Send Email Verification
   */
  async sendVerificationEmail(email, name, verificationLink) {
    try {
      const response = await fetch(getApiUrl("/api/email/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, verificationLink })
      });
      return await safeJsonResponse(response);
    } catch (err) {
      console.error("[EMAIL API] sendVerificationEmail failed:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Send Password Reset Email
   */
  async sendPasswordResetEmail(email, name, resetLink) {
    try {
      const response = await fetch(getApiUrl("/api/email/password-reset"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, resetLink })
      });
      return await safeJsonResponse(response);
    } catch (err) {
      console.error("[EMAIL API] sendPasswordResetEmail failed:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Send Login Security Notification
   */
  async sendLoginNotification(email, name, loginDetails = {}) {
    try {
      const response = await fetch(getApiUrl("/api/email/login-notification"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, ...loginDetails })
      });
      return await safeJsonResponse(response);
    } catch (err) {
      console.error("[EMAIL API] sendLoginNotification failed:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Send Order Status Email
   */
  async sendOrderStatusEmail(order, newStatus, email, name) {
    try {
      const response = await fetch(getApiUrl("/api/email/order-status"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order, newStatus, email, name })
      });
      return await safeJsonResponse(response);
    } catch (err) {
      console.error("[EMAIL API] sendOrderStatusEmail failed:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Send Generic Email
   */
  async sendGenericEmail(payload) {
    try {
      const response = await fetch(getApiUrl("/api/email/generic"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      return await safeJsonResponse(response);
    } catch (err) {
      console.error("[EMAIL API] sendGenericEmail failed:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Centralized Single Order Status Update via Backend (Protected)
   */
  async updateOrderStatus(orderId, newStatus, cancelReason = "", orderData = null) {
    try {
      const token = await auth?.currentUser?.getIdToken();
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const payload = { orderId, newStatus, cancelReason };
      if (orderData) {
        payload.order = orderData;
        payload.email = orderData.customerEmail || orderData.email || orderData.userEmail || orderData.shippingDetails?.email;
        payload.name = orderData.customerName || orderData.name;
      }

      const response = await fetch(getApiUrl("/api/orders/update-status"), {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      return await safeJsonResponse(response);
    } catch (err) {
      console.error("[ORDER API] updateOrderStatus failed:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Centralized Bulk Order Status Update via Backend (Protected)
   */
  async bulkUpdateOrderStatus(orderIds, newStatus, cancelReason = "", ordersMap = null) {
    try {
      const token = await auth?.currentUser?.getIdToken();
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const payload = { orderIds, newStatus, cancelReason };
      if (ordersMap) {
        payload.ordersMap = ordersMap;
      }

      const response = await fetch(getApiUrl("/api/orders/bulk-update-status"), {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      return await safeJsonResponse(response);
    } catch (err) {
      console.error("[ORDER API] bulkUpdateOrderStatus failed:", err);
      return { success: false, error: err.message };
    }
  }
};

export default emailApi;
