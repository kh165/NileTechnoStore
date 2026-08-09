import express from "express";
import {
  sendWelcomeEmailHandler,
  sendVerificationEmailHandler,
  sendPasswordResetEmailHandler,
  sendLoginNotificationHandler,
  sendOrderStatusEmailHandler,
  sendGenericEmailHandler,
  testSmtpConnectionHandler
} from "../controllers/emailController.js";
import { authLimiter, orderLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();

router.post("/email/welcome", authLimiter, express.json(), sendWelcomeEmailHandler);
router.post("/email/verify", authLimiter, express.json(), sendVerificationEmailHandler);
router.post("/email/password-reset", authLimiter, express.json(), sendPasswordResetEmailHandler);
router.post("/email/login-notification", authLimiter, express.json(), sendLoginNotificationHandler);
router.post("/email/order-status", orderLimiter, express.json(), sendOrderStatusEmailHandler);
router.post("/email/generic", express.json(), sendGenericEmailHandler);
router.get("/email/test", testSmtpConnectionHandler);

export default router;
