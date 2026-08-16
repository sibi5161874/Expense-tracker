import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";

/** Mirrors apps/web/src/app/signup/page.tsx — was previously web-only (RULES.md §13
 * flagged it as out of scope), filling that gap now that mobile has its own auth entry
 * points (anonymous sign-in, this) instead of assuming every user signed up on web. */
export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

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
    const { error } = await signUp(email, password);
    setSubmitting(false);
    if (error) {
      setError(error.message);
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

        <Button variant="ghost" onPress={() => router.replace("/(auth)/login")}>
          Already have an account? Log in
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
