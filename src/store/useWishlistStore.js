import { create } from "zustand";
import { storage } from "../lib/storage";

export const useWishlistStore = create((set, get) => ({
  wishlist: [],

  setWishlist: (items) => {
    set({ wishlist: Array.isArray(items) ? items : [] });
  },

  toggleWishlist: (product, lang = "ar", triggerToast = null) => {
    if (!product) return;
    const current = get().wishlist;
    const exists = current.some(item => item.id === product.id);

    let updated;
    if (exists) {
      updated = current.filter(item => item.id !== product.id);
      if (triggerToast) {
        triggerToast(lang === "ar" ? "تمت إزالة المنتج من المفضلة." : "Removed from wishlist.");
      }
    } else {
      updated = [...current, product];
      if (triggerToast) {
        triggerToast(lang === "ar" ? "تمت إضافة المنتج إلى قائمة أمنياتك! ❤️" : "Added to wishlist! ❤️");
      }
    }

    set({ wishlist: updated });
  }
}));
