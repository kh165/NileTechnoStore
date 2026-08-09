const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000"
];

const envAllowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const allowedOriginsSet = new Set([...defaultAllowedOrigins, ...envAllowedOrigins]);

export function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  if (origin) {
    if (
      allowedOriginsSet.has(origin) ||
      origin.endsWith(".run.app") ||
      origin.endsWith(".google.com") ||
      origin === "null"
    ) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", defaultAllowedOrigins[0]);
    }
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept, X-Requested-With");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
}

export function isSsrfUnsafe(targetUrl) {
  try {
    const parsedUrl = new URL(targetUrl);
    const hostname = parsedUrl.hostname.toLowerCase();

    const localHosts = ["localhost", "127.0.0.1", "0.0.0.0"];
    const privateRanges = [
      "10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.",
      "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.",
      "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31."
    ];

    if (localHosts.includes(hostname)) {
      return true;
    }
    return privateRanges.some(prefix => hostname.startsWith(prefix));
  } catch (err) {
    throw new Error("رابط الـ API الخارجي غير صالح");
  }
}

export async function proxyRequest(req, res, targetUrl) {
  try {
    if (isSsrfUnsafe(targetUrl)) {
      return res.status(403).json({ error: "غير مسموح بالوصول لعناوين الشبكة الداخلية (SSRF Protection)" });
    }
  } catch (err) {
    return res.status(400).json({ error: err.message || "رابط الـ API الخارجي غير صالح" });
  }

  const cleanTargetUrl = targetUrl.replace(/\/$/, "");
  const destUrl = `${cleanTargetUrl}${req.originalUrl}`;

  try {
    const headers = {};
    if (req.headers["content-type"]) headers["content-type"] = req.headers["content-type"];
    if (req.headers["accept"]) headers["accept"] = req.headers["accept"];
    if (req.headers["accept-language"]) headers["accept-language"] = req.headers["accept-language"];
    if (req.headers["authorization"]) headers["authorization"] = req.headers["authorization"];

    const options = {
      method: req.method,
      headers
    };

    if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
      options.body = JSON.stringify(req.body);
    }

    const response = await fetch(destUrl, options);
    const contentType = response.headers.get("content-type");

    response.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });

    res.status(response.status);

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      res.json(data);
    } else {
      const text = await response.text();
      res.send(text);
    }
  } catch (error) {
    console.error("Proxy error connecting to external API:", error);
    res.status(502).json({
      error: "فشل الاتصال برابط الـ API الخارجي",
      details: error.message
    });
  }
}
