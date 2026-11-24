import { useState } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Mail, Lock, Sparkles, CheckCircle2, ArrowRight } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { useTheme } from "@/theme/ThemeProvider";

export default function SignupScreen() {
  const { theme } = useTheme();
  const { signUp } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSignup() {
    setError(null);
    if (!email.trim() || !password) {
      setError("Please fill out all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { session, error: err } = await signUp(email.trim(), password);
      if (err) {
        setError(err.message);
        return;
      }
      if (session) {
        router.replace("/dashboard");
      } else {
        setDone(true);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: theme.background }}
        edges={["top", "bottom"]}
      >
        <View className="flex-1 items-center justify-center p-8 gap-4">
          <View
            className="size-16 items-center justify-center rounded-3xl"
            style={{ backgroundColor: theme.successSubtle || "#dcfce7" }}
          >
            <CheckCircle2 size={36} color={theme.success} />
          </View>
          <AppText className="text-2xl font-bold text-foreground">
            Check Your Email
          </AppText>
          <AppText className="text-sm text-center text-muted-foreground leading-5">
            A confirmation link was sent to {email}. Follow the instructions to activate your KashMap account.
          </AppText>
          <Button
            variant="primary"
            onPress={() => router.replace("/login")}
            className="mt-4"
          >
            Back to Sign In
          </Button>
        </View>
      </SafeAreaView>
    );
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
          {/* Header */}
          <View className="items-center gap-2">
            <View
              className="size-14 items-center justify-center rounded-3xl"
              style={{ backgroundColor: theme.primaryContainer }}
            >
              <Sparkles size={28} color={theme.primary} />
            </View>
            <AppText className="text-2xl font-extrabold tracking-tight text-foreground">
              Create KashMap Account
            </AppText>
            <AppText className="text-xs text-muted-foreground">
              Track net worth, stocks, cash flow & debts
            </AppText>
          </View>

          {/* Form Card */}
          <Card variant="outlined" className="gap-4 p-5">
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
              label="Password (min. 6 characters)"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leadingIcon={<Lock size={16} color={theme.mutedForeground} />}
            />

            <TextField
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              leadingIcon={<Lock size={16} color={theme.mutedForeground} />}
            />

            <Button
              variant="primary"
              onPress={handleSignup}
              loading={loading}
              className="mt-2"
              trailingIcon={<ArrowRight size={16} color={theme.onPrimary} />}
            >
              Create Account
            </Button>
          </Card>

          {/* Sign In Redirect */}
          <View className="flex-row items-center justify-center gap-1.5">
            <AppText className="text-xs text-muted-foreground">
              Already have an account?
            </AppText>
            <Button
              variant="text"
              size="sm"
              onPress={() => router.replace("/login")}
            >
              Sign In
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
