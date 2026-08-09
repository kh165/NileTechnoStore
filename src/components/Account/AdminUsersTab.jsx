import React, { useState, useMemo, useEffect } from "react";
import { 
  Users, 
  Search, 
  Loader2, 
  Shield, 
  Check, 
  X, 
  Lock, 
  Key, 
  Crown, 
  UserCheck, 
  ShieldAlert, 
  ShieldCheck,
  ShoppingCart,
  Mail,
  Phone,
  Sparkles,
  Layers,
  Sliders,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  ArrowRight,
  ChevronLeft,
  UserPlus,
  RefreshCw,
  BadgeCheck,
  Info,
  CheckSquare,
  Square,
  ToggleLeft,
  ToggleRight,
  Settings,
  Ban,
  Trash2,
  UserX,
  ShoppingBag,
  BarChart3,
  FileText,
  Package,
  Star,
  Tag,
  Truck,
  Zap,
  User,
  SlidersVertical,
  Briefcase,
  Sliders as SlidersIcon,
  PieChart,
  Headphones,
  Award,
  Sparkle,
  FileSpreadsheet
} from "lucide-react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toggleBlockUserInFirestore, deleteUserFromFirestore } from "../../lib/firebaseService";
import { exportUsersToExcel } from "../../lib/exportToExcel";
import { isUserAdmin, isUserMainAdmin } from "../../lib/constants";
import { activityLogService } from "../../lib/activityLogService";
import Tooltip from "../Common/Tooltip";

