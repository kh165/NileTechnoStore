import EmailService from "../email/emailService.js";
import { verifySmtpConnection } from "../email/smtp.js";

export async function sendWelcomeEmailHandler(req, res) {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
    const result = await EmailService.sendWelcomeEmail({ email, name });
    res.json(result);
  } catch (err) {
    console.error("Error in sendWelcomeEmailHandler:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function sendVerificationEmailHandler(req, res) {
  try {
    const { email, name, verificationLink } = req.body;
    if (!email) return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
    const result = await EmailService.sendVerificationEmail({ email, name, verificationLink });
    res.json(result);
  } catch (err) {
    console.error("Error in sendVerificationEmailHandler:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function sendPasswordResetEmailHandler(req, res) {
  try {
    const { email, name, resetLink } = req.body;
    if (!email) return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
    const result = await EmailService.sendPasswordResetEmail({ email, name, resetLink });
    res.json(result);
  } catch (err) {
    console.error("Error in sendPasswordResetEmailHandler:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function sendLoginNotificationHandler(req, res) {
  try {
    const { email, name, ip, browser, os, loginTime, location } = req.body;
    if (!email) return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });

    const clientIp = ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const userAgent = req.headers["user-agent"] || "";

    const result = await EmailService.sendLoginNotification({
      email,
      name,
      ip: clientIp,
      browser: browser || (userAgent.includes("Chrome") ? "Chrome" : userAgent.includes("Firefox") ? "Firefox" : userAgent.includes("Safari") ? "Safari" : "Browser"),
      os: os || (userAgent.includes("Windows") ? "Windows" : userAgent.includes("Mac") ? "macOS" : userAgent.includes("Android") ? "Android" : userAgent.includes("iPhone") ? "iOS" : "OS"),
      loginTime,
      location
    });
    res.json(result);
  } catch (err) {
    console.error("Error in sendLoginNotificationHandler:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function sendOrderStatusEmailHandler(req, res) {
  try {
    const { email, name, order, newStatus } = req.body;
    if (!order) return res.status(400).json({ error: "بيانات الطلب مطلوبة" });
    const result = await EmailService.sendOrderStatusEmail({ email, name, order, newStatus });
    res.json(result);
  } catch (err) {
    console.error("Error in sendOrderStatusEmailHandler:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function sendGenericEmailHandler(req, res) {
  try {
    const { to, subject, title, messageHtml, actionText, actionUrl, badgeText } = req.body;
    if (!to) return res.status(400).json({ error: "عنوان المستلم مطلوب" });
    const result = await EmailService.sendGenericEmail({ to, subject, title, messageHtml, actionText, actionUrl, badgeText });
    res.json(result);
  } catch (err) {
    console.error("Error in sendGenericEmailHandler:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function testSmtpConnectionHandler(req, res) {
  const status = await verifySmtpConnection();
  res.json(status);
}
