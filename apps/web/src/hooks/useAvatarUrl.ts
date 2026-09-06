import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';

/**
 * Resolves the avatar to display: a custom upload (`user_profiles.avatar_url`) wins when set,
 * since that's the user's explicit choice; otherwise falls back to whatever the Google OAuth
 * sign-in populated (`user_metadata.avatar_url`/`picture` — Supabase's Google provider sets
 * one or the other depending on account setup, so both are checked); null for anyone who
 * signed up with email/password and never uploaded one, letting callers fall back to initials.
 */
export function useAvatarUrl(): string | null {
  const { user } = useAuth();
  const { data: profile } = useUserProfile();

  if (profile?.avatar_url) return profile.avatar_url;

  const metadata = user?.user_metadata as Record<string, unknown> | undefined;
  const googleAvatar = (metadata?.avatar_url as string | undefined) ?? (metadata?.picture as string | undefined);
  return googleAvatar ?? null;
}
