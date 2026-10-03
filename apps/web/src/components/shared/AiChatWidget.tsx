'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Sparkles,
  RotateCcw,
  CheckCheck,
  Copy,
  Check,
  Plus,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TypewriterMarkdown } from './TypewriterMarkdown';
import { ChatTypingIndicator } from './ChatTypingIndicator';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isNew?: boolean;
}

const SUGGESTIONS = [
  { text: 'What is my net worth?', icon: '💰' },
  { text: 'How much did I spend this month?', icon: '📊' },
  { text: 'How are my investments doing?', icon: '📈' },
  { text: 'What is my top expense category?', icon: '🎯' },
];

function formatTime(date: Date = new Date()): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Floating AI Financial Assistant widget.
 * Talks to /api/ai-chat and provides instant answers from private user data with:
 * - Animated [ . . . ] typing indicator
 * - Typewriter character-by-character reveal effect
 * - Refined modern UI inspired by top-tier mobile & web chatbot designs
 */
export function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSuggestionsMenu, setShowSuggestionsMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [open]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setError(null);
    setShowSuggestionsMenu(false);

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: trimmed,
      timestamp: formatTime(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: AbortSignal.timeout(35_000),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Something went wrong.');

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: body.reply,
        timestamp: formatTime(),
        isNew: true,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      const timedOut = e instanceof Error && e.name === 'TimeoutError';
      setError(
        timedOut
          ? "The assistant isn't responding — please try again."
          : e instanceof Error
            ? e.message
            : 'Something went wrong.'
      );
      // Roll back user message so retrying is simple
      setMessages((prev) => prev.filter((m) => m.id !== userMsgId));
      setInput(trimmed);
    } finally {
      setIsSending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleResetChat() {
    setMessages([]);
    setError(null);
    setInput('');
  }

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-20 right-4 z-50 flex h-[min(31rem,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-[22.5rem] sm:max-w-[24rem] flex-col overflow-hidden rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl shadow-2xl sm:bottom-22 sm:right-6"
          >
            {/* Header Redesign */}
            <div className="relative border-b border-border/60 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent px-4 py-3 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="relative size-9 rounded-full border border-border/60 bg-muted overflow-hidden shadow-xs flex items-center justify-center shrink-0">
                      <Image
                        src="/images/chatbot.png"
                        alt="AI Assistant"
                        width={36}
                        height={36}
                        className="size-full object-cover"
                      />
                    </div>
                    {/* Live Green Online Badge */}
                    <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-semibold text-foreground tracking-tight">AI Assistant</h3>
                      <Sparkles className="size-3 text-primary fill-primary/20" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      <span>Always here to help you</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={handleResetChat}
                      aria-label="New chat"
                      title="New chat"
                      className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                    >
                      <RotateCcw className="size-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close chat"
                    className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Chat Body Canvas */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3.5 overflow-y-auto p-3.5 scrollbar-thin scrollbar-thumb-muted-foreground/20"
            >
              {/* Empty / Welcome State */}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center text-center pt-2 pb-1 space-y-3">
                  <div className="relative size-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner overflow-hidden">
                    <Image
                      src="/images/chatbot.png"
                      alt="AI Assistant"
                      width={56}
                      height={56}
                      className="size-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground">Hello! 👋</h4>
                    <p className="text-xs text-muted-foreground max-w-[18rem]">
                      How can I help you today? Ask me about your transactions, net worth, budgets, or investments.
                    </p>
                  </div>

                  {/* Suggestion Chips */}
                  <div className="w-full space-y-2 pt-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 text-left px-1">
                      Suggested questions
                    </p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s.text}
                          type="button"
                          onClick={() => sendMessage(s.text)}
                          className="group flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/40 hover:bg-primary/5 hover:border-primary/30 p-2.5 text-left text-xs font-medium text-foreground transition-all duration-150 hover:translate-x-0.5 active:scale-[0.99]"
                        >
                          <span className="text-base">{s.icon}</span>
                          <span className="flex-1 group-hover:text-primary transition-colors">{s.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Message List */}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn('flex flex-col space-y-1', m.role === 'user' ? 'items-end' : 'items-start')}
                >
                  <div className="flex items-end gap-2 max-w-[92%] sm:max-w-[88%]">
                    {m.role === 'assistant' && (
                      <div className="relative size-7 shrink-0 rounded-full border border-primary/20 bg-primary/10 overflow-hidden shadow-2xs flex items-center justify-center">
                        <Image
                          src="/images/chatbot.png"
                          alt="AI"
                          width={28}
                          height={28}
                          className="size-full object-cover"
                        />
                      </div>
                    )}

                    {m.role === 'user' ? (
                      <div className="rounded-2xl rounded-tr-xs px-4 py-2.5 text-sm bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-sm break-words">
                        <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      </div>
                    ) : (
                      <div className="group relative rounded-2xl rounded-tl-xs px-4 py-3 text-sm bg-card dark:bg-card/90 border border-border/80 text-foreground shadow-xs backdrop-blur-xs">
                        {m.isNew ? (
                          <TypewriterMarkdown
                            content={m.content}
                            animate={true}
                            speed={12}
                            onProgress={() => scrollToBottom('auto')}
                            onComplete={() => {
                              // Mark as no longer new so it doesn't re-type later
                              setMessages((prev) =>
                                prev.map((msg) => (msg.id === m.id ? { ...msg, isNew: false } : msg))
                              );
                              scrollToBottom('smooth');
                            }}
                          />
                        ) : (
                          <TypewriterMarkdown content={m.content} animate={false} />
                        )}

                        {/* Copy Button */}
                        <div className="mt-2 flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleCopy(m.id, m.content)}
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                            title="Copy response"
                          >
                            {copiedId === m.id ? (
                              <>
                                <Check className="size-3 text-emerald-500" />
                                <span className="text-emerald-500 font-medium">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="size-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Metadata / Timestamp & Delivery Indicator */}
                  <div
                    className={cn(
                      'flex items-center gap-1 px-1 text-[10px] text-muted-foreground/70',
                      m.role === 'user' ? 'justify-end pr-1' : 'justify-start pl-9'
                    )}
                  >
                    <span>{m.timestamp}</span>
                    {m.role === 'user' && <CheckCheck className="size-3 text-primary/80" />}
                  </div>
                </div>
              ))}

              {/* Typing Indicator [ . . . ] */}
              <AnimatePresence>
                {isSending && <ChatTypingIndicator key="typing-indicator" />}
              </AnimatePresence>

              {/* Error Banner */}
              {error && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                  <HelpCircle className="size-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestions Toggle Drawer */}
            <AnimatePresence>
              {showSuggestionsMenu && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-border/60 bg-muted/40 p-2.5 space-y-1.5 overflow-hidden"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                    Quick Prompts
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.text}
                        type="button"
                        onClick={() => sendMessage(s.text)}
                        className="rounded-full border border-border/80 bg-background px-2.5 py-1 text-xs text-foreground hover:border-primary/40 hover:text-primary transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <span>{s.icon}</span>
                        <span>{s.text}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Input Redesign */}
            <div className="border-t border-border/60 bg-card/90 p-3 backdrop-blur-md">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSuggestionsMenu((prev) => !prev)}
                  title="Suggestions"
                  className={cn(
                    'size-9 rounded-full flex items-center justify-center border border-border/80 bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95',
                    showSuggestionsMenu && 'bg-primary/10 text-primary border-primary/30'
                  )}
                >
                  <Plus
                    className={cn(
                      'size-4 transition-transform duration-200',
                      showSuggestionsMenu && 'rotate-45 text-primary'
                    )}
                  />
                </button>

                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    disabled={isSending}
                    className="w-full h-10 rounded-full border border-border/80 bg-background/80 px-4 pr-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSending || !input.trim()}
                  aria-label="Send message"
                  className={cn(
                    'size-10 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-md transition-all duration-150 active:scale-95 hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none disabled:shadow-none'
                  )}
                >
                  <Send className="size-4 -translate-x-0.5 translate-y-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Launcher Button Container */}
      <div className="fixed bottom-20 right-4 z-50 sm:bottom-6 sm:right-6">
        <motion.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close AI chat' : 'Open AI chat'}
          className="relative flex size-14 items-center justify-center overflow-hidden rounded-full shadow-xl transition-all bg-primary text-primary-foreground border-2 border-background ring-4 ring-primary/10 hover:ring-primary/25"
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="size-6" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="size-full flex items-center justify-center"
              >
                <Image
                  src="/images/chatbot.png"
                  alt="AI Assistant"
                  width={56}
                  height={56}
                  className="size-full object-cover"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
        {!open && (
          <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center">
            <span className="absolute size-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative size-3.5 rounded-full bg-emerald-500 ring-2 ring-background" />
          </span>
        )}
      </div>
    </>
  );
}
