import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/LandingPage";

export default async function RootPage({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string; next?: string; error?: string; error_description?: string }>;
}) {
  const params = (await searchParams) ?? {};

  if (params.code) {
    const nextQuery = params.next ? `&next=${encodeURIComponent(params.next)}` : "";
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}${nextQuery}`);
  }

  if (params.error || params.error_description) {
    const errorMsg = params.error_description || params.error || "auth_failed";
    redirect(`/login?error=${encodeURIComponent(errorMsg)}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return <LandingPage />;
}
