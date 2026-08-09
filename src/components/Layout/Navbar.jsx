import React, { useState, useEffect, useRef } from "react";
import { Home, Grid, User, ShoppingCart, LogOut, Heart, Truck, Bell, Sun, Moon, ArrowRight } from "lucide-react";
import Logo from "./Logo";
import NotificationsPopover from "./NotificationsPopover";
import Tooltip from "../Common/Tooltip";
import TopAnnouncementBar from "../Common/TopAnnouncementBar";

export default function Navbar(props) {
  const {
    activeTab = "home",
    setActiveTab = () => {},
    onGoBack,
    canGoBack,
    cartCount = 0,
    setIsCartOpen = props.onCartClick || (() => {}),
    user = props.currentUser,
    onLogout = props.handleLogout || (() => {}),
    lang = "ar",
    toggleLang = () => {},
    themeMode = "light",
    toggleTheme = () => {},
    notifications = [],
    onMarkNotificationRead = props.handleMarkNotificationRead || (() => {}),
    onMarkAllNotificationsRead = props.handleMarkAllNotificationsRead || (() => {}),
    onClearNotifications = props.handleClearNotifications || (() => {}),
    onSelectNotification = props.handleSelectNotification || (() => {})
  } = props;
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const bellButtonRef = useRef(null);

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const tabs = [
    { id: "home", label: lang === "ar" ? "الرئيسية" : "Home", icon: Home },
    { id: "categories", label: lang === "ar" ? "المتجر" : "Store", icon: Grid },
    { id: "wishlist", label: lang === "ar" ? "المفضلة" : "Wishlist", icon: Heart },
    { id: "account", label: lang === "ar" ? "حسابي" : "My Account", icon: User }
  ];

  return (
    <>
      <header
        id="site-header"
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ease-in-out border-b py-0.5 ${
          isScrolled
            ? "bg-[#072d5c]/85 backdrop-blur-xl border-blue-900/10 shadow-sm"
            : "bg-[#072d5c] border-blue-900/20 shadow-md"
        }`}
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        <TopAnnouncementBar lang={lang} />
        <div className="max-w-7xl xl:max-w-[1450px] 2xl:max-w-[1700px] 3xl:max-w-[1920px] mx-auto px-4 sm:px-6">
          <div className="flex items-center h-10 sm:h-11 transition-all duration-300">
            
            {/* Right Side: Back Button & Logo (Takes 1/3 space) */}
            <div className="flex-1 flex items-center justify-start gap-2.5 transition-all duration-300">
              {(canGoBack || activeTab !== "home") && (
                <button
                  onClick={onGoBack || (() => setActiveTab("home"))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/30 font-black text-xs transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm"
                  title={lang === "ar" ? "الرجوع للصفحة السابقة" : "Go back"}
                >
                  <ArrowRight className={`w-3.5 h-3.5 ${lang === "ar" ? "" : "rotate-180"}`} />
                  <span>{lang === "ar" ? "رجوع" : "Back"}</span>
                </button>
              )}

              <div 
                onClick={() => setActiveTab("home")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Logo className="h-7 sm:h-8 transition-all duration-300 rounded shadow-inner" lightText={true} />
                <div className="hidden lg:flex flex-col text-right select-none">
                  <span className="font-extrabold tracking-tight text-white text-[11px] sm:text-[13px] leading-tight">
                    NileTechno Store
                  </span>
                  <span className="text-blue-200/80 font-medium flex items-center gap-1 text-[9px] sm:text-[10px] leading-tight">
                    <span>{lang === "ar" ? "مرحباً بك!" : "Welcome!"}</span>
                    <span className="animate-wiggle">👋</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Navigation Tabs (Perfectly Centered) */}
            <nav className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 p-0.5 rounded-xl">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] lg:text-[11px] font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? "bg-[#0ea5e9] text-white shadow-md shadow-blue-500/10"
                        : "text-blue-100 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Left Side: Action Buttons & Profile (Takes 1/3 space) */}
            <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-2">
              {/* Theme Toggle */}
              {toggleTheme && (
                <button
                  onClick={toggleTheme}
                  className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all cursor-pointer text-amber-300 shrink-0"
                >
                  {themeMode === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-blue-100" />}
                </button>
              )}

              {/* Language Switcher */}
              <button
                onClick={toggleLang}
                className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all cursor-pointer text-white font-bold text-[9px] sm:text-[10px] font-mono shrink-0"
              >
                {lang === "ar" ? "EN" : "عربي"}
              </button>

              {/* Notifications */}
              <div className="relative shrink-0">
                <button
                  ref={bellButtonRef}
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all cursor-pointer text-white"
                >
                  <Bell className="w-4 h-4 text-blue-100" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white ring-1 ring-[#072d5c]">
                      {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                    </span>
                  )}
                </button>
                {isNotificationsOpen && (
                  <NotificationsPopover
                    notifications={notifications}
                    onClose={() => setIsNotificationsOpen(false)}
                    onMarkRead={onMarkNotificationRead}
                    onMarkAllRead={onMarkAllNotificationsRead}
                    onClearAll={onClearNotifications}
                    onSelectNotification={onSelectNotification}
                    triggerRef={bellButtonRef}
                    lang={lang}
                  />
                )}
              </div>

              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="hidden md:flex relative w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 items-center justify-center transition-all cursor-pointer text-white"
              >
                <ShoppingCart className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white ring-1 ring-[#072d5c]">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* User Account */}
              {user ? (
                <div className="flex items-center gap-2 bg-white/10 border border-white/10 px-2.5 py-1 rounded-xl hover:bg-white/15 transition-all">
                  <div className="flex items-center gap-2">
                    {/* Avatar on the Right */}
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500 text-white border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-sans font-black text-[10px] sm:text-[11px]">{user.name ? user.name.charAt(0).toUpperCase() : "U"}</span>
                      )}
                    </div>
                    {/* Name and Logout on the Left */}
                    <div className="hidden sm:flex items-center gap-2 text-right">
                      <span className="text-[10px] sm:text-[11px] font-bold text-white whitespace-nowrap">{user.name}</span>
                      <div className="w-px h-3 bg-white/20"></div>
                      <button 
                        onClick={onLogout} 
                        className="text-[9px] sm:text-[10px] font-bold text-rose-300 hover:text-rose-200 hover:underline transition-colors cursor-pointer"
                      >
                        {lang === "ar" ? "خروج" : "Logout"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab("account")}
                  className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{lang === "ar" ? "تسجيل الدخول" : "Login"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Placeholder */}
      <div className="h-11 sm:h-12"></div>

      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-3 left-3 right-3 z-50 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border border-slate-200/80 dark:border-slate-800 shadow-lg px-2 py-1 rounded-full max-w-[340px] mx-auto" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="flex items-center justify-between h-9 w-full">
          {[
            { id: "home", label: lang === "ar" ? "الرئيسية" : "Home", icon: Home },
            { id: "categories", label: lang === "ar" ? "المتجر" : "Store", icon: Grid },
            { id: "cart", label: lang === "ar" ? "السلة" : "Cart", icon: ShoppingCart, isCart: true },
            { id: "wishlist", label: lang === "ar" ? "المفضلة" : "Wishlist", icon: Heart },
            { id: "account", label: lang === "ar" ? "حسابي" : "My Account", icon: User }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            if (isActive && !tab.isCart) {
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0ea5e9] text-white shadow-sm transition-all duration-200 cursor-pointer"
                >
                  <span className="text-[10px] font-bold leading-none">{tab.label}</span>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                </button>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.isCart) {
                    setIsCartOpen(true);
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer flex items-center justify-center rounded-full"
              >
                <Icon className="w-4 h-4" />
                {tab.isCart && cartCount > 0 && (
                  <span className="absolute top-0 right-0 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[7px] font-black text-white ring-1 ring-white">
                    {cartCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
