import { useState } from "react";
import { KeyboardAvoidingView, Platform, View, Linking, Alert } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";

const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_APP_URL;

export default function LoginScreen() {
  const { signIn, signInWithGoogle, signInAnonymously } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [continuingAnonymously, setContinuingAnonymously] = useState(false);

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
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/(app)/dashboard");
  }

  // Password reset needs an emailed link to land somewhere that can complete the exchange —
  // that's a browser, not this app, so this opens the web app's own forgot-password flow in
  // the system browser rather than building a second, deep-link-based recovery flow here.
  async function handleForgotPassword() {
    if (!WEB_APP_URL) {
      Alert.alert("Not configured", "EXPO_PUBLIC_WEB_APP_URL is not set — password reset needs the web app's URL.");
      return;
    }
    await Linking.openURL(`${WEB_APP_URL}/forgot-password`);
  }

  // Opt-in only — an explicit tap, never automatic, so this never silently hides the login
  // form for someone who already has a real account from the web app.
  async function handleContinueAnonymously() {
    setError(null);
    setContinuingAnonymously(true);
    const { error } = await signInAnonymously();
    setContinuingAnonymously(false);
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
          <AppText className="text-2xl font-bold tracking-tight">Welcome back</AppText>
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
          <AppText className="text-right text-xs text-primary" onPress={handleForgotPassword}>
            Forgot password?
          </AppText>
          {error && <AppText className="text-sm text-destructive">{error}</AppText>}
        </View>

        <Button onPress={handleSubmit} disabled={submitting || !email || !password}>
          {submitting ? "Signing in..." : "Log in"}
        </Button>

        <View className="flex-row items-center gap-3">
          <View className="h-px flex-1 bg-border" />
          <AppText className="text-xs uppercase text-muted-foreground">Or continue with</AppText>
          <View className="h-px flex-1 bg-border" />
        </View>

        <Button variant="outline" onPress={handleGoogleSignIn} disabled={googleLoading}>
          {googleLoading ? "Signing in..." : "Google"}
        </Button>

        <Button variant="ghost" onPress={() => router.push("/(auth)/signup")}>
          Don't have an account? Sign up
        </Button>

        <View className="items-center gap-2">
          <AppText className="text-xs text-muted-foreground">Or, try it out first</AppText>
          <Button variant="outline" onPress={handleContinueAnonymously} disabled={continuingAnonymously}>
            {continuingAnonymously ? "Setting up..." : "Continue without an account"}
          </Button>
          <AppText className="px-4 text-center text-xs text-muted-foreground">
            Your data stays on this device's account until you add an email — do that from Settings before
            switching phones or reinstalling, or it can't be recovered.
          </AppText>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
