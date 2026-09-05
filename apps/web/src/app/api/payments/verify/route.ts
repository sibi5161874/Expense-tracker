import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyCheckoutSignature } from '@/lib/razorpay';
import { applyPaymentCapture } from '@/lib/applyPaymentCapture';
import { enforceRateLimit } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { verifyPaymentSchema } from '@repo/shared/schemas';

/**
 * The client's immediate callback after Razorpay Checkout succeeds. This is
 * the fast path for UX (tier updates the moment the modal closes); the
 * webhook route is the reliability backstop if the browser closes before this
 * ever fires. Both funnel through the same applyPaymentCapture so neither
 * path can double-apply a payment.
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const limited = await enforceRateLimit(`payments:verify:${user.id}`, 20, 10 * 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = verifyPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing payment confirmation fields' }, { status: 400 });
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

  if (!verifyCheckoutSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return NextResponse.json({ error: 'Payment could not be verified.' }, { status: 400 });
  }

  try {
    const { applied } = await applyPaymentCapture(supabase, user.id, razorpay_order_id, razorpay_payment_id);
    return NextResponse.json({ success: true, applied });
  } catch (e) {
    logError('payments.verify.applyCapture', e, {
      userId: user.id,
      razorpay_order_id,
      razorpay_payment_id,
      requestId: getRequestId(req),
    });
    return NextResponse.json({ error: 'Payment verification failed, please contact support.' }, { status: 500 });
  }
}
