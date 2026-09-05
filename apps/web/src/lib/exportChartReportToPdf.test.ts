import { describe, expect, it, vi, beforeEach } from 'vitest';
import { inlineCssVars, exportChartReportToPdf } from './exportChartReportToPdf';

const { docSave, docText, docAddImage } = vi.hoisted(() => ({
  docSave: vi.fn(),
  docText: vi.fn(),
  docAddImage: vi.fn(),
}));

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    setFontSize: vi.fn(),
    setTextColor: vi.fn(),
    text: docText,
    addImage: docAddImage,
    save: docSave,
    internal: { pageSize: { getWidth: () => 595 } },
  })),
}));

vi.mock('jspdf-autotable', () => ({ default: vi.fn() }));

describe('inlineCssVars', () => {
  it('replaces every var(--x) reference with its resolved literal value', () => {
    const svg = '<rect fill="var(--chart-1)" stroke="var(--border)" />';
    const result = inlineCssVars(svg, { '--chart-1': '#ff0000', '--border': 'rgb(0,0,0)' });
    expect(result).toBe('<rect fill="#ff0000" stroke="rgb(0,0,0)" />');
  });

  it('replaces every occurrence when the same variable appears multiple times', () => {
    const svg = 'var(--foreground) var(--foreground)';
    expect(inlineCssVars(svg, { '--foreground': 'black' })).toBe('black black');
  });

  it('leaves markup unchanged when no vars are given to substitute', () => {
    const svg = '<rect fill="var(--chart-1)" />';
    expect(inlineCssVars(svg, {})).toBe(svg);
  });

  it('leaves an unresolved var() reference untouched rather than guessing a value', () => {
    const svg = '<rect fill="var(--chart-1)" stroke="var(--unknown)" />';
    const result = inlineCssVars(svg, { '--chart-1': '#ff0000' });
    expect(result).toBe('<rect fill="#ff0000" stroke="var(--unknown)" />');
  });
});

describe('exportChartReportToPdf', () => {
  const sheets = [{ name: 'Sheet 1', rows: [{ Month: 'Jan', Amount: 100 }] }];

  beforeEach(() => {
    docSave.mockClear();
    docText.mockClear();
    docAddImage.mockClear();
  });

  it('exports a table-only PDF when the container has no chart <svg>', async () => {
    const container = document.createElement('div');

    await exportChartReportToPdf('Title', 'Description', container, sheets, 'report');

    expect(docAddImage).not.toHaveBeenCalled();
    expect(docSave).toHaveBeenCalledWith('report.pdf');
  });

  it('still saves the PDF when chart rasterization fails, since the table alone is still useful', async () => {
    const container = document.createElement('div');
    container.innerHTML = '<svg width="100" height="50"><rect /></svg>';

    // jsdom doesn't actually load blob: URLs, so Image never fires on its own — fire onload
    // manually to reach the real canvas.getContext('2d') call, which jsdom returns null for
    // without the optional `canvas` package installed. That null is exactly what triggers the
    // "Canvas 2D context unavailable" failure this test exists to prove gets swallowed.
    const OriginalImage = global.Image;
    class FakeImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }
    // @ts-expect-error -- test double, not a full Image implementation
    global.Image = FakeImage;

    try {
      await expect(exportChartReportToPdf('Title', 'Description', container, sheets, 'report')).resolves.toBeUndefined();
      expect(docSave).toHaveBeenCalledWith('report.pdf');
      expect(docAddImage).not.toHaveBeenCalled();
    } finally {
      global.Image = OriginalImage;
    }
  });
});
