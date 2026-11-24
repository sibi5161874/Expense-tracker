import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, Modal, Pressable, View } from "react-native";
import { AppText } from "@/components/common/AppText";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { m3Motion } from "@/theme/tokens";

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

const dialogEasing = Easing.bezier(
  m3Motion.easing.emphasized.x1,
  m3Motion.easing.emphasized.y1,
  m3Motion.easing.emphasized.x2,
  m3Motion.easing.emphasized.y2
);

/**
 * Material 3 Dialog Component.
 * - 28dp corner radius (`rounded-3xl` / extra-large radius).
 * - Surface Container High background.
 * - Headline-small title typography.
 * - Pill-shaped actions with M3 spacing and emphasized easing.
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
    Animated.parallel([
      Animated.timing(scale, {
        toValue: visible ? 1 : 0.92,
        duration: visible ? m3Motion.duration.medium2 : m3Motion.duration.short3,
        easing: dialogEasing,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? m3Motion.duration.medium1 : m3Motion.duration.short2,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, scale, opacity]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel} statusBarTranslucent>
      <Pressable style={{ flex: 1 }} onPress={onCancel}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "#000000",
            opacity: opacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }),
          }}
        />
      </Pressable>
      <View
        style={{ position: "absolute", inset: 0, alignItems: "center", justifyContent: "center", padding: 24 }}
        pointerEvents="box-none"
      >
        <Animated.View
          style={{
            width: "100%",
            maxWidth: 420,
            borderRadius: 28,
            padding: 24,
            gap: 16,
            backgroundColor: theme.surfaceContainerHigh || theme.card,
            borderWidth: 1,
            borderColor: theme.outlineVariant ? `${theme.outlineVariant}33` : theme.border,
            opacity,
            transform: [{ scale }],
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: theme.mode === "dark" ? 0.45 : 0.16,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          <View style={{ gap: 8 }}>
            <AppText style={{ fontSize: 20, fontWeight: "700", letterSpacing: -0.2 }}>{title}</AppText>
            {description && <AppText className="text-sm leading-5 text-muted-foreground">{description}</AppText>}
          </View>
          {children}
          <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
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
