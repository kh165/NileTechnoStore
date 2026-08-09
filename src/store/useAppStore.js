import { create } from "zustand";
import { storage } from "../lib/storage";
import { changeAppLanguage } from "../lib/i18n";
import { shopApi } from "../api";
import { notificationService } from "../lib/notifications";

export const useAppStore = create((set, get) => ({
  lang: storage.getLang("ar"),
  activeTab: storage.getActiveTab("home"),
  toastMsg: null,
  storeConfig: {
    storeName: "المتجر الإلكتروني",
    storeLogo: "",
    promoTagline: "",
    promoTitle: "",
    promoDesc: "",
    promoImage: ""
  },

  setLang: (newLang) => {
    storage.setLang(newLang);
    changeAppLanguage(newLang);
    set({ lang: newLang });
  },

  toggleLang: () => {
    const nextLang = get().lang === "ar" ? "en" : "ar";
    get().setLang(nextLang);
  },

  setActiveTab: (tab) => {
    storage.setActiveTab(tab);
    set({ activeTab: tab });
  },

  triggerToast: (msg) => {
    set({ toastMsg: msg });
    setTimeout(() => {
      if (get().toastMsg === msg) {
        set({ toastMsg: null });
      }
    }, 3500);
  },

  fetchStoreConfig: async () => {
    try {
      const config = await shopApi.getPublicStoreConfig();
      if (config) {
        set({
          storeConfig: {
            storeName: config.storeName || "المتجر الإلكتروني",
            storeLogo: config.storeLogo || "",
            promoTagline: config.promoTagline || "",
            promoTitle: config.promoTitle || "",
            promoDesc: config.promoDesc || "",
            promoImage: config.promoImage || ""
          }
        });
      }
    } catch (err) {
      console.error("Failed to fetch store configuration:", err);
    }
  }
}));
