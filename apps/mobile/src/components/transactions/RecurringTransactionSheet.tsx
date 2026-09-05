import { Modal, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react-native";
import { recurringTransactionSchema, type RecurringTransactionInput } from "@repo/shared/schemas";
import type { Account, Category } from "@repo/shared/types";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { PickerField } from "@/components/common/PickerField";
import { Button } from "@/components/common/Button";
import { useThemeColor } from "@/lib/colors";

interface RecurringTransactionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: RecurringTransactionInput) => void;
  accounts: Account[];
  categories: Category[];
  editing?: RecurringTransactionInput;
}

const TYPE_OPTIONS = [
  { label: "Income", value: "Income" },
  { label: "Expense", value: "Expense" },
  { label: "Transfer", value: "Transfer" },
];

const FREQUENCY_OPTIONS = [
  { label: "Weekly", value: "Weekly" },
  { label: "Monthly", value: "Monthly" },
  { label: "Quarterly", value: "Quarterly" },
  { label: "Yearly", value: "Yearly" },
];

/** Mobile equivalent of RecurringTransactionForm.tsx — same field set (type, frequency,
 * start date, amount, category/accounts, notes) as AddTransactionSheet.tsx plus the two
 * recurrence-specific fields. */
export function RecurringTransactionSheet({
  visible,
  onClose,
  onSubmit,
  accounts,
  categories,
  editing,
}: RecurringTransactionSheetProps) {
  const form = useForm<RecurringTransactionInput>({
    resolver: zodResolver(recurringTransactionSchema),
    defaultValues: editing ?? { type: "Expense", frequency: "Monthly", next_run_date: new Date().toISOString().split("T")[0] },
  });

  const type = form.watch("type");
  const accountOptions = accounts.map((a) => ({ label: a.name, value: a.id }));
  const categoryOptions = categories.filter((c) => c.type === type).map((c) => ({ label: c.name, value: c.id }));
  const mutedForeground = useThemeColor("mutedForeground");

  function handleSubmit(data: RecurringTransactionInput) {
    onSubmit(data);
    form.reset();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between bg-card px-4 py-3">
          <AppText className="text-base font-semibold">{editing ? "Edit Recurring Transaction" : "Add Recurring Transaction"}</AppText>
          <Pressable onPress={onClose} hitSlop={14}>
            <X size={20} color={mutedForeground} />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="gap-4 p-4">
          <PickerField
            label="Type"
            value={type}
            options={TYPE_OPTIONS}
            onChange={(v) => form.setValue("type", v as RecurringTransactionInput["type"])}
          />

          <View className="flex-row gap-4">
            <View className="flex-1">
              <Controller
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <PickerField label="Frequency" value={field.value} options={FREQUENCY_OPTIONS} onChange={field.onChange} />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={form.control}
                name="next_run_date"
                render={({ field, fieldState }) => (
                  <TextField
                    label="Starts On"
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder="YYYY-MM-DD"
                    error={fieldState.error?.message}
                  />
                )}
              />
            </View>
          </View>

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
              <TextField label="Description" value={field.value} onChangeText={field.onChange} placeholder="Optional notes" multiline />
            )}
          />
        </ScrollView>

        <View className="flex-row gap-3 bg-card p-4">
          <Button variant="outline" className="flex-1" onPress={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onPress={form.handleSubmit(handleSubmit)} disabled={form.formState.isSubmitting}>
            {editing ? "Save Changes" : "Save Recurring Transaction"}
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
