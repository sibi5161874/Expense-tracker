import { describe, expect, it } from "vitest";
import { createOrderSchema, verifyPaymentSchema } from "./payment.schema";

describe("createOrderSchema", () => {
  it("accepts a known purpose", () => {
    expect(createOrderSchema.safeParse({ purpose: "trial_verification" }).success).toBe(true);
    expect(createOrderSchema.safeParse({ purpose: "lifetime_purchase" }).success).toBe(true);
  });

  it("rejects an unknown purpose", () => {
    expect(createOrderSchema.safeParse({ purpose: "free_lunch" }).success).toBe(false);
  });

  it("rejects a missing purpose", () => {
    expect(createOrderSchema.safeParse({}).success).toBe(false);
  });
});

describe("verifyPaymentSchema", () => {
  const valid = {
    razorpay_order_id: "order_123",
    razorpay_payment_id: "pay_123",
    razorpay_signature: "sig_123",
  };

  it("accepts all three fields as non-empty strings", () => {
    expect(verifyPaymentSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a missing field", () => {
    const { razorpay_signature: _omit, ...rest } = valid;
    expect(verifyPaymentSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects an empty string field", () => {
    expect(verifyPaymentSchema.safeParse({ ...valid, razorpay_order_id: "" }).success).toBe(false);
  });
});
