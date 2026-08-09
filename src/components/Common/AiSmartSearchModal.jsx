import React, { useState } from "react";
import { Sparkles, Search, X, Loader2, ShoppingCart, Tag, CheckCircle2, RotateCcw, AlertCircle, HelpCircle } from "lucide-react";

export default function AiSmartSearchModal({
  isOpen,
  onClose,
  allProducts = [],
  setSelectedProduct,
  handleAddToCart,
  storeCurrency = "ج.م",
  lang = "ar"
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const normalizeArabicText = (str = "") => {
    if (!str) return "";
    return String(str)
      .toLowerCase()
      .replace(/[\u064B-\u0652]/g, "") // Strip diacritics
      .replace(/\u0640/g, "")          // Strip Tatweel (ـ)
      .replace(/[أإآٱ]/g, "ا")       // Normalize Alef
      .replace(/ة/g, "ه")             // Normalize Teh Marbouta
      .replace(/ى/g, "ي")             // Normalize Alef Maksura
      .replace(/[^\w\s\u0600-\u06FF]/g, " ") // Remove punctuation & special chars
      .replace(/(.)\1{2,}/g, "$1")    // Collapse 3+ repeated chars
      .replace(/\s+/g, " ")           // Collapse spaces
      .trim();
  };

  const levenshteinDistance = (a, b) => {
    if (!a || !b) return Math.abs((a || "").length - (b || "").length);
    if (a === b) return 0;
    const lenA = a.length;
    const lenB = b.length;
    let prevRow = new Array(lenB + 1);
    let currRow = new Array(lenB + 1);
    for (let j = 0; j <= lenB; j++) prevRow[j] = j;

    for (let i = 1; i <= lenA; i++) {
      currRow[0] = i;
      const charA = a.charAt(i - 1);
      for (let j = 1; j <= lenB; j++) {
        const cost = charA === b.charAt(j - 1) ? 0 : 1;
        currRow[j] = Math.min(currRow[j - 1] + 1, prevRow[j] + 1, prevRow[j - 1] + cost);
      }
      for (let j = 0; j <= lenB; j++) prevRow[j] = currRow[j];
    }
    return prevRow[lenB];
  };

  const isTokenMatch = (token, target) => {
    if (!token || !target) return false;
    if (target.includes(token) || token.includes(target)) return true;

    const words = target.split(/\s+/).filter(Boolean);
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (!w) continue;
      if (w.includes(token) || token.includes(w)) return true;

      // Stem / Prefix Matching
      if (token.length >= 3 && w.length >= 3) {
        const stemLen = Math.min(token.length, w.length, 4);
        if (stemLen >= 3 && token.slice(0, stemLen) === w.slice(0, stemLen)) {
          return true;
        }
      }

      // Levenshtein Fuzzy Match
      if (token.length >= 3 && w.length >= 3) {
        const maxDist = token.length >= 5 ? 2 : 1;
        if (Math.abs(w.length - token.length) <= maxDist) {
          if (levenshteinDistance(token, w) <= maxDist) {
            return true;
          }
        }
      }
    }
    return false;
  };

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

  const expandTokensWithSynonyms = (tokens) => {
    const expanded = new Set(tokens);
    tokens.forEach(tok => {
      const syns = NORMALIZED_SYNONYM_MAP.get(tok);
      if (syns) {
        syns.forEach(s => expanded.add(s));
      }
    });
    return Array.from(expanded);
  };

  const handleReset = () => {
    setQuery("");
    setAiResponse(null);
    setError(null);
    setLoading(false);
  };

  const performClientSearch = (searchQuery) => {
    if (!allProducts || allProducts.length === 0) {
      return {
        aiAdvice: "الكتالوج خالٍ حالياً من المنتجات.",
        recommendations: []
      };
    }

    const rawQuery = (searchQuery || "").trim();
    const normQuery = normalizeArabicText(rawQuery);

    if (!normQuery) {
      return {
        aiAdvice: "يرجى كتابة ما تبحث عنه.",
        recommendations: []
      };
    }

    const queryTokens = normQuery.split(/\s+/).filter(w => w.length > 1);
    if (queryTokens.length === 0) {
      return {
        aiAdvice: "لا توجد نتائج مطابقة لطلبك.",
        recommendations: []
      };
    }

    const expandedTokens = expandTokensWithSynonyms(queryTokens);

    const scored = allProducts.map(p => {
      let score = 0;
      let matchedTokenCount = 0;

      const titleNorm = normalizeArabicText(p.title || p.name || "");
      const descNorm = normalizeArabicText(p.description || "");
      const categoryNorm = normalizeArabicText(p.category || "");
      const brandNorm = normalizeArabicText(p.brand || "");
      const specsNorm = normalizeArabicText(p.attributes || p.specs || "");
      const tagsNorm = normalizeArabicText(p.tags || p.keywords || "");

      // Phrase match
      if (titleNorm.includes(normQuery)) score += 250;
      if (tagsNorm.includes(normQuery)) score += 200;
      if (descNorm.includes(normQuery)) score += 120;
      if (specsNorm.includes(normQuery)) score += 100;
      if (brandNorm.includes(normQuery)) score += 80;
      if (categoryNorm.includes(normQuery)) score += 60;

      // Token matching
      expandedTokens.forEach(token => {
        let tokenMatched = false;
        if (isTokenMatch(token, titleNorm)) { score += 80; tokenMatched = true; }
        if (isTokenMatch(token, tagsNorm)) { score += 70; tokenMatched = true; }
        if (isTokenMatch(token, descNorm)) { score += 50; tokenMatched = true; }
        if (isTokenMatch(token, specsNorm)) { score += 40; tokenMatched = true; }
        if (isTokenMatch(token, brandNorm)) { score += 30; tokenMatched = true; }
        if (isTokenMatch(token, categoryNorm)) { score += 20; tokenMatched = true; }

        if (tokenMatched) matchedTokenCount++;
      });

      if (matchedTokenCount > 1) {
        score += matchedTokenCount * 40;
      }

      return { product: p, score };
    });

    const validMatches = scored.filter(item => item.score > 0);
    if (validMatches.length === 0) {
      return {
        aiAdvice: "لا توجد نتائج مطابقة لطلبك.",
        recommendations: []
      };
    }

    validMatches.sort((a, b) => b.score - a.score);
    const topMatches = validMatches.slice(0, 4);

    const recommendations = topMatches.map(item => ({
      productId: String(item.product.id),
      matchReason: "طابق كلمات البحث والمواصفات",
      confidenceScore: 0.95
    }));

    return {
      aiAdvice: `نتائج البحث عن ("${rawQuery}"):`,
      recommendations
    };
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setAiResponse(null);

    try {
      const simplifiedCatalog = allProducts.map(p => ({
        id: p.id,
        title: p.title || p.name || "",
        category: p.category || "",
        brand: p.brand || "",
        price: p.price,
        discount_price: p.discount_price,
        description: p.description || "",
        stock: p.stock,
        attributes: p.attributes || p.specs || "",
        tags: p.tags || p.keywords || ""
      }));

      const res = await fetch("/api/ai/smart-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), products: simplifiedCatalog })
      });

      let data = null;
      if (res.ok) {
        data = await res.json().catch(() => null);
      }

      if (data && typeof data === "object" && Array.isArray(data.recommendations)) {
        setAiResponse(data);
      } else {
        setAiResponse(performClientSearch(query.trim()));
      }
    } catch (err) {
      console.warn("Client AI Search Exception, using local fallback:", err);
      setAiResponse(performClientSearch(query.trim()));
    } finally {
      setLoading(false);
    }
  };

  // Map AI recommendations back to full product models
  const recommendedProducts = (aiResponse?.recommendations || []).map(rec => {
    const fullProd = allProducts.find(p => String(p.id) === String(rec.productId));
    if (!fullProd) return null;
    return {
      ...fullProd,
      matchReason: rec.matchReason,
      confidence: rec.confidenceScore
    };
  }).filter(Boolean);

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col border border-slate-100 dir-rtl text-right">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400/20 to-blue-500/20 border border-amber-300/30 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
              <Sparkles className="w-6 h-6 fill-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  البحث الذكي في المتجر
                </h3>
                <span className="bg-blue-500/20 text-blue-200 text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  بحث سريع
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                ابحث باسم المنتج، المواصفات، أو الماركة وسيظهر لك المنتجات الأنسب فوراً
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer relative z-10 shrink-0 border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input & Search Section */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/80 shrink-0 space-y-3">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="اكتب اسم المنتج أو المواصفات..."
                className="w-full py-4 pr-12 pl-32 text-xs sm:text-sm text-slate-900 bg-white border border-slate-200 focus:border-blue-600 rounded-2xl outline-none shadow-xs font-bold transition-all focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400 placeholder:font-normal"
                disabled={loading}
              />
              <Sparkles className="absolute right-4 w-5 h-5 text-amber-500 pointer-events-none" />

              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute left-2.5 py-2.5 px-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-40 text-white text-xs sm:text-sm font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>جاري البحث...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-sky-100" />
                    <span>بحث</span>
                  </>
                )}
              </button>
            </div>

            {/* Reset Bar */}
            {(query || aiResponse) && (
              <div className="flex items-center justify-end pt-0.5">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center gap-1.5 mr-auto shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                  <span>مسح البحث</span>
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Results Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="relative w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                <Sparkles className="w-8 h-8 text-amber-500 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-black text-slate-900">
                  جاري البحث عن المنتجات المطابقة...
                </h4>
                <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                  يتم فحص المواصفات والأسعار لعرض النتائج المناسبة
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!aiResponse && !loading && (
            <div className="py-10 text-center space-y-3 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h4 className="text-xs sm:text-sm font-black text-slate-700">
                ابحث عن أي منتج بسهولة
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                ادخل اسم المنتج، الماركة، أو المواصفات لعرض النتائج المتاحة في المتجر.
              </p>
            </div>
          )}

          {aiResponse && !loading && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* AI Advice Banner */}
              {aiResponse.aiAdvice && (
                <div className="p-4 bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-indigo-500/10 border border-amber-300/40 rounded-2xl text-slate-900 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-slate-900 font-black text-xs">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 fill-amber-500" />
                    <span>نتيجة البحث عن:</span>
                  </div>
                  <p className="text-xs font-bold leading-relaxed text-slate-800 pr-6">
                    {aiResponse.aiAdvice}
                  </p>
                </div>
              )}

              {/* Recommended Products Grid */}
              {recommendedProducts.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                      <span>النتائج المقترحة</span>
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-black rounded-full">
                        {recommendedProducts.length}
                      </span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {recommendedProducts.map((p) => {
                      const displayPrice = p.discount_price || p.price;
                      return (
                        <div
                          key={p.id}
                          className="bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group relative"
                        >
                          <div className="flex gap-3 items-start">
                            <div className="w-20 h-20 rounded-xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100 p-1.5 flex items-center justify-center">
                              <img
                                src={p.image}
                                alt={p.title || p.name}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                              />
                            </div>

                            <div className="space-y-1 min-w-0 flex-1">
                              {p.category && (
                                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-md">
                                  {p.category}
                                </span>
                              )}
                              <h5 className="text-xs sm:text-sm font-black text-slate-900 truncate leading-snug">
                                {p.title || p.name}
                              </h5>
                              <div className="flex items-center gap-2 pt-0.5">
                                <span className="text-sm font-black text-blue-700">
                                  {displayPrice} {storeCurrency}
                                </span>
                                {p.discount_price && p.discount_price < p.price && (
                                  <span className="text-xs text-slate-400 line-through font-bold">
                                    {p.price} {storeCurrency}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Match Reason Badge */}
                          {p.matchReason && (
                            <div className="p-2.5 bg-blue-50/90 border border-blue-100 rounded-xl text-[11px] text-blue-950 font-bold flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                              <span className="leading-snug line-clamp-2">{p.matchReason}</span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProduct(p);
                                onClose();
                              }}
                              className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl transition-all cursor-pointer text-center"
                            >
                              عرض التفاصيل
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                handleAddToCart(p, 1);
                              }}
                              className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              <span>إضافة للسلة</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-200/60 mx-auto flex items-center justify-center text-slate-500">
                    <Search className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-700">
                    لم نجد منتجات تطابق البحث بوضوح
                  </h4>
                  <p className="text-xs font-medium text-slate-500 max-w-sm mx-auto">
                    جرب البحث بكلمات أخرى أو اكتب اسم المنتج بطريقة أسهل.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
