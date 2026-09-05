import crypto from 'node:crypto';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { verifyCheckoutSignature, verifyWebhookSignature } from './razorpay';

const originalEnv = { ...process.env };

function sign(secret: string, payload: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

describe('verifyCheckoutSignature', () => {
  beforeEach(() => {
    process.env.RAZORPAY_KEY_SECRET = 'test-key-secret';
  });
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('accepts a signature genuinely computed from the same order/payment ids and secret', () => {
    const signature = sign('test-key-secret', 'order_1|pay_1');
    expect(verifyCheckoutSignature('order_1', 'pay_1', signature)).toBe(true);
  });

  it('rejects a signature computed with the wrong secret — the actual security boundary', () => {
    const signature = sign('wrong-secret', 'order_1|pay_1');
    expect(verifyCheckoutSignature('order_1', 'pay_1', signature)).toBe(false);
  });

  it('rejects a signature for a different order/payment id pair (a forged request)', () => {
    const signature = sign('test-key-secret', 'order_1|pay_1');
    expect(verifyCheckoutSignature('order_2', 'pay_1', signature)).toBe(false);
  });

  it('rejects a garbage, non-hex signature without throwing', () => {
    expect(verifyCheckoutSignature('order_1', 'pay_1', 'not-a-real-signature')).toBe(false);
  });

  it('returns false rather than throwing when RAZORPAY_KEY_SECRET is not configured', () => {
    delete process.env.RAZORPAY_KEY_SECRET;
    expect(verifyCheckoutSignature('order_1', 'pay_1', 'anything')).toBe(false);
  });
});

describe('verifyWebhookSignature', () => {
  beforeEach(() => {
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test-webhook-secret';
  });
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('accepts a signature genuinely computed over the exact raw body with the webhook secret', () => {
    const rawBody = JSON.stringify({ event: 'payment.captured' });
    const signature = sign('test-webhook-secret', rawBody);
    expect(verifyWebhookSignature(rawBody, signature)).toBe(true);
  });

  it('rejects the signature when the raw body is altered by even one byte after signing', () => {
    const rawBody = JSON.stringify({ event: 'payment.captured' });
    const signature = sign('test-webhook-secret', rawBody);
    const tamperedBody = rawBody.replace('captured', 'refunded');
    expect(verifyWebhookSignature(tamperedBody, signature)).toBe(false);
  });

  it('rejects a signature computed with the wrong webhook secret', () => {
    const rawBody = JSON.stringify({ event: 'payment.captured' });
    const signature = sign('someone-elses-secret', rawBody);
    expect(verifyWebhookSignature(rawBody, signature)).toBe(false);
  });

  it('returns false rather than throwing when RAZORPAY_WEBHOOK_SECRET is not configured', () => {
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
    expect(verifyWebhookSignature('{}', 'anything')).toBe(false);
  });

  it('uses RAZORPAY_WEBHOOK_SECRET, not RAZORPAY_KEY_SECRET — they are deliberately separate secrets', () => {
    process.env.RAZORPAY_KEY_SECRET = 'checkout-secret';
    const rawBody = '{}';
    const signatureWithWrongSecret = sign('checkout-secret', rawBody);
    expect(verifyWebhookSignature(rawBody, signatureWithWrongSecret)).toBe(false);
  });
});
