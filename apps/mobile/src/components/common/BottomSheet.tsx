import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Dimensions, Easing, Modal, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { motion } from "@/theme/tokens";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}

const SCREEN_HEIGHT = Dimensions.get("window").height;

/**
 * Material 3 Bottom Sheet Component.
 * - 28dp top corners (`rounded-t-3xl` / M3 extra-large radius).
 * - 32x4dp drag handle on top.
 * - Resting surface container elevation.
 * - Smooth entrance with cubic-bezier easeOut curve.
 */
export function BottomSheet({ visible, onClose, children }: BottomSheetProps) {
  const { theme } = useTheme();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: motion.duration.slow,
          easing: Easing.bezier(motion.easeOut.x1, motion.easeOut.y1, motion.easeOut.x2, motion.easeOut.y2),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: motion.duration.base, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: motion.duration.base,
          easing: Easing.bezier(motion.easeIn.x1, motion.easeIn.y1, motion.easeIn.x2, motion.easeIn.y2),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: motion.duration.fast, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, translateY, backdropOpacity]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={{ flex: 1 }} onPress={onClose}>
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "#000000",
            opacity: backdropOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }),
          }}
        />
      </Pressable>
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: "92%",
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          backgroundColor: theme.surfaceContainerLow || theme.card,
          transform: [{ translateY }],
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: theme.mode === "dark" ? 0.35 : 0.12,
          shadowRadius: 12,
          elevation: 16,
        }}
      >
        {/* M3 Drag Handle (32x4dp) */}
        <Pressable onPress={() => {}} className="items-center py-3">
          <Animated.View
            style={{
              width: 32,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.outlineVariant || theme.border,
            }}
          />
        </Pressable>
        <SafeAreaView edges={["bottom"]}>{children}</SafeAreaView>
      </Animated.View>
    </Modal>
  );
}
