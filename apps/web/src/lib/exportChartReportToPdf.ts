import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ExcelSheet } from './exportToExcel';

const PAGE_MARGIN = 40;
const PAGE_BREAK_Y = 700;

/** Every CSS custom property this app's chart components reference for fill/stroke/text
 * colors (see StackedAreaChart.tsx's `COLORS` and its `var(--border)`/`var(--muted-foreground)`
 * axis/grid styling). A blob-loaded SVG has no access to the host page's `:root` custom
 * properties, so these have to be resolved to literal values and inlined before rasterizing —
 * otherwise every themed color in the exported image renders as nothing. */
const CHART_CSS_VARS = [
  '--chart-1',
  '--chart-2',
  '--chart-3',
  '--chart-4',
  '--chart-5',
  '--border',
  '--muted-foreground',
  '--foreground',
];

function resolveChartCssVars(): Record<string, string> {
  const styles = getComputedStyle(document.documentElement);
  const resolved: Record<string, string> = {};
  for (const name of CHART_CSS_VARS) {
    const value = styles.getPropertyValue(name).trim();
    if (value) resolved[name] = value;
  }
  return resolved;
}

/** Exported for direct unit testing — this is the exact substitution that stands in for the
 * html2canvas CSS-color parser this file was built to avoid, so it's worth testing in
 * isolation from the DOM/canvas machinery around it. */
export function inlineCssVars(svgMarkup: string, vars: Record<string, string>): string {
  let result = svgMarkup;
  for (const [name, value] of Object.entries(vars)) {
    result = result.replaceAll(`var(${name})`, value);
  }
  return result;
}

/**
 * Rasterizes a live `<svg>` (a rendered Recharts chart) to a PNG data URL via the browser's
 * own Image/canvas pipeline — deliberately NOT html2canvas. This codebase already removed
 * html2canvas once (see exportToPdf.ts's doc comment): its bundled CSS-color parser predates
 * `oklch()`/`color-mix()` and threw "unsupported color function" on this app's dark-mode
 * design tokens. Native `Image`/`<canvas>` decoding has no such parser to trip over — the
 * browser's real rendering pipeline handles any color syntax it natively supports.
 */
async function rasterizeSvgToPng(svg: SVGSVGElement, backgroundColor: string, scale = 2): Promise<string> {
  const rect = svg.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const markup = inlineCssVars(new XMLSerializer().serializeToString(clone), resolveChartCssVars());
  const svgBlob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to rasterize chart image'));
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Same table-driven PDF as `exportReportToPdf`, plus the chart's own rendered image above the
 * table — for a report where the shape of the trend carries as much meaning as the numbers.
 * `chartContainer`'s background color is read live via `getComputedStyle` rather than a fixed
 * value, so the exported image matches whichever theme (light/dark) the page was in at export
 * time instead of assuming one.
 */
export async function exportChartReportToPdf(
  title: string,
  description: string,
  chartContainer: HTMLElement,
  sheets: ExcelSheet[],
  filename: string
) {
  const svg = chartContainer.querySelector('svg');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const imageWidth = pageWidth - PAGE_MARGIN * 2;
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

  if (svg) {
    try {
      const backgroundColor = getComputedStyle(chartContainer).backgroundColor || '#ffffff';
      const dataUrl = await rasterizeSvgToPng(svg, backgroundColor);
      const rect = svg.getBoundingClientRect();
      const imageHeight = rect.width > 0 ? (rect.height / rect.width) * imageWidth : 0;
      if (imageHeight > 0) {
        doc.addImage(dataUrl, 'PNG', PAGE_MARGIN, y, imageWidth, imageHeight);
        y += imageHeight + 24;
      }
    } catch {
      // The chart image failed to rasterize — the table below still makes the export
      // useful, so a rasterization problem shouldn't fail the whole export.
    }
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
