import { getGenAI } from "../config/gemini.js";

function normalizeArabicText(str = "") {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[^\w\s\u0600-\u06FF]/g, " ")
    .replace(/(.)\1{2,}/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

const productIndexCache = new Map();
const searchQueryCache = new Map();
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;

function levenshteinDistance(a, b, maxDist = Infinity) {
  if (!a || !b) return Math.abs((a || "").length - (b || "").length);
  if (a === b) return 0;

  const lenA = a.length;
  const lenB = b.length;
  if (Math.abs(lenA - lenB) > maxDist) return maxDist + 1;

  let prevRow = new Array(lenB + 1);
  let currRow = new Array(lenB + 1);

  for (let j = 0; j <= lenB; j++) prevRow[j] = j;

  for (let i = 1; i <= lenA; i++) {
    currRow[0] = i;
    let minInRow = currRow[0];
    const charA = a.charAt(i - 1);

    for (let j = 1; j <= lenB; j++) {
      const cost = charA === b.charAt(j - 1) ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1,
        prevRow[j] + 1,
        prevRow[j - 1] + cost
      );
      if (currRow[j] < minInRow) minInRow = currRow[j];
    }

    if (minInRow > maxDist) return maxDist + 1;

    for (let j = 0; j <= lenB; j++) prevRow[j] = currRow[j];
  }

  return prevRow[lenB];
}

function isTokenMatch(token, target, targetWords) {
  if (!token || !target) return false;
  if (target.includes(token) || token.includes(target)) return true;

  const words = targetWords || target.split(/\s+/).filter(Boolean);

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!w) continue;

    if (w.includes(token) || token.includes(w)) return true;

    if (token.length >= 3 && w.length >= 3) {
      const stemLen = Math.min(token.length, w.length, 4);
      if (stemLen >= 3 && token.slice(0, stemLen) === w.slice(0, stemLen)) {
        return true;
      }
    }

    if (token.length >= 3 && w.length >= 3) {
      const maxDist = token.length >= 5 ? 2 : 1;
      if (Math.abs(w.length - token.length) <= maxDist) {
        if (levenshteinDistance(token, w, maxDist) <= maxDist) {
          return true;
        }
      }
    }
  }

  return false;
}

const RAW_SYNONYM_DICTIONARY = {
  "موبايل": ["هاتف", "جوال", "تليفون", "فون", "موبايلات", "هواتف", "جوالات", "mobile", "phone", "phones"],
  "هاتف": ["موبايل", "جوال", "تليفون", "فون", "موبايلات", "هواتف", "جوالات", "mobile", "phone"],
  "جوال": ["موبايل", "هاتف", "تليفون", "فون", "mobile", "phone"],
  "mobile": ["موبايل", "هاتف", "جوال", "تليفون", "phone"],
  "phone": ["موبايل", "هاتف", "جوال", "تليفون", "mobile"],
  "سماعة": ["سماعات", "ايربودز", "سماعه", "headphone", "headphones", "earbuds", "airpods"],
  "سماعات": ["سماعة", "سماعه", "ايربودز", "headphone", "headphones", "earbuds", "airpods"],
  "headphone": ["سماعة", "سماعات", "ايربودز", "earbuds", "airpods"],
  "earbuds": ["سماعة", "سماعات", "ايربودز", "headphone", "airpods"],
  "airpods": ["سماعة", "سماعات", "ايربودز", "earbuds"],
  "شاحن": ["شواحن", "سلك", "كابل", "وصلة", "charger", "fast charger", "cable"],
  "شواحن": ["شاحن", "charger", "cables"],
  "charger": ["شاحن", "شواحن", "cable"],
  "باور بنك": ["باوربنك", "بطارية متنقلة", "powerbank", "power bank"],
  "باوربنك": ["باور بنك", "بطارية متنقلة", "powerbank", "power bank"],
  "powerbank": ["باور بنك", "باوربنك", "بطارية متنقلة", "power bank"],
  "لابتوب": ["لاب", "كمبيوتر", "حاسوب", "نوت بوك", "laptop", "notebook"],
  "لاب": ["لابتوب", "كمبيوتر", "حاسوب", "laptop"],
  "laptop": ["لابتوب", "لاب", "كمبيوتر", "حاسوب", "notebook"],
  "جراب": ["كفر", "حافظة", "حماية", "غلاف", "case", "cover"],
  "كفر": ["جراب", "حافظة", "حماية", "غلاف", "case", "cover"],
  "ساعة": ["ساعات", "ساعه", "ذكية", "باند", "watch", "smartwatch", "band"],
  "ساعات": ["ساعة", "ساعه", "ذكية", "watch", "smartwatch"],
  "يو اس بي": ["usb"],
  "usb": ["يو اس بي"]
};

