import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Headless Login Container
 * Pure functional authentication container supporting Email/Password, Google OAuth, and Anonymous sign-in.
 */
export default function LoginScreen() {
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
    } catch (e: any) {
      setError(e?.message || "Failed to sign in. Please try again.");
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
    } catch (e: any) {
      setError(e?.message || "Google sign in failed.");
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
    } catch (e: any) {
      setError(e?.message || "Guest sign in failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff", padding: 24, justifyContent: "center" }}>
      <View style={{ gap: 16 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 28, fontWeight: "bold" }}>Sign In</Text>
          <Text style={{ fontSize: 14, color: "#6b7280" }}>Access your KashMap wealth dashboard</Text>
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
            autoCorrect={false}
            keyboardType="email-address"
            style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 10 }}
          />
        </View>

        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 12, color: "#6b7280" }}>Password</Text>
          <TextInput
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 10 }}
          />
        </View>

        <Pressable
          disabled={loading}
          onPress={handleLogin}
          style={{ padding: 12, backgroundColor: "#2563eb", borderRadius: 6, alignItems: "center" }}
        >
          {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={{ color: "#ffffff", fontWeight: "600" }}>Sign In</Text>}
        </Pressable>

        <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 8 }}>
          <Pressable onPress={() => router.push("/forgot-password")}>
            <Text style={{ color: "#2563eb", fontSize: 13 }}>Forgot Password?</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/signup")}>
            <Text style={{ color: "#2563eb", fontSize: 13 }}>Create Account</Text>
          </Pressable>
        </View>

        <View style={{ height: 1, backgroundColor: "#e5e7eb", marginVertical: 8 }} />

        <Pressable
          disabled={loading}
          onPress={handleGoogle}
          style={{ padding: 12, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, alignItems: "center" }}
        >
          <Text style={{ fontWeight: "600" }}>Continue with Google</Text>
        </Pressable>

        <Pressable
          disabled={loading}
          onPress={handleGuest}
          style={{ padding: 12, backgroundColor: "#f3f4f6", borderRadius: 6, alignItems: "center" }}
        >
          <Text style={{ color: "#374151" }}>Explore as Guest (Anonymous)</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
