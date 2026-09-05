import { Modal, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react-native";
import { cashbookSchema, type CashbookInput } from "@repo/shared/schemas";
import type { Account } from "@repo/shared/types";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { PickerField } from "@/components/common/PickerField";
import { Button } from "@/components/common/Button";
import { useThemeColor } from "@/lib/colors";

interface AddCashbookSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CashbookInput) => void;
  accounts: Account[];
  editing?: CashbookInput;
}

const FLOW_OPTIONS = [
  { label: "Gave", value: "Gave" },
  { label: "Received", value: "Received" },
];

/** Mobile equivalent of CashbookForm.tsx. */
export function AddCashbookSheet({ visible, onClose, onSubmit, accounts, editing }: AddCashbookSheetProps) {
  const form = useForm<CashbookInput>({
    resolver: zodResolver(cashbookSchema),
    defaultValues: editing ?? { flow: "Gave", date: new Date().toISOString().split("T")[0] },
  });
  const mutedForeground = useThemeColor("mutedForeground");
  const accountOptions = accounts.map((a) => ({ label: a.name, value: a.id }));

  function handleSubmit(data: CashbookInput) {
    onSubmit(data);
    form.reset();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between bg-card px-4 py-3">
          <AppText className="text-base font-semibold">{editing ? "Edit Entry" : "Add Entry"}</AppText>
          <Pressable onPress={onClose} hitSlop={14}>
            <X size={20} color={mutedForeground} />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="gap-4 p-4">
          <PickerField
            label="Flow"
            value={form.watch("flow")}
            options={FLOW_OPTIONS}
            onChange={(v) => form.setValue("flow", v as CashbookInput["flow"])}
          />

          <Controller
            control={form.control}
            name="date"
            render={({ field, fieldState }) => (
              <TextField label="Date" value={field.value} onChangeText={field.onChange} placeholder="YYYY-MM-DD" error={fieldState.error?.message} />
            )}
          />

          <Controller
            control={form.control}
            name="counterparty"
            render={({ field, fieldState }) => (
              <TextField label="Counterparty" value={field.value} onChangeText={field.onChange} placeholder="Name" error={fieldState.error?.message} />
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

          <Controller
            control={form.control}
            name="due_date"
            render={({ field }) => (
              <TextField label="Due Date (optional)" value={field.value ?? ""} onChangeText={field.onChange} placeholder="YYYY-MM-DD" />
            )}
          />

          <Controller
            control={form.control}
            name="account_used_id"
            render={({ field }) => (
              <PickerField label="Account Used (optional)" value={field.value ?? undefined} options={accountOptions} onChange={field.onChange} />
            )}
          />

          <Controller
            control={form.control}
            name="notes"
            render={({ field }) => (
              <TextField label="Notes" value={field.value} onChangeText={field.onChange} placeholder="Optional notes" multiline />
            )}
          />
        </ScrollView>

        <View className="flex-row gap-3 bg-card p-4">
          <Button variant="outline" className="flex-1" onPress={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onPress={form.handleSubmit(handleSubmit)} disabled={form.formState.isSubmitting}>
            {editing ? "Save Changes" : "Save Entry"}
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