const NORMALIZED_SYNONYM_MAP = new Map();
Object.entries(RAW_SYNONYM_DICTIONARY).forEach(([key, values]) => {
  const normKey = normalizeArabicText(key);
  const normValues = values.map(v => normalizeArabicText(v)).filter(Boolean);
  const existing = NORMALIZED_SYNONYM_MAP.get(normKey) || [];
  NORMALIZED_SYNONYM_MAP.set(normKey, Array.from(new Set([...existing, ...normValues])));
});

function expandTokensWithSynonyms(tokens) {
  const expanded = new Set(tokens);
  tokens.forEach(tok => {
    const syns = NORMALIZED_SYNONYM_MAP.get(tok);
    if (syns) {
      syns.forEach(s => expanded.add(s));
    }
  });
  return Array.from(expanded);
}

function getOrBuildProductSearchIndex(product) {
  const cacheKey = String(product.id || product._id || JSON.stringify(product).length);
  const cached = productIndexCache.get(cacheKey);

  if (cached && cached.productRef === product) {
    return cached;
  }

  const titleNorm = normalizeArabicText(product.title || product.name || "");
  const descNorm = normalizeArabicText(product.description || "");
  const categoryNorm = normalizeArabicText(product.category || "");
  const brandNorm = normalizeArabicText(product.brand || "");
  const specsNorm = normalizeArabicText(product.attributes || product.specs || "");
  const tagsNorm = normalizeArabicText(product.tags || product.keywords || "");

  const indexObj = {
    id: String(product.id),
    titleNorm,
    titleWords: titleNorm.split(/\s+/).filter(Boolean),
    descNorm,
    descWords: descNorm.split(/\s+/).filter(Boolean),
    categoryNorm,
    categoryWords: categoryNorm.split(/\s+/).filter(Boolean),
    brandNorm,
    brandWords: brandNorm.split(/\s+/).filter(Boolean),
    specsNorm,
    specsWords: specsNorm.split(/\s+/).filter(Boolean),
    tagsNorm,
    tagsWords: tagsNorm.split(/\s+/).filter(Boolean),
    productRef: product,
    product
  };

  productIndexCache.set(cacheKey, indexObj);
  return indexObj;
}

function getTopSearchCandidates(query, products = [], maxCandidates = 20) {
  if (!products || products.length === 0) return [];

  const rawQuery = (query || "").trim();
  const normQuery = normalizeArabicText(rawQuery);
  if (!normQuery) return [];

  const queryTokens = normQuery.split(/\s+/).filter(w => w.length > 1);
  if (queryTokens.length === 0) return [];

  const expandedTokens = expandTokensWithSynonyms(queryTokens);
  const indexedProducts = products.map(getOrBuildProductSearchIndex);

  const scored = indexedProducts.map(idx => {
    let score = 0;
    let matchedTokenCount = 0;

    if (idx.titleNorm.includes(normQuery)) score += 250;
    if (idx.tagsNorm.includes(normQuery)) score += 200;
    if (idx.descNorm.includes(normQuery)) score += 120;
    if (idx.specsNorm.includes(normQuery)) score += 100;
    if (idx.brandNorm.includes(normQuery)) score += 80;
    if (idx.categoryNorm.includes(normQuery)) score += 60;

    expandedTokens.forEach(token => {
      let tokenMatched = false;

      if (isTokenMatch(token, idx.titleNorm, idx.titleWords)) { score += 80; tokenMatched = true; }
      if (isTokenMatch(token, idx.tagsNorm, idx.tagsWords)) { score += 70; tokenMatched = true; }
      if (isTokenMatch(token, idx.descNorm, idx.descWords)) { score += 50; tokenMatched = true; }
      if (isTokenMatch(token, idx.specsNorm, idx.specsWords)) { score += 40; tokenMatched = true; }
      if (isTokenMatch(token, idx.brandNorm, idx.brandWords)) { score += 30; tokenMatched = true; }
      if (isTokenMatch(token, idx.categoryNorm, idx.categoryWords)) { score += 20; tokenMatched = true; }

      if (tokenMatched) matchedTokenCount++;
    });

    if (matchedTokenCount > 1) {
      score += matchedTokenCount * 40;
    }

    return { product: idx.product, score };
  });

  const validMatches = scored.filter(item => item.score > 0);
  if (validMatches.length === 0) return [];

  validMatches.sort((a, b) => b.score - a.score);
  return validMatches.slice(0, maxCandidates).map(item => item.product);
}

function fallbackSmartSearch(query, products = []) {
  const candidates = getTopSearchCandidates(query, products, 4);

  if (candidates.length === 0) {
    return {
      aiAdvice: "لا توجد نتائج مطابقة لطلبك.",
      recommendations: []
    };
  }

  const recommendations = candidates.map(p => ({
    productId: String(p.id),
    matchReason: "منتج مطابق لمواصفات وكلمات البحث",
    confidenceScore: 0.9
  }));

  return {
    aiAdvice: `بناءً على بحثك عن ("${(query || "").trim()}"):`,
    recommendations
  };
}

