import React, { useState, useEffect, useRef } from "react";
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  ShoppingBag, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  X 
} from "lucide-react";

export default function NotificationsPopover({
  notifications = [],
  onClose,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onSelectNotification,
  triggerRef,
  lang = "ar"
}) {
  const [filter, setFilter] = useState("ALL"); // "ALL" | "UNREAD"
  const popoverRef = useRef(null);

  // Close when clicking outside (and not on the trigger bell button itself)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && popoverRef.current.contains(e.target)) {
        return;
      }
      if (triggerRef && triggerRef.current && triggerRef.current.contains(e.target)) {
        return;
      }
      onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose, triggerRef]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = filter === "UNREAD" ? notifications.filter((n) => !n.read) : notifications;

  const formatRelativeTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return lang === "ar" ? "الآن" : "Just now";
    if (diffMins < 60) return lang === "ar" ? `منذ ${diffMins} د` : `${diffMins}m`;
    if (diffHours < 24) return lang === "ar" ? `منذ ${diffHours} س` : `${diffHours}h`;
    if (diffDays === 1) return lang === "ar" ? "أمس" : "Yesterday";
    return lang === "ar" ? `منذ ${diffDays} أ` : `${diffDays}d`;
  };

  const getNotifIcon = (notif) => {
    if (notif.type === "ORDER_PLACED") {
      return (
        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
          <ShoppingBag className="w-3.5 h-3.5" />
        </div>
      );
    }
    const status = (notif.status || "").toUpperCase();
    if (status === "SHIPPED" || status === "DISPATCHED") {
      return (
        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
          <Truck className="w-3.5 h-3.5" />
        </div>
      );
    }
    if (status === "DELIVERED" || status === "COMPLETED") {
      return (
        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
          <CheckCircle2 className="w-3.5 h-3.5" />
        </div>
      );
    }
    if (status === "CANCELED" || status === "CANCELLED") {
      return (
        <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
          <XCircle className="w-3.5 h-3.5" />
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 border border-sky-100">
        <Bell className="w-3.5 h-3.5" />
      </div>
    );
  };

  return (
    <>
      {/* Mobile Backdrop Overlay for dimming background on small screens */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[99] sm:hidden" 
      />

      {/* Popover Card - Positioned directly under bell icon, centered */}
      <div
        ref={popoverRef}
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 w-[270px] max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-slate-200/90 z-[100] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 max-h-[380px]"
      >
        {/* Pointer Arrow */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#072d5c] rotate-45 rounded-xs" />

        {/* Header */}
        <div className="relative px-3.5 py-2.5 bg-[#072d5c] text-white flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-200" />
            <h3 className="text-xs font-black tracking-wide">
              {lang === "ar" ? "الإشعارات" : "Notifications"}
            </h3>
            {unreadCount > 0 && (
              <span className="text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.2 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="p-1 hover:bg-white/10 text-blue-100 rounded transition-all cursor-pointer text-[10px] font-bold flex items-center gap-1 active:scale-95"
                title={lang === "ar" ? "قراءة الكل" : "Read all"}
              >
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 text-white/80 hover:text-white rounded transition-all cursor-pointer active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Sub Header / Filter */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10.5px] font-bold shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter("ALL")}
              className={`transition-colors cursor-pointer ${filter === "ALL" ? "text-blue-700 font-black" : "text-slate-500 hover:text-slate-800"}`}
            >
              {lang === "ar" ? "الكل" : "All"} ({notifications.length})
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={() => setFilter("UNREAD")}
              className={`transition-colors cursor-pointer ${filter === "UNREAD" ? "text-blue-700 font-black" : "text-slate-500 hover:text-slate-800"}`}
            >
              {lang === "ar" ? "غير مقروء" : "Unread"} ({unreadCount})
            </button>
          </div>

          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
            >
              <Trash2 className="w-3 h-3" />
              <span>{lang === "ar" ? "مسح" : "Clear"}</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="overflow-y-auto divide-y divide-slate-100 flex-1 min-h-0 [&&::-webkit-scrollbar]:w-1.5 [&&::-webkit-scrollbar-thumb]:bg-slate-300 [&&::-webkit-scrollbar-thumb]:rounded-full">
          {filteredNotifications.length === 0 ? (
            <div className="p-6 text-center space-y-2">
              <div className="w-9 h-9 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <Bell className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-slate-600">
                {filter === "UNREAD"
                  ? lang === "ar" ? "لا توجد إشعارات غير مقروءة" : "No unread notifications"
                  : lang === "ar" ? "لا توجد إشعارات حالياً" : "No notifications yet"}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isUnread = !notif.read;
              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (onMarkRead) onMarkRead(notif.id);
                    if (onSelectNotification) onSelectNotification(notif);
                    onClose();
                  }}
                  className={`p-2.5 transition-all cursor-pointer flex items-start gap-2.5 relative group ${
                    isUnread
                      ? "bg-blue-50/40 hover:bg-blue-50/70 border-r-2 border-r-blue-600"
                      : "bg-white hover:bg-slate-50"
                  }`}
                >
                  {getNotifIcon(notif)}

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-[11px] font-black text-slate-800 truncate">
                        {notif.title}
                      </h4>
                      <span className="text-[9px] font-medium text-slate-400 font-mono shrink-0">
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 font-medium leading-tight line-clamp-2">
                      {notif.message}
                    </p>

                    {notif.orderId && (
                      <div className="pt-0.5 flex items-center gap-0.5 text-[10px] font-bold text-blue-600 group-hover:underline">
                        <span>{lang === "ar" ? "التفاصيل" : "Details"}</span>
                        {lang === "ar" ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </div>
                    )}
                  </div>

                  {isUnread && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer if many notifications */}
        {notifications.length > 4 && (
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-bold shrink-0">
            <span>
              {lang === "ar" ? `إجمالي ${notifications.length} إشعار` : `Total ${notifications.length} alerts`}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-blue-600 hover:underline cursor-pointer font-extrabold"
              >
                {lang === "ar" ? "قراءة الكل" : "Mark all read"}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
