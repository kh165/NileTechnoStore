import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  ShoppingBag, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Search, 
  ListFilter, 
  Truck, 
  Calendar, 
  Users, 
  Loader2, 
  Printer, 
  Eye, 
  ArrowUpDown, 
  RefreshCw, 
  X,
  MapPin,
  FileText,
  Phone,
  User,
  Trash2,
  FileSpreadsheet,
  LayoutGrid,
  List,
  Package,
  AlertTriangle,
  Plus,
  Minus,
  Mail,
  Star,
  Sparkles,
  Tag,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  BarChart3,
  Lock,
  ShoppingCart,
  Sliders
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { printOrdersPDF } from "../../lib/pdfGenerator";
import { printInvoice } from "../../lib/invoicePrinter";
import { printShippingWaybill, printBatchShippingWaybills } from "../../lib/waybillPrinter";
import { exportOrdersToExcel } from "../../lib/exportToExcel";
import { ErrorBoundary } from "../ErrorBoundary";
import AdminStatsCards from "./AdminStatsCards";
import AdminReviewsTab from "./AdminReviewsTab";
import PrintOptionsModal from "./PrintOptionsModal";
import CustomerSummaryModal from "./CustomerSummaryModal";
import AdminSliderTab from "./AdminSliderTab";
import AdminReportsTab from "./AdminReportsTab";
import AdminInventoryTab from "./AdminInventoryTab";
import AdminUsersTab from "./AdminUsersTab";
import AdminDiscountsTab from "./AdminDiscountsTab";
import AdminShippingTab from "./AdminShippingTab";
import AdminAbandonedCartsTab from "./AdminAbandonedCartsTab";
import AdminActivityLogTab from "./AdminActivityLogTab";
import AdminAnalyticsChartsTab from "./AdminAnalyticsChartsTab";
import AdminSettingsTab from "./AdminSettingsTab";
import AdminOrderDetailModal from "./AdminOrderDetailModal";
import { activityLogService } from "../../lib/activityLogService";
import { emailApi } from "../../lib/emailApi";
import { isUserAdmin, isUserMainAdmin } from "../../lib/constants";
import Tooltip from "../Common/Tooltip";
import { shopApi } from "../../api";
import { 
  getFeaturedProductsFromFirestore, 
  saveFeaturedProductsToFirestore,
  getReviewsFromFirestore,
  approveReviewInFirestore,
  deleteReviewFromFirestore,
  getAnalyticsFromFirestore,
  listenToOrdersFromFirestore,
  updateOrderInternalNoteInFirestore,
  updateOrderStatusInFirestore
} from "../../lib/firebaseService";

