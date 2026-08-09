import fs from "fs";
import path from "path";
import crypto from "crypto";
import admin, { getDbAdmin } from "../config/firebaseAdmin.js";
import EmailService from "../email/emailService.js";

const ORDERS_FILE = path.join(process.cwd(), "orders.json");

function getLocalOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const data = fs.readFileSync(ORDERS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading orders.json:", error);
  }
  return [];
}

function saveLocalOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing orders.json:", error);
  }
}

export async function getOrderById(orderId) {
  if (!orderId) return null;
  const db = getDbAdmin();
  if (db) {
    try {
      const orderDoc = await db.collection("orders").doc(orderId).get();
      if (orderDoc.exists) {
        return { id: orderDoc.id, ...orderDoc.data() };
      }
      const querySnapshot = await db.collection("orders").where("id", "==", orderId).limit(1).get();
      if (!querySnapshot.empty) {
        return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
      }
      const queryByNum = await db.collection("orders").where("orderNumber", "==", orderId).limit(1).get();
      if (!queryByNum.empty) {
        return { id: queryByNum.docs[0].id, ...queryByNum.docs[0].data() };
      }
    } catch (err) {
      console.error("Firebase Admin: Error fetching order by ID:", err);
    }
  }

  try {
    const orders = getLocalOrders();
    const found = orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (found) return found;
  } catch (err) {
    console.error("Local storage error fetching order by ID:", err);
  }
  return null;
}

export async function updateOrderStatusHandler(req, res) {
  try {
    const { orderId, newStatus, cancelReason, order: bodyOrder, email: bodyEmail, name: bodyName } = req.body;
    if (!orderId || !newStatus) {
      return res.status(400).json({ error: "orderId و newStatus مطلوبان" });
    }

    let updatedOrder = await getOrderById(orderId);
    if (!updatedOrder) {
      updatedOrder = bodyOrder || { id: orderId, orderNumber: orderId };
    } else if (bodyOrder) {
      updatedOrder = { ...updatedOrder, ...bodyOrder };
    }

    updatedOrder.status = newStatus;
    if (cancelReason) updatedOrder.cancelReason = cancelReason;

    const db = getDbAdmin();
    if (db) {
      try {
        const orderRef = db.collection("orders").doc(updatedOrder.id || orderId);
        const logEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          action: `تغيير حالة الطلب إلى: ${newStatus}`,
          actor: req.user?.email || "مدير النظام",
          type: "STATUS_CHANGE",
          newStatus
        };
        await orderRef.update({
          status: newStatus,
          ...(cancelReason ? { cancelReason } : {}),
          history: admin.firestore.FieldValue.arrayUnion(logEntry)
        });
      } catch (e) {
        console.error("Firestore status update error:", e.message);
      }
    }

    const orders = getLocalOrders();
    const idx = orders.findIndex(o => o.id === orderId || o.orderNumber === orderId);
    if (idx !== -1) {
      orders[idx].status = newStatus;
      if (cancelReason) orders[idx].cancelReason = cancelReason;
      saveLocalOrders(orders);
    }

    let recipientEmail = bodyEmail || updatedOrder.customerEmail || updatedOrder.email || updatedOrder.userEmail || updatedOrder.shippingDetails?.email;
    let recipientName = bodyName || updatedOrder.customerName || updatedOrder.name || updatedOrder.shippingDetails?.name || "العميل";

    if (!recipientEmail && updatedOrder.userId && db) {
      try {
        const userDoc = await db.collection("users").doc(updatedOrder.userId).get();
        if (userDoc.exists) {
          const uData = userDoc.data();
          recipientEmail = uData.email || uData.userEmail;
          if (!recipientName || recipientName === "العميل") {
            recipientName = uData.name || uData.displayName || uData.customerName || "العميل";
          }
        }
      } catch (uErr) {
        console.warn("Error fetching user email in orderController:", uErr.message);
      }
    }

    if (recipientEmail) {
      setImmediate(() => {
        EmailService.sendOrderStatusEmail({
          email: recipientEmail,
          name: recipientName,
          order: updatedOrder,
          newStatus
        }).catch(err => console.error("[AUTO EMAIL ERROR] Status update trigger failed:", err.message));
      });
    }

    res.json({ success: true, order: updatedOrder, emailSent: Boolean(recipientEmail) });
  } catch (err) {
    console.error("Error updating order status:", err);
    res.status(500).json({ error: "خطأ في خادم النظام أثناء تحديث حالة الطلب" });
  }
}

