import { useState } from "react";
import { View } from "react-native";
import { supabase } from "@/lib/supabase";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";

/**
 * Shown only for an anonymous session (see AuthContext's `isAnonymous`). Upgrades the same
 * `auth.uid()` to a real account via `updateUser` — no data migration needed, every row
 * already carries this user's id. Without this, an anonymous account is unrecoverable if
 * the device is lost, reset, or the app is reinstalled.
 */
export function AnonymousUpgradeCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleUpgrade() {
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ email, password });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <View className="gap-2 rounded-2xl bg-success-subtle p-5">
        <AppText className="text-sm font-semibold text-success">Check your email</AppText>
        <AppText className="text-sm text-muted-foreground">
          Confirm the link we sent to {email} to finish securing your account.
        </AppText>
      </View>
    );
  }

  return (
    <View className="gap-4 rounded-2xl bg-warning-subtle p-5">
      <View>
        <AppText className="text-sm font-semibold">Save your data</AppText>
        <AppText className="mt-1 text-sm text-muted-foreground">
          You're using this app without an account — if this device is lost, reset, or the app is
          reinstalled, everything you've entered is unrecoverable. Add an email and password to secure it
          (same data, nothing to migrate).
        </AppText>
      </View>

      <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />

      {error && <AppText className="text-sm text-destructive">{error}</AppText>}

      <Button onPress={handleUpgrade} disabled={submitting || !email || !password}>
        {submitting ? "Saving..." : "Secure My Account"}
      </Button>
    </View>
  );
}
