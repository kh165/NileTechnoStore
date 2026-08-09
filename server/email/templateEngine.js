import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// In-memory cache for loaded template files
const templateCache = new Map();

/**
 * Escapes unsafe HTML characters to prevent XSS / HTML injection in emails
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitizes headers to prevent email header injection
 */
export function sanitizeHeader(str) {
  if (!str) return "";
  return String(str).replace(/[\r\n]/g, "").trim();
}

/**
 * Resolves the absolute path to the templates directory in both dev and production
 */
function getTemplatesDir() {
  const possiblePaths = [
    path.join(process.cwd(), "server", "email", "templates"),
    path.join(process.cwd(), "templates"),
    path.join(__dirname, "templates")
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return possiblePaths[0];
}

/**
 * Reads a template file from disk or cache
 */
function readTemplateFile(relativePath) {
  if (templateCache.has(relativePath)) {
    return templateCache.get(relativePath);
  }

  const templatesDir = getTemplatesDir();
  const fullPath = path.join(templatesDir, relativePath);

  try {
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      templateCache.set(relativePath, content);
      return content;
    } else {
      console.error(`[EMAIL ENGINE ERROR] Template file not found: ${fullPath}`);
    }
  } catch (err) {
    console.error(`[EMAIL ENGINE ERROR] Failed reading template ${relativePath}:`, err.message);
  }
  return "";
}

/**
 * Reusable light-weight template compilation engine supporting:
 * - Partials: {{> header}}, {{> footer}}
 * - Conditionals: {{#if variable}} content {{/if}}
 * - Unescaped HTML: {{{rawHtml}}}
 * - Escaped variables: {{variable}}
 */
export function renderTemplate(templateName, data = {}) {
  const fileName = templateName.endsWith(".html") ? templateName : `${templateName}.html`;
  let templateContent = readTemplateFile(fileName);

  if (!templateContent) {
    throw new Error(`[EMAIL ENGINE] Template "${templateName}" missing or unreadable.`);
  }

  // 1. Inject Partials
  const headerPartial = readTemplateFile(path.join("partials", "header.html"));
  const footerPartial = readTemplateFile(path.join("partials", "footer.html"));

  templateContent = templateContent
    .replace(/\{\{\>\s*header\s*\}\}/gi, headerPartial || "")
    .replace(/\{\{\>\s*footer\s*\}\}/gi, footerPartial || "");

  // Default global template variables
  const rawFrontendUrl = (process.env.FRONTEND_URL || process.env.APP_URL || "https://niletechnostore.vercel.app").replace(/['"]/g, "").trim();
  const rawSupportEmail = (process.env.SUPPORT_EMAIL || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "support@niletechno.com").replace(/['"]/g, "").trim().replace(/<[^>]+>/g, "");

  const context = {
    frontendUrl: rawFrontendUrl.endsWith("/") ? rawFrontendUrl.slice(0, -1) : rawFrontendUrl,
    supportEmail: rawSupportEmail,
    currentYear: new Date().getFullYear().toString(),
    ...data
  };

  // 2. Process Conditionals: {{#if key}} ... {{/if}}
  templateContent = templateContent.replace(/\{\{#if\s+([a-zA-Z0-9_\.]+)\}\}([\s\S]*?)\{\{\/if\}\}/gi, (match, key, innerContent) => {
    const val = context[key];
    if (val && val !== "false" && val !== "0" && (Array.isArray(val) ? val.length > 0 : true)) {
      return innerContent;
    }
    return "";
  });

  // 3. Process Unescaped HTML: {{{rawHtml}}}
  templateContent = templateContent.replace(/\{\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}\}/g, (match, key) => {
    const val = context[key];
    return val !== undefined && val !== null ? String(val) : "";
  });

  // 4. Process Escaped Dynamic Variables: {{variable}}
  templateContent = templateContent.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (match, key) => {
    const val = context[key];
    if (val === undefined || val === null) return "";
    return escapeHtml(val);
  });

  return templateContent;
}

/**
 * Builds a clean responsive HTML table for items in an order
 */
export function buildOrderItemsTableHtml(items = [], currency = "EGP") {
  if (!Array.isArray(items) || items.length === 0) {
    return `<p style="color: #64748b; font-size: 14px; margin: 8px 0;">لا توجد منتجات مسجلة.</p>`;
  }

  let rowsHtml = "";
  items.forEach((item, index) => {
    const title = escapeHtml(item.title || item.name || `منتج رقم ${index + 1}`);
    const quantity = parseInt(item.quantity || item.qty || 1, 10);
    const unitPrice = parseFloat(item.price || item.unitPrice || 0);
    const totalPrice = (quantity * unitPrice).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    const formattedUnitPrice = unitPrice.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

    const bgColor = index % 2 === 0 ? "#ffffff" : "#f8fafc";

    rowsHtml += `
      <tr style="background-color: ${bgColor}; border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 14px; font-size: 14px; color: #0f172a; font-weight: 600;">${title}</td>
        <td align="center" style="padding: 12px; font-size: 14px; color: #475569;">${quantity}</td>
        <td align="left" style="padding: 12px; font-size: 14px; color: #475569;">${formattedUnitPrice} ${currency}</td>
        <td align="left" style="padding: 12px 14px; font-size: 14px; color: #2563eb; font-weight: 700;">${totalPrice} ${currency}</td>
      </tr>
    `;
  });

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; margin-top: 8px;">
      <thead>
        <tr style="background-color: #072d5c; color: #ffffff; font-size: 13px; text-align: right;">
          <th style="padding: 12px 14px; font-weight: 700;">اسم المنتج</th>
          <th align="center" style="padding: 12px; font-weight: 700;">الكمية</th>
          <th align="left" style="padding: 12px; font-weight: 700;">سعر الوحدة</th>
          <th align="left" style="padding: 12px 14px; font-weight: 700;">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
}
