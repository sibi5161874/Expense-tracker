import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGroqClient, AI_CHAT_MODEL } from '@/lib/groq';

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';

  if (!apiKey) {
    return NextResponse.json({ error: 'API key is required' }, { status: 400 });
  }

  if (!apiKey.startsWith('gsk_')) {
    return NextResponse.json(
      { error: 'Groq API keys usually start with "gsk_". Please check your key.' },
      { status: 400 }
    );
  }

  const groq = getGroqClient(apiKey);
  if (!groq) {
    return NextResponse.json({ error: 'Failed to initialize Groq client' }, { status: 500 });
  }

  try {
    // Quick test ping with 1 token limit
    const res = await groq.chat.completions.create(
      {
        model: AI_CHAT_MODEL,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
      },
      { signal: AbortSignal.timeout(10_000) }
    );

    return NextResponse.json({
      success: true,
      model: res.model || AI_CHAT_MODEL,
      message: 'Groq API Key verified successfully!',
    });
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Failed to connect to Groq. Please verify your key.';
    const isAuthError =
      errorMsg.toLowerCase().includes('api key') ||
      errorMsg.toLowerCase().includes('unauthorized') ||
      errorMsg.toLowerCase().includes('invalid_api_key');

    return NextResponse.json(
      {
        success: false,
        error: isAuthError
          ? 'Invalid API key. Please check that you copied the complete key from console.groq.com'
          : errorMsg,
      },
      { status: 400 }
    );
  }
}
