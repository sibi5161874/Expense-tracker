import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRazorpayClient } from '@/lib/razorpay';
import { enforceRateLimit } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { PAID_TIER_ENABLED, PRICING } from '@repo/shared/config';
import { resolveEffectiveTier, hasUsedTrial } from '@repo/shared/logic';
import { getUserProfile } from '@repo/shared/queries/profile';
import { createOrderSchema, type CreateOrderInput } from '@repo/shared/schemas';

type Purpose = CreateOrderInput['purpose'];

/** Amount in paise for a purpose, per tierConfig.ts — never hardcoded here. */
function amountForPurpose(purpose: Purpose): number {
  return purpose === 'trial_verification' ? PRICING.trial.verificationChargePaise : PRICING.lifetime.priceRupees * 100;
}

export async function POST(req: Request) {
  if (!PAID_TIER_ENABLED) {
    return NextResponse.json({ error: 'Payments are currently disabled.' }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const limited = await enforceRateLimit(`payments:create-order:${user.id}`, 10, 10 * 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid purpose' }, { status: 400 });
  }
  const { purpose } = parsed.data;

  const profile = await getUserProfile(supabase, user.id);
  const tier = resolveEffectiveTier(profile);

  if (purpose === 'trial_verification' && (hasUsedTrial(profile) || tier !== 'free')) {
    return NextResponse.json({ error: 'Your trial has already been used or you already have Pro access.' }, { status: 409 });
  }
  if (purpose === 'lifetime_purchase' && tier === 'pro') {
    return NextResponse.json({ error: "You're already on Pro." }, { status: 409 });
  }

  const amount = amountForPurpose(purpose);

  // Atomically reserves the one order-in-flight slot for this (user, purpose) — guarded by
  // the DB's partial unique index — *before* calling Razorpay, not after. Without this, two
  // overlapping requests (a double-click, or a client retry firing while the first attempt
  // is still awaiting Razorpay) could both mint a real Razorpay order and only one would ever
  // get recorded locally. See reserve_payment_order in the payment_order_reservation
  // migration for the mechanics.
  const placeholderOrderId = `pending:${randomUUID()}`;
  const { data: reservation, error: reserveError } = await supabase
    .rpc('reserve_payment_order', {
      p_purpose: purpose,
      p_amount_paise: amount,
      p_placeholder_order_id: placeholderOrderId,
    })
    .single();

  if (reserveError || !reservation) {
    logError('payments.create-order.reserve', reserveError, { userId: user.id, purpose, requestId: getRequestId(req) });
    return NextResponse.json({ error: "Couldn't start checkout, try again." }, { status: 500 });
  }

  if (!reservation.reserved_by_me) {
    // Someone else holds the slot. If it's still a placeholder, that request is mid-flight
    // (calling Razorpay right now) — tell this caller to back off instead of handing back an
    // order id nothing can actually check out with.
    if (reservation.razorpay_order_id.startsWith('pending:')) {
      return NextResponse.json(
        { error: 'A checkout for this is already starting — please wait a moment and try again.' },
        { status: 409 }
      );
    }
    // A real, already-created order for this (user, purpose) — reuse it instead of minting a
    // duplicate, same as re-clicking "Start Trial" after an abandoned checkout.
    return NextResponse.json({
      orderId: reservation.razorpay_order_id,
      amount: reservation.amount_paise,
      currency: PRICING.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  }

  let order;
  try {
    const razorpay = getRazorpayClient();
    order = await razorpay.orders.create({
      amount,
      currency: PRICING.currency,
      receipt: `${purpose}_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: { user_id: user.id, purpose },
    });
  } catch (e) {
    logError('payments.create-order.razorpay', e, { userId: user.id, purpose, requestId: getRequestId(req) });
    // Free the reservation — otherwise this (user, purpose) is permanently stuck behind a
    // 'created' row that never got a real order id, and no retry could ever get past it.
    await supabase.from('payment_events').update({ status: 'failed' }).eq('id', reservation.id);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Couldn't start checkout, try again." },
      { status: 502 }
    );
  }

  const { error: updateError } = await supabase
    .from('payment_events')
    .update({ razorpay_order_id: order.id })
    .eq('id', reservation.id);
  if (updateError) {
    logError('payments.create-order.update', updateError, { userId: user.id, purpose, requestId: getRequestId(req) });
    return NextResponse.json({ error: "Couldn't start checkout, try again." }, { status: 500 });
  }

  return NextResponse.json({
    orderId: order.id,
    amount,
    currency: PRICING.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });
}
