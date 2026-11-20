'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useOrblingMood } from '@/hooks/useOrblingMood';
import { getStoredGroqKey } from '@/lib/groqStorage';
import { OrblingFloatingOrb } from './OrblingFloatingOrb';
import { OrblingChatPanel, type ChatMessage } from './OrblingChatPanel';

function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** One parsed `data: {...}` event from the /api/ai-chat SSE stream. */
type ChatStreamEvent =
  | { type: 'start' }
  | { type: 'token'; text: string }
  | { type: 'step'; label: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

async function* readChatStream(body: ReadableStream<Uint8Array>): AsyncGenerator<ChatStreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });

    let sepIndex: number;
    while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
      const chunk = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);
      if (chunk.startsWith('data: ')) {
        yield JSON.parse(chunk.slice('data: '.length)) as ChatStreamEvent;
      }
    }
  }
}

/**
 * Floating AI Financial Assistant, fronted by the orbling orb (github.com/kochjar/orbling):
 * rests "idle" by default, wakes to "watching" (cursor-tracking) for 90s on hover, "surprised"
 * on tap, back to "idle" until the user types, "thinking" -> "reading" -> "working" through a
 * real streamed Groq response, "error" on failure, and "sleepy" after a minute of inactivity.
 * See useOrblingMood for the state machine.
 * The orb stays visible even while the panel is open; each reply also carries a step trace
 * (what the assistant actually checked this turn — real tool calls, never a fixed list).
 */
export function AiChatWidget() {
  const pathname = usePathname();
  const [hasOpenModal, setHasOpenModal] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pendingSteps, setPendingSteps] = useState<string[]>([]);
  const [isAwaitingFirstToken, setIsAwaitingFirstToken] = useState(false);
  const [mood, act] = useOrblingMood('idle');

  useEffect(() => {
    const checkModal = () => {
      const dialog = document.querySelector('[role="dialog"]:not([data-chat-panel="true"]), [data-slot="dialog-content"]');
      setHasOpenModal(!!dialog);
    };
    checkModal();
    const observer = new MutationObserver(checkModal);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    return () => observer.disconnect();
  }, []);

  const isHiddenRoute =
    pathname?.startsWith('/settings') ||
    pathname?.startsWith('/config') ||
    pathname?.startsWith('/auth') ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot-password' ||
    pathname === '/reset-password';

  if (isHiddenRoute || hasOpenModal) {
    return null;
  }

  const isBusy = mood === 'thinking' || mood === 'reading';

  function handleHover() {
    act({ type: 'HOVERED' });
  }

  function handleTap() {
    act({ type: 'TAP' });
    setTimeout(() => {
      setOpen(true);
      act({ type: 'OPENED' });
    }, 400);
  }

  function handleClose() {
    setOpen(false);
    act({ type: 'CLOSED' });
  }

  function handleInputChange(value: string) {
    setInput(value);
    act({ type: 'INPUT_CHANGED', hasText: value.trim().length > 0 });
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;

    setError(null);
    setPendingSteps([]);
    setIsAwaitingFirstToken(true);
    act({ type: 'SEND' });

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = { id: userMsgId, role: 'user', content: trimmed, timestamp: formatTime() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');

    const assistantMsgId = `assistant-${Date.now()}`;
    const userGroqKey = getStoredGroqKey();

    // If user has not set up their Groq API token yet, guide them directly to the Config / Settings page
    if (!userGroqKey) {
      act({ type: 'FIRST_TOKEN' });
      setIsAwaitingFirstToken(false);
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: `### 🔑 Groq API Key Required\n\nTo chat with the AI financial assistant, please set up your **free Groq API key** in the **Config** or **Settings** page.\n\n**Quick 30-Second Setup (₹0 Cost):**\n1. Visit [console.groq.com/keys](https://console.groq.com/keys) to create your free key (no card required).\n2. Open **[Config ➔ AI Bot](/config?tab=ai)** or **[Settings ➔ Preferences](/settings?tab=preferences)** and paste your key.\n\nOnce configured, I'll be ready to analyze your net worth, investments, and expenses!`,
          timestamp: formatTime(),
        },
      ]);
      act({ type: 'STREAM_DONE' });
      return;
    }

    let streamedAny = false;
    let steps: string[] = [];

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (userGroqKey) {
        headers['x-groq-api-key'] = userGroqKey;
      }

      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages: nextMessages.map((m) => ({ role: m.role, content: m.content })) }),
        signal: AbortSignal.timeout(35_000),
      });

      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        if (body?.error === 'GROQ_KEY_REQUIRED') {
          act({ type: 'FIRST_TOKEN' });
          setIsAwaitingFirstToken(false);
          setMessages((prev) => [
            ...prev,
            {
              id: assistantMsgId,
              role: 'assistant',
              content: `### 🔑 Groq API Key Required\n\nPlease set up your **free Groq API key** in **[Config ➔ AI Bot](/config?tab=ai)** or **[Settings ➔ Preferences](/settings?tab=preferences)** to start chatting with your financial assistant.\n\nGet your free key at [console.groq.com/keys](https://console.groq.com/keys).`,
              timestamp: formatTime(),
            },
          ]);
          act({ type: 'STREAM_DONE' });
          return;
        }
        throw new Error(body?.message ?? body?.error ?? 'Something went wrong.');
      }

      for await (const event of readChatStream(res.body)) {
        if (event.type === 'step') {
          steps = [...steps, event.label];
          setPendingSteps(steps);
        } else if (event.type === 'start') {
          act({ type: 'FIRST_TOKEN' });
          setIsAwaitingFirstToken(false);
          setMessages((prev) => [
            ...prev,
            { id: assistantMsgId, role: 'assistant', content: '', timestamp: formatTime(), steps },
          ]);
          streamedAny = true;
        } else if (event.type === 'token') {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? { ...m, content: m.content + event.text } : m))
          );
        } else if (event.type === 'error') {
          throw new Error(event.message);
        } else if (event.type === 'done') {
          act({ type: 'STREAM_DONE' });
        }
      }
    } catch (e) {
      act({ type: 'ERROR' });
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setMessages((prev) => prev.filter((m) => m.id !== userMsgId && (streamedAny ? m.id !== assistantMsgId : true)));
      setInput(trimmed);
    } finally {
      setPendingSteps([]);
      setIsAwaitingFirstToken(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <OrblingChatPanel
              mood={mood}
              messages={messages}
              pendingSteps={pendingSteps}
              isAwaitingFirstToken={isAwaitingFirstToken}
              input={input}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              onSuggestion={sendMessage}
              onClose={handleClose}
              isBusy={isBusy}
              error={error}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <OrblingFloatingOrb mood={mood} isOpen={open} onTap={handleTap} onCloseTap={handleClose} onHover={handleHover} />
    </>
  );
}
