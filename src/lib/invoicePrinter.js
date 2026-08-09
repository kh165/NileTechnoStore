/**
 * High-fidelity Invoice Printer for NileTechno 
 * Renders professional Arabic commercial invoices with compact high-density layout,
 * support for A4/A5 paper sizes, and minimal signature footer.
 */

const escapeHtml = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const printViaIframe = (htmlContent) => {
  try {
    const oldIframe = document.getElementById('niletechno-invoice-print-iframe');
    if (oldIframe) {
      oldIframe.parentNode?.removeChild(oldIframe);
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'niletechno-invoice-print-iframe';
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
        console.error("Iframe invoice print error:", err);
      }
    };

    if (doc.readyState === 'complete') {
      setTimeout(doPrint, 350);
    } else {
      iframe.onload = () => setTimeout(doPrint, 350);
    }
  } catch (e) {
    console.error("Iframe creation failed:", e);
  }
};

export const printInvoice = (order, storeCurrency = "EGP", pageSize = "A4") => {
  const isA5 = pageSize.toUpperCase() === "A5";

  const formatDate = (dateValue) => {
    if (!dateValue) return "غير محدد";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return escapeHtml(dateValue);
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const itemsHtml = (order.items || []).map((item, idx) => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 5px 8px; text-align: center; font-size: ${isA5 ? '8px' : '9px'}; font-family: monospace; color: #64748b;">${idx + 1}</td>
      <td style="padding: 5px 8px; text-align: right; font-size: ${isA5 ? '8.5px' : '9.5px'}; font-weight: 700; color: #0f172a;">${escapeHtml(item.name || "منتج")}</td>
      <td style="padding: 5px 8px; text-align: center; font-size: ${isA5 ? '8.5px' : '9.5px'}; font-weight: 800; color: #334155; font-family: monospace;">${item.quantity || 1}</td>
      <td style="padding: 5px 8px; text-align: left; font-size: ${isA5 ? '8.5px' : '9.5px'}; color: #334155; font-family: monospace;">${item.price || 0} ${escapeHtml(storeCurrency)}</td>
      <td style="padding: 5px 8px; text-align: left; font-size: ${isA5 ? '8.5px' : '9.5px'}; font-weight: 900; color: #0f172a; font-family: monospace;">${((item.price || 0) * (item.quantity || 1))} ${escapeHtml(storeCurrency)}</td>
    </tr>
  `).join('');

  const fullHtml = `
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>فاتورة مبيعات معتمدة #${escapeHtml(order.orderNumber)} - NileTechno Store</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        @page {
          size: ${isA5 ? "A5 portrait" : "A4 portrait"};
          margin: ${isA5 ? "3mm 3mm 3mm 3mm" : "6mm 6mm 6mm 6mm"};
        }
        body { 
          font-family: 'Cairo', sans-serif; 
          padding: 0; 
          color: #0f172a; 
          background-color: #ffffff;
          margin: 0;
          line-height: ${isA5 ? "1.15" : "1.25"};
          font-size: ${isA5 ? "7.5px" : "8.5px"};
        }
        .no-print-bar {
          background: #0f172a;
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
        .receipt-container { 
          max-width: 100%; 
          margin: 0 auto; 
          border: 1px solid #cbd5e1; 
          padding: ${isA5 ? "6px" : "10px"}; 
          border-radius: 6px; 
          background: #ffffff;
          position: relative;
        }
        .header { 
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px dashed #cbd5e1; 
          padding-bottom: ${isA5 ? "3px" : "5px"}; 
          margin-bottom: ${isA5 ? "4px" : "6px"}; 
        }
        .store-brand {
          text-align: right;
        }
        .store-name { 
          font-size: ${isA5 ? "12px" : "16px"}; 
          font-weight: 900; 
          color: #0f172a; 
          line-height: 1.1;
        }
        .store-sub {
          font-size: ${isA5 ? "6.5px" : "7.5px"};
          color: #64748b;
          font-weight: 700;
          margin-top: 1px;
        }
        .invoice-status-tag {
          background-color: ${isA5 ? "#fef3c7" : "#f0fdf4"};
          border: 1px solid ${isA5 ? "#fde68a" : "#bbf7d0"};
          color: ${isA5 ? "#92400e" : "#16a34a"};
          padding: 2px 8px;
          border-radius: 99px;
          font-size: ${isA5 ? "7.5px" : "8px"};
          font-weight: 800;
        }
        .meta-info-grid { 
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px; 
          font-size: 8px; 
          background: #f8fafc; 
          padding: 4px 8px; 
          border-radius: 6px; 
          border: 1px solid #f1f5f9;
        }
        .meta-item {
          line-height: 1.3;
        }
        .meta-item strong {
          color: #0f172a;
        }
        .customer-card { 
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 6px 8px;
          border-radius: 6px;
          margin-bottom: 6px; 
          font-size: 8px; 
        }
        .customer-card h3 { 
          margin: 0 0 4px 0;
          border-bottom: 1px solid #f1f5f9; 
          padding-bottom: 2px; 
          color: #0f172a; 
          font-size: 8.5px;
          font-weight: 800;
        }
        .customer-details-line {
          margin-bottom: 2px;
        }
        .customer-details-line strong {
          color: #64748b;
          display: inline-block;
          width: 75px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 10px; 
        }
        th { 
          background-color: #0f172a; 
          color: #ffffff;
          padding: 5px 8px; 
          text-align: right; 
          font-size: 8.5px; 
          font-weight: 800;
          border: 1px solid #0f172a;
        }
        .total-calculation-table {
          width: 220px;
          margin-right: auto;
          margin-left: 0;
          margin-bottom: 10px;
        }
        .total-calculation-table tr td {
          padding: 3px 0;
          font-size: 9px;
        }
        .grand-total {
          font-size: 11px;
          font-weight: 900;
          color: #1d4ed8;
          border-top: 1px solid #e2e8f0;
          padding-top: 4px !important;
        }
        .bottom-signatures {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
          padding-top: 8px;
          border-top: 1px dashed #e2e8f0;
          font-size: 8px;
        }
        .signature-box {
          text-align: center;
          width: 110px;
        }
        .signature-line {
          border-bottom: 1px dotted #94a3b8;
          margin-top: 12px;
          margin-bottom: 3px;
        }
        .footer { 
          text-align: center; 
          margin-top: 8px; 
          font-size: 7.5px; 
          color: #94a3b8; 
          border-top: 1px dashed #f1f5f9; 
          padding-top: 6px; 
        }
        .master-invoice-table {
          width: 100%;
          border-collapse: collapse;
        }
        .master-invoice-table > thead {
          display: table-header-group;
        }
        .master-invoice-table > tfoot {
          display: table-footer-group;
        }
        .master-invoice-table > tbody {
          display: table-row-group;
        }
        tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        @media print {
          body { padding: 0; background: none; }
          .no-print-bar { display: none !important; }
          .receipt-container { border: none; padding: 0; box-shadow: none; }
          .master-invoice-table > thead { display: table-header-group; }
          .master-invoice-table > tfoot { display: table-footer-group; }
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <div style="font-size: 12px; font-weight: 800;">فاتورة طلب رقم #${escapeHtml(order.orderNumber)}</div>
        <div style="display: flex; gap: 8px;">
          <button onclick="window.print()" class="no-print-btn">🖨️ طباعة الفاتورة الآن</button>
          <button onclick="window.close()" class="no-print-close">إغلاق النافذة</button>
        </div>
      </div>

      <div class="receipt-container">
        <table class="master-invoice-table">
          <thead>
            <tr>
              <td>
                <div class="header">
                  <div class="store-brand" style="display: flex; align-items: center; gap: 10px;">
                    <img src="/logo3.webp" alt="NileTechno Logo" style="max-height: 36px; border-radius: 4px;" referrerPolicy="no-referrer" />
                    <div>
                      <div class="store-name">NileTechno Store</div>
                      <div class="store-sub">فاتورة المبيعات والشحن الرسمية</div>
                    </div>
                  </div>
                  <div class="invoice-status-tag">فاتورة معتمدة #${escapeHtml(order.orderNumber)}</div>
                </div>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="meta-info-grid">
                  <div class="meta-item">
                    <strong>رقم الطلب:</strong> #${escapeHtml(order.orderNumber)}<br/>
                    <strong>التاريخ:</strong> ${formatDate(order.createdAt)}
                  </div>
                  <div class="meta-item" style="text-align: left;">
                    <strong>طريقة الدفع:</strong> كاش عند الاستلام<br/>
                    <strong>الحالة:</strong> ${escapeHtml(order.status || "قيد المعالجة")}
                  </div>
                </div>

                <div class="customer-card">
                  <h3>بيانات المستلم والعنوان</h3>
                  <div class="customer-details-line">
                    <strong>اسم العميل:</strong> <span style="font-weight: 800; color: #0f172a;">${escapeHtml(order.customerName || "غير مسجل")}</span>
                  </div>
                  <div class="customer-details-line">
                    <strong>رقم الهاتف:</strong> <span style="font-family: monospace; font-weight: 800;">${escapeHtml(order.customerPhone || "غير مسجل")}</span>
                  </div>
                  <div class="customer-details-line">
                    <strong>العنوان:</strong> ${escapeHtml(order.customerAddress || "غير مسجل")}
                  </div>
                  ${order.customerNotes ? `
                    <div class="customer-details-line" style="margin-top: 4px; background: #fffbeb; padding: 4px 8px; border-radius: 4px; border: 1px solid #fef3c7; color: #b45309;">
                      <strong>ملاحظات:</strong> ${escapeHtml(order.customerNotes)}
                    </div>
                  ` : ''}
                </div>

                <table>
                  <thead>
                    <tr>
                      <th style="width: 6%; text-align: center;">#</th>
                      <th style="width: 48%;">البيان / اسم المنتج</th>
                      <th style="width: 14%; text-align: center;">الكمية</th>
                      <th style="width: 16%;">سعر الوحدة</th>
                      <th style="width: 16%;">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsHtml}
                  </tbody>
                </table>

                <table class="total-calculation-table">
                  <tr>
                    <td style="color: #64748b;">الإجمالي الفرعي:</td>
                    <td style="text-align: left; font-weight: 700; font-family: monospace;">${order.total} ${escapeHtml(storeCurrency)}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b;">مصاريف الشحن:</td>
                    <td style="text-align: left; font-weight: 700; font-family: monospace;">${order.shippingCost ? `${order.shippingCost} ${escapeHtml(storeCurrency)}` : "مجاني"}</td>
                  </tr>
                  <tr class="grand-total">
                    <td style="font-weight: 800; color: #0f172a;">المبلغ المطلوب سداده:</td>
                    <td style="text-align: left; font-weight: 900; color: #1d4ed8; font-family: monospace;">${order.total} ${escapeHtml(storeCurrency)}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td>
                <div class="bottom-signatures">
                  <div class="signature-box">
                    <div class="signature-line"></div>
                    <span style="font-size: 8px; color: #64748b; font-weight: 700;">توقيع المستلم</span>
                  </div>

                  <div class="signature-box">
                    <div class="signature-line"></div>
                    <span style="font-size: 8px; color: #64748b; font-weight: 700;">ختم وتوقيع NileTechno</span>
                  </div>
                </div>

                <div class="footer" style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #cbd5e1; text-align: center;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <img src="/logo3.webp" alt="NileTechno Logo" style="height: 22px; width: auto; object-fit: contain;" />
                    <span style="font-size: 11px; font-weight: 900; color: #0f172a;">NileTechno Store</span>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
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
