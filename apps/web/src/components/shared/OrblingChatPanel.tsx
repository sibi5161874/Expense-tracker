'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, Check, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AiMarkdown } from './AiMarkdown';
import { OrblingHeader } from './OrblingHeader';
import { OrblingStatus, Orbling } from '@/components/orbling';
import { useOrblingPalette } from '@/hooks/useOrblingPalette';
import { useStaggeredSteps, type StaggeredStep } from '@/hooks/useStaggeredSteps';
import type { OrblingMood } from '@/hooks/useOrblingMood';

const SHOWCASE_MOODS: OrblingMood[] = [
  'thinking',
  'reading',
  'typing',
  'working',
  'waiting',
  'watching',
  'surprised',
  'sleepy',
  'error',
];
const SHOWCASE_STEP_MS = 700;

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

/** Double-clicking the welcome orb plays every mood once, in random order, then rests at idle. */
function useMoodShowcase() {
  const [demoMood, setDemoMood] = useState<OrblingMood | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function play() {
    if (timerRef.current) clearTimeout(timerRef.current);
    const sequence = shuffled(SHOWCASE_MOODS);
    let i = 0;
    function step() {
      if (i >= sequence.length) {
        setDemoMood(null);
        return;
      }
      setDemoMood(sequence[i]!);
      i++;
      timerRef.current = setTimeout(step, SHOWCASE_STEP_MS);
    }
    step();
  }

  return [demoMood, play] as const;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  /** What the assistant actually checked before answering — real tool calls, shown as a trace. */
  steps?: string[];
}

const SUGGESTIONS = [
  'What is my net worth?',
  'How much did I spend this month?',
  'How are my investments doing?',
  'What is my top expense category?',
];

function StepTrace({ steps }: { steps: StaggeredStep[] }) {
  return (
    <ul className="space-y-1">
      {steps.map((step, i) => (
        <li key={i} className="flex items-center gap-1.5 text-xs">
          {step.settled ? (
            <Check className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
          )}
          <span className={step.settled ? 'text-muted-foreground' : 'text-primary'}>{step.label}</span>
        </li>
      ))}
    </ul>
  );
}

interface OrblingChatPanelProps {
  mood: OrblingMood;
  messages: ChatMessage[];
  /** Step labels for the in-flight request, before its answer has started streaming. */
  pendingSteps: string[];
  /** True once a request is sent but its answer hasn't started streaming yet. */
  isAwaitingFirstToken: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onSuggestion: (text: string) => void;
  onClose: () => void;
  isBusy: boolean;
  error: string | null;
}

export function OrblingChatPanel({
  mood,
  messages,
  pendingSteps,
  isAwaitingFirstToken,
  input,
  onInputChange,
  onSubmit,
  onSuggestion,
  onClose,
  isBusy,
  error,
}: OrblingChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const palette = useOrblingPalette();
  const [showcaseMood, playShowcase] = useMoodShowcase();
  const liveSteps = useStaggeredSteps(pendingSteps);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isBusy, liveSteps]);

  return (
    <div className="glass-surface-strong fixed bottom-20 right-4 z-50 flex h-[min(31rem,calc(100vh-7rem))] w-[calc(100vw-2rem)] max-w-[22.5rem] flex-col overflow-hidden rounded-3xl sm:bottom-22 sm:right-6 sm:max-w-[24rem]">
      <OrblingHeader mood={mood} onClose={onClose} />

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && !isAwaitingFirstToken && (
          <div className="flex flex-col items-center gap-4 pt-4 text-center">
            <button
              type="button"
              onDoubleClick={playShowcase}
              aria-label="Show all assistant moods"
              title="Double-click to see every mood"
              className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Orbling mood={showcaseMood ?? mood} size={64} palette={palette} heat={false} />
            </button>
            <h3 className="text-base font-semibold text-foreground">What can I help with?</h3>
            <div className="w-full space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSuggestion(s)}
                  className="flex w-full items-center justify-between rounded-full border border-border/60 bg-muted/40 px-4 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5"
                >
                  <span>{s}</span>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            {m.role === 'user' ? (
              <div className="max-w-[88%] rounded-full bg-muted px-4 py-2 text-sm text-foreground">
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
              </div>
            ) : (
              <div className="max-w-[88%] space-y-2">
                {!!m.steps?.length && (
                  <StepTrace steps={m.steps.map((label) => ({ label, settled: true }))} />
                )}
                <div className="rounded-2xl rounded-tl-xs border border-border/80 bg-card px-4 py-2.5">
                  <AiMarkdown content={m.content} />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Live step trace while the answer hasn't started streaming yet */}
        {isAwaitingFirstToken && (
          <div className="max-w-[88%] space-y-2">
            {liveSteps.length > 0 && <StepTrace steps={liveSteps} />}
            <OrblingStatus mood={mood} size={16} heat={false} label="Waiting for your answer…" className="text-xs text-muted-foreground" />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border p-3">
        <Input
          autoFocus
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Ask anything"
          disabled={isBusy}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={isBusy || !input.trim()} aria-label="Send message">
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}
