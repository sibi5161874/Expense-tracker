import { describe, expect, it } from 'vitest';
import { POST } from './route';

/**
 * Deliberately mocks nothing — PAID_TIER_ENABLED is false in the real, current
 * packages/shared/src/config/tierConfig.ts (Razorpay isn't connected yet), so this exercises
 * the route's actual first line of defense with the real config, not a stand-in. If someone
 * flips PAID_TIER_ENABLED to true before Razorpay is actually wired up, this test starts
 * failing loudly instead of the route silently starting to accept real checkout attempts.
 */
describe('POST /api/payments/create-order — payments disabled', () => {
  it('returns 403 before even checking auth, when PAID_TIER_ENABLED is false', async () => {
    const req = new Request('http://localhost/api/payments/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purpose: 'trial_verification' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/disabled/i);
  });
});
