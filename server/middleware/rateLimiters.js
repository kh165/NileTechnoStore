import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "تم تجاوز الحد المسموح به لمحاولات الدخول/التسجيل. يرجى الانتظار 15 دقيقة." }
});

export const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "تم تجاوز عدد طلبات الشراء المسموح بها في فترة قصيرة. يرجى الانتظار بضع دقائق." }
});

export const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 25,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "تم استنفاد حد استعلامات البحث الذكي. يرجى الانتظار بضع دقائق." }
});
