import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { inlineCssVars, resolveCssVarsUsedIn, pickChartSvg, withLightThemeVars, exportChartReportToPdf } from './exportChartReportToPdf';

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

describe('resolveCssVarsUsedIn', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('style');
  });

  it('resolves every var(--x) reference found in the markup, not just a fixed subset', () => {
    // The bug this guards against: an earlier version hardcoded a list of "the vars we
    // remembered charts use" (--chart-1..5, --border, etc.) and silently skipped anything not
    // on it — CashFlowChart's --success/--destructive bars and --muted/--popover tooltip were
    // never on that list, so every export of a report using that chart rendered as a solid
    // black block (an unresolved var() in an SVG attribute is an invalid color, and browsers
    // fall back to black rather than the intended fill). Discovering vars from the actual
    // markup instead of a maintained list means a color token this test doesn't even know
    // about yet still gets resolved.
    document.documentElement.style.setProperty('--success', 'rgb(1, 2, 3)');
    document.documentElement.style.setProperty('--destructive', 'rgb(4, 5, 6)');
    document.documentElement.style.setProperty('--some-future-token', 'rgb(7, 8, 9)');

    const svg = '<rect fill="var(--success)" /><rect fill="var(--destructive)" /><rect fill="var(--some-future-token)" />';
    const resolved = resolveCssVarsUsedIn(svg);

    expect(resolved).toEqual({
      '--success': 'rgb(1, 2, 3)',
      '--destructive': 'rgb(4, 5, 6)',
      '--some-future-token': 'rgb(7, 8, 9)',
    });
  });

  it('omits a var referenced in markup that has no computed value, rather than inlining an empty string', () => {
    const resolved = resolveCssVarsUsedIn('<rect fill="var(--never-defined)" />');
    expect(resolved).toEqual({});
  });
});

describe('pickChartSvg', () => {
  function withRect(svg: SVGSVGElement, width: number, height: number) {
    svg.getBoundingClientRect = () => ({ width, height }) as DOMRect;
    return svg;
  }

  it('picks the largest svg, not the first one in DOM order', () => {
    // Real-world shape of the bug this guards: recharts renders a tiny <svg> per Legend entry
    // (e.g. a 16x16 circle swatch) before the actual chart surface <svg> in the DOM. Picking
    // element order instead of size rasterized the swatch, stretched across the page, which
    // is the "solid black blob" a user actually downloaded and reported.
    const container = document.createElement('div');
    const legendIcon = withRect(document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement, 16, 16);
    const chartSurface = withRect(document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement, 500, 280);
    container.append(legendIcon, chartSurface);

    expect(pickChartSvg(container)).toBe(chartSurface);
  });

  it('returns undefined when the container has no svg at all', () => {
    expect(pickChartSvg(document.createElement('div'))).toBeUndefined();
  });
});

describe('withLightThemeVars', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('removes the dark class while reading, then restores it', () => {
    document.documentElement.classList.add('dark');
    let sawDarkClassDuringRead = true;

    withLightThemeVars(() => {
      sawDarkClassDuringRead = document.documentElement.classList.contains('dark');
    });

    expect(sawDarkClassDuringRead).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('leaves the class untouched (absent) when the page was already in light mode', () => {
    withLightThemeVars(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('restores the dark class even if the reader throws', () => {
    document.documentElement.classList.add('dark');

    expect(() =>
      withLightThemeVars(() => {
        throw new Error('boom');
      })
    ).toThrow('boom');

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('resolves a css var to its light-mode value even while the page is in dark mode', () => {
    // Mirrors this app's real setup: globals.css defines --success under :root (light) and
    // overrides it again under .dark. Forcing light mode for export must resolve the :root
    // value regardless of which class is on <html> right now.
    const style = document.createElement('style');
    style.textContent = ':root { --success: rgb(1, 2, 3); } .dark { --success: rgb(9, 9, 9); }';
    document.head.appendChild(style);
    document.documentElement.classList.add('dark');

    try {
      const resolved = withLightThemeVars(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--success').trim()
      );
      expect(resolved).toBe('rgb(1,2,3)');
    } finally {
      style.remove();
    }
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
