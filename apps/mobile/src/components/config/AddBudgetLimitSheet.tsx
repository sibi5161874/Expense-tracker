import { Modal, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react-native";
import { budgetLimitSchema, type BudgetLimitInput } from "@repo/shared/schemas";
import type { Category } from "@repo/shared/types";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { PickerField } from "@/components/common/PickerField";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/theme/ThemeProvider";

interface AddBudgetLimitSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: BudgetLimitInput) => void;
  categories: Category[];
  editing?: BudgetLimitInput;
}

/** Bespoke (not the generic AssetForm) because category_id needs a dynamic name→id picker,
 * not the fixed-option enum the generic form supports. */
export function AddBudgetLimitSheet({ visible, onClose, onSubmit, categories, editing }: AddBudgetLimitSheetProps) {
  const { theme } = useTheme();
  const form = useForm<BudgetLimitInput>({
    resolver: zodResolver(budgetLimitSchema),
    defaultValues: editing ?? { monthly_limit: 0 },
  });
  const categoryOptions = categories.filter((c) => c.type === "Expense").map((c) => ({ label: c.name, value: c.id }));

  function handleSubmit(data: BudgetLimitInput) {
    onSubmit(data);
    form.reset();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: theme.background }}
      >
        <View
          className="flex-row items-center justify-between border-b px-4 py-3.5"
          style={{
            backgroundColor: theme.surfaceContainer || theme.card,
            borderBottomColor: theme.outlineVariant ? `${theme.outlineVariant}33` : theme.border,
          }}
        >
          <AppText className="text-base font-semibold text-foreground">
            {editing ? "Edit Budget Limit" : "Add Budget Limit"}
          </AppText>
          <Pressable onPress={onClose} hitSlop={14} className="rounded-full bg-muted/60 p-1.5 active:bg-muted">
            <X size={18} color={theme.foreground} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerClassName="gap-4 p-4"
          style={{ backgroundColor: theme.background }}
        >
          <Controller
            control={form.control}
            name="category_id"
            render={({ field, fieldState }) => (
              <PickerField label="Category" value={field.value} options={categoryOptions} onChange={field.onChange} error={fieldState.error?.message} />
            )}
          />
          <Controller
            control={form.control}
            name="monthly_limit"
            render={({ field, fieldState }) => (
              <TextField
                label="Monthly Limit"
                keyboardType="decimal-pad"
                value={field.value ? String(field.value) : ""}
                onChangeText={(t) => field.onChange(t ? Number(t) : 0)}
                placeholder="0.00"
                error={fieldState.error?.message}
              />
            )}
          />
        </ScrollView>

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
            Save
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
