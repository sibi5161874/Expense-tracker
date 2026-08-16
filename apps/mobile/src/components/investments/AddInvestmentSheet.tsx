import { Modal, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react-native";
import { investmentLogSchema, type InvestmentLogInput } from "@repo/shared/schemas";
import type { Account } from "@repo/shared/types";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { PickerField } from "@/components/common/PickerField";
import { Button } from "@/components/common/Button";
import { useThemeColor } from "@/lib/colors";

interface AddInvestmentSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: InvestmentLogInput) => void;
  accounts: Account[];
  editing?: InvestmentLogInput;
}

const ACTION_OPTIONS = ["BUY", "SELL", "SIP", "DIVIDEND", "BONUS", "SPLIT"].map((a) => ({ label: a, value: a }));
const ASSET_TYPE_OPTIONS = ["Stock", "ETF", "Mutual Fund", "Crypto", "Bond", "Other"].map((a) => ({
  label: a,
  value: a,
}));

/** Mobile equivalent of InvestmentForm.tsx — same shape as AddTransactionSheet.tsx: a
 * full-height modal sheet with the shared Zod schema driving validation on both platforms. */
export function AddInvestmentSheet({ visible, onClose, onSubmit, accounts, editing }: AddInvestmentSheetProps) {
  const form = useForm<InvestmentLogInput>({
    resolver: zodResolver(investmentLogSchema),
    defaultValues: editing ?? {
      action: "BUY",
      asset_type: "Stock",
      date: new Date().toISOString().split("T")[0],
      fees: 0,
    },
  });
  const mutedForeground = useThemeColor("mutedForeground");
  const accountOptions = accounts.map((a) => ({ label: a.name, value: a.id }));

  function handleSubmit(data: InvestmentLogInput) {
    onSubmit(data);
    form.reset();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between bg-card px-4 py-3">
          <AppText className="text-base font-semibold">{editing ? "Edit Investment" : "Add Investment"}</AppText>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={20} color={mutedForeground} />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="gap-4 p-4">
          <PickerField
            label="Action"
            value={form.watch("action")}
            options={ACTION_OPTIONS}
            onChange={(v) => form.setValue("action", v as InvestmentLogInput["action"])}
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
            name="symbol"
            render={({ field, fieldState }) => (
              <TextField label="Symbol" value={field.value} onChangeText={field.onChange} autoCapitalize="characters" placeholder="INFY" error={fieldState.error?.message} />
            )}
          />

          <Controller
            control={form.control}
            name="exchange"
            render={({ field, fieldState }) => (
              <TextField label="Exchange" value={field.value} onChangeText={field.onChange} autoCapitalize="characters" placeholder="NSE" error={fieldState.error?.message} />
            )}
          />

          <PickerField
            label="Asset Type"
            value={form.watch("asset_type")}
            options={ASSET_TYPE_OPTIONS}
            onChange={(v) => form.setValue("asset_type", v as InvestmentLogInput["asset_type"])}
          />

          <Controller
            control={form.control}
            name="quantity"
            render={({ field, fieldState }) => (
              <TextField
                label="Quantity"
                keyboardType="decimal-pad"
                value={field.value ? String(field.value) : ""}
                onChangeText={(t) => field.onChange(t ? Number(t) : undefined)}
                placeholder="0"
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={form.control}
            name="price"
            render={({ field, fieldState }) => (
              <TextField
                label="Price"
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
            name="fees"
            render={({ field }) => (
              <TextField
                label="Fees"
                keyboardType="decimal-pad"
                value={field.value ? String(field.value) : ""}
                onChangeText={(t) => field.onChange(t ? Number(t) : 0)}
                placeholder="0.00"
              />
            )}
          />

          <Controller
            control={form.control}
            name="linked_account_id"
            render={({ field, fieldState }) => (
              <PickerField label="Linked Account" value={field.value} options={accountOptions} onChange={field.onChange} error={fieldState.error?.message} />
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
            {editing ? "Save Changes" : "Save Investment"}
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
