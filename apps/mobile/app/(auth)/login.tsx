import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";

// Sign-up stays web-only for now (RULES.md §13 scope) — this screen only covers sign-in for an
// account already created on web.
export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/(app)/dashboard");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center gap-6 p-6">
        <View className="gap-1.5">
          <AppText className="text-2xl font-semibold tracking-tight">Welcome back</AppText>
          <AppText className="text-sm text-muted-foreground">
            Sign in with the account you created on the web app.
          </AppText>
        </View>

        <View className="gap-4">
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <TextField
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          {error && <AppText className="text-sm text-destructive">{error}</AppText>}
        </View>

        <Button onPress={handleSubmit} disabled={submitting || !email || !password}>
          {submitting ? "Signing in..." : "Log in"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
