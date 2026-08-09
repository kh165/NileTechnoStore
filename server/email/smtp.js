import nodemailer from "nodemailer";

// Lazy connection pool transport initialization
let transporterInstance = null;
let lastConfigHash = "";

/**
 * Resets the SMTP transporter instance manually
 */
export function resetTransporter() {
  if (transporterInstance) {
    try {
      transporterInstance.close();
    } catch (e) {
      // Ignore closing error
    }
    transporterInstance = null;
    lastConfigHash = "";
  }
}

/**
 * Retrieves or initializes the shared Nodemailer SMTP transporter.
 * Automatically recreates if environment settings change.
 */
export function getTransporter() {
  const host = (process.env.SMTP_HOST || "smtp-relay.brevo.com").replace(/['"]/g, "").trim();
  const port = parseInt((process.env.SMTP_PORT || "587").replace(/['"]/g, "").trim(), 10);
  const secure = (process.env.SMTP_SECURE || "").replace(/['"]/g, "").trim() === "true" || port === 465;
  const user = (process.env.SMTP_USER || "").replace(/['"]/g, "").trim();
  const pass = (process.env.SMTP_PASS || "").replace(/['"]/g, "").trim();

  const currentConfigHash = `${host}:${port}:${secure}:${user}:${pass}`;

  if (!transporterInstance || lastConfigHash !== currentConfigHash) {
    if (transporterInstance) {
      try {
        transporterInstance.close();
      } catch (e) {
        // Ignore closing error
      }
    }

    lastConfigHash = currentConfigHash;

    if (!user || !pass) {
      console.warn("[EMAIL SMTP WARNING] SMTP_USER or SMTP_PASS is missing in environment variables.");
    }

    transporterInstance = nodemailer.createTransport({
      host,
      port,
      secure, // false for 587 (STARTTLS), true for 465
      auth: {
        user,
        pass
      },
      pool: true, // Reuse SMTP connections
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 1000,
      rateLimit: 5, // max 5 emails per second
      connectionTimeout: 15000, // 15 seconds
      greetingTimeout: 15000,
      socketTimeout: 20000,
      tls: {
        rejectUnauthorized: false // Ignore self-signed/proxy certificate issues in container environments
      }
    });
  }

  return transporterInstance;
}

/**
 * Verifies SMTP connection health
 */
export async function verifySmtpConnection() {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log("[EMAIL SMTP OK] Successfully connected to Brevo SMTP server.");
    return { success: true };
  } catch (err) {
    console.error("[EMAIL SMTP ERROR] Failed to connect to Brevo SMTP:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends an email with retry logic and structured auditing logs
 */
export async function sendMailWithRetry(mailOptions, metadata = {}, retries = 2) {
  const transporter = getTransporter();
  let attempt = 0;
  const startTime = Date.now();

  while (attempt <= retries) {
    try {
      const info = await transporter.sendMail(mailOptions);
      const duration = Date.now() - startTime;
      console.log(
        `[EMAIL LOG SUCCESS] [${new Date().toISOString()}] Target: <${mailOptions.to}> | Subject: "${mailOptions.subject}" | Template: "${metadata.template || "N/A"}" | Order #: "${metadata.orderNumber || "N/A"}" | Message ID: ${info.messageId} | Duration: ${duration}ms`
      );
      return { success: true, messageId: info.messageId };
    } catch (error) {
      attempt++;
      console.error(
        `[EMAIL LOG FAIL - ATTEMPT ${attempt}/${retries + 1}] [${new Date().toISOString()}] Target: <${mailOptions.to}> | Subject: "${mailOptions.subject}" | Template: "${metadata.template || "N/A"}" | Order #: "${metadata.orderNumber || "N/A"}" | Error: ${error.message} | Stack: ${error.stack}`
      );

      if (attempt > retries) {
        return { success: false, error: error.message };
      }
      // Wait 1 second before retrying
      await new Promise((res) => setTimeout(res, 1000 * attempt));
    }
  }
}
