const COLOR_PROPS = ['color', 'backgroundColor', 'borderColor', 'outlineColor', 'fill', 'stroke'] as const;

// html2canvas's color parser predates every modern CSS color function — oklch/oklab
// (our design tokens), and lab/lch/color() (what getComputedStyle can return for
// color-mix() results and wide-gamut browser color resolution). Any of these show up
// as "unsupported color function" during PDF capture, worse on pages with more colored
// elements (e.g. the 14-report Overall Report), so this checks broadly rather than
// just for oklch.
const UNSUPPORTED_COLOR_FN = /\b(?:oklch|oklab|lab|lch|color)\(/;

let sharedCtx: CanvasRenderingContext2D | null | undefined;

/** The Canvas 2D API normalizes any valid CSS color to hex when read back from fillStyle, so we use that as a browser-native converter. */
export function cssColorToHex(value: string): string {
  if (!value || !UNSUPPORTED_COLOR_FN.test(value)) return value;
  if (sharedCtx === undefined) {
    sharedCtx = document.createElement('canvas').getContext('2d');
  }
  if (!sharedCtx) return value;

  sharedCtx.fillStyle = '#000000';
  try {
    sharedCtx.fillStyle = value;
  } catch {
    return value;
  }
  return sharedCtx.fillStyle as string;
}

/** Bakes resolved (browser-native-only) colors into inline styles across the cloned DOM before html2canvas rasterizes it. */
export function resolveOklchColors(root: HTMLElement) {
  const elements = [root, ...root.querySelectorAll<HTMLElement>('*')];
  for (const el of elements) {
    const computed = getComputedStyle(el);
    for (const prop of COLOR_PROPS) {
      const value = computed.getPropertyValue(prop) || (computed as unknown as Record<string, string>)[prop];
      if (value && UNSUPPORTED_COLOR_FN.test(value)) {
        (el.style as unknown as Record<string, string>)[prop] = cssColorToHex(value);
      }
    }
  }
}
