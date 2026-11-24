import { useState, useRef, useEffect } from "react";
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Sparkles, Send, X, Bot, CheckCircle2 } from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { BottomSheet } from "@/components/common/BottomSheet";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/theme/ThemeProvider";
import { usePressScale } from "@/theme/usePressScale";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  steps?: string[];
  timestamp: string;
}

const STARTER_PROMPTS = [
  "What is my net worth breakdown?",
  "How much did I spend this month?",
  "Which of my investments are in loss?",
  "Do I have any overdue cashbook debts?",
];

const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_APP_URL || "https://kashmap.in";

export function AiChatSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { session } = useAuth();
  const { theme } = useTheme();
  const { onPressIn, onPressOut } = usePressScale(0.95);
  const scrollRef = useRef<ScrollView>(null);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      role: "assistant",
      content:
        "Hello! I am your KashMap Financial Assistant. You can ask me anything about your net worth, expenses, investments, budgets, or debts.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [currentSteps, setCurrentSteps] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [visible, messages]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt ?? input).trim();
    if (!textToSend || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setCurrentSteps([]);

    try {
      const historyPayload = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${WEB_APP_URL}/api/ai-chat`, {
        method: "POST",
        headers: {
          Authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: historyPayload }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to reach AI assistant");
      }

      // Parse SSE stream text response
      const rawText = await res.text();
      let assistantText = "";
      const stepsCollected: string[] = [];

      const chunks = rawText.split("\n\n");
      for (const chunk of chunks) {
        const trimmed = chunk.trim();
        if (trimmed.startsWith("data: ")) {
          try {
            const event = JSON.parse(trimmed.slice("data: ".length));
            if (event.type === "token" && event.text) {
              assistantText += event.text;
            } else if (event.type === "step" && event.label) {
              stepsCollected.push(event.label);
              setCurrentSteps([...stepsCollected]);
            }
          } catch {
            // Ignore parse errors on individual SSE frames
          }
        }
      }

      const botMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: assistantText || "I've reviewed your request but received no output.",
        steps: stepsCollected.length > 0 ? stepsCollected : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : "Something went wrong. Please try again."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setCurrentSteps([]);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="h-[520px] max-h-[85vh] flex-col"
      >
        {/* Header */}
        <View
          className="flex-row items-center justify-between border-b px-5 pb-3 pt-1"
          style={{
            borderBottomColor: theme.outlineVariant ? `${theme.outlineVariant}33` : theme.border,
          }}
        >
          <View className="flex-row items-center gap-2.5">
            <View
              className="size-9 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.primaryContainer }}
            >
              <Sparkles size={18} color={theme.primary} />
            </View>
            <View>
              <AppText className="text-base font-bold text-foreground">KashMap AI</AppText>
              <AppText className="text-xs text-muted-foreground">Powered by Groq & Llama 3</AppText>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            className="size-8 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.surfaceContainer || "transparent" }}
          >
            <X size={18} color={theme.mutedForeground} />
          </Pressable>
        </View>

        {/* Chat Messages */}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          className="flex-1"
        >
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <View
                key={m.id}
                className={`max-w-[85%] gap-1 ${isUser ? "self-end" : "self-start"}`}
              >
                {/* Step Trace Pills */}
                {m.steps && m.steps.length > 0 && (
                  <View className="mb-1 gap-1">
                    {m.steps.map((st, i) => (
                      <View
                        key={i}
                        className="flex-row items-center gap-1.5 rounded-full px-2.5 py-0.5"
                        style={{
                          backgroundColor: theme.surfaceContainerHighest || theme.card,
                        }}
                      >
                        <CheckCircle2 size={12} color={theme.success} />
                        <AppText className="text-[11px] text-muted-foreground">{st}</AppText>
                      </View>
                    ))}
                  </View>
                )}

                {/* Message Bubble */}
                <View
                  className={`rounded-2xl px-4 py-2.5 ${
                    isUser
                      ? "rounded-tr-xs bg-primary"
                      : "rounded-tl-xs border bg-surface-container-high"
                  }`}
                  style={{
                    backgroundColor: isUser
                      ? theme.primary
                      : theme.surfaceContainerHigh || theme.card,
                    borderColor: isUser
                      ? "transparent"
                      : theme.outlineVariant
                        ? `${theme.outlineVariant}44`
                        : theme.border,
                  }}
                >
                  <AppText
                    className={`text-sm leading-5 ${isUser ? "text-primary-foreground font-medium" : "text-foreground"}`}
                  >
                    {m.content}
                  </AppText>
                </View>
                <AppText
                  className={`text-[10px] text-muted-foreground ${isUser ? "text-right" : "text-left"} px-1`}
                >
                  {m.timestamp}
                </AppText>
              </View>
            );
          })}

          {loading && (
            <View className="self-start max-w-[85%] gap-1.5">
              {currentSteps.map((st, i) => (
                <View
                  key={i}
                  className="flex-row items-center gap-1.5 rounded-full px-2.5 py-0.5"
                  style={{ backgroundColor: theme.surfaceContainerHighest }}
                >
                  <ActivityIndicator size="small" color={theme.primary} />
                  <AppText className="text-[11px] text-muted-foreground">{st}</AppText>
                </View>
              ))}
              <View
                className="flex-row items-center gap-2 rounded-2xl rounded-tl-xs border px-4 py-3"
                style={{
                  backgroundColor: theme.surfaceContainerHigh || theme.card,
                  borderColor: theme.outlineVariant ? `${theme.outlineVariant}44` : theme.border,
                }}
              >
                <ActivityIndicator size="small" color={theme.primary} />
                <AppText className="text-xs text-muted-foreground">Analyzing your finances...</AppText>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Starter Prompt Chips */}
        {messages.length <= 2 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-9 px-4 mb-2">
            <View className="flex-row gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <Pressable
                  key={prompt}
                  onPress={() => handleSend(prompt)}
                  className="rounded-full border px-3 py-1"
                  style={{
                    borderColor: theme.outlineVariant ? `${theme.outlineVariant}55` : theme.border,
                    backgroundColor: theme.surfaceContainerLow || "transparent",
                  }}
                >
                  <AppText className="text-xs text-muted-foreground">{prompt}</AppText>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Input Bar */}
        <View
          className="border-t p-3"
          style={{
            borderTopColor: theme.outlineVariant ? `${theme.outlineVariant}33` : theme.border,
            backgroundColor: theme.surfaceContainer || theme.card,
          }}
        >
          <View
            className="flex-row items-center rounded-full border px-4 py-1"
            style={{
              backgroundColor: theme.surfaceContainerLow || theme.card,
              borderColor: theme.outlineVariant ? `${theme.outlineVariant}66` : theme.border,
            }}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ask KashMap AI anything..."
              placeholderTextColor={theme.mutedForeground}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
              className="flex-1 py-2 text-sm text-foreground"
            />
            <Pressable
              onPress={() => handleSend()}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              disabled={!input.trim() || loading}
              className="size-8 items-center justify-center rounded-full"
              style={{
                backgroundColor: input.trim() && !loading ? theme.primary : "transparent",
              }}
            >
              <Send
                size={16}
                color={input.trim() && !loading ? theme.onPrimary : theme.mutedForeground}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}
