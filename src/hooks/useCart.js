import { useCartStore } from "../store/useCartStore";

export function useCart(triggerToast) {
  const cart = useCartStore((state) => state.cart);
  const setCart = useCartStore((state) => state.setCart);
  const addToCartStore = useCartStore((state) => state.addToCart);
  const updateQuantityStore = useCartStore((state) => state.updateQuantity);
  const removeItemStore = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const handleAddToCart = (product, addQty = 1, color = "", size = "") => {
    addToCartStore(product, addQty, color, size, triggerToast);
  };

  const handleUpdateCartQuantity = (productId, delta) => {
    updateQuantityStore(productId, delta, triggerToast);
  };

  const handleRemoveCartItem = (productId) => {
    removeItemStore(productId, triggerToast);
  };

  return {
    cart,
    setCart,
    handleAddToCart,
    handleUpdateCartQuantity,
    handleRemoveCartItem,
    clearCart
  };
}
