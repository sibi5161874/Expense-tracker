import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/shared/types';
import { startTrial, purchaseLifetime } from '@repo/shared/logic';
import { updateUserTier } from '@repo/shared/queries/profile';
import { getRazorpayClient } from '@/lib/razorpay';
import { logWarn } from '@/lib/logger';

/**
 * The one place a verified Razorpay payment turns into an actual tier change.
 * Called from both /api/payments/verify (the client's immediate callback) and
 * /api/payments/webhook (Razorpay's async backstop, in case the browser
 * closed before verify ran) — both paths must produce the same result exactly
 * once, which is why this checks the row's current status before doing
 * anything: a payment already 'captured' or 'refunded' is a no-op, not an error.
 */
export async function applyPaymentCapture(
  supabase: SupabaseClient<Database>,
  userId: string,
  orderId: string,
  paymentId: string
): Promise<{ applied: boolean }> {
  const { data: event, error: fetchError } = await supabase
    .from('payment_events')
    .select('*')
    .eq('user_id', userId)
    .eq('razorpay_order_id', orderId)
    .single();

  if (fetchError || !event) return { applied: false };
  if (event.status === 'captured' || event.status === 'refunded') return { applied: false }; // already processed

  await supabase
    .from('payment_events')
    .update({ status: 'captured', razorpay_payment_id: paymentId })
    .eq('id', event.id);

  if (event.purpose === 'trial_verification') {
    await updateUserTier(supabase, userId, startTrial());

    // The ₹1 charge only exists to confirm a real payment method — refund it
    // immediately rather than waiting for a batch job, so "refunded back" is
    // actually true within seconds, not eventually.
    try {
      const razorpay = getRazorpayClient();
      const refund = await razorpay.payments.refund(paymentId, { amount: event.amount_paise, speed: 'optimum' });
      await supabase
        .from('payment_events')
        .update({ status: 'refunded', razorpay_refund_id: refund.id })
        .eq('id', event.id);
    } catch (refundError) {
      // The trial itself is already active — a refund failure here is a
      // billing-ops problem to chase up, not a reason to fail the request or
      // undo the trial the user is now relying on. Warn, not error: nothing
      // failed from the user's perspective, but ops needs to know to issue the
      // refund manually.
      logWarn('payments.autoRefund', 'Failed to auto-refund trial verification charge', {
        error: refundError instanceof Error ? refundError.message : String(refundError),
      });
    }
  } else {
    await updateUserTier(supabase, userId, purchaseLifetime());
  }

  return { applied: true };
}
