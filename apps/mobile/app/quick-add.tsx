import { useState, useMemo } from "react";
import {
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { Sparkles, X, Check, ArrowRight, Wallet } from "lucide-react-native";
import { parseTransactionText } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { AppText } from "@/components/common/AppText";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { useTheme } from "@/theme/ThemeProvider";

const QUICK_PRESETS = [
  { label: "₹100 Coffee", text: "Spent 100 on coffee" },
  { label: "₹250 Uber", text: "Paid 250 for uber" },
  { label: "₹500 Groceries", text: "500 groceries" },
  { label: "₹1,200 Fuel", text: "Spent 1200 petrol" },
];

export default function QuickAddScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { data: accounts } = useAccounts(true);
  const { data: categories } = useCategories();
  const { createTransaction } = useTransactions({});

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Instant deterministic NLP extraction
  const parsed = useMemo(() => {
    if (!input.trim()) return null;
    return parseTransactionText(input);
  }, [input]);

  const defaultAccount = accounts?.[0];

  async function handleSave() {
    if (!input.trim() || !defaultAccount) return;
    setLoading(true);

    try {
      const txData = parsed?.transaction;
      const amount = txData?.amount || 0;
      const type = txData?.type || "Expense";
      const notes = txData?.notes || input;

      // Find matching category ID or fallback to uncategorized
      const matchedCat = categories?.find(
        (c) => c.name.toLowerCase() === txData?.category?.toLowerCase()
      );

      await createTransaction({
        date: txData?.date || new Date().toISOString().slice(0, 10),
        amount,
        type,
        notes,
        from_account_id: defaultAccount.id,
        category_id: matchedCat?.id,
      });

      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      setSuccess(true);
      setTimeout(() => {
        router.back();
      }, 800);
    } catch {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-end",
      }}
    >
      <Pressable style={{ flex: 1 }} onPress={() => router.back()} />

      <View
        style={{
          backgroundColor: theme.surfaceContainerHigh || theme.card,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          borderTopWidth: 1,
          borderColor: theme.outlineVariant ? `${theme.outlineVariant}30` : theme.border,
          padding: 24,
          gap: 16,
          paddingBottom: Platform.OS === "ios" ? 36 : 24,
        }}
      >
        {/* Grab bar */}
        <View
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.outlineVariant || "#88888840",
            alignSelf: "center",
          }}
        />

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: theme.primaryContainer,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={18} color={theme.primary} />
            </View>
            <AppText style={{ fontSize: 18, fontWeight: "700", color: theme.foreground }}>
              Quick-Add Transaction
            </AppText>
          </View>

          <Pressable
            onPress={() => router.back()}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: theme.surfaceContainerHighest || "#88888815",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color={theme.foreground} />
          </Pressable>
        </View>

        {/* Natural Language Input Field */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: theme.primary,
            backgroundColor: theme.background,
            paddingHorizontal: 14,
            paddingVertical: 10,
            gap: 10,
          }}
        >
          <TextInput
            placeholder="e.g. Spent 450 on Swiggy"
            placeholderTextColor={theme.mutedForeground}
            value={input}
            onChangeText={setInput}
            autoFocus
            style={{
              flex: 1,
              fontSize: 16,
              color: theme.foreground,
              padding: 0,
            }}
          />
        </View>

        {/* Live NLP Preview Badge */}
        {parsed?.transaction?.amount && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: theme.primary + "15",
            }}
          >
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary }} />
            <AppText style={{ fontSize: 13, fontWeight: "600", color: theme.primary }}>
              {parsed.transaction.type} • {formatINR(parsed.transaction.amount)}
              {parsed.transaction.category ? ` • ${parsed.transaction.category}` : ""}
            </AppText>
          </View>
        )}

        {/* Preset Chips */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {QUICK_PRESETS.map((p) => (
            <Pressable
              key={p.label}
              onPress={() => setInput(p.text)}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: pressed
                    ? (theme.surfaceContainerHighest || "#88888825")
                    : (theme.surfaceContainer || "#88888812"),
                  borderWidth: 1,
                  borderColor: theme.outlineVariant ? `${theme.outlineVariant}30` : "#88888820",
                },
              ]}
            >
              <AppText style={{ fontSize: 12, color: theme.foreground, fontWeight: "500" }}>
                {p.label}
              </AppText>
            </Pressable>
          ))}
        </View>

        {/* Account indicator & Save button */}
        <View style={{ gap: 10, marginTop: 4 }}>
          {defaultAccount && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 4 }}>
              <Wallet size={14} color={theme.mutedForeground} />
              <AppText style={{ fontSize: 12, color: theme.mutedForeground }}>
                Debiting: <AppText style={{ fontWeight: "600", color: theme.foreground }}>{defaultAccount.name}</AppText>
              </AppText>
            </View>
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
            disabled={!input.trim()}
            onPress={handleSave}
            leadingIcon={success ? <Check size={18} color={theme.onPrimary} /> : undefined}
          >
            {success ? "Logged Successfully!" : "Save Transaction"}
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
