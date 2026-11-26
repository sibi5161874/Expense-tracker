import { useState } from "react";
import { View, TextInput, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { Sparkles, ArrowRight } from "lucide-react-native";
import { parseTransactionText, type ParsedQuickAddResult } from "@repo/shared/logic";
import type { TransactionInput, CashbookInput, InvestmentLogInput } from "@repo/shared/schemas";
import { AppText } from "@/components/common/AppText";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransactions } from "@/hooks/useTransactions";
import { useCashbook } from "@/hooks/useCashbook";
import { useInvestmentLog } from "@/hooks/useInvestmentLog";
import { useTheme } from "@/theme/ThemeProvider";
import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";
import { AddCashbookSheet } from "@/components/cashbook/AddCashbookSheet";
import { AddInvestmentSheet } from "@/components/investments/AddInvestmentSheet";

interface QuickAddInputProps {
  onSuccess?: () => void;
}

const QUICK_SUGGESTIONS = [
  "Dinner ₹450",
  "Uber ₹280",
  "Grocery ₹1200",
  "Lent ₹500 to Bob",
  "Bought 10 TCS @ 3500",
];

/**
 * Material 3 / Awwwards Quick Add NLP Input.
 * Natural Language Transaction, Cashbook & Investment Parser
 * with tactile press feedback and slate obsidian styling.
 */
export function QuickAddInput({ onSuccess }: QuickAddInputProps) {
  const { theme } = useTheme();
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts(true);
  const { createTransaction } = useTransactions();
  const { createCashbook } = useCashbook();
  const { createInvestmentLog } = useInvestmentLog();

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal open states and prefilled data
  const [activeModal, setActiveModal] = useState<"transaction" | "cashbook" | "investment" | null>(null);
  const [transactionPrefill, setTransactionPrefill] = useState<Partial<TransactionInput> | null>(null);
  const [cashbookPrefill, setCashbookPrefill] = useState<Partial<CashbookInput> | null>(null);
  const [investmentPrefill, setInvestmentPrefill] = useState<Partial<InvestmentLogInput> | null>(null);

  const handleSubmit = (customText?: string) => {
    const raw = customText ?? text;
    const trimmed = raw.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const parsed: ParsedQuickAddResult = parseTransactionText(trimmed);

      if (parsed.intent === "cashbook" && parsed.cashbook) {
        setCashbookPrefill({
          flow: parsed.cashbook.flow,
          amount: parsed.cashbook.amount,
          counterparty: parsed.cashbook.counterparty,
          notes: parsed.cashbook.notes,
          date: parsed.cashbook.date,
        });
        setActiveModal("cashbook");
      } else if (parsed.intent === "investment" && parsed.investment) {
        setInvestmentPrefill({
          action: parsed.investment.action,
          asset_type: parsed.investment.asset_type,
          symbol: parsed.investment.symbol,
          quantity: parsed.investment.quantity,
          price: parsed.investment.price,
          date: parsed.investment.date,
          notes: parsed.investment.notes,
        });
        setActiveModal("investment");
      } else {
        const tx = parsed.transaction;
        let matchedCategoryId: string | undefined;

        if (tx?.category && categories?.length) {
          const catLower = tx.category.toLowerCase();
          const found = categories.find(
            (c) =>
              c.name.toLowerCase().includes(catLower) ||
              catLower.includes(c.name.toLowerCase())
          );
          if (found) {
            matchedCategoryId = found.id;
          }
        }

        setTransactionPrefill({
          type: tx?.type ?? "Expense",
          amount: tx?.amount,
          category_id: matchedCategoryId,
          notes: tx?.notes,
          date: tx?.date,
        });
        setActiveModal("transaction");
      }

      setText("");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setActiveModal(null);
    setTransactionPrefill(null);
    setCashbookPrefill(null);
    setInvestmentPrefill(null);
  };

  const handleSuccess = () => {
    handleClose();
    onSuccess?.();
  };

  return (
    <View className="gap-2.5">
      {/* Search / NLP Input Container */}
      <View
        className="h-12 flex-row items-center rounded-2xl border border-border/70 px-4 shadow-sm"
        style={{
          backgroundColor: theme.card,
        }}
      >
        <Sparkles size={18} color={theme.primary} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Quick add: 'Spent ₹450 on food'..."
          placeholderTextColor={theme.mutedForeground}
          returnKeyType="go"
          onSubmitEditing={() => handleSubmit()}
          className="flex-1 px-3 text-sm text-foreground"
          style={{ paddingVertical: 0 }}
        />
        {loading ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : (
          <Pressable
            onPress={() => handleSubmit()}
            disabled={!text.trim()}
            className="size-8 items-center justify-center rounded-xl active:scale-90"
            style={{
              backgroundColor: text.trim() ? theme.primary : "transparent",
            }}
          >
            <ArrowRight
              size={16}
              color={text.trim() ? theme.onPrimary : theme.mutedForeground}
            />
          </Pressable>
        )}
      </View>

      {/* Quick Suggestion Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row items-center gap-2 px-0.5">
          {QUICK_SUGGESTIONS.map((suggestion) => (
            <Pressable
              key={suggestion}
              onPress={() => handleSubmit(suggestion)}
              className="rounded-full border border-border/70 px-3.5 py-1.5 active:scale-95 active:opacity-80"
              style={{
                backgroundColor: theme.surfaceContainer || theme.card,
              }}
            >
              <AppText className="text-xs font-medium text-muted-foreground">
                {suggestion}
              </AppText>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Prefilled Action Bottom Sheets */}
      <AddTransactionSheet
        visible={activeModal === "transaction"}
        onClose={handleClose}
        accounts={accounts ?? []}
        categories={categories ?? []}
        editing={transactionPrefill ? (transactionPrefill as TransactionInput) : undefined}
        onSubmit={async (data) => {
          await createTransaction(data);
          handleSuccess();
        }}
      />

      <AddCashbookSheet
        visible={activeModal === "cashbook"}
        onClose={handleClose}
        accounts={accounts ?? []}
        editing={cashbookPrefill ? (cashbookPrefill as CashbookInput) : undefined}
        onSubmit={async (data) => {
          await createCashbook(data);
          handleSuccess();
        }}
      />

      <AddInvestmentSheet
        visible={activeModal === "investment"}
        onClose={handleClose}
        accounts={accounts ?? []}
        editing={investmentPrefill ? (investmentPrefill as InvestmentLogInput) : undefined}
        onSubmit={async (data) => {
          await createInvestmentLog(data);
          handleSuccess();
        }}
      />
    </View>
  );
}
