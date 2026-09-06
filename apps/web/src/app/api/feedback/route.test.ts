import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from './route';

const { getUserMock, enforceRateLimitMock, getResendClientMock, getResendFromAddressMock, sendMock, logErrorMock } =
  vi.hoisted(() => ({
    getUserMock: vi.fn(),
    enforceRateLimitMock: vi.fn().mockResolvedValue(null),
    getResendClientMock: vi.fn(),
    getResendFromAddressMock: vi.fn().mockReturnValue('onboarding@resend.dev'),
    sendMock: vi.fn(),
    logErrorMock: vi.fn(),
  }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: getUserMock } }),
}));
vi.mock('@/lib/rateLimit', () => ({ enforceRateLimit: enforceRateLimitMock }));
vi.mock('@/lib/resend', () => ({
  getResendClient: getResendClientMock,
  getResendFromAddress: getResendFromAddressMock,
}));
vi.mock('@/lib/logger', () => ({ logError: logErrorMock }));

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validBody = { name: 'Sibi', email: 'sibi@example.com', message: 'Great app!' };

describe('POST /api/feedback', () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: 'user_1' } } });
    enforceRateLimitMock.mockClear().mockResolvedValue(null);
    sendMock.mockReset().mockResolvedValue({ data: { id: 'email_1' }, error: null });
    getResendClientMock.mockReset().mockReturnValue({ emails: { send: sendMock } });
    logErrorMock.mockClear();
  });

  it('returns 401 when there is no authenticated user', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
  });

  it('returns the rate limiter response when rate-limited', async () => {
    const limitedResponse = new Response(null, { status: 429 });
    enforceRateLimitMock.mockResolvedValue(limitedResponse);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(429);
  });

  it('returns 400 on an invalid body', async () => {
    const res = await POST(makeRequest({ name: '', email: 'bad', message: '' }));
    expect(res.status).toBe(400);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('returns 413 when the screenshot exceeds 5MB', async () => {
    const hugeBase64 = Buffer.alloc(6 * 1024 * 1024).toString('base64');
    const res = await POST(
      makeRequest({
        ...validBody,
        screenshot: { dataUrl: `data:image/png;base64,${hugeBase64}`, filename: 'big.png', contentType: 'image/png' },
      })
    );
    expect(res.status).toBe(413);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('sends the email with an attachment when a screenshot is included', async () => {
    const res = await POST(
      makeRequest({
        ...validBody,
        screenshot: { dataUrl: 'data:image/png;base64,aGVsbG8=', filename: 'bug.png', contentType: 'image/png' },
      })
    );
    expect(res.status).toBe(200);
    expect(sendMock).toHaveBeenCalledTimes(1);
    const call = sendMock.mock.calls[0]![0];
    expect(call.to).toBe('sibi24sibi@gmail.com');
    expect(call.replyTo).toBe('sibi@example.com');
    expect(call.attachments).toEqual([{ filename: 'bug.png', content: Buffer.from('aGVsbG8=', 'base64') }]);
  });

  it('sends the email with no attachments key when no screenshot is included', async () => {
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const call = sendMock.mock.calls[0]![0];
    expect(call.attachments).toBeUndefined();
  });

  it('degrades gracefully and still returns 200 when Resend is not configured', async () => {
    getResendClientMock.mockReturnValue(null);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    expect(logErrorMock).toHaveBeenCalledWith('feedback.email-skipped', expect.any(Error), expect.anything());
  });

  it('returns 500 and logs when Resend errors', async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: 'send failed' } });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
    expect(logErrorMock).toHaveBeenCalledWith('feedback.send', expect.any(Error), expect.anything());
  });
});
