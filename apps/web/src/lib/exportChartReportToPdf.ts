import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ExcelSheet } from './exportToExcel';

const PAGE_MARGIN = 40;
const PAGE_BREAK_Y = 700;

/** Finds every `var(--xxx)` reference actually present in a serialized SVG string and resolves
 * each to its live computed value. A blob-loaded SVG has no access to the host page's `:root`
 * custom properties, so these have to be inlined before rasterizing — otherwise every themed
 * color in the exported image renders as invalid (browsers fall back to black for an
 * unresolvable `fill`/`stroke`, which is exactly what a fixed, incomplete allowlist of "the
 * vars we remembered to list" produced here before: CashFlowChart's `--success`/`--destructive`
 * bars and `--muted`/`--popover` tooltip weren't in the old hardcoded list, so every export of
 * a report using that chart rendered a solid black block instead of colored bars). Discovering
 * the vars from the markup itself instead of maintaining a list means this can't go stale again
 * as chart components add new color tokens. */
export function resolveCssVarsUsedIn(svgMarkup: string): Record<string, string> {
  const styles = getComputedStyle(document.documentElement);
  const resolved: Record<string, string> = {};
  for (const match of svgMarkup.matchAll(/var\((--[\w-]+)\)/g)) {
    const name = match[1]!;
    if (name in resolved) continue;
    const value = styles.getPropertyValue(name).trim();
    if (value) resolved[name] = value;
  }
  return resolved;
}

/** Runs `read` with the page temporarily forced out of dark mode, so every `var()` it resolves
 * comes out as the light-mode value — a PDF is printed on a white page, so a dark-mode chart
 * (light axis text, saturated dark-mode fills) would be unreadable or clash regardless of which
 * theme the user is actually browsing in. Dark mode here is a `.dark` class on `<html>`
 * (`ThemeProvider.tsx`'s `attribute="class"`), and `globals.css` overrides the same custom
 * properties under `.dark` — so removing the class makes every var() cascade back to its
 * `:root` (light) value. The class comes off and back on synchronously around `read`, with no
 * `await` in between, so the browser never gets a chance to paint the intermediate state —
 * the live page never visibly flips theme. */
export function withLightThemeVars<T>(read: () => T): T {
  const root = document.documentElement;
  const wasDark = root.classList.contains('dark');
  if (wasDark) root.classList.remove('dark');
  try {
    return read();
  } finally {
    if (wasDark) root.classList.add('dark');
  }
}

/** Picks the chart's own drawing surface out of a container that may hold several `<svg>`
 * elements — recharts renders each Legend entry's swatch as its own small `<svg>` (e.g. a
 * 16x16 circle icon), and those sit earlier in the DOM than the actual chart surface. Taking
 * the first svg in the container silently rasterized that tiny icon instead of the chart,
 * stretched across the page — which is why exports looked like a solid black blob. The real
 * chart surface is reliably the largest svg in the container, regardless of DOM order or
 * recharts' internal class names. */
export function pickChartSvg(container: HTMLElement): SVGSVGElement | undefined {
  return [...container.querySelectorAll('svg')].sort((a, b) => {
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    return rb.width * rb.height - ra.width * ra.height;
  })[0];
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

  const serialized = new XMLSerializer().serializeToString(clone);
  const markup = withLightThemeVars(() => inlineCssVars(serialized, resolveCssVarsUsedIn(serialized)));
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
 * The chart is always rasterized on a white background and with light-theme colors (see
 * `withLightThemeVars`) regardless of the page's current theme — the PDF page itself is white,
 * so a dark-mode chart would be unreadable or visually clash with the rest of the document.
 */
export async function exportChartReportToPdf(
  title: string,
  description: string,
  chartContainer: HTMLElement,
  sheets: ExcelSheet[],
  filename: string
) {
  const svg = pickChartSvg(chartContainer);
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
      const dataUrl = await rasterizeSvgToPng(svg, '#ffffff');
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
