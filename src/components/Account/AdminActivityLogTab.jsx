import React, { useState, useEffect, useMemo } from "react";
import { activityLogService } from "../../lib/activityLogService";
import { getActivityLogsFromFirestore, listenToActivityLogsFromFirestore } from "../../lib/firebaseService";
import { isUserMainAdmin } from "../../lib/constants";
import { ShieldCheck, Clock, User, Filter, Trash2, RefreshCw, FileText, Lock, Users } from "lucide-react";

export default function AdminActivityLogTab({ currentUserEmail, currentUser }) {
  const [logs, setLogs] = useState([]);
  const [filterType, setFilterType] = useState("ALL");
  const [selectedAdminEmail, setSelectedAdminEmail] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isMainAdmin = useMemo(() => {
    if (currentUser) return isUserMainAdmin(currentUser);
    if (currentUserEmail) return isUserMainAdmin({ email: currentUserEmail, role: "main_admin" });
    return true; // fallback if props omitted
  }, [currentUser, currentUserEmail]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const firestoreLogs = await getActivityLogsFromFirestore();
      if (Array.isArray(firestoreLogs) && firestoreLogs.length > 0) {
        setLogs(firestoreLogs);
      } else {
        const fallbackLogs = await activityLogService.getLogs();
        setLogs(Array.isArray(fallbackLogs) ? fallbackLogs : []);
      }
    } catch {
      try {
        const fallbackLogs = await activityLogService.getLogs();
        setLogs(Array.isArray(fallbackLogs) ? fallbackLogs : []);
      } catch {
        setLogs([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();

    // Listen to real-time Firestore activity logs
    let unsubscribe = () => {};
    try {
      unsubscribe = listenToActivityLogsFromFirestore((firestoreLogs) => {
        if (Array.isArray(firestoreLogs)) {
          setLogs(firestoreLogs);
        }
      });
    } catch (e) {
      console.error("Listener setup error:", e);
    }

    const handleUpdate = () => loadLogs();
    window.addEventListener("admin_log_updated", handleUpdate);

    return () => {
      if (typeof unsubscribe === "function") {
        try { unsubscribe(); } catch {}
      }
      window.removeEventListener("admin_log_updated", handleUpdate);
    };
  }, []);

  const handleClear = async () => {
    if (window.confirm("هل أنت متأكد من مسح جميع سجلات العمليات؟")) {
      setIsLoading(true);
      try {
        await activityLogService.clearLogs();
        setLogs([]);
      } catch (err) {
        console.error("Error clearing logs:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const safeLogs = Array.isArray(logs) ? logs : [];

  const uniqueAdmins = useMemo(() => {
    const set = new Set();
    safeLogs.forEach(log => {
      if (log && log.adminEmail) set.add(log.adminEmail);
    });
    return Array.from(set);
  }, [safeLogs]);

  const filteredLogs = safeLogs.filter((log) => {
    if (!log) return false;
    if (filterType !== "ALL" && log.actionType !== filterType) return false;
    if (selectedAdminEmail !== "ALL" && log.adminEmail !== selectedAdminEmail) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchEmail = String(log.adminEmail || "").toLowerCase().includes(term);
      const matchDetails = JSON.stringify(log.details || "").toLowerCase().includes(term);
      return matchEmail || matchDetails;
    }
    return true;
  });

  const getActionBadge = (type) => {
    switch (type) {
      case "ORDER_STATUS":
        return <span className="bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">تعديل حالة طلب</span>;
      case "ORDER_DELETE":
        return <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">حذف طلب</span>;
      case "USER_BLOCK":
        return <span className="bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">حظر / فك حظر</span>;
      case "USER_ROLE_CHANGE":
        return <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">تعديل صلاحيات الأدمن</span>;
      case "USER_PRESET_ROLE":
        return <span className="bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800">تخصيص الصلاحيات</span>;
      case "USER_DELETE":
        return <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">حذف مستخدم</span>;
      case "REVIEW_APPROVE":
        return <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">موافقة على تقييم</span>;
      case "REVIEW_DELETE":
        return <span className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">حذف تقييم</span>;
      case "SLIDER_UPDATE":
        return <span className="bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">تحديث السلايدر الإعلاني</span>;
      default:
        return <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">{type || "عملية إدارية"}</span>;
    }
  };

  const formatLogDate = (val) => {
    if (!val) return "غير محدد";
    try {
      let d;
      if (typeof val === "object" && val !== null && val.seconds) {
        d = new Date(val.seconds * 1000);
      } else {
        d = new Date(val);
      }
      if (isNaN(d.getTime())) return "غير محدد";
      return d.toLocaleString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "غير محدد";
    }
  };

  if (!isMainAdmin) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 sm:p-12 text-center space-y-4 my-6 text-right font-sans" dir="rtl">
        <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner border border-rose-200">
          <Lock className="w-7 h-7 text-rose-600" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-rose-950">صلاحية محددة للمالك الرئيسي فقط 🔒</h3>
          <p className="text-xs text-rose-800 font-bold max-w-md mx-auto leading-relaxed">
            سجل النشاطات مقتصر حصرياً على حساب المدير الرئيسي لمتابعة العمليات والأمان.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-sm">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">سجل نشاطات وعمليات الأدمن (Activity Log)</h2>
            <p className="text-xs text-slate-500 font-bold">تسجيل ومراقبة الأنشطة والتغييرات في المتجر لأغراض الأمان والأداء</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            disabled={isLoading}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </button>
          
          <button
            onClick={handleClear}
            disabled={isLoading || safeLogs.length === 0}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border border-rose-200 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح السجل</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 border border-slate-200 rounded-2xl shadow-xs">
        <div className="w-full md:w-64 relative">
          <input
            type="text"
            placeholder="البحث بالبريد أو التفاصيل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 outline-none focus:border-slate-400 text-right"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Admin User Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shrink-0">
            <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={selectedAdminEmail}
              onChange={(e) => setSelectedAdminEmail(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">جميع المدراء ({uniqueAdmins.length})</option>
              {uniqueAdmins.map((email) => (
                <option key={email} value={email}>{email}</option>
              ))}
            </select>
          </div>

          {/* Action Type Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">جميع أنواع الأنشطة</option>
              <option value="ORDER_STATUS">تعديل حالة الطلبات</option>
              <option value="ORDER_DELETE">حذف الطلبات</option>
              <option value="USER_BLOCK">حظر وفك حظر المستخدمين</option>
              <option value="USER_ROLE_CHANGE">تعديل صلاحيات الأدمن</option>
              <option value="USER_PRESET_ROLE">تخصيص الصلاحيات والأقسام</option>
              <option value="USER_DELETE">حذف حسابات المستخدمين</option>
              <option value="REVIEW_APPROVE">الموافقة على التقييمات</option>
              <option value="REVIEW_DELETE">حذف التقييمات</option>
              <option value="SLIDER_UPDATE">تعديل السلايدر الإعلاني</option>
            </select>
          </div>
        </div>
      </div>

      {/* Log List */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">جاري تحميل سجل النشاطات...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-500">لا توجد سجلات نشاط مسجلة حالياً</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <div key={log.id || log.timestamp || Math.random()} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-right">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getActionBadge(log.actionType)}
                    <span className="text-xs font-black text-slate-900">{log.details?.title || log.actionType || "عملية إدارية"}</span>
                  </div>
                  
                  {log.details?.description && (
                    <p className="text-xs text-slate-600 font-bold line-clamp-2">{log.details.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 font-bold shrink-0">
                  <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-slate-700 font-mono text-[11px]">{log.adminEmail || currentUserEmail || "مدير"}</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatLogDate(log.timestamp || log.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

