/**
 * GeoService - Centralized geolocation and geocoding utility helper
 * Resolves: Fowler's "Duplicate Code" and "Shotgun Surgery" smells
 * by consolidating all OpenStreetMap / Nominatim API logic.
 */

/**
 * Normalizes Arabic and English text for robust comparison.
 */
export function normalizeGeoText(text) {
  if (!text) return "";
  let str = String(text).toLowerCase();
  
  // Replace Arabic letter variants
  str = str.replace(/[أإآء]/g, "ا");
  str = str.replace(/ة/g, "ه");
  str = str.replace(/ى/g, "ي");
  
  // Remove common prefix/suffix words
  str = str.replace(/\b(محافظه|محافظة|governorate|city|مركز|قسم|حي)\b/gi, " ");
  
  // Remove non-alphanumeric except spaces
  str = str.replace(/[^\w\s\u0600-\u06FF]/g, " ");
  
  return str.replace(/\s+/g, " ").trim();
}

const EGYPTIAN_GOVERNORATES_MAPPING = [
  { canonical: "القاهرة", keywords: ["القاهرة", "القاهره", "cairo", "cairo governorate", "مصر الجديدة", "مدينة نصر", "المعادي", "التجمع", "الشروق", "بدر", "حلوان"] },
  { canonical: "الجيزة", keywords: ["الجيزة", "الجيزه", "giza", "gizeh", "الدقي", "المهندسين", "الهرم", "فيصل", "6 أكتوبر", "اكتوبر", "الشيخ زايد", "العجوزة"] },
  { canonical: "الإسكندرية", keywords: ["الإسكندرية", "الاسكندرية", "الاسكندريه", "alexandria", "alex", "المنتزه", "سموحة", "محرم بك", "سيدي جابر", "العجمي"] },
  { canonical: "القليوبية", keywords: ["القليوبية", "القليوبيه", "qalyubia", "qalyubiya", "kaliobeya", "بنها", "شبرا الخيمة", "شبرا الخيمه", "العبور", "قليوب", "الخانكة"] },
  { canonical: "الدقهلية", keywords: ["الدقهلية", "الدقهليه", "dakahlia", "dakhalia", "المنصورة", "المنصوره", "ميت غمر", "طلخا"] },
  { canonical: "البحيرة", keywords: ["البحيرة", "البحيره", "beheira", "behira", "دمنهور", "كفر الدوار", "إيتاي البارود"] },
  { canonical: "الغربية", keywords: ["الغربية", "الغربيه", "gharbia", "gharbeya", "طنطا", "المحلة الكبرى", "المحله الكبرى", "زفتى"] },
  { canonical: "الشرقية", keywords: ["الشرقية", "الشرقيه", "sharqia", "sharkia", "الزقازيق", "العاشر من رمضان", "بلبيس", "منيا القمح"] },
  { canonical: "المنوفية", keywords: ["المنوفية", "المنوفيه", "monufia", "menofia", "شبين الكوم", "السادات", "أشمون", "منوف"] },
  { canonical: "كفر الشيخ", keywords: ["كفر الشيخ", "kafr el sheikh", "kafr el-sheikh", "kafr elsheikh", "دسوق"] },
  { canonical: "دمياط", keywords: ["دمياط", "damietta", "رأس البر", "دمياط الجديدة"] },
  { canonical: "بورسعيد", keywords: ["بورسعيد", "port said", "portsaid", "بورفؤاد"] },
  { canonical: "الإسماعيلية", keywords: ["الإسماعيلية", "الاسماعيلية", "الاسماعيليه", "ismailia", "ismailiah", "القنطرة"] },
  { canonical: "السويس", keywords: ["السويس", "suez", "العين السخنة"] },
  { canonical: "الفيوم", keywords: ["الفيوم", "faiyum", "fayoum", "طامية"] },
  { canonical: "بني سويف", keywords: ["بني سويف", "beni suef", "benisuef", "الواسطى"] },
  { canonical: "المنيا", keywords: ["المنيا", "minya", "menia", "ملوي", "بني مزار"] },
  { canonical: "أسيوط", keywords: ["أسيوط", "اسيوط", "asyut", "assiut", "ديروط"] },
  { canonical: "سوهاج", keywords: ["سوهاج", "sohag", "طهطا", "جرجا"] },
  { canonical: "قنا", keywords: ["قنا", "qena", "نجع حمادي", "قوص"] },
  { canonical: "الأقصر", keywords: ["الأقصر", "الاقصر", "luxor", "إسنا"] },
  { canonical: "أسوان", keywords: ["أسوان", "اسوان", "aswan", "كوم أمبو", "إدفو"] },
  { canonical: "مطروح", keywords: ["مطروح", "مرسى مطروح", "matrouh", "matruh", "العلمين", "سيوة"] },
  { canonical: "البحر الأحمر", keywords: ["البحر الأحمر", "البحر الاحمر", "red sea", "الغردقة", "الغردقه", "شرم الشيخ", "سفاجا", "القصير"] },
  { canonical: "الوادي الجديد", keywords: ["الوادي الجديد", "new valley", "الخارجة", "الداخلة"] },
  { canonical: "شمال سيناء", keywords: ["شمال سيناء", "north sinai", "العريش"] },
  { canonical: "جنوب سيناء", keywords: ["جنوب سيناء", "south sinai", "دهب", "نويبع", "طابا", "راس سدر"] }
];

