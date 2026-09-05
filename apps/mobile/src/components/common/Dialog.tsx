import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Modal, Pressable, View } from "react-native";
import { AppText } from "@/components/common/AppText";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { motion } from "@/theme/tokens";

interface DialogProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

/**
 * Centered confirmation dialog — rounded-dialog (28dp, theme/tokens.ts `radius.dialog`,
 * deliberately larger than BottomSheet's 24dp; see that file's comment for why the two
 * differ). Meant for the app's ~26 existing native `confirm()`-equivalent call sites
 * (Alert.alert around destructive actions) to migrate onto over time — this component is
 * the replacement primitive, not yet wired into every call site itself.
 */
export function Dialog({
  visible,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive,
  onConfirm,
  onCancel,
  children,
}: DialogProps) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(scale, { toValue: visible ? 1 : 0.92, duration: motion.duration.base, useNativeDriver: true }).start();
    Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: motion.duration.base, useNativeDriver: true }).start();
  }, [visible, scale, opacity]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={{ flex: 1 }} onPress={onCancel}>
        <Animated.View style={{ flex: 1, backgroundColor: "#000000", opacity: opacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] }) }} />
      </Pressable>
      <View style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", padding: 24 }} pointerEvents="box-none">
        <Animated.View
          style={{
            width: "100%",
            maxWidth: 400,
            borderRadius: 28,
            padding: 20,
            gap: 16,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            opacity,
            transform: [{ scale }],
          }}
        >
          <View style={{ gap: 6 }}>
            <AppText style={{ fontSize: 18, fontWeight: "700" }}>{title}</AppText>
            {description && <AppText className="text-sm text-muted-foreground">{description}</AppText>}
          </View>
          {children}
          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
            <Button variant="text" onPress={onCancel}>
              {cancelLabel}
            </Button>
            <Button variant={destructive ? "destructive" : "default"} onPress={onConfirm}>
              {confirmLabel}
            </Button>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
