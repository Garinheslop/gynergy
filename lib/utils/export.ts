// Export utilities for admin dashboard

export interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  format?: (value: unknown, row: T) => string;
}

/**
 * Export data to CSV format
 */
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  const headers = columns.map((col) => col.header);

  const rows = data.map((row) =>
    columns.map((col) => {
      const value = getNestedValue(row, col.key as string);
      if (col.format) {
        return escapeCSV(col.format(value, row));
      }
      return escapeCSV(formatValue(value));
    })
  );

  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  downloadFile(csv, `${filename}.csv`, "text/csv");
}

/**
 * Export data to JSON format
 */
export function exportToJSON<T>(data: T[], filename: string): void {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `${filename}.json`, "application/json");
}

/**
 * Generate a simple PDF report (HTML-based for browser printing)
 */
export function exportToPDF<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  title: string,
  _filename: string
): void {
  const html = generatePDFHTML(data, columns, title);

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

function generatePDFHTML<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  title: string
): string {
  const tableRows = data
    .map(
      (row) =>
        `<tr>${columns
          .map((col) => {
            const value = getNestedValue(row, col.key as string);
            const formatted = col.format ? col.format(value, row) : formatValue(value);
            return `<td style="padding: 8px; border: 1px solid #ddd;">${formatted}</td>`;
          })
          .join("")}</tr>`
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #f5f5f5; padding: 10px; border: 1px solid #ddd; text-align: left; }
        td { padding: 8px; border: 1px solid #ddd; }
        .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="meta">Generated on ${new Date().toLocaleString()} • ${data.length} records</p>
      <table>
        <thead>
          <tr>
            ${columns.map((col) => `<th>${col.header}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Pre-built export configurations
export const userExportColumns: ExportColumn<{
  fullName: string;
  email: string;
  hasChallengeAccess: boolean;
  totalPoints: number;
  currentStreak: number;
  level: number;
  createdAt: string;
}>[] = [
  { key: "fullName", header: "Name" },
  { key: "email", header: "Email" },
  { key: "hasChallengeAccess", header: "Has Access", format: (v) => (v ? "Yes" : "No") },
  { key: "totalPoints", header: "Points", format: (v) => String(v).toLocaleString() },
  { key: "currentStreak", header: "Streak" },
  { key: "level", header: "Level" },
  { key: "createdAt", header: "Joined", format: (v) => new Date(v as string).toLocaleDateString() },
];

export const paymentExportColumns: ExportColumn<{
  type: string;
  amount: number;
  status: string;
  date: string;
}>[] = [
  { key: "type", header: "Type" },
  { key: "amount", header: "Amount", format: (v) => `$${((v as number) / 100).toFixed(2)}` },
  { key: "status", header: "Status" },
  { key: "date", header: "Date", format: (v) => new Date(v as string).toLocaleDateString() },
];

// ============================================
// Enhanced PDF Report Builder
// ============================================

export interface PDFReportSection {
  type: "header" | "text" | "metrics" | "table" | "chart-placeholder" | "spacer" | "divider";
  title?: string;
  content?: string;
  data?: Record<string, unknown>[];
  columns?: ExportColumn<Record<string, unknown>>[];
  metrics?: Array<{ label: string; value: string | number; change?: string }>;
  height?: number;
}

export interface PDFReportOptions {
  title: string;
  subtitle?: string;
  logo?: string;
  orientation?: "portrait" | "landscape";
  headerColor?: string;
  accentColor?: string;
}

/**
 * Generate an advanced PDF report with multiple sections
 */
export function generateAdvancedPDFReport(
  sections: PDFReportSection[],
  options: PDFReportOptions
): void {
  const {
    title,
    subtitle,
    logo,
    orientation = "portrait",
    headerColor = "#15b79e",
    accentColor = "#a86cff",
  } = options;

  const timestamp = new Date().toLocaleString();

  const styles = `
    <style>
      @page { size: A4 ${orientation}; margin: 15mm; }
      * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      body { margin: 0; padding: 20px; color: #1f2937; font-size: 11px; line-height: 1.5; background: white; }

      .report-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 3px solid ${headerColor};
      }
      .report-logo { height: 36px; margin-bottom: 8px; }
      .report-title { font-size: 28px; font-weight: 700; margin: 0; color: #111827; }
      .report-subtitle { font-size: 14px; color: #6b7280; margin: 4px 0 0; }
      .report-meta { text-align: right; font-size: 10px; color: #9ca3af; }

      .section { margin-bottom: 24px; page-break-inside: avoid; }
      .section-header { font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid ${accentColor}; }
      .section-text { color: #4b5563; margin: 8px 0; }

      .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
      .metric-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; text-align: center; }
      .metric-value { font-size: 24px; font-weight: 700; color: #111827; }
      .metric-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
      .metric-change { font-size: 10px; color: ${headerColor}; margin-top: 2px; }
      .metric-change.negative { color: #ef4444; }

      .data-table { width: 100%; border-collapse: collapse; font-size: 10px; }
      .data-table th { background: #f3f4f6; padding: 8px 10px; text-align: left; font-weight: 600; font-size: 9px; text-transform: uppercase; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
      .data-table td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; }
      .data-table tr:nth-child(even) { background: #f9fafb; }
      .data-table tr:hover { background: #f3f4f6; }

      .chart-placeholder { background: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 12px; }

      .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
      .spacer { height: 20px; }

      .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #9ca3af; display: flex; justify-content: space-between; }

      @media print {
        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .no-print { display: none; }
        .section { page-break-inside: avoid; }
      }
    </style>
  `;

  let sectionHTML = "";

  for (const section of sections) {
    switch (section.type) {
      case "header":
        sectionHTML += `
          <div class="section">
            <div class="section-header">${section.title || ""}</div>
            ${section.content ? `<p class="section-text">${section.content}</p>` : ""}
          </div>
        `;
        break;

      case "text":
        sectionHTML += `<p class="section-text">${section.content || ""}</p>`;
        break;

      case "metrics":
        if (section.metrics) {
          sectionHTML += `
            <div class="section">
              ${section.title ? `<div class="section-header">${section.title}</div>` : ""}
              <div class="metrics-grid">
                ${section.metrics
                  .map(
                    (m) => `
                    <div class="metric-card">
                      <div class="metric-value">${m.value}</div>
                      <div class="metric-label">${m.label}</div>
                      ${m.change ? `<div class="metric-change ${m.change.startsWith("-") ? "negative" : ""}">${m.change}</div>` : ""}
                    </div>
                  `
                  )
                  .join("")}
              </div>
            </div>
          `;
        }
        break;

      case "table":
        if (section.data && section.columns) {
          sectionHTML += `
            <div class="section">
              ${section.title ? `<div class="section-header">${section.title}</div>` : ""}
              <table class="data-table">
                <thead>
                  <tr>${section.columns.map((c) => `<th>${c.header}</th>`).join("")}</tr>
                </thead>
                <tbody>
                  ${section.data
                    .map(
                      (row) =>
                        `<tr>${section
                          .columns!.map((col) => {
                            const value = getNestedValue(row, col.key as string);
                            const formatted = col.format
                              ? col.format(value, row)
                              : formatValue(value);
                            return `<td>${formatted}</td>`;
                          })
                          .join("")}</tr>`
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          `;
        }
        break;

      case "chart-placeholder":
        sectionHTML += `
          <div class="section">
            ${section.title ? `<div class="section-header">${section.title}</div>` : ""}
            <div class="chart-placeholder" style="height: ${section.height || 200}px;">
              📊 Chart: ${section.content || "Visualization"}
            </div>
          </div>
        `;
        break;

      case "divider":
        sectionHTML += `<div class="divider"></div>`;
        break;

      case "spacer":
        sectionHTML += `<div class="spacer" style="height: ${section.height || 20}px;"></div>`;
        break;
    }
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      ${styles}
    </head>
    <body>
      <div class="report-header">
        <div>
          ${logo ? `<img src="${logo}" class="report-logo" alt="Logo" />` : ""}
          <h1 class="report-title">${title}</h1>
          ${subtitle ? `<p class="report-subtitle">${subtitle}</p>` : ""}
        </div>
        <div class="report-meta">
          <div>Generated: ${timestamp}</div>
          <div>Gynergy Admin Dashboard</div>
        </div>
      </div>

      ${sectionHTML}

      <div class="footer">
        <div>© ${new Date().getFullYear()} Gynergy • Confidential</div>
        <div>Page 1</div>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Quick export dashboard overview
 */
export function exportDashboardOverview(
  metrics: {
    totalUsers: number;
    activeUsers: number;
    revenue: number;
    mrr: number;
    completionRate: number;
    avgStreak: number;
  },
  _trends: { label: string; value: number }[], // Reserved for future chart export
  recentActivity: Array<{ action: string; user: string; time: string }>
): void {
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

  const sections: PDFReportSection[] = [
    {
      type: "metrics",
      title: "Key Performance Indicators",
      metrics: [
        { label: "Total Users", value: metrics.totalUsers.toLocaleString() },
        { label: "Active Users", value: metrics.activeUsers.toLocaleString() },
        { label: "Total Revenue", value: formatCurrency(metrics.revenue) },
        { label: "MRR", value: formatCurrency(metrics.mrr) },
      ],
    },
    { type: "spacer" },
    {
      type: "metrics",
      title: "Engagement Metrics",
      metrics: [
        { label: "Completion Rate", value: `${metrics.completionRate}%` },
        { label: "Avg. Streak", value: `${metrics.avgStreak} days` },
      ],
    },
    { type: "divider" },
    {
      type: "table",
      title: "Recent Activity",
      data: recentActivity,
      columns: [
        { key: "action", header: "Action" },
        { key: "user", header: "User" },
        { key: "time", header: "Time" },
      ],
    },
  ];

  generateAdvancedPDFReport(sections, {
    title: "Dashboard Overview Report",
    subtitle: `Generated on ${new Date().toLocaleDateString()}`,
  });
}
