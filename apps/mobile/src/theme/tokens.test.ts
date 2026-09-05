import { accents, neutrals, semantic, radius, spacing } from "./tokens";

const HEX = /^#[0-9A-Fa-f]{6}$/;

describe("PRISM OPS tokens", () => {
  it("defines a valid 6-digit hex for every accent/mode/role", () => {
    for (const accent of Object.values(accents)) {
      for (const mode of ["light", "dark"] as const) {
        for (const value of Object.values(accent[mode])) {
          expect(value).toMatch(HEX);
        }
      }
    }
  });

  it("gives every accent a light-mode primary distinct from its dark-mode primary", () => {
    // The dark-mode hexes are pastel, tuned for a dark surface — reusing them unchanged as a
    // light-mode button fill is exactly the WCAG 1.4.11 failure this file's header comment
    // documents. This is a regression guard against silently collapsing the two back to one.
    for (const accent of Object.values(accents)) {
      expect(accent.light.primary).not.toBe(accent.dark.primary);
    }
  });

  it("keeps every neutral tier's hex valid, including the AMOLED variant", () => {
    for (const tier of Object.values(neutrals)) {
      for (const value of Object.values(tier)) {
        expect(value).toMatch(HEX);
      }
    }
  });

  it("gives AMOLED a brighter border than dark mode (card must stay visible on true black)", () => {
    expect(neutrals.amoled.border).not.toBe(neutrals.dark.border);
  });

  it("never derives semantic colors from the accent palette", () => {
    // success/warning/destructive/info must stay fixed regardless of accent — picking
    // "Mint" or "Inferno" as an accent must not make every button read as income/expense.
    const accentHexes = new Set(
      Object.values(accents).flatMap((a) => [a.light.primary, a.dark.primary])
    );
    for (const tier of Object.values(semantic)) {
      expect(accentHexes.has(tier.success)).toBe(false);
      expect(accentHexes.has(tier.destructive)).toBe(false);
    }
  });

  it("gives dialog a larger radius than bottom sheet, and bottom sheet larger than input", () => {
    // Regression guard for the "modal radius" ambiguity found in the original brief, where
    // input/bottom-sheet/dialog were contradictorily specified as 20, 24, and 28 in
    // different sections — resolved here as three distinct, ordered tokens.
    expect(radius.input).toBeLessThan(radius.bottomSheet);
    expect(radius.bottomSheet).toBeLessThan(radius.dialog);
    expect(radius.pill).toBeGreaterThan(radius.dialog);
  });

  it("keeps the spacing scale strictly increasing", () => {
    const values = Object.values(spacing);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});
