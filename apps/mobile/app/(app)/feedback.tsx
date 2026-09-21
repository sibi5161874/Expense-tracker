import { useEffect, useState } from "react";
import { ScrollView, View, Alert, Image, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Image as ImageIcon, Trash2, Send } from "lucide-react-native";
import { feedbackSchema, type FeedbackInput } from "@repo/shared/schemas";
import { useAuth } from "@/contexts/AuthContext";
import { postWebApi } from "@/lib/webApi";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";
import { useThemeColor } from "@/lib/colors";

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024; // 5MB

export default function FeedbackScreen() {
  const { user, session } = useAuth();
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<FeedbackInput["screenshot"] | undefined>(undefined);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const destructive = useThemeColor("destructive");
  const foreground = useThemeColor("foreground");

  const form = useForm<FeedbackInput>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      name: (user?.user_metadata?.full_name as string) || (user?.email ? user.email.split("@")[0] : ""),
      email: user?.email || "",
      message: "",
    },
  });

  useEffect(() => {
    if (user) {
      const defaultName = (user.user_metadata?.full_name as string) || (user.email ? user.email.split("@")[0] : "");
      if (defaultName && !form.getValues("name")) form.setValue("name", defaultName);
      if (user.email && !form.getValues("email")) form.setValue("email", user.email);
    }
  }, [user, form]);

  async function handlePickScreenshot() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/png", "image/jpeg", "image/jpg", "image/webp"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];
      if (asset.size && asset.size > MAX_SCREENSHOT_BYTES) {
        Alert.alert("File too large", "Screenshot must be under 5MB.");
        return;
      }

      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const ext = asset.name.split(".").pop()?.toLowerCase() || "png";
      const contentType = asset.mimeType || (ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png");
      const dataUrl = `data:${contentType};base64,${base64}`;

      setScreenshotUri(asset.uri);
      setScreenshotPreview({
        dataUrl,
        filename: asset.name,
        contentType,
      });
      form.setValue("screenshot", {
        dataUrl,
        filename: asset.name,
        contentType,
      });
    } catch (e) {
      Alert.alert("Attachment Error", e instanceof Error ? e.message : "Could not attach image.");
    }
  }

  function handleRemoveScreenshot() {
    setScreenshotUri(null);
    setScreenshotPreview(undefined);
    form.setValue("screenshot", undefined);
  }

  async function onSubmit(data: FeedbackInput) {
    if (!session?.access_token) {
      Alert.alert("Authentication required", "Please sign in to send feedback.");
      return;
    }

    setFormError(null);
    setSubmitting(true);
    try {
      await postWebApi("/api/feedback", data, session.access_token);
      setSent(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not send feedback, please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 p-4 pb-32">
        <PageHeader
          title="Feedback"
          description="Found a bug or have an idea? Send it straight to the developer."
        />

        {sent ? (
          <View className="items-center gap-3 rounded-2xl bg-card p-8 text-center border border-border">
            <AppText className="text-xl font-semibold">Thank you! 🎉</AppText>
            <AppText className="text-center text-sm text-muted-foreground">
              Your feedback just landed in the developer's inbox. Every message helps improve the app.
            </AppText>
            <Button
              variant="outline"
              className="mt-4"
              onPress={() => {
                setSent(false);
                form.reset({
                  name: user?.user_metadata?.full_name || user?.email || "",
                  email: user?.email || "",
                  message: "",
                });
                setScreenshotUri(null);
                setScreenshotPreview(undefined);
              }}
            >
              Send more feedback
            </Button>
          </View>
        ) : (
          <View className="gap-4 rounded-2xl bg-card p-5 border border-border">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <TextField
                  label="Your Name"
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Your name"
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <TextField
                  label="Your Email"
                  value={field.value}
                  onChangeText={field.onChange}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="you@example.com"
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="message"
              render={({ field, fieldState }) => (
                <TextField
                  label="Message"
                  value={field.value}
                  onChangeText={field.onChange}
                  multiline
                  numberOfLines={5}
                  placeholder="Tell us what happened, what went wrong, or what you'd like to see..."
                  error={fieldState.error?.message}
                />
              )}
            />

            {/* Screenshot attachment section */}
            <View className="gap-2 pt-1">
              <AppText className="text-sm font-medium">Screenshot (optional)</AppText>
              {screenshotUri && screenshotPreview ? (
                <View className="flex-row items-center justify-between rounded-xl border border-border bg-muted/40 p-3">
                  <View className="flex-row items-center gap-3">
                    <Image source={{ uri: screenshotUri }} style={{ width: 44, height: 44, borderRadius: 6 }} />
                    <View className="max-w-[200px]">
                      <AppText className="truncate text-xs font-medium">{screenshotPreview.filename}</AppText>
                      <AppText className="text-[10px] text-muted-foreground">Attached</AppText>
                    </View>
                  </View>
                  <Pressable onPress={handleRemoveScreenshot} hitSlop={10} className="p-2">
                    <Trash2 size={18} color={destructive} />
                  </Pressable>
                </View>
              ) : (
                <Button
                  variant="outline"
                  onPress={handlePickScreenshot}
                >
                  <View className="flex-row items-center gap-2">
                    <ImageIcon size={18} color={foreground} />
                    <AppText className="text-sm font-medium text-foreground">Attach Screenshot</AppText>
                  </View>
                </Button>
              )}
              <AppText className="text-xs text-muted-foreground">
                PNG, JPG, or WebP up to 5MB. Helpful for bug reports.
              </AppText>
            </View>

            {formError && <AppText className="text-sm text-destructive">{formError}</AppText>}

            <Button
              onPress={form.handleSubmit(onSubmit)}
              disabled={submitting}
              className="mt-2"
            >
              <View className="flex-row items-center gap-2">
                <Send size={18} color="#fff" />
                <AppText className="text-sm font-semibold text-primary-foreground">
                  {submitting ? "Sending..." : "Send Feedback"}
                </AppText>
              </View>
            </Button>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