export async function smartSearchHandler(req, res) {
  try {
    const { query, products } = req.body;
    if (!query || typeof query !== "string" || !query.trim()) {
      return res.status(400).json({ error: "استعلام البحث مطلوب" });
    }

    const availableProducts = Array.isArray(products) && products.length > 0 ? products : [];

    if (availableProducts.length === 0) {
      return res.json({
        aiAdvice: "الكتالوج خالٍ حالياً من المنتجات.",
        recommendations: []
      });
    }

    const normQuery = normalizeArabicText(query);
    const cacheKey = `${normQuery}_${availableProducts.length}`;
    const cachedResponse = searchQueryCache.get(cacheKey);
    const now = Date.now();

    if (cachedResponse && (now - cachedResponse.timestamp < SEARCH_CACHE_TTL_MS)) {
      return res.json(cachedResponse.data);
    }

    const topCandidates = getTopSearchCandidates(query, availableProducts, 20);

    if (topCandidates.length === 0) {
      const emptyResult = {
        aiAdvice: "لا توجد نتائج مطابقة لطلبك.",
        recommendations: []
      };
      searchQueryCache.set(cacheKey, { data: emptyResult, timestamp: now });
      return res.json(emptyResult);
    }

    const ai = getGenAI();
    if (!ai) {
      const fallbackRes = fallbackSmartSearch(query, availableProducts);
      searchQueryCache.set(cacheKey, { data: fallbackRes, timestamp: now });
      return res.json(fallbackRes);
    }

    const catalogContext = topCandidates.map(p =>
      JSON.stringify({
        id: String(p.id),
        title: p.title || p.name || "",
        category: p.category || "",
        brand: p.brand || "",
        price: p.discount_price || p.price,
        description: (p.description || "").slice(0, 200),
        specs: p.attributes || p.specs || "",
        tags: p.tags || p.keywords || ""
      })
    ).join("\n");

    const promptText = `أنت محرك البحث الذكي لمتجر إلكتروني.
مهمتك الوحيدة هي فهم طلب المستخدم وإعادة ترتيب (Re-Rank) وتصفية النتائج من قائمة المنتجات الـ 20 المرشحة المرفقة فقط.

قواعد العمل (إلزامية ومطلقة):
1. لا تعتمد على أي معرفة خارجية إطلاقاً.
2. لا تخترع منتجات أو فئات أو نتائج غير موجودة في بيانات الـ 20 منتج المرفقة.
3. لا تعرض أي بيانات ثابتة (Static Data) أو أمثلة أو نتائج عشوائية.
4. المصدر الوحيد والأساسي للنتائج هو بيانات المنتجات المرفقة فقط.
5. إذا لم توجد نتيجة مطابقة، أرجع قائمة فارغة (recommendations: []) ورسالة "لا توجد نتائج مطابقة لطلبك".

طلب المستخدم الحالي: "${query.trim()}"

بيانات الـ 20 منتج المرشحة من الـ API:
${catalogContext}

قم بالرد بصيغة JSON فقط بهذا الشكل المباشر:
{
  "aiAdvice": "عبارة بسيطة ومباشرة توضح نتيجة البحث وبدون أي عبارات آلية",
  "recommendations": [
    {
      "productId": "المعرف الدقيق ID للمنتج المطابق",
      "matchReason": "سبب ترشيح قصير ومباشر",
      "confidenceScore": 0.95
    }
  ]
}`;

    const modelsToTry = ["gemini-3.6-flash", "gemini-flash-latest"];
    let responseText = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: promptText,
          config: {
            responseMimeType: "application/json"
          }
        });
        if (response && response.text) {
          responseText = response.text;
          break;
        }
      } catch (modelErr) {
        console.warn(`Model ${modelName} unavailable:`, modelErr.message);
      }
    }

    if (!responseText) {
      return res.json(fallbackSmartSearch(query, products));
    }

    let parsedData = null;
    try {
      const cleanJsonText = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
      parsedData = JSON.parse(cleanJsonText);
    } catch (parseErr) {
      parsedData = fallbackSmartSearch(query, products);
    }

    if (!parsedData || typeof parsedData !== "object") {
      parsedData = fallbackSmartSearch(query, products);
    }

    searchQueryCache.set(cacheKey, { data: parsedData, timestamp: now });
    return res.json(parsedData);
  } catch (err) {
    console.error("Gemini AI Smart Search Error:", err.message);
    return res.json(fallbackSmartSearch(req.body.query || "", req.body.products || []));
  }
}
