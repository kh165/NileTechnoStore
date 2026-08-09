/**
 * PDF Generator Utility for NileTechno Admin Panel
 * Using high-fidelity native print layouts for Arabic document fidelity, Cairo font integration, 
 * page-break optimization, and beautiful financial/operations analytics summaries.
 */

const printViaIframe = (htmlContent) => {
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    const trigger = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error("Iframe PDF print error:", err);
      }
      setTimeout(() => {
        if (iframe.parentNode) document.body.removeChild(iframe);
      }, 3000);
    };

    if (iframe.contentWindow.document.readyState === 'complete') {
      setTimeout(trigger, 300);
    } else {
      iframe.onload = () => setTimeout(trigger, 300);
    }
  } catch (e) {
    console.error("Iframe PDF creation failed:", e);
  }
};

export const printOrdersPDF = (orders, stats, storeCurrency = "EGP", dateRange = null) => {

  const formatDate = (dateValue) => {
    if (!dateValue) return "غير محدد";
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusArabic = (status) => {
    const s = (status || "PENDING").toUpperCase();
    if (s === "PENDING") return "قيد المعالجة المبدئية";
    if (s === "PREPARING") return "قيد التحضير والتجهيز";
    if (s === "SHIPPED" || s === "DELIVERING") return "جاري التوصيل مع المندوب";
    if (s === "COMPLETED" || s === "DELIVERED") return "تم التسليم واكتمل الطلب";
    if (s === "CANCELED" || s === "CANCELLED") return "تم إلغاء الطلب";
    return status;
  };

  const rowsHtml = orders.map((order, idx) => `
    <tr class="order-row">
      <td class="text-center font-mono">${idx + 1}</td>
      <td class="font-bold text-blue-700">#${order.orderNumber || "غير محدد"}</td>
      <td>${formatDate(order.createdAt || order.date)}</td>
      <td>
        <div class="customer-name">${order.customerName || "غير مسجل"}</div>
        <div class="customer-phone font-mono">${order.customerPhone || "لا يوجد جوال"}</div>
      </td>
      <td style="font-size: 11px; max-width: 150px; line-height: 1.4;">${order.customerAddress || "غير مسجل"}</td>
      <td style="font-size: 11px; max-width: 160px; line-height: 1.4;">
        ${(order.items || []).map(item => `<div style="margin-bottom: 2px;">• ${item.name} <span style="color:#64748b; font-weight: bold;">(x${item.quantity})</span></div>`).join("")}
      </td>
      <td>
        <span class="status-badge status-${(order.status || "PENDING").toUpperCase()}">
          ${getStatusArabic(order.status)}
        </span>
      </td>
      <td class="text-left font-black text-slate-900 font-mono">${parseFloat(order.total || 0).toLocaleString("ar-EG")} ${storeCurrency}</td>
    </tr>
  `).join("");

  const fullHtml = `
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>تقرير مبيعات وطلبيات NileTechno Store</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Cairo', sans-serif;
          padding: 0;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          line-height: 1.5;
          font-size: 13px;
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
        .page-content {
          padding: 25px;
        }
        @media print {
          body { padding: 0; background: none; }
          .no-print-bar { display: none !important; }
        }
        .report-header {
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 20px;
          margin-bottom: 25px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo-section h1 {
          font-size: 15px;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
        }
        .logo-section p {
          font-size: 8px;
          color: #64748b;
          margin: 1px 0 0 0;
          font-weight: 600;
        }
        .report-title-tag {
          background-color: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: 800;
          font-size: 9.5px;
          text-align: left;
        }
        .date-badge {
          font-size: 8px;
          color: #475569;
          margin-top: 1px;
          display: block;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-bottom: 8px;
        }
        .stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 5px 8px;
          border-radius: 4px;
          text-align: right;
        }
        .stat-card-title {
          font-size: 8px;
          color: #64748b;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .stat-card-value {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
        }
        .stat-card-sub {
          font-size: 7.5px;
          color: #94a3b8;
          margin-top: 1px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
        }
        th {
          background-color: #f1f5f9;
          border-bottom: 2px solid #cbd5e1;
          color: #334155;
          font-weight: 700;
          padding: 3px 5px;
          font-size: 8.5px;
          text-align: right;
        }
        td {
          padding: 3px 5px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 8.5px;
          color: #334155;
        }
        .order-row:nth-child(even) {
          background-color: #f8fafc;
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .font-mono { font-family: monospace; }
        .font-bold { font-weight: 700; }
        .font-black { font-weight: 900; }
        .customer-name {
          font-weight: 700;
          color: #1e293b;
        }
        .customer-phone {
          font-size: 8px;
          color: #64748b;
          margin-top: 1px;
        }
        .status-badge {
          display: inline-block;
          font-size: 7.5px;
          font-weight: 800;
          padding: 1px 4px;
          border-radius: 99px;
        }
        .status-PENDING { background-color: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
        .status-PREPARING { background-color: #dbeafe; color: #2563eb; border: 1px solid #bfdbfe; }
        .status-SHIPPED, .status-DELIVERING { background-color: #e0e7ff; color: #4f46e5; border: 1px solid #c7d2fe; }
        .status-COMPLETED, .status-DELIVERED { background-color: #d1fae5; color: #059669; border: 1px solid #a7f3d0; }
        .status-CANCELED, .status-CANCELLED { background-color: #fee2e2; color: #dc2626; border: 1px solid #fecaca; }
        .report-summary-table {
          width: 220px;
          margin-right: auto;
          margin-left: 0;
          margin-top: 8px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }
        .report-summary-table td {
          padding: 3px 6px;
          font-size: 8.5px;
        }
        .report-summary-table tr:last-child {
          background-color: #f8fafc;
          font-weight: 900;
          border-top: 1px solid #cbd5e1;
        }
        .signatures-area {
          margin-top: 10px;
          display: flex;
          justify-content: space-between;
          padding: 0 20px;
        }
        .signature-spot {
          text-align: center;
          width: 120px;
        }
        .signature-line {
          border-bottom: 1px solid #94a3b8;
          margin-bottom: 3px;
          height: 20px;
        }
        .footer {
          margin-top: 10px;
          border-top: 1px dashed #e2e8f0;
          padding-top: 4px;
          text-align: center;
          font-size: 8px;
          color: #94a3b8;
        }
        .master-pdf-table {
          width: 100%;
          border-collapse: collapse;
        }
        .master-pdf-table > thead {
          display: table-header-group;
        }
        .master-pdf-table > tfoot {
          display: table-footer-group;
        }
        .master-pdf-table > tbody {
          display: table-row-group;
        }
        tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        @media print {
          body { padding: 0; }
          @page {
            size: A4 portrait;
            margin: 6mm;
          }
          .no-print { display: none; }
          .master-pdf-table > thead { display: table-header-group; }
          .master-pdf-table > tfoot { display: table-footer-group; }
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <div style="font-size: 12px; font-weight: 800;">تقرير مبيعات وطلبيات PDF</div>
        <div style="display: flex; gap: 8px;">
          <button onclick="window.print()" class="no-print-btn">🖨️ طباعة التقرير الآن</button>
          <button onclick="window.close()" class="no-print-close">إغلاق النافذة</button>
        </div>
      </div>
      <div class="page-content">
        <table class="master-pdf-table">
        <thead>
          <tr>
            <td>
              <div class="report-header">
                <div class="logo-section" style="display: flex; align-items: center; gap: 15px;">
                  <img src="/logo3.webp" alt="NileTechno Store Logo" style="max-height: 55px; border-radius: 8px; border: 1px solid #e2e8f0; padding: 2px;" referrerPolicy="no-referrer" />
                  <div>
                    <h1 style="font-size: 24px; font-weight: 900; color: #0f172a; margin: 0;">NileTechno Store</h1>
                    <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0; font-weight: 600;">بوابة النيل للتقنية - حلول البرمجيات، الشاشات التفاعلية والخدمات الرقمية المتكاملة</p>
                  </div>
                </div>
                <div class="report-title-tag">
                  تقرير أداء المبيعات والطلبات المتكامل
                  <span class="date-badge">تاريخ التصدير: ${new Date().toLocaleDateString("ar-EG")}</span>
                  ${dateRange ? `<span class="date-badge" style="color: #2563eb; font-weight: 800; margin-top: 4px; display: block;">الفترة المحددة بالتقرير: ${dateRange}</span>` : ""}
                </div>
              </div>
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-card-title">إجمالي المبيعات النشطة</div>
                  <div class="stat-card-value" style="color: #059669;">${parseFloat(stats.activeSalesTotal || 0).toLocaleString("ar-EG")} ${storeCurrency}</div>
                  <div class="stat-card-sub">باستثناء الطلبات الملغاة</div>
                </div>
                <div class="stat-card">
                  <div class="stat-card-title">متوسط قيمة الفاتورة (AOV)</div>
                  <div class="stat-card-value" style="color: #2563eb;">${parseFloat(stats.averageOrderValue || 0).toLocaleString("ar-EG")} ${storeCurrency}</div>
                  <div class="stat-card-sub">معيار الجودة التشغيلية</div>
                </div>
                <div class="stat-card">
                  <div class="stat-card-title">عدد الطلبات المصفاة</div>
                  <div class="stat-card-value">${orders.length.toLocaleString("ar-EG")} طلبيات</div>
                  <div class="stat-card-sub">حجم الطلب الحالي بالمصفاة</div>
                </div>
                <div class="stat-card">
                  <div class="stat-card-title">معدل الإلغاء العام</div>
                  <div class="stat-card-value" style="color: #dc2626;">${stats.cancelledCount.toLocaleString("ar-EG")} طلبيات</div>
                  <div class="stat-card-sub">قيد المراجعة الإدارية</div>
                </div>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; table-layout: fixed;">
                <thead>
                  <tr>
                    <th style="width: 4%; text-align: center;">م</th>
                    <th style="width: 10%;">رقم الطلب</th>
                    <th style="width: 14%;">تاريخ الطلب</th>
                    <th style="width: 16%;">العميل وجهة الاتصال</th>
                    <th style="width: 20%;">عنوان التوصيل والشحن</th>
                    <th style="width: 20%;">المنتجات والكميات المطلوبة</th>
                    <th style="width: 10%;">الحالة الحالية</th>
                    <th style="width: 10%; text-align: left;">القيمة المالية</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>

              <table class="report-summary-table">
                <tr>
                  <td style="color: #64748b;">إجمالي عدد الطلبات المضمنة:</td>
                  <td class="text-left font-bold">${orders.length}</td>
                </tr>
                <tr>
                  <td style="color: #64748b;">قيمة الطلبات المحددة بالتقرير:</td>
                  <td class="text-left font-bold font-mono text-blue-700">${orders.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0).toLocaleString("ar-EG")} ${storeCurrency}</td>
                </tr>
              </table>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>
              <div class="signatures-area">
                <div class="signature-spot">
                  <div class="signature-line"></div>
                  <span class="font-bold" style="font-size: 11px; color: #475569;">المحاسب المسؤول</span>
                </div>
                <div class="signature-spot">
                  <div class="signature-line"></div>
                  <span class="font-bold" style="font-size: 11px; color: #475569;">اعتماد الإدارة المالية</span>
                </div>
              </div>

              <div class="footer">
                هذا التقرير تم إنشاؤه وتصديره آلياً عبر لوحة تحكم NileTechno Store المعتمدة.<br/>
                صنع بدقة وحرفية عالية © NileTechno Store 2026.
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

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    printViaIframe(fullHtml);
    return;
  }

  printWindow.document.write(fullHtml);
  printWindow.document.close();
};
