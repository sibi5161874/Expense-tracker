import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Headless Signup Container
 * Functional registration container.
 */
export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSignup() {
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { session, error: err } = await signUp(email, password);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (session) {
      router.replace("/dashboard");
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff", padding: 24, justifyContent: "center" }}>
        <View style={{ gap: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Check your email</Text>
          <Text style={{ color: "#6b7280", textAlign: "center" }}>
            A confirmation link was sent to {email}. Follow the link to finish setting up your account.
          </Text>
          <Pressable onPress={() => router.replace("/login")} style={{ marginTop: 12 }}>
            <Text style={{ color: "#2563eb", fontWeight: "600" }}>Back to Sign In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff", padding: 24, justifyContent: "center" }}>
      <View style={{ gap: 16 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 28, fontWeight: "bold" }}>Create Account</Text>
          <Text style={{ fontSize: 14, color: "#6b7280" }}>Start tracking your Indian wealth portfolio</Text>
        </View>

        {error && (
          <View style={{ padding: 12, backgroundColor: "#fee2e2", borderRadius: 6 }}>
            <Text style={{ color: "#b91c1c" }}>{error}</Text>
          </View>
        )}

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

        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: "#6b7280" }}>Password</Text>
          <TextInput
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 10 }}
          />
        </View>

        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: "#6b7280" }}>Confirm Password</Text>
          <TextInput
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 10 }}
          />
        </View>

        <Pressable
          disabled={loading}
          onPress={handleSignup}
          style={{ padding: 12, backgroundColor: "#2563eb", borderRadius: 6, alignItems: "center" }}
        >
          {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={{ color: "#ffffff", fontWeight: "600" }}>Sign Up</Text>}
        </Pressable>

        <Pressable onPress={() => router.push("/login")} style={{ alignItems: "center", paddingTop: 8 }}>
          <Text style={{ color: "#2563eb", fontSize: 13 }}>Already have an account? Sign In</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
