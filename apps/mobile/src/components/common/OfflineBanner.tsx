import { View } from "react-native";
import { WifiOff } from "lucide-react-native";
import { AppText } from "@/components/common/AppText";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useThemeColor } from "@/lib/colors";

/** Persistent, app-wide signal that we're offline — not an error, just a status. Data
 * already loaded still works (queries read from the persisted cache); this just sets
 * expectations before the user hits a network-only action like live price refresh. */
export function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const warningForeground = useThemeColor("warningForeground");

  if (isOnline) return null;

  return (
    <View className="flex-row items-center justify-center gap-2 bg-warning px-4 py-2">
      <WifiOff size={13} color={warningForeground} />
      <AppText className="text-xs font-medium" style={{ color: warningForeground }}>
        You're offline — showing your last synced data
      </AppText>
    </View>
  );
}
