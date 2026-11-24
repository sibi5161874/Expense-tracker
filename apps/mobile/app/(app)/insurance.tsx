import { useState } from "react";
import { View, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Shield } from "lucide-react-native";
import { useInsurancePolicies } from "@/hooks/useInsurancePolicies";
import type { InsurancePolicy } from "@repo/shared/types";

import { AppText } from "@/components/common/AppText";
import { Fab } from "@/components/common/Fab";
import { InsuranceCard } from "@/components/insurance/InsuranceCard";
import { useTheme } from "@/theme/ThemeProvider";

export default function InsuranceScreen() {
  const { theme } = useTheme();
  const { data: policies, isLoading, error, deleteInsurancePolicy } = useInsurancePolicies();

  const policyList = policies ?? [];

  const handleDelete = (id: string) => {
    Alert.alert("Delete Policy", "Are you sure you want to delete this insurance policy?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteInsurancePolicy(id),
      },
    ]);
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.background }}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 96,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="gap-1">
          <AppText className="text-2xl font-bold tracking-tight text-foreground">
            Insurance Policies
          </AppText>
          <AppText className="text-xs text-muted-foreground">
            {policyList.length} active policies covering health, life & assets
          </AppText>
        </View>

        {isLoading && (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        )}

        {error && (
          <View
            className="rounded-2xl border p-4"
            style={{
              backgroundColor: theme.destructiveSubtle || "#fee2e2",
              borderColor: theme.destructive,
            }}
          >
            <AppText className="text-xs text-destructive">{error.message}</AppText>
          </View>
        )}

        {policyList.length === 0 && !isLoading ? (
          <View className="items-center justify-center p-8 gap-3">
            <View
              className="size-16 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.surfaceContainerHighest }}
            >
              <Shield size={28} color={theme.mutedForeground} />
            </View>
            <AppText className="text-base font-semibold text-foreground">
              No insurance policies logged
            </AppText>
            <AppText className="text-center text-xs text-muted-foreground">
              Track term life, health, motor, and personal accident policies.
            </AppText>
          </View>
        ) : (
          <View className="gap-3">
            {policyList.map((p) => (
              <InsuranceCard
                key={p.id}
                policy={p}
                onEdit={() => {}}
                onDelete={handleDelete}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
