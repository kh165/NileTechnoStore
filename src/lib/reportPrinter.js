/**
 * NileTechno Executive Clean Report Generator & Printer
 * Produces clean, professional, high-density A4/A5 printable reports for Arabic administration.
 * Fits maximum rows per page (35-45 items per page) with compact headers and minimal signatures.
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

const getReportHeader = (title, subtitle, filterDetails = "") => {
  const currentDate = new Date().toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const serialNo = `NLT-${Date.now().toString().slice(-6)}`;
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo3.webp` : '/logo3.webp';

  return `
    <div style="border-bottom: 1px dashed #cbd5e1; padding-bottom: 4px; margin-bottom: 6px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <img src="${logoUrl}" alt="NileTechno Logo" style="height: 24px; width: auto; max-width: 100px; object-fit: contain;" />
          <div>
            <h1 style="font-size: 13px; font-weight: 900; color: #0f172a; margin: 0; line-height: 1;">NileTechno Store</h1>
            <p style="font-size: 7.5px; color: #64748b; font-weight: 700; margin: 0;">تقرير الإدارة المالي والمحاسبي المعتمد</p>
          </div>
        </div>
        <div style="text-align: left; font-size: 7.5px; color: #475569; line-height: 1.15;">
          <div><strong style="color: #0f172a;">الرقم:</strong> <span style="font-family: monospace; font-weight: 700;">${escapeHtml(serialNo)}</span></div>
          <div><strong style="color: #0f172a;">التاريخ:</strong> ${currentDate}</div>
        </div>
      </div>

      <div style="margin-top: 4px; background-color: #f8fafc; padding: 3px 8px; border-radius: 4px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2 style="font-size: 10px; font-weight: 800; color: #0f172a; margin: 0;">${escapeHtml(title)}</h2>
          <p style="font-size: 7.5px; color: #64748b; margin: 0; font-weight: 600;">${escapeHtml(subtitle)}</p>
        </div>
        ${filterDetails ? `<span style="font-size: 7.5px; background-color: #0f172a; color: #ffffff; padding: 1px 5px; border-radius: 3px; font-weight: 700;">${escapeHtml(filterDetails)}</span>` : ''}
      </div>
    </div>
  `;
};

const getReportFooter = () => {
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo3.webp` : '/logo3.webp';
  return `
    <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #cbd5e1; page-break-inside: avoid; text-align: center;">
      <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
        <img src="${logoUrl}" alt="NileTechno Logo" style="height: 16px; width: auto; object-fit: contain;" />
        <span style="font-size: 9px; font-weight: 900; color: #0f172a;">NileTechno Store</span>
      </div>
    </div>
  `;
};

const formatMasterReportTable = (headerHtml, bodyHtml, footerHtml) => `
  <table class="master-report-table">
    <thead>
      <tr>
        <td>
          ${headerHtml}
        </td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          ${bodyHtml}
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td>
          ${footerHtml}
        </td>
      </tr>
    </tfoot>
  </table>
`;

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
        console.error("Iframe report print error:", err);
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
    console.error("Iframe report creation failed:", e);
  }
};

const openPrintWindow = (title, contentHtml, pageSize = "A4") => {
  const isA5 = pageSize.toUpperCase() === "A5";

  const fullHtml = `
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        @page { 
          size: ${isA5 ? "A5 portrait" : "A4 portrait"}; 
          margin: ${isA5 ? "6mm 6mm 6mm 6mm" : "8mm 8mm 8mm 8mm"}; 
        }
        body { 
          font-family: 'Cairo', sans-serif; 
          color: #0f172a; 
          background-color: #ffffff;
          margin: 0;
          padding: 0;
          font-size: ${isA5 ? "8px" : "9px"};
          line-height: 1.25;
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
        .master-report-table {
          width: 100%;
          border-collapse: collapse;
        }
        .master-report-table > thead {
          display: table-header-group;
        }
        .master-report-table > tfoot {
          display: table-footer-group;
        }
        .master-report-table > tbody {
          display: table-row-group;
        }
        tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 5px;
          margin-bottom: 8px;
        }
        .kpi-card {
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 4px 6px;
        }
        .kpi-title { font-size: 7.5px; color: #64748b; font-weight: 700; display: block; }
        .kpi-value { font-size: 11px; font-weight: 900; color: #0f172a; font-family: monospace; display: block; margin-top: 1px; }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 4px;
          font-size: ${isA5 ? "8px" : "8.5px"};
        }
        thead {
          display: table-header-group;
        }
        tr {
          page-break-inside: avoid;
        }
        th {
          background-color: #0f172a;
          color: #ffffff;
          font-weight: 800;
          text-align: right;
          padding: 3px 5px;
          border: 1px solid #0f172a;
          font-size: ${isA5 ? "8px" : "8.5px"};
        }
        td {
          padding: 3px 5px;
          border-bottom: 1px solid #e2e8f0;
          border-left: 1px solid #f1f5f9;
          border-right: 1px solid #f1f5f9;
          color: #334155;
          vertical-align: middle;
        }
        tr:nth-child(even) td {
          background-color: #f8fafc;
        }
        .number-col {
          font-family: monospace;
          font-weight: 700;
        }
        .badge {
          display: inline-block;
          padding: 0.5px 4px;
          border-radius: 3px;
          font-size: 7.5px;
          font-weight: 800;
        }
        .badge-success { background: #dcfce7; color: #15803d; }
        .badge-warning { background: #fef3c7; color: #b45309; }
        .badge-danger { background: #ffe4e6; color: #be123c; }
        .badge-info { background: #e0f2fe; color: #0369a1; }

        @media print {
          body { padding: 0; background: none; }
          .no-print-bar { display: none !important; }
          .no-print { display: none !important; }
          .master-report-table > thead { display: table-header-group; }
          .master-report-table > tfoot { display: table-footer-group; }
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <div style="font-size: 12px; font-weight: 800;">${title}</div>
        <div style="display: flex; gap: 8px;">
          <button onclick="window.print()" class="no-print-btn">🖨️ طباعة التقرير الآن</button>
          <button onclick="window.close()" class="no-print-close">إغلاق النافذة</button>
        </div>
      </div>
      ${contentHtml}
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

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    printViaIframe(fullHtml);
    return;
  }

  printWindow.document.write(fullHtml);
  printWindow.document.close();
};

// 1. Financial Performance & Revenue Statement
export const printFinancialReport = (stats, filteredOrders = [], timeRangeText = "الجميع", storeCurrency = "ج.م", pageSize = "A4") => {
  const title = "تقرير المؤشرات المالية والإيرادات";
  const subtitle = "ملخص المبيعات، المقبوضات الفعليه، والطلبات المسجلة";

  const ordersRows = filteredOrders.map((o, idx) => `
    <tr>
      <td style="text-align: center;" class="number-col">${idx + 1}</td>
      <td class="number-col">#${o.orderNumber || o.id}</td>
      <td style="font-weight: 700;">${o.customerName || "عميل"}</td>
      <td>${o.createdAt ? new Date(o.createdAt).toLocaleDateString("ar-EG") : "غير محدد"}</td>
      <td style="text-align: center;">
        <span class="badge ${
          ["COMPLETED", "DELIVERED"].includes((o.status || "").toUpperCase()) ? "badge-success" :
          ["CANCELED", "CANCELLED"].includes((o.status || "").toUpperCase()) ? "badge-danger" : "badge-warning"
        }">
          ${o.status || "PENDING"}
        </span>
      </td>
      <td class="number-col">${(o.shippingCost || 0)} ${storeCurrency}</td>
      <td class="number-col" style="font-weight: 900; color: #0f172a;">${(o.total || 0).toFixed(2)} ${storeCurrency}</td>
    </tr>
  `).join('');

  const headerHtml = getReportHeader(title, subtitle, `النطاق: ${timeRangeText}`);
  const bodyHtml = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-title">إجمالي المبيعات</span>
        <span class="kpi-value" style="color: #2563eb;">${stats.totalSales.toFixed(2)} ${storeCurrency}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">المحصل المكتمل</span>
        <span class="kpi-value" style="color: #16a34a;">${stats.completedRevenue.toFixed(2)} ${storeCurrency}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">قيد التحصيل</span>
        <span class="kpi-value" style="color: #d97706;">${stats.activeRevenue.toFixed(2)} ${storeCurrency}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">المبيعات الملغاة</span>
        <span class="kpi-value" style="color: #dc2626;">${stats.cancelledRevenue.toFixed(2)} ${storeCurrency}</span>
      </div>
    </div>

    <div style="margin-top: 6px;">
      <h3 style="font-size: 10px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">بيان العمليات والطلبات (${filteredOrders.length} طلب)</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 5%; text-align: center;">#</th>
            <th style="width: 15%;">رقم الطلب</th>
            <th style="width: 25%;">اسم العميل</th>
            <th style="width: 15%;">التاريخ</th>
            <th style="width: 15%; text-align: center;">الحالة</th>
            <th style="width: 10%;">الشحن</th>
            <th style="width: 15%;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${ordersRows}
        </tbody>
      </table>
    </div>
  `;
  const footerHtml = getReportFooter();

  openPrintWindow(title, formatMasterReportTable(headerHtml, bodyHtml, footerHtml), pageSize);
};

// 2. Custom Inventory Valuation & Stock Report (With full category and stock filters)
export const printInventoryReport = (inventoryStats, products = [], storeCurrency = "ج.م", filterLabel = "جميع المنتجات", pageSize = "A4") => {
  const title = "تقرير حركة وحالة المخزون المخصص";
  const subtitle = "جرد شامل للقطع والمنتجات والقيمة المالية الكلية";

  const productRows = products.map((p, idx) => {
    const qty = Number(p.stock) || 0;
    const price = Number(p.price) || 0;
    const totalVal = qty * price;

    return `
      <tr>
        <td style="text-align: center;" class="number-col">${idx + 1}</td>
        <td style="font-weight: 800; color: #0f172a;">${p.name_ar || p.name || p.title || "منتج بدون اسم"}</td>
        <td>${p.category || "عام"}</td>
        <td class="number-col">${price.toFixed(2)} ${storeCurrency}</td>
        <td class="number-col" style="text-align: center;">
          <span class="badge ${qty === 0 ? "badge-danger" : qty < 5 ? "badge-warning" : "badge-success"}">
            ${qty} قطعة
          </span>
        </td>
        <td class="number-col" style="font-weight: 900; color: #0f172a;">${totalVal.toFixed(2)} ${storeCurrency}</td>
      </tr>
    `;
  }).join('');

  const headerHtml = getReportHeader(title, subtitle, `الفلتر المطبق: ${filterLabel}`);
  const bodyHtml = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-title">القيمة المالية الكلية</span>
        <span class="kpi-value" style="color: #4f46e5;">${inventoryStats.totalValue.toLocaleString()} ${storeCurrency}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">عدد القطع المعروضة</span>
        <span class="kpi-value" style="color: #0284c7;">${inventoryStats.totalStock} قطعة</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">أصناف بإنذار حرج (< 5)</span>
        <span class="kpi-value" style="color: #d97706;">${inventoryStats.lowStock} صنف</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">أصناف منتهية (0)</span>
        <span class="kpi-value" style="color: #dc2626;">${inventoryStats.outOfStock} صنف</span>
      </div>
    </div>

    <div style="margin-top: 6px;">
      <h3 style="font-size: 10px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">جدول تقييم أصناف المخزون (${products.length} صنف)</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 5%; text-align: center;">#</th>
            <th style="width: 40%;">اسم المنتج / الصنف</th>
            <th style="width: 15%;">القسم</th>
            <th style="width: 12%;">السعر</th>
            <th style="width: 13%; text-align: center;">الكمية</th>
            <th style="width: 15%;">إجمالي القيمة</th>
          </tr>
        </thead>
        <tbody>
          ${productRows.length > 0 ? productRows : '<tr><td colspan="6" style="text-align:center; padding:10px; color:#94a3b8;">لا توجد منتجات مطابقة للفلتر المختار</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
  const footerHtml = getReportFooter();

  openPrintWindow(title, formatMasterReportTable(headerHtml, bodyHtml, footerHtml), pageSize);
};

// 3. Geographical Sales & Regional Report
export const printGeographicalReport = (geographicalSales = [], storeCurrency = "ج.م", pageSize = "A4", filterText = "تقرير التوزيع الجغرافي") => {
  const title = "تقرير التوزيع الجغرافي للمحافظات";
  const subtitle = "تحليل حجم الطلبات والمبيعات حسب المحافظة";

  const totalGeoSales = geographicalSales.reduce((acc, g) => acc + (g.sales || g.revenue || 0), 0);

  const geoRows = geographicalSales.map((g, idx) => {
    const rev = g.sales || g.revenue || 0;
    const share = totalGeoSales > 0 ? ((rev / totalGeoSales) * 100).toFixed(1) : "0.0";
    return `
      <tr>
        <td style="text-align: center;" class="number-col">${idx + 1}</td>
        <td style="font-weight: 800; color: #0f172a;">${g.location || g.name}</td>
        <td class="number-col" style="text-align: center;">${g.ordersCount} طلبات</td>
        <td class="number-col" style="text-align: center; color: #0284c7; font-weight: 800;">${share}%</td>
        <td class="number-col" style="font-weight: 900; color: #0f172a;">${rev.toFixed(2)} ${storeCurrency}</td>
      </tr>
    `;
  }).join('');

  const headerHtml = getReportHeader(title, subtitle, filterText);
  const bodyHtml = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-title">المحافظات المغطاة</span>
        <span class="kpi-value" style="color: #2563eb;">${geographicalSales.length} محافظة</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">أعلى محافظة</span>
        <span class="kpi-value" style="color: #16a34a; font-size: 10px;">${geographicalSales[0]?.location || geographicalSales[0]?.name || "غير محدد"}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">إجمالي مبيعات المناطق</span>
        <span class="kpi-value" style="color: #d97706;">${totalGeoSales.toFixed(2)} ${storeCurrency}</span>
      </div>
    </div>

    <div style="margin-top: 6px;">
      <h3 style="font-size: 10px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">تفاصيل المحافظات</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 8%; text-align: center;">#</th>
            <th style="width: 40%;">المحافظة</th>
            <th style="width: 17%; text-align: center;">الطلبات</th>
            <th style="width: 15%; text-align: center;">النسبة</th>
            <th style="width: 20%;">الإيرادات</th>
          </tr>
        </thead>
        <tbody>
          ${geoRows}
        </tbody>
      </table>
    </div>
  `;
  const footerHtml = getReportFooter();

  openPrintWindow(title, formatMasterReportTable(headerHtml, bodyHtml, footerHtml), pageSize);
};

// 4. Top Selling Products Report
export const printTopProductsReport = (topProducts = [], searchAnalytics = [], storeCurrency = "ج.م", pageSize = "A4", filterText = "المنتجات الأكثر مبيعاً") => {
  const title = "تقرير المنتجات الأكثر مبيعاً";
  const subtitle = "قائمة المنتجات الأعلى أداءً وتحقيقاً للإيرادات بالمتجر";

  const topProdRows = topProducts.map((p, idx) => `
    <tr>
      <td style="text-align: center;" class="number-col">${idx + 1}</td>
      <td style="font-weight: 800; color: #0f172a;">${p.name}</td>
      <td class="number-col" style="text-align: center; color: #2563eb; font-weight: 800;">${p.quantity} قطعة</td>
      <td class="number-col" style="font-weight: 900; color: #16a34a;">${(p.totalValue || 0).toFixed(2)} ${storeCurrency}</td>
    </tr>
  `).join('');

  const headerHtml = getReportHeader(title, subtitle, filterText);
  const bodyHtml = `
    <div style="margin-top: 6px;">
      <table>
        <thead>
          <tr>
            <th style="width: 8%; text-align: center;">#</th>
            <th style="width: 50%;">اسم المنتج</th>
            <th style="width: 20%; text-align: center;">الكمية المباعة</th>
            <th style="width: 22%;">الإيرادات</th>
          </tr>
        </thead>
        <tbody>
          ${topProdRows.length > 0 ? topProdRows : '<tr><td colspan="4" style="text-align:center; padding:12px; color:#94a3b8;">لا توجد بيانات مبيعات متوفرة لهذه الفترة</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
  const footerHtml = getReportFooter();

  openPrintWindow(title, formatMasterReportTable(headerHtml, bodyHtml, footerHtml), pageSize);
};

// 5. Detailed General Ledger / Orders Register Audit
export const printGeneralLedgerReport = (filteredOrders = [], storeCurrency = "ج.م", pageSize = "A4", filterText = "دفتر الأستاذ العام") => {
  const title = "دفتر الأستاذ والسجل العام للطلبات";
  const subtitle = "سجل تفصيلي دقيق لجميع معاملات الطلبات والقيمة الإجمالية المحصلة";

  let totalSum = 0;
  let totalShipping = 0;

  const orderLedgerRows = filteredOrders.map((o, idx) => {
    const tot = Number(o.total) || 0;
    const ship = Number(o.shippingCost) || 0;
    const isCancelled = ["CANCELED", "CANCELLED"].includes((o.status || "").toUpperCase());
    
    if (!isCancelled) {
      totalSum += tot;
      totalShipping += ship;
    }

    return `
      <tr>
        <td style="text-align: center;" class="number-col">${idx + 1}</td>
        <td class="number-col">#${o.orderNumber || o.id}</td>
        <td style="font-weight: 700;">${o.customerName || "غير معروف"}</td>
        <td>${o.shippingLocationName || "القاهرة وباقي المحافظات"}</td>
        <td style="text-align: center;">
          <span class="badge ${isCancelled ? "badge-danger" : "badge-success"}">
            ${o.status || "PENDING"}
          </span>
        </td>
        <td class="number-col">${ship > 0 ? `${ship} ${storeCurrency}` : "مجاني"}</td>
        <td class="number-col" style="font-weight: 900; ${isCancelled ? 'text-decoration: line-through; color: #94a3b8;' : 'color: #0f172a;'}">
          ${tot.toFixed(2)} ${storeCurrency}
        </td>
      </tr>
    `;
  }).join('');

  const headerHtml = getReportHeader(title, subtitle, filterText);
  const bodyHtml = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-title">عدد القيود بالدفتر</span>
        <span class="kpi-value">${filteredOrders.length} معاملة</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">إجمالي المقبوضات الفعالة</span>
        <span class="kpi-value" style="color: #16a34a;">${totalSum.toFixed(2)} ${storeCurrency}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">إجمالي الشحن</span>
        <span class="kpi-value" style="color: #0284c7;">${totalShipping.toFixed(2)} ${storeCurrency}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">صافي المنتجات</span>
        <span class="kpi-value" style="color: #8b5cf6;">${(totalSum - totalShipping).toFixed(2)} ${storeCurrency}</span>
      </div>
    </div>

    <div style="margin-top: 6px;">
      <h3 style="font-size: 10px; font-weight: 800; color: #0f172a; margin-bottom: 4px;">سجل الحركات اليومية</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 5%; text-align: center;">#</th>
            <th style="width: 15%;">رقم الطلب</th>
            <th style="width: 25%;">اسم العميل</th>
            <th style="width: 20%;">المحافظة</th>
            <th style="width: 12%; text-align: center;">الحالة</th>
            <th style="width: 10%;">الشحن</th>
            <th style="width: 13%;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${orderLedgerRows}
        </tbody>
        <tfoot>
          <tr style="background-color: #f1f5f9; font-weight: 800;">
            <td colspan="5" style="text-align: left; padding: 4px 6px;">الإجمالي الصافي للطلبات الفعالة:</td>
            <td class="number-col" style="padding: 4px 6px; color: #0284c7;">${totalShipping.toFixed(2)} ${storeCurrency}</td>
            <td class="number-col" style="padding: 4px 6px; color: #16a34a; font-weight: 900;">${totalSum.toFixed(2)} ${storeCurrency}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
  const footerHtml = getReportFooter();

  openPrintWindow(title, formatMasterReportTable(headerHtml, bodyHtml, footerHtml), pageSize);
};

export const printPeriodComparisonReport = (comparisonData, storeCurrency = "ج.م", pageSize = "A4", filterText = "") => {
  const title = "تقرير مقارنة الأداء المالي بالفترات";
  const subtitle = "تحليل النمو والانخفاض في المبيعات، الطلبات، ومتوسط قيمة الطلب بين الفترات الزمنية";

  const { titleA, titleB, periodA, periodB, growth } = comparisonData;

  const headerHtml = getReportHeader(title, subtitle, filterText);
  const bodyHtml = `
    <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr);">
      <div class="kpi-card">
        <span class="kpi-title">معدل نمو المبيعات (Sales Growth)</span>
        <span class="kpi-value" style="color: ${growth.sales >= 0 ? '#16a34a' : '#dc2626'};">
          ${growth.sales >= 0 ? `+${growth.sales.toFixed(1)}% ↑` : `${growth.sales.toFixed(1)}% ↓`}
        </span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">نمو عدد الطلبات (Orders Growth)</span>
        <span class="kpi-value" style="color: ${growth.orders >= 0 ? '#16a34a' : '#dc2626'};">
          ${growth.orders >= 0 ? `+${growth.orders.toFixed(1)}% ↑` : `${growth.orders.toFixed(1)}% ↓`}
        </span>
      </div>
      <div class="kpi-card">
        <span class="kpi-title">نمو متوسط قيمة الطلب (AOV)</span>
        <span class="kpi-value" style="color: ${growth.aov >= 0 ? '#16a34a' : '#dc2626'};">
          ${growth.aov >= 0 ? `+${growth.aov.toFixed(1)}% ↑` : `${growth.aov.toFixed(1)}% ↓`}
        </span>
      </div>
    </div>

    <div style="margin-top: 10px;">
      <h3 style="font-size: 11px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">جدول المقارنة التفصيلي بين الفترتين</h3>
      <table>
        <thead>
          <tr>
            <th style="width: 30%;">المؤشر المالي / التشغيلي</th>
            <th style="width: 25%; text-align: center;">${escapeHtml(titleA)}</th>
            <th style="width: 25%; text-align: center;">${escapeHtml(titleB)}</th>
            <th style="width: 20%; text-align: center;">نسبة التغير (Growth %)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight: 800;">إجمالي حجم المبيعات</td>
            <td class="number-col" style="color: #1e3a8a; font-weight: 900;">${periodA.sales.toFixed(2)} ${storeCurrency}</td>
            <td class="number-col">${periodB.sales.toFixed(2)} ${storeCurrency}</td>
            <td style="text-align: center; font-weight: 900; color: ${growth.sales >= 0 ? '#16a34a' : '#dc2626'};">
              ${growth.sales >= 0 ? `+${growth.sales.toFixed(1)}%` : `${growth.sales.toFixed(1)}%`}
            </td>
          </tr>
          <tr>
            <td style="font-weight: 800;">عدد الطلبات الكلي</td>
            <td class="number-col">${periodA.ordersCount} طلبات</td>
            <td class="number-col">${periodB.ordersCount} طلبات</td>
            <td style="text-align: center; font-weight: 900; color: ${growth.orders >= 0 ? '#16a34a' : '#dc2626'};">
              ${growth.orders >= 0 ? `+${growth.orders.toFixed(1)}%` : `${growth.orders.toFixed(1)}%`}
            </td>
          </tr>
          <tr>
            <td style="font-weight: 800;">الطلبات المكتملة والمحصلة</td>
            <td class="number-col" style="color: #16a34a;">${periodA.completedCount} طلبات</td>
            <td class="number-col">${periodB.completedCount} طلبات</td>
            <td style="text-align: center; font-weight: 900; color: ${growth.completed >= 0 ? '#16a34a' : '#dc2626'};">
              ${growth.completed >= 0 ? `+${growth.completed.toFixed(1)}%` : `${growth.completed.toFixed(1)}%`}
            </td>
          </tr>
          <tr>
            <td style="font-weight: 800;">متوسط قيمة الطلب (AOV)</td>
            <td class="number-col" style="font-weight: 900;">${periodA.aov.toFixed(2)} ${storeCurrency}</td>
            <td class="number-col">${periodB.aov.toFixed(2)} ${storeCurrency}</td>
            <td style="text-align: center; font-weight: 900; color: ${growth.aov >= 0 ? '#16a34a' : '#dc2626'};">
              ${growth.aov >= 0 ? `+${growth.aov.toFixed(1)}%` : `${growth.aov.toFixed(1)}%`}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  const footerHtml = getReportFooter();

  openPrintWindow(title, formatMasterReportTable(headerHtml, bodyHtml, footerHtml), pageSize);
};
