import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';

const { verifyWebhookSignatureMock, applyPaymentCaptureMock, createAdminClientMock } = vi.hoisted(() => ({
  verifyWebhookSignatureMock: vi.fn(),
  applyPaymentCaptureMock: vi.fn().mockResolvedValue({ applied: true }),
  createAdminClientMock: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/razorpay', () => ({ verifyWebhookSignature: verifyWebhookSignatureMock }));
vi.mock('@/lib/applyPaymentCapture', () => ({ applyPaymentCapture: applyPaymentCaptureMock }));
vi.mock('@supabase/supabase-js', () => ({ createClient: createAdminClientMock }));

function makeRequest(rawBody: string, signature?: string) {
  const headers = new Headers();
  if (signature !== undefined) headers.set('x-razorpay-signature', signature);
  return new Request('http://localhost/api/payments/webhook', { method: 'POST', headers, body: rawBody });
}

const capturedEventBody = JSON.stringify({
  event: 'payment.captured',
  payload: { payment: { entity: { id: 'pay_1', order_id: 'order_1', notes: { user_id: 'user_1' } } } },
});

describe('POST /api/payments/webhook', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    verifyWebhookSignatureMock.mockReset().mockReturnValue(true);
    applyPaymentCaptureMock.mockReset().mockResolvedValue({ applied: true });
    createAdminClientMock.mockReset().mockReturnValue({});
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('rejects the request when the HMAC signature is missing or wrong — no user session exists to trust instead', async () => {
    verifyWebhookSignatureMock.mockReturnValue(false);

    const res = await POST(makeRequest(capturedEventBody, 'bad-signature'));

    expect(res.status).toBe(400);
    expect(applyPaymentCaptureMock).not.toHaveBeenCalled();
  });

  it('rejects the request outright when no signature header is present at all', async () => {
    const res = await POST(makeRequest(capturedEventBody));
    expect(res.status).toBe(400);
    expect(verifyWebhookSignatureMock).not.toHaveBeenCalled();
  });

  it('returns 500 when the service-role env vars are not configured, without ever calling applyPaymentCapture', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const res = await POST(makeRequest(capturedEventBody, 'good-signature'));

    expect(res.status).toBe(500);
    expect(applyPaymentCaptureMock).not.toHaveBeenCalled();
  });

  it('acknowledges but ignores webhook event types other than payment.captured', async () => {
    const otherEventBody = JSON.stringify({ event: 'order.paid', payload: {} });

    const res = await POST(makeRequest(otherEventBody, 'good-signature'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ received: true });
    expect(applyPaymentCaptureMock).not.toHaveBeenCalled();
  });

  it('acknowledges without erroring when the payload is missing an order/payment/user id', async () => {
    const incompleteBody = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: {} } } });

    const res = await POST(makeRequest(incompleteBody, 'good-signature'));

    expect(res.status).toBe(200);
    expect(applyPaymentCaptureMock).not.toHaveBeenCalled();
  });

  it('applies the capture for a valid payment.captured event using the service-role client, not a user session', async () => {
    const res = await POST(makeRequest(capturedEventBody, 'good-signature'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ received: true });
    expect(applyPaymentCaptureMock).toHaveBeenCalledWith(expect.anything(), 'user_1', 'order_1', 'pay_1');
  });

  it('still returns 200 even when applyPaymentCapture throws — Razorpay must not retry-storm a logged failure', async () => {
    applyPaymentCaptureMock.mockRejectedValue(new Error('capture blew up'));

    const res = await POST(makeRequest(capturedEventBody, 'good-signature'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ received: true });
  });
});
