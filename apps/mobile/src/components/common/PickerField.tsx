import { useState } from "react";
import { FlatList, Modal, Pressable, View } from "react-native";
import { Check, ChevronDown } from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { useThemeColor } from "@/lib/colors";

interface PickerOption {
  label: string;
  value: string;
}

interface PickerFieldProps {
  label: string;
  value: string | null | undefined;
  options: PickerOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

/**
 * A native <select>/shadcn Select doesn't exist on RN — this is the mobile-appropriate
 * equivalent: a field that opens a bottom-sheet-style modal list. Used for Type/Category/
 * Account in the transaction form.
 */
export function PickerField({ label, value, options, onChange, placeholder = "Select...", error }: PickerFieldProps) {
  const [open, setOpen] = useState(false);
  const primary = useThemeColor("primary");
  const mutedForeground = useThemeColor("mutedForeground");
  const selected = options.find((o) => o.value === value);

  return (
    <View className="gap-1.5">
      <AppText className="text-sm font-medium">{label}</AppText>
      <Pressable
        onPress={() => setOpen(true)}
        className="h-12 flex-row items-center justify-between rounded-2xl border border-border bg-background px-4"
      >
        <AppText className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected?.label ?? placeholder}
        </AppText>
        <ChevronDown size={16} color={mutedForeground} />
      </Pressable>
      {error && <AppText className="text-xs text-destructive">{error}</AppText>}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-foreground/30" onPress={() => setOpen(false)}>
          <Pressable className="max-h-96 rounded-t-2xl bg-card p-2" onPress={(e) => e.stopPropagation()}>
            <AppText className="px-3 py-2 text-sm font-semibold">{label}</AppText>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className="flex-row items-center justify-between rounded-lg px-3 py-3 active:bg-muted"
                >
                  <AppText>{item.label}</AppText>
                  {item.value === value && <Check size={16} color={primary} />}
                </Pressable>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