export function matchGovernorateZone(rawText, zones = []) {
  if (!rawText) return null;
  const normText = normalizeGeoText(rawText);
  if (!normText) return null;

  // 1. Check direct match against zones names
  if (Array.isArray(zones) && zones.length > 0) {
    for (const zone of zones) {
      if (!zone || !zone.name) continue;
      const zoneNorm = normalizeGeoText(zone.name);
      if (zoneNorm && (normText.includes(zoneNorm) || zoneNorm.includes(normText))) {
        return zone;
      }
    }
  }

  // 2. Check mapping table keywords against rawText
  for (const govMap of EGYPTIAN_GOVERNORATES_MAPPING) {
    for (const kw of govMap.keywords) {
      const normKw = normalizeGeoText(kw);
      if (normKw && normText.includes(normKw)) {
        const canonicalNorm = normalizeGeoText(govMap.canonical);
        if (Array.isArray(zones) && zones.length > 0) {
          const matchedZone = zones.find(z => {
            if (!z || !z.name) return false;
            const zNorm = normalizeGeoText(z.name);
            return zNorm === canonicalNorm || zNorm.includes(canonicalNorm) || canonicalNorm.includes(zNorm);
          });
          if (matchedZone) return matchedZone;
        }
        return { name: govMap.canonical, price: 0 };
      }
    }
  }

  return null;
}

export const GeoService = {
  normalizeGeoText,
  matchGovernorateZone,
  /**
   * Reverse geocodes latitude and longitude coordinates into a human-readable address.
   * @param {number} latitude
   * @param {number} longitude
   * @param {string} lang
   * @returns {Promise<{displayName: string, formatted: string, raw: Object}>}
   */
  async reverseGeocode(latitude, longitude, lang = "ar") {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=${lang}`
      );
      if (!response.ok) {
        throw new Error(`Nominatim HTTP Error: ${response.status}`);
      }
      const data = await response.json();
      
      let formatted = "";
      let governorate = "";
      if (data && data.address) {
        const addrParts = data.address;
        // تفاصيل دقيقة: رقم المبنى + الشارع + الحي + المدينة + المحافظة
        const houseNumber   = addrParts.house_number || "";
        const road          = addrParts.road || addrParts.pedestrian || addrParts.path || "";
        const neighbourhood = addrParts.neighbourhood || addrParts.quarter || addrParts.suburb || addrParts.residential || "";
        const city          = addrParts.city || addrParts.town || addrParts.village || addrParts.county || "";
        const state         = addrParts.state || addrParts.governorate || addrParts.region || "";
        governorate = state || city || "";

        // بناء العنوان: رقم المبنى + الشارع + الحي + المدينة + المحافظة
        const streetPart = [houseNumber, road].filter(Boolean).join(" ");
        const parts = [streetPart, neighbourhood, city, state].filter(Boolean);
        formatted = parts.length > 0 ? parts.join("، ") : data.display_name;
      } else {
        formatted = data?.display_name || `موقع محدد (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
      }

      return {
        displayName: data?.display_name || `موقع جغرافي (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
        formatted,
        governorate,
        raw: data
      };
    } catch (err) {
      console.error("GeoService.reverseGeocode error:", err);
      const fallback = `موقع محدد (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
      return {
        displayName: fallback,
        formatted: fallback,
        raw: null
      };
    }
  },

  /**
   * Searches for addresses matching a text query (Forward geocoding / autocomplete).
   * @param {string} query
   * @param {string} lang
   * @param {number} limit
   * @returns {Promise<Array<{lat: string, lon: string, display_name: string}>>}
   */
  async searchAddress(query, lang = "ar", limit = 5, countryCode = "eg") {
    if (!query || query.trim().length <= 2) {
      return [];
    }
    try {
      let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=${lang}&limit=${limit}`;
      if (countryCode) {
        url += `&countrycodes=${countryCode}`;
      }
      let response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Nominatim HTTP Error: ${response.status}`);
      }
      let data = await response.json();
      
      // Fallback search without country filter if no local results found
      if ((!data || data.length === 0) && countryCode) {
        const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&accept-language=${lang}&limit=${limit}`;
        const fallbackRes = await fetch(fallbackUrl);
        if (fallbackRes.ok) {
          data = await fallbackRes.json();
        }
      }
      return data || [];
    } catch (err) {
      console.error("GeoService.searchAddress error:", err);
      return [];
    }
  }
};
