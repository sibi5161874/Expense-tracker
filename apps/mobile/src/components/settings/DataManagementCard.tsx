import { useState } from "react";
import { Alert, View } from "react-native";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import { Download, Trash2 } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";
import { useThemeColor } from "@/lib/colors";

const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_APP_URL;

/**
 * Thin wrappers around apps/web's /api/account/export and /api/account/delete — same
 * routes web's own Settings → Data tab calls, now reachable from mobile too via a Bearer
 * token (see apps/web/src/lib/supabase/bearer.ts) since there's no cookie session here to
 * carry the request. Deletion still needs the service_role key to actually remove the
 * account, which is exactly why this stays a server call rather than something done
 * client-side — RULES.md §2 is unambiguous about that key never reaching a client bundle.
 */
export function DataManagementCard() {
  const { session, user, signOut } = useAuth();
  const foreground = useThemeColor("foreground");
  const destructive = useThemeColor("destructive");
  const [isExporting, setIsExporting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleExport() {
    if (!WEB_APP_URL || !session) return;
    setIsExporting(true);
    try {
      const res = await fetch(`${WEB_APP_URL}/api/account/export`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const body = await res.text();
      if (!res.ok) throw new Error("Export failed");

      const filename = `kashmap-export-${new Date().toISOString().slice(0, 10)}.json`;
      const uri = `${FileSystem.cacheDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(uri, body, { encoding: "utf8" as FileSystem.EncodingType });

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error("Sharing isn't available on this device.");
      }
      await Sharing.shareAsync(uri, { mimeType: "application/json", dialogTitle: filename });
    } catch (e) {
      Alert.alert("Export failed", e instanceof Error ? e.message : "Couldn't export your data, try again.");
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDelete() {
    if (!WEB_APP_URL || !session) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`${WEB_APP_URL}/api/account/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ confirm_email: confirmEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      await signOut();
      router.replace("/(auth)/login");
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
      setIsDeleting(false);
    }
  }

  const emailMatches = confirmEmail.trim().toLowerCase() === (user?.email ?? "").toLowerCase();

  if (!WEB_APP_URL) {
    return (
      <View className="gap-2 rounded-2xl bg-card p-5">
        <AppText className="text-sm font-semibold">Your Data</AppText>
        <AppText className="text-sm text-muted-foreground">
          EXPO_PUBLIC_WEB_APP_URL is not configured — data export and account deletion need the
          deployed web app's URL.
        </AppText>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <View className="gap-3 rounded-2xl bg-card p-5">
        <View>
          <AppText className="text-sm font-semibold">Export your data</AppText>
          <AppText className="mt-1 text-sm text-muted-foreground">
            Download everything — accounts, transactions, investments, assets, goals, budgets — as
            one JSON file.
          </AppText>
        </View>
        <Button variant="outline" onPress={handleExport} disabled={isExporting}>
          <Download size={16} color={foreground} />
          <AppText className="text-sm font-medium">{isExporting ? "Preparing…" : "Export all data (JSON)"}</AppText>
        </Button>
      </View>

      <View className="gap-3 rounded-2xl bg-destructive-subtle p-5">
        <View>
          <AppText className="text-sm font-semibold text-destructive">Delete account</AppText>
          <AppText className="mt-1 text-sm text-muted-foreground">
            Permanently deletes your account and every record in it. This cannot be undone — export
            your data first if you might want it later.
          </AppText>
        </View>

        {!confirmOpen ? (
          <Button variant="outline" onPress={() => setConfirmOpen(true)}>
            <Trash2 size={16} color={destructive} />
            <AppText className="text-sm font-medium text-destructive">Delete my account</AppText>
          </Button>
        ) : (
          <View className="gap-3">
            <AppText className="text-sm text-muted-foreground">
              Type <AppText className="font-medium text-foreground">{user?.email}</AppText> to confirm.
            </AppText>
            <TextField
              label="Confirm email"
              value={confirmEmail}
              onChangeText={setConfirmEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Type your email to confirm"
            />
            {deleteError && <AppText className="text-sm text-destructive">{deleteError}</AppText>}
            <View className="flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onPress={() => {
                  setConfirmOpen(false);
                  setConfirmEmail("");
                  setDeleteError(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onPress={handleDelete}
                disabled={isDeleting || !emailMatches}
              >
                {isDeleting ? "Deleting…" : "Permanently delete"}
              </Button>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
