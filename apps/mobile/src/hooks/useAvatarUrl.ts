import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";

/**
 * Resolves the avatar to display: a custom upload (`user_profiles.avatar_url`) wins when set,
 * falling back to whichever third-party OAuth avatar was populated on user_metadata (Google),
 * or null when neither exists.
 */
export function useAvatarUrl(): string | null {
  const { user } = useAuth();
  const { data: profile } = useUserProfile();

  if (profile?.avatar_url) return profile.avatar_url;

  const metadata = user?.user_metadata;
  const googleAvatar =
    (metadata?.avatar_url as string | undefined) ??
    (metadata?.picture as string | undefined);
  return googleAvatar ?? null;
}
