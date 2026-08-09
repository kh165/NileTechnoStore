import { useState, useEffect } from "react";
import { useAppStore } from "../store/useAppStore";

export function useNavigation() {
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [accountSubTab, setAccountSubTab] = useState("profile");
  const [trackOrderNumber, setTrackOrderNumber] = useState("");

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (!hash) return;

      if (hash.startsWith("product-")) {
        const pId = hash.replace("product-", "");
        if (pId) {
          fetch(`/api/products`)
            .then(res => res.json())
            .then(data => {
              const p = data.find(item => String(item.id) === String(pId));
              if (p) setSelectedProduct(p);
            })
            .catch(() => {});
        }
      } else if (hash.startsWith("track-")) {
        const orderNum = hash.replace("track-", "");
        if (orderNum) {
          setActiveTab("account");
          setAccountSubTab("track");
          setTrackOrderNumber(orderNum);
        }
      } else if (["home", "categories", "wishlist", "account", "admin"].includes(hash)) {
        setActiveTab(hash);
      }
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, [setActiveTab]);

  useEffect(() => {
    const isModalOpen = Boolean(selectedProduct || cartOpen || searchModalOpen);
    if (isModalOpen) {
      window.history.pushState({ modalOpen: true }, "");
    }

    const handlePopState = () => {
      if (selectedProduct) setSelectedProduct(null);
      if (cartOpen) setCartOpen(false);
      if (searchModalOpen) setSearchModalOpen(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selectedProduct, cartOpen, searchModalOpen]);

  return {
    activeTab,
    setActiveTab,
    searchModalOpen,
    setSearchModalOpen,
    cartOpen,
    setCartOpen,
    selectedProduct,
    setSelectedProduct,
    accountSubTab,
    setAccountSubTab,
    trackOrderNumber,
    setTrackOrderNumber
  };
}
