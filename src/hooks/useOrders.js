import { useState, useEffect } from "react";
import { getUserOrdersFromFirestore } from "../lib/firebaseService";
import { auth } from "../lib/firebase";

export function useOrders(currentUser) {
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const fetchOrders = async () => {
    if (!currentUser?.uid) {
      setOrders([]);
      return;
    }
    setIsLoadingOrders(true);
    try {
      const userOrders = await getUserOrdersFromFirestore(currentUser.uid);
      setOrders(userOrders || []);
    } catch (err) {
      console.error("Error fetching user orders:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentUser?.uid]);

  const updateOrderStatus = async (orderId, newStatus, cancelReason = "") => {
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : "";
      const res = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ orderId, newStatus, cancelReason })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "فشل تحديث حالة الطلب");
      }

      await fetchOrders();
      return { success: true };
    } catch (err) {
      console.error("Failed to update order status:", err);
      return { success: false, error: err.message };
    }
  };

  return {
    orders,
    setOrders,
    isLoadingOrders,
    fetchOrders,
    updateOrderStatus
  };
}
