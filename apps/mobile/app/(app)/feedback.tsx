import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { postWebApi } from "@/lib/webApi";

/**
 * Headless Feedback Container
 */
export default function FeedbackScreen() {
  const { user, session } = useAuth();
  const [name, setName] = useState(user?.email?.split("@")[0] || "");
  const [email, setEmail] = useState(user?.email || "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!message.trim()) {
      Alert.alert("Missing Message", "Please enter your feedback message.");
      return;
    }
    setSubmitting(true);
    try {
      await postWebApi("/api/feedback", { name, email, message }, session?.access_token || "");
      setSent(true);
    } catch {
      Alert.alert("Error", "Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Submit Feedback</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Report an issue, request a feature, or share your thoughts</Text>
        </View>

        {sent ? (
          <View style={{ padding: 16, backgroundColor: "#f0fdf4", borderRadius: 8, gap: 8 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#16a34a" }}>Thank you!</Text>
            <Text style={{ color: "#4b5563" }}>Your feedback has been submitted to the engineering team.</Text>
            <Pressable onPress={() => { setSent(false); setMessage(""); }} style={{ marginTop: 8 }}>
              <Text style={{ color: "#2563eb", fontWeight: "600" }}>Submit another response</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Your Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
              />
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
              />
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Message</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                placeholder="What can we improve?"
                style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8, height: 100, textAlignVertical: "top" }}
              />
            </View>

            <Pressable
              disabled={submitting}
              onPress={handleSubmit}
              style={{ padding: 12, backgroundColor: "#2563eb", borderRadius: 6, alignItems: "center" }}
            >
              {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={{ color: "#ffffff", fontWeight: "600" }}>Send Feedback</Text>}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
