'use client';

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { AppShell } from "@/components/shared/AppShell";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useUserProfile();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <AppShell>{children}</AppShell>
      {!profileLoading && (!profile || !profile.onboarding_completed) && (
        <OnboardingWizard onDone={() => refetchProfile()} />
      )}
    </>
  );
}
