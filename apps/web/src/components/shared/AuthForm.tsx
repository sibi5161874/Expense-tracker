"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  emailPasswordSchema,
  signupSchema,
  type SignupInput,
} from "@repo/shared/schemas";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthFormProps {
  mode: "login" | "signup";
  initialError?: string | null;
}

const emptySubscribe = () => () => {};

export function AuthForm({ mode, initialError }: AuthFormProps) {
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [formError, setFormError] = useState<string | null>(() => {
    if (!initialError) return null;
    if (initialError === "auth_callback_failed") {
      return "Authentication failed or session expired. Please try signing in again.";
    }
    return initialError;
  });
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const isHydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // Login only needs email+password, but the form is typed as SignupInput year-round so
  // switching `mode` doesn't need a second <Form> tree — the login resolver simply never
  // looks at (or requires) confirmPassword, and it's stripped from the parsed output since
  // emailPasswordSchema doesn't declare it.
  const form = useForm<SignupInput>({
    resolver: (
      mode === "signup" ? zodResolver(signupSchema) : zodResolver(emailPasswordSchema)
    ) as Resolver<SignupInput>,
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const isPending = form.formState.isSubmitting;

  async function onSubmit(values: SignupInput) {
    setFormError(null);
    setInfoMessage(null);

    if (mode === "login") {
      const { error } = await signIn(values.email, values.password);
      if (error) {
        setFormError(error.message);
        return;
      }
      router.push("/dashboard");
      return;
    }

    const { user, session, error } = await signUp(values.email, values.password);
    if (error) {
      setFormError(error.message);
      return;
    }

    if (session) {
      // Email confirmation isn't required on this project — the account is already active.
      router.push("/dashboard");
      return;
    }

    // Generic confirmation message to prevent account email enumeration attacks
    setInfoMessage("If an account does not yet exist for this email, a confirmation link has been sent. Otherwise, you can log in.");
    form.reset();
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setFormError(error.message);
      setIsGoogleLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-2xl font-medium tracking-tight text-foreground">
          {mode === "login" ? "Log in" : "Create an account"}
        </CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Welcome back to your finance tracker."
            : "Start tracking your finances."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" data-hydrated={isHydrated ? "true" : undefined}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    {mode === "login" && (
                      <Link href="/forgot-password" className="text-muted-foreground text-xs hover:underline">
                        Forgot password?
                      </Link>
                    )}
                  </div>
                  <FormControl>
                    <PasswordInput
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {mode === "signup" && (
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {formError && <p className="text-destructive text-sm">{formError}</p>}
            {infoMessage && <p className="text-success text-sm">{infoMessage}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {mode === "login" ? "Log in" : "Sign up"}
            </Button>
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-card text-muted-foreground px-2">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
        >
          Google
        </Button>
      </CardContent>
    </Card>
  );
}
