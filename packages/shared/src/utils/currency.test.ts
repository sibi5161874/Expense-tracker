import { describe, expect, it } from "vitest";
import { formatINR, formatCurrency, formatCompactCurrency } from "./currency";

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

describe("formatCompactCurrency", () => {
  it("leaves sub-thousand INR amounts unabbreviated", () => {
    expect(formatCompactCurrency(925)).toBe("₹925");
  });

  it("abbreviates thousands as K", () => {
    expect(formatCompactCurrency(12500)).toBe("₹12.5K");
  });

  it("abbreviates lakhs as L", () => {
    expect(formatCompactCurrency(400000)).toBe("₹4L");
  });

  it("abbreviates crores as Cr", () => {
    expect(formatCompactCurrency(46000000)).toBe("₹4.6Cr");
  });

  it("keeps the leading minus for negative amounts", () => {
    expect(formatCompactCurrency(-15142)).toBe("-₹15.1K");
  });

  it("abbreviates USD with the Western K/M/B scale", () => {
    expect(formatCompactCurrency(5600000, "USD")).toBe("$5.6M");
    expect(formatCompactCurrency(6600000000, "USD")).toBe("$6.6B");
  });

  it("falls back to INR formatting for an unrecognized currency code rather than throwing", () => {
    expect(() => formatCompactCurrency(12500, "NOT_A_CODE")).not.toThrow();
  });
});
