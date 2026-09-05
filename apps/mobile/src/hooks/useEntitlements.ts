import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useUserProfile } from "@/hooks/useUserProfile";
import { updateUserTier } from "@repo/shared/queries/profile";
import {
  resolveEffectiveTier,
  isUnlimitedTier,
  hasFeatureAccess,
  getTrialDaysRemaining,
  hasUsedTrial,
  startTrial,
  purchaseLifetime,
} from "@repo/shared/logic";
import type { FeatureKey } from "@repo/shared/config";

/** Mirrors apps/web/src/hooks/useEntitlements.ts — the single place mobile checks
 * "can this user do X". Real checkout happens in the Billing WebView (which reuses
 * the web BillingTab flow); startTrial/purchaseLifetime here exist only so the same
 * DB-field-writing functions aren't duplicated, not because mobile calls them directly. */
export function useEntitlements() {
  const { user } = useAuth();
  const userId = user?.id;
  const supabase = useSupabaseClient();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useUserProfile();

  const tier = resolveEffectiveTier(profile ?? null);

  const startTrialMutation = useMutation({
    mutationFn: () => {
      if (!userId) throw new Error("User not authenticated");
      return updateUserTier(supabase, userId, startTrial());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["userProfile", userId] }),
  });

  const purchaseLifetimeMutation = useMutation({
    mutationFn: () => {
      if (!userId) throw new Error("User not authenticated");
      return updateUserTier(supabase, userId, purchaseLifetime());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["userProfile", userId] }),
  });

  return {
    tier,
    isLoading,
    isPro: isUnlimitedTier(tier),
    isTrialing: tier === "trial",
    trialDaysRemaining: getTrialDaysRemaining(profile ?? null),
    hasUsedTrial: hasUsedTrial(profile ?? null),
    hasFeature: (feature: FeatureKey) => hasFeatureAccess(feature, tier),
    startTrial: startTrialMutation.mutateAsync,
    isStartingTrial: startTrialMutation.isPending,
    purchaseLifetime: purchaseLifetimeMutation.mutateAsync,
    isPurchasing: purchaseLifetimeMutation.isPending,
  };
}
