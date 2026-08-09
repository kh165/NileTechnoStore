import fs from "fs";
import path from "path";

const ANALYTICS_FILE = path.join(process.cwd(), "analytics.json");

function getAnalyticsData() {
  try {
    if (fs.existsSync(ANALYTICS_FILE)) {
      const data = fs.readFileSync(ANALYTICS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading analytics.json:", error);
  }
  const defaultAnalytics = { searches: {}, productViews: {} };
  try {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(defaultAnalytics, null, 2), "utf-8");
  } catch (err) {
    console.error("Error initializing analytics:", err);
  }
  return defaultAnalytics;
}

function saveAnalyticsData(data) {
  try {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing analytics.json:", error);
  }
}

export function trackSearchQuery(req, res) {
  const { query } = req.body;
  if (query && typeof query === "string" && query.trim()) {
    const data = getAnalyticsData();
    const term = query.trim().toLowerCase();
    data.searches[term] = (data.searches[term] || 0) + 1;
    saveAnalyticsData(data);
  }
  res.json({ success: true });
}

export function trackProductView(req, res) {
  const { productId } = req.params;
  if (productId) {
    const data = getAnalyticsData();
    data.productViews[productId] = (data.productViews[productId] || 0) + 1;
    saveAnalyticsData(data);
  }
  res.json({ success: true });
}

export function getAnalyticsReport(req, res) {
  const data = getAnalyticsData();
  res.json(data);
}
