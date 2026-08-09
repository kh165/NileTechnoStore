/**
 * Product Utilities - Martin Fowler's "Extract Module/Method" Pattern implementation.
 * Provides a single point of truth for price, discount, and currency formatting.
 */

/**
 * Calculates unified pricing for a product, handling various discount formats.
 * @param {object} product - The product object
 * @returns {object} Calculated prices { originalPrice, discountedPrice, hasDiscount, discountPercentage }
 */
export function getProductPrices(product) {
  if (!product) {
    return {
      originalPrice: 0,
      discountedPrice: 0,
      hasDiscount: false,
      discountPercentage: null
    };
  }

  const price = Number(product.price) || 0;
  
  // Resolve discounted price safely without allowing 0/null/empty strings to corrupt price
  let discountedPrice = price;
  const rawDisc = (product.discount_price !== undefined && product.discount_price !== null && product.discount_price !== "") 
    ? Number(product.discount_price) 
    : 0;

  if (rawDisc > 0 && rawDisc < price) {
    discountedPrice = rawDisc;
  } else if (product.discount) {
    if (typeof product.discount === 'number' && product.discount > 0) {
      discountedPrice = Math.max(0, price - product.discount);
    } else if (typeof product.discount === 'object') {
      const amt = Number(product.discount.amount || 0);
      if (amt > 0) {
        discountedPrice = Math.max(0, price - amt);
      }
    }
  }

  const originalPrice = Number(product.originalPrice || product.price) || 0;
  const hasDiscount = discountedPrice > 0 && discountedPrice < price;

  // Calculate percentage
  let discountPercentage = null;
  if (product.discount?.percentage) {
    discountPercentage = Number(product.discount.percentage);
  } else if (hasDiscount && originalPrice > 0) {
    discountPercentage = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  }

  return {
    originalPrice,
    discountedPrice,
    hasDiscount,
    discountPercentage
  };
}

/**
 * Formats standard numeric currencies cleanly according to language preferences.
 * @param {number} amount - The numeric price
 * @param {string} lang - Language "ar" | "en"
 * @returns {string} Formatted string
 */
export function formatProductPrice(amount, lang = "ar") {
  const num = Number(amount) || 0;
  const formattedNum = num.toLocaleString(lang === "ar" ? "ar-EG" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  if (lang === "ar") {
    return `${formattedNum} ج.م`;
  }
  return `EGP ${formattedNum}`;
}
