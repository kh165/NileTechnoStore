import React, { useState, useRef } from "react";
import { User, Mail, Smartphone, Lock, Camera, Trash2, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { updateUserPassword } from "../../lib/firebaseService";

export default function AccountProfileSection({
  user,
  username,
  setUsername,
  email,
  setEmail,
  phone,
  setPhone,
  avatar,
  setAvatar,
  handleAvatarChange,
  handleDeleteAvatar,
  handleSaveProfile,
  PRESET_AVATARS,
  setToastMessage,
  setShowToast
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [statusSuccess, setStatusSuccess] = useState("");
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusError("");
    setStatusSuccess("");

    // Check if password change was requested
    const isChangingPassword = Boolean(currentPassword || newPassword);

    if (isChangingPassword) {
      if (!currentPassword) {
        setStatusError("يرجى إدخال كلمة المرور الحالية لتأكيد التغيير.");
        return;
      }
      if (!newPassword) {
        setStatusError("يرجى إدخال كلمة المرور الجديدة.");
        return;
      }
      if (newPassword.length < 6) {
        setStatusError("كلمة المرور الجديدة يجب أن تتكون من 6 أحرف على الأقل.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 1. Update Password if specified
      if (isChangingPassword) {
        await updateUserPassword(currentPassword, newPassword);
        setCurrentPassword("");
        setNewPassword("");
      }

      // 2. Save profile info (Name, Email, Phone, Avatar)
      if (handleSaveProfile) {
        await handleSaveProfile(e);
      }

      const msg = isChangingPassword 
        ? "تم حفظ البيانات وتغيير كلمة المرور بنجاح!" 
        : "تم حفظ التعديلات بنجاح!";
        
      setStatusSuccess(msg);
      if (setToastMessage && setShowToast) {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err) {
      console.error("Error updating account details:", err);
      setStatusError(err.message || "حدث خطأ أثناء حفظ التعديلات.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-150 shadow-sm space-y-6 text-right dir-rtl">
      {/* Title Header */}
      <div className="text-center pb-2">
        <h2 className="text-lg font-extrabold text-slate-900">تفاصيل الحساب</h2>
      </div>

      {/* Avatar Section */}
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="relative group">
          <div className="w-28 h-28 rounded-full bg-blue-50 border-4 border-blue-100/80 overflow-hidden flex items-center justify-center shadow-inner relative">
            {avatar ? (
              <img src={avatar} alt={username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#0051a8]/10 flex items-center justify-center text-[#0051a8]">
                <User className="w-14 h-14 stroke-[1.5]" />
              </div>
            )}
          </div>

          {/* Camera Badge Trigger Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 left-0 bg-[#0051a8] hover:bg-blue-800 text-white p-2.5 rounded-full border-2 border-white shadow-md transition-all active:scale-90 cursor-pointer"
            title="تغيير الصورة الشخصية"
          >
            <Camera className="w-4 h-4" />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Delete Photo option if set */}
        {avatar && (
          <button
            type="button"
            onClick={handleDeleteAvatar}
            className="inline-flex items-center gap-1 text-[11px] font-extrabold text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف الصورة</span>
          </button>
        )}

        {/* Preset Avatars Bar */}
        {PRESET_AVATARS && PRESET_AVATARS.length > 0 && (
          <div className="pt-2 text-center max-w-xs">
            <span className="block text-[10px] font-bold text-slate-400 mb-1.5">أو اختر رمزاً جاهزاً:</span>
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 scrollbar-none">
              {PRESET_AVATARS.map((presetUrl, idx) => {
                const isSelected = avatar === presetUrl;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(presetUrl)}
                    className={`w-9 h-9 rounded-full border-2 overflow-hidden transition-all shrink-0 hover:scale-105 active:scale-95 cursor-pointer ${
                      isSelected 
                        ? "border-[#0051a8] ring-2 ring-blue-100 scale-105" 
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <img src={presetUrl} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        {/* Error / Success Alert Messages */}
        {statusError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{statusError}</span>
          </div>
        )}

        {statusSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{statusSuccess}</span>
          </div>
        )}

        {/* Section 1: البيانات الشخصية */}
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 border-r-4 border-[#0051a8] pr-2 py-0.5">
            البيانات الشخصية
          </h3>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 pr-1">الاسم الكامل</label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل الاسم الكامل"
                className="w-full bg-slate-100/70 hover:bg-slate-100 border border-slate-200/80 rounded-2xl py-3 px-4 pl-11 text-xs font-bold text-slate-800 outline-none focus:border-[#0051a8] focus:bg-white focus:ring-4 focus:ring-blue-100/50 transition-all placeholder:text-slate-400"
                required
              />
              <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 pr-1">البريد الإلكتروني</label>
            <div className="relative flex items-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-slate-100/70 hover:bg-slate-100 border border-slate-200/80 rounded-2xl py-3 px-4 pl-11 text-xs font-bold text-slate-800 outline-none focus:border-[#0051a8] focus:bg-white focus:ring-4 focus:ring-blue-100/50 transition-all font-mono placeholder:text-slate-400"
                required
              />
              <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                <Mail className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 pr-1">رقم الجوال</label>
            <div className="relative flex items-center">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0501234567"
                className="w-full bg-slate-100/70 hover:bg-slate-100 border border-slate-200/80 rounded-2xl py-3 px-4 pl-11 text-xs font-bold text-slate-800 outline-none focus:border-[#0051a8] focus:bg-white focus:ring-4 focus:ring-blue-100/50 transition-all placeholder:text-slate-400"
              />
              <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                <Smartphone className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: تغيير كلمة المرور */}
        <div className="space-y-4 pt-3 border-t border-slate-150">
          <h3 className="text-sm font-extrabold text-slate-900 border-r-4 border-[#0051a8] pr-2 py-0.5">
            تغيير كلمة المرور
          </h3>

          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 pr-1">كلمة المرور الحالية</label>
            <div className="relative flex items-center">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الحالية"
                className="w-full bg-slate-100/70 hover:bg-slate-100 border border-slate-200/80 rounded-2xl py-3 px-4 pl-11 text-xs font-bold text-slate-800 outline-none focus:border-[#0051a8] focus:bg-white focus:ring-4 focus:ring-blue-100/50 transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute left-3.5 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                title={showCurrentPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 pr-1">كلمة المرور الجديدة</label>
            <div className="relative flex items-center">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة"
                className="w-full bg-slate-100/70 hover:bg-slate-100 border border-slate-200/80 rounded-2xl py-3 px-4 pl-11 text-xs font-bold text-slate-800 outline-none focus:border-[#0051a8] focus:bg-white focus:ring-4 focus:ring-blue-100/50 transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute left-3.5 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                title={showNewPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Action Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#0051a8] hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-extrabold py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري حفظ التعديلات...</span>
              </>
            ) : (
              <span>حفظ التعديلات</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
