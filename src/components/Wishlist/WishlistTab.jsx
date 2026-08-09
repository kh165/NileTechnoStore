import React, { useState } from "react";
import { Heart, Share2, Copy, Check, MessageCircle, Sparkles } from "lucide-react";
import ProductCard from "../Home/ProductCard";

export default function WishlistTab(props) {
  const {
    lang = "ar",
    wishlist = [],
    getGridColsClass = props.getGridColsClass || ((count) => {
      if (count === 1) return "grid-cols-1 max-w-sm mx-auto";
      if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto";
      if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
      return "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
    }),
    handleAddToCart = props.onAddToCart || (() => {}),
    setSelectedProduct = props.onProductClick || (() => {}),
    storeCurrency = "ج.م",
    toggleWishlist = props.onToggleWishlist || props.onRemoveFromWishlist || (() => {}),
    setActiveTab = () => {}
  } = props;
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  // Generate share text for WhatsApp or Clipboard
  const generateShareText = () => {
    if (!wishlist || wishlist.length === 0) return "";

    const title = lang === "ar" ? "🛍️ قائمة منتجاتي المفضلة من متجر النيل للتكنولوجيا (NileTechno):" : "🛍️ My Wishlist from NileTechno Store:";
    const itemsList = wishlist
      .map((item, idx) => `${idx + 1}. ${item.name || item.title || item.name_ar} (${item.price} ${storeCurrency})`)
      .join("\n");
    const storeUrl = window.location.origin || "https://www.niletechno.com";
    const footer = lang === "ar" ? `\n\nتصفح المزيد على المتجر:\n${storeUrl}` : `\n\nBrowse more at:\n${storeUrl}`;

    return `${title}\n\n${itemsList}${footer}`;
  };

  const handleShareWhatsApp = () => {
    const text = generateShareText();
    if (!text) return;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    showToast(lang === "ar" ? "جاري التوجيه إلى واتساب لمشاركة القائمة 📲" : "Redirecting to WhatsApp to share list 📲");
  };

  const handleCopyShareLink = async () => {
    const text = generateShareText();
    if (!text) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      showToast(lang === "ar" ? "تم نسخ قائمة المفضلة بنجاح! يمكنك لصقها وإرسالها لأصدقائك 📋" : "Wishlist copied to clipboard successfully! 📋");
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy wishlist:", err);
    }
  };

  return (
    <div className="p-5 max-w-7xl xl:max-w-[1450px] 2xl:max-w-[1700px] 3xl:max-w-[1920px] mx-auto pt-1 pb-8 font-sans">
      
      {/* Toast banner */}
      {toastMsg && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slide-up">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-black">{toastMsg}</span>
        </div>
      )}

      {/* Header section with Share Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 bg-rose-600 rounded-full"></div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-950">
                {lang === "ar" ? "قائمة المفضلة الخاصة بي" : "My Wishlist"}
              </h2>
              {wishlist.length > 0 && (
                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-700 font-mono font-black text-xs rounded-full">
                  {wishlist.length}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              {lang === "ar" ? "احتفظ بالمنتجات التي تنوي شراءها لاحقاً ومشاركتها مع من تحب" : "Save items you love and share them easily"}
            </p>
          </div>
        </div>

        {/* Wishlist Sharing Action Bar */}
        {wishlist.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {/* WhatsApp Share Button */}
            <button
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm flex items-center gap-2 active:scale-95"
              title={lang === "ar" ? "مشاركة المفضلة عبر واتساب" : "Share Wishlist via WhatsApp"}
            >
              <MessageCircle className="w-4 h-4 fill-current text-emerald-100" />
              <span>{lang === "ar" ? "واتساب 📲" : "WhatsApp"}</span>
            </button>

            {/* Direct Link / Copy List Button */}
            <button
              onClick={handleCopyShareLink}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm flex items-center gap-2 active:scale-95 border border-slate-800"
              title={lang === "ar" ? "نسخ قائمة المفضلة" : "Copy Wishlist"}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
              <span>{copied ? (lang === "ar" ? "تم النسخ!" : "Copied!") : (lang === "ar" ? "نسخ القائمة" : "Copy List")}</span>
            </button>
          </div>
        )}
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 text-slate-400">
          <Heart className="h-12 w-12 text-slate-300 mx-auto animate-pulse" />
          <h4 className="mt-4 font-bold text-slate-700">
            {lang === "ar" ? "قائمة أمنياتك فارغة حالياً" : "Your wishlist is empty right now"}
          </h4>
          <p className="mt-2 text-xs text-slate-500 max-w-xs mx-auto">
            {lang === "ar"
              ? "تصفح المنتجات في المتجر وأضف ما يعجبك للمفضلة للرجوع إليها لاحقاً."
              : "Browse store products and add items you like to favorites to access them later."}
          </p>
          <button
            onClick={() => {
              setActiveTab("home");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="mt-6 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition-all shadow-sm cursor-pointer"
          >
            {lang === "ar" ? "تصفح المنتجات" : "Browse Products"}
          </button>
        </div>
      ) : (
        <div className="relative w-full">
          <div className={`grid gap-4 sm:gap-6 ${getGridColsClass(wishlist.length)}`}>
            {wishlist.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onViewDetails={setSelectedProduct}
                storeCurrency={storeCurrency}
                isWishlisted={true}
                onToggleWishlist={toggleWishlist}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
