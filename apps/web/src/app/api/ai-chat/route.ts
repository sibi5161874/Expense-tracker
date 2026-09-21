import { NextResponse } from 'next/server';
import type { ChatCompletionMessageParam, ChatCompletionTool } from 'groq-sdk/resources/chat/completions';
import { createClient } from '@/lib/supabase/server';
import { getGroqClient, AI_CHAT_MODEL, AI_CHAT_TIMEOUT_MS } from '@/lib/groq';
import { enforceRateLimit } from '@/lib/rateLimit';
import { kvGet } from '@/lib/kvStore';
import { logError } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { computeUserNetWorth } from '@/lib/computeUserNetWorth';
import { aiChatSchema } from '@repo/shared/schemas';
import { resolveEffectiveTier, isUnlimitedTier, groupInvestmentsBySymbol, type FxRates } from '@repo/shared/logic';
import { getUserProfile } from '@repo/shared/queries/profile';
import { getAllTransactionsForReports, getMonthlyCategoryBreakdown } from '@repo/shared/queries/transactions';
import { getAllInvestmentLog } from '@repo/shared/queries/investmentLog';
import { getHoldings } from '@repo/shared/queries/holdings';
import { getBudgetLimits } from '@repo/shared/queries/budgetLimits';
import { getGoals } from '@repo/shared/queries/goals';
import { getRecurringTransactions } from '@repo/shared/queries/recurringTransactions';
import { getInsurancePolicies } from '@repo/shared/queries/insurance';
import { formatMonth } from '@repo/shared/utils';
import { FREE_TIER_LIMITS } from '@repo/shared/config';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@repo/shared/types';

const FX_CACHE_KEY = 'fx:rates';
const MAX_TOOL_ROUNDS = 4;

const SYSTEM_PROMPT = `You are KashMap's in-app financial assistant. You answer questions about the CURRENT user's own transactions, investments, budgets, goals, recurring bills, insurance policies, and net worth — nothing else.

Rules:
- Use the provided tools to fetch real data before answering. Never invent numbers.
- All amounts are in INR (₹) unless a tool result says otherwise.
- Keep answers short, clear, and conversational — 2-4 sentences unless the user asks for a detailed breakdown or analysis.
- If asked for something outside your scope (predicting markets, "should I buy X", tax/legal advice), say plainly that you can only analyze their existing data, not give financial advice.
- If a tool returns no data for what's asked, say so directly instead of guessing.`;

