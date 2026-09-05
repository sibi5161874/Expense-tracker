import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/shared/types';
import { applyPaymentCapture } from './applyPaymentCapture';

const { updateUserTier, refund } = vi.hoisted(() => ({
  updateUserTier: vi.fn().mockResolvedValue(undefined),
  refund: vi.fn().mockResolvedValue({ id: 'rfnd_1' }),
}));

vi.mock('@repo/shared/queries/profile', () => ({ updateUserTier }));
vi.mock('@/lib/razorpay', () => ({
  getRazorpayClient: () => ({ payments: { refund } }),
}));

type PaymentEventRow = {
  id: string;
  user_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  purpose: 'trial_verification' | 'lifetime_purchase';
  status: 'created' | 'captured' | 'refunded' | 'failed';
  amount_paise: number;
};

/** Fakes just enough of the Supabase query builder for the two shapes applyPaymentCapture
 * actually issues against `payment_events`: a select().eq().eq().single() fetch, and update().eq()
 * calls whose payloads we capture to assert the exact writes made. */
function createSupabaseMock(eventRow: PaymentEventRow | null) {
  const updateCalls: Record<string, unknown>[] = [];

  const table = {
    select: () => ({
      eq: () => ({
        eq: () => ({
          single: async () =>
            eventRow ? { data: eventRow, error: null } : { data: null, error: new Error('not found') },
        }),
      }),
    }),
    update: (payload: Record<string, unknown>) => {
      updateCalls.push(payload);
      return { eq: async () => ({ data: null, error: null }) };
    },
  };

  const supabase = {
    from: (name: string) => {
      if (name !== 'payment_events') throw new Error(`Unexpected table: ${name}`);
      return table;
    },
  } as unknown as SupabaseClient<Database>;

  return { supabase, updateCalls };
}

const baseEvent: PaymentEventRow = {
  id: 'evt_1',
  user_id: 'user_1',
  razorpay_order_id: 'order_1',
  razorpay_payment_id: null,
  purpose: 'trial_verification',
  status: 'created',
  amount_paise: 100,
};

describe('applyPaymentCapture', () => {
  beforeEach(() => {
    updateUserTier.mockClear();
    refund.mockClear();
  });

  it('is a no-op when no matching payment_events row exists', async () => {
    const { supabase, updateCalls } = createSupabaseMock(null);

    const result = await applyPaymentCapture(supabase, 'user_1', 'order_1', 'pay_1');

    expect(result).toEqual({ applied: false });
    expect(updateCalls).toHaveLength(0);
    expect(updateUserTier).not.toHaveBeenCalled();
  });

  it("is a no-op when the event is already 'captured' — the double-apply guard", async () => {
    const { supabase, updateCalls } = createSupabaseMock({ ...baseEvent, status: 'captured' });

    const result = await applyPaymentCapture(supabase, 'user_1', 'order_1', 'pay_1');

    expect(result).toEqual({ applied: false });
    expect(updateCalls).toHaveLength(0);
    expect(updateUserTier).not.toHaveBeenCalled();
  });

  it("is a no-op when the event is already 'refunded' — same guard, other terminal state", async () => {
    const { supabase, updateCalls } = createSupabaseMock({ ...baseEvent, status: 'refunded' });

    const result = await applyPaymentCapture(supabase, 'user_1', 'order_1', 'pay_1');

    expect(result).toEqual({ applied: false });
    expect(updateCalls).toHaveLength(0);
    expect(updateUserTier).not.toHaveBeenCalled();
  });

  it('starts a trial and auto-refunds the verification charge for trial_verification events', async () => {
    const { supabase, updateCalls } = createSupabaseMock({ ...baseEvent, purpose: 'trial_verification' });

    const result = await applyPaymentCapture(supabase, 'user_1', 'order_1', 'pay_1');

    expect(result).toEqual({ applied: true });
    expect(updateUserTier).toHaveBeenCalledTimes(1);
    expect(updateUserTier).toHaveBeenCalledWith(supabase, 'user_1', expect.objectContaining({ tier: 'trial' }));

    expect(refund).toHaveBeenCalledWith('pay_1', { amount: baseEvent.amount_paise, speed: 'optimum' });

    // First write marks the payment captured; second (after refund succeeds) marks it refunded.
    expect(updateCalls).toEqual([
      { status: 'captured', razorpay_payment_id: 'pay_1' },
      { status: 'refunded', razorpay_refund_id: 'rfnd_1' },
    ]);
  });

  it('grants lifetime Pro for lifetime_purchase events without attempting a refund', async () => {
    const { supabase, updateCalls } = createSupabaseMock({ ...baseEvent, purpose: 'lifetime_purchase' });

    const result = await applyPaymentCapture(supabase, 'user_1', 'order_1', 'pay_1');

    expect(result).toEqual({ applied: true });
    expect(updateUserTier).toHaveBeenCalledWith(supabase, 'user_1', expect.objectContaining({ tier: 'pro' }));
    expect(refund).not.toHaveBeenCalled();

    // Only the "captured" write — no second update, since lifetime purchases don't refund.
    expect(updateCalls).toEqual([{ status: 'captured', razorpay_payment_id: 'pay_1' }]);
  });

  it('keeps the trial active even when the auto-refund call fails', async () => {
    refund.mockRejectedValueOnce(new Error('Razorpay refund API down'));
    const { supabase, updateCalls } = createSupabaseMock({ ...baseEvent, purpose: 'trial_verification' });

    const result = await applyPaymentCapture(supabase, 'user_1', 'order_1', 'pay_1');

    expect(result).toEqual({ applied: true });
    expect(updateUserTier).toHaveBeenCalledWith(supabase, 'user_1', expect.objectContaining({ tier: 'trial' }));
    // Only the "captured" write went through — the refunded write never happens since refund()
    // threw, and that failure must not roll back or fail the request.
    expect(updateCalls).toEqual([{ status: 'captured', razorpay_payment_id: 'pay_1' }]);
  });
});
