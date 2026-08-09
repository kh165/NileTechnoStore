import React, { useState, useEffect, useRef } from "react";
import { GeoService } from "../../lib/geoService";
import { storage } from "../../lib/storage";
import { isUserAdmin } from "../../lib/constants";
import { ErrorBoundary } from "../ErrorBoundary";
import InteractiveMap from "../Checkout/InteractiveMap";
import AdminDashboard from "./AdminDashboard";
import TrackTab from "./TrackTab";
import OrderTimeline from "./OrderTimeline";
import AccountAddressesSection from "./AccountAddressesSection";
import AccountProfileSection from "./AccountProfileSection";
import { 
  getAllOrdersFromFirestore, 
  deleteOrderFromFirestore, 
  getAllUsersFromFirestore, 
  updateUserRoleInFirestore,
  getReviewsFromFirestore,
  createReviewInFirestore
} from "../../lib/firebaseService";
import { 
  User, 
  MapPin, 
  HelpCircle, 
  LogOut, 
  Star, 
  Heart, 
  ShoppingBag, 
  ChevronLeft, 
  Edit,
  CheckCircle2,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  Home,
  Building2,
  Plus,
  X,
  Compass,
  Navigation,
  Loader2,
  Search,
  ZoomIn,
  ZoomOut,
  Sun,
  Moon,
  Globe,
  Camera,
  Image,
  Trash2,
  ShieldAlert,
  ListFilter,
  Truck,
  Calendar,
  DollarSign,
  Users,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const getStatusBadge = (status) => {
  const normStatus = (status || "PENDING").toUpperCase();
  switch (normStatus) {
    case "PENDING":
      return (
        <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-100 shrink-0 inline-flex items-center justify-center whitespace-nowrap">
          قيد المعالجة المبدئية
        </span>
      );
    case "PREPARING":
      return (
        <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 shrink-0 inline-flex items-center justify-center whitespace-nowrap">
          قيد التحضير والتجهيز
        </span>
      );
    case "SHIPPED":
    case "DELIVERING":
      return (
        <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 animate-pulse shrink-0 inline-flex items-center justify-center whitespace-nowrap">
          جاري التوصيل مع المندوب
        </span>
      );
    case "COMPLETED":
    case "DELIVERED":
      return (
        <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0 inline-flex items-center justify-center whitespace-nowrap">
          تم التسليم واكتمل الطلب
        </span>
      );
    case "CANCELED":
    case "CANCELLED":
      return (
        <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-100 shrink-0 inline-flex items-center justify-center whitespace-nowrap">
          تم إلغاء الطلب
        </span>
      );
    default:
      return (
        <span className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-100 shrink-0 inline-flex items-center justify-center whitespace-nowrap">
          {status}
        </span>
      );
  }
};

const VALID_SUBSECTIONS = ['profile', 'addresses', 'help', 'orders', 'track', 'admin-orders'];

function MyAccount(props) {
  const {
    user = props.currentUser,
    orders = [],
    onLogout = () => {},
    onUpdateUser = () => {},
    storeCurrency = "ج.م",
    onReorder,
    lang = "ar",
    toggleLang,
    themeMode = "light",
    toggleTheme,
    onUpdateOrderStatus
  } = props;
  const [activeSubSection, setActiveSubSectionState] = useState(null);

  const isSubSectionActive = Boolean(activeSubSection && VALID_SUBSECTIONS.includes(activeSubSection));

  const setActiveSubSection = (val) => {
    const cleanVal = (val && VALID_SUBSECTIONS.includes(val)) ? val : null;
    setActiveSubSectionState(cleanVal);
    const newHash = cleanVal === "admin-orders" ? "#admin" : (cleanVal ? `#account/${cleanVal}` : "#account");
    if (window.location.hash !== newHash) {
      window.history.pushState({ tab: cleanVal === "admin-orders" ? "admin" : "account", sub: cleanVal }, "", newHash);
    }
  };

  useEffect(() => {
    const syncSubSectionFromHash = () => {
      const raw = (window.location.hash || "").replace(/^#\/?/, "").trim();
      const parts = raw.split("/").map(p => p.trim());
      if (parts[0] === "admin") {
        setActiveSubSectionState("admin-orders");
      } else if (parts[0] === "track") {
        setActiveSubSectionState("track");
      } else if (parts[0] === "account") {
        const cand = parts[1];
        if (cand && VALID_SUBSECTIONS.includes(cand)) {
          setActiveSubSectionState(cand);
        } else {
          setActiveSubSectionState(null);
        }
      } else {
        setActiveSubSectionState(null);
      }
    };

    syncSubSectionFromHash();

    const handleSwitchSection = (e) => {
      const cand = e.detail;
      if (cand === "admin-orders" || cand === "admin") {
        setActiveSubSectionState("admin-orders");
      } else if (cand && VALID_SUBSECTIONS.includes(cand)) {
        setActiveSubSectionState(cand);
      } else if (cand === null || cand === undefined || cand === "" || cand === "null" || cand === "undefined") {
        setActiveSubSectionState(null);
      } else {
        syncSubSectionFromHash();
      }
    };

    window.addEventListener("switch_account_subsection", handleSwitchSection);
    window.addEventListener("niletechno_switch_account_section", handleSwitchSection);
    window.addEventListener("hashchange", syncSubSectionFromHash);
    window.addEventListener("popstate", syncSubSectionFromHash);

    return () => {
      window.removeEventListener("switch_account_subsection", handleSwitchSection);
      window.removeEventListener("niletechno_switch_account_section", handleSwitchSection);
      window.removeEventListener("hashchange", syncSubSectionFromHash);
      window.removeEventListener("popstate", syncSubSectionFromHash);
    };
  }, []);
  const [username, setUsername] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const fileInputRef = useRef(null);

  const PRESET_AVATARS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia"
  ];

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setToastMessage("حجم الصورة كبير جداً! يرجى اختيار صورة أقل من 2 ميجابايت.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result;
      setAvatar(base64Data);
      
      const updatedUser = {
        ...user,
        avatar: base64Data
      };
      storage.setCurrentUser(updatedUser);
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      setToastMessage("تم تحديث صورة الحساب بنجاح!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAvatar = (e) => {
    if (e) e.stopPropagation();
    setAvatar("");
    const updatedUser = {
      ...user,
      avatar: ""
    };
    storage.setCurrentUser(updatedUser);
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
    setToastMessage("تم إزالة صورة الحساب الشخصية بنجاح!");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const [addresses, setAddresses] = useState(() => {
    const firestoreAddrs = user?.addresses;
    if (firestoreAddrs && firestoreAddrs.length > 0) return firestoreAddrs.filter(Boolean);
    return (storage.getSavedAddresses() || []).filter(Boolean);
  });
  const [selectedAddressId, setSelectedAddressId] = useState(() => {
    const firestoreAddrs = user?.addresses;
    const localAddrs = storage.getSavedAddresses() || [];
    const activeList = ((firestoreAddrs && firestoreAddrs.length > 0) ? firestoreAddrs : localAddrs).filter(Boolean);
    
    if (user?.address && activeList.length > 0) {
      const found = activeList.find(addr => addr && addr.details === user.address);
      if (found) return found.id;
    }
    if (activeList.length > 0 && activeList[0]) return activeList[0].id;
    return "";
  });

  useEffect(() => {
    if (user?.addresses) {
      const filtered = user.addresses.filter(Boolean);
      setAddresses(filtered);
      if (user.address && filtered.length > 0) {
        const found = filtered.find(addr => addr && addr.details === user.address);
        if (found) {
          setSelectedAddressId(found.id);
        }
      }
    }
  }, [user?.addresses, user?.address]);
  const [isAddAddressOpen, setIsAddAddressOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [newAddressTitle, setNewAddressTitle] = useState("");
  const [newAddressDetails, setNewAddressDetails] = useState("");
  const [newAddressType, setNewAddressType] = useState("home"); // "home" | "work" | "other"
  const [modalCoords, setModalCoords] = useState({ lat: 30.0444, lng: 31.2357 });

  const [notes, setNotes] = useState(() => storage.getCheckoutField("notes", ""));
  const [pinPos, setPinPos] = useState({ x: 50, y: 50 });
  const [isLocating, setIsLocating] = useState(false);
  const [locatingError, setLocatingError] = useState("");
  const [detectedAddress, setDetectedAddress] = useState("");

  useEffect(() => {
    storage.setCheckoutField("notes", notes);
  }, [notes]);

  useEffect(() => {
    storage.setSavedAddresses(addresses);
    if (addresses.length > 0 && !selectedAddressId) {
      const firstAddr = addresses.find(Boolean);
      if (firstAddr) {
        setSelectedAddressId(firstAddr.id);
      }
    }
  }, [addresses]);

  useEffect(() => {
    const selected = addresses.find(addr => addr && addr.id === selectedAddressId);
    if (selected) {
      setAddress(selected.details);
    } else {
      setAddress("");
    }
  }, [selectedAddressId, addresses]);

  const [allReviews, setAllReviews] = useState([]);
  const [activeReviewKey, setActiveReviewKey] = useState(null); // "orderId-productId"
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // User Order Cancellation States
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);

  const handleUserCancelOrder = async (orderId) => {
    setIsCancellingOrder(true);
    try {
      if (onUpdateOrderStatus) {
        await onUpdateOrderStatus(orderId, "CANCELED");
        setToastMessage("تم إلغاء الطلب بنجاح!");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
      }
    } catch (err) {
      console.error("Failed to cancel order:", err);
      setToastMessage("حدث خطأ أثناء محاولة إلغاء الطلب.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } finally {
      setIsCancellingOrder(false);
      setCancellingOrderId(null);
    }
  };

  const isAdmin = isUserAdmin(user);

  const fetchAllReviews = async () => {
    try {
      // جلب كل التقييمات من Firestore مباشرةً — لا يوجد fallback محلي
      const data = await getReviewsFromFirestore(null, true);
      setAllReviews(data || []);
    } catch (err) {
      console.error("Error fetching reviews from Firestore:", err);
      setAllReviews([]);
    }
  };

  useEffect(() => {
    fetchAllReviews();
  }, []);

  // Customer Loyalty Stats
  const stats = [
    { label: "المفضلة", value: user?.favoritesCount || "0", icon: Heart, color: "text-rose-500 bg-rose-50" },
    { label: "طلباتي", value: orders ? orders.length : "0", icon: ShoppingBag, color: "text-blue-500 bg-blue-50" }
  ];

  const displayOrders = orders && orders.length > 0 ? orders : [];

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updatedUser = {
      ...user,
      name: username,
      email: email,
      phone: phone,
      address: address,
      avatar: avatar
    };
    storage.setCurrentUser(updatedUser);
    if (onUpdateUser) {
      onUpdateUser(updatedUser);
    }
    setToastMessage("تم حفظ بيانات الحساب بنجاح!");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    setActiveSubSection(null);
  };

  const closeAddressModal = () => {
    setIsAddAddressOpen(false);
    setEditingAddressId(null);
    setNewAddressTitle("");
    setNewAddressDetails("");
    setNewAddressType("home");
  };

  const handleAddNewAddress = (e) => {
    e.preventDefault();
    if (!newAddressTitle.trim() || !newAddressDetails.trim()) {
      return;
    }
    
    let updated;
    if (editingAddressId) {
      updated = addresses.map(addr => {
        if (addr.id === editingAddressId) {
          return {
            ...addr,
            title: newAddressTitle.trim(),
            details: newAddressDetails.trim(),
            type: newAddressType,
            lat: modalCoords.lat,
            lng: modalCoords.lng
          };
        }
        return addr;
      });
      setAddresses(updated);
      setSelectedAddressId(editingAddressId);
      setEditingAddressId(null);
      setToastMessage("تم تعديل العنوان بنجاح!");
    } else {
      const newAddressObj = {
        id: "addr_" + Date.now(),
        title: newAddressTitle.trim(),
        details: newAddressDetails.trim(),
        type: newAddressType,
        lat: modalCoords.lat,
        lng: modalCoords.lng
      };
      updated = [...addresses, newAddressObj];
      setAddresses(updated);
      setSelectedAddressId(newAddressObj.id);
      setToastMessage("تم إضافة عنوان جديد بنجاح!");
    }
    
    // Persist list
    storage.setSavedAddresses(updated);
    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        addresses: updated
      });
    }

    // Reset form fields
    setNewAddressTitle("");
    setNewAddressDetails("");
    setNewAddressType("home");
    setIsAddAddressOpen(false);

    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleDeleteAddress = (id, e) => {
    e.stopPropagation();
    const updated = addresses.filter(addr => addr.id !== id);
    setAddresses(updated);
    
    let nextSelectedId = selectedAddressId;
    if (selectedAddressId === id && updated.length > 0) {
      nextSelectedId = updated[0].id;
      setSelectedAddressId(nextSelectedId);
    } else if (updated.length === 0) {
      nextSelectedId = "";
      setSelectedAddressId("");
    }
    
    storage.setSavedAddresses(updated);
    
    const activeSelectedAddr = updated.find(a => a.id === nextSelectedId);
    const nextDetails = activeSelectedAddr ? activeSelectedAddr.details : "";

    if (onUpdateUser) {
      onUpdateUser({
        ...user,
        address: nextDetails,
        addresses: updated
      });
    }

    setToastMessage("تم حذف العنوان بنجاح!");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const isDashboardActive = activeSubSection === 'admin-orders';
  const containerWidthClass = activeSubSection === 'admin-orders' 
    ? 'max-w-7xl px-4 sm:px-6 lg:px-8' 
    : (activeSubSection === 'track' || activeSubSection === 'orders')
      ? 'max-w-3xl px-4 sm:px-6'
      : 'max-w-lg';

  return (
    <div className={`w-full ${containerWidthClass} mx-auto pb-16 pt-1 px-3 sm:px-6 font-sans relative text-right`} dir="rtl">
      
      {/* Top Banner (Avatar & Name Card - Redesigned to be highly organized & compact) */}
      <div className="relative bg-gradient-to-br from-slate-900 to-blue-950 text-white pt-6 pb-12 px-6 rounded-3xl shadow-lg overflow-hidden">
        {/* Abstract futuristic background decorations */}
        <div className="absolute top-[-30px] right-[-30px] w-48 h-48 rounded-full bg-blue-500/10 blur-2xl"></div>
        <div className="absolute bottom-[-30px] left-[-30px] w-36 h-36 rounded-full bg-emerald-500/10 blur-2xl"></div>
        
        <div className="relative flex flex-col items-center">
          {/* Circular avatar wrapper */}
          <div className="relative group">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              accept="image/*" 
              className="hidden" 
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-18 h-18 rounded-full bg-slate-100 text-blue-950 flex items-center justify-center font-black text-2xl shadow-xl border-4 border-slate-800 overflow-hidden relative cursor-pointer group-hover:border-blue-500 transition-all"
              title="تغيير صورة الحساب"
            >
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-slate-800 font-sans font-black">{username ? username.charAt(0).toUpperCase() : "U"}</span>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 left-0 bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-full shadow-lg border-2 border-slate-900 transition-all hover:scale-110 active:scale-95 cursor-pointer"
              title="رفع صورة جديدة"
            >
              <Camera className="w-3 h-3" />
            </button>
            {avatar && (
              <button 
                type="button"
                onClick={handleDeleteAvatar}
                className="absolute top-0 right-0 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full shadow-lg border-2 border-slate-900 transition-all hover:scale-110 active:scale-95 cursor-pointer z-10"
                title="حذف الصورة"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          <h2 className="mt-3 text-lg font-black tracking-wide font-sans text-white">{username}</h2>
          <span className="mt-2.5 inline-flex items-center gap-1.5 bg-white/10 text-white/90 text-[11px] px-3.5 py-1 rounded-full border border-white/10 backdrop-blur-md font-mono">
            <Mail className="w-3.5 h-3.5" />
            <span>{email}</span>
          </span>
        </div>
      </div>

      {/* Customer Quick Stats (Overlapping Card - Visible on personal profile, hidden when Admin Dashboard is active) */}
      {!isDashboardActive && (
        <div className="px-4 -mt-8 relative z-10">
          <div className="grid grid-cols-2 gap-3 bg-white p-4 rounded-2xl shadow-md border border-slate-100">
            {stats.map((stat, idx) => {
              const IconComponent = stat.icon;
              const isOrders = stat.label === "طلباتي";
              return (
                <div 
                  key={idx} 
                  onClick={() => {
                    if (isOrders) {
                      setActiveSubSection('orders');
                    }
                  }}
                  className={`flex flex-col items-center justify-center text-center p-2 rounded-2xl hover:bg-slate-50 transition-colors ${isOrders ? 'cursor-pointer border border-blue-50 bg-blue-50/10' : ''}`}
                >
                  <div className={`p-2 rounded-xl ${stat.color} mb-1.5`}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className="text-base font-black text-slate-800 font-mono">{stat.value}</span>
                  <span className="text-[10px] font-bold text-slate-400 mt-0.5">{stat.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content Sections */}
      <div className={`px-4 space-y-6 ${isAdmin || isDashboardActive ? 'mt-4' : 'mt-6'}`}>
        {!isSubSectionActive ? (
          <>
            {/* List of Recent Orders */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                  <h3 className="text-sm font-extrabold text-slate-800">أحدث الطلبات</h3>
                </div>
                {displayOrders.length > 0 && (
                  <button 
                    onClick={() => setActiveSubSection('orders')}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>عرض الكل ({displayOrders.length})</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {displayOrders.slice(0, 3).map((order) => {
                  return (
                    <div 
                      key={order.id} 
                      className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between transition-colors hover:bg-slate-50/50"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-800">طلب رقم #{order.orderNumber}</span>
                          {getStatusBadge(order.status)}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1.5">التاريخ: {order.date || new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-black text-blue-700 font-mono">
                          {order.total} {storeCurrency}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Account Settings Menu List */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-1.5 h-4.5 bg-blue-600 rounded-full"></div>
                <h3 className="text-xs font-black text-slate-800 font-sans">خيارات وإعدادات حسابي</h3>
              </div>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs divide-y divide-slate-100 overflow-hidden">
                
                {/* Admin Dashboard Control Button */}
                {isAdmin && (
                  <button 
                    onClick={() => setActiveSubSection('admin-orders')}
                    className="w-full flex items-center justify-between py-2.5 px-3.5 bg-emerald-50/40 hover:bg-emerald-50 transition-colors text-right cursor-pointer border-r-4 border-emerald-500"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-full bg-emerald-100 text-emerald-700">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[11px] font-black text-slate-800">لوحة تحكم إدارة المتجر</span>
                        <span className="text-[9px] text-emerald-600 font-bold">متابعة جميع طلبات العملاء والتحكم بالحالة</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800">المدير</span>
                      <ChevronLeft className="w-4 h-4 text-emerald-500" />
                    </div>
                  </button>
                )}
                
                {/* Account Details Form */}
                <button 
                  onClick={() => setActiveSubSection('profile')}
                  className="w-full flex items-center justify-between py-2.5 px-3.5 hover:bg-slate-50 transition-colors text-right cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-full bg-purple-50 text-purple-600">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">بيانات الحساب الشخصية</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>

                {/* Shipping Addresses */}
                <button 
                  onClick={() => setActiveSubSection('addresses')}
                  className="w-full flex items-center justify-between py-2.5 px-3.5 hover:bg-slate-50 transition-colors text-right cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-full bg-teal-50 text-teal-600">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">العناوين المحفوظة للتوصيل</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>

                {/* Past Orders List */}
                <button 
                  onClick={() => setActiveSubSection('orders')}
                  className="w-full flex items-center justify-between py-2.5 px-3.5 hover:bg-slate-50 transition-colors text-right cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700">سجل طلباتي السابقة</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>

                {/* Track Order Status */}
                <button 
                  onClick={() => setActiveSubSection('track')}
                  className="w-full flex items-center justify-between py-2.5 px-3.5 bg-blue-50/20 hover:bg-blue-50/50 transition-colors text-right cursor-pointer border-r-4 border-blue-600"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-700">
                      <Truck className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[11px] font-black text-slate-800">تتبع حالة ومسار طلبك</span>
                      <span className="text-[9px] text-blue-600 font-bold">متابعة الشحنة لايف ومعرفة موعد وصول المندوب</span>
                    </div>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-blue-600" />
                </button>

                {/* Help and Support */}
                <button 
                  onClick={() => setActiveSubSection('help')}
                  className="w-full flex items-center justify-between py-2.5 px-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-right cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">المساعدة والدعم الفني</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                </button>

                {/* Theme Mode Option */}
                <button 
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between py-2.5 px-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-right cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                      {themeMode === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                        {lang === "ar" ? "مظهر التطبيق" : "App Appearance"}
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-400 font-bold">
                        {themeMode === "dark" 
                          ? (lang === "ar" ? "الوضع الداكن الناعم" : "Soft Dark Mode") 
                          : (lang === "ar" ? "الوضع المضيء الكلاسيكي" : "Classic Light Mode")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                      {themeMode === "dark" 
                        ? (lang === "ar" ? "تفعيل المضيء" : "Light Mode") 
                        : (lang === "ar" ? "تفعيل الداكن" : "Dark Mode")}
                    </span>
                    <ChevronLeft className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  </div>
                </button>

                {/* Logout Action Button */}
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center justify-between py-2.5 px-3.5 hover:bg-rose-50/50 transition-colors text-right cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-full bg-rose-50 text-rose-600">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-rose-600">تسجيل الخروج من الحساب</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-rose-400" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className={`bg-white ${isDashboardActive ? 'p-3 sm:p-8' : 'p-6'} rounded-[24px] border border-slate-100 shadow-md`}>
            
            {/* Sub-Section Back Navigation Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <h3 className="text-sm font-extrabold text-slate-800">
                {activeSubSection === 'profile' && "تعديل بيانات الحساب"}
                {activeSubSection === 'addresses' && "العناوين المحفوظة للتوصيل"}
                {activeSubSection === 'help' && "المساعدة والدعم الفني"}
                {activeSubSection === 'orders' && "سجل طلباتي السابقة"}
                {activeSubSection === 'track' && "تتبع حالة ومسار طلبك"}
                {activeSubSection === 'admin-orders' && "لوحة تحكم إدارة الطلبات (المدير)"}
              </h3>
              
              {/* CLEAR PROMINENT BACK BUTTON */}
              <button 
                onClick={() => setActiveSubSection(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <span>{lang === "ar" ? "رجوع للخلف" : "Go Back"}</span>
                <ArrowRight className={`w-4 h-4 ${lang === "ar" ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Profile form */}
            {activeSubSection === 'profile' && (
              <AccountProfileSection
                user={user}
                username={username}
                setUsername={setUsername}
                email={email}
                setEmail={setEmail}
                phone={phone}
                setPhone={setPhone}
                avatar={avatar}
                setAvatar={setAvatar}
                handleAvatarChange={handleAvatarChange}
                handleDeleteAvatar={handleDeleteAvatar}
                handleSaveProfile={handleSaveProfile}
                PRESET_AVATARS={PRESET_AVATARS}
                setToastMessage={setToastMessage}
                setShowToast={setShowToast}
              />
            )}

            {/* Addresses selection */}
            {activeSubSection === 'addresses' && (
              <AccountAddressesSection
                addresses={addresses}
                selectedAddressId={selectedAddressId}
                handleSelectAddress={(id) => {
                  setSelectedAddressId(id);
                  const addr = addresses.find((a) => a.id === id);
                  if (addr) {
                    const updatedUser = {
                      ...user,
                      address: addr.details
                    };
                    storage.setCurrentUser(updatedUser);
                    if (onUpdateUser) {
                      onUpdateUser(updatedUser);
                    }
                  }
                }}
                handleDeleteAddress={handleDeleteAddress}
                setEditingAddressId={setEditingAddressId}
                setNewAddressTitle={setNewAddressTitle}
                setNewAddressDetails={setNewAddressDetails}
                setNewAddressType={setNewAddressType}
                setModalCoords={setModalCoords}
                setIsAddAddressOpen={setIsAddAddressOpen}
                isAddAddressOpen={isAddAddressOpen}
                editingAddressId={editingAddressId}
                closeAddressModal={closeAddressModal}
                handleAddNewAddress={handleAddNewAddress}
                newAddressTitle={newAddressTitle}
                newAddressDetails={newAddressDetails}
                modalCoords={modalCoords}
                newAddressType={newAddressType}
                notes={notes}
                setNotes={setNotes}
                onConfirmDefaultAddress={() => {
                  const selected = addresses.find(addr => addr.id === selectedAddressId);
                  if (selected) {
                    const updatedUser = {
                      ...user,
                      address: selected.details
                    };
                    storage.setCurrentUser(updatedUser);
                    if (onUpdateUser) {
                      onUpdateUser(updatedUser);
                    }
                    setToastMessage("تم تعيين العنوان الافتراضي بنجاح!");
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 2500);
                    setActiveSubSection(null);
                  } else {
                    setToastMessage("يرجى اختيار أحد العناوين أولاً!");
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 2500);
                  }
                }}
              />
            )}

            {/* Help & Support (Using NileTechno config info@niletechno.com) */}
            {activeSubSection === 'help' && (
              <div className="space-y-4 text-right">
                <div className="space-y-3">
                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50">
                    <h4 className="text-xs font-bold text-slate-800 mb-1">كيف يمكنني تتبع الطلب؟</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      بمجرد إتمام عملية الطلب بنجاح، ستتلقى بريداً إلكترونياً بالتفاصيل ورقم الطلب. كما يمكنك مراجعة حالة الطلب في قسم "أحدث الطلبات" مباشرة.
                    </p>
                  </div>
                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50">
                    <h4 className="text-xs font-bold text-slate-800 mb-1">ما هي سياسة الاستبدال والضمان؟</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      تخضع جميع المنتجات لسياسة الضمان وحماية المستهلك المعتمدة.
                    </p>
                  </div>
                </div>
                
                {/* NileTechno official support email update */}
                <div className="text-center pt-5 border-t border-slate-100">
                  <p className="text-[11px] text-slate-400 font-bold">للدعم الفني والاستشارات المباشرة، يرجى مراسلتنا:</p>
                  <a 
                    href="mailto:info@niletechno.com" 
                    className="text-sm font-black text-blue-600 hover:text-blue-700 block mt-1.5 font-mono tracking-wide hover:underline"
                  >
                    info@niletechno.com
                  </a>
                </div>
              </div>
            )}

            {/* Orders list */}
            {activeSubSection === 'orders' && (
              <div className="space-y-4">
                {displayOrders.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-xs font-bold text-slate-600">لا توجد طلبات سابقة مسجلة حالياً.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayOrders.map((order) => {
                      return (
                        <div 
                          key={order.id} 
                          className="border border-slate-100 rounded-2xl bg-slate-50 p-4 space-y-3 text-right"
                        >
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                            <div>
                              <span className="text-xs font-black text-slate-800 block">طلب رقم #{order.orderNumber}</span>
                              <span className="text-[10px] text-slate-400 mt-1 block">التاريخ: {order.date || new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            {getStatusBadge(order.status)}
                          </div>

                          {/* Visual Order Tracking Timeline */}
                          <div className="py-1">
                            <OrderTimeline status={order.status} />
                          </div>

                          {/* Ordered Items List */}
                          <div className="space-y-2.5">
                            {order.items && order.items.map((item, i) => {
                              if (!item) return null;
                              const prodId = item.productId || item.product?.id || item.id;
                              if (!prodId) return null;
                              const existingReview = allReviews.find(r => r && r.orderId === order.id && String(r.productId) === String(prodId));
                              const editorKey = `${order.id}-${prodId}`;
                              const isEditing = activeReviewKey === editorKey;

                              const handleSaveLocalReview = async () => {
                                if (isSubmittingReview) return;
                                setIsSubmittingReview(true);
                                try {
                                  // Save directly to Firestore
                                  await createReviewInFirestore({
                                    productId: prodId,
                                    orderId: order.id,
                                    rating: reviewRating,
                                    comment: reviewComment,
                                    customerName: order.customerName || user?.name || "عميل المتجر"
                                  });

                                  // حفظ التقييم في Firestore فقط — بدون أي استدعاء محلي
                                  setToastMessage("تم تسجيل تقييمك بنجاح!");
                                  setShowToast(true);
                                  setTimeout(() => setShowToast(false), 2500);
                                  setActiveReviewKey(null);
                                  setReviewComment("");
                                  fetchAllReviews();
                                } catch (err) {
                                  console.error("Error saving review:", err);
                                  setToastMessage("حدث خطأ أثناء حفظ التقييم.");
                                  setShowToast(true);
                                  setTimeout(() => setShowToast(false), 2500);
                                } finally {
                                  setIsSubmittingReview(false);
                                }
                              };

                              return (
                                <div key={i} className="bg-white p-3 rounded-xl border border-slate-100 space-y-2">
                                  <div className="flex items-center gap-3">
                                    {(item.product?.image || item.image) && (
                                      <img 
                                        src={item.product?.image || item.image} 
                                        alt={item.product?.name || item.name || "منتج"} 
                                        className="w-10 h-10 rounded-lg object-cover shrink-0" 
                                        referrerPolicy="no-referrer"
                                      />
                                    )}
                                    <div className="flex-1 min-w-0 text-right">
                                      <h5 className="text-[11px] font-bold text-slate-800 truncate">{item.product?.name || item.name || "منتج"}</h5>
                                      <span className="text-[10px] text-slate-400 font-medium font-mono">
                                        {item.quantity} × {item.price} {storeCurrency}
                                      </span>
                                    </div>
                                    
                                    {/* Small badge or button depending on review state */}
                                    {!existingReview && !isEditing && (
                                      <button
                                        onClick={() => {
                                          setActiveReviewKey(editorKey);
                                          setReviewRating(5);
                                          setReviewComment("");
                                        }}
                                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
                                      >
                                        تقييم المنتج
                                      </button>
                                    )}
                                  </div>

                                  {/* Existing review display */}
                                  {existingReview && (
                                    <div className="bg-slate-50/70 p-2 rounded-lg border border-slate-100/50 text-[10px] text-slate-600 space-y-1">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-0.5">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <Star 
                                              key={star} 
                                              className={`w-3 h-3 ${star <= existingReview.rating ? "text-amber-500 fill-amber-500" : "text-slate-200"}`} 
                                            />
                                          ))}
                                        </div>
                                        <span className="text-[9px] text-slate-400 font-medium font-mono">{existingReview.date}</span>
                                      </div>
                                      {existingReview.comment && (
                                        <p className="text-slate-500 font-medium italic mt-0.5">"{existingReview.comment}"</p>
                                      )}
                                    </div>
                                  )}

                                  {/* Review Editor Panel */}
                                  {isEditing && (
                                    <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/60 text-right space-y-2 animate-fade-in">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-600">ما هو تقييمك للمنتج؟</span>
                                        
                                        {/* Star rating selector */}
                                        <div className="flex items-center gap-1">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                              key={star}
                                              type="button"
                                              onClick={() => setReviewRating(star)}
                                              className="cursor-pointer hover:scale-110 transition-transform"
                                            >
                                              <Star 
                                                className={`w-4 h-4 ${star <= reviewRating ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} 
                                              />
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Optional text feedback */}
                                      <div>
                                        <textarea
                                          value={reviewComment}
                                          onChange={(e) => setReviewComment(e.target.value)}
                                          placeholder="اكتب تعليقك على جودة المنتج وسرعة التوصيل هنا (اختياري)..."
                                          className="w-full text-[10px] bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 outline-none resize-none font-medium h-12 text-right"
                                        />
                                      </div>

                                      <div className="flex justify-end gap-1.5">
                                        <button
                                          onClick={() => setActiveReviewKey(null)}
                                          className="px-2.5 py-1 text-[9px] font-bold text-slate-500 bg-white hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
                                        >
                                          إلغاء
                                        </button>
                                        <button
                                          onClick={handleSaveLocalReview}
                                          disabled={isSubmittingReview}
                                          className="px-3 py-1 text-[9px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer disabled:opacity-50"
                                        >
                                          {isSubmittingReview ? "جاري الإرسال..." : "إرسال التقييم"}
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Order Summary Pricing */}
                          <div className="border-t border-slate-200/60 pt-3 space-y-1 text-[11px] font-bold text-slate-500">
                            <div className="flex justify-between">
                              <span>المجموع الفرعي:</span>
                              <span className="font-mono text-slate-700">{order.subtotal || (order.total - (order.shippingCost || 0))} {storeCurrency}</span>
                            </div>
                            {order.shippingCost > 0 && (
                              <div className="flex justify-between">
                                <span>تكلفة التوصيل ({order.shippingLocationName}):</span>
                                <span className="font-mono text-slate-700">+{order.shippingCost} {storeCurrency}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-slate-200/40 pt-2 text-xs text-slate-800 font-extrabold">
                              <span>المجموع الكلي للطلب:</span>
                              <span className="font-mono text-blue-700">{order.total} {storeCurrency}</span>
                            </div>
                          </div>

                          {/* Delivery Address and payment info */}
                          <div className="bg-white/60 p-3 rounded-xl border border-slate-100 text-[10px] text-slate-500 leading-relaxed font-medium space-y-1">
                            <div>
                              <strong className="text-slate-700">العميل:</strong> {order.customerName} ({order.customerPhone})
                            </div>
                            <div>
                              <strong className="text-slate-700">عنوان التوصيل:</strong> {order.customerAddress}
                            </div>
                            <div>
                              <strong className="text-slate-700">طريقة الدفع:</strong> {order.paymentMethod}
                            </div>
                            {order.customerNotes && (
                              <div>
                                <strong className="text-slate-700">ملاحظات:</strong> {order.customerNotes}
                              </div>
                            )}
                          </div>

                          {/* Re-order Action Button */}
                          {onReorder && (
                            <button
                              onClick={() => {
                                onReorder(order.items);
                              }}
                              className="w-full flex items-center justify-center gap-2 mt-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md hover:shadow-blue-100 transition-all active:scale-95 cursor-pointer animate-fade-in"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>إعادة شراء منتجات هذا الطلب</span>
                            </button>
                          )}

                          {/* Cancel Order Action */}
                          {order.status && (order.status.toUpperCase() === "PENDING" || order.status.toUpperCase() === "PREPARING") && (
                            <div className="border-t border-slate-100/80 pt-3 mt-3">
                              {cancellingOrderId === order.id ? (
                                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-right space-y-2.5 animate-fade-in font-sans">
                                  <p className="text-[11px] font-bold text-rose-800 leading-relaxed">
                                    هل أنت متأكد من رغبتك في إلغاء هذا الطلب نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
                                  </p>
                                  <div className="flex justify-end gap-2">
                                    <button
                                      disabled={isCancellingOrder}
                                      onClick={() => setCancellingOrderId(null)}
                                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-700 cursor-pointer transition-colors"
                                    >
                                      تراجع عن الإلغاء
                                    </button>
                                    <button
                                      disabled={isCancellingOrder}
                                      onClick={() => handleUserCancelOrder(order.id)}
                                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black cursor-pointer transition-all flex items-center gap-1 active:scale-95"
                                    >
                                      {isCancellingOrder && <Loader2 className="w-3 h-3 animate-spin text-white" />}
                                      <span>نعم، إلغاء الطلب</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setCancellingOrderId(order.id)}
                                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs font-black rounded-xl border border-rose-200/60 shadow-xs hover:border-rose-300 transition-all active:scale-95 cursor-pointer animate-fade-in"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>إلغاء هذا الطلب</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Admin Orders Dashboard Section */}
            {activeSubSection === 'admin-orders' && (
              <ErrorBoundary>
                <AdminDashboard 
                  user={user}
                  storeCurrency={storeCurrency}
                  onUpdateOrderStatus={onUpdateOrderStatus}
                  getAllOrdersFromFirestore={getAllOrdersFromFirestore}
                  deleteOrderFromFirestore={deleteOrderFromFirestore}
                  getAllUsersFromFirestore={getAllUsersFromFirestore}
                  updateUserRoleInFirestore={updateUserRoleInFirestore}
                  lang={lang}
                />
              </ErrorBoundary>
            )}

            {/* Track Order Status Section */}
            {activeSubSection === 'track' && (
              <TrackTab 
                isEmbedded={true}
                lang={lang}
                storeCurrency={storeCurrency}
              />
            )}
          </div>
        )}
      </div>



      {/* Toast Alert */}
      {showToast && (
        <div className="fixed bottom-6 right-4 left-4 z-[9999] bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-center gap-3 border border-slate-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

class AccountErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("MyAccount caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-lg mx-auto bg-white dark:bg-slate-900 p-6 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-md text-center py-12 text-right" dir="rtl">
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-2">عذراً، حدث خطأ أثناء تحميل بيانات الحساب</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
            حدث خطأ غير متوقع أثناء عرض هذه الصفحة. يرجى محاولة إعادة تحميل الصفحة أو تسجيل الخروج وإعادة الدخول.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer font-sans"
            >
              إعادة تحميل الصفحة
            </button>
            <button
              onClick={() => {
                if (this.props.onLogout) {
                  this.props.onLogout();
                } else {
                  window.location.reload();
                }
              }}
              className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer font-sans"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function MyAccountWithBoundary(props) {
  return (
    <AccountErrorBoundary onLogout={props.onLogout}>
      <MyAccount {...props} />
    </AccountErrorBoundary>
  );
}
