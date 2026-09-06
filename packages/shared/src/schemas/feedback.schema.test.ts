import { describe, expect, it } from "vitest";
import { feedbackSchema } from "./feedback.schema";

describe("feedbackSchema", () => {
  const valid = {
    name: "Sibi",
    email: "sibi@example.com",
    message: "The dashboard chart looks great, thanks!",
  };

  it("accepts a valid payload without a screenshot", () => {
    expect(feedbackSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a valid payload with a screenshot", () => {
    const withScreenshot = {
      ...valid,
      screenshot: { dataUrl: "data:image/png;base64,iVBORw0KGgo=", filename: "bug.png", contentType: "image/png" },
    };
    expect(feedbackSchema.safeParse(withScreenshot).success).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(feedbackSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(feedbackSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects an empty message", () => {
    expect(feedbackSchema.safeParse({ ...valid, message: "" }).success).toBe(false);
  });

  it("rejects a message over 5000 characters", () => {
    expect(feedbackSchema.safeParse({ ...valid, message: "x".repeat(5001) }).success).toBe(false);
  });

  it("rejects a malformed screenshot object missing dataUrl", () => {
    const malformed = { ...valid, screenshot: { filename: "bug.png", contentType: "image/png" } };
    expect(feedbackSchema.safeParse(malformed).success).toBe(false);
  });
});