const TOOLS: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_net_worth_summary',
      description:
        "Get the user's total net worth broken down by category: cash & bank, fixed deposits, gold, EPF, NPS, SSY, SGB, ULIP, real estate, PPF, recurring deposits, NSC, vehicles, stock/mutual fund portfolio, and liabilities.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recent_transactions',
      description: "Get the user's recent income, expense, and transfer transactions, most recent first.",
      parameters: {
        type: 'object',
        properties: {
          days: { type: 'number', description: 'How many days back to look. Default 30, max 180.' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_portfolio_holdings',
      description:
        "Get the user's current stock/mutual fund holdings — symbol, quantity held, average buy price, current value, and unrealized profit/loss per holding.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_budget_status',
      description:
        "Get the user's monthly budget limit per category alongside how much they've actually spent this month in that category.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_goals',
      description: "Get the user's savings goals — name, target amount, amount saved so far, target date, and priority.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_recurring_bills_and_sips',
      description:
        "Get the user's scheduled recurring transactions, recurring bills, subscriptions, SIP investments, and EMIs.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_insurance_policies',
      description:
        "Get the user's active insurance policies — insurer, policy type, policy number, coverage amount, premium amount, premium due date, and nominee.",
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
];

async function resolveFxRates(): Promise<FxRates> {
  const cached = await kvGet<{ rates: FxRates }>(FX_CACHE_KEY);
  return cached?.rates ?? {};
}

/** Every branch reads through the request's own cookie-scoped Supabase client — RLS applies
 * exactly as it does everywhere else in the app, so the model can only ever see tool results
 * for rows the signed-in user already owns. Nothing here uses a service-role client. */
async function runTool(
  name: string,
  args: Record<string, unknown>,
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<unknown> {
  switch (name) {
    case 'get_net_worth_summary': {
      const fxRates = await resolveFxRates();
      const { unconvertedCurrencies, ...breakdown } = await computeUserNetWorth(supabase, userId, fxRates);
      return { ...breakdown, unconvertedCurrencies };
    }
    case 'get_recent_transactions': {
      const days = Math.min(Math.max(Number(args.days) || 30, 1), 180);
      const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const transactions = await getAllTransactionsForReports(supabase, userId, { from });
      return (transactions ?? [])
        .slice(-50)
        .reverse()
        .map((t) => ({
          date: t.date,
          type: t.type,
          amount: t.amount,
          category: t.category?.name ?? null,
          from_account: t.from_account?.name ?? null,
          to_account: t.to_account?.name ?? null,
        }));
    }
    case 'get_portfolio_holdings': {
      const [investments, holdingRows] = await Promise.all([
        getAllInvestmentLog(supabase, userId),
        getHoldings(supabase, userId),
      ]);
      const livePriceOverrides = Object.fromEntries((holdingRows ?? []).map((h) => [h.symbol, h.live_price]));
      const holdings = groupInvestmentsBySymbol(investments ?? [], livePriceOverrides);
      return holdings.map((h) => ({
        symbol: h.symbol,
        exchange: h.exchange,
        unitsHeld: h.unitsHeld,
        avgBuyPrice: h.avgBuyPrice,
        currentPrice: h.currentPrice,
        currentValue: h.unitsHeld * h.currentPrice,
        unrealisedPnl: h.unrealisedPnl,
      }));
    }
    case 'get_budget_status': {
      const currentMonth = formatMonth(new Date());
      const [limits, actuals] = await Promise.all([
        getBudgetLimits(supabase, userId),
        getMonthlyCategoryBreakdown(supabase, userId, currentMonth),
      ]);
      const actualByCategoryName = new Map((actuals ?? []).map((a) => [a.category_name, a.amount]));
      return (limits ?? []).map((l) => ({
        category: l.category?.name ?? 'Unknown',
        monthlyLimit: l.monthly_limit,
        spentThisMonth: actualByCategoryName.get(l.category?.name ?? '') ?? 0,
      }));
    }
    case 'get_goals': {
      const goals = await getGoals(supabase, userId);
      return (goals ?? []).map((g) => ({
        name: g.goal_name,
        targetAmount: g.target_amount,
        savedAmount: g.saved_amount,
        targetDate: g.target_date,
        priority: g.priority,
      }));
    }
    case 'get_recurring_bills_and_sips': {
      const recurring = await getRecurringTransactions(supabase, userId);
      return (recurring ?? []).map((r) => ({
        notes: r.notes,
        amount: r.amount,
        type: r.type,
        frequency: r.frequency,
        category: r.category?.name ?? null,
        from_account: r.from_account?.name ?? null,
        to_account: r.to_account?.name ?? null,
        next_run_date: r.next_run_date,
        is_active: r.is_active,
      }));
    }
    case 'get_insurance_policies': {
      const policies = await getInsurancePolicies(supabase, userId);
      return (policies ?? []).map((p) => ({
        insurer: p.insurer,
        policy_type: p.policy_type,
        policy_number: p.policy_number,
        coverage_amount: p.coverage_amount,
        premium_amount: p.premium_amount,
        premium_due_date: p.premium_due_date,
        nominee: p.nominee,
      }));
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const groq = getGroqClient();
  if (!groq) {
    return NextResponse.json({ error: 'The AI assistant is not configured yet.' }, { status: 503 });
  }

  // Trial/Pro get unlimited questions; Free is capped per calendar month — cheap enough per
  // query that this stays a usage cap, not a paywall.
  const profile = await getUserProfile(supabase, user.id);
  const tier = resolveEffectiveTier(profile);
  if (!isUnlimitedTier(tier)) {
    const limited = await enforceRateLimit(
      `ai-chat:${user.id}`,
      FREE_TIER_LIMITS.maxAiChatQueriesPerMonth,
      30 * 24 * 60 * 60_000
    );
    if (limited) return limited;
  }

  const parsed = aiChatSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid chat request' }, { status: 400 });
  }

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...parsed.data.messages.map((m): ChatCompletionMessageParam => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await groq.chat.completions.create(
        {
          model: AI_CHAT_MODEL,
          messages,
          tools: TOOLS,
          tool_choice: 'auto',
          temperature: 0.2,
        },
        {
          signal: AbortSignal.timeout(AI_CHAT_TIMEOUT_MS),
        }
      );

      const choice = response.choices?.[0];
      const message = choice?.message;
      if (!message) {
        return NextResponse.json({ reply: "I couldn't come up with an answer for that — try rephrasing?" });
      }

      const toolCalls = message.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        const text = message.content?.trim();
        return NextResponse.json({ reply: text || "I couldn't come up with an answer for that — try rephrasing?" });
      }

      // Add the assistant's response with tool calls to conversation history
      messages.push(message);

      // Execute all tool calls
      for (const tc of toolCalls) {
        const fnName = tc.function.name;
        let fnArgs: Record<string, unknown> = {};
        try {
          fnArgs = JSON.parse(tc.function.arguments || '{}');
        } catch {
          fnArgs = {};
        }

        let toolResult: unknown;
        try {
          toolResult = await runTool(fnName, fnArgs, supabase, user.id);
        } catch (e) {
          logError('ai-chat.tool', e, { userId: user.id, tool: fnName, requestId: getRequestId(req) });
          toolResult = { error: 'Failed to fetch that data.' };
        }

        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(toolResult),
        });
      }
    }

    return NextResponse.json({
      reply: "That question needed more digging than I can do right now — try breaking it into smaller questions?",
    });
  } catch (e) {
    const isTimeout = e instanceof Error && (e.name === 'AbortError' || e.name === 'TimeoutError');
    logError('ai-chat.send', e, { userId: user.id, requestId: getRequestId(req) });
    return NextResponse.json(
      {
        error: isTimeout
          ? "The assistant didn't respond in time — please try again."
          : "Couldn't reach the AI assistant, please try again.",
      },
      { status: isTimeout ? 504 : 502 }
    );
  }
}
