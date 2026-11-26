import { useState } from "react";
import { FlatList, Modal, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, ChevronDown, X } from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { InstitutionLogo } from "@/components/shared/InstitutionLogo";
import { useTheme } from "@/theme/ThemeProvider";
import { cn } from "@/lib/cn";

export interface PickerOption {
  label: string;
  value: string;
  domain?: string;
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
 * High-end mobile picker with bottom sheet presentation, grab handle, institution logos,
 * and clear selection feedback.
 */
export function PickerField({
  label,
  value,
  options,
  onChange,
  placeholder = "Select...",
  error,
}: PickerFieldProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View className="gap-1.5">
      <AppText className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </AppText>
      <Pressable
        onPress={() => setOpen(true)}
        className={cn(
          "h-12 flex-row items-center justify-between rounded-2xl border px-4 transition-colors",
          open && "border-primary"
        )}
        style={{
          borderWidth: 1.5,
          borderColor: error
            ? theme.destructive
            : open
              ? theme.primary
              : theme.outlineVariant ? `${theme.outlineVariant}55` : theme.border,
          backgroundColor: open
            ? (theme.surfaceContainerHigh || theme.card)
            : (theme.surfaceContainerLow || theme.card),
        }}
      >
        <View className="flex-1 flex-row items-center gap-2.5">
          {selected?.domain && <InstitutionLogo domain={selected.domain} size={18} />}
          <AppText
            className={cn(
              "text-sm",
              selected ? "font-medium text-foreground" : "text-muted-foreground"
            )}
            numberOfLines={1}
          >
            {selected?.label ?? placeholder}
          </AppText>
        </View>
        <ChevronDown size={18} color={theme.mutedForeground} />
      </Pressable>
      {error && <AppText className="text-xs font-medium text-destructive">{error}</AppText>}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => setOpen(false)}
        >
          <Pressable
            className="max-h-[80%] rounded-t-[32px] border-t p-4 pb-2 shadow-2xl"
            style={{
              backgroundColor: theme.surfaceContainerHigh || theme.card,
              borderTopColor: theme.outlineVariant ? `${theme.outlineVariant}44` : theme.border,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <SafeAreaView edges={["bottom"]}>
              {/* Grab handle */}
              <View
                className="mb-3 h-1.5 w-12 self-center rounded-full"
                style={{ backgroundColor: theme.outlineVariant ? `${theme.outlineVariant}66` : theme.border }}
              />

              {/* Sheet header */}
              <View className="mb-3 flex-row items-center justify-between px-2 pb-2">
                <AppText className="text-base font-semibold text-foreground">{label}</AppText>
                <Pressable
                  onPress={() => setOpen(false)}
                  hitSlop={12}
                  className="rounded-full bg-muted/60 p-1.5 active:bg-muted"
                >
                  <X size={16} color={theme.foreground} />
                </Pressable>
              </View>

              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = item.value === value;
                  return (
                    <Pressable
                      onPress={() => {
                        onChange(item.value);
                        setOpen(false);
                      }}
                      className="mb-1 flex-row items-center justify-between rounded-xl px-4 py-3.5 transition-colors"
                      style={{
                        backgroundColor: isSelected
                          ? `${theme.primary}1A`
                          : "transparent",
                        borderWidth: isSelected ? 1 : 0,
                        borderColor: isSelected ? `${theme.primary}4D` : "transparent",
                      }}
                    >
                      <View className="flex-1 flex-row items-center gap-3">
                        {item.domain && <InstitutionLogo domain={item.domain} size={20} />}
                        <AppText
                          className={cn(
                            "text-sm",
                            isSelected ? "font-semibold" : ""
                          )}
                          style={{
                            color: isSelected ? theme.primary : theme.foreground,
                          }}
                        >
                          {item.label}
                        </AppText>
                      </View>
                      {isSelected && <Check size={18} color={theme.primary} />}
                    </Pressable>
                  );
                }}
              />
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

