import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@repo/shared/schemas";
import { useAuth } from "@/contexts/AuthContext";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";

export default function ForgotPasswordScreen() {
  const { resetPasswordForEmail } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setFormError(null);
    const { error } = await resetPasswordForEmail(values.email);
    if (error) {
      setFormError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-background"
    >
      <View className="flex-1 justify-center gap-6 p-6">
        <View className="gap-1.5">
          <AppText className="text-2xl font-bold tracking-tight">Reset your password</AppText>
          <AppText className="text-sm text-muted-foreground">
            {sent
              ? "Check your email for instructions to reset your password."
              : "Enter your email address and we'll send you a password reset link."}
          </AppText>
        </View>

        {!sent ? (
          <View className="gap-4">
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <TextField
                  label="Email"
                  value={field.value}
                  onChangeText={field.onChange}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="you@example.com"
                  error={fieldState.error?.message}
                />
              )}
            />

            {formError && <AppText className="text-sm text-destructive">{formError}</AppText>}

            <Button
              onPress={form.handleSubmit(onSubmit)}
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Sending..." : "Send reset link"}
            </Button>
          </View>
        ) : (
          <View className="rounded-2xl bg-card p-5 gap-3">
            <AppText className="text-sm text-success">
              Password reset link sent! Check your inbox.
            </AppText>
          </View>
        )}

        <Button variant="ghost" onPress={() => router.replace("/(auth)/login")}>
          Back to login
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
