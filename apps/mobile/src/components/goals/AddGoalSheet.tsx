import { Modal, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react-native";
import { goalSchema, type GoalInput } from "@repo/shared/schemas";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { PickerField } from "@/components/common/PickerField";
import { Button } from "@/components/common/Button";
import { useThemeColor } from "@/lib/colors";

interface AddGoalSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: GoalInput) => void;
  editing?: GoalInput;
}

const PRIORITY_OPTIONS = ["High", "Medium", "Low"].map((p) => ({ label: p, value: p }));

/** Mobile equivalent of GoalForm.tsx. */
export function AddGoalSheet({ visible, onClose, onSubmit, editing }: AddGoalSheetProps) {
  const form = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: editing ?? { priority: "Medium", saved_amount: 0 },
  });
  const mutedForeground = useThemeColor("mutedForeground");

  function handleSubmit(data: GoalInput) {
    onSubmit(data);
    form.reset();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center justify-between bg-card px-4 py-3">
          <AppText className="text-base font-semibold">{editing ? "Edit Goal" : "Add Goal"}</AppText>
          <Pressable onPress={onClose} hitSlop={8}>
            <X size={20} color={mutedForeground} />
          </Pressable>
        </View>

        <ScrollView contentContainerClassName="gap-4 p-4">
          <Controller
            control={form.control}
            name="goal_name"
            render={({ field, fieldState }) => (
              <TextField label="Goal Name" value={field.value} onChangeText={field.onChange} placeholder="Emergency Fund" error={fieldState.error?.message} />
            )}
          />

          <Controller
            control={form.control}
            name="category"
            render={({ field, fieldState }) => (
              <TextField label="Category" value={field.value} onChangeText={field.onChange} placeholder="Savings" error={fieldState.error?.message} />
            )}
          />

          <Controller
            control={form.control}
            name="target_amount"
            render={({ field, fieldState }) => (
              <TextField
                label="Target Amount"
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
            name="saved_amount"
            render={({ field, fieldState }) => (
              <TextField
                label="Saved Amount"
                keyboardType="decimal-pad"
                value={field.value ? String(field.value) : ""}
                onChangeText={(t) => field.onChange(t ? Number(t) : 0)}
                placeholder="0.00"
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={form.control}
            name="target_date"
            render={({ field, fieldState }) => (
              <TextField label="Target Date" value={field.value} onChangeText={field.onChange} placeholder="YYYY-MM-DD" error={fieldState.error?.message} />
            )}
          />

          <PickerField
            label="Priority"
            value={form.watch("priority")}
            options={PRIORITY_OPTIONS}
            onChange={(v) => form.setValue("priority", v as GoalInput["priority"])}
          />
        </ScrollView>

        <View className="flex-row gap-3 bg-card p-4">
          <Button variant="outline" className="flex-1" onPress={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onPress={form.handleSubmit(handleSubmit)} disabled={form.formState.isSubmitting}>
            {editing ? "Save Changes" : "Save Goal"}
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
