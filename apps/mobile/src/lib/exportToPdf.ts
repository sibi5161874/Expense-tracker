import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import type { ExcelSheet } from "@/lib/exportToExcel";

/**
 * Mirrors apps/web/src/lib/exportToPdf.ts's contract (same tabular ExcelSheet[] input, same
 * "build straight from data, never a screenshot" rule from RULES.md §4) but a different
 * mechanism — no jsPDF here. `expo-print`'s `printToFileAsync` renders an HTML string to a
 * real PDF file natively (WebView-backed on both platforms), which is the toolchain already
 * installed for this app rather than a second PDF library; `expo-sharing` then hands the
 * file to the OS share sheet, since a mobile app has no browser download to trigger.
 */
function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHtml(title: string, description: string, sheets: ExcelSheet[]): string {
  const sections = sheets
    .filter((sheet) => sheet.rows.length > 0)
    .map((sheet) => {
      const columns = Object.keys(sheet.rows[0]!);
      const headerRow = columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("");
      const bodyRows = sheet.rows
        .map((row) => `<tr>${columns.map((c) => `<td>${escapeHtml(row[c])}</td>`).join("")}</tr>`)
        .join("");
      return `<h2>${escapeHtml(sheet.name)}</h2><table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    })
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>
    body { font-family: -apple-system, Roboto, sans-serif; color: #1a1a1a; padding: 24px; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    p.description { color: #666; font-size: 12px; margin-top: 0; margin-bottom: 20px; }
    h2 { font-size: 14px; margin-top: 24px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
    th { background: #f0f0f0; font-weight: 600; }
  </style></head><body>
    <h1>${escapeHtml(title)}</h1>
    ${description ? `<p class="description">${escapeHtml(description)}</p>` : ""}
    ${sections}
  </body></html>`;
}

export async function exportReportToPdf(title: string, description: string, sheets: ExcelSheet[], filename: string) {
  const html = buildHtml(title, description, sheets);
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  // printToFileAsync names the file itself (a random cache-dir name) — rename to the
  // report's own filename so the OS share sheet/recipient sees a meaningful name.
  const dest = `${FileSystem.cacheDirectory}${filename}.pdf`;
  await FileSystem.moveAsync({ from: uri, to: dest });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Sharing isn't available on this device.");
  }
  await Sharing.shareAsync(dest, { mimeType: "application/pdf", dialogTitle: title, UTI: "com.adobe.pdf" });
}
