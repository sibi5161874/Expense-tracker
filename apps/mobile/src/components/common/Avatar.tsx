import { useState } from "react";
import { Image, View, type StyleProp, type ViewStyle } from "react-native";
import { AppText } from "@/components/common/AppText";
import { useThemeColor } from "@/lib/colors";

interface AvatarProps {
  url?: string | null;
  initials?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function Avatar({ url, initials = "??", size = 64, style }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const cardBackground = useThemeColor("card");
  const foreground = useThemeColor("foreground");

  return (
    <View
      className="items-center justify-center overflow-hidden rounded-full border border-border bg-muted"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: cardBackground,
        },
        style,
      ]}
    >
      {url && !hasError ? (
        <Image
          source={{ uri: url }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setHasError(true)}
        />
      ) : (
        <AppText
          className="font-semibold"
          style={{
            fontSize: size * 0.38,
            color: foreground,
          }}
        >
          {initials}
        </AppText>
      )}
    </View>
  );
}
