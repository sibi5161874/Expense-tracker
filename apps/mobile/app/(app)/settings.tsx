import { useState, useEffect } from "react";
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useThemePreference } from "@/hooks/useThemePreference";

/**
 * Headless Settings Container
 * Pure functional data container for user profile, theme preference, and account controls.
 */
export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading, saveProfile } = useUserProfile();
  const { preference, setPreference } = useThemePreference();

  const [income, setIncome] = useState("");
  const [expense, setExpense] = useState("");
  const [dependents, setDependents] = useState("0");

  useEffect(() => {
    if (profile) {
      setIncome(profile.monthly_income ? String(profile.monthly_income) : "");
      setExpense(profile.monthly_expense ? String(profile.monthly_expense) : "");
      setDependents(String(profile.number_of_dependents ?? 0));
    }
  }, [profile]);

  async function handleSaveProfile() {
    await saveProfile({
      monthly_income: income ? Number(income) : undefined,
      monthly_expense: expense ? Number(expense) : undefined,
      number_of_dependents: Number(dependents) || 0,
    });
    Alert.alert("Success", "Profile details saved successfully.");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Settings & Profile</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Account information and financial preferences</Text>
        </View>

        {isLoading && <ActivityIndicator />}

        {/* Account Info */}
        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#6b7280", textTransform: "uppercase" }}>
            Account Email
          </Text>
          <Text style={{ fontSize: 16, fontWeight: "600" }}>{user?.email || "Anonymous User"}</Text>
          <Text style={{ fontSize: 12, color: "#6b7280" }}>User ID: {user?.id}</Text>
        </View>

        {/* Profile Details */}
        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: "bold" }}>Financial Profile</Text>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: "#6b7280" }}>Monthly Income (₹)</Text>
            <TextInput
              value={income}
              onChangeText={setIncome}
              keyboardType="numeric"
              placeholder="e.g. 100000"
              style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: "#6b7280" }}>Monthly Expense (₹)</Text>
            <TextInput
              value={expense}
              onChangeText={setExpense}
              keyboardType="numeric"
              placeholder="e.g. 50000"
              style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
            />
          </View>

          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 12, color: "#6b7280" }}>Number of Dependents</Text>
            <TextInput
              value={dependents}
              onChangeText={setDependents}
              keyboardType="numeric"
              placeholder="0"
              style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
            />
          </View>

          <Pressable
            onPress={handleSaveProfile}
            style={{ padding: 10, backgroundColor: "#2563eb", borderRadius: 6, alignItems: "center", marginTop: 4 }}
          >
            <Text style={{ color: "#ffffff", fontWeight: "600" }}>Update Profile</Text>
          </Pressable>
        </View>

        {/* Theme Setting */}
        <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "bold" }}>Theme Preference</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["system", "light", "dark"] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setPreference(t)}
                style={{
                  flex: 1,
                  padding: 8,
                  alignItems: "center",
                  backgroundColor: preference === t ? "#2563eb" : "#f3f4f6",
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: preference === t ? "#ffffff" : "#000000", textTransform: "capitalize" }}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Sign Out Action */}
        <Pressable
          onPress={signOut}
          style={{ padding: 12, backgroundColor: "#fee2e2", borderRadius: 6, alignItems: "center" }}
        >
          <Text style={{ color: "#dc2626", fontWeight: "600" }}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
