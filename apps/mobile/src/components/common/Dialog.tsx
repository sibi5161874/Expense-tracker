import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, Modal, Pressable, View } from "react-native";
import { AppText } from "@/components/common/AppText";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/theme/ThemeProvider";

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

const DIALOG_EASING = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * Awwwards / Material 3 Dialog Component.
 * - 24dp corner radius (`rounded-3xl`).
 * - Slate obsidian card background (#151922) with hairline border (#232936).
 * - Fast 150ms spring-like emphasized easing.
 * - 48dp tactile action buttons.
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
        duration: visible ? 150 : 120,
        easing: DIALOG_EASING,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 150 : 100,
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
            opacity: opacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.65] }),
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
            borderRadius: 24,
            padding: 24,
            gap: 16,
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor: theme.border,
            opacity,
            transform: [{ scale }],
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.5,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          <View style={{ gap: 6 }}>
            <AppText style={{ fontSize: 20, fontWeight: "700", letterSpacing: -0.2 }}>{title}</AppText>
            {description && <AppText className="text-sm leading-5 text-muted-foreground">{description}</AppText>}
          </View>
          {children}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
            <Button variant="outline" size="default" className="flex-1" onPress={onCancel}>
              {cancelLabel}
            </Button>
            <Button variant={destructive ? "destructive" : "primary"} size="default" className="flex-1" onPress={onConfirm}>
              {confirmLabel}
            </Button>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
