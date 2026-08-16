import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Database } from '@repo/shared/types';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { applyPaymentCapture } from '@/lib/applyPaymentCapture';
import { logError } from '@/lib/logger';

/**
 * Razorpay's server calls this directly — there is no user session, so
 * authentication is the webhook signature (RAZORPAY_WEBHOOK_SECRET), not a
 * cookie. That's also why this needs the service_role client: RLS requires
 * auth.uid(), which doesn't exist in this request at all.
 *
 * This is the reliability backstop for /api/payments/verify: if a user pays
 * and closes the tab before the client-side callback fires, this is the only
 * thing that still applies the tier change. Configure this route's URL as a
 * webhook in the Razorpay dashboard, subscribed to `payment.captured`.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature');

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }
  const admin = createAdminClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const payload = JSON.parse(rawBody);
  if (payload.event !== 'payment.captured') {
    // Other event types (order.paid, refund.processed, etc.) aren't acted on
    // here — acknowledge them so Razorpay doesn't retry, but do nothing.
    return NextResponse.json({ received: true });
  }

  const payment = payload.payload?.payment?.entity;
  const orderId: string | undefined = payment?.order_id;
  const paymentId: string | undefined = payment?.id;
  const userId: string | undefined = payment?.notes?.user_id;

  if (!orderId || !paymentId || !userId) {
    return NextResponse.json({ received: true });
  }

  try {
    await applyPaymentCapture(admin, userId, orderId, paymentId);
  } catch (e) {
    logError('payments.webhook.applyCapture', e, { userId, orderId, paymentId });
    // Still 200 — Razorpay retries on non-2xx, and a capture error here needs
    // manual investigation via the log, not an automatic retry storm.
  }

  return NextResponse.json({ received: true });
}