export async function bulkUpdateOrderStatusHandler(req, res) {
  try {
    const { orderIds, newStatus, cancelReason, ordersMap } = req.body;
    if (!Array.isArray(orderIds) || orderIds.length === 0 || !newStatus) {
      return res.status(400).json({ error: "orderIds (مصفوفة) و newStatus مطلوبان" });
    }

    const db = getDbAdmin();
    const updatedOrders = [];

    for (const orderId of orderIds) {
      let orderData = await getOrderById(orderId);
      const passedOrder = ordersMap?.[orderId] || (Array.isArray(ordersMap) ? ordersMap.find(o => o.id === orderId) : null);
      if (!orderData) {
        orderData = passedOrder || { id: orderId, orderNumber: orderId };
      } else if (passedOrder) {
        orderData = { ...orderData, ...passedOrder };
      }

      orderData.status = newStatus;
      if (cancelReason) orderData.cancelReason = cancelReason;

      if (db) {
        try {
          const orderRef = db.collection("orders").doc(orderId);
          const logEntry = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            action: `تحديث جماعي لحالة الطلب إلى: ${newStatus}`,
            actor: req.user?.email || "مدير النظام",
            type: "BULK_STATUS_CHANGE",
            newStatus
          };
          await orderRef.update({
            status: newStatus,
            ...(cancelReason ? { cancelReason } : {}),
            history: admin.firestore.FieldValue.arrayUnion(logEntry)
          });
        } catch (e) {
          console.error(`Firestore bulk status update error for order ${orderId}:`, e.message);
        }
      }

      const orders = getLocalOrders();
      const idx = orders.findIndex(o => o.id === orderId || o.orderNumber === orderId);
      if (idx !== -1) {
        orders[idx].status = newStatus;
        if (cancelReason) orders[idx].cancelReason = cancelReason;
        saveLocalOrders(orders);
      }

      let recipientEmail = orderData.customerEmail || orderData.email || orderData.userEmail || orderData.shippingDetails?.email;
      let recipientName = orderData.customerName || orderData.name || orderData.shippingDetails?.name || "العميل";

      if (!recipientEmail && orderData.userId && db) {
        try {
          const userDoc = await db.collection("users").doc(orderData.userId).get();
          if (userDoc.exists) {
            const uData = userDoc.data();
            recipientEmail = uData.email || uData.userEmail;
            if (!recipientName || recipientName === "العميل") {
              recipientName = uData.name || uData.displayName || uData.customerName || "العميل";
            }
          }
        } catch (uErr) {
          console.warn("Error fetching user in bulk update:", uErr.message);
        }
      }

      if (recipientEmail) {
        setImmediate(() => {
          EmailService.sendOrderStatusEmail({
            email: recipientEmail,
            name: recipientName,
            order: orderData,
            newStatus
          }).catch(err => console.error(`[BULK EMAIL ERROR] Order ${orderId}:`, err.message));
        });
      }

      updatedOrders.push(orderData);
    }

    res.json({ success: true, updatedCount: updatedOrders.length, orders: updatedOrders });
  } catch (err) {
    console.error("Error bulk updating orders status:", err);
    res.status(500).json({ error: "خطأ في الخادم أثناء التحديث الجماعي للطلبات" });
  }
}

export async function createOrderLocalFallbackHandler(req, res) {
  if (req.method === "POST") {
    const orders = getLocalOrders();
    // Cryptographically unique order identifier (No Math.random)
    const uniqueHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    const newOrder = {
      id: "ORD-" + Date.now().toString().slice(-6) + "-" + uniqueHex,
      ...req.body,
      date: new Date().toISOString(),
      status: "PENDING"
    };
    orders.unshift(newOrder);
    saveLocalOrders(orders);
    return res.json({ success: true, order: newOrder });
  }
  return res.json(getLocalOrders());
}
