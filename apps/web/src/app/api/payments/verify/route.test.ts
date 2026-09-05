import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from './route';

const { getUserMock, enforceRateLimitMock, verifyCheckoutSignatureMock, applyPaymentCaptureMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  enforceRateLimitMock: vi.fn().mockResolvedValue(null),
  verifyCheckoutSignatureMock: vi.fn(),
  applyPaymentCaptureMock: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: getUserMock } }),
}));
vi.mock('@/lib/rateLimit', () => ({ enforceRateLimit: enforceRateLimitMock }));
vi.mock('@/lib/razorpay', () => ({ verifyCheckoutSignature: verifyCheckoutSignatureMock }));
vi.mock('@/lib/applyPaymentCapture', () => ({ applyPaymentCapture: applyPaymentCaptureMock }));

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/payments/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = {
  razorpay_order_id: 'order_1',
  razorpay_payment_id: 'pay_1',
  razorpay_signature: 'sig_1',
};

describe('POST /api/payments/verify', () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: 'user_1' } } });
    enforceRateLimitMock.mockClear().mockResolvedValue(null);
    verifyCheckoutSignatureMock.mockReset().mockReturnValue(true);
    applyPaymentCaptureMock.mockReset().mockResolvedValue({ applied: true });
  });

  it('returns 401 when there is no authenticated user', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
    expect(applyPaymentCaptureMock).not.toHaveBeenCalled();
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(makeRequest({ razorpay_order_id: 'order_1' }));
    expect(res.status).toBe(400);
    expect(applyPaymentCaptureMock).not.toHaveBeenCalled();
  });

  it("rejects the request when the HMAC signature doesn't verify — the actual security boundary", async () => {
    verifyCheckoutSignatureMock.mockReturnValue(false);

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(400);
    // Never even attempts to capture a payment whose signature is forged/wrong.
    expect(applyPaymentCaptureMock).not.toHaveBeenCalled();
  });

  it('applies the capture and reports success once the signature verifies', async () => {
    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, applied: true });
    expect(applyPaymentCaptureMock).toHaveBeenCalledWith(expect.anything(), 'user_1', 'order_1', 'pay_1');
  });

  it('reports applied:false without erroring when the event was already captured elsewhere (the webhook beat it)', async () => {
    applyPaymentCaptureMock.mockResolvedValue({ applied: false });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true, applied: false });
  });

  it('returns a 500 with a support-pointing message when applyPaymentCapture itself throws', async () => {
    applyPaymentCaptureMock.mockRejectedValue(new Error('DB write failed'));

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/contact support/i);
  });
});
