import fs from "fs";
import path from "path";
import { getDbAdmin } from "../config/firebaseAdmin.js";

const STOCKS_FILE = path.join(process.cwd(), "stocks.json");

const INITIAL_STOCKS = {
  "1": 3, "2": 15, "3": 1, "4": 0, "5": 25,
  "6": 2, "7": 22, "8": 18, "9": 4, "10": 15,
  "11": 30, "12": 5, "13": 8, "14": 12, "15": 16,
  "16": 9, "17": 20, "18": 14, "19": 3, "20": 25
};

function getLocalStocks() {
  try {
    if (fs.existsSync(STOCKS_FILE)) {
      const data = fs.readFileSync(STOCKS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading stocks.json:", error);
  }
  try {
    fs.writeFileSync(STOCKS_FILE, JSON.stringify(INITIAL_STOCKS, null, 2), "utf-8");
  } catch (err) {
    console.error("Error seeding stocks:", err);
  }
  return { ...INITIAL_STOCKS };
}

function saveLocalStocks(stocks) {
  try {
    fs.writeFileSync(STOCKS_FILE, JSON.stringify(stocks, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing stocks.json:", error);
  }
}

export async function getStocksFromDb() {
  const db = getDbAdmin();
  if (db) {
    try {
      const docSnap = await db.collection("config").doc("stocks").get();
      if (docSnap.exists) {
        return docSnap.data() || { ...INITIAL_STOCKS };
      }
      await db.collection("config").doc("stocks").set(INITIAL_STOCKS);
      return { ...INITIAL_STOCKS };
    } catch (err) {
      console.error("Firebase Admin: Error fetching stocks:", err);
      return getLocalStocks();
    }
  }
  return getLocalStocks();
}

export async function saveStocksToDb(stocks) {
  const db = getDbAdmin();
  if (db) {
    try {
      await db.collection("config").doc("stocks").set(stocks);
    } catch (err) {
      console.error("Firebase Admin: Error saving stocks:", err);
    }
  }
  saveLocalStocks(stocks);
}

export async function getAllStocks(req, res) {
  try {
    const stocks = await getStocksFromDb() || {};
    res.json(stocks);
  } catch (err) {
    console.error("Error in getAllStocks:", err);
    res.status(500).json({ error: "خطأ في خادم النظام أثناء جلب المخزون" });
  }
}

export async function getStockById(req, res) {
  try {
    const { id } = req.params;
    const stocks = await getStocksFromDb() || {};
    const stock = stocks[id] !== undefined ? Number(stocks[id]) : 25;
    res.json({ productId: id, stock });
  } catch (err) {
    console.error(`Error in getStockById (${req.params.id}):`, err);
    res.status(500).json({ error: "خطأ في خادم النظام أثناء جلب مخزون المنتج" });
  }
}

export async function updateStockById(req, res) {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    if (stock === undefined) {
      return res.status(400).json({ error: "حقل المخزون مطلوب" });
    }
    const stocks = await getStocksFromDb() || {};
    stocks[id] = Math.max(0, Number(stock));
    await saveStocksToDb(stocks);
    res.json({ success: true, productId: id, stock: stocks[id] });
  } catch (err) {
    console.error(`Error in updateStockById (${req.params.id}):`, err);
    res.status(500).json({ error: "خطأ في خادم النظام أثناء تحديث المخزون" });
  }
}

export async function decrementStock(req, res) {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "قائمة المنتجات (items) مطلوبة" });
    }
    const stocks = await getStocksFromDb() || {};
    items.forEach(item => {
      const pId = String(item.productId);
      const qty = Number(item.quantity) || 1;
      const current = stocks[pId] !== undefined ? Number(stocks[pId]) : 25;
      stocks[pId] = Math.max(0, current - qty);
    });
    await saveStocksToDb(stocks);
    res.json({ success: true, stocks });
  } catch (err) {
    console.error("Error in decrementStock:", err);
    res.status(500).json({ error: "خطأ في خادم النظام أثناء خصم الكميات" });
  }
}
