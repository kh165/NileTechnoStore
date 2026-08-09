/**
 * Waybill Thermal Printer for NileTechno Store
 * Optimized for Sticky Thermal Label Printers (10x15cm / 100mm x 150mm / 4x6 inches)
 */

import { getStoreSettings } from "./storeSettingsService";

const printViaIframe = (htmlContent) => {
  try {
    const oldIframe = document.getElementById('niletechno-waybill-print-iframe');
    if (oldIframe) {
      oldIframe.parentNode?.removeChild(oldIframe);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'niletechno-waybill-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100vw';
    iframe.style.height = '100vh';
    iframe.style.border = 'none';
    iframe.style.zIndex = '999999';
    iframe.style.background = '#ffffff';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    const doPrint = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error("Iframe waybill print error:", err);
      }
    };

    if (doc.readyState === 'complete') {
      setTimeout(doPrint, 350);
    } else {
      iframe.onload = () => setTimeout(doPrint, 350);
    }
  } catch (e) {
    console.error("Iframe waybill creation failed:", e);
  }
};

/**
 * Generates an inline SVG Barcode representation for order strings
 */
const generateBarcodeSvg = (codeStr) => {
  const code = String(codeStr || "000000").replace(/[^a-zA-Z0-9]/g, "");
  // Simple clean Code128 pattern simulation with crisp black bars
  const pattern = [2,1,2,2,4,1,1,3,2,1,3,1,1,2,3,2,2,1,1,4,2,1,1,3,3,1,2,1,1,3,2,2];
  let bars = "";
  let x = 10;
  
  // Hash code string to create deterministic barcode pattern
  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    const width = (charCode % 3) + 1;
    const gap = ((charCode * 3) % 3) + 1;
    bars += `<rect x="${x}" y="0" width="${width * 2}" height="38" fill="#000000" />`;
    x += (width * 2) + gap + 1;
  }

  // Ensure minimum width & start/stop quiet bars
  const totalWidth = Math.max(x + 10, 220);
  
  return `
    <svg width="100%" height="42" viewBox="0 0 ${totalWidth} 42" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto;">
      <rect width="100%" height="100%" fill="#ffffff"/>
      <rect x="2" y="0" width="3" height="38" fill="#000"/>
      <rect x="7" y="0" width="1" height="38" fill="#000"/>
      ${bars}
      <rect x="${totalWidth - 8}" y="0" width="1" height="38" fill="#000"/>
      <rect x="${totalWidth - 4}" y="0" width="3" height="38" fill="#000"/>
    </svg>
  `;
};

