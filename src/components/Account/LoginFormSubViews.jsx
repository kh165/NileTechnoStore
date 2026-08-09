import React from "react";
import { Mail, User, Lock, Eye, EyeOff, ShoppingBag, ChevronLeft, AlertCircle, RefreshCw } from "lucide-react";

export function GatewayView({ isSubmitting, error, handleGoogleSignIn, setError, setFormState }) {
  return (
    <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-xl overflow-hidden">
      {/* Curved Blue Header */}
      <div className="bg-gradient-to-b from-[#072d5c] to-[#0a3c75] text-white pt-6 sm:pt-14 pb-12 sm:pb-20 relative text-center">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-500/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white border-4 border-slate-50 flex items-center justify-center shadow-lg -mb-16 sm:-mb-28 mt-1 sm:mt-2 transition-all duration-300">
            <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-[#072d5c] flex items-center justify-center text-white">
              <User className="w-6 h-6 sm:w-10 sm:h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="pt-10 sm:pt-20 pb-5 sm:pb-8 px-4 sm:px-6 text-center">
        <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">حسابي الشخصي</h2>
        <p className="text-[11px] sm:text-sm text-slate-500 font-bold mt-1.5 sm:mt-2.5 px-2 sm:px-4 leading-relaxed mb-4">
          سجل دخولك للتمتع بتجربة تسوق متكاملة وتتبع طلباتك وإدارة حسابك بسهولة وسرعة!
        </p>

        {error && (
          <div className="mx-1 sm:mx-4 mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-right text-[10px] sm:text-[11px] font-bold text-rose-600">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="flex-1">
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Google Quick Sign-In */}
        <div className="mt-4 px-1 sm:px-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[11px] sm:text-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.51 15.01 1 12 1 7.24 1 3.2 3.74 1.25 7.75l3.85 2.99C6.01 7.7 8.78 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.87 3.39-8.48z"
              />
              <path
                fill="#FBBC05"
                d="M5.1 14.76c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.25 7.19C.45 8.79 0 10.57 0 12.43s.45 3.64 1.25 5.24l3.85-2.91z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.08-4.3 1.08-3.22 0-5.99-2.66-6.9-6.01L1.25 15.31C3.2 19.32 7.24 22 12 23z"
              />
            </svg>
            <span>متابعة باستخدام Google</span>
          </button>
        </div>

        <div className="relative flex py-3 items-center justify-center text-xs text-slate-300">
          <span className="flex-grow border-t border-slate-100"></span>
          <span className="mx-3 text-[10px] text-slate-400 font-bold">أو البريد الإلكتروني</span>
          <span className="flex-grow border-t border-slate-100"></span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 px-1 sm:px-4">
          <button
            onClick={() => {
              setError("");
              setFormState("login");
            }}
            className="w-full py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#072d5c] to-[#0b4691] hover:from-[#0a3c75] hover:to-[#072d5c] text-white font-extrabold text-[11px] sm:text-sm shadow-md transition-all active:scale-98 cursor-pointer"
          >
            تسجيل الدخول بالبريد
          </button>

          <button
            onClick={() => {
              setError("");
              setFormState("register");
            }}
            className="w-full py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-[#072d5c] font-extrabold text-[11px] sm:text-sm transition-all active:scale-98 cursor-pointer"
          >
            إنشاء حساب جديد
          </button>
        </div>
      </div>
    </div>
  );
}

export function LoginView({
  error,
  setError,
  showResendBtn,
  handleResendVerification,
  isSubmitting,
  resendSuccess,
  handleLoginSubmit,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  showLoginPassword,
  setShowLoginPassword,
  setForgotEmail,
  setFormState,
  handleGoogleSignIn,
  onGuestBrowse
}) {
  return (
    <div className="bg-[#f8fafc] rounded-[24px] sm:rounded-[32px] overflow-hidden border border-slate-100 shadow-xl pb-4 sm:pb-6">
      <div className="bg-gradient-to-b from-[#072d5c] to-[#0a3c75] text-white pt-6 sm:pt-10 pb-8 sm:pb-12 text-center relative px-4 sm:px-6">
        <div className="absolute top-[-20px] left-[-20px] w-32 h-32 rounded-full bg-blue-500/15 blur-2xl"></div>
        
        <div className="flex flex-col items-center relative z-10">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-xl sm:rounded-3xl flex items-center justify-center shadow-md mb-1.5 sm:mb-3">
            <ShoppingBag className="w-5 h-5 sm:w-8 sm:h-8 text-[#072d5c]" />
          </div>
          <h1 className="text-base sm:text-xl font-black tracking-tight">NileTechno</h1>
          <p className="text-[8px] sm:text-[10px] text-blue-200 mt-0.5 font-bold">تسجيل سريع وسهل لحسابك.</p>
        </div>
      </div>

      <div className="bg-white rounded-[20px] sm:rounded-[32px] p-4 sm:p-6 mx-2.5 sm:mx-4 -mt-4 sm:-mt-6 relative z-20 shadow-lg border border-slate-100/50">
        <div className="mb-3 sm:mb-6">
          <h2 className="text-sm sm:text-lg font-black text-slate-900">تسجيل الدخول</h2>
          <p className="text-[10px] sm:text-xs text-slate-400 font-bold mt-0.5">مرحباً بك مجدداً 👋</p>
        </div>

        {error && (
          <div className="mb-3 space-y-2">
            <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[10px] sm:text-[11px] font-bold text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
            {showResendBtn && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 hover:bg-blue-100/75 text-blue-700 font-bold text-[10px] sm:text-xs rounded-xl border border-blue-100 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>إعادة إرسال رابط التفعيل الآن</span>
              </button>
            )}
          </div>
        )}

        {resendSuccess && (
          <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] sm:text-[11px] font-bold text-emerald-600 leading-relaxed">
            {resendSuccess}
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-2.5 sm:space-y-4">
          <div>
            <label className="block text-[10px] sm:text-[13px] font-bold text-slate-600 mb-0.5 sm:mb-1.5 mr-1">البريد الإلكتروني</label>
            <div className="relative flex items-center">
              <input
                type="email"
                placeholder="example@niletechno.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/75 pr-10 sm:pr-11 pl-4 py-2 sm:py-3 text-[11px] sm:text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium font-sans"
                required
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Mail className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-0.5 sm:mb-1.5 mr-1 ml-1">
              <label className="block text-[10px] sm:text-[13px] font-bold text-slate-600">كلمة المرور</label>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setForgotEmail(loginEmail);
                  setFormState("forgot");
                }}
                className="text-[9px] sm:text-xs text-blue-500 hover:underline font-bold"
              >
                نسيت كلمة المرور؟
              </button>
            </div>
            <div className="relative flex items-center">
              <input
                type={showLoginPassword ? "text" : "password"}
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/75 pr-10 sm:pr-11 pl-10 sm:pl-11 py-2 sm:py-3 text-[11px] sm:text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium font-sans"
                required
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Lock className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowLoginPassword(!showLoginPassword)}
                }
                className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showLoginPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" /> : <Eye className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-2.5 sm:py-3.5 rounded-xl bg-gradient-to-r from-[#072d5c] to-[#0b4691] hover:from-[#0b4691] hover:to-[#072d5c] text-white font-extrabold text-[11px] sm:text-sm tracking-wide transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-blue-900/10"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
            ) : (
              <>
                <span>تسجيل الدخول</span>
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Google InLogin */}
        <div className="mt-3.5 pt-3.5 border-t border-slate-100">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[10px] sm:text-xs transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.51 15.01 1 12 1 7.24 1 3.2 3.74 1.25 7.75l3.85 2.99C6.01 7.7 8.78 5.04 12 5.04z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.43h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.87 3.39-8.48z"
              />
              <path
                fill="#FBBC05"
                d="M5.1 14.76c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.25 7.19C.45 8.79 0 10.57 0 12.43s.45 3.64 1.25 5.24l3.85-2.91z"
              />
              <path
                fill="#34A853"
                d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.08-4.3 1.08-3.22 0-5.99-2.66-6.9-6.01L1.25 15.31C3.2 19.32 7.24 22 12 23z"
              />
            </svg>
            <span>تسجيل دخول عبر Google</span>
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setError("");
              setFormState("register");
            }}
            className="text-[11px] sm:text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            ليس لديك حساب؟ <span className="text-emerald-500 font-extrabold">أنشئ حساباً</span>
          </button>
        </div>
      </div>

      <div className="text-center mt-3 sm:mt-5">
        <button
          onClick={() => {
            if (onGuestBrowse) {
              onGuestBrowse();
            } else {
              setFormState("gateway");
            }
          }}
          className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer transition-colors"
        >
          <span>التصفح كزائر</span>
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
}

