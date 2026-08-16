import crypto from 'node:crypto';
import Razorpay from 'razorpay';

/**
 * Server-only Razorpay client + signature verification.
 *
 * Deliberately NOT in packages/shared: it imports Node's `crypto`, and shared
 * is consumed by the Expo mobile app too — a Node built-in anywhere in that
 * dependency graph risks breaking Metro's bundler for a feature mobile
 * doesn't use. Everything here stays web-only, same reasoning as the
 * account-deletion route's use of the service_role admin client.
 *
 * NOT unit tested: apps/web has no test runner configured (only
 * packages/shared does). These two functions are pure and would be easy to
 * test if that changes — flagging the gap rather than silently skipping it.
 */

let client: Razorpay | null = null;

/** Throws with a message safe to return to the client — never leaks which env var specifically, just that payments aren't configured. */
export function getRazorpayClient(): Razorpay {
  if (client) return client;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('Payments are not configured on this server yet.');
  }

  client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return client;
}

/**
 * Verifies a Razorpay Checkout success callback is genuine, per Razorpay's
 * documented scheme: HMAC-SHA256 of "order_id|payment_id" using the key
 * secret must equal the signature Checkout returned. Without this, anyone
 * could POST a fabricated order_id/payment_id pair to /verify and grant
 * themselves Pro for free — this is the actual security boundary, not the
 * client-side checkout flow.
 */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return false;

  const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');

  // Constant-time comparison — a naive === leaks timing information about
  // how many leading bytes matched, which is exactly what HMAC verification
  // exists to not leak.
  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(signature, 'hex');
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

/** Same HMAC scheme, but over the raw webhook body against RAZORPAY_WEBHOOK_SECRET (a separate secret from the API key). */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) return false;

  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  const expectedBuf = Buffer.from(expected, 'hex');
  const actualBuf = Buffer.from(signature, 'hex');
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}
