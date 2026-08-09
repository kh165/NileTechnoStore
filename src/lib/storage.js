/**
 * Unified Memory Storage Service
 * Pure in-memory session store (No localStorage usage).
 * All persistent business data (cart, wishlist, orders, user profile) is synced directly with Firebase Firestore.
 */

const memoryStore = new Map();

const getParsedItem = (key, defaultValue) => {
  const saved = memoryStore.get(key);
  return saved !== undefined ? saved : defaultValue;
};

export const storage = {
  // --- Language & Theme Preferences ---
  getLang(defaultLang = "ar") {
    return memoryStore.get("app_lang") || defaultLang;
  },
  setLang(lang) {
    memoryStore.set("app_lang", lang);
  },
  getTheme(defaultTheme = "light") {
    return memoryStore.get("theme_mode") || defaultTheme;
  },
  setTheme(theme) {
    memoryStore.set("theme_mode", theme);
  },

  // --- Authenticated User Session ---
  getCurrentUser() {
    return getParsedItem("current_user", null);
  },
  setCurrentUser(user) {
    if (user) {
      const { password, pass, token, ...safeUser } = user;
      memoryStore.set("current_user", safeUser);
    } else {
      memoryStore.delete("current_user");
    }
  },
  removeCurrentUser() {
    memoryStore.delete("current_user");
  },

  // --- Pending Sign-In & Verification Profiles ---
  getGoogleSignInInProgress() {
    return memoryStore.get("google_sign_in_in_progress") === true;
  },
  setGoogleSignInInProgress(val) {
    if (val) {
      memoryStore.set("google_sign_in_in_progress", true);
    } else {
      memoryStore.delete("google_sign_in_in_progress");
    }
  },
  removeGoogleSignInInProgress() {
    memoryStore.delete("google_sign_in_in_progress");
  },
  getPendingRegistrationProfile() {
    return getParsedItem("pending_registration_profile", null);
  },
  setPendingRegistrationProfile(profile) {
    memoryStore.set("pending_registration_profile", profile);
  },
  removePendingRegistrationProfile() {
    memoryStore.delete("pending_registration_profile");
  },

  // --- Saved Addresses ---
  getSavedAddresses() {
    return getParsedItem("saved_addresses", []);
  },
  setSavedAddresses(addresses) {
    memoryStore.set("saved_addresses", addresses);
  },

  // --- Checkout Form Fields & Notes ---
  getCheckoutField(field, defaultValue = "") {
    return memoryStore.get(`checkout_${field}`) || defaultValue;
  },
  setCheckoutField(field, value) {
    memoryStore.set(`checkout_${field}`, value);
  },

  // --- Navigation & Active State ---
  getActiveTab(defaultTab = "home") {
    return memoryStore.get("active_tab") || defaultTab;
  },
  setActiveTab(tab) {
    memoryStore.set("active_tab", tab);
  }
};
