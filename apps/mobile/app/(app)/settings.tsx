import { useState, useEffect } from "react";
import { View, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { User, Mail, DollarSign, Users, LogOut, Check, Zap, Bell } from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { AppHeader } from "@/components/common/AppHeader";
import { AppText } from "@/components/common/AppText";
import { Card } from "@/components/common/Card";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";
import { Dialog } from "@/components/common/Dialog";
import { AppearanceCard } from "@/components/settings/AppearanceCard";
import { DataManagementCard } from "@/components/settings/DataManagementCard";
import { useTheme } from "@/theme/ThemeProvider";
import { openQuickAddScreen } from "@/services/quickNotificationService";

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const { data: profile, isLoading, saveProfile } = useUserProfile();

  const [income, setIncome] = useState("");
  const [expense, setExpense] = useState("");
  const [dependents, setDependents] = useState("0");
  const [saving, setSaving] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  useEffect(() => {
    if (profile) {
      setIncome(profile.monthly_income ? String(profile.monthly_income) : "");
      setExpense(profile.monthly_expense ? String(profile.monthly_expense) : "");
      setDependents(String(profile.number_of_dependents ?? 0));
    }
  }, [profile]);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await saveProfile({
        monthly_income: income ? Number(income) : undefined,
        monthly_expense: expense ? Number(expense) : undefined,
        number_of_dependents: Number(dependents) || 0,
      });
      Alert.alert("Success", "Profile details saved successfully.");
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    setConfirmSignOut(true);
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top"]}
    >
      <AppHeader showBack />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 96,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="gap-1">
          <AppText className="text-2xl font-bold tracking-tight text-foreground">
            Settings & Profile
          </AppText>
          <AppText className="text-xs text-muted-foreground">
            Manage your account, appearance, and financial preferences
          </AppText>
        </View>

        {isLoading && (
          <View className="py-2 items-center">
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        )}

        {/* Account Info Card */}
        <Card variant="outlined" className="gap-3">
          <View className="flex-row items-center gap-3">
            <View
              className="size-11 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.primaryContainer }}
            >
              <User size={22} color={theme.primary} />
            </View>
            <View className="flex-1">
              <AppText className="text-base font-bold text-foreground">
                {user?.email || "Anonymous User"}
              </AppText>
              <AppText className="text-xs text-muted-foreground">
                UID: {user?.id?.slice(0, 16)}...
              </AppText>
            </View>
          </View>
        </Card>

        {/* Appearance & PRISM Accent Picker */}
        <AppearanceCard />

        {/* Financial Profile Card */}
        <Card variant="outlined" className="gap-4">
          <AppText className="text-sm font-bold text-foreground">
            Financial Profile
          </AppText>
          <TextField
            label="Monthly Income (₹)"
            placeholder="e.g. 75000"
            value={income}
            onChangeText={setIncome}
            keyboardType="numeric"
            leadingIcon={<DollarSign size={16} color={theme.mutedForeground} />}
          />
          <TextField
            label="Monthly Expense (₹)"
            placeholder="e.g. 35000"
            value={expense}
            onChangeText={setExpense}
            keyboardType="numeric"
            leadingIcon={<DollarSign size={16} color={theme.mutedForeground} />}
          />
          <TextField
            label="Number of Dependents"
            placeholder="0"
            value={dependents}
            onChangeText={setDependents}
            keyboardType="numeric"
            leadingIcon={<Users size={16} color={theme.mutedForeground} />}
          />
          <Button
            variant="primary"
            onPress={handleSaveProfile}
            loading={saving}
            leadingIcon={<Check size={16} color={theme.onPrimary} />}
          >
            Save Profile
          </Button>
        </Card>

        {/* Quick Add Launcher Card */}
        <Card variant="outlined" className="p-4 gap-3">
          <View className="flex-row items-center gap-3">
            <View
              className="size-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: theme.primaryContainer }}
            >
              <Zap size={20} color={theme.primary} />
            </View>
            <View className="flex-1">
              <AppText className="text-sm font-bold text-foreground">
                Quick-Add Floating Launcher
              </AppText>
              <AppText className="text-xs text-muted-foreground">
                Fast overlay to log expenses without loading the full app
              </AppText>
            </View>
          </View>
          <Button
            variant="tonal"
            size="default"
            onPress={openQuickAddScreen}
            leadingIcon={<Zap size={16} color={theme.primary} />}
          >
            Open Quick-Add Overlay
          </Button>
        </Card>

        {/* Data Management Card */}
        <DataManagementCard />

        {/* Sign Out Action */}
        <Button
          variant="destructive"
          onPress={handleSignOut}
          leadingIcon={<LogOut size={16} color={theme.destructive} />}
        >
          Sign Out
        </Button>
      </ScrollView>

      {/* React Native Sign Out Confirmation Dialog */}
      <Dialog
        visible={confirmSignOut}
        title="Sign Out of KashMap?"
        description="Are you sure you want to end your active session on this device?"
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        destructive
        onConfirm={async () => {
          setConfirmSignOut(false);
          await signOut();
          router.replace("/login");
        }}
        onCancel={() => setConfirmSignOut(false)}
      />
    </SafeAreaView>
  );
}
