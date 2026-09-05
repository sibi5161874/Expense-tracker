import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import type { Database } from '@repo/shared/types';
import { resolveEffectiveTier, isUnlimitedTier, type ProfileTierFields, type FxRates } from '@repo/shared/logic';
import { formatMonth } from '@repo/shared/utils';
import { FX_RATES_URL } from '@repo/shared/config';
import { computeUserNetWorth } from '@/lib/computeUserNetWorth';
import { generateMonthlySummaryPdf } from '@/lib/generateMonthlySummaryPdf';
import { getResendClient, getResendFromAddress } from '@/lib/resend';
import { logError } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

const SIGNED_URL_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days
const STORAGE_BUCKET = 'monthly-summaries';

/** The report covers the month that just finished, not the one this cron invocation is running in — it fires on the 1st, when that month has zero data of its own yet. */
function previousMonth(now: Date): string {
  return formatMonth(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)));
}

async function fetchFxRates(requestId: string | undefined): Promise<FxRates> {
  try {
    const res = await fetch(FX_RATES_URL, { cache: 'no-store' });
    const body = await res.json();
    if (body.result === 'success' && body.rates && typeof body.rates === 'object') {
      return body.rates as FxRates;
    }
  } catch (e) {
    logError('cron.monthly-summary.fx', e, { requestId });
  }
  // Empty rates degrade to "only INR accounts convert" (see convertToBaseCurrency) — not a
  // reason to fail every user's summary over one flaky external call.
  return {};
}

/**
 * Vercel Cron target (see vercel.json), scheduled for 00:00 UTC on the 1st of every month.
 * Loops every Pro/trial user, skips anyone already logged for this month (re-running the
 * cron manually, or a retry after a partial failure, must not double-send), computes their
 * net worth, generates a PDF (server-side jsPDF + autoTable — see generateMonthlySummaryPdf's
 * own comment for why not html2canvas), uploads it to a private Storage bucket, and emails a
 * signed link.
 *
 * One user's failure is logged and does not abort the run for everyone else — this loops
 * sequentially and can take a while as the user base grows; at real scale this wants to move
 * to a queue rather than one long-lived function invocation, not solved here.
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }
  const admin = createAdminClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const requestId = getRequestId(req);
  const month = previousMonth(new Date());
  const fxRates = await fetchFxRates(requestId);
  const resend = getResendClient();

  const { data: profiles, error: profilesError } = await admin.from('user_profiles').select('*');
  if (profilesError) {
    logError('cron.monthly-summary.profiles', profilesError, { requestId });
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }

  const proProfiles = (profiles ?? []).filter((p) =>
    isUnlimitedTier(resolveEffectiveTier(p as ProfileTierFields))
  );

  const results = { sent: 0, skipped: 0, failed: 0 };

  for (const profile of proProfiles) {
    const userId = profile.user_id;
    try {
      const { data: existingLog } = await admin
        .from('monthly_email_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('month', month)
        .maybeSingle();
      if (existingLog) {
        results.skipped++;
        continue;
      }

      const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId);
      const email = userData?.user?.email;
      if (userError || !email) {
        results.skipped++;
        continue;
      }

      const breakdown = await computeUserNetWorth(admin, userId, fxRates);
      const pdfBuffer = generateMonthlySummaryPdf(email, month, breakdown);

      const storagePath = `${userId}/${month}.pdf`;
      const { error: uploadError } = await admin.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });
      if (uploadError) throw uploadError;

      const { data: signedUrlData, error: signedUrlError } = await admin.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(storagePath, SIGNED_URL_EXPIRY_SECONDS);
      if (signedUrlError || !signedUrlData) throw signedUrlError ?? new Error('No signed URL returned');

      if (resend) {
        const { error: sendError } = await resend.emails.send({
          from: getResendFromAddress(),
          to: email,
          subject: 'Your Monthly Financial Summary is ready',
          html: `<p>Your net worth summary for ${month} is ready.</p><p><a href="${signedUrlData.signedUrl}">View your summary (PDF)</a> — link valid for 30 days.</p>`,
          attachments: [{ filename: `summary-${month}.pdf`, content: pdfBuffer }],
        });
        if (sendError) throw new Error(sendError.message);
      } else {
        // No RESEND_API_KEY configured yet — same "runs, logs, sends nothing" degradation as
        // the rest of this route's env-gated pieces. Still logs the send so the cron doesn't
        // re-process this user every day until email is wired up.
        logError('cron.monthly-summary.email-skipped', new Error('RESEND_API_KEY not configured'), {
          userId,
          requestId,
        });
      }

      await admin.from('monthly_email_logs').insert({ user_id: userId, month });
      results.sent++;
    } catch (e) {
      logError('cron.monthly-summary.user', e, { userId, requestId });
      results.failed++;
    }
  }

  return NextResponse.json({ month, totalProUsers: proProfiles.length, ...results });
}
