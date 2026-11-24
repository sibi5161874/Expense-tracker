import { useState, useEffect } from "react";
import { View, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Mail, Lock, Sparkles, UserCheck, ArrowRight } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { useTheme } from "@/theme/ThemeProvider";

export default function LoginScreen() {
  const { theme } = useTheme();
  const { user, loading: authLoading, signIn, signInWithGoogle, signInAnonymously } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading]);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await signIn(email.trim(), password);
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      router.replace("/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const { error: err, cancelled } = await signInWithGoogle();
      if (cancelled) {
        setLoading(false);
        return;
      }
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      router.replace("/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Google sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await signInAnonymously();
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      router.replace("/dashboard");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Guest sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top", "bottom"]}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
          paddingVertical: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-6">
          {/* Logo / Brand Header */}
          <View className="items-center gap-3">
            <View
              className="size-16 items-center justify-center rounded-3xl shadow-sm"
              style={{ backgroundColor: theme.primaryContainer }}
            >
              <Sparkles size={32} color={theme.primary} />
            </View>
            <View className="items-center gap-1">
              <AppText className="text-3xl font-extrabold tracking-tight text-foreground">
                KashMap
              </AppText>
              <AppText className="text-sm text-muted-foreground text-center">
                Material 3 Personal Wealth & Finance Tracker
              </AppText>
            </View>
          </View>

          {/* Form Card */}
          <Card variant="outlined" className="gap-4 p-5">
            <AppText className="text-lg font-bold text-foreground">
              Sign In to Your Account
            </AppText>

            {error && (
              <View
                className="rounded-xl border p-3"
                style={{
                  backgroundColor: theme.destructiveSubtle || "#fee2e2",
                  borderColor: theme.destructive,
                }}
              >
                <AppText className="text-xs font-medium text-destructive">{error}</AppText>
              </View>
            )}

            <TextField
              label="Email Address"
              placeholder="you@domain.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leadingIcon={<Mail size={16} color={theme.mutedForeground} />}
            />

            <TextField
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leadingIcon={<Lock size={16} color={theme.mutedForeground} />}
            />

            <Button
              variant="primary"
              onPress={handleLogin}
              loading={loading}
              className="mt-2"
              trailingIcon={<ArrowRight size={16} color={theme.onPrimary} />}
            >
              Sign In
            </Button>

            <View className="flex-row items-center gap-3 my-1">
              <View
                className="flex-1 h-[1px]"
                style={{ backgroundColor: theme.outlineVariant ? `${theme.outlineVariant}44` : theme.border }}
              />
              <AppText className="text-xs text-muted-foreground">or</AppText>
              <View
                className="flex-1 h-[1px]"
                style={{ backgroundColor: theme.outlineVariant ? `${theme.outlineVariant}44` : theme.border }}
              />
            </View>

            <Button
              variant="outline"
              onPress={handleGoogle}
              disabled={loading}
            >
              Continue with Google
            </Button>

            <Button
              variant="tonal"
              onPress={handleGuest}
              disabled={loading}
              leadingIcon={<UserCheck size={16} color={theme.primary} />}
            >
              Try Demo as Guest
            </Button>
          </Card>

          {/* Sign Up Redirect */}
          <View className="flex-row items-center justify-center gap-1.5">
            <AppText className="text-xs text-muted-foreground">
              Don't have an account?
            </AppText>
            <Button
              variant="text"
              size="sm"
              onPress={() => router.push("/signup")}
            >
              Create Account
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
