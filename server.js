import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

import { corsMiddleware, proxyRequest } from "./server/middleware/corsMiddleware.js";
import stockRoutes from "./server/routes/stockRoutes.js";
import reviewRoutes from "./server/routes/reviewRoutes.js";
import analyticsRoutes from "./server/routes/analyticsRoutes.js";
import emailRoutes from "./server/routes/emailRoutes.js";
import orderRoutes from "./server/routes/orderRoutes.js";
import aiRoutes from "./server/routes/aiRoutes.js";
import { createOrderLocalFallbackHandler } from "./server/controllers/orderController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);
const PORT = 3000;

app.use(express.json({ limit: "5mb" }));
app.use(corsMiddleware);

const INTERNAL_LOCAL_ROUTES = [
  "/api/custom-reviews",
  "/api/product-stock",
  "/api/analytics",
  "/api/ai",
  "/api/auth",
  "/api/health",
  "/api/email",
  "/api/orders"
];

function isInternalRoute(req) {
  if (!req) return false;
  const fullPath = (req.originalUrl || req.url || "").split("?")[0];
  const subPath = req.path || "";

  return INTERNAL_LOCAL_ROUTES.some(route => {
    return (
      fullPath === route ||
      fullPath.startsWith(route + "/") ||
      subPath === route ||
      subPath.startsWith(route + "/") ||
      ("/api" + subPath) === route ||
      ("/api" + subPath).startsWith(route + "/")
    );
  });
}

// Global Early API Proxy Route for catalog endpoints
app.all("/api/*", async (req, res, next) => {
  if (isInternalRoute(req)) {
    return next();
  }

  const targetUrl = process.env.VITE_API_BASE_URL || process.env.API_URL;
  if (!targetUrl) {
    return next();
  }
  return proxyRequest(req, res, targetUrl);
});

// Register Domain Feature Routes
app.use("/api", stockRoutes);
app.use("/api", reviewRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", emailRoutes);
app.use("/api", orderRoutes);
app.use("/api", aiRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// Local API fallback routes when no external API base URL is configured
app.all("/api/*", async (req, res) => {
  const targetUrl = process.env.VITE_API_BASE_URL || process.env.API_URL;

  if (!targetUrl) {
    const urlPath = req.path;

    if (urlPath === "/api/products" || urlPath === "/api/categories") {
      return res.json([]);
    }

    if (urlPath === "/api/payment-methods") {
      return res.json([
        { id: "cod", name: "الدفع عند الاستلام كاش", description: "ادفع نقداً عند استلام طلبك من مندوب التوصيل بعد فحصه بالكامل." }
      ]);
    }

    if (urlPath === "/api/shipping-methods") {
      return res.json([]);
    }

    if (urlPath === "/api/admin/config") {
      return res.json({
        storeName: "المتجر الإلكتروني",
        storeTitle: "متجرك الإلكتروني",
        promoTagline: ""
      });
    }

    if (urlPath === "/api/orders") {
      return createOrderLocalFallbackHandler(req, res);
    }

    return res.json({
      success: true,
      message: "API Proxy Active."
    });
  }

  return proxyRequest(req, res, targetUrl);
});

// Server bootstrap with Vite development middleware or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER ENGINE] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
