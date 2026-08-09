import { useState } from "react";

export function useWishlist(lang, triggerToast) {
  const [wishlist, setWishlist] = useState([]);

  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        if (triggerToast) triggerToast(lang === "ar" ? `تمت إزالة "${product.name}" من المفضلة` : `Removed "${product.name}" from wishlist`);
        return prev.filter((p) => p.id !== product.id);
      } else {
        if (triggerToast) triggerToast(lang === "ar" ? `تمت إضافة "${product.name}" للمفضلة` : `Added "${product.name}" to wishlist`);
        return [...prev, product];
      }
    });
  };

  // setWishlist مكشوف لتمكين المزامنة مع Firestore من App.jsx
  return {
    wishlist,
    setWishlist,
    toggleWishlist
  };
}
