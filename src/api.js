// Pure API Layer with Clean Enterprise Entity Mapping Contract System
// Fully decoupled API contract where all frontend fields map to clean API keys.

import {
  createOrderInFirestore,
  getAllOrdersFromFirestore,
} from "./lib/firebaseService";

/**
 * CENTRAL API CONTRACT & ENTITY MAPPING
 * If your API URL or response property names change, update ONLY this configuration object.
 */
export const API_CONTRACT = {
  // Configurable API Endpoints
  ENDPOINTS: {
    BASE_URL: "https://fakestoreapi.com",
    PRODUCTS: "https://fakestoreapi.com/products",
    CATEGORIES: "https://fakestoreapi.com/products/categories",
  },

  // Product Entity Field Mapping (Frontend Entity Key -> API Response Property Key/Path)
  PRODUCT_ENTITY_MAP: {
    id: "id",
    title: "title",
    price: "price",
    description: "description",
    category: "category",
    image: "image",
    stock: "stock",
    ratingScore: "rating.rate",
    reviewsCount: "rating.count",
    discountPrice: "discount_price",
    featured: "featured"
  },

  // Category Entity Field Mapping
  CATEGORY_ENTITY_MAP: {
    id: "id",
    name: "name",
  }
};

// No local cache — all data is fetched fresh from the API on every call

/**
 * Utility to extract nested values using string paths (e.g. "rating.rate")
 */
function getValueByPath(obj, pathStr) {
  if (!obj || !pathStr) return undefined;
  return pathStr.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
}

/**
 * Maps raw API product JSON strictly according to API_CONTRACT.PRODUCT_ENTITY_MAP
 */
function mapProductToEntity(raw) {
  if (!raw) return null;

  const map = API_CONTRACT.PRODUCT_ENTITY_MAP;

  const id = String(getValueByPath(raw, map.id) ?? "");
  const title = String(getValueByPath(raw, map.title) ?? "");
  const description = String(getValueByPath(raw, map.description) ?? "");
  const category = String(getValueByPath(raw, map.category) ?? "");
  const image = String(getValueByPath(raw, map.image) ?? "");
  const price = Number(getValueByPath(raw, map.price)) || 0;
  
  // Clean stock extraction using entity map
  const rawStock = getValueByPath(raw, map.stock);
  const stock = rawStock !== undefined && rawStock !== null ? Number(rawStock) : 0;
  
  const rating = Number(getValueByPath(raw, map.ratingScore)) || 0;
  const reviewsCount = Number(getValueByPath(raw, map.reviewsCount)) || 0;
  
  const rawDiscount = getValueByPath(raw, map.discountPrice);
  const discountPrice = rawDiscount !== undefined && rawDiscount !== null ? Number(rawDiscount) : undefined;
  const isFeatured = getValueByPath(raw, map.featured);

  return {
    id,
    title,
    name: title,
    description,
    category,
    categoryRaw: category,
    image,
    price,
    originalPrice: price,
    discount_price: discountPrice,
    rating,
    reviewsCount,
    reviews_count: reviewsCount,
    stock,
    featured: Boolean(isFeatured),
  };
}

export function invalidateProductsCache() {
  // No-op: cache disabled — data is always fetched fresh from API
}

/**
 * Fetches all products from configured API endpoint — always live, no cache
 */
async function fetchAllProducts() {
  try {
    const res = await fetch(API_CONTRACT.ENDPOINTS.PRODUCTS);
    if (res.ok) {
      const rawList = await res.json();
      return (rawList || []).map(mapProductToEntity).filter(Boolean);
    }
  } catch (err) {
    console.warn("API products fetch failed:", err);
  }
  return [];
}

/**
 * Arabic text normalization for search matching
 */
export function normalizeArabicText(text) {
  if (!text) return "";
  let str = String(text).trim().toLowerCase();
  str = str.replace(/[أإآ]/g, "ا");
  str = str.replace(/ة/g, "ه");
  str = str.replace(/[ىي]/g, "ي");
  str = str.replace(/[\u064B-\u0652]/g, "");
  str = str.replace(/[\s\-_]+/g, " ");
  return str;
}

async function getProductsFiltered(params = {}) {
  let list = await fetchAllProducts();

  if (params.category && params.category !== "الكل") {
    list = list.filter(
      (p) => p.category === params.category || p.categoryRaw === params.category
    );
  }
  if (params.q && params.q.trim()) {
    const rawQuery = params.q.trim();
    const normalizedQuery = normalizeArabicText(rawQuery);
    const queryWords = normalizedQuery.split(" ").filter(Boolean);

    list = list.filter((p) => {
      const searchableStr = normalizeArabicText(
        `${p.title || ""} ${p.description || ""} ${p.category || ""}`
      );
      return queryWords.every((word) => searchableStr.includes(word));
    });
  }
  if (params.filter === "offers") {
    list = list.filter((p) => p.discount_price && p.discount_price < p.price);
  } else if (params.filter === "featured") {
    list = list.filter((p) => p.featured === true);
  } else if (params.filter === "new") {
    list = [...list].sort((a, b) => Number(b.id) - Number(a.id));
  }
  return list;
}

/**
 * Fetches categories list from API endpoint
 */
async function getCategoriesList() {
  try {
    const res = await fetch(API_CONTRACT.ENDPOINTS.CATEGORIES);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rawList = await res.json();
    
    return (rawList || []).map((catItem, idx) => {
      if (typeof catItem === "string") {
        return { id: String(idx + 1), name: catItem, rawName: catItem };
      }
      const catMap = API_CONTRACT.CATEGORY_ENTITY_MAP;
      const id = String(getValueByPath(catItem, catMap.id) || idx + 1);
      const name = String(getValueByPath(catItem, catMap.name) || "");
      return { id, name, rawName: name };
    });
  } catch (err) {
    console.warn("API categories fetch failed:", err);
    return [];
  }
}

export const shopApi = {
  /** لا يوجد كاش — دائماً يجلب من الـ API مباشرةً */
  invalidateCache: invalidateProductsCache,

  /** جلب المنتجات مع الفلترة الديناميكية */
  getProducts: (params = {}) => getProductsFiltered(params),

  /** جلب كل المنتجات للأدمن — نفس المصدر بدون استثناء */
  getAllProductsForAdmin: (params = {}) => getProductsFiltered(params),

  /** جلب الطلبات من Firestore */
  getOrders: async () => {
    try {
      return await getAllOrdersFromFirestore();
    } catch {
      return [];
    }
  },

  /** إنشاء طلب جديد في Firestore */
  placeOrder: async (order) => {
    try {
      const created = await createOrderInFirestore(order);
      return { success: true, order: created };
    } catch (err) {
      console.error("placeOrder failed:", err);
      return { success: false, error: err.message };
    }
  },

  /** جلب التصنيفات من الـ API مباشرةً */
  getCategories: () => getCategoriesList(),

  /** طرق الدفع الثابتة (كاش عند الاستلام) */
  getPaymentMethods: async () => [
    {
      id: "cod",
      name: "الدفع عند الاستلام كاش",
      description: "ادفع نقداً عند استلام طلبك من مندوب التوصيل بعد فحصه بالكامل."
    }
  ],

  getShippingMethods: async () => [],
  getShippingLocations: async () => [],

  /** إعدادات المتجر العامة من الـ API */
  getPublicStoreConfig: async () => ({
    storeName: "NileTechno Store",
    storeTitle: "متجر NileTechno الإلكتروني",
    promoTagline: "تسوق بأمان مع NileTechno",
  }),
};

export async function apiRequest() {
  return null;
}
