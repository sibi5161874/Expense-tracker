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
 * rounded-bottom-sheet (24dp, theme/tokens.ts `radius.bottomSheet`) top corners, 60% dimmed
 * backdrop, slide-up entrance on cubic-bezier(0.16, 1, 0.3, 1) — RN's <Modal
 * animationType="slide"> uses a fixed native curve with no way to substitute a custom
 * bezier, so the slide is hand-driven here via Animated + Easing.bezier instead. Exit uses
 * its own faster, more linear curve (motion.easeIn) rather than the entrance curve played
 * backwards, which reads as sluggish on the way out.
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
        <Animated.View style={{ flex: 1, backgroundColor: "#000000", opacity: backdropOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] }) }} />
      </Pressable>
      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: "90%",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          backgroundColor: theme.card,
          transform: [{ translateY }],
        }}
      >
        {/* Grab handle — signals draggable/dismissable even though drag-to-dismiss itself
            isn't wired up (tap-backdrop and an explicit close action both already work). */}
        <Pressable onPress={() => {}} className="items-center py-3">
          <Animated.View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.border }} />
        </Pressable>
        <SafeAreaView edges={["bottom"]}>{children}</SafeAreaView>
      </Animated.View>
    </Modal>
  );
}
