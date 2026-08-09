/**
 * NileTechno Store - Notification System Service
 * Manages in-memory notifications for order completions and status changes.
 */

const NOTIF_EVENT_NAME = "niletechno_notifications_updated";

const notifMemoryStore = {};
const statusCacheMemoryStore = {};

const getStorageKey = (userId) => {
  return userId || "guest";
};

export const notificationService = {
  /**
   * Get all notifications for the given user ID
   */
  getNotifications(userId) {
    const key = getStorageKey(userId);
    return notifMemoryStore[key] || [];
  },

  /**
   * Save notifications and trigger update event
   */
  saveNotifications(userId, notifications) {
    const key = getStorageKey(userId);
    notifMemoryStore[key] = notifications;
    window.dispatchEvent(new CustomEvent(NOTIF_EVENT_NAME, { detail: { userId } }));
  },

  /**
   * Add a new notification
   */
  addNotification(userId, { type = "ORDER_PLACED", title, message, orderId = null, status = null }) {
    if (!title || !message) return;

    const list = this.getNotifications(userId);
    
    // Prevent exact duplicates created within 2 seconds
    const isDuplicate = list.some(item => 
      item.type === type && 
      item.orderId === orderId && 
      item.status === status &&
      (Date.now() - new Date(item.createdAt).getTime()) < 3000
    );

    if (isDuplicate) return;

    const newNotification = {
      id: "notif_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      type, // "ORDER_PLACED" | "ORDER_STATUS_UPDATED" | "PROMO" | "SYSTEM"
      title,
      message,
      orderId,
      status,
      read: false,
      createdAt: new Date().toISOString()
    };

    const updatedList = [newNotification, ...list].slice(0, 50); // Keep last 50
    this.saveNotifications(userId, updatedList);
    return newNotification;
  },

  /**
   * Mark a specific notification as read
   */
  markAsRead(userId, notificationId) {
    const list = this.getNotifications(userId);
    const updated = list.map(item => 
      item.id === notificationId ? { ...item, read: true } : item
    );
    this.saveNotifications(userId, updated);
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead(userId) {
    const list = this.getNotifications(userId);
    const updated = list.map(item => ({ ...item, read: true }));
    this.saveNotifications(userId, updated);
  },

  /**
   * Clear all notifications
   */
  clearAll(userId) {
    this.saveNotifications(userId, []);
  },

  /**
   * Check order list for status changes and auto-generate notifications
   */
  syncOrderStatuses(userId, orders = [], lang = "ar") {
    if (!Array.isArray(orders) || orders.length === 0) return;

    try {
      const cacheKey = userId || "guest";
      const statusMap = statusCacheMemoryStore[cacheKey] || {};

      const updatedMap = { ...statusMap };
      let hasChanges = false;

      orders.forEach(order => {
        if (!order || !order.id) return;
        const currentStatus = (order.status || "PENDING").toUpperCase();
        const previousStatus = statusMap[order.id];

        // If order existed in cache and status changed
        if (previousStatus && previousStatus !== currentStatus) {
          const displayOrderId = order.orderNumber || order.id.substring(0, 8);
          const statusText = getArabicStatusLabel(currentStatus);
          
          this.addNotification(userId, {
            type: "ORDER_STATUS_UPDATED",
            title: lang === "ar" 
              ? `تحديث حالة الطلب #${displayOrderId}`
              : `Order Status Update #${displayOrderId}`,
            message: lang === "ar"
              ? `تغيرت حالة طلبك إلى "${statusText.ar}".`
              : `Your order status changed to "${statusText.en}".`,
            orderId: order.id,
            status: currentStatus
          });
        }

        // Update cache map
        if (statusMap[order.id] !== currentStatus) {
          updatedMap[order.id] = currentStatus;
          hasChanges = true;
        }
      });

      if (hasChanges) {
        statusCacheMemoryStore[cacheKey] = updatedMap;
      }
    } catch (err) {
      console.error("Error syncing order status notifications:", err);
    }
  },

  /**
   * Subscribe to notification updates
   */
  subscribe(callback) {
    const handler = () => callback();
    window.addEventListener(NOTIF_EVENT_NAME, handler);
    return () => window.removeEventListener(NOTIF_EVENT_NAME, handler);
  }
};

export function getArabicStatusLabel(status) {
  const st = (status || "").toUpperCase();
  switch (st) {
    case "PENDING":
    case "PROCESSING":
      return { ar: "قيد المراجعة والتجهيز ⏳", en: "Processing ⏳", bg: "bg-amber-100 text-amber-800" };
    case "SHIPPED":
    case "DISPATCHED":
      return { ar: "تم الشحن وفي الطريق إليك 🚚", en: "Shipped & In Transit 🚚", bg: "bg-blue-100 text-blue-800" };
    case "DELIVERED":
    case "COMPLETED":
      return { ar: "تم التسليم بنجاح 🎉", en: "Delivered Successfully 🎉", bg: "bg-emerald-100 text-emerald-800" };
    case "CANCELED":
    case "CANCELLED":
    case "REJECTED":
      return { ar: "تم إلغاء الطلب ❌", en: "Order Cancelled ❌", bg: "bg-rose-100 text-rose-800" };
    default:
      return { ar: "تحديث جديد 📦", en: "Order Updated 📦", bg: "bg-slate-100 text-slate-800" };
  }
}
