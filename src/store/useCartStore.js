import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  cart: [],

  setCart: (newCart) => {
    const cartArray = Array.isArray(newCart) ? newCart : [];
    set({ cart: cartArray });
  },

  addToCart: (product, addQty = 1, color = "", size = "", triggerToast) => {
    if (!product) return;
    const qtyToAdd = Number(addQty) || 1;
    const currentCart = get().cart;

    const index = currentCart.findIndex(
      (item) => item.product.id === product.id && (item.color || "") === (color || "") && (item.size || "") === (size || "")
    );

    let updatedCart;
    if (index !== -1) {
      const maxStock = product.stock ?? 999;
      if (currentCart[index].quantity + qtyToAdd > maxStock) {
        if (triggerToast) triggerToast(`عذراً، أقصى كمية متاحة بالمخزن هي ${maxStock} قطع.`);
        return;
      }
      updatedCart = [...currentCart];
      updatedCart[index] = {
        ...updatedCart[index],
        quantity: updatedCart[index].quantity + qtyToAdd
      };
      if (triggerToast) triggerToast(`تم تحديث كمية "${product.name_ar || product.name || 'المنتج'}" بالسلة.`);
    } else {
      updatedCart = [...currentCart, { product, quantity: qtyToAdd, color, size }];
      if (triggerToast) triggerToast(`تمت إضافة "${product.name_ar || product.name || 'المنتج'}" لسلة المشتريات.`);
    }

    set({ cart: updatedCart });
  },

  updateQuantity: (productId, delta, triggerToast) => {
    const currentCart = get().cart;
    const updatedCart = currentCart.map((item) => {
      if (item.product.id === productId) {
        const nextQty = item.quantity + delta;
        const maxStock = item.product.stock ?? 999;
        if (nextQty > maxStock) {
          if (triggerToast) triggerToast("لا يمكن تجاوز الكمية المتاحة في المخزن.");
          return item;
        }
        return { ...item, quantity: Math.max(1, nextQty) };
      }
      return item;
    });

    set({ cart: updatedCart });
  },

  removeItem: (productId, triggerToast) => {
    const currentCart = get().cart;
    const updatedCart = currentCart.filter((item) => item.product.id !== productId);
    set({ cart: updatedCart });
    if (triggerToast) triggerToast("تمت إزالة الصنف بنجاح.");
  },

  clearCart: () => {
    set({ cart: [] });
  },

  getTotalItems: () => {
    return get().cart.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
  },

  getTotalPrice: () => {
    return get().cart.reduce((total, item) => {
      const p = item.product || {};
      const rawDisc = (p.discount_price !== undefined && p.discount_price !== null && p.discount_price !== "") 
        ? Number(p.discount_price) 
        : 0;
      let price = (rawDisc > 0 && rawDisc < Number(p.price)) ? rawDisc : (Number(p.price) || 0);
      if (!price && typeof p.price === "string") {
        price = parseFloat(p.price.replace(/[^0-9.]/g, "")) || 0;
      }
      return total + (isNaN(price) ? 0 : price) * (Number(item.quantity) || 0);
    }, 0);
  }
}));