export default function AdminDashboard({ 
  user, 
  storeCurrency = "ج.م", 
  onUpdateOrderStatus,
  getAllOrdersFromFirestore,
  deleteOrderFromFirestore,
  getAllUsersFromFirestore,
  updateUserRoleInFirestore,
  lang = "ar"
}) {
  const [allOrders, setAllOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [selectedCustomerForSummary, setSelectedCustomerForSummary] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const handleSaveInternalNote = async (orderId, noteText) => {
    try {
      await updateOrderInternalNoteInFirestore(orderId, noteText);
      setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, internalNote: noteText } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, internalNote: noteText } : null);
      }
      triggerToast("تم حفظ الملاحظة الإدارية بنجاح ✅");
    } catch (err) {
      console.error("Error saving internal note:", err);
      setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, internalNote: noteText } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, internalNote: noteText } : null);
      }
      triggerToast("تم حفظ الملاحظة محلياً ✅");
    }
  };

  // Security guard for admin access
  if (!isUserAdmin(user)) {
    return (
      <div className="p-8 text-center bg-rose-50 border border-rose-200 rounded-3xl space-y-3" dir={lang === "en" ? "ltr" : "rtl"}>
        <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto" />
        <h3 className="text-lg font-black text-rose-900">
          {lang === "en" ? "Access Denied" : "غير مسموح بالوصول"}
        </h3>
        <p className="text-xs font-bold text-rose-700">
          {lang === "en"
            ? "You do not have administrative privileges to view this section."
            : "حسابك لا يملك صلاحيات إدارية لعرض هذه الصفحة."}
        </p>
      </div>
    );
  }

  // Role & Permissions Scoping Logic
  const isMainAdmin = isUserMainAdmin(user);
  const userPermissions = Array.isArray(user?.permissions) && user.permissions.length > 0
    ? user.permissions 
    : [
        "manage_orders",
        "view_analytics",
        "view_reports",
        "manage_inventory",
        "manage_reviews",
        "manage_slider",
        "manage_discounts",
        "manage_users",
        "manage_shipping",
        "manage_abandoned_carts",
        "view_activity_log"
      ];

  const navTabsConfig = useMemo(() => [
    { key: "ORDERS", label: lang === "en" ? "Manage Orders" : "إدارة الطلبات", icon: ShoppingBag, perm: "manage_orders" },
    { key: "CHARTS", label: lang === "en" ? "Live Dashboard 📊" : "لوحة البيانات والرسوم 📊", icon: BarChart3, perm: "view_analytics" },
    { key: "REPORTS", label: lang === "en" ? "Financial & Detailed Reports" : "تقارير مالية وتفصيلية", icon: FileText, perm: "view_reports" },
    { key: "SHIPPING", label: lang === "en" ? "Shipping Rates & Zones" : "مناطق وأسعار الشحن", icon: Truck, perm: "manage_shipping" },
    { key: "ADMINS", label: lang === "en" ? "Admin Permissions" : "صلاحيات المدراء", icon: Users, perm: "manage_users", isMainAdminOnly: true },
    { key: "INVENTORY", label: lang === "en" ? "Products & Inventory" : "إدارة والمخزون", icon: Package, perm: "manage_inventory" },
    { key: "REVIEWS", label: lang === "en" ? "Customer Reviews" : "تقييمات العملاء", icon: Star, perm: "manage_reviews" },
    { key: "SLIDER", label: lang === "en" ? "Slider Featured Products" : "منتجات السلايدر", icon: Sparkles, perm: "manage_slider" },
    { key: "SETTINGS", label: lang === "en" ? "Company & Banner Settings ⚙️" : "إعدادات الشركة والبانرات ⚙️", icon: Sliders, perm: "manage_slider" },
    { key: "DISCOUNTS", label: lang === "en" ? "Offers & Discounts" : "العروض والخصومات", icon: Tag, perm: "manage_discounts" },
    { key: "ABANDONED_CARTS", label: lang === "en" ? "Abandoned Carts 🛒" : "السلات المتروكة 🛒", icon: ShoppingCart, perm: "manage_abandoned_carts" },
    { key: "ACTIVITY_LOG", label: lang === "en" ? "Activity Log 📋" : "سجل النشاطات 📋", icon: ShieldCheck, perm: "view_activity_log" }
  ], [lang]);

  const allowedNavTabs = useMemo(() => {
    return navTabsConfig.filter(tab => {
      if (tab.isMainAdminOnly) return isMainAdmin;
      if (isMainAdmin) return true;
      if (userPermissions.includes(tab.perm)) return true;
      // Backward compatibility for legacy sub-admins with "manage_orders"
      if ((tab.perm === "manage_abandoned_carts" || tab.perm === "view_activity_log") && userPermissions.includes("manage_orders")) {
        return true;
      }
      return false;
    });
  }, [isMainAdmin, userPermissions, navTabsConfig]);

  const [activeTab, setActiveTab] = useState("ORDERS");

  const handleSelectTab = (tabKey) => {
    setActiveTab(tabKey);
    const newHash = `#admin/${tabKey}`;
    if (window.location.hash !== newHash) {
      window.history.pushState({ tab: "admin", sub: tabKey }, "", newHash);
    }
  };

  const handleOpenOrderDetails = (order) => {
    setSelectedOrder(order);
    if (order) {
      const newHash = `#admin/${activeTab}/order/${order.id || order.orderNumber || 'detail'}`;
      if (window.location.hash !== newHash) {
        window.history.pushState({ modal: "order_details" }, "", newHash);
      }
    }
  };

  const handleOpenCustomerSummary = (customer) => {
    setSelectedCustomerForSummary(customer);
    if (customer) {
      const newHash = `#admin/${activeTab}/customer/${customer.id || customer.customerPhone || 'info'}`;
      if (window.location.hash !== newHash) {
        window.history.pushState({ modal: "customer_summary" }, "", newHash);
      }
    }
  };

  useEffect(() => {
    const handleCheckGoBack = (e) => {
      if (selectedOrder) {
        setSelectedOrder(null);
        if (window.location.hash.includes("/order/")) {
          window.history.pushState({ tab: "admin", sub: activeTab }, "", `#admin/${activeTab}`);
        }
        if (e && e.detail && typeof e.detail.preventFallback === "function") {
          e.detail.preventFallback();
        }
      } else if (selectedCustomerForSummary) {
        setSelectedCustomerForSummary(null);
        if (window.location.hash.includes("/customer/")) {
          window.history.pushState({ tab: "admin", sub: activeTab }, "", `#admin/${activeTab}`);
        }
        if (e && e.detail && typeof e.detail.preventFallback === "function") {
          e.detail.preventFallback();
        }
      }
    };

    window.addEventListener("niletechno_check_go_back", handleCheckGoBack);
    return () => {
      window.removeEventListener("niletechno_check_go_back", handleCheckGoBack);
    };
  }, [selectedOrder, selectedCustomerForSummary, activeTab]);

  useEffect(() => {
    const syncAdminTabFromHash = () => {
      const raw = (window.location.hash || "").replace(/^#\/?/, "").trim();
      const parts = raw.split("/").map(p => p.trim());
      if (parts[0] === "admin") {
        if (parts[1]) {
          const candidate = parts[1].toUpperCase();
          const found = allowedNavTabs.find(t => t.key === candidate);
          if (found) {
            setActiveTab(candidate);
          } else if (allowedNavTabs.length > 0) {
            setActiveTab(allowedNavTabs[0].key);
          }
        } else if (parts[0] === "admin") {
          if (allowedNavTabs.some(t => t.key === "ORDERS")) {
            setActiveTab("ORDERS");
          } else if (allowedNavTabs.length > 0) {
            setActiveTab(allowedNavTabs[0].key);
          }
        }
        if (!raw.includes("/order/")) {
          setSelectedOrder(null);
        }
        if (!raw.includes("/customer/")) {
          setSelectedCustomerForSummary(null);
        }
      }
    };

    syncAdminTabFromHash();

    const handleSwitchTab = (e) => {
      if (e.detail) {
        const candidate = String(e.detail).toUpperCase();
        const found = allowedNavTabs.find(t => t.key === candidate);
        if (found) {
          setActiveTab(candidate);
        }
      } else {
        syncAdminTabFromHash();
      }
    };
    window.addEventListener("switch_admin_tab", handleSwitchTab);
    window.addEventListener("hashchange", syncAdminTabFromHash);
    window.addEventListener("popstate", syncAdminTabFromHash);
    return () => {
      window.removeEventListener("switch_admin_tab", handleSwitchTab);
      window.removeEventListener("hashchange", syncAdminTabFromHash);
      window.removeEventListener("popstate", syncAdminTabFromHash);
    };
  }, [allowedNavTabs]);

  const tabsRef = useRef(null);
  const scrollTabs = (dir) => {
    if (!tabsRef.current) return;
    const container = tabsRef.current;
    const scrollAmount = 280;
    if (dir === "left") {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (allowedNavTabs.length > 0 && !allowedNavTabs.some(t => t.key === activeTab)) {
      setActiveTab(allowedNavTabs[0].key);
    }
  }, [allowedNavTabs, activeTab]);

  const [allUsers, setAllUsers] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [roleUpdatingUserId, setRoleUpdatingUserId] = useState(null);

  // Inventory & Print Modal state
  const [products, setProducts] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [printModalConfig, setPrintModalConfig] = useState({ isOpen: false, title: "", onConfirm: null });

  // Featured Slider Products States
  const [selectedFeaturedIds, setSelectedFeaturedIds] = useState([]);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(false);
  const [isSavingFeatured, setIsSavingFeatured] = useState(false);

  const loadFeaturedIds = async () => {
    setIsLoadingFeatured(true);
    try {
      const ids = await getFeaturedProductsFromFirestore();
      setSelectedFeaturedIds(ids || []);
    } catch (err) {
      console.error("Error loading featured products in admin:", err);
      triggerToast("حدث خطأ أثناء تحميل إعدادات السلايدر");
    } finally {
      setIsLoadingFeatured(false);
    }
  };

  const handleSaveFeatured = async (updatedIds) => {
    setIsSavingFeatured(true);
    try {
      await saveFeaturedProductsToFirestore(updatedIds);
      setSelectedFeaturedIds(updatedIds);
      activityLogService.logAction(user?.email, "SLIDER_UPDATE", {
        title: "تحديث منتجات السلايدر الرئيسي",
        description: `تم تحديث المنتجات المميزة المعروضة بالسلايدر (${updatedIds.length} منتج)`
      });
      triggerToast("تم حفظ وتحديث منتجات السلايدر بنجاح! سيتم تطبيقها فوراً على الصفحة الرئيسية ✨");
    } catch (err) {
      console.error("Error saving featured products in admin:", err);
      triggerToast("خطأ أثناء حفظ إعدادات السلايدر");
    } finally {
      setIsSavingFeatured(false);
    }
  };

  const loadAllProducts = async () => {
    setIsProductsLoading(true);
    try {
      const allProds = await shopApi.getAllProductsForAdmin({});
      setProducts(allProds || []);
    } catch (err) {
      console.error("Error loading products in admin dashboard:", err);
    } finally {
      setIsProductsLoading(false);
    }
  };

  // Deletion States
  const [deletingOrderId, setDeletingOrderId] = useState(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);

  // Load orders
  const loadOrders = async () => {
    setIsLoading(true);
    try {
      if (getAllOrdersFromFirestore) {
        const fetched = await getAllOrdersFromFirestore();
        setAllOrders(fetched || []);
      }
    } catch (err) {
      console.error("Error loading orders in admin panel:", err);
      triggerToast("حدث خطأ أثناء تحميل الطلبات");
    } finally {
      setIsLoading(false);
    }
  };

  // Load users
  const loadUsers = async (silent = false) => {
    if (!getAllUsersFromFirestore) return;
    if (!silent && allUsers.length === 0) {
      setIsUsersLoading(true);
    }
    try {
      const fetched = await getAllUsersFromFirestore();
      if (fetched) {
        setAllUsers(fetched);
      }
    } catch (err) {
      console.error("Error loading users in admin panel:", err);
      triggerToast("حدث خطأ أثناء تحميل المستخدمين المسجلين");
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleToggleRole = async (targetUser) => {
    if (!updateUserRoleInFirestore || !targetUser) return;
    const targetId = targetUser.id || targetUser.uid;
    if (!targetId) return;

    if (targetUser.email === user?.email) {
      triggerToast(lang === "en" ? "Cannot modify your own active admin account!" : "عذراً، لا يمكنك تعديل أو إلغاء صلاحيات حسابك الحالي لتجنب الإغلاق!");
      return;
    }
    const newRole = targetUser.role === "admin" ? "user" : "admin";
    setRoleUpdatingUserId(targetId);
    try {
      await updateUserRoleInFirestore(targetId, newRole);
      setAllUsers(prev => prev.map(u => (u.id === targetId || u.uid === targetId) ? { ...u, role: newRole } : u));
      activityLogService.logAction(user?.email, "USER_ROLE_CHANGE", {
        title: `تعديل صلاحيات المستخدم (${targetUser.email || targetUser.name || targetId})`,
        description: `تم تغيير دور الحساب إلى: ${newRole === "admin" ? "مدير" : "مستخدم عادي"}`
      });
      triggerToast(lang === "en" ? `Role updated to: ${newRole === "admin" ? "Admin" : "Customer"}` : `تم بنجاح تغيير دور الحساب إلى: ${newRole === "admin" ? "مدير" : "مستخدم عادي"}`);
    } catch (err) {
      console.error("Error toggling role:", err);
      triggerToast(lang === "en" ? "Error updating user role" : "حدث خطأ أثناء تعديل دور المستخدم");
    } finally {
      setRoleUpdatingUserId(null);
    }
  };

  // Reviews management states
  const [adminReviews, setAdminReviews] = useState([]);
  const [loadingAdminReviews, setLoadingAdminReviews] = useState(false);

  // Analytics states
  const [analyticsData, setAnalyticsData] = useState({ searches: {}, productViews: {} });
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);

  const loadAdminReviews = async () => {
    setLoadingAdminReviews(true);
    try {
      // جلب التقييمات من Firestore مباشرةً — بدون أي fallback محلي
      const firestoreReviews = await getReviewsFromFirestore(null, true);
      setAdminReviews(firestoreReviews || []);
    } catch (err) {
      console.error("Error loading admin reviews from Firestore:", err);
      setAdminReviews([]);
    } finally {
      setLoadingAdminReviews(false);
    }
  };

  const loadAnalytics = async () => {
    setIsAnalyticsLoading(true);
    try {
      const data = await getAnalyticsFromFirestore();
      setAnalyticsData(data || { searches: {}, productViews: {} });
    } catch (err) {
      console.error("Error loading analytics:", err);
      setAnalyticsData({ searches: {}, productViews: {} });
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const handleApproveReview = async (reviewId) => {
    try {
      // الموافقة على التقييم في Firestore مباشرةً
      await approveReviewInFirestore(reviewId);
      setAdminReviews(prev => prev.map(r => r.id === reviewId ? { ...r, approved: true } : r));
      activityLogService.logAction(user?.email, "REVIEW_APPROVE", {
        title: `الموافقة على تقييم (#${reviewId})`,
        description: "تمت الموافقة على التقييم ونشره في المتجر"
      });
      triggerToast("تمت الموافقة على التقييم ونشره للمشترين بنجاح!");
    } catch (err) {
      console.error("Error approving review in Firestore:", err);
      triggerToast("فشل الموافقة على التقييم — يرجى المحاولة مرة أخرى");
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا التقييم نهائياً؟")) return;
    try {
      // حذف التقييم من Firestore مباشرةً — بدون أي fallback محلي
      await deleteReviewFromFirestore(reviewId);
      setAdminReviews(prev => prev.filter(r => r.id !== reviewId));
      activityLogService.logAction(user?.email, "REVIEW_DELETE", {
        title: `حذف تقييم (#${reviewId})`,
        description: "تم حذف التقييم نهائياً من قاعدة البيانات"
      });
      triggerToast("تم حذف التقييم نهائياً من قاعدة البيانات بنجاح!");
    } catch (err) {
      console.error("Error deleting review from Firestore:", err);
      triggerToast("فشل حذف التقييم — يرجى المحاولة مرة أخرى");
    }
  };

  useEffect(() => {
    loadOrders();
    loadUsers();
    loadAllProducts();

    // Enable real-time onSnapshot for Orders in Admin Dashboard
    const unsubscribeOrders = listenToOrdersFromFirestore((realtimeOrders) => {
      if (realtimeOrders && realtimeOrders.length > 0) {
        setAllOrders(realtimeOrders);
      }
    });

    return () => {
      if (typeof unsubscribeOrders === "function") {
        unsubscribeOrders();
      }
    };
  }, []);

  useEffect(() => {
    if (activeTab === "REPORTS") {
      loadAnalytics();
    } else if (activeTab === "REVIEWS") {
      loadAdminReviews();
    } else if (activeTab === "SLIDER") {
      loadFeaturedIds();
      loadAllProducts();
    } else if (activeTab === "INVENTORY") {
      loadAllProducts();
    } else if (activeTab === "ADMINS") {
      loadUsers();
    }
  }, [activeTab]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const orderObj = allOrders.find(o => o.id === orderId) || (selectedOrder?.id === orderId ? selectedOrder : null);
      
      await updateOrderStatusInFirestore(
        orderId, 
        newStatus, 
        user?.displayName || user?.name || user?.email || "مدير النظام", 
        "", 
        orderObj
      );

      await emailApi.updateOrderStatus(orderId, newStatus, "", orderObj);

      if (onUpdateOrderStatus) {
        await onUpdateOrderStatus(orderId, newStatus, orderObj);
      }

      setAllOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
      activityLogService.logAction(user?.email, "ORDER_STATUS", {
        title: `تعديل حالة الطلب #${orderId}`,
        description: `تم تغيير حالة الطلب رقم ${orderId} إلى: ${newStatus}`
      });
      triggerToast("تم تحديث حالة الطلب وإرسال الإيميل للعميل بنجاح ✉️");
    } catch (err) {
      console.error("Failed to update status:", err);
      triggerToast("خطأ أثناء تحديث حالة الطلب");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleExportToPDF = () => {
    try {
      const filteredNonCancelled = filteredOrders.filter(o => !o.status || !["CANCELED", "CANCELLED"].includes(o.status.toUpperCase()));
      const fActiveSalesTotal = filteredNonCancelled.reduce((acc, curr) => acc + (parseFloat(curr.total) || 0), 0);
      const fAverageOrderValue = filteredNonCancelled.length > 0 ? (fActiveSalesTotal / filteredNonCancelled.length).toFixed(1) : 0;
      const fCancelledCount = filteredOrders.filter(o => o.status && ["CANCELED", "CANCELLED"].includes(o.status.toUpperCase())).length;

      let dateRangeText = "";
      if (startDate && endDate) {
        dateRangeText = `من ${new Date(startDate).toLocaleDateString("ar-EG")} إلى ${new Date(endDate).toLocaleDateString("ar-EG")}`;
      } else if (startDate) {
        dateRangeText = `من تاريخ ${new Date(startDate).toLocaleDateString("ar-EG")}`;
      } else if (endDate) {
        dateRangeText = `حتى تاريخ ${new Date(endDate).toLocaleDateString("ar-EG")}`;
      }

      printOrdersPDF(filteredOrders, {
        activeSalesTotal: fActiveSalesTotal,
        averageOrderValue: fAverageOrderValue,
        cancelledCount: fCancelledCount
      }, storeCurrency, dateRangeText);
      triggerToast("جاري تحضير وتوليد تقرير الـ PDF للطباعة...");
    } catch (err) {
      console.error("Export PDF Error:", err);
      triggerToast("حدث خطأ أثناء تصدير تقرير PDF.");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    setIsDeletingOrder(true);
    try {
      if (deleteOrderFromFirestore) {
        await deleteOrderFromFirestore(orderId);
        setAllOrders(prev => prev.filter(o => o.id !== orderId));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(null);
        }
        activityLogService.logAction(user?.email, "ORDER_DELETE", {
          title: `حذف الطلب #${orderId}`,
          description: `تم حذف الطلب رقم ${orderId} نهائياً من قاعدة البيانات`
        });
        triggerToast("تم حذف الطلب نهائياً بنجاح");
      }
    } catch (err) {
      console.error("Failed to delete order:", err);
      triggerToast("خطأ أثناء محاولة حذف الطلب");
    } finally {
      setIsDeletingOrder(false);
      setDeletingOrderId(null);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "غير محدد";
    try {
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return String(dateValue);
      return d.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return String(dateValue);
    }
  };

  const getStatusBadge = (status) => {
    const normStatus = (status || "PENDING").toUpperCase();
    switch (normStatus) {
      case "PENDING":
        return (
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0 inline-flex items-center justify-center whitespace-nowrap">
            قيد المعالجة المبدئية
          </span>
        );
      case "PREPARING":
        return (
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0 inline-flex items-center justify-center whitespace-nowrap">
            قيد التحضير والتجهيز
          </span>
        );
      case "SHIPPED":
      case "DELIVERING":
        return (
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse shrink-0 inline-flex items-center justify-center whitespace-nowrap">
            جاري التوصيل مع المندوب
          </span>
        );
      case "DELIVERED":
        return (
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0 inline-flex items-center justify-center gap-1 whitespace-nowrap">
            <span>تم الاستلام (العميل استلم) ✅</span>
          </span>
        );
      case "COMPLETED":
        return (
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-700 text-white border border-emerald-800 shrink-0 inline-flex items-center justify-center whitespace-nowrap">
            تم إقفال الطلب بنجاح 🔒
          </span>
        );
      case "CANCELED":
      case "CANCELLED":
        return (
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 shrink-0 inline-flex items-center justify-center whitespace-nowrap">
            تم إلغاء الطلب
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-50 text-slate-700 border border-slate-200 shrink-0 inline-flex items-center justify-center whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  const parseAmount = (val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === "number") return isNaN(val) ? 0 : val;
    const str = String(val).replace(/[^0-9.]/g, "");
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
  };

  const totalSales = allOrders.reduce((acc, curr) => acc + parseAmount(curr.total), 0);
  const pendingCount = allOrders.filter(o => !o.status || o.status.toUpperCase() === "PENDING" || o.status.toUpperCase() === "RECEIVED").length;
  const preparingCount = allOrders.filter(o => o.status && (o.status.toUpperCase() === "PREPARING" || o.status.toUpperCase() === "PROCESSING")).length;
  const deliveringCount = allOrders.filter(o => o.status && (o.status.toUpperCase() === "SHIPPED" || o.status.toUpperCase() === "DELIVERING")).length;

  const nonCancelledOrders = allOrders.filter(o => !o.status || !["CANCELED", "CANCELLED"].includes(o.status.toUpperCase()));
  const activeSalesTotal = nonCancelledOrders.reduce((acc, curr) => acc + parseAmount(curr.total), 0);
  const averageOrderValue = nonCancelledOrders.length > 0 ? (activeSalesTotal / nonCancelledOrders.length).toFixed(1) : "0.0";

  const filteredOrders = allOrders.filter(order => {
    if (!order) return false;

    const orderDateVal = order.createdAt || order.date;
    if (orderDateVal) {
      const oDate = new Date(orderDateVal);
      if (!isNaN(oDate.getTime())) {
        if (startDate) {
          const sDate = new Date(startDate);
          sDate.setHours(0, 0, 0, 0);
          if (oDate < sDate) return false;
        }
        if (endDate) {
          const eDate = new Date(endDate);
          eDate.setHours(23, 59, 59, 999);
          if (oDate > eDate) return false;
        }
      } else if (startDate || endDate) {
        return false;
      }
    } else if (startDate || endDate) {
      return false;
    }

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      String(order.orderNumber || "").includes(searchQuery) ||
      String(order.customerName || "").toLowerCase().includes(searchLower) ||
      String(order.customerPhone || "").includes(searchQuery) ||
      String(order.customerAddress || "").toLowerCase().includes(searchLower);

    if (!matchesSearch) return false;

    if (statusFilter === "ALL") return true;
    const orderStatus = (order.status || "PENDING").toUpperCase();
    if (statusFilter === "PENDING" && orderStatus === "PENDING") return true;
    if (statusFilter === "PREPARING" && orderStatus === "PREPARING") return true;
    if (statusFilter === "SHIPPED" && (orderStatus === "SHIPPED" || orderStatus === "DELIVERING")) return true;
    if (statusFilter === "COMPLETED" && (orderStatus === "COMPLETED" || orderStatus === "DELIVERED")) return true;
    if (statusFilter === "CANCELED" && (orderStatus === "CANCELED" || orderStatus === "CANCELLED")) return true;

    return false;
  }).sort((a, b) => {
    const parseTime = (item) => {
      if (!item) return 0;
      if (item.createdAt) {
        const t = new Date(item.createdAt).getTime();
        if (!isNaN(t)) return t;
      }
      if (item.date) {
        const t = new Date(item.date).getTime();
        if (!isNaN(t)) return t;
      }
      return 0;
    };

    const timeA = parseTime(a);
    const timeB = parseTime(b);

    if (sortBy === "NEWEST") return timeB - timeA;
    if (sortBy === "OLDEST") return timeA - timeB;
    if (sortBy === "HIGHEST_PRICE") return (parseFloat(b.total) || 0) - (parseFloat(a.total) || 0);
    if (sortBy === "LOWEST_PRICE") return (parseFloat(a.total) || 0) - (parseFloat(b.total) || 0);
    return 0;
  });

  const handlePrintReceipt = (order) => {
    setPrintModalConfig({
      isOpen: true,
      title: `فاتورة الطلب #${order.orderNumber || order.id}`,
      onConfirm: (paperSize) => {
        printInvoice(order, storeCurrency, paperSize);
        triggerToast("جاري تحضير وطباعة فاتورة NileTechno المعتمدة...");
      }
    });
  };

  const handleToggleSelectOrder = (orderId) => {
    setSelectedOrderIds(prev => 
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (!newStatus || selectedOrderIds.length === 0) return;
    const count = selectedOrderIds.length;
    const selectedOrdersList = allOrders.filter(o => selectedOrderIds.includes(o.id));
    setIsLoading(true);
    try {
      for (const order of selectedOrdersList) {
        await updateOrderStatusInFirestore(
          order.id, 
          newStatus, 
          user?.displayName || user?.name || user?.email || "مدير النظام", 
          "", 
          order
        );
      }

      await emailApi.bulkUpdateOrderStatus(selectedOrderIds, newStatus, "", selectedOrdersList);

      if (onUpdateOrderStatus) {
        for (const orderId of selectedOrderIds) {
          const oObj = selectedOrdersList.find(o => o.id === orderId);
          await onUpdateOrderStatus(orderId, newStatus, oObj);
        }
      }

      setAllOrders(prev => prev.map(o => selectedOrderIds.includes(o.id) ? { ...o, status: newStatus } : o));
      activityLogService.logAction(user?.email, "ORDER_STATUS", {
        title: `تحديث جماعي لحالة ${count} طلبات`,
        description: `تم تغيير حالة ${count} طلبات دفعة واحدة إلى (${newStatus})`
      });
      triggerToast(`تم تحديث حالة ${count} طلبات وإرسال الإيميلات للعملاء بنجاح ✉️`);
      setSelectedOrderIds([]);
    } catch (err) {
      console.error("Error updating bulk orders status:", err);
      triggerToast("حدث خطأ أثناء التحديث الجماعي لحالة الطلبات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkPrintWaybills = () => {
    const selectedOrdersList = allOrders.filter(o => selectedOrderIds.includes(o.id));
    if (selectedOrdersList.length === 0) return;
    printBatchShippingWaybills(selectedOrdersList, storeCurrency);
    triggerToast(`جاري تجهيز ${selectedOrdersList.length} بوليسة شحن للطباعة...`);
  };

  const handleBulkDeleteOrders = async () => {
    if (!deleteOrderFromFirestore || selectedOrderIds.length === 0) return;
    const count = selectedOrderIds.length;
    if (!window.confirm(`هل أنت متأكد من حذف ${count} طلبات المحددة نهائياً من قاعدة البيانات؟`)) return;

    setIsDeletingOrder(true);
    try {
      for (const orderId of selectedOrderIds) {
        await deleteOrderFromFirestore(orderId);
      }
      setAllOrders(prev => prev.filter(o => !selectedOrderIds.includes(o.id)));
      activityLogService.logAction(user?.email, "ORDER_DELETE", {
        title: `حذف جماعي لعدد ${count} طلبات`,
        description: `تم حذف ${count} طلبات نهائياً من قاعدة البيانات`
      });
      triggerToast(`تم حذف ${count} طلبات بنجاح 🗑️`);
      setSelectedOrderIds([]);
    } catch (err) {
      console.error("Error bulk deleting orders:", err);
      triggerToast("حدث خطأ أثناء الحذف الجماعي للطلبات");
    } finally {
      setIsDeletingOrder(false);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-6 z-[9999] bg-slate-900 text-white text-xs font-black px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Dashboard */}
      <div className="bg-gradient-to-r from-[#072d5c] via-[#093c7a] to-[#072d5c] text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-blue-900/50">
        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-blue-100 rounded-full text-xs font-black">
            <Sparkles className="w-3.5 h-3.5 text-sky-300" />
            <span>لوحة تحكم إدارة المتجر</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">مرحباً بك، {user?.name || "المدير"} 👋</h2>
          <p className="text-xs text-blue-100/90 font-bold leading-relaxed">
            متابعة المبيعات، الطلبات، المخزون والصلاحيات بكفاءة وسرعة.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-end flex-wrap">
          <button
            onClick={() => {
              window.location.hash = "#account";
              window.dispatchEvent(new CustomEvent("switch_account_subsection", { detail: null }));
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-black rounded-2xl shadow-inner cursor-pointer transition-all active:scale-95 shrink-0 backdrop-blur-md"
            title="الرجوع إلى حسابي الشحصي"
          >
            <ChevronRight className="w-3.5 h-3.5 text-sky-300" />
            <span>الرجوع لحسابي</span>
          </button>
          <button
            onClick={() => {
              loadOrders();
              loadUsers();
            }}
            disabled={isLoading || isUsersLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-black rounded-2xl shadow-inner cursor-pointer transition-all active:scale-95 disabled:opacity-50 shrink-0 backdrop-blur-md"
          >
            {isLoading || isUsersLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-300" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-sky-300" />
            )}
            <span>تحديث البيانات المباشرة</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="relative flex items-center bg-white p-2 rounded-2xl border border-slate-200/90 shadow-2xs w-full gap-2">
        <button
          type="button"
          onClick={() => scrollTabs("right")}
          className="w-8 h-9 rounded-xl bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs border border-slate-200/70 active:scale-95 shrink-0"
          title="الأقسام التالية"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div 
          ref={tabsRef}
          className="flex items-center gap-2 overflow-x-auto py-1 scroll-smooth w-full no-scrollbar"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {allowedNavTabs.map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleSelectTab(tab.key)}
                className={`shrink-0 py-2.5 px-4 text-xs font-black rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2.5 whitespace-nowrap ${
                  isActive
                    ? "bg-gradient-to-r from-[#072d5c] to-[#093c7a] text-white shadow-md border border-blue-900"
                    : "text-slate-800 bg-slate-50/80 hover:bg-slate-100 hover:text-blue-950 border border-slate-200/60 font-bold"
                }`}
              >
                <IconComp className={`w-4 h-4 shrink-0 ${isActive ? "text-sky-300" : "text-slate-600"}`} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => scrollTabs("left")}
          className="w-8 h-9 rounded-xl bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs border border-slate-200/70 active:scale-95 shrink-0"
          title="الأقسام السابقة"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Contents */}
      <ErrorBoundary key={activeTab}>
      {activeTab === "ORDERS" && (
        <div className="space-y-6">
          <AdminStatsCards
            allOrdersCount={allOrders.length}
            totalSales={totalSales}
            pendingCount={pendingCount}
            preparingCount={preparingCount}
            deliveringCount={deliveringCount}
            averageOrderValue={averageOrderValue}
            storeCurrency={storeCurrency}
          />

          {/* Search and Filters */}
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <input 
                  type="text"
                  placeholder="البحث برقم طلب العميل، الاسم، الجوال أو العنوان بالتفصيل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 transition-all text-right shadow-xs"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <div className="flex items-center gap-1.5 bg-white px-3 py-2 border border-slate-200 rounded-xl shrink-0 shadow-xs">
                  <ListFilter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-transparent text-xs font-black text-slate-700 outline-none cursor-pointer pr-1"
                  >
                    <option value="ALL">جميع الحالات ({allOrders.length})</option>
                    <option value="PENDING">قيد المعالجة المبدئية</option>
                    <option value="PREPARING">قيد التحضير</option>
                    <option value="SHIPPED">جاري التوصيل</option>
                    <option value="COMPLETED">تم الاستلام والمكتملة</option>
                    <option value="CANCELED">الملغاة</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-white px-3 py-2 border border-slate-200 rounded-xl shrink-0 shadow-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-xs font-black text-slate-700 outline-none cursor-pointer pr-1"
                  >
                    <option value="NEWEST">الأحدث أولاً</option>
                    <option value="OLDEST">الأقدم أولاً</option>
                    <option value="HIGHEST_PRICE">الأعلى سعراً</option>
                    <option value="LOWEST_PRICE">الأقل سعراً</option>
                  </select>
                </div>

                <button
                  onClick={handleExportToPDF}
                  className="px-4 py-2 bg-[#072d5c] hover:bg-[#093c7a] text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95"
                  title="طباعة وتصدير كشف الطلبات المعروضة"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة PDF</span>
                </button>

                <button
                  onClick={() => exportOrdersToExcel(filteredOrders)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm active:scale-95"
                  title="تصدير جميع الطلبات المعروضة إلى ملف Excel / CSV"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>تصدير Excel (CSV) 📊</span>
                </button>
              </div>
            </div>

            {/* Date range filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/60 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-black text-slate-600">تصفية بالتاريخ:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg py-1 px-2 text-[11px] font-bold text-slate-700 outline-none"
                />
                <span className="text-slate-400 font-bold">إلى</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg py-1 px-2 text-[11px] font-bold text-slate-700 outline-none"
                />
                {(startDate || endDate) && (
                  <button
                    onClick={() => { setStartDate(""); setEndDate(""); }}
                    className="text-rose-600 font-black hover:underline text-[10px]"
                  >
                    إلغاء تصفية التاريخ
                  </button>
                )}
              </div>

              <span className="text-[10px] font-black text-slate-500">
                عدد الطلبات المعروضة: <strong className="text-blue-900 font-mono">{filteredOrders.length}</strong>
              </span>
            </div>
          </div>

          {/* Sticky Bulk Bar when orders selected */}
          {selectedOrderIds.length > 0 && (
            <div className="sticky top-4 z-40 bg-gradient-to-r from-[#072d5c] via-[#093c7a] to-[#072d5c] text-white p-3.5 rounded-2xl shadow-2xl border border-blue-400/40 flex flex-wrap items-center justify-between gap-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-black text-white">
                  تم تحديد <strong className="text-amber-300 font-mono text-sm px-1">{selectedOrderIds.length}</strong> طلبات
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20">
                  <span className="text-[11px] font-bold text-blue-100">تحديث الجماعي إلى:</span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleBulkStatusChange(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className="bg-slate-900 text-white text-xs font-black rounded-lg py-1 px-2 outline-none cursor-pointer border border-blue-400"
                  >
                    <option value="">اختر الحالة الجديدة...</option>
                    <option value="PENDING">قيد المعالجة المبدئية</option>
                    <option value="PREPARING">قيد التحضير والتجهيز</option>
                    <option value="SHIPPED">جاري التوصيل مع المندوب</option>
                    <option value="DELIVERED">تم الاستلام ✅</option>
                    <option value="COMPLETED">تم الإقفال 🔒</option>
                    <option value="CANCELED">إلغاء الطلبات ❌</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleBulkPrintWaybills}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>طباعة البوالص ({selectedOrderIds.length})</span>
                </button>

                {deleteOrderFromFirestore && (
                  <button
                    type="button"
                    onClick={handleBulkDeleteOrders}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف المحددة</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedOrderIds([])}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer border border-white/20"
                >
                  إلغاء التحديد
                </button>
              </div>
            </div>
          )}

          {/* Orders List Table */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 bg-white rounded-3xl border border-slate-100">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-xs font-bold">جاري تحميل وسحب بيانات الطلبات...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 space-y-3">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-500">لا توجد طلبات تتطابق مع البحث أو الفلتر المختار</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 text-[10px] font-black">
                      <th className="py-3 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length}
                          onChange={handleToggleSelectAll}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer accent-blue-600"
                          title="تحديد أو إلغاء تحديد كافة الطلبات المعروضة"
                        />
                      </th>
                      <th className="py-3 px-4 font-black">رقم الطلب والتاريخ</th>
                      <th className="py-3 px-4 font-black">تفاصيل المشتري</th>
                      <th className="py-3 px-4 font-black">المحافظة والعنوان</th>
                      <th className="py-3 px-4 font-black text-center">إجمالي المبلغ</th>
                      <th className="py-3 px-4 font-black text-center">الحالة الحالية</th>
                      <th className="py-3 px-4 font-black text-left">إجراءات وتحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                    {filteredOrders.map(order => {
                      const isSelected = selectedOrderIds.includes(order.id);
                      return (
                        <tr key={order.id} className={`transition-colors ${isSelected ? "bg-blue-50/60" : "hover:bg-slate-50/50"}`}>
                          <td className="py-4 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOrder(order.id)}
                              className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer accent-blue-600"
                            />
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <span className="font-mono font-black text-blue-900 text-xs block">
                                #{order.orderNumber || order.id}
                              </span>
                              <span className="text-[10px] text-slate-400 block font-normal">
                                {formatDate(order.createdAt || order.date)}
                              </span>
                            </div>
                          </td>

                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <button
                              onClick={() => handleOpenCustomerSummary(order)}
                              className="font-black text-slate-900 hover:text-blue-600 transition-colors text-xs text-right cursor-pointer underline decoration-dotted underline-offset-4 block"
                              title="اضغط للاطلاع على ملخص وتاريخ مشتريات العميل بالتفصيل"
                            >
                              {order.customerName || "عميل غير مسمى"}
                            </button>
                            <span className="text-[10px] text-slate-500 font-mono block dir-ltr text-right">
                              {order.customerPhone || "بدون هاتف"}
                            </span>
                            {order.internalNote && (
                              <div 
                                className="mt-1 inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/90 px-2 py-0.5 rounded-lg text-[10px] font-black max-w-[200px] truncate" 
                                title={`ملاحظة إدارية داخلية: ${order.internalNote}`}
                              >
                                <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                                <span className="truncate">ملاحظة: {order.internalNote}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-4 px-4 max-w-xs">
                          <div className="space-y-0.5">
                            <span className="text-xs font-black text-slate-800 block line-clamp-1">
                              {[order.governorate, order.customerAddress].filter(Boolean).join(" — ") || "غير مدون"}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="font-mono font-black text-emerald-700 text-xs block">
                            {(parseFloat(order.total) || 0).toLocaleString()} {storeCurrency}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          {getStatusBadge(order.status)}
                        </td>

                        <td className="py-4 px-4 text-left">
                          <div className="flex items-center justify-end gap-2.5">
                            <Tooltip text="عرض تفاصيل الطلب بالكامل">
                              <button
                                onClick={() => handleOpenOrderDetails(order)}
                                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </Tooltip>

                            <Tooltip text="طباعة الفاتورة الرسمية">
                              <button
                                onClick={() => handlePrintReceipt(order)}
                                className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            </Tooltip>

                            <Tooltip text="بوليسة شحن حرارية (10×15cm)">
                              <button
                                onClick={() => printShippingWaybill(order, storeCurrency)}
                                className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[10px] font-black active:scale-95 shadow-2xs"
                              >
                                <Truck className="w-4 h-4" />
                              </button>
                            </Tooltip>

                            {/* Status Change Dropdown */}
                            <select
                              value={(order.status || "PENDING").toUpperCase()}
                              onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                              disabled={updatingOrderId === order.id}
                              className="bg-slate-50 border border-slate-200 text-[11px] font-black text-slate-800 rounded-xl py-2 px-2.5 outline-none cursor-pointer focus:border-blue-500 shadow-2xs transition-all"
                            >
                              <option value="PENDING">قيد المعالجة المبدئية</option>
                              <option value="PREPARING">قيد التحضير والتجهيز</option>
                              <option value="SHIPPED">جاري التوصيل مع المندوب</option>
                              <option value="DELIVERED">تم الاستلام ✅</option>
                              <option value="COMPLETED">تم الإقفال 🔒</option>
                              <option value="CANCELED">إلغاء الطلب ❌</option>
                            </select>

                            {deleteOrderFromFirestore && (
                              <Tooltip text="حذف الطلب نهائياً">
                                <button
                                  onClick={() => {
                                    if (window.confirm(`هل أنت متأكد من حذف الطلب رقم #${order.orderNumber || order.id} نهائياً؟`)) {
                                      handleDeleteOrder(order.id);
                                    }
                                  }}
                                  disabled={isDeletingOrder}
                                  className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </Tooltip>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "CHARTS" && (
        <AdminAnalyticsChartsTab 
          orders={allOrders} 
          storeCurrency={storeCurrency} 
        />
      )}

      {activeTab === "REPORTS" && (
        <AdminReportsTab 
          orders={allOrders} 
          products={products}
          storeCurrency={storeCurrency} 
          analyticsData={analyticsData} 
          isAnalyticsLoading={isAnalyticsLoading} 
        />
      )}

      {activeTab === "SHIPPING" && (
        <AdminShippingTab 
          triggerToast={triggerToast} 
          storeCurrency={storeCurrency} 
        />
      )}

      {activeTab === "ADMINS" && (
        <AdminUsersTab 
          user={user}
          allUsers={allUsers} 
          setAllUsers={setAllUsers}
          isUsersLoading={isUsersLoading} 
          userSearchQuery={userSearchQuery} 
          setUserSearchQuery={setUserSearchQuery} 
          handleToggleRole={handleToggleRole} 
          roleUpdatingUserId={roleUpdatingUserId} 
          currentUserEmail={user?.email} 
          onRefreshUsers={loadUsers}
          lang={lang} 
        />
      )}

      {activeTab === "INVENTORY" && (
        <AdminInventoryTab 
          products={products} 
          allOrders={allOrders}
          isProductsLoading={isProductsLoading} 
          loadAllProducts={loadAllProducts} 
          triggerToast={triggerToast} 
          storeCurrency={storeCurrency} 
          currentAdminEmail={user?.email} 
        />
      )}

      {activeTab === "ABANDONED_CARTS" && (
        <AdminAbandonedCartsTab 
          storeCurrency={storeCurrency}
          triggerToast={triggerToast}
        />
      )}

      {activeTab === "REVIEWS" && (
        <AdminReviewsTab 
          adminReviews={adminReviews} 
          reviews={adminReviews}
          loadingAdminReviews={loadingAdminReviews} 
          isLoading={loadingAdminReviews}
          products={products}
          loadAdminReviews={loadAdminReviews}
          handleApproveReview={handleApproveReview} 
          onApprove={handleApproveReview} 
          handleDeleteReview={handleDeleteReview}
          onDelete={handleDeleteReview} 
        />
      )}

      {activeTab === "SLIDER" && (
        <AdminSliderTab 
          products={products} 
          selectedFeaturedIds={selectedFeaturedIds} 
          setSelectedFeaturedIds={setSelectedFeaturedIds}
          selectedIds={selectedFeaturedIds} 
          onSaveFeatured={handleSaveFeatured} 
          onSave={handleSaveFeatured} 
          isLoadingFeatured={isLoadingFeatured}
          isSavingFeatured={isSavingFeatured}
          isLoading={isLoadingFeatured || isSavingFeatured} 
        />
      )}

      {activeTab === "SETTINGS" && (
        <AdminSettingsTab
          products={products}
          lang={lang}
          triggerToast={triggerToast}
        />
      )}

      {activeTab === "DISCOUNTS" && (
        <AdminDiscountsTab 
          triggerToast={triggerToast} 
          storeCurrency={storeCurrency} 
        />
      )}

      {activeTab === "ACTIVITY_LOG" && (
        <AdminActivityLogTab 
          currentUserEmail={user?.email} 
          currentUser={user}
        />
      )}
      </ErrorBoundary>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <AdminOrderDetailModal
          selectedOrder={selectedOrder}
          setSelectedOrder={setSelectedOrder}
          storeCurrency={storeCurrency}
          handleUpdateStatus={handleUpdateStatus}
          updatingOrderId={updatingOrderId}
          getStatusBadge={getStatusBadge}
          formatDate={formatDate}
          deletingOrderId={deletingOrderId}
          setDeletingOrderId={setDeletingOrderId}
          isDeletingOrder={isDeletingOrder}
          handleDeleteOrder={handleDeleteOrder}
          handlePrintReceipt={handlePrintReceipt}
          onSaveInternalNote={handleSaveInternalNote}
          onOpenCustomerProfile={(order) => setSelectedCustomerForSummary(order)}
        />
      )}

      {/* Customer Summary Profile Modal */}
      <CustomerSummaryModal
        customer={selectedCustomerForSummary}
        allOrders={allOrders}
        isOpen={Boolean(selectedCustomerForSummary)}
        onClose={() => setSelectedCustomerForSummary(null)}
        onSelectOrder={(ord) => setSelectedOrder(ord)}
        storeCurrency={storeCurrency}
      />

      {/* Print Options Modal */}
      <PrintOptionsModal 
        isOpen={printModalConfig.isOpen}
        onClose={() => setPrintModalConfig({ ...printModalConfig, isOpen: false })}
        onConfirmPrint={(size) => printModalConfig.onConfirm?.(size)}
        reportTitle={printModalConfig.title}
      />
    </div>
  );
}
