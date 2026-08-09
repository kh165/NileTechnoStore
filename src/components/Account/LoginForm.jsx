import React, { useState, useEffect } from "react";
import { loginUser, registerUser, loginWithGoogle, resetPassword, checkEmailExists, resendVerificationLink, getUserProfile, updateUserProfile } from "../../lib/firebaseService";
import { GatewayView, LoginView, RegisterView, VerificationPendingView, ForgotPasswordView } from "./LoginFormSubViews";
import { storage } from "../../lib/storage";

// Centralized email validation helper (Martin Fowler's Extract Function)
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function LoginForm({ onLoginSuccess, onGuestBrowse, unverifiedUser }) {
  // 'gateway' | 'login' | 'register' | 'otp' | 'forgot'
  const [formState, setFormState] = useState(() => {
    return unverifiedUser ? "otp" : "gateway";
  });

  // Sync formState if unverifiedUser changes
  useEffect(() => {
    if (unverifiedUser) {
      setFormState("otp");
    }
  }, [unverifiedUser]);

  // Real-time polling to check if unverified user validates their email
  useEffect(() => {
    if (unverifiedUser && formState === "otp") {
      let isActive = true;
      const interval = setInterval(async () => {
        try {
          const { auth } = await import("../../lib/firebase");
          if (auth.currentUser) {
            await auth.currentUser.reload();
            if (auth.currentUser.emailVerified && isActive) {
              clearInterval(interval);
              const profile = await getUserProfile(auth.currentUser.uid);
              if (profile) {
                storage.setCurrentUser(profile);
                onLoginSuccess(profile);
              }
            }
          }
        } catch (err) {
          console.error("Auto-verification checking error:", err);
        }
      }, 3000);

      return () => {
        isActive = false;
        clearInterval(interval);
      };
    }
  }, [unverifiedUser, formState]);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form States
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  // Verification helper states
  const [showResendBtn, setShowResendBtn] = useState(false);
  const [resendSuccess, setResendSuccess] = useState("");

  // Shared UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // --- Handlers ---

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowResendBtn(false);
    setResendSuccess("");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
      return;
    }

    if (!validateEmail(loginEmail)) {
      setError("يرجى إدخال بريد إلكتروني صحيح.");
      return;
    }

    setIsSubmitting(true);
    try {
      const profile = await loginUser(loginEmail.trim(), loginPassword);
      setIsSubmitting(false);
      storage.setCurrentUser(profile);
      onLoginSuccess(profile);
    } catch (err) {
      setIsSubmitting(false);
      if (err.message.includes("email-not-verified") || err.message.includes("البريد الإلكتروني غير مفعّل بعد")) {
        setShowResendBtn(true);
      }
      setError(err.message || "حدث خطأ أثناء تسجيل الدخول.");
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!registerName.trim() || !registerEmail.trim() || !registerPassword.trim() || !registerConfirmPassword.trim()) {
      setError("يرجى ملء جميع الحقول المطلوبة.");
      return;
    }

    if (!validateEmail(registerEmail)) {
      setError("يرجى إدخال بريد إلكتروني صحيح.");
      return;
    }

    if (registerPassword.length < 6) {
      setError("يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.");
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(registerPassword);
    const hasNumber = /[0-9]/.test(registerPassword);
    if (!hasLetter || !hasNumber) {
      setError("يجب أن تحتوي كلمة المرور على حرف ورقم واحد على الأقل لزيادة الأمان.");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    setIsSubmitting(true);

    try {
      const exists = await checkEmailExists(registerEmail);
      if (exists) {
        setIsSubmitting(false);
        setError("هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول أو استخدام بريد آخر.");
        return;
      }
    } catch (err) {
      console.error("Error checking email existence:", err);
    }

    try {
      const profile = await registerUser(
        registerEmail.trim(),
        registerPassword,
        registerName.trim()
      );
      setIsSubmitting(false);
      setFormState("otp"); // Reuse 'otp' screen state as our Firebase verification pending screen
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message || "حدث خطأ أثناء إنشاء حسابك في Firebase.");
    }
  };

  const handleResendVerification = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setResendSuccess("");
    setIsSubmitting(true);

    try {
      const targetEmail = registerEmail || loginEmail || (unverifiedUser ? unverifiedUser.email : "");
      const targetPassword = registerPassword || loginPassword;

      await resendVerificationLink(targetEmail.trim(), targetPassword);
      setIsSubmitting(false);
      setResendSuccess("تم إعادة إرسال رابط التفعيل بنجاح! يرجى مراجعة بريدك الإلكتروني.");
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message || "فشل إعادة إرسال رابط التفعيل.");
    }
  };

  const handleCancelVerification = async () => {
    setError("");
    setResendSuccess("");
    setIsSubmitting(true);
    try {
      const { signOut } = await import("firebase/auth");
      const { auth } = await import("../../lib/firebase");
      await signOut(auth);
      setFormState("gateway");
    } catch (err) {
      console.error("Error signing out unverified user:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsSubmitting(true);
    storage.setGoogleSignInInProgress(true);
    try {
      const profile = await loginWithGoogle();
      storage.removeGoogleSignInInProgress();
      setIsSubmitting(false);
      if (profile) {
        storage.setCurrentUser(profile);
        onLoginSuccess(profile);
      }
    } catch (err) {
      storage.removeGoogleSignInInProgress();
      setIsSubmitting(false);
      if (err.isCancelled || err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        setError("تم إلغاء عملية تسجيل الدخول بواسطة جوجل.");
      } else {
        setError(err.message || "فشل تسجيل الدخول باستخدام جوجل.");
      }
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setForgotSuccess("");

    if (!forgotEmail.trim()) {
      setError("يرجى إدخال بريدك الإلكتروني.");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(forgotEmail.trim());
      setIsSubmitting(false);
      setForgotSuccess("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.");
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message || "حدث خطأ أثناء إرسال طلب إعادة التعيين.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-2.5 sm:px-4 text-right font-sans transition-all duration-300" dir="rtl">
      {formState === "gateway" && (
        <GatewayView
          isSubmitting={isSubmitting}
          error={error}
          handleGoogleSignIn={handleGoogleSignIn}
          setError={setError}
          setFormState={setFormState}
        />
      )}

      {formState === "login" && (
        <LoginView
          error={error}
          setError={setError}
          showResendBtn={showResendBtn}
          handleResendVerification={handleResendVerification}
          isSubmitting={isSubmitting}
          resendSuccess={resendSuccess}
          handleLoginSubmit={handleLoginSubmit}
          loginEmail={loginEmail}
          setLoginEmail={setLoginEmail}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          showLoginPassword={showLoginPassword}
          setShowLoginPassword={setShowLoginPassword}
          setForgotEmail={setForgotEmail}
          setFormState={setFormState}
          handleGoogleSignIn={handleGoogleSignIn}
          onGuestBrowse={onGuestBrowse}
        />
      )}

      {formState === "register" && (
        <RegisterView
          setError={setError}
          setFormState={setFormState}
          error={error}
          handleRegisterSubmit={handleRegisterSubmit}
          registerName={registerName}
          setRegisterName={setRegisterName}
          registerEmail={registerEmail}
          setRegisterEmail={setRegisterEmail}
          registerPassword={registerPassword}
          setRegisterPassword={setRegisterPassword}
          showRegPassword={showRegPassword}
          setShowRegPassword={setShowRegPassword}
          registerConfirmPassword={registerConfirmPassword}
          setRegisterConfirmPassword={setRegisterConfirmPassword}
          showRegConfirmPassword={showRegConfirmPassword}
          setShowRegConfirmPassword={setShowRegConfirmPassword}
          isSubmitting={isSubmitting}
        />
      )}

      {formState === "otp" && (
        <VerificationPendingView
          setError={setError}
          setResendSuccess={setResendSuccess}
          setFormState={setFormState}
          registerEmail={registerEmail}
          loginEmail={loginEmail}
          unverifiedUser={unverifiedUser}
          error={error}
          resendSuccess={resendSuccess}
          handleResendVerification={handleResendVerification}
          isSubmitting={isSubmitting}
          onCancel={handleCancelVerification}
        />
      )}

      {formState === "forgot" && (
        <ForgotPasswordView
          setError={setError}
          setForgotSuccess={setForgotSuccess}
          setFormState={setFormState}
          error={error}
          forgotSuccess={forgotSuccess}
          handleForgotPasswordSubmit={handleForgotPasswordSubmit}
          forgotEmail={forgotEmail}
          setForgotEmail={setForgotEmail}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