export function RegisterView({
  setError,
  setFormState,
  error,
  handleRegisterSubmit,
  registerName,
  setRegisterName,
  registerEmail,
  setRegisterEmail,
  registerPassword,
  setRegisterPassword,
  showRegPassword,
  setShowRegPassword,
  registerConfirmPassword,
  setRegisterConfirmPassword,
  showRegConfirmPassword,
  setShowRegConfirmPassword,
  isSubmitting
}) {
  return (
    <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-xl p-4 sm:p-6 relative">
      <button
        onClick={() => {
          setError("");
          setFormState("gateway");
        }}
        className="absolute top-3 sm:top-5 right-3 sm:right-5 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center border border-slate-100 text-slate-500 cursor-pointer transition-all"
        title="رجوع"
      >
        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 transform rotate-180" />
      </button>

      <div className="mt-4 sm:mt-8 mb-3 sm:mb-6">
        <h2 className="text-sm sm:text-lg font-black text-slate-900">إنشاء حساب جديد</h2>
        <p className="text-[10px] sm:text-xs text-slate-400 font-bold mt-0.5 sm:mt-1 leading-relaxed">
          سجل الآن وابدأ تجربة تسوق مميزة ومحمية بالتحقق من بريدك.
        </p>
      </div>

      {error && (
        <div className="mb-3 p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[10px] sm:text-[11px] font-bold text-rose-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleRegisterSubmit} className="space-y-2.5 sm:space-y-3.5">
        <div>
          <label className="block text-[10px] sm:text-[13px] font-bold text-slate-600 mb-0.5 sm:mb-1.5 mr-1">الاسم بالكامل</label>
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="خالد صلاح"
              value={registerName}
              onChange={(e) => setRegisterName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/75 pr-10 sm:pr-11 pl-4 py-2 sm:py-3 text-[11px] sm:text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium font-sans"
              required
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <User className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] sm:text-[13px] font-bold text-slate-600 mb-0.5 sm:mb-1.5 mr-1">البريد الإلكتروني</label>
          <div className="relative flex items-center">
            <input
              type="email"
              placeholder="example@niletechno.com"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/75 pr-10 sm:pr-11 pl-4 py-2 sm:py-3 text-[11px] sm:text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium font-sans"
              required
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Mail className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] sm:text-[13px] font-bold text-slate-600 mb-0.5 sm:mb-1.5 mr-1">كلمة المرور</label>
          <div className="relative flex items-center">
            <input
              type={showRegPassword ? "text" : "password"}
              placeholder="••••••••"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/75 pr-10 sm:pr-11 pl-10 sm:pl-11 py-2 sm:py-3 text-[11px] sm:text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium font-sans"
              required
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Lock className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />
            </div>
            <button
              type="button"
              onClick={() => setShowRegPassword(!showRegPassword)}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showRegPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" /> : <Eye className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] sm:text-[13px] font-bold text-slate-600 mb-0.5 sm:mb-1.5 mr-1">تأكيد كلمة المرور</label>
          <div className="relative flex items-center">
            <input
              type={showRegConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              value={registerConfirmPassword}
              onChange={(e) => setRegisterConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/75 pr-10 sm:pr-11 pl-10 sm:pl-11 py-2 sm:py-3 text-[11px] sm:text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium font-sans"
              required
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Lock className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />
            </div>
            <button
              type="button"
              onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" /> : <Eye className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2.5 py-2.5 sm:py-3.5 rounded-xl bg-gradient-to-r from-[#072d5c] to-[#0b4691] hover:from-[#0b4691] hover:to-[#072d5c] text-white font-extrabold text-[11px] sm:text-sm tracking-wide transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-blue-900/10"
        >
          {isSubmitting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
          ) : (
            <span>إنشاء الحساب وتفعيل البريد الإلكتروني</span>
          )}
        </button>
      </form>

      <div className="mt-4 text-center border-t border-slate-100 pt-3">
        <button
          onClick={() => {
            setError("");
            setFormState("login");
          }}
          className="text-[11px] sm:text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
        >
          لديك حساب بالفعل؟ <span className="text-[#072d5c] hover:underline font-extrabold">تسجيل الدخول</span>
        </button>
      </div>
    </div>
  );
}

export function VerificationPendingView({
  setError,
  setResendSuccess,
  setFormState,
  registerEmail,
  loginEmail,
  unverifiedUser,
  error,
  resendSuccess,
  handleResendVerification,
  isSubmitting,
  onCancel
}) {
  const emailToShow = unverifiedUser?.email || registerEmail || loginEmail || "";

  return (
    <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-xl p-6 sm:p-8 relative text-center max-w-md mx-auto">
      <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-5 shadow-inner">
        <Mail className="w-8 h-8" />
      </div>

      <h2 className="text-lg sm:text-xl font-black text-slate-900">تفعيل حسابك</h2>
      <p className="text-emerald-600 font-extrabold text-sm mt-1">تم إرسال رابط التفعيل بنجاح!</p>
      
      <p className="text-xs sm:text-sm text-slate-500 font-bold mt-4 leading-relaxed">
        لقد أرسلنا رسالة تفعيل إلى بريدك الإلكتروني <strong className="text-[#072d5c] font-black font-sans">{emailToShow}</strong>. يرجى فتح علبة بريدك والضغط على الرابط لتأكيد حسابك.
      </p>

      <div className="mt-4 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-[11px] sm:text-xs text-slate-600 font-bold leading-relaxed flex items-center gap-2 justify-center">
        <span className="text-[#072d5c] text-lg">💡</span>
        <span>لا داعي لإغلاق هذه الصفحة؛ سيتم تسجيل دخولك وتنشيط حسابك تلقائياً وبشكل فوري بمجرد ضغطك على رابط التفعيل بالبريد!</span>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-600 leading-relaxed flex items-center gap-2 justify-center">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {resendSuccess && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-600 leading-relaxed">
          {resendSuccess}
        </div>
      )}

      <div className="space-y-3 mt-6">
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#072d5c] to-[#0b4691] hover:from-[#0b4691] hover:to-[#072d5c] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>العودة إلى شاشة تسجيل الدخول</span>
        </button>

        <button
          type="button"
          onClick={handleResendVerification}
          disabled={isSubmitting}
          className="w-full py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-xs sm:text-sm transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
          <span>إعادة إرسال رابط التفعيل</span>
        </button>
      </div>

      <div className="mt-6 text-center border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
        >
          تسجيل بريد إلكتروني آخر
        </button>
      </div>
    </div>
  );
}