export default function AdminUsersTab({
  user,
  allUsers = [],
  setAllUsers,
  filteredUsers = [],
  isUsersLoading = false,
  userSearchQuery = "",
  setUserSearchQuery,
  roleUpdatingUserId,
  handleToggleRole,
  onRefreshUsers,
  lang = "ar"
}) {
  const [permissionUpdatingId, setPermissionUpdatingId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [roleFilter, setRoleFilter] = useState("ALL"); // "ALL" | "ADMIN" | "CUSTOMER" | "BLOCKED"
  const [permFilter, setPermFilter] = useState("ALL"); // "ALL" | "FULL_PERMS" | "CUSTOM_PERMS"
  const [selectedDetailUser, setSelectedDetailUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerToast, setDrawerToast] = useState("");

  // Prevent background scrolling when Drawer is open without causing layout jump
  useEffect(() => {
    if (isDrawerOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isDrawerOpen]);

  // System Available Permissions Definition
  const availablePermissions = useMemo(() => [
    { 
      key: "manage_orders", 
      label: "إدارة الطلبات والشحنات", 
      desc: "متابعة الطلبات، تغيير الحالات، وتوليد الفواتير والبولصات",
      icon: ShoppingBag,
      colorBg: "bg-blue-50 text-blue-700 border-blue-200",
      activeBadge: "bg-blue-600 text-white"
    },
    { 
      key: "view_analytics", 
      label: "لوحة البيانات والرسوم 📊", 
      desc: "إحصائيات المبيعات التفاعلية والرسوم البيانية المباشرة",
      icon: BarChart3,
      colorBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      activeBadge: "bg-emerald-600 text-white"
    },
    { 
      key: "view_reports", 
      label: "التقارير المالية والمحاسبة", 
      desc: "عرض الإحصائيات والأرباح وتقارير المبيعات والأكثر طلباً",
      icon: FileText,
      colorBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
      activeBadge: "bg-indigo-600 text-white"
    },
    { 
      key: "manage_inventory", 
      label: "إدارة المنتجات والمخزون", 
      desc: "إضافة وتعديل الأسعار والكميات وتحديث بيانات المنتجات",
      icon: Package,
      colorBg: "bg-purple-50 text-purple-700 border-purple-200",
      activeBadge: "bg-purple-600 text-white"
    },
    { 
      key: "manage_reviews", 
      label: "مراجعات وتقييمات العملاء", 
      desc: "مراجعة واعتماد أو حذف تقييمات وتعليقات العملاء",
      icon: Star,
      colorBg: "bg-amber-50 text-amber-700 border-amber-200",
      activeBadge: "bg-amber-600 text-white"
    },
    { 
      key: "manage_slider", 
      label: "سلايدر الواجهة الرئيسية", 
      desc: "تحديد المنتجات والخصومات المميزة في بنرات الواجهة",
      icon: Sparkles,
      colorBg: "bg-teal-50 text-teal-700 border-teal-200",
      activeBadge: "bg-teal-600 text-white"
    },
    { 
      key: "manage_discounts", 
      label: "العروض وكوبونات الخصم", 
      desc: "إنشاء وتفعيل أو إيقاف العروض وكوبونات التخفيضات",
      icon: Tag,
      colorBg: "bg-rose-50 text-rose-700 border-rose-200",
      activeBadge: "bg-rose-600 text-white"
    },
    { 
      key: "manage_shipping", 
      label: "مناطق وأسعار الشحن", 
      desc: "تعديل أسعار الشحن وتفعيل أو تعطيل المحافظات",
      icon: Truck,
      colorBg: "bg-cyan-50 text-cyan-700 border-cyan-200",
      activeBadge: "bg-cyan-600 text-white"
    },
    { 
      key: "manage_abandoned_carts", 
      label: "السلات المتروكة 🛒", 
      desc: "تتبع سلات الشراء المتروكة ومتابعة العملاء",
      icon: ShoppingCart,
      colorBg: "bg-amber-50 text-amber-800 border-amber-200",
      activeBadge: "bg-amber-600 text-white"
    },
    { 
      key: "view_activity_log", 
      label: "سجل النشاطات والأمان 📋", 
      desc: "متابعة سجل تحركات العمليات وتغييرات النظام",
      icon: ShieldCheck,
      colorBg: "bg-slate-50 text-slate-700 border-slate-200",
      activeBadge: "bg-slate-700 text-white"
    },
    { 
      key: "manage_users", 
      label: "صلاحيات المدراء 👑", 
      desc: "إدارة وتعديل صلاحيات باقي مدراء المشرفين على النظام",
      icon: Users,
      colorBg: "bg-violet-50 text-violet-700 border-violet-200",
      activeBadge: "bg-violet-600 text-white"
    }
  ], []);

  // Predefined Admin Roles Catalog
  const presetRolesCatalog = useMemo(() => [
    {
      id: "full_admin",
      title: "👑 مدير نظام عام (صلاحيات كاملة)",
      desc: `جميع الصلاحيات (${availablePermissions.length}/${availablePermissions.length}) - الوصول الكامل لكل أقسام اللوحة`,
      icon: Crown,
      keys: availablePermissions.map(p => p.key),
      badgeStyle: "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 shadow-xs",
      cardBorder: "border-amber-300 bg-amber-50/50"
    },
    {
      id: "sales_orders",
      title: "🛒 مدير المبيعات والطلبات",
      desc: "إدارة الطلبات + اللوحة المباشرة + التقارير المالية + الشحن",
      icon: ShoppingBag,
      keys: ["manage_orders", "view_analytics", "view_reports", "manage_shipping"],
      badgeStyle: "bg-emerald-600 text-white border-emerald-500 shadow-xs",
      cardBorder: "border-emerald-200 bg-emerald-50/40"
    },
    {
      id: "catalog_inventory",
      title: "📦 مشرف المنتجات والمخزون",
      desc: "تحديث الأسعار والمخزون + العروض والخصومات + المراجعات",
      icon: Package,
      keys: ["manage_inventory", "manage_discounts", "manage_reviews"],
      badgeStyle: "bg-purple-600 text-white border-purple-500 shadow-xs",
      cardBorder: "border-purple-200 bg-purple-50/40"
    },
    {
      id: "finance_analyst",
      title: "📊 المحلل المالي والمحاسب",
      desc: "اللوحة المباشرة للبيانات + التقارير المالية والأرباح تفصيلياً",
      icon: PieChart,
      keys: ["view_analytics", "view_reports"],
      badgeStyle: "bg-indigo-600 text-white border-indigo-500 shadow-xs",
      cardBorder: "border-indigo-200 bg-indigo-50/40"
    },
    {
      id: "marketing_content",
      title: "🎨 مسؤول التسويق والمحتوى",
      desc: "بنرات سلايدر الواجهة + كوبونات الخصم + تقييمات العملاء",
      icon: Sparkles,
      keys: ["manage_slider", "manage_discounts", "manage_reviews"],
      badgeStyle: "bg-rose-600 text-white border-rose-500 shadow-xs",
      cardBorder: "border-rose-200 bg-rose-50/40"
    },
    {
      id: "logistics_shipping",
      title: "🚚 مسؤول اللوجستيات والشحن",
      desc: "إدارة مناطق وأسعار المحافظات + تتبع حالة الطلبات والشحنات",
      icon: Truck,
      keys: ["manage_shipping", "manage_orders"],
      badgeStyle: "bg-cyan-600 text-white border-cyan-500 shadow-xs",
      cardBorder: "border-cyan-200 bg-cyan-50/40"
    },
    {
      id: "support_tech",
      title: "💻 مسؤول الدعم والعمليات",
      desc: "متابعة الطلبات والرسوم المباشرة ومراجعة تقييمات وتجربة العملاء",
      icon: Headphones,
      keys: ["manage_orders", "view_analytics", "manage_reviews"],
      badgeStyle: "bg-teal-600 text-white border-teal-500 shadow-xs",
      cardBorder: "border-teal-200 bg-teal-50/40"
    }
  ], [availablePermissions]);

  // Determine base users list
  const baseUsersList = useMemo(() => {
    if (Array.isArray(allUsers) && allUsers.length > 0) return allUsers;
    if (Array.isArray(filteredUsers) && filteredUsers.length > 0) return filteredUsers;
    return [];
  }, [allUsers, filteredUsers]);

  // Search filter
  const searchFilteredUsers = useMemo(() => {
    if (!userSearchQuery) return baseUsersList;
    const query = userSearchQuery.toLowerCase().trim();
    return baseUsersList.filter(u => {
      if (!u) return false;
      const nameMatch = String(u.name || "").toLowerCase().includes(query);
      const emailMatch = String(u.email || "").toLowerCase().includes(query);
      const phoneMatch = String(u.phone || u.phoneNumber || "").includes(query);
      return nameMatch || emailMatch || phoneMatch;
    });
  }, [baseUsersList, userSearchQuery]);

  const handleToggleBlock = async (targetUser) => {
    const targetId = targetUser?.id || targetUser?.uid;
    if (!targetUser || !targetId) return;
    if (targetUser.email === user?.email || isUserMainAdmin(targetUser)) {
      alert(lang === "en" ? "Cannot block main admin account." : "لا يمكن حظر حساب مالك النظام الرئيسي.");
      return;
    }
    const shouldBlock = !targetUser.blocked;
    const confirmMsg = shouldBlock 
      ? (lang === "en" 
          ? `Are you sure you want to block user (${targetUser.name || targetUser.email})?`
          : `هل أنت متأكد من حظر المستخدم (${targetUser.name || targetUser.email})؟ لن يتمكن من الدخول إلى المتجر.`)
      : (lang === "en"
          ? `Unblock user (${targetUser.name || targetUser.email})?`
          : `هل ترغب في فك الحظر عن المستخدم (${targetUser.name || targetUser.email})؟`);
    
    if (!window.confirm(confirmMsg)) return;

    // Immediate optimistic update
    if (typeof setAllUsers === "function") {
      setAllUsers(prev => prev.map(u => (u.id === targetId || u.uid === targetId) ? { ...u, blocked: shouldBlock } : u));
    }
    if (selectedDetailUser && (selectedDetailUser.id === targetId || selectedDetailUser.uid === targetId)) {
      setSelectedDetailUser(prev => ({ ...prev, blocked: shouldBlock }));
    }

    setActionLoadingId(targetId + "_block");
    try {
      await toggleBlockUserInFirestore(targetId, shouldBlock);
      activityLogService.logAction(user?.email, "USER_BLOCK", {
        title: `${shouldBlock ? "حظر" : "فك حظر"} المستخدم (${targetUser.email || targetUser.name || targetId})`,
        description: shouldBlock ? "تم حظر المستخدم من تسجيل الدخول" : "تم فك الحظر عن المستخدم بنجاح"
      });
      triggerDrawerToast(shouldBlock ? (lang === "en" ? "User blocked 🚫" : "تم حظر المستخدم بنجاح 🚫") : (lang === "en" ? "User unblocked 🔓" : "تم فك الحظر عن المستخدم 🔓"));
      if (onRefreshUsers) await onRefreshUsers(true);
    } catch (err) {
      console.error("Error toggling block user:", err);
      // Revert on error
      if (typeof setAllUsers === "function") {
        setAllUsers(prev => prev.map(u => (u.id === targetId || u.uid === targetId) ? { ...u, blocked: !shouldBlock } : u));
      }
      alert(lang === "en" ? "Error updating block status." : "حدث خطأ أثناء تعديل حالة حظر المستخدم");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    const targetId = targetUser?.id || targetUser?.uid;
    if (!targetUser || !targetId) return;
    if (targetUser.email === user?.email || isUserMainAdmin(targetUser)) {
      alert(lang === "en" ? "Cannot delete main admin account." : "لا يمكن حذف حساب مالك النظام الرئيسي.");
      return;
    }

    if (!window.confirm(lang === "en" ? `Permanently delete account (${targetUser.name || targetUser.email})?` : `هل أنت متأكد من حذف الحساب (${targetUser.name || targetUser.email}) نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      return;
    }

    // Immediate optimistic update
    if (typeof setAllUsers === "function") {
      setAllUsers(prev => prev.filter(u => u.id !== targetId && u.uid !== targetId));
    }
    if (isDrawerOpen) closeUserDrawer();

    setActionLoadingId(targetId + "_delete");
    try {
      await deleteUserFromFirestore(targetId);
      activityLogService.logAction(user?.email, "USER_DELETE", {
        title: `حذف حساب المستخدم (${targetUser.email || targetUser.name || targetId})`,
        description: "تم حذف الحساب نهائياً من قاعدة البيانات"
      });
      triggerDrawerToast(lang === "en" ? "Account deleted permanently 🗑️" : "تم حذف الحساب بنجاح 🗑️");
      if (onRefreshUsers) await onRefreshUsers(true);
    } catch (err) {
      console.error("Error deleting user:", err);
      alert(lang === "en" ? "Error deleting account." : "حدث خطأ أثناء حذف الحساب");
    } finally {
      setActionLoadingId(null);
    }
  };

  const triggerDrawerToast = (msg) => {
    setDrawerToast(msg);
    setTimeout(() => setDrawerToast(""), 3500);
  };

  const openUserDrawer = (targetUser) => {
    setSelectedDetailUser(targetUser);
    setIsDrawerOpen(true);
  };

  const closeUserDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedDetailUser(null), 250);
  };

  // Update specific permission toggle
  const handleTogglePermission = async (targetUser, permKey) => {
    const targetId = targetUser?.id || targetUser?.uid;
    if (!targetUser || !targetId) return;
    
    // Main admin does not need permission modification
    if (isUserMainAdmin(targetUser)) {
      triggerDrawerToast(lang === "en" ? "Main Admin has full permissions automatically 👑" : "مالك النظام الرئيسي يتمتع بكافة الصلاحيات تلقائياً 👑");
      return;
    }

    const currentPerms = Array.isArray(targetUser.permissions)
      ? [...targetUser.permissions]
      : availablePermissions.map(p => p.key);

    let newPerms;
    if (currentPerms.includes(permKey)) {
      newPerms = currentPerms.filter(k => k !== permKey);
    } else {
      newPerms = [...currentPerms, permKey];
    }

    // Immediate optimistic update
    if (typeof setAllUsers === "function") {
      setAllUsers(prev => prev.map(u => (u.id === targetId || u.uid === targetId) ? { ...u, permissions: newPerms } : u));
    }
    if (selectedDetailUser && (selectedDetailUser.id === targetId || selectedDetailUser.uid === targetId)) {
      setSelectedDetailUser(prev => ({
        ...prev,
        permissions: newPerms
      }));
    }

    setPermissionUpdatingId(targetId + "_" + permKey);

    try {
      const userRef = doc(db, "users", targetId);
      await updateDoc(userRef, { permissions: newPerms });

      triggerDrawerToast(lang === "en" ? "Permission updated ⚡" : "تم تحديث الصلاحية بنجاح ⚡");

      if (onRefreshUsers) {
        await onRefreshUsers(true);
      }
    } catch (err) {
      console.error("Error updating admin permissions:", err);
      // Revert on error
      if (typeof setAllUsers === "function") {
        setAllUsers(prev => prev.map(u => (u.id === targetId || u.uid === targetId) ? { ...u, permissions: currentPerms } : u));
      }
      alert(lang === "en" ? "Error modifying permissions." : "حدث خطأ أثناء تعديل صلاحيات المدير");
    } finally {
      setPermissionUpdatingId(null);
    }
  };

  // Apply a preset role to user
  const handleApplyPresetRole = async (targetUser, preset) => {
    const targetId = targetUser?.id || targetUser?.uid;
    if (!targetUser || !targetId) return;

    if (isUserMainAdmin(targetUser)) {
      triggerDrawerToast(lang === "en" ? "Main Admin already has unrestricted access 👑" : "مالك النظام الرئيسي يتمتع بصلاحيات كاملة غير محدودة 👑");
      return;
    }

    // Immediate optimistic update
    if (typeof setAllUsers === "function") {
      setAllUsers(prev => prev.map(u => (u.id === targetId || u.uid === targetId) ? { ...u, role: "admin", permissions: preset.keys } : u));
    }
    if (selectedDetailUser && (selectedDetailUser.id === targetId || selectedDetailUser.uid === targetId)) {
      setSelectedDetailUser(prev => ({
        ...prev,
        role: "admin",
        permissions: preset.keys
      }));
    }

    setPermissionUpdatingId(targetId + "_preset");

    try {
      const userRef = doc(db, "users", targetId);
      const updatePayload = { 
        permissions: preset.keys,
        role: "admin"
      };

      await updateDoc(userRef, updatePayload);

      activityLogService.logAction(user?.email, "USER_PRESET_ROLE", {
        title: `تعيين دور (${preset.title}) للمستخدم (${targetUser.email || targetUser.name || targetId})`,
        description: `تم تطبيق عدد ${preset.keys.length} صلاحيات بنقرة واحدة`
      });

      triggerDrawerToast(`تم تطبيق دور: ${preset.title} ✨`);

      if (onRefreshUsers) {
        await onRefreshUsers(true);
      }
    } catch (err) {
      console.error("Error applying preset role:", err);
      alert(lang === "en" ? "Error applying preset role." : "حدث خطأ أثناء تطبيق الدور المجهّز");
    } finally {
      setPermissionUpdatingId(null);
    }
  };

  // Filtered list based on controls
  const displayedUsers = useMemo(() => {
    return searchFilteredUsers.filter((u) => {
      // Role Filter
      if (roleFilter === "ADMIN" && !isUserAdmin(u)) return false;
      if (roleFilter === "CUSTOMER" && isUserAdmin(u)) return false;
      if (roleFilter === "BLOCKED" && !u.blocked) return false;

      // Permission Filter
      if (isUserAdmin(u) && permFilter !== "ALL") {
        if (isUserMainAdmin(u)) {
          if (permFilter === "CUSTOM_PERMS") return false;
        } else {
          const uPerms = Array.isArray(u.permissions) ? u.permissions : availablePermissions.map(p => p.key);
          if (permFilter === "FULL_PERMS" && uPerms.length < availablePermissions.length) return false;
          if (permFilter === "CUSTOM_PERMS" && uPerms.length === availablePermissions.length) return false;
        }
      }

      return true;
    });
  }, [searchFilteredUsers, roleFilter, permFilter, availablePermissions]);

  const totalAdmins = baseUsersList.filter((u) => isUserAdmin(u)).length;
  const totalCustomers = baseUsersList.filter((u) => !isUserAdmin(u)).length;
  const totalBlocked = baseUsersList.filter((u) => u.blocked).length;
  const fullPermsAdmins = baseUsersList.filter((u) => {
    if (isUserMainAdmin(u)) return true;
    if (!isUserAdmin(u)) return false;
    const p = Array.isArray(u.permissions) ? u.permissions : availablePermissions.map(x => x.key);
    return p.length === availablePermissions.length;
  }).length;

  return (
    <div className="space-y-6 animate-fade-in text-right font-sans" dir="rtl">
      
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-[#072d5c] via-[#093c7a] to-[#072d5c] text-white rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-blue-900/50">
        
        {/* Glow ambient design elements */}
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-blue-100 rounded-full text-xs font-black shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>مركز إدارة الصلاحيات والأدوار (Admin Role Center)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">إدارة طاقم العمل والأدوار الوظيفية الجاهزة</h2>
          <p className="text-xs text-blue-100/90 font-bold leading-relaxed">
            تعيين الأدوار الجاهزة (مدير مبيعات، مشرف مخزون، محلل مالي...) بضغطة زر واحدة عبر اللوحة الجانبية، أو تخصيص الصلاحيات جزئياً.
          </p>
        </div>

        {/* Quick Summary Cards */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 w-full md:w-auto">
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-center shadow-inner">
            <span className="text-[10px] font-black text-blue-200 block">إجمالي الحسابات</span>
            <strong className="text-xl font-mono font-black text-white block mt-0.5">{baseUsersList.length}</strong>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-center shadow-inner">
            <span className="text-[10px] font-black text-blue-200 block">طاقم المدراء</span>
            <strong className="text-xl font-mono font-black text-emerald-300 block mt-0.5">{totalAdmins}</strong>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-center shadow-inner">
            <span className="text-[10px] font-black text-blue-200 block">صلاحيات كاملة 👑</span>
            <strong className="text-xl font-mono font-black text-amber-300 block mt-0.5">{fullPermsAdmins}</strong>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-3 text-center shadow-inner">
            <span className="text-[10px] font-black text-blue-200 block">حسابات العملاء</span>
            <strong className="text-xl font-mono font-black text-blue-100 block mt-0.5">{totalCustomers}</strong>
          </div>
        </div>
      </div>

      {/* Modern Filter Controls Bar */}
      <div className="bg-white p-4.5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl overflow-x-auto shrink-0 border border-slate-200/70">
            <button
              type="button"
              onClick={() => setRoleFilter("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === "ALL"
                  ? "bg-[#072d5c] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              الكل ({baseUsersList.length})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("ADMIN")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                roleFilter === "ADMIN"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>المدراء ({totalAdmins})</span>
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("CUSTOMER")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                roleFilter === "CUSTOMER"
                  ? "bg-[#072d5c] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>العملاء ({totalCustomers})</span>
            </button>
            {totalBlocked > 0 && (
              <button
                type="button"
                onClick={() => setRoleFilter("BLOCKED")}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  roleFilter === "BLOCKED"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "text-rose-700 hover:bg-rose-50"
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>محظورين ({totalBlocked})</span>
              </button>
            )}
          </div>

          {/* Permission Sub Filter Dropdown */}
          {roleFilter === "ADMIN" && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl shrink-0">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <select
                value={permFilter}
                onChange={(e) => setPermFilter(e.target.value)}
                className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer"
              >
                <option value="ALL">جميع مستويات الصلاحيات</option>
                <option value="FULL_PERMS">صلاحيات كاملة ({availablePermissions.length}/{availablePermissions.length})</option>
                <option value="CUSTOM_PERMS">صلاحيات محددة جزئية</option>
              </select>
            </div>
          )}

          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <input 
              type="text"
              placeholder="البحث بالاسم، البريد أو رقم الهاتف..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2.5 pr-10 pl-9 text-xs font-bold text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-all text-right shadow-2xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            {userSearchQuery && (
              <button
                type="button"
                onClick={() => setUserSearchQuery("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Export Users to Excel / CSV */}
          <Tooltip text="تصدير جميع العملاء والمستخدمين المعروضين إلى Excel / CSV">
            <button
              onClick={() => exportUsersToExcel(filteredUsers, "سجل_المستخدمين_والعملاء")}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-sm active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير Excel (CSV) 📊</span>
            </button>
          </Tooltip>

        </div>
      </div>

      {/* Users Responsive Cards Grid */}
      {isUsersLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3 bg-white rounded-3xl border border-slate-200 shadow-2xs">
          <Loader2 className="w-9 h-9 animate-spin text-blue-600" />
          <span className="text-xs font-black text-slate-700">جاري تحميل بيانات طاقم العمل والحسابات...</span>
        </div>
      ) : displayedUsers.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-14 text-center text-slate-400 space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-black text-slate-700">لا توجد نتائج مطابقة لمعايير البحث حالياً</h3>
          <p className="text-xs text-slate-500 font-bold max-w-sm mx-auto">
            جرّب تغيير عبارة البحث أو اختيار تصفية أخرى من الشريط بالبريد أو الاسم.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedUsers.map((targetUser) => {
            const isCurrentSelf = targetUser.email === user?.email;
            const isMainAdminTarget = isUserMainAdmin(targetUser);
            const isAdminUser = isMainAdminTarget || isUserAdmin(targetUser);
            const isUpdatingRole = roleUpdatingUserId === targetUser.id;

            const userPerms = isMainAdminTarget
              ? availablePermissions.map(p => p.key)
              : (Array.isArray(targetUser.permissions) ? targetUser.permissions : availablePermissions.map(p => p.key));

            const permCount = userPerms.length;
            const isFullPerms = isMainAdminTarget || permCount === availablePermissions.length;
            const permPercent = isMainAdminTarget ? 100 : Math.round((permCount / availablePermissions.length) * 100);

            // Find matching preset role if any
            const matchedPreset = isMainAdminTarget
              ? presetRolesCatalog[0]
              : presetRolesCatalog.find(preset => {
                  if (preset.keys.length !== userPerms.length) return false;
                  return preset.keys.every(k => userPerms.includes(k));
                });

            return (
              <div 
                key={targetUser.id} 
                className={`bg-white border rounded-3xl p-5 shadow-2xs flex flex-col justify-between gap-4 transition-all hover:shadow-lg hover:-translate-y-0.5 relative overflow-hidden ${
                  targetUser.blocked
                    ? "border-rose-300 bg-rose-50/10"
                    : isMainAdminTarget
                      ? "border-amber-300 bg-gradient-to-b from-amber-50/40 via-white to-white"
                      : isAdminUser 
                        ? "border-blue-200 hover:border-blue-400" 
                        : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Header Profile Section */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      
                      {/* Avatar */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-base shrink-0 border shadow-xs relative ${
                        isMainAdminTarget
                          ? "bg-gradient-to-br from-amber-500 to-amber-700 text-white border-amber-300"
                          : isAdminUser 
                            ? "bg-gradient-to-br from-[#072d5c] to-[#093c7a] text-white border-blue-900" 
                            : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}>
                        {isMainAdminTarget ? (
                          <Crown className="w-6 h-6 text-amber-200" />
                        ) : isAdminUser ? (
                          <ShieldCheck className="w-6 h-6 text-blue-200" />
                        ) : (
                          targetUser.name ? targetUser.name.charAt(0).toUpperCase() : "U"
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-black text-slate-900 truncate">{targetUser.name || "مستخدم متجر"}</h4>
                          {isCurrentSelf && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[9px] font-black border border-blue-200">
                              حسابك
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono block truncate" title={targetUser.email}>
                          {targetUser.email}
                        </span>
                        {targetUser.phone && (
                          <span className="text-[10px] text-slate-400 font-mono block">
                            📞 {targetUser.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Role Badge */}
                    <div className="shrink-0">
                      {targetUser.blocked ? (
                        <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-[10px] font-black inline-flex items-center gap-1">
                          <Ban className="w-3 h-3 text-rose-600" />
                          <span>محظور</span>
                        </span>
                      ) : isMainAdminTarget ? (
                        <span className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white border border-amber-400 rounded-xl text-[10px] font-black inline-flex items-center gap-1 shadow-2xs">
                          <Crown className="w-3 h-3 text-amber-100" />
                          <span>مالك النظام الرئيسي 👑</span>
                        </span>
                      ) : isAdminUser ? (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl text-[10px] font-black inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-blue-600" />
                          <span>مدير نظام</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-black">
                          عميل عادي
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main Admin Unrestricted Badge vs Admin Permissions Matrix */}
                  {isMainAdminTarget ? (
                    <div className="bg-gradient-to-r from-amber-500/10 via-amber-100/30 to-amber-50/20 p-3.5 rounded-2xl border border-amber-200/80 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-black text-amber-950">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>مالك المتجر الرئيسي - صلاحيات كاملة مطلقة (100%)</span>
                      </div>
                      <p className="text-[10.5px] text-amber-900/80 font-bold leading-relaxed">
                        يتميز حساب مالك النظام الرئيسي بالوصول الكامل التلقائي لجميع اللوحات والأدوات والأقسام، ولا يحتاج إلى تعيين صلاحيات جزئية.
                      </p>
                    </div>
                  ) : isAdminUser ? (
                    <div className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
                      
                      {/* Presets Match Indicator */}
                      {matchedPreset ? (
                        <div className="flex items-center justify-between pb-1 text-[10.5px]">
                          <span className="font-bold text-slate-500 flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                            <span>الدور المطبق:</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${matchedPreset.badgeStyle}`}>
                            {matchedPreset.title.split(" (")[0]}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between pb-1 text-[10.5px]">
                          <span className="font-bold text-slate-500 flex items-center gap-1">
                            <SlidersIcon className="w-3.5 h-3.5 text-purple-600" />
                            <span>مستوى الصلاحيات:</span>
                          </span>
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 rounded-md text-[10px] font-black">
                            صلاحيات مخصصة ({permCount})
                          </span>
                        </div>
                      )}

                      {/* Progress Meter Bar */}
                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="font-bold text-slate-600">نسبة التغطية:</span>
                        <span className={`font-mono font-black text-[10px] px-2 py-0.5 rounded-lg border ${
                          isFullPerms 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300" 
                            : permCount > 0 
                              ? "bg-blue-50 text-blue-800 border-blue-200" 
                              : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}>
                          {permCount} / {availablePermissions.length} ({permPercent}%)
                        </span>
                      </div>

                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            isFullPerms ? "bg-emerald-500" : permCount > 4 ? "bg-blue-600" : "bg-amber-500"
                          }`} 
                          style={{ width: `${permPercent}%` }}
                        />
                      </div>

                      {/* Visual Chips */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {availablePermissions.map(p => {
                          const hasIt = userPerms.includes(p.key);
                          const IconComp = p.icon;
                          return (
                            <span 
                              key={p.key} 
                              className={`text-[9.5px] font-black px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1 ${
                                hasIt 
                                  ? `${p.colorBg} shadow-3xs` 
                                  : "bg-slate-100/70 text-slate-400 border-slate-200 opacity-50 line-through"
                              }`}
                              title={`${p.label}: ${hasIt ? 'مفعلة' : 'معطلة'}`}
                            >
                              <IconComp className="w-3 h-3 shrink-0" />
                              <span>{p.label.split(" ")[0]}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/70 text-[11px] text-slate-500 font-bold flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>حساب عميل عادي. اضغط "ترقية 👑" لترقيته إلى مدير واختيار دمج الصلاحيات.</span>
                    </div>
                  )}
                </div>

                {/* Footer Action Bar */}
                <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100 gap-2 flex-wrap">
                  
                  {/* Open Side Drawer Customizer Button */}
                  <button
                    type="button"
                    onClick={() => openUserDrawer(targetUser)}
                    className="flex-1 py-2.5 px-3 bg-[#072d5c] hover:bg-[#093c7a] text-white rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
                  >
                    <SlidersVertical className="w-3.5 h-3.5 text-blue-200" />
                    <span>تحديد الأدوار والصلاحيات</span>
                  </button>

                  {/* Promote / Demote Role Button */}
                  <Tooltip text={isAdminUser ? "تنزيل لرتبة عميل" : "ترقية لرتبة مدير"}>
                    <button
                      type="button"
                      onClick={() => handleToggleRole(targetUser)}
                      disabled={isUpdatingRole || isCurrentSelf || isMainAdminTarget}
                      className={`py-2.5 px-3 text-xs font-black rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40 shrink-0 active:scale-95 ${
                        isAdminUser
                          ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                          : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                      }`}
                    >
                      {isUpdatingRole ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isAdminUser ? (
                        <span>سحب 🛑</span>
                      ) : (
                        <span>ترقية 👑</span>
                      )}
                    </button>
                  </Tooltip>

                  {/* Block / Delete Actions */}
                  {!isCurrentSelf && !isMainAdminTarget && (
                    <>
                      <Tooltip text={targetUser.blocked ? "فك حظر الحساب" : "حظر المستخدم"}>
                        <button
                          type="button"
                          onClick={() => handleToggleBlock(targetUser)}
                          disabled={actionLoadingId === targetUser.id + "_block"}
                          className={`py-2.5 px-2.5 text-xs font-black rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                            targetUser.blocked
                              ? "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                          }`}
                        >
                          {actionLoadingId === targetUser.id + "_block" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : targetUser.blocked ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Ban className="w-3.5 h-3.5 text-rose-600" />
                          )}
                        </button>
                      </Tooltip>

                      <Tooltip text="حذف الحساب نهائياً">
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(targetUser)}
                          disabled={actionLoadingId === targetUser.id + "_delete"}
                          className="py-2.5 px-2.5 text-xs font-black rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                        >
                          {actionLoadingId === targetUser.id + "_delete" ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          )}
                        </button>
                      </Tooltip>
                    </>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modern Side Drawer for Preset Roles & Granular Permissions */}
      {isDrawerOpen && selectedDetailUser && (
        <div className="fixed inset-0 z-50 overflow-hidden text-right font-sans">
          
          {/* Backdrop Overlay */}
          <div 
            onClick={closeUserDrawer}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 sm:pl-10">
            <div className="w-screen max-w-lg bg-white shadow-2xl border-r border-slate-200 flex flex-col h-full animate-slide-left relative">
              
              {/* Toast Notification Banner */}
              {drawerToast && (
                <div className="absolute top-20 left-4 right-4 z-30 bg-[#072d5c] text-white p-3.5 rounded-2xl shadow-2xl text-xs font-black flex items-center justify-between border border-blue-400 animate-fade-in">
                  <span>{drawerToast}</span>
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                </div>
              )}

              {/* Drawer Top Header */}
              <div className="p-5 bg-gradient-to-r from-[#072d5c] via-[#093c7a] to-[#072d5c] text-white flex items-center justify-between gap-3 shrink-0 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center font-black text-lg shadow-inner">
                    {isUserMainAdmin(selectedDetailUser) ? (
                      <Crown className="w-6 h-6 text-amber-300" />
                    ) : selectedDetailUser.role === "admin" ? (
                      <ShieldCheck className="w-6 h-6 text-blue-200" />
                    ) : (
                      selectedDetailUser.name?.charAt(0) || "U"
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{selectedDetailUser.name || "مستخدم متجر"}</h3>
                    <span className="text-[11px] text-blue-200 font-mono block">{selectedDetailUser.email}</span>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={closeUserDrawer}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-blue-100 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Main Scrollable Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 overscroll-contain">
                
                {/* User Overview Box */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                    <span className="font-bold text-slate-500">رتبة الحساب في المتجر:</span>
                    {isUserMainAdmin(selectedDetailUser) ? (
                      <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-black text-[11px] shadow-2xs">
                        مالك النظام الرئيسي 👑
                      </span>
                    ) : selectedDetailUser.role === "admin" ? (
                      <span className="px-3 py-1 bg-blue-100 text-blue-900 border border-blue-200 rounded-xl font-black text-[11px] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>مدير لوحة التحكم</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-slate-200 text-slate-700 rounded-xl font-black text-[11px]">
                        عميل عادي
                      </span>
                    )}
                  </div>

                  {selectedDetailUser.phone && (
                    <div className="flex justify-between items-center pt-1">
                      <span className="font-bold text-slate-500">رقم الهاتف:</span>
                      <span className="font-mono font-black text-slate-800">{selectedDetailUser.phone}</span>
                    </div>
                  )}
                </div>

                {/* Role Switcher (Promote / Demote) */}
                {!isUserMainAdmin(selectedDetailUser) && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-black text-slate-900 block">تعديل رتبة المستخدم الحالية</span>
                        <p className="text-[10px] text-slate-500 font-bold">تحديد ما إذا كان حسابه عميل عادي أم مدير له صلاحيات</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleRole(selectedDetailUser)}
                        disabled={roleUpdatingUserId === selectedDetailUser.id || selectedDetailUser.email === user?.email}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${
                          selectedDetailUser.role === "admin"
                            ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                            : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                        }`}
                      >
                        {roleUpdatingUserId === selectedDetailUser.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : selectedDetailUser.role === "admin" ? (
                          <span>سحب رتبة المدير 🛑</span>
                        ) : (
                          <span>ترقية إلى مدير 👑</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Main Admin Information Note */}
                {isUserMainAdmin(selectedDetailUser) ? (
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-300 p-5 rounded-2xl space-y-3 shadow-2xs">
                    <div className="flex items-center gap-2 text-amber-950 font-black text-xs">
                      <Crown className="w-5 h-5 text-amber-600" />
                      <span>حساب مالك المتجر الرئيسي (Main Admin)</span>
                    </div>
                    <p className="text-xs text-amber-900/90 font-bold leading-relaxed">
                      هذا الحساب يمتلك حق الوصول المطلق إلى جميع ميزات ولوحات النظام بدون استثناء. لا يحتاج إلى ضبط صلاحيات جزئية أو تحديد أدوار مؤقتة.
                    </p>
                  </div>
                ) : (selectedDetailUser.role === "admin" || selectedDetailUser.role === "main_admin") ? (
                  <div className="space-y-6">
                    
                    {/* SECTION 1: PRESET ROLES SELECTION CATALOG */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4 text-blue-600" />
                            <span>الأدوار الوظيفية الجاهزة (تعيين بضغطة زر):</span>
                          </h4>
                          <p className="text-[10px] text-slate-500 font-bold">
                            اختر دور وظيفي مجهز مسبقاً لمنح الصلاحيات المرتبطة به فوراً
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {presetRolesCatalog.map((preset) => {
                          const IconComp = preset.icon;
                          const currentPerms = Array.isArray(selectedDetailUser.permissions)
                            ? selectedDetailUser.permissions
                            : availablePermissions.map(p => p.key);

                          const isCurrentlySelected = preset.keys.length === currentPerms.length &&
                            preset.keys.every(k => currentPerms.includes(k));

                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleApplyPresetRole(selectedDetailUser, preset)}
                              disabled={permissionUpdatingId === selectedDetailUser.id + "_preset"}
                              className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between gap-3 relative overflow-hidden group ${
                                isCurrentlySelected
                                  ? `${preset.cardBorder} shadow-xs ring-2 ring-blue-500/20`
                                  : "bg-white border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/20"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                                  isCurrentlySelected ? preset.badgeStyle : "bg-slate-100 text-slate-700 border-slate-200"
                                }`}>
                                  <IconComp className="w-5 h-5" />
                                </div>

                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-black text-slate-900 block truncate">{preset.title}</span>
                                    {isCurrentlySelected && (
                                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[9px] font-black shadow-2xs">
                                        الدور النشط حالياً ✓
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-bold leading-tight">{preset.desc}</p>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center gap-1.5">
                                <span className="text-[10px] font-mono font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                                  {preset.keys.length} صلاحيات
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* SECTION 2: GRANULAR PERMISSION SWITCHES */}
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            <SlidersIcon className="w-4 h-4 text-purple-600" />
                            <span>التخصيص الدقيق للصلاحيات الفردية:</span>
                          </h4>
                          <p className="text-[10px] text-slate-500 font-bold">
                            يمكنك تفعيل أو إيقاف أي صلاحية مستقلة بحرية
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {availablePermissions.map((perm) => {
                          const userPerms = Array.isArray(selectedDetailUser.permissions)
                            ? selectedDetailUser.permissions
                            : availablePermissions.map(p => p.key);

                          const isEnabled = userPerms.includes(perm.key);
                          const isUpdatingThisPerm = permissionUpdatingId === (selectedDetailUser.id + "_" + perm.key);
                          const PermIcon = perm.icon;

                          return (
                            <div
                              key={perm.key}
                              onClick={async () => {
                                if (selectedDetailUser.email !== user?.email && !isUpdatingThisPerm) {
                                  await handleTogglePermission(selectedDetailUser, perm.key);
                                }
                              }}
                              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                isEnabled 
                                  ? "bg-white border-blue-300 shadow-2xs hover:border-blue-500" 
                                  : "bg-slate-50/80 border-slate-200 opacity-60 hover:opacity-100"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                                  isEnabled ? perm.colorBg : "bg-slate-100 text-slate-400 border-slate-200"
                                }}`}>
                                  <PermIcon className="w-4.5 h-4.5" />
                                </div>

                                <div className="space-y-0.5 min-w-0">
                                  <span className="text-xs font-black text-slate-900 block truncate">{perm.label}</span>
                                  <p className="text-[10px] text-slate-500 font-bold leading-snug">{perm.desc}</p>
                                </div>
                              </div>

                              {/* Custom Toggle Switch Component */}
                              <div className="shrink-0">
                                {isUpdatingThisPerm ? (
                                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                ) : (
                                  <div className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${
                                    isEnabled ? "bg-blue-600 justify-end" : "bg-slate-300 justify-start"
                                  }`}>
                                    <div className="w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-bold text-center space-y-2">
                    <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
                    <p>قم بترقية هذا المستخدم إلى "مدير" أولاً لفتح شاشات الأدوار الوظيفية الجاهزة والتخصيص.</p>
                  </div>
                )}

              </div>

              {/* Drawer Fixed Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
                <button
                  type="button"
                  onClick={closeUserDrawer}
                  className="w-full py-3 bg-[#072d5c] hover:bg-[#093c7a] text-white text-xs font-black rounded-2xl transition-all shadow-md cursor-pointer text-center"
                >
                  إغلاق وحفظ التغييرات
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
