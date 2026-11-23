import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Headless Forgot Password Container
 */
export default function ForgotPasswordScreen() {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff", padding: 24, justifyContent: "center" }}>
      <View style={{ gap: 16 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Reset Password</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>
            {sent ? "Check your email for instructions to reset your password." : "Enter your email to receive a password reset link."}
          </Text>
        </View>

        {error && (
          <View style={{ padding: 12, backgroundColor: "#fee2e2", borderRadius: 6 }}>
            <Text style={{ color: "#b91c1c" }}>{error}</Text>
          </View>
        )}

        {!sent && (
          <>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Email</Text>
              <TextInput
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 10 }}
              />
            </View>

            <Pressable
              disabled={loading}
              onPress={handleReset}
              style={{ padding: 12, backgroundColor: "#2563eb", borderRadius: 6, alignItems: "center" }}
            >
              {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={{ color: "#ffffff", fontWeight: "600" }}>Send Reset Link</Text>}
            </Pressable>
          </>
        )}

        <Pressable onPress={() => router.replace("/login")} style={{ alignItems: "center", paddingTop: 8 }}>
          <Text style={{ color: "#2563eb", fontSize: 13 }}>&larr; Back to Sign In</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
