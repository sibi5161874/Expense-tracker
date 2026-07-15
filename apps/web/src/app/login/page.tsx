import Link from "next/link";
import { AuthForm } from "@/components/shared/AuthForm";
import { AuthPageShell } from "@/components/shared/AuthPageShell";

export default function LoginPage() {
  return (
    <AuthPageShell>
      <div className="space-y-4">
        <AuthForm mode="login" />
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
