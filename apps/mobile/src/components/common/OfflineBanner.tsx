import { useEffect, useState, useRef } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WifiOff, CheckCircle2 } from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useTheme } from "@/theme/ThemeProvider";

export function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [showReconnected, setShowReconnected] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      setShowReconnected(false);
    } else if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const isVisible = !isOnline || showReconnected;
  if (!isVisible) return null;

  const isOfflineState = !isOnline;

  const offlineBorder = theme.outlineVariant ? `${theme.outlineVariant}66` : theme.border;
  const onlineBorder = theme.success ? `${theme.success}55` : theme.border;
  const borderBottomColor = isOfflineState ? offlineBorder : onlineBorder;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel={isOfflineState ? "Offline notice" : "Online notice"}
      style={{
        paddingTop: Math.max(insets.top, 8),
        backgroundColor: theme.surfaceContainerHigh || theme.card,
        borderBottomWidth: 1,
        borderBottomColor,
      }}
      className="z-50 w-full px-4 pb-2 pt-1 shadow-xs"
    >
      <View className="flex-row items-center justify-center gap-2">
        {isOfflineState ? (
          <>
            <WifiOff size={14} color={theme.warning || "#f59e0b"} />
            <AppText className="text-xs font-medium text-foreground">
              Offline • Changes will sync automatically
            </AppText>
          </>
        ) : (
          <>
            <CheckCircle2 size={14} color={theme.success || "#22c55e"} />
            <AppText className="text-xs font-medium text-foreground">
              Connected • Synced
            </AppText>
          </>
        )}
      </View>
    </View>
  );
}
