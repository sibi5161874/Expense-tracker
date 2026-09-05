import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from './route';

vi.mock('@repo/shared/config', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@repo/shared/config')>();
  return { ...actual, PAID_TIER_ENABLED: true };
});

const {
  getUserMock,
  rpcSingleMock,
  updateEqMock,
  ordersCreateMock,
  enforceRateLimitMock,
  getUserProfileMock,
  resolveEffectiveTierMock,
  hasUsedTrialMock,
} = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  rpcSingleMock: vi.fn(),
  updateEqMock: vi.fn().mockResolvedValue({ error: null }),
  ordersCreateMock: vi.fn(),
  enforceRateLimitMock: vi.fn().mockResolvedValue(null),
  getUserProfileMock: vi.fn().mockResolvedValue(null),
  resolveEffectiveTierMock: vi.fn().mockReturnValue('free'),
  hasUsedTrialMock: vi.fn().mockReturnValue(false),
}));

// entitlements.ts (which the route imports resolveEffectiveTier/hasUsedTrial from) reads
// PAID_TIER_ENABLED via its own relative import into tierConfig.ts, not the @repo/shared/config
// barrel mocked above — so mocking that barrel alone doesn't reach it. Mocking these two
// functions directly sidesteps that internal-path mismatch rather than fighting it.
vi.mock('@repo/shared/logic', () => ({
  resolveEffectiveTier: resolveEffectiveTierMock,
  hasUsedTrial: hasUsedTrialMock,
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: getUserMock },
    rpc: (_fn: string, _params: unknown) => ({ single: rpcSingleMock }),
    from: (_table: string) => ({
      update: (payload: unknown) => ({ eq: (col: string, val: unknown) => updateEqMock(payload, col, val) }),
    }),
  }),
}));

vi.mock('@/lib/razorpay', () => ({
  getRazorpayClient: () => ({ orders: { create: ordersCreateMock } }),
}));

vi.mock('@/lib/rateLimit', () => ({ enforceRateLimit: enforceRateLimitMock }));
vi.mock('@repo/shared/queries/profile', () => ({ getUserProfile: getUserProfileMock }));

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/payments/create-order', () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: 'user_1' } } });
    rpcSingleMock.mockReset();
    updateEqMock.mockClear().mockResolvedValue({ error: null });
    ordersCreateMock.mockReset();
    enforceRateLimitMock.mockClear().mockResolvedValue(null);
    getUserProfileMock.mockReset().mockResolvedValue(null);
    resolveEffectiveTierMock.mockReset().mockReturnValue('free');
    hasUsedTrialMock.mockReset().mockReturnValue(false);
  });

  it('returns 401 when there is no authenticated user', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    const res = await POST(makeRequest({ purpose: 'trial_verification' }));

    expect(res.status).toBe(401);
  });

  it('returns 400 for a body that fails schema validation', async () => {
    const res = await POST(makeRequest({ purpose: 'not_a_real_purpose' }));
    expect(res.status).toBe(400);
  });

  it("rejects a trial request when the user's trial was already used", async () => {
    hasUsedTrialMock.mockReturnValue(true);

    const res = await POST(makeRequest({ purpose: 'trial_verification' }));

    expect(res.status).toBe(409);
    expect(ordersCreateMock).not.toHaveBeenCalled();
  });

  it('creates a real Razorpay order and persists it when this request wins the reservation', async () => {
    rpcSingleMock.mockResolvedValue({
      data: { id: 'evt_1', reserved_by_me: true, razorpay_order_id: 'pending:abc', amount_paise: 100 },
      error: null,
    });
    ordersCreateMock.mockResolvedValue({ id: 'order_real_123' });

    const res = await POST(makeRequest({ purpose: 'trial_verification' }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.orderId).toBe('order_real_123');
    expect(ordersCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 100, notes: { user_id: 'user_1', purpose: 'trial_verification' } })
    );
    // The reservation row gets the real order id written onto it.
    expect(updateEqMock).toHaveBeenCalledWith({ razorpay_order_id: 'order_real_123' }, 'id', 'evt_1');
  });

  it('reuses an existing real order instead of minting a duplicate when another request already holds the slot', async () => {
    rpcSingleMock.mockResolvedValue({
      data: { id: 'evt_1', reserved_by_me: false, razorpay_order_id: 'order_already_real', amount_paise: 100 },
      error: null,
    });

    const res = await POST(makeRequest({ purpose: 'trial_verification' }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.orderId).toBe('order_already_real');
    // Never calls Razorpay a second time for the same in-flight/completed reservation.
    expect(ordersCreateMock).not.toHaveBeenCalled();
  });

  it('tells the caller to back off when another request is still mid-flight for the same reservation', async () => {
    rpcSingleMock.mockResolvedValue({
      data: { id: 'evt_1', reserved_by_me: false, razorpay_order_id: 'pending:someone-else', amount_paise: 100 },
      error: null,
    });

    const res = await POST(makeRequest({ purpose: 'trial_verification' }));

    expect(res.status).toBe(409);
    expect(ordersCreateMock).not.toHaveBeenCalled();
  });

  it('frees the reservation instead of leaving it stuck when the Razorpay call itself fails', async () => {
    rpcSingleMock.mockResolvedValue({
      data: { id: 'evt_1', reserved_by_me: true, razorpay_order_id: 'pending:abc', amount_paise: 100 },
      error: null,
    });
    ordersCreateMock.mockRejectedValue(new Error('Razorpay is down'));

    const res = await POST(makeRequest({ purpose: 'trial_verification' }));

    expect(res.status).toBe(502);
    expect(updateEqMock).toHaveBeenCalledWith({ status: 'failed' }, 'id', 'evt_1');
  });
});
