import { describe, expect, it } from "vitest";
import { formatINR, formatCurrency } from "./currency";

describe("formatINR", () => {
  it("formats positive amounts with the ₹ symbol", () => {
    expect(formatINR(450)).toBe("₹450.00");
  });

  it("formats negative amounts with a leading minus", () => {
    expect(formatINR(-450)).toBe("-₹450.00");
  });

  it("formats zero", () => {
    expect(formatINR(0)).toBe("₹0.00");
  });
});

describe("formatCurrency", () => {
  it("formats in the given currency, not always INR", () => {
    expect(formatCurrency(450, "USD")).toContain("450.00");
    expect(formatCurrency(450, "USD")).not.toContain("₹");
  });

  it("is case-insensitive on the currency code", () => {
    expect(formatCurrency(100, "usd")).toBe(formatCurrency(100, "USD"));
  });

  it("falls back to INR formatting for an unrecognized/invalid currency code rather than throwing", () => {
    expect(() => formatCurrency(100, "NOT_A_CODE")).not.toThrow();
    expect(formatCurrency(100, "")).toBe(formatINR(100));
  });

  it("formats INR the same way formatINR does", () => {
    expect(formatCurrency(450, "INR")).toBe(formatINR(450));
  });
});
