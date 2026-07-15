import { describe, expect, it } from "vitest";
import { formatINR } from "./currency";

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
