import { getAuthAdmin, getDbAdmin } from "../config/firebaseAdmin.js";

/**
 * Server-side Zero-Trust Admin Token Verification.
 * Verifies Bearer Token against Firebase Admin SDK and checks admin privileges.
 */
export async function verifyAdminToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "غير مصرح - يلزم توفر رمز المصادقة (Bearer Token)" });
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const authAdmin = getAuthAdmin();
    if (!authAdmin) {
      return res.status(503).json({ error: "خدمة المصادقة عبر Firebase Admin غير متاحة حالياً" });
    }

    const decodedToken = await authAdmin.verifyIdToken(token);
    const mainAdminEmail = (process.env.MAIN_ADMIN_EMAIL || process.env.VITE_MAIN_ADMIN_EMAIL || "").toLowerCase().trim();
    const userEmail = (decodedToken.email || "").toLowerCase().trim();

    if (
      (mainAdminEmail && userEmail === mainAdminEmail) ||
      decodedToken.admin === true ||
      decodedToken.role === "admin" ||
      decodedToken.role === "main_admin"
    ) {
      req.user = decodedToken;
      return next();
    }

    const db = getDbAdmin();
    if (db) {
      const userDoc = await db.collection("users").doc(decodedToken.uid).get();
      if (userDoc.exists) {
        const role = (userDoc.data().role || "").toLowerCase();
        if (role === "admin" || role === "main_admin" || role === "super_admin") {
          req.user = decodedToken;
          return next();
        }
      }
    }

    return res.status(403).json({ error: "غير مصرح - هذا الإجراء يتطلب صلاحيات الأدمن" });
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return res.status(401).json({ error: "رمز المصادقة انتهى أو غير صالح" });
  }
}
