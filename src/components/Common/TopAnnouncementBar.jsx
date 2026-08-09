import React, { useState, useEffect } from "react";
import { Megaphone, X } from "lucide-react";
import { getStoreSettings } from "../../lib/storeSettingsService";

export default function TopAnnouncementBar({ lang = "ar" }) {
  const [settings, setSettings] = useState(() => getStoreSettings());
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e && e.detail) {
        setSettings(e.detail);
      } else {
        setSettings(getStoreSettings());
      }
    };
    window.addEventListener("niletechno_settings_updated", handleUpdate);
    return () => window.removeEventListener("niletechno_settings_updated", handleUpdate);
  }, []);

  if (isDismissed || settings.showAnnouncementBar === false || !settings.announcementText) {
    return null;
  }

  const bgStyle = settings.announcementBg || "bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-900";

  return (
    <div className={`w-full text-white text-[11px] sm:text-xs font-black py-2 px-4 ${bgStyle} shadow-sm border-b border-white/10 flex items-center justify-between gap-3 relative z-50`} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="flex items-center justify-center gap-2 max-w-5xl mx-auto text-center flex-1">
        <Megaphone className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
        <span className="line-clamp-1">{settings.announcementText}</span>
        {settings.announcementCode && (
          <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold shrink-0 shadow-2xs">
            كود: {settings.announcementCode}
          </span>
        )}
      </div>

      <button
        onClick={() => setIsDismissed(true)}
        className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer shrink-0"
        title={lang === "ar" ? "إغلاق الشريط" : "Close"}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
