import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/shared/AuthForm";
import { AuthPageShell } from "@/components/shared/AuthPageShell";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string; next?: string; error?: string }>;
}) {
  const params = (await searchParams) ?? {};

  if (params.code) {
    const nextQuery = params.next ? `&next=${encodeURIComponent(params.next)}` : "";
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}${nextQuery}`);
  }

  return (
    <AuthPageShell>
      <div className="space-y-4">
        <AuthForm mode="login" initialError={params.error} />
        <p className="text-muted-foreground text-center text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-foreground underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
