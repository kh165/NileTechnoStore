import React, { useState, useEffect } from "react";
import { Star, MessageSquare, CheckCircle2, User, Send, Loader2, ThumbsUp, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getReviewsFromFirestore, createReviewInFirestore } from "../../lib/firebaseService";

export default function ProductReviewsSection({
  productId,
  productName,
  currentUser,
  onRequestLogin,
  lang = "ar"
}) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadReviews = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await getReviewsFromFirestore(productId, false);
      setReviews(data || []);
    } catch (err) {
      console.error("Failed to load reviews from Firestore:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!currentUser) {
      setErrorMsg(
        lang === "ar"
          ? "عذراً! يجب عليك تسجيل الدخول أولاً للتمكن من إضافة تقييمك للمنتج."
          : "Please log in first to write a review."
      );
      if (onRequestLogin) {
        setTimeout(() => {
          onRequestLogin();
        }, 1200);
      }
      return;
    }

    if (!rating) {
      setErrorMsg(lang === "ar" ? "يرجى اختيار التقييم بالنجوم أولاً" : "Please select a star rating");
      return;
    }

    setIsSubmitting(true);

    try {
      const customerName = currentUser.name || currentUser.displayName || currentUser.email || "عميل مميز";

      await createReviewInFirestore({
        productId: String(productId),
        rating: Number(rating),
        comment: comment.trim(),
        customerName
      });

      setSuccessMsg(
        lang === "ar"
          ? "تم استلام تقييمك بنجاح وهو قيد المراجعة والتدقيق من قبل الإدارة قبل النشر."
          : "Your review has been received and is under review by management before publishing."
      );
      setComment("");
      setRating(5);
      // Reload reviews
      loadReviews();
    } catch (err) {
      console.error("Error submitting review to Firestore:", err);
      setErrorMsg(
        lang === "ar"
          ? "حدث خطأ أثناء حفظ التقييم. يرجى المحاولة مرة أخرى."
          : "An error occurred while saving the review. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / totalReviews).toFixed(1)
    : "5.0";

  return (
    <div className="space-y-6 pt-4 border-t border-slate-100" dir="rtl">
      {/* Header & Stats */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-lg">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 font-mono">{avgRating}</span>
              <span className="text-xs text-slate-400">/ 5</span>
            </div>
            <span className="text-xs text-slate-500 font-bold block">
              {lang === "ar" ? `بناءً على ${totalReviews} تقييمات موثقة` : `Based on ${totalReviews} verified reviews`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{lang === "ar" ? "تقييمات مشتريات موثقة" : "Verified Customer Reviews"}</span>
        </div>
      </div>

      {/* Review Submission Form */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-blue-600" />
          <span>{lang === "ar" ? "أضف تقييمك لهذا المنتج:" : "Write your review:"}</span>
        </h3>

        {/* Star Rating Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">
            {lang === "ar" ? "تقييمك:" : "Your Rating:"}
          </span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 hover:scale-110 transition-transform focus:outline-none"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-200"
                  }`}
                />
              </button>
            ))}
          </div>
          <span className="text-xs font-bold text-amber-600 mr-2">
            {rating} / 5
          </span>
        </div>

        {/* Comment Field */}
        <div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              lang === "ar"
                ? "اكتب انطباعك وتجربتك مع هذا المنتج بصدق..."
                : "Share your honest thoughts about this product..."
            }
            rows={3}
            className="w-full p-3 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
          />
        </div>

        {/* Success/Error Alerts */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold"
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmitReview}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{lang === "ar" ? "جاري الحفظ في الفيربيز..." : "Saving to Firestore..."}</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{lang === "ar" ? "نشر التقييم" : "Post Review to Database"}</span>
            </>
          )}
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {lang === "ar" ? "آراء وتقييمات المشترين:" : "Customer Reviews:"}
        </h4>

        {loading ? (
          <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-xs font-bold">{lang === "ar" ? "جاري جلب التقييمات..." : "Loading reviews..."}</span>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold">
            {lang === "ar" ? "لا توجد تقييمات منشورة بعد لهذا المنتج. كن أول من يضع تقييمه!" : "No reviews published yet. Be the first to review!"}
          </div>
        ) : (
          <div className="space-y-2.5">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                      {rev.customerName ? rev.customerName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        {rev.customerName || "عميل موثق"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {rev.date || "مؤخراً"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-amber-700 font-mono">
                      {rev.rating || 5}
                    </span>
                  </div>
                </div>

                {rev.comment && (
                  <p className="text-xs text-slate-600 leading-relaxed pr-10">
                    "{rev.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
