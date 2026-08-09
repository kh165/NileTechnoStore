import { COUPON_TYPES } from "../constants";

/**
 * Calculates coupon discount amount mathematically and safely.
 * @param {Object} coupon - The coupon object { type, value, percent, maxDiscount, minAmount, active, expiresAt }
 * @param {number} subtotal - Cart subtotal amount
 * @returns {number} The discount amount rounded to 2 decimal places
 */
export function calculateCouponDiscount(coupon, subtotal) {
  if (!coupon || !subtotal || subtotal <= 0) return 0;
  
  // Check min amount requirement
  if (coupon.minAmount && subtotal < Number(coupon.minAmount)) {
    return 0;
  }

  let discount = 0;
  const couponType = coupon.type || (coupon.percent ? COUPON_TYPES.PERCENT : COUPON_TYPES.FIXED);

  if (couponType === COUPON_TYPES.PERCENT) {
    const percentVal = Number(coupon.value ?? coupon.percent) || 0;
    let rawDiscount = subtotal * (percentVal / 100);

    // Apply max discount cap if defined
    if (coupon.maxDiscount !== null && coupon.maxDiscount !== undefined && coupon.maxDiscount !== "") {
      const maxCap = Number(coupon.maxDiscount);
      if (!isNaN(maxCap) && maxCap > 0 && rawDiscount > maxCap) {
        rawDiscount = maxCap;
      }
    }
    discount = rawDiscount;
  } else if (couponType === COUPON_TYPES.FIXED) {
    const fixedVal = Number(coupon.value) || 0;
    discount = Math.min(fixedVal, subtotal);
  }

  return Math.max(0, Math.round(discount * 100) / 100);
}

/**
 * Validates a coupon against cart subtotal and expiration dates.
 * @returns {{ valid: boolean, message: string }}
 */
export function validateCoupon(coupon, subtotal, storeCurrency = "ج.م") {
  if (!coupon) {
    return { valid: false, message: "كود الخصم غير صحيح أو غير موجود." };
  }

  if (coupon.active === false) {
    return { valid: false, message: "هذا الكوبون متوقف حالياً وغير مفعّل." };
  }

  if (coupon.expiresAt) {
    const expDate = new Date(coupon.expiresAt);
    if (!isNaN(expDate.getTime()) && expDate < new Date()) {
      return { valid: false, message: "عذراً، هذا الكوبون منتهي الصلاحية." };
    }
  }

  if (coupon.maxUses && (coupon.usesCount || 0) >= Number(coupon.maxUses)) {
    return { valid: false, message: "عذراً، تم استنفاد الحد الأقصى لاستخدام هذا الكوبون." };
  }

  if (coupon.minAmount && subtotal < Number(coupon.minAmount)) {
    return { 
      valid: false, 
      message: `يتطلب هذا الكوبون حداً أدنى للشراء قدره ${coupon.minAmount} ${storeCurrency}.` 
    };
  }

  return { valid: true, message: "" };
}

/**
 * Formats currency values safely
 */
export function formatCurrency(amount, currency = "ج.م") {
  const num = parseFloat(amount);
  if (isNaN(num)) return `0 ${currency}`;
  return `${num.toLocaleString("ar-EG")} ${currency}`;
}
