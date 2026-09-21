'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AiMarkdown } from './AiMarkdown';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = ['What is my net worth?', 'How much did I spend this month?', 'How are my investments doing?'];

/**
 * Floating "ask about your money" widget, mounted once in AppShell so it's available on every
 * authenticated page. Talks to /api/ai-chat, which answers strictly from the user's own
 * transactions/portfolio/budgets/goals/net-worth — never a general-purpose chatbot.
 */
export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setError(null);
    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      // The server's own tool-calling loop has its own ~25s per-call ceiling (see
      // AI_CHAT_TIMEOUT_MS in lib/groq.ts) — this client-side timeout is a bit longer so the
      // server's own clearer "didn't respond in time" message wins in the normal case, and
      // this one only fires as a backstop if the request never reaches the server at all
      // (e.g. the network itself is down) rather than leaving the widget spinning forever.
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
        signal: AbortSignal.timeout(35_000),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Something went wrong.');
      setMessages((prev) => [...prev, { role: 'assistant', content: body.reply }]);
    } catch (e) {
      const timedOut = e instanceof Error && e.name === 'TimeoutError';
      setError(timedOut ? "The assistant isn't responding — please try again." : e instanceof Error ? e.message : 'Something went wrong.');
      // Roll back the optimistically-added user message so retrying doesn't duplicate it.
      setMessages((prev) => prev.slice(0, -1));
      setInput(trimmed);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      {open && (
        <div className="bg-card border-border/60 fixed bottom-40 right-4 z-50 flex h-[30rem] sm:h-[34rem] w-[calc(100vw-2rem)] max-w-[24rem] sm:max-w-[28rem] flex-col overflow-hidden rounded-2xl border shadow-2xl sm:bottom-24 sm:right-6">
          <div className="border-border/60 flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary size-4" />
              <span className="text-sm font-semibold">Ask about your money</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm">
                  Ask me about your transactions, portfolio, budgets, or net worth.
                </p>
                <div className="flex flex-col gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendMessage(s)}
                      className="bg-muted hover:bg-muted/70 rounded-xl px-3 py-2 text-left text-xs transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                {m.role === 'user' ? (
                  <div className="max-w-[85%] rounded-2xl px-3.5 py-2 text-sm bg-primary text-primary-foreground whitespace-pre-wrap shadow-xs">
                    {m.content}
                  </div>
                ) : (
                  <div className="max-w-[92%] sm:max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm bg-muted text-foreground overflow-hidden shadow-xs">
                    <AiMarkdown content={m.content} />
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground flex items-center gap-2 rounded-2xl px-3 py-2 text-sm">
                  <Loader2 className="size-3.5 animate-spin" />
                  Thinking...
                </div>
              </div>
            )}

            {error && <p className="text-destructive text-xs">{error}</p>}
          </div>

          <form onSubmit={handleSubmit} className="border-border/60 flex items-center gap-2 border-t p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={isSending}
              className="border-input bg-background h-9 flex-1 rounded-xl border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <Button type="submit" size="icon-sm" disabled={isSending || !input.trim()} aria-label="Send">
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close AI chat' : 'Open AI chat'}
        className="bg-primary text-primary-foreground fixed bottom-20 right-4 z-50 flex size-14 items-center justify-center rounded-full shadow-lg transition-transform hover:brightness-95 active:scale-95 sm:bottom-6 sm:right-6"
      >
        {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </>
  );
}
