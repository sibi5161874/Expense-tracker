import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRazorpayClient } from '@/lib/razorpay';
import { enforceRateLimit } from '@/lib/rateLimit';
import { logError } from '@/lib/logger';
import { PAID_TIER_ENABLED, PRICING } from '@repo/shared/config';
import { resolveEffectiveTier, hasUsedTrial } from '@repo/shared/logic';
import { getUserProfile } from '@repo/shared/queries/profile';

type Purpose = 'trial_verification' | 'lifetime_purchase';

function isPurpose(value: unknown): value is Purpose {
  return value === 'trial_verification' || value === 'lifetime_purchase';
}

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

  const limited = enforceRateLimit(`payments:create-order:${user.id}`, 10, 10 * 60_000);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  if (!isPurpose(body?.purpose)) {
    return NextResponse.json({ error: 'Invalid purpose' }, { status: 400 });
  }
  const purpose: Purpose = body.purpose;

  const profile = await getUserProfile(supabase, user.id);
  const tier = resolveEffectiveTier(profile);

  if (purpose === 'trial_verification' && (hasUsedTrial(profile) || tier !== 'free')) {
    return NextResponse.json({ error: 'Your trial has already been used or you already have Pro access.' }, { status: 409 });
  }
  if (purpose === 'lifetime_purchase' && tier === 'pro') {
    return NextResponse.json({ error: "You're already on Pro." }, { status: 409 });
  }

  // Reuse an already-created, not-yet-paid order for this (user, purpose)
  // instead of minting a duplicate — matches the DB's partial unique index,
  // and means re-clicking "Start Trial" after an abandoned checkout just
  // reopens the same order rather than erroring.
  const { data: pending } = await supabase
    .from('payment_events')
    .select('razorpay_order_id, amount_paise')
    .eq('user_id', user.id)
    .eq('purpose', purpose)
    .eq('status', 'created')
    .maybeSingle();

  if (pending) {
    return NextResponse.json({
      orderId: pending.razorpay_order_id,
      amount: pending.amount_paise,
      currency: PRICING.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  }

  const amount = amountForPurpose(purpose);

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
    logError('payments.create-order.razorpay', e, { userId: user.id, purpose });
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Couldn't start checkout, try again." },
      { status: 502 }
    );
  }

  const { error: insertError } = await supabase.from('payment_events').insert({
    user_id: user.id,
    purpose,
    amount_paise: amount,
    razorpay_order_id: order.id,
    status: 'created',
  });
  if (insertError) {
    logError('payments.create-order.insert', insertError, { userId: user.id, purpose });
    return NextResponse.json({ error: "Couldn't start checkout, try again." }, { status: 500 });
  }

  return NextResponse.json({
    orderId: order.id,
    amount,
    currency: PRICING.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  });
}
