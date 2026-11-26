import { useState } from "react";
import { View, ActivityIndicator, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Send, CheckCircle2, MessageSquare } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { postWebApi } from "@/lib/webApi";
import { PageHeader } from "@/components/common/PageHeader";
import { AppHeader } from "@/components/common/AppHeader";
import { Card } from "@/components/common/Card";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";
import { AppText } from "@/components/common/AppText";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Material 3 Feedback Screen
 */
export default function FeedbackScreen() {
  const { theme } = useTheme();
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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top"]}
    >
      <AppHeader showBack />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="Submit Feedback"
          description="Report an issue, request a feature, or share your thoughts"
        />

        {sent ? (
          <Card variant="outlined" className="p-6 gap-3 border-success/40 bg-success/10">
            <View className="flex-row items-center gap-2">
              <CheckCircle2 size={22} color={theme.success} />
              <AppText className="text-lg font-bold text-success">Thank you!</AppText>
            </View>
            <AppText className="text-sm text-foreground">
              Your feedback has been received and routed directly to the engineering team.
            </AppText>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 self-start"
              onPress={() => {
                setSent(false);
                setMessage("");
              }}
            >
              <AppText className="text-sm font-medium text-foreground">Submit another response</AppText>
            </Button>
          </Card>
        ) : (
          <Card variant="outlined" className="p-5 gap-4">
            <TextField
              label="Your Name"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Rahul Sharma"
            />

            <TextField
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="rahul@example.com"
            />

            <TextField
              label="Feedback Message"
              value={message}
              onChangeText={setMessage}
              multiline
              placeholder="What can we improve? Feature requests, bugs, ideas..."
            />

            <Button
              variant="primary"
              size="lg"
              disabled={submitting}
              onPress={handleSubmit}
              className="mt-2 flex-row items-center justify-center gap-2"
            >
              {submitting ? (
                <ActivityIndicator color={theme.onPrimary} />
              ) : (
                <>
                  <Send size={18} color={theme.onPrimary} />
                  <AppText className="font-semibold text-primary-foreground">Send Feedback</AppText>
                </>
              )}
            </Button>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
