import { useState } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Mail, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/theme/ThemeProvider";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";

/**
 * Material 3 Forgot Password Screen
 */
export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    setError(null);
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    setLoading(true);
    const { error: err } = await resetPasswordForEmail(email);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24, gap: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Icon & Title */}
        <View style={{ alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: theme.primaryContainer,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {sent ? (
              <CheckCircle2 size={28} color={theme.primary} />
            ) : (
              <KeyRound size={28} color={theme.primary} />
            )}
          </View>
          <View style={{ alignItems: "center", gap: 4 }}>
            <AppText style={{ fontSize: 24, fontWeight: "700", color: theme.foreground }}>
              {sent ? "Check Your Inbox" : "Reset Password"}
            </AppText>
            <AppText style={{ fontSize: 13, color: theme.mutedForeground, textAlign: "center", paddingHorizontal: 16 }}>
              {sent
                ? `We sent password reset instructions to ${email}. Follow the link in that email to proceed.`
                : "Enter your registered email and we'll send you a password reset link."}
            </AppText>
          </View>
        </View>

        {error && (
          <Card variant="outlined" style={{ padding: 12, borderColor: theme.destructive + "40", backgroundColor: theme.destructive + "12" }}>
            <AppText style={{ color: theme.destructive, fontSize: 13 }}>{error}</AppText>
          </Card>
        )}

        {!sent ? (
          <Card variant="outlined" style={{ padding: 20, gap: 16 }}>
            <TextField
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              leadingIcon={<Mail size={18} color={theme.mutedForeground} />}
            />
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onPress={handleReset}
              loading={loading}
            >
              Send Reset Link
            </Button>
          </Card>
        ) : (
          <Button
            variant="tonal"
            size="lg"
            className="w-full"
            onPress={() => setSent(false)}
          >
            Send Another Link
          </Button>
        )}

        {/* Back to Login */}
        <Button
          variant="text"
          className="w-full"
          leadingIcon={<ArrowLeft size={16} color={theme.primary} />}
          onPress={() => router.back()}
        >
          Back to Login
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
