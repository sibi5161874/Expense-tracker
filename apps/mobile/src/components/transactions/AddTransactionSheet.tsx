import { Modal, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react-native";
import { transactionSchema, type TransactionInput } from "@repo/shared/schemas";
import type { Account, Category } from "@repo/shared/types";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { PickerField } from "@/components/common/PickerField";
import { Button } from "@/components/common/Button";
import { useThemeColor } from "@/lib/colors";

interface AddTransactionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionInput) => void;
  accounts: Account[];
  categories: Category[];
  editing?: TransactionInput;
}

const TYPE_OPTIONS = [
  { label: "Income", value: "Income" },
  { label: "Expense", value: "Expense" },
  { label: "Transfer", value: "Transfer" },
];

/**
 * Mobile equivalent of TransactionForm.tsx. A shadcn Dialog is a centered web overlay — the
 * mobile-appropriate translation is a full-height modal sheet sliding up from the bottom,
 * which is how every native iOS/Android form works. Same Zod schema, same validation, same
 * field set; Select becomes PickerField (bottom-sheet list) since there's no native <select>.
 */
export function AddTransactionSheet({
  visible,
  onClose,
  onSubmit,
  accounts,
  categories,
  editing,
}: AddTransactionSheetProps) {
  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: editing ?? { type: "Expense", date: new Date().toISOString().split("T")[0] },
  });

  const type = form.watch("type");
  const accountOptions = accounts.map((a) => ({ label: a.name, value: a.id }));
  const categoryOptions = categories.filter((c) => c.type === type).map((c) => ({ label: c.name, value: c.id }));
  const mutedForeground = useThemeColor("mutedForeground");

  function handleSubmit(data: TransactionInput) {
    onSubmit(data);
    form.reset();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between bg-card px-4 py-3">
          <AppText className="text-base font-semibold">{editing ? "Edit Transaction" : "Add Transaction"}</AppText>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={20} color={mutedForeground} />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="gap-4 p-4">
          <PickerField
            label="Type"
            value={type}
            options={TYPE_OPTIONS}
            onChange={(v) => form.setValue("type", v as TransactionInput["type"])}
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

          <Controller
            control={form.control}
            name="amount"
            render={({ field, fieldState }) => (
              <TextField
                label="Amount"
                keyboardType="decimal-pad"
                value={field.value ? String(field.value) : ""}
                onChangeText={(t) => field.onChange(t ? Number(t) : undefined)}
                placeholder="0.00"
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
                label="From Account"
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
                value={field.value}
                onChangeText={field.onChange}
                placeholder="Optional notes"
                multiline
              />
            )}
          />
        </ScrollView>

        <View className="flex-row gap-3 bg-card p-4">
          <Button variant="outline" className="flex-1" onPress={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onPress={form.handleSubmit(handleSubmit)} disabled={form.formState.isSubmitting}>
            {editing ? "Save Changes" : "Save Transaction"}
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
