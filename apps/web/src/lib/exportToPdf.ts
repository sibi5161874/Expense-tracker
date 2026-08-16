import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ExcelSheet } from './exportToExcel';

const PAGE_MARGIN = 40;
const PAGE_BREAK_Y = 760;

/**
 * Builds a PDF directly from tabular data — the same data that drives Excel export —
 * using jsPDF + autoTable to draw vector text.
 *
 * This deliberately does NOT screenshot the DOM. The previous implementation used
 * html2canvas, which has its own CSS parser predating oklch()/lab()/color-mix() and threw
 * "unsupported color function" on our Tailwind v4 design tokens. Patching that parser was
 * a losing game (every new token or opacity modifier is another chance to break it), so
 * the export no longer reads computed styles at all. Nothing here can regress that way.
 *
 * A side benefit: output is selectable, searchable text at any zoom rather than a bitmap.
 */
export function exportReportToPdf(title: string, description: string, sheets: ExcelSheet[], filename: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  let y = 50;

  doc.setFontSize(16);
  doc.text(title, PAGE_MARGIN, y);
  y += 18;

  if (description) {
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(description, PAGE_MARGIN, y);
    doc.setTextColor(0);
    y += 22;
  }

  for (const sheet of sheets) {
    if (sheet.rows.length === 0) continue;
    if (y > PAGE_BREAK_Y) {
      doc.addPage();
      y = 50;
    }

    const columns = Object.keys(sheet.rows[0]!);
    doc.setFontSize(12);
    doc.text(sheet.name, PAGE_MARGIN, y);

    autoTable(doc, {
      startY: y + 8,
      head: [columns],
      body: sheet.rows.map((row) => columns.map((c) => String(row[c] ?? ''))),
      styles: { fontSize: 8, cellPadding: 4 },
      headStyles: { fillColor: [230, 230, 230], textColor: 20 },
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    });

    const table = doc as unknown as { lastAutoTable?: { finalY: number } };
    y = (table.lastAutoTable?.finalY ?? y) + 28;
  }

  doc.save(`${filename}.pdf`);
}
