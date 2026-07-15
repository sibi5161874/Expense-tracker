import Link from "next/link";
import { AuthForm } from "@/components/shared/AuthForm";
import { AuthPageShell } from "@/components/shared/AuthPageShell";

export default function SignupPage() {
  return (
    <AuthPageShell>
      <div className="space-y-4">
        <AuthForm mode="signup" />
        <p className="text-muted-foreground text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Log in
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}