export function ForgotPasswordView({
  setError,
  setForgotSuccess,
  setFormState,
  error,
  forgotSuccess,
  handleForgotPasswordSubmit,
  forgotEmail,
  setForgotEmail,
  isSubmitting
}) {
  return (
    <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-xl p-4 sm:p-6 relative">
      <button
        onClick={() => {
          setError("");
          setForgotSuccess("");
          setFormState("login");
        }}
        className="absolute top-3 sm:top-5 right-3 sm:right-5 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center border border-slate-100 text-slate-500 cursor-pointer transition-all"
        title="رجوع"
      >
        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 transform rotate-180" />
      </button>

      <div className="mt-4 sm:mt-8 mb-3 sm:mb-6">
        <h2 className="text-sm sm:text-lg font-black text-slate-900">إعادة تعيين كلمة المرور</h2>
        <p className="text-[10px] sm:text-xs text-slate-400 font-bold mt-0.5 sm:mt-1 leading-relaxed">
          أدخل بريدك الإلكتروني المسجل وسنقوم بإرسال رابط لتغيير كلمة المرور الخاصة بك.
        </p>
      </div>

      {error && (
        <div className="mb-3 p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[10px] sm:text-[11px] font-bold text-rose-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {forgotSuccess && (
        <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] sm:text-[11px] font-bold text-emerald-600 leading-relaxed">
          {forgotSuccess}
        </div>
      )}

      <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] sm:text-[13px] font-bold text-slate-600 mb-0.5 sm:mb-1.5 mr-1">البريد الإلكتروني</label>
          <div className="relative flex items-center">
            <input
              type="email"
              placeholder="example@niletechno.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/75 pr-10 sm:pr-11 pl-4 py-2 sm:py-3 text-[11px] sm:text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all font-medium font-sans"
              required
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Mail className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 sm:py-3.5 rounded-xl bg-[#072d5c] hover:bg-[#0a3c75] text-white font-extrabold text-[11px] sm:text-sm tracking-wide transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
        >
          {isSubmitting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
          ) : (
            <span>إرسال رابط إعادة التعيين</span>
          )}
        </button>
      </form>

      <div className="mt-4 text-center border-t border-slate-100 pt-3">
        <button
          onClick={() => {
            setError("");
            setForgotSuccess("");
            setFormState("login");
          }}
          className="text-[11px] sm:text-xs font-bold text-[#072d5c] hover:underline cursor-pointer"
        >
          العودة لتسجيل الدخول
        </button>
      </div>
    </div>
  );
}
