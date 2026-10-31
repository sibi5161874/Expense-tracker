import { describe, expect, it, vi, beforeEach } from 'vitest';
import { POST } from './route';

const {
  getUserMock,
  enforceRateLimitMock,
  getGroqClientMock,
  createCompletionMock,
  getUserProfileMock,
  resolveEffectiveTierMock,
  isUnlimitedTierMock,
  computeUserNetWorthMock,
} = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  enforceRateLimitMock: vi.fn().mockResolvedValue(null),
  getGroqClientMock: vi.fn(),
  createCompletionMock: vi.fn(),
  getUserProfileMock: vi.fn(),
  resolveEffectiveTierMock: vi.fn().mockReturnValue('free'),
  isUnlimitedTierMock: vi.fn().mockReturnValue(false),
  computeUserNetWorthMock: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: getUserMock } }),
}));
vi.mock('@/lib/rateLimit', () => ({ enforceRateLimit: enforceRateLimitMock }));
vi.mock('@/lib/groq', () => ({
  getGroqClient: getGroqClientMock,
  AI_CHAT_MODEL: 'openai/gpt-oss-120b',
  AI_CHAT_TIMEOUT_MS: 25_000,
}));
vi.mock('@/lib/computeUserNetWorth', () => ({ computeUserNetWorth: computeUserNetWorthMock }));
vi.mock('@/lib/kvStore', () => ({ kvGet: vi.fn().mockResolvedValue(null) }));
vi.mock('@repo/shared/queries/profile', () => ({ getUserProfile: getUserProfileMock }));
vi.mock('@repo/shared/queries/transactions', () => ({
  getAllTransactionsForReports: vi.fn().mockResolvedValue([]),
  getMonthlyCategoryBreakdown: vi.fn().mockResolvedValue([]),
}));
vi.mock('@repo/shared/queries/investmentLog', () => ({ getAllInvestmentLog: vi.fn().mockResolvedValue([]) }));
vi.mock('@repo/shared/queries/holdings', () => ({ getHoldings: vi.fn().mockResolvedValue([]) }));
vi.mock('@repo/shared/queries/budgetLimits', () => ({ getBudgetLimits: vi.fn().mockResolvedValue([]) }));
vi.mock('@repo/shared/queries/goals', () => ({ getGoals: vi.fn().mockResolvedValue([]) }));
vi.mock('@repo/shared/queries/recurringTransactions', () => ({ getRecurringTransactions: vi.fn().mockResolvedValue([]) }));
vi.mock('@repo/shared/queries/insurance', () => ({ getInsurancePolicies: vi.fn().mockResolvedValue([]) }));
vi.mock('@repo/shared/logic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@repo/shared/logic')>();
  return {
    ...actual,
    resolveEffectiveTier: resolveEffectiveTierMock,
    isUnlimitedTier: isUnlimitedTierMock,
  };
});

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

type Delta = { content?: string; tool_calls?: Array<{ index: number; id?: string; function?: { name?: string; arguments?: string } }> };

/** A fake Groq streamed response: an async-iterable of chunks, one per delta given. */
function fakeStream(deltas: Delta[]) {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const delta of deltas) {
        yield { choices: [{ delta }] };
      }
    },
  };
}

/** Reads every SSE `data: {...}` event out of the route's streamed Response body. */
async function readEvents(res: Response): Promise<Array<Record<string, unknown>>> {
  const text = await res.text();
  return text
    .split('\n\n')
    .filter((chunk) => chunk.startsWith('data: '))
    .map((chunk) => JSON.parse(chunk.slice('data: '.length)));
}

const validBody = { messages: [{ role: 'user', content: 'What is my net worth?' }] };

