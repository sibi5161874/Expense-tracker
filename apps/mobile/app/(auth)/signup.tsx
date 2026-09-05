import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";

/** Mirrors apps/web/src/app/signup/page.tsx — mobile now has its own sign-up rather than
 * assuming every user signed up on web, alongside anonymous sign-in as an entry point. */
export default function SignupScreen() {
  const { signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    const { error, cancelled } = await signInWithGoogle();
    setGoogleLoading(false);
    if (cancelled) return;
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/(app)/dashboard");
  }

  async function handleSubmit() {
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    const { user, session, error } = await signUp(email, password);
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }

    // Supabase never errors on a duplicate email at signUp (that would let an attacker probe
    // which emails are registered) — instead it returns a user with no identities.
    if (user && user.identities?.length === 0) {
      setError("An account with this email already exists — try logging in instead.");
      return;
    }

    if (session) {
      // Email confirmation isn't required on this project — the account is already active.
      router.replace("/(app)/dashboard");
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background p-8">
        <AppText className="text-2xl font-bold tracking-tight">Check your email</AppText>
        <AppText className="text-center text-sm text-muted-foreground">
          Confirm the link we sent to {email} to finish creating your account.
        </AppText>
        <Button onPress={() => router.replace("/(auth)/login")}>Back to Login</Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-background">
      <ScrollView contentContainerClassName="flex-1 justify-center gap-6 p-6">
        <View className="gap-1.5">
          <AppText className="text-2xl font-bold tracking-tight">Create your account</AppText>
          <AppText className="text-sm text-muted-foreground">Start tracking your finances.</AppText>
        </View>

        <View className="gap-4">
          <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
          <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
          <TextField label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="••••••••" />
          {error && <AppText className="text-sm text-destructive">{error}</AppText>}
        </View>

        <Button onPress={handleSubmit} disabled={submitting || !email || !password || !confirmPassword}>
          {submitting ? "Creating account..." : "Sign up"}
        </Button>

        <View className="flex-row items-center gap-3">
          <View className="h-px flex-1 bg-border" />
          <AppText className="text-xs uppercase text-muted-foreground">Or continue with</AppText>
          <View className="h-px flex-1 bg-border" />
        </View>

        <Button variant="outline" onPress={handleGoogleSignIn} disabled={googleLoading}>
          {googleLoading ? "Signing in..." : "Google"}
        </Button>

        <Button variant="ghost" onPress={() => router.replace("/(auth)/login")}>
          Already have an account? Log in
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
