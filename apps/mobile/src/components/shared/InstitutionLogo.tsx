import { useState } from "react";
import { Image } from "react-native";
import { Landmark } from "lucide-react-native";
import { useThemeColor } from "@/lib/colors";

interface InstitutionLogoProps {
  /** The institution's own web domain (Institution.domain), when confidently known. */
  domain?: string;
  size?: number;
}

/**
 * A small favicon for a bank/broker in the import picker — fetched live from Google's public
 * favicon service rather than bundling logo assets here (same as web's InstitutionLogo.tsx).
 * Falls back to a generic Landmark building icon when domain isn't known or favicon fetch fails.
 */
export function InstitutionLogo({ domain, size = 18 }: InstitutionLogoProps) {
  const [failed, setFailed] = useState(false);
  const mutedForeground = useThemeColor("mutedForeground");

  if (!domain || failed) {
    return <Landmark size={size} color={mutedForeground} />;
  }

  return (
    <Image
      source={{ uri: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` }}
      style={{ width: size, height: size, borderRadius: 3 }}
      onError={() => setFailed(true)}
    />
  );
}