describe('POST /api/ai-chat', () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: 'user_1' } } });
    enforceRateLimitMock.mockClear().mockResolvedValue(null);
    getGroqClientMock.mockReset().mockReturnValue({
      chat: {
        completions: {
          create: createCompletionMock,
        },
      },
    });
    createCompletionMock.mockReset();
    getUserProfileMock.mockReset().mockResolvedValue(null);
    resolveEffectiveTierMock.mockClear().mockReturnValue('free');
    isUnlimitedTierMock.mockClear().mockReturnValue(false);
    computeUserNetWorthMock.mockReset().mockResolvedValue({ netWorth: 100000, unconvertedCurrencies: [] });
  });

  it('returns 401 when there is no authenticated user', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(401);
  });

  it('returns 503 when Groq is not configured', async () => {
    getGroqClientMock.mockReturnValue(null);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(503);
  });

  it('returns 400 on an invalid body', async () => {
    const res = await POST(makeRequest({ messages: [] }));
    expect(res.status).toBe(400);
    expect(createCompletionMock).not.toHaveBeenCalled();
  });

  it('enforces the rate limit for a free-tier user', async () => {
    const limitedResponse = new Response(null, { status: 429 });
    enforceRateLimitMock.mockResolvedValue(limitedResponse);
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(429);
    expect(createCompletionMock).not.toHaveBeenCalled();
  });

  it('skips the rate limit entirely for a Pro/trial user', async () => {
    isUnlimitedTierMock.mockReturnValue(true);
    createCompletionMock.mockResolvedValue(fakeStream([{ content: 'You have no transactions yet.' }]));
    await POST(makeRequest(validBody));
    expect(enforceRateLimitMock).not.toHaveBeenCalled();
  });

  it('streams the final reply token by token when Groq answers without needing a tool', async () => {
    createCompletionMock.mockResolvedValue(
      fakeStream([{ content: 'Your net worth ' }, { content: 'is looking good.' }])
    );
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/event-stream');

    const events = await readEvents(res);
    // No tool use means no separate "thinking" phase to report — content streams immediately.
    expect(events.some((e) => e.type === 'step')).toBe(false);
    expect(events[0]).toEqual({ type: 'start' });
    expect(events.filter((e) => e.type === 'token').map((e) => e.text).join('')).toBe(
      'Your net worth is looking good.'
    );
    expect(events.at(-1)).toEqual({ type: 'done' });
  });

  it('runs the requested tool and feeds the result back before streaming the answer, with a step event per tool', async () => {
    createCompletionMock
      .mockResolvedValueOnce(
        fakeStream([
          {
            tool_calls: [
              { index: 0, id: 'call_1', function: { name: 'get_net_worth_summary', arguments: '' } },
            ],
          },
          { tool_calls: [{ index: 0, function: { arguments: '{}' } }] },
        ])
      )
      .mockResolvedValueOnce(fakeStream([{ content: 'Your net worth is ₹1,00,000.' }]));

    const res = await POST(makeRequest(validBody));
    const events = await readEvents(res);

    expect(computeUserNetWorthMock).toHaveBeenCalledWith(expect.anything(), 'user_1', {});
    expect(createCompletionMock).toHaveBeenCalledTimes(2);
    const stepLabels = events.filter((e) => e.type === 'step').map((e) => e.label);
    expect(stepLabels).toEqual([expect.stringMatching(/^Thought for \d+s$/), 'Checked your net worth']);
    expect(events.filter((e) => e.type === 'token').map((e) => e.text).join('')).toBe(
      'Your net worth is ₹1,00,000.'
    );

    // The second call must include the tool response feeding the first call's result back in.
    const secondCallArgs = createCompletionMock.mock.calls[1]![0];
    const toolResultContent = secondCallArgs.messages.at(-1);
    expect(toolResultContent.role).toBe('tool');
    expect(toolResultContent.tool_call_id).toBe('call_1');
    expect(JSON.parse(toolResultContent.content)).toEqual({ netWorth: 100000, unconvertedCurrencies: [] });
  });

  it('emits an error event (still HTTP 200, since streaming already started) when the Groq call throws', async () => {
    createCompletionMock.mockRejectedValue(new Error('upstream down'));
    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    const events = await readEvents(res);
    expect(events).toEqual([{ type: 'error', message: "Couldn't reach the AI assistant, please try again." }]);
  });

  it('emits a timeout-specific error event when the Groq call times out', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    createCompletionMock.mockRejectedValue(abortError);
    const res = await POST(makeRequest(validBody));
    const events = await readEvents(res);
    expect(events).toEqual([{ type: 'error', message: "The assistant didn't respond in time — please try again." }]);
  });
});