const renderSingleWaybillHtml = (order, storeCurrency = "ج.م") => {
  const orderNum = escapeHtml(order.orderNumber || order.id || "0000");
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString("ar-EG") : new Date().toLocaleDateString("ar-EG");
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo3.webp` : '/logo3.webp';

  const customerName = escapeHtml(order.customerName || order.name || "عميل بدون اسم");
  const customerPhone = escapeHtml(order.customerPhone || order.phone || "غير محدد");
  const governorate = escapeHtml(order.governorate || order.shippingLocationName || order.shippingDetails?.governorate || "القاهرة وباقي المحافظات");
  const address = escapeHtml(order.customerAddress || order.address || order.shippingDetails?.address || "العنوان غير مدخل");
  const notes = escapeHtml(order.customerNotes || order.notes || order.shippingDetails?.notes || "");

  const items = Array.isArray(order.items) ? order.items : [];
  const totalItemsCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const totalAmount = (Number(order.total) || 0).toFixed(2);

  const itemsListText = items.map(item => `${escapeHtml(item.name || item.title || "منتج")} (${item.quantity || 1})`).join(' ، ');

  return `
    <div class="waybill-card">
      <!-- Waybill Header -->
      <div class="waybill-header">
        <div class="brand">
          <img src="${logoUrl}" alt="NileTechno Logo" class="brand-logo" />
          <div>
            <div class="brand-title">NileTechno Store</div>
            <div class="brand-sub">بوليسة شحن وتوصيل طلبات</div>
          </div>
        </div>
        <div class="waybill-type-tag">شحنة منزلية</div>
      </div>

      <!-- Barcode & Order Number -->
      <div class="barcode-box">
        ${generateBarcodeSvg(orderNum)}
        <div class="order-number-text">رقم الطلب: #${orderNum} &nbsp;|&nbsp; التاريخ: ${dateStr}</div>
      </div>

      <!-- Recipient Section (المستلم) -->
      <div class="section-box recipient-box">
        <div class="section-header">
          <span>بيانات المستلم (To Customer)</span>
          <span class="gov-badge">${governorate}</span>
        </div>
        <div class="customer-name">${customerName}</div>
        <div class="info-row">
          <span class="label">الهاتف:</span>
          <span class="phone-val">${customerPhone}</span>
        </div>
        <div class="info-row">
          <span class="label">العنوان:</span>
          <span class="address-val">${address}</span>
        </div>
        ${notes ? `
          <div class="info-row notes-row">
            <span class="label">ملاحظات:</span>
            <span>${notes}</span>
          </div>
        ` : ''}
      </div>

      <!-- Cash Collection Box (COD) -->
      <div class="cod-box">
        <div class="cod-label">مبلغ التحصيل عند الاستلام (COD)</div>
        <div class="cod-amount">${totalAmount} <span class="currency">${escapeHtml(storeCurrency)}</span></div>
        <div class="cod-sub">شامل سعر المنتجات وتكلفة الشحن</div>
      </div>

      <!-- Contents Summary -->
      <div class="section-box items-box">
        <div class="section-header">
          <span>محتويات الشحنة (${totalItemsCount} قطع)</span>
        </div>
        <div class="items-summary-text">
          ${itemsListText || "منتجات متنوعة من NileTechno Store"}
        </div>
      </div>

      <!-- Sender Info Footer -->
      <div class="waybill-footer">
        <div><strong>الراسل:</strong> NileTechno Store (قسم الشحن واللوجستيات)</div>
        <div>خدمة العملاء: ${getStoreSettings().supportPhone || getStoreSettings().companyWhatsapp || "الدعم الفني"} | الدعم الفني والمتجر</div>
      </div>
    </div>
  `;
};

export const printShippingWaybill = (order, storeCurrency = "ج.م") => {
  if (!order) return;
  const orderNum = order.orderNumber || order.id || "0000";

  const fullHtml = `
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>بوليسة شحن #${escapeHtml(orderNum)} - NileTechno Label</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@500;700;800;900&display=swap" rel="stylesheet">
      <style>
        @page {
          size: 100mm 150mm;
          margin: 0;
        }
        @media print {
          body {
            width: 100mm;
            height: 150mm;
            margin: 0;
            padding: 4mm;
            box-sizing: border-box;
          }
          .waybill-card {
            page-break-after: always;
          }
        }
        body {
          font-family: 'Cairo', sans-serif;
          margin: 0;
          padding: 6mm;
          background-color: #ffffff;
          color: #000000;
          line-height: 1.25;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .waybill-card {
          width: 100%;
          border: 2px solid #000000;
          border-radius: 6px;
          padding: 6px;
          box-sizing: border-box;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .waybill-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #000000;
          padding-bottom: 4px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .brand-logo {
          height: 22px;
          width: auto;
          object-fit: contain;
        }
        .brand-title {
          font-size: 13px;
          font-weight: 900;
          color: #000000;
          line-height: 1;
        }
        .brand-sub {
          font-size: 7.5px;
          font-weight: 700;
          color: #333333;
        }
        .waybill-type-tag {
          background-color: #000000;
          color: #ffffff;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 8px;
          font-weight: 800;
        }
        .barcode-box {
          border: 1px solid #000000;
          border-radius: 4px;
          padding: 4px;
          text-align: center;
          background-color: #ffffff;
        }
        .order-number-text {
          font-size: 9px;
          font-weight: 900;
          font-family: monospace;
          margin-top: 2px;
          color: #000000;
        }
        .section-box {
          border: 1.5px solid #000000;
          border-radius: 4px;
          padding: 5px 6px;
          background-color: #ffffff;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 8.5px;
          font-weight: 900;
          border-bottom: 1px solid #000000;
          padding-bottom: 2px;
          margin-bottom: 4px;
        }
        .gov-badge {
          background-color: #000000;
          color: #ffffff;
          padding: 1px 6px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 900;
        }
        .customer-name {
          font-size: 13px;
          font-weight: 900;
          color: #000000;
          margin-bottom: 3px;
        }
        .info-row {
          font-size: 8.5px;
          margin-bottom: 2px;
          display: flex;
          gap: 4px;
        }
        .info-row .label {
          font-weight: 800;
          color: #333333;
          shrink: 0;
        }
        .phone-val {
          font-weight: 900;
          font-family: monospace;
          font-size: 10px;
          direction: ltr;
        }
        .address-val {
          font-weight: 800;
          line-height: 1.2;
        }
        .notes-row {
          background-color: #f1f1f1;
          padding: 2px 4px;
          border-radius: 2px;
          font-weight: 700;
          margin-top: 3px;
        }
        .cod-box {
          border: 2px solid #000000;
          background-color: #f8f8f8;
          border-radius: 4px;
          padding: 5px;
          text-align: center;
        }
        .cod-label {
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .cod-amount {
          font-size: 18px;
          font-weight: 900;
          color: #000000;
          font-family: monospace;
          line-height: 1.1;
          margin: 1px 0;
        }
        .cod-amount .currency {
          font-size: 11px;
          font-weight: 800;
        }
        .cod-sub {
          font-size: 7px;
          font-weight: 700;
          color: #444444;
        }
        .items-summary-text {
          font-size: 8px;
          font-weight: 700;
          color: #222222;
          max-height: 32px;
          overflow: hidden;
          line-height: 1.25;
        }
        .waybill-footer {
          border-top: 1px dashed #000000;
          padding-top: 3px;
          font-size: 7px;
          font-weight: 700;
          color: #333333;
          text-align: center;
        }
      </style>
    </head>
    <body>
      ${renderSingleWaybillHtml(order, storeCurrency)}
      <script>
        function triggerAutoPrint() {
          try {
            window.focus();
            window.print();
          } catch(e) {}
        }
        if (document.readyState === 'complete') {
          setTimeout(triggerAutoPrint, 300);
        } else {
          window.addEventListener('load', function() {
            setTimeout(triggerAutoPrint, 300);
          });
        }
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    printViaIframe(fullHtml);
    return;
  }

  printWindow.document.write(fullHtml);
  printWindow.document.close();
  try {
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  } catch (e) {
    console.error("Print waybill trigger error:", e);
    printViaIframe(fullHtml);
  }
};

export const printBatchShippingWaybills = (ordersList = [], storeCurrency = "ج.م") => {
  if (!ordersList || ordersList.length === 0) {
    alert("لا توجد طلبات محددة لطباعة بوليسات الشحن");
    return;
  }

  const waybillsHtml = ordersList.map(order => renderSingleWaybillHtml(order, storeCurrency)).join('<div style="page-break-before: always;"></div>');

  const fullHtml = `
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>طباعة بوليسات الشحن المجمعة (${ordersList.length} شحنة)</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@500;700;800;900&display=swap" rel="stylesheet">
      <style>
        @page {
          size: 100mm 150mm;
          margin: 0;
        }
        body {
          font-family: 'Cairo', sans-serif;
          margin: 0;
          padding: 4mm;
          background-color: #ffffff;
          color: #000000;
          line-height: 1.25;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .waybill-card {
          width: 100%;
          border: 2px solid #000000;
          border-radius: 6px;
          padding: 6px;
          box-sizing: border-box;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-bottom: 10px;
        }
        .waybill-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #000000;
          padding-bottom: 4px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .brand-logo {
          height: 22px;
          width: auto;
          object-fit: contain;
        }
        .brand-title {
          font-size: 13px;
          font-weight: 900;
          color: #000000;
          line-height: 1;
        }
        .brand-sub {
          font-size: 7.5px;
          font-weight: 700;
          color: #333333;
        }
        .waybill-type-tag {
          background-color: #000000;
          color: #ffffff;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 8px;
          font-weight: 800;
        }
        .barcode-box {
          border: 1px solid #000000;
          border-radius: 4px;
          padding: 4px;
          text-align: center;
          background-color: #ffffff;
        }
        .order-number-text {
          font-size: 9px;
          font-weight: 900;
          font-family: monospace;
          margin-top: 2px;
          color: #000000;
        }
        .section-box {
          border: 1.5px solid #000000;
          border-radius: 4px;
          padding: 5px 6px;
          background-color: #ffffff;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 8.5px;
          font-weight: 900;
          border-bottom: 1px solid #000000;
          padding-bottom: 2px;
          margin-bottom: 4px;
        }
        .gov-badge {
          background-color: #000000;
          color: #ffffff;
          padding: 1px 6px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 900;
        }
        .customer-name {
          font-size: 13px;
          font-weight: 900;
          color: #000000;
          margin-bottom: 3px;
        }
        .info-row {
          font-size: 8.5px;
          margin-bottom: 2px;
          display: flex;
          gap: 4px;
        }
        .info-row .label {
          font-weight: 800;
          color: #333333;
          shrink: 0;
        }
        .phone-val {
          font-weight: 900;
          font-family: monospace;
          font-size: 10px;
          direction: ltr;
        }
        .address-val {
          font-weight: 800;
          line-height: 1.2;
        }
        .notes-row {
          background-color: #f1f1f1;
          padding: 2px 4px;
          border-radius: 2px;
          font-weight: 700;
          margin-top: 3px;
        }
        .cod-box {
          border: 2px solid #000000;
          background-color: #f8f8f8;
          border-radius: 4px;
          padding: 5px;
          text-align: center;
        }
        .cod-label {
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .cod-amount {
          font-size: 18px;
          font-weight: 900;
          color: #000000;
          font-family: monospace;
          line-height: 1.1;
          margin: 1px 0;
        }
        .cod-amount .currency {
          font-size: 11px;
          font-weight: 800;
        }
        .cod-sub {
          font-size: 7px;
          font-weight: 700;
          color: #444444;
        }
        .items-summary-text {
          font-size: 8px;
          font-weight: 700;
          color: #222222;
          max-height: 32px;
          overflow: hidden;
          line-height: 1.25;
        }
        .waybill-footer {
          border-top: 1px dashed #000000;
          padding-top: 3px;
          font-size: 7px;
          font-weight: 700;
          color: #333333;
          text-align: center;
        }
        .no-print-bar {
          background: #000000;
          color: #ffffff;
          padding: 8px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Cairo', sans-serif;
          position: sticky;
          top: 0;
          z-index: 9999;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        .no-print-btn {
          background: #2563eb;
          color: #ffffff;
          border: none;
          padding: 6px 14px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 12px;
          cursor: pointer;
          font-family: inherit;
        }
        .no-print-btn:hover { background: #1d4ed8; }
        .no-print-close {
          background: #334155;
          color: #ffffff;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 11px;
          cursor: pointer;
          font-family: inherit;
        }
        @media print {
          .no-print-bar { display: none !important; }
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <div style="font-size: 12px; font-weight: 800;">بوليسة شحن حرارية (10×15cm)</div>
        <div style="display: flex; gap: 8px;">
          <button onclick="window.print()" class="no-print-btn">🖨️ طباعة البوليسة الآن</button>
          <button onclick="window.close()" class="no-print-close">إغلاق النافذة</button>
        </div>
      </div>
      ${waybillsHtml}
      <script>
        function triggerAutoPrint() {
          try {
            window.focus();
            window.print();
          } catch(e) {}
        }
        if (document.readyState === 'complete') {
          setTimeout(triggerAutoPrint, 400);
        } else {
          window.addEventListener('load', function() {
            setTimeout(triggerAutoPrint, 400);
          });
        }
      </script>
    </body>
    </html>
  `;

  try {
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, '_blank');
    if (!printWindow) {
      printViaIframe(fullHtml);
    }
  } catch (e) {
    printViaIframe(fullHtml);
  }
};
