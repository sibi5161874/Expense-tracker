import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { NetWorthBreakdown } from '@repo/shared/logic';

const PAGE_MARGIN = 40;

const ROW_LABELS: { key: keyof NetWorthBreakdown; label: string }[] = [
  { key: 'cashAndBankTotal', label: 'Cash & Bank' },
  { key: 'fixedDepositsTotal', label: 'Fixed Deposits' },
  { key: 'goldTotal', label: 'Gold' },
  { key: 'epfTotal', label: 'EPF' },
  { key: 'npsTotal', label: 'NPS' },
  { key: 'ssyTotal', label: 'SSY' },
  { key: 'sgbTotal', label: 'SGB' },
  { key: 'ulipTotal', label: 'ULIP' },
  { key: 'realEstateTotal', label: 'Real Estate' },
  { key: 'ppfTotal', label: 'PPF' },
  { key: 'recurringDepositsTotal', label: 'Recurring Deposits' },
  { key: 'nscTotal', label: 'NSC' },
  { key: 'vehiclesTotal', label: 'Vehicles' },
  { key: 'portfolioValue', label: 'Portfolio' },
  { key: 'liabilitiesTotal', label: 'Liabilities' },
];

function formatRupees(n: number): string {
  return `Rs. ${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

/**
 * Server-side counterpart to exportToPdf.ts's exportReportToPdf: same jsPDF + autoTable
 * approach (vector text, no DOM/CSS involved, so nothing here can hit the html2canvas
 * color-parsing class of bug), but returns raw bytes via `.output('arraybuffer')` instead of
 * calling `.save()` — `.save()` triggers a browser download, which doesn't exist in a cron
 * route. Purpose-built for the monthly email rather than reusing the generic
 * ExcelSheet-driven exportReportToPdf, since this always has the exact same shape: one net
 * worth breakdown, not arbitrary report tables.
 */
export function generateMonthlySummaryPdf(userEmail: string, month: string, breakdown: NetWorthBreakdown): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  let y = 50;

  doc.setFontSize(16);
  doc.text('Monthly Financial Summary', PAGE_MARGIN, y);
  y += 20;

  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`${userEmail} — ${month}`, PAGE_MARGIN, y);
  doc.setTextColor(0);
  y += 24;

  const rows = ROW_LABELS.map(({ key, label }) => {
    const value = breakdown[key];
    return key === 'liabilitiesTotal' ? [label, formatRupees(-value)] : [label, formatRupees(value)];
  });
  rows.push(['Net Worth', formatRupees(breakdown.netWorth)]);

  autoTable(doc, {
    startY: y,
    head: [['Category', 'Amount']],
    body: rows,
    styles: { fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [230, 230, 230], textColor: 20 },
    // Bold the Net Worth total row (the last one) so it reads as the summary line, not just another category.
    didParseCell: (data) => {
      if (data.row.index === rows.length - 1) data.cell.styles.fontStyle = 'bold';
    },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
  });

  return Buffer.from(doc.output('arraybuffer'));
}
