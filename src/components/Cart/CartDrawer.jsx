import React from "react";
import { Trash2, Plus, Minus, ArrowRight, X, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getProductPrices } from "../../lib/productUtils";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";

export default function CartDrawer(props) {
  const {
    isOpen = false,
    onClose = () => {},
    onReturnToStore = () => {},
    cartItems = props.cart || [],
    onUpdateQuantity = () => {},
    onRemoveItem = () => {},
    onCheckoutClick = props.onCheckout || (() => {}),
    storeCurrency = "ج.م",
    lang = "ar"
  } = props;
  useBodyScrollLock(isOpen);
  // Calculate totals using unified pricing calculations (Martin Fowler's Extract Module pattern)
  const subtotal = cartItems.reduce((acc, item) => {
    const { discountedPrice } = getProductPrices(item.product);
    return acc + discountedPrice * item.quantity;
  }, 0);

  const grandTotal = subtotal;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" dir={lang === "ar" ? "rtl" : "ltr"}>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
          />

           {/* Drawer container (slides elegantly from the left side with beautiful padding and rounded borders) */}
          <div className="absolute inset-y-0 left-0 flex p-3 xs:p-4 md:p-5 z-50">
            <motion.div
              initial={{ x: "-110%" }}
              animate={{ x: 0 }}
              exit={{ x: "-110%" }}
              transition={{ type: "spring", damping: 30, stiffness: 240 }}
              className="w-[290px] xs:w-[325px] sm:w-[340px] bg-[#fafbfc] h-full flex flex-col rounded-3xl shadow-2xl relative border border-slate-200/50 overflow-hidden isolate"
            >
              
              {/* Header Area with Centered Title and Back Arrow */}
              <div className="bg-white border-b border-slate-100 py-4 px-4 sticky top-0 z-30 flex items-center justify-between shadow-xs shrink-0">
                {/* Close/Back button */}
                <button
                  id="cart-back-btn"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-xs active:opacity-75 shrink-0"
                  aria-label="إغلاق"
                >
                  <X className="h-4 w-4 text-slate-500" />
                </button>

                {/* Center: Title */}
                <div className="text-center flex flex-col items-center flex-1">
                  <h1 className="text-sm font-black text-slate-800 font-sans tracking-tight">
                    {lang === "ar" ? "سلة التسوق" : "Shopping Cart"}
                  </h1>
                  {cartItems.length > 0 && (
                    <span className="text-[10px] text-slate-400 font-bold mt-0.5">
                      ({cartItems.length} {lang === "ar" ? (cartItems.length === 1 ? "منتج" : "منتجات") : (cartItems.length === 1 ? "item" : "items")})
                    </span>
                  )}
                </div>

                {/* Spacer to keep centered */}
                <div className="w-8 h-8"></div>
              </div>

              {/* Cart items list */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {cartItems.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center py-20 px-6">
                    <div className="rounded-full bg-slate-100 p-6 animate-pulse">
                      <ShoppingCart className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="mt-4 text-sm font-extrabold text-slate-800">
                      {lang === "ar" ? "سلتك فارغة تماماً" : "Your cart is empty"}
                    </h3>
                    <p className="mt-2 text-xs text-slate-400 max-w-[240px] leading-relaxed">
                      {lang === "ar" 
                        ? "تصفح معرض المنتجات وأضف ما ينال إعجابك للبدء في طلبك المميز!" 
                        : "Browse our premium store and add items you like to get started!"}
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        if (onReturnToStore) onReturnToStore();
                      }}
                      className="mt-6 px-5 py-2.5 bg-[#072d5c] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-200 hover:bg-blue-800 transition-all cursor-pointer"
                    >
                      {lang === "ar" ? "العودة للمعرض" : "Back to Store"}
                    </button>
                  </div>
                ) : (
                  cartItems.map((item, idx) => {
                    const { discountedPrice: price } = getProductPrices(item.product);
                    return (
                      <div
                        key={idx}
                        id={`cart-item-${item.product.id}`}
                        className={`bg-white rounded-2xl border border-slate-100 p-3 shadow-xs flex items-center justify-between gap-3 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px] hover:border-slate-200/60 ${lang === "ar" ? "flex-row" : "flex-row-reverse"}`}
                      >
                        {/* Left section of item (Controls): Trash icon and pill counter */}
                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                          {/* Delete bin */}
                          <button
                            onClick={() => onRemoveItem(item.product.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:scale-105 active:opacity-75 transition-all cursor-pointer"
                            title={lang === "ar" ? "حذف الصنف" : "Remove item"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Pill counter */}
                          <div className="bg-slate-50 text-[#1e293b] rounded-xl flex items-center justify-between p-0.5 w-[76px] border border-slate-200/60 shadow-2xs">
                            <button
                              onClick={() => onUpdateQuantity(item.product.id, 1)}
                              disabled={item.quantity >= item.product.stock}
                              className="w-5 h-5 rounded-lg flex items-center justify-center text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 disabled:opacity-30 cursor-pointer transition-all active:opacity-60"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                            <span className="font-extrabold text-[11px] text-slate-800 font-sans">{item.quantity}</span>
                            <button
                              onClick={() => {
                                if (item.quantity > 1) {
                                  onUpdateQuantity(item.product.id, -1);
                                } else {
                                  onRemoveItem(item.product.id);
                                }
                              }}
                              className="w-5 h-5 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-rose-50 cursor-pointer transition-all active:opacity-60"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>

                        {/* Middle section of item: Info details */}
                        <div className={`flex-1 min-w-0 px-1 ${lang === "ar" ? "text-right" : "text-left"}`}>
                          <span className="text-[#3182ce] text-[9px] font-bold uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                            {lang === "ar" 
                              ? (item.product.categoryName || "مستحضرات التجميل والعناية")
                              : (item.product.category || "Cosmetics & Care")}
                          </span>
                          <h3 className="text-[11px] font-black text-[#1a202c] truncate mt-1 leading-tight">
                            {item.product.name}
                          </h3>
                          <p className="text-[#2b6cb0] font-black text-[11px] mt-1 font-sans tracking-tight">
                            {price} {storeCurrency}
                          </p>
                        </div>

                        {/* Right section of item: Product image */}
                        <div className="w-14 h-14 bg-white border border-slate-100 rounded-xl p-1 flex items-center justify-center shrink-0 shadow-3xs">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="max-h-full max-w-full rounded-lg object-contain transition-transform duration-300 hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Flexbox footer area (Never overlaps items!) */}
              {cartItems.length > 0 && (
                <div className="shrink-0 bg-white rounded-t-[24px] shadow-[0_-12px_30px_rgb(0,0,0,0.06)] border-t border-slate-100 px-4 py-4 z-20">
                  
                  {/* Price list layout */}
                  <div className={`space-y-2 border-b border-slate-100 pb-3 mb-3 ${lang === "ar" ? "text-right" : "text-left"}`}>
                    {/* Subtotal */}
                    <div className="flex justify-between items-center text-[11px] text-slate-500 font-bold">
                      <span className="font-sans text-slate-700 font-extrabold">
                        {subtotal} {storeCurrency}
                      </span>
                      <span>{lang === "ar" ? "المجموع الفرعي" : "Subtotal"}</span>
                    </div>

                    {/* Grand Total */}
                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
                      <span className="text-sm font-black text-[#1e3a8a] font-sans">
                        {grandTotal} {storeCurrency}
                      </span>
                      <span className="text-xs font-extrabold text-slate-800">
                        {lang === "ar" ? "الإجمالي" : "Total"}
                      </span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    id="cart-checkout-btn"
                    onClick={onCheckoutClick}
                    className="w-full bg-[#072d5c] hover:bg-blue-800 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md shadow-blue-950/10 cursor-pointer active:opacity-90 text-center flex items-center justify-center gap-2"
                  >
                    <span>{lang === "ar" ? "إتمام عملية الشراء" : "Proceed to Checkout"}</span>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${lang === "ar" ? "rotate-180" : ""}`} />
                  </button>

                  {/* Continue Shopping / Return to Store button */}
                  <button
                    id="cart-continue-shopping-btn"
                    onClick={() => {
                      onClose();
                      if (onReturnToStore) onReturnToStore();
                    }}
                    className="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer text-center"
                  >
                    {lang === "ar" ? "العودة للمعرض / مواصلة التسوق" : "Continue Shopping"}
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
