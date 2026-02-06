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
