'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Bot, CheckCircle2, ExternalLink, Eye, EyeOff, KeyRound, Loader2, Trash2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserGroqKey } from '@/hooks/useUserGroqKey';

export function GroqKeySettings() {
  const { groqKey, hasKey, isLoaded, setKey, removeKey } = useUserGroqKey();
  const [inputValue, setInputValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (groqKey) {
      setInputValue(groqKey);
    }
  }, [groqKey]);

  async function handleSave() {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      removeKey();
      toast.success('Groq API Key removed.');
      return;
    }

    if (!trimmed.startsWith('gsk_')) {
      toast.warning('Note: Standard Groq API keys usually start with "gsk_".');
    }

    setKey(trimmed);
    toast.success('Groq API Key saved successfully!');
  }

  async function handleTest() {
    const keyToTest = inputValue.trim() || groqKey;
    if (!keyToTest) {
      toast.error('Please enter an API key to test.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch('/api/ai-chat/verify-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: keyToTest }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        toast.success('✅ Connected to Groq successfully! AI assistant is ready.');
        if (!hasKey || groqKey !== keyToTest) {
          setKey(keyToTest);
        }
      } else {
        toast.error(data?.error ?? 'Verification failed. Please check the key.');
      }
    } catch {
      toast.error('Could not verify key. Check network connection.');
    } finally {
      setIsVerifying(false);
    }
  }

  function handleRemove() {
    removeKey();
    setInputValue('');
    toast.success('Groq API Key removed.');
  }

  if (!isLoaded) {
    return (
      <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading settings…
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">AI Financial Assistant (Groq Key)</h2>
          </div>
          <p className="text-muted-foreground text-sm">
            Bring your own free Groq API key to enable fast, conversational AI insights about your money.
          </p>
        </div>

        <div className="shrink-0">
          {hasKey ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="size-3.5" />
              Active & Configured
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <KeyRound className="size-3.5" />
              Key Required
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground block">
          Groq API Key
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              type={showKey ? 'text' : 'password'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="gsk_..."
              className="pr-10 font-mono text-xs sm:text-sm"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              title={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={!inputValue.trim() || inputValue === groqKey}
          >
            Save Key
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={isVerifying || !inputValue.trim()}
          >
            {isVerifying ? (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            ) : (
              <Zap className="size-4 mr-1.5 text-amber-400" />
            )}
            Test
          </Button>

          {hasKey && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Remove key"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Quick Setup Instructions */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-xs space-y-2.5 text-muted-foreground">
        <div className="flex items-center justify-between text-foreground font-medium">
          <span>How to get your free key (₹0 cost):</span>
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
          >
            Open Groq Console
            <ExternalLink className="size-3" />
          </a>
        </div>
        <ol className="list-decimal list-inside space-y-1 pl-1">
          <li>Sign in to <span className="text-foreground font-medium">console.groq.com</span> (Google or GitHub login).</li>
          <li>Click <span className="text-foreground font-medium">Create API Key</span> in the API Keys menu.</li>
          <li>Copy the key (starts with <code className="text-foreground font-mono bg-muted px-1 py-0.5 rounded">gsk_</code>) and paste it above.</li>
        </ol>
        <p className="pt-1 text-[11px] text-muted-foreground/80">
          🔒 <strong>Privacy First:</strong> Your key is stored securely in your browser's local storage. It is never stored in any database or shared with third parties.
        </p>
      </div>
    </div>
  );
}
