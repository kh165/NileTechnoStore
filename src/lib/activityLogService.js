// Admin Activity Log Service
// Stores admin activities in Firestore for security auditing

import { saveActivityLogToFirestore, getActivityLogsFromFirestore, clearActivityLogsFromFirestore } from "./firebaseService";

export const activityLogService = {
  async getLogs() {
    try {
      const logs = await getActivityLogsFromFirestore();
      return Array.isArray(logs) ? logs : [];
    } catch {
      return [];
    }
  },

  logAction(adminEmail, actionType, details) {
    try {
      const newEntry = {
        id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
        adminEmail: adminEmail || "Admin",
        actionType, // e.g. "ORDER_STATUS_CHANGE", "USER_BLOCK", etc.
        details,
        timestamp: new Date().toISOString()
      };
      
      // Save directly to Firestore
      saveActivityLogToFirestore(newEntry).catch(err => console.error("Firestore log error:", err));

      // Dispatch custom event for real-time reactivity in admin panel
      window.dispatchEvent(new Event("admin_log_updated"));
      return newEntry;
    } catch (e) {
      console.error("Error logging admin action:", e);
    }
  },

  async clearLogs() {
    try {
      await clearActivityLogsFromFirestore();
      window.dispatchEvent(new Event("admin_log_updated"));
      return true;
    } catch (e) {
      console.error("Error clearing logs:", e);
      return false;
    }
  }
};


