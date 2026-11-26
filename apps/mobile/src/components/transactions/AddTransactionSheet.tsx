import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, ArrowDownRight, ArrowUpRight, ArrowLeftRight } from "lucide-react-native";
import { transactionSchema, type TransactionInput } from "@repo/shared/schemas";
import type { Account, Category } from "@repo/shared/types";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { PickerField } from "@/components/common/PickerField";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { cn } from "@/lib/cn";

interface AddTransactionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionInput) => void;
  accounts: Account[];
  categories: Category[];
  editing?: TransactionInput;
}

const TYPE_CONFIG = [
  {
    type: "Expense" as const,
    label: "Expense",
    icon: ArrowDownRight,
    activeBg: "bg-destructive/15 border-destructive/40 text-destructive",
    activeColor: "#ef4444",
  },
  {
    type: "Income" as const,
    label: "Income",
    icon: ArrowUpRight,
    activeBg: "bg-success/15 border-success/40 text-success",
    activeColor: "#22c55e",
  },
  {
    type: "Transfer" as const,
    label: "Transfer",
    icon: ArrowLeftRight,
    activeBg: "bg-primary/15 border-primary/40 text-primary",
    activeColor: "#3b82f6",
  },
];

export function AddTransactionSheet({
  visible,
  onClose,
  onSubmit,
  accounts,
  categories,
  editing,
}: AddTransactionSheetProps) {
  const { theme } = useTheme();
  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: editing ?? { type: "Expense", date: new Date().toISOString().split("T")[0] },
  });

  const type = form.watch("type");
  const accountOptions = accounts.map((a) => ({ label: a.name, value: a.id }));
  const categoryOptions = categories.filter((c) => c.type === type).map((c) => ({ label: c.name, value: c.id }));

  function handleSubmit(data: TransactionInput) {
    onSubmit(data);
    form.reset();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView
        className="flex-1"
        edges={["top", "bottom"]}
        style={{ backgroundColor: theme.background }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          {/* Header */}
          <View
            className="flex-row items-center justify-between border-b px-5 py-4"
            style={{
              backgroundColor: theme.surfaceContainer || theme.card,
              borderBottomColor: theme.outlineVariant ? `${theme.outlineVariant}33` : theme.border,
            }}
          >
            <AppText className="text-lg font-semibold text-foreground">
              {editing ? "Edit Transaction" : "New Transaction"}
            </AppText>
            <Pressable
              onPress={onClose}
              hitSlop={14}
              className="rounded-full bg-muted/60 p-1.5 active:bg-muted"
            >
              <X size={18} color={theme.foreground} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerClassName="gap-5 p-5 pb-10"
            showsVerticalScrollIndicator={false}
          >
            {/* Transaction Type Segment Pills */}
            <View className="flex-row gap-2">
              {TYPE_CONFIG.map((cfg) => {
                const isSelected = type === cfg.type;
                const Icon = cfg.icon;
                return (
                  <Pressable
                    key={cfg.type}
                    onPress={() => form.setValue("type", cfg.type)}
                    className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl border py-3 transition-colors"
                    style={{
                      borderWidth: 1.5,
                      backgroundColor: isSelected
                        ? theme.primary
                        : (theme.surfaceContainerLow || theme.card),
                      borderColor: isSelected
                        ? theme.primary
                        : theme.outlineVariant ? `${theme.outlineVariant}33` : theme.border,
                      shadowColor: isSelected ? theme.primary : "transparent",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isSelected ? 0.25 : 0,
                      shadowRadius: 4,
                      elevation: isSelected ? 3 : 0,
                    }}
                  >
                    <Icon size={16} color={isSelected ? (theme.onPrimary || "#FFFFFF") : theme.mutedForeground} strokeWidth={isSelected ? 2.5 : 2} />
                    <AppText
                      className="text-xs font-bold"
                      style={{
                        color: isSelected ? (theme.onPrimary || "#FFFFFF") : theme.mutedForeground,
                      }}
                    >
                      {cfg.label}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            {/* Form Fields Card */}
            <View
              className="gap-4 rounded-3xl border p-5 shadow-sm"
              style={{
                backgroundColor: theme.surfaceContainerLow || theme.card,
                borderColor: theme.outlineVariant ? `${theme.outlineVariant}33` : theme.border,
              }}
            >
              <Controller
                control={form.control}
                name="amount"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Amount (₹)"
                    keyboardType="decimal-pad"
                    value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
                    onChangeText={(t) => field.onChange(t ? Number(t) : undefined)}
                    placeholder="0.00"
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                control={form.control}
                name="date"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Date"
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="YYYY-MM-DD"
                    error={fieldState.error?.message}
                  />
                )}
              />

              {type !== "Transfer" && (
                <Controller
                  control={form.control}
                  name="category_id"
                  render={({ field, fieldState }) => (
                    <PickerField
                      label="Category"
                      value={field.value ?? undefined}
                      options={categoryOptions}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              )}

              <Controller
                control={form.control}
                name="from_account_id"
                render={({ field, fieldState }) => (
                  <PickerField
                    label={type === "Transfer" ? "From Account" : "Account"}
                    value={field.value}
                    options={accountOptions}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                )}
              />

              {type === "Transfer" && (
                <Controller
                  control={form.control}
                  name="to_account_id"
                  render={({ field, fieldState }) => (
                    <PickerField
                      label="To Account"
                      value={field.value ?? undefined}
                      options={accountOptions}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              )}

              <Controller
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <TextField
                    label="Notes"
                    value={field.value ?? ""}
                    onChangeText={field.onChange}
                    placeholder="Add a note or description..."
                    multiline
                  />
                )}
              />
            </View>
          </ScrollView>

          {/* Sticky Action Footer */}
          <View
            className="flex-row items-center gap-3 border-t p-4"
            style={{
              backgroundColor: theme.surfaceContainer || theme.card,
              borderTopColor: theme.outlineVariant ? `${theme.outlineVariant}33` : theme.border,
            }}
          >
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-12 rounded-2xl"
              onPress={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="lg"
              className="flex-1 h-12 rounded-2xl"
              onPress={form.handleSubmit(handleSubmit)}
              disabled={form.formState.isSubmitting}
            >
              {editing ? "Save Changes" : "Save Transaction"}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

