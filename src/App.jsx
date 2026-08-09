import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2 } from "lucide-react";

import Navbar from "./components/Layout/Navbar";
import Footer from "./components/Layout/Footer";
import LoginForm from "./components/Account/LoginForm";
import MyAccount from "./components/Account/MyAccount";
import ProductDetailsModal from "./components/ProductDetails/ProductDetailsModal";
import CartDrawer from "./components/Cart/CartDrawer";
import CheckoutModal from "./components/Checkout/CheckoutModal";

import HomeTab from "./components/Home/HomeTab";
import CategoriesTab from "./components/Categories/CategoriesTab";
import WishlistTab from "./components/Wishlist/WishlistTab";

import { useAppStore } from "./store/useAppStore";
import { useCartStore } from "./store/useCartStore";
import { useWishlistStore } from "./store/useWishlistStore";

import { useAuth } from "./hooks/useAuth";
import { useProducts } from "./hooks/useProducts";
import { useOrders } from "./hooks/useOrders";
import { useTheme } from "./hooks/useTheme";

import { notificationService } from "./lib/notifications";
import { trackSearchQueryInFirestore, trackProductViewInFirestore } from "./lib/firebaseService";

export default function App() {
  const { lang, toggleLang, activeTab, setActiveTab, toastMsg, triggerToast, storeConfig, fetchStoreConfig } = useAppStore();
  const { cart, addToCart, updateQuantity, removeItem, clearCart, getTotalItems } = useCartStore();
  const { wishlist, toggleWishlist } = useWishlistStore();
  const { themeMode, toggleTheme } = useTheme();

  const {
    currentUser,
    isAuthLoading,
    unverifiedUser,
    setUnverifiedUser,
    handleLogout,
    handleUpdateUser
  } = useAuth();

  const productsState = useProducts(lang);
  const {
    products,
    allProducts,
    searchQuery,
    setSearchQuery,
    productFilter,
    setProductFilter,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    showOnlyInStock,
    setShowOnlyInStock,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    isFilterPanelOpen,
    setIsFilterPanelOpen,
    isLoading,
    isInitialLoading,
    categoriesList,
    getCategoryCount,
    processedProducts,
    promoProduct
  } = productsState;

  const { orders, fetchOrders } = useOrders(currentUser);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [accountSubTab, setAccountSubTab] = useState("profile");
  const [trackOrderNumber, setTrackOrderNumber] = useState("");

  const [notifications, setNotifications] = useState(() =>
    notificationService.getNotifications(currentUser?.uid)
  );

  useEffect(() => {
    fetchStoreConfig();
  }, [fetchStoreConfig]);

  useEffect(() => {
    const loadNotifs = () => setNotifications(notificationService.getNotifications(currentUser?.uid));
    loadNotifs();
    return notificationService.subscribe(loadNotifs);
  }, [currentUser?.uid]);

  useEffect(() => {
    if (!searchQuery?.trim()) return;
    const timer = setTimeout(() => {
      trackSearchQueryInFirestore(searchQuery.trim());
    }, 1200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedProduct?.id) {
      trackProductViewInFirestore(selectedProduct.id);
    }
  }, [selectedProduct?.id]);

  const [tabHistory, setTabHistory] = useState(["home"]);

  const handleTabChange = (newTab) => {
    if (!newTab) return;
    if (newTab !== activeTab) {
      setTabHistory((prev) => {
        if (prev[prev.length - 1] === newTab) return prev;
        return [...prev, newTab];
      });
      setActiveTab(newTab);
      window.location.hash = `#${newTab}`;
    }
  };

  useEffect(() => {
    setTabHistory((prev) => {
      if (prev[prev.length - 1] === activeTab) return prev;
      return [...prev, activeTab];
    });
  }, [activeTab]);

  const modalStatesRef = useRef({
    selectedProduct,
    isCheckoutOpen,
    isCartOpen,
    isFilterPanelOpen,
    activeTab
  });

  useEffect(() => {
    modalStatesRef.current = {
      selectedProduct,
      isCheckoutOpen,
      isCartOpen,
      isFilterPanelOpen,
      activeTab
    };
  }, [selectedProduct, isCheckoutOpen, isCartOpen, isFilterPanelOpen, activeTab]);

  const isOverlayOpen = Boolean(selectedProduct || isCheckoutOpen || isCartOpen || isFilterPanelOpen);
  const modalPushedRef = useRef(false);
  const isPopStateEventRef = useRef(false);

  useEffect(() => {
    if (isOverlayOpen && !modalPushedRef.current) {
      const currentHash = window.location.hash || `#${activeTab}`;
      window.history.pushState({ modal: true }, "", currentHash);
      modalPushedRef.current = true;
    } else if (!isOverlayOpen && modalPushedRef.current) {
      if (isPopStateEventRef.current) {
        modalPushedRef.current = false;
        isPopStateEventRef.current = false;
      } else {
        modalPushedRef.current = false;
        if (window.history.state?.modal) {
          window.history.back();
        }
      }
    }
  }, [isOverlayOpen, activeTab]);

  useEffect(() => {
    const syncRouteFromHash = () => {
      const raw = (window.location.hash || "").replace("#", "").trim();
      if (!raw) return;

      const mainPart = raw.split("/")[0];
      if (mainPart === "admin" || mainPart === "account") {
        setActiveTab("account");
      } else if (["home", "categories", "wishlist"].includes(mainPart)) {
        setActiveTab(mainPart);
      }
    };

    const handlePopState = () => {
      isPopStateEventRef.current = true;
      const current = modalStatesRef.current;

      if (current.selectedProduct) { setSelectedProduct(null); return; }
      if (current.isCheckoutOpen) { setIsCheckoutOpen(false); return; }
      if (current.isCartOpen) { setIsCartOpen(false); return; }
      if (current.isFilterPanelOpen) { setIsFilterPanelOpen(false); return; }

      syncRouteFromHash();
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("hashchange", syncRouteFromHash);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("hashchange", syncRouteFromHash);
    };
  }, [setActiveTab]);

  const getGridColsClass = (count) => {
    if (count === 1) return "grid-cols-1 max-w-sm mx-auto";
    if (count === 2) return "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto";
    if (count === 3) return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    return "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
  };

  const handleAddToCart = (product, addQty = 1, color = "", size = "") => {
    addToCart(product, addQty, color, size, triggerToast);
  };

  const handleToggleWishlist = (product) => {
    toggleWishlist(product, lang, triggerToast);
  };

  const handleMarkNotificationRead = (id) => notificationService.markAsRead(currentUser?.uid, id);
  const handleMarkAllNotificationsRead = () => notificationService.markAllAsRead(currentUser?.uid);
  const handleClearNotifications = () => notificationService.clearAll(currentUser?.uid);

  const handleSelectNotification = (notif) => {
    if (!notif) return;
    if (notif.productId) {
      const targetProd = allProducts.find(p => String(p.id) === String(notif.productId));
      if (targetProd) {
        setSelectedProduct(targetProd);
        return;
      }
    }
    if (notif.orderId || notif.type === "ORDER_PLACED" || notif.type === "ORDER_STATUS_UPDATED") {
      handleTabChange("account");
      setAccountSubTab("track");
      setTrackOrderNumber(notif.orderId || "");
    } else if (notif.type === "OFFER" || notif.type === "PROMO") {
      handleTabChange("home");
      setProductFilter("offers");
    } else {
      handleTabChange("account");
    }
  };

  const storeCurrency = lang === "ar" ? "ج.م" : "EGP";

  const currentHash = typeof window !== "undefined" ? (window.location.hash || "") : "";
  const isAccountOrAdminSubsection = Boolean(
    currentHash &&
    currentHash !== "" &&
    currentHash !== "#" &&
    currentHash !== "#home"
  );

  const canGoBack = Boolean(
    selectedProduct ||
    isCheckoutOpen ||
    isCartOpen ||
    isFilterPanelOpen ||
    isAccountOrAdminSubsection ||
    activeTab !== "home" ||
    tabHistory.length > 1
  );

  const handleGoBack = () => {
    if (selectedProduct) {
      setSelectedProduct(null);
      return;
    }
    if (isCheckoutOpen) {
      setIsCheckoutOpen(false);
      return;
    }
    if (isCartOpen) {
      setIsCartOpen(false);
      return;
    }
    if (isFilterPanelOpen) {
      setIsFilterPanelOpen(false);
      return;
    }

    let handledByChild = false;
    const checkBackEvt = new CustomEvent("niletechno_check_go_back", {
      detail: {
        preventFallback: () => {
          handledByChild = true;
        }
      }
    });
    window.dispatchEvent(checkBackEvt);
    if (handledByChild) {
      return;
    }

    const hash = window.location.hash || "";

    if (window.history.length > 1 && hash !== "" && hash !== "#" && hash !== "#home") {
      window.history.back();
      return;
    }

    if (hash.includes("/order/") || hash.includes("/customer/")) {
      const parts = hash.replace("#", "").split("/");
      window.location.hash = `#${parts[0]}/${parts[1] || "ORDERS"}`;
      return;
    }

    if (hash.startsWith("#admin/")) {
      window.location.hash = "#admin";
      window.dispatchEvent(new CustomEvent("switch_admin_tab", { detail: "ORDERS" }));
      return;
    }

    if (hash === "#admin" || hash.startsWith("#account/") || hash === "#track") {
      window.location.hash = "#account";
      window.dispatchEvent(new CustomEvent("switch_account_subsection", { detail: null }));
      window.dispatchEvent(new CustomEvent("niletechno_switch_account_section", { detail: null }));
      if (activeTab !== "account") {
        setActiveTab("account");
      }
      return;
    }

    if (tabHistory.length > 1) {
      const updatedHistory = [...tabHistory];
      updatedHistory.pop();
      const previousTab = updatedHistory[updatedHistory.length - 1] || "home";
      setTabHistory(updatedHistory);
      setActiveTab(previousTab);
      window.location.hash = `#${previousTab}`;
      return;
    }

    if (activeTab !== "home") {
      setActiveTab("home");
      window.location.hash = "#home";
      return;
    }
  };

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-200 ${themeMode === "dark" ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      {/* Dynamic Notification Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900/95 text-white dark:bg-white/95 dark:text-slate-900 px-5 py-3 rounded-full shadow-2xl backdrop-blur-md text-sm font-medium border border-slate-700/50"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Layout Navbar */}
      <Navbar
        onGoBack={handleGoBack}
        canGoBack={canGoBack}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        lang={lang}
        toggleLang={toggleLang}
        themeMode={themeMode}
        toggleTheme={toggleTheme}
        cartCount={getTotalItems()}
        wishlistCount={wishlist.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={currentUser}
        currentUser={currentUser}
        onLogout={handleLogout}
        handleLogout={handleLogout}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onClearNotifications={handleClearNotifications}
        onSelectNotification={handleSelectNotification}
        setIsCartOpen={setIsCartOpen}
        onCartClick={() => setIsCartOpen(true)}
        storeConfig={storeConfig}
      />

      {/* Main Container Views */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-24">
        {activeTab === "home" && (
          <HomeTab
            processedProducts={processedProducts}
            products={processedProducts}
            allProducts={allProducts}
            promoProduct={promoProduct}
            categoriesList={categoriesList}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            productFilter={productFilter}
            setProductFilter={setProductFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            showOnlyInStock={showOnlyInStock}
            setShowOnlyInStock={setShowOnlyInStock}
            minPrice={minPrice}
            setMinPrice={setMinPrice}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            isFilterPanelOpen={isFilterPanelOpen}
            setIsFilterPanelOpen={setIsFilterPanelOpen}
            isLoading={isLoading}
            isInitialLoading={isInitialLoading}
            handleAddToCart={handleAddToCart}
            onAddToCart={handleAddToCart}
            toggleWishlist={handleToggleWishlist}
            onToggleWishlist={handleToggleWishlist}
            wishlist={wishlist}
            setSelectedProduct={setSelectedProduct}
            onProductClick={(product) => setSelectedProduct(product)}
            onCategoryClick={(cat) => { setSelectedCategory(cat); handleTabChange("categories"); }}
            lang={lang}
            getCategoryCount={getCategoryCount}
            storeCurrency={storeCurrency}
            currentUser={currentUser}
            setActiveTab={handleTabChange}
            getGridColsClass={getGridColsClass}
          />
        )}

        {activeTab === "categories" && (
          <CategoriesTab
            categoriesList={categoriesList}
            categories={categoriesList}
            allProducts={allProducts}
            products={allProducts}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onProductClick={(product) => setSelectedProduct(product)}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlist={wishlist}
            lang={lang}
            getCategoryCount={getCategoryCount}
            storeCurrency={storeCurrency}
            setActiveTab={handleTabChange}
            setProductFilter={setProductFilter}
          />
        )}

        {activeTab === "wishlist" && (
          <WishlistTab
            wishlist={wishlist}
            toggleWishlist={handleToggleWishlist}
            onRemoveFromWishlist={handleToggleWishlist}
            handleAddToCart={handleAddToCart}
            onAddToCart={handleAddToCart}
            setSelectedProduct={setSelectedProduct}
            onProductClick={(product) => setSelectedProduct(product)}
            lang={lang}
            storeCurrency={storeCurrency}
            setActiveTab={handleTabChange}
            getGridColsClass={getGridColsClass}
          />
        )}

        {activeTab === "account" && (
          <>
            {currentUser ? (
              <MyAccount
                user={currentUser}
                currentUser={currentUser}
                onLogout={handleLogout}
                onUpdateUser={handleUpdateUser}
                orders={orders}
                unverifiedUser={unverifiedUser}
                setUnverifiedUser={setUnverifiedUser}
                accountSubTab={accountSubTab}
                trackOrderNumber={trackOrderNumber}
                lang={lang}
              />
            ) : (
              <LoginForm
                onSuccess={(user) => {
                  fetchOrders();
                  handleTabChange("account");
                }}
                lang={lang}
                unverifiedUser={unverifiedUser}
                setUnverifiedUser={setUnverifiedUser}
              />
            )}
          </>
        )}
      </main>

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetailsModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onToggleWishlist={handleToggleWishlist}
          wishlist={wishlist}
          lang={lang}
          storeCurrency={storeCurrency}
          currentUser={currentUser}
        />
      )}

      {/* Cart Drawer Overlay */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onReturnToStore={() => {
          setIsCartOpen(false);
          setActiveTab("home");
        }}
        cart={cart}
        cartItems={cart}
        onUpdateQuantity={(productId, delta) => updateQuantity(productId, delta, triggerToast)}
        onRemoveItem={(productId) => removeItem(productId, triggerToast)}
        onCheckoutClick={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        lang={lang}
        storeCurrency={storeCurrency}
      />

      {/* Checkout Process Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          cart={cart}
          cartItems={cart}
          clearCart={clearCart}
          user={currentUser}
          currentUser={currentUser}
          lang={lang}
          storeCurrency={storeCurrency}
          triggerToast={triggerToast}
        />
      )}

      {/* Footer Section */}
      <Footer
        lang={lang}
        storeConfig={storeConfig}
        setActiveTab={handleTabChange}
      />
    </div>
  );
}
