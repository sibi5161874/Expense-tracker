import { NextResponse } from 'next/server';
import { resolveRequestUser } from '@/lib/supabase/bearer';
import { enforceRateLimit } from '@/lib/rateLimit';
import { getResendClient, getResendFromAddress } from '@/lib/resend';
import { FEEDBACK_RECIPIENT_EMAIL } from '@/lib/constants';
import { logError } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { feedbackSchema } from '@repo/shared/schemas';

const MAX_FEEDBACK_SCREENSHOT_BYTES = 5 * 1024 * 1024; // 5MB

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function POST(req: Request) {
  const { user } = await resolveRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const limited = await enforceRateLimit(`feedback:${user.id}`, 5, 60 * 60_000);
  if (limited) return limited;

  const parsed = feedbackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid feedback submission' }, { status: 400 });
  }
  const { name, email, message, screenshot } = parsed.data;

  let screenshotBuffer: Buffer | null = null;
  if (screenshot) {
    const commaIndex = screenshot.dataUrl.indexOf(',');
    if (commaIndex === -1) {
      return NextResponse.json({ error: 'Invalid feedback submission' }, { status: 400 });
    }
    screenshotBuffer = Buffer.from(screenshot.dataUrl.slice(commaIndex + 1), 'base64');
    if (screenshotBuffer.byteLength > MAX_FEEDBACK_SCREENSHOT_BYTES) {
      return NextResponse.json({ error: 'Screenshot is too large — max 5MB.' }, { status: 413 });
    }
  }

  try {
    const resend = getResendClient();
    if (resend) {
      const { error: sendError } = await resend.emails.send({
        from: getResendFromAddress(),
        to: FEEDBACK_RECIPIENT_EMAIL,
        replyTo: email,
        subject: `Feedback from ${name}`,
        html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Message:</strong></p><p>${escapeHtml(message).replaceAll('\n', '<br/>')}</p>`,
        attachments:
          screenshot && screenshotBuffer
            ? [{ filename: screenshot.filename, content: screenshotBuffer }]
            : undefined,
      });
      if (sendError) throw new Error(sendError.message);
    } else {
      // Same "runs, logs, sends nothing" degradation as the cron route — the user's feedback
      // isn't lost, it just won't reach an inbox until RESEND_API_KEY is configured.
      logError('feedback.email-skipped', new Error('RESEND_API_KEY not configured'), {
        userId: user.id,
        requestId: getRequestId(req),
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    logError('feedback.send', e, { userId: user.id, requestId: getRequestId(req) });
    return NextResponse.json({ error: 'Could not send feedback, please try again.' }, { status: 500 });
  }
}
