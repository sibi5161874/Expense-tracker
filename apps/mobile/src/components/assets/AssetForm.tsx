import { Modal, Pressable, ScrollView, View, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller, type DefaultValues, type FieldValues, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { X } from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { PickerField } from "@/components/common/PickerField";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/theme/ThemeProvider";

export interface AssetFieldConfig<T extends FieldValues> {
  name: Path<T>;
  label: string;
  type: "text" | "number" | "date" | "boolean" | "enum";
  options?: readonly string[];
  optional?: boolean;
  keyboardType?: "default" | "decimal-pad";
}

interface AssetFormProps<S extends z.ZodType<FieldValues>> {
  visible: boolean;
  title: string;
  schema: S;
  fields: readonly AssetFieldConfig<z.infer<S>>[];
  defaultValues: DefaultValues<z.infer<S>>;
  onClose: () => void;
  onSubmit: (data: z.infer<S>) => void;
}

/**
 * One config-driven form for all 8 asset sub-types (FD, Gold, Loans, EPF, NPS, SSY, SGB,
 * ULIP) instead of 8 near-identical hand-written forms — each type's Zod schema (already
 * shared with web) drives both validation and which fields render. `T` is derived from the
 * schema itself (`z.infer<S>`) rather than passed independently, so the schema and the
 * fields/defaultValues/onSubmit types can never drift out of sync. See RULES.md §11 (DRY).
 */
export function AssetForm<S extends z.ZodType<FieldValues>>({
  visible,
  title,
  schema,
  fields,
  defaultValues,
  onClose,
  onSubmit,
}: AssetFormProps<S>) {
  type T = z.infer<S>;
  const { theme } = useTheme();
  // zodResolver's overloads want a concrete Zod schema type, not a generic `S` bounded by
  // z.ZodType<FieldValues> — TS can't confirm a not-yet-resolved generic satisfies them even
  // though every concrete instantiation (assetFixedDepositSchema, assetGoldSchema, ...) does.
  // Narrow, deliberate bridge cast at the generic boundary; the actual runtime validation is
  // unaffected — schema is still the real Zod schema, just re-typed for this call.
  const form = useForm<T>({ resolver: zodResolver(schema as never) as never, defaultValues });

  function handleSubmit(data: T) {
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
          <AppText className="text-base font-semibold text-foreground">{title}</AppText>
          <Pressable onPress={onClose} hitSlop={14} className="rounded-full bg-muted/60 p-1.5 active:bg-muted">
            <X size={18} color={theme.foreground} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerClassName="gap-4 p-4"
          style={{ backgroundColor: theme.background }}
        >
          {fields.map((fieldConfig) => (
            <Controller
              key={fieldConfig.name}
              control={form.control}
              name={fieldConfig.name}
              render={({ field, fieldState }) => {
                if (fieldConfig.type === "boolean") {
                  return (
                    <View className="flex-row items-center justify-between rounded-2xl bg-card px-4 py-3">
                      <AppText className="text-sm font-medium">{fieldConfig.label}</AppText>
                      <Switch value={!!field.value} onValueChange={field.onChange} />
                    </View>
                  );
                }
                if (fieldConfig.type === "enum") {
                  return (
                    <PickerField
                      label={fieldConfig.label}
                      value={field.value ?? undefined}
                      options={(fieldConfig.options ?? []).map((o) => ({ label: o, value: o }))}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                    />
                  );
                }
                if (fieldConfig.type === "number") {
                  return (
                    <TextField
                      label={fieldConfig.label}
                      keyboardType="decimal-pad"
                      value={field.value != null && field.value !== "" ? String(field.value) : ""}
                      onChangeText={(t) => field.onChange(t ? Number(t) : fieldConfig.optional ? undefined : 0)}
                      placeholder="0"
                      error={fieldState.error?.message}
                    />
                  );
                }
                return (
                  <TextField
                    label={fieldConfig.label}
                    value={field.value ?? ""}
                    onChangeText={field.onChange}
                    placeholder={fieldConfig.type === "date" ? "YYYY-MM-DD" : undefined}
                    error={fieldState.error?.message}
                  />
                );
              }}
            />
          ))}
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
