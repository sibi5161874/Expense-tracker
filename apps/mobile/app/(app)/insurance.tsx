import { useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, ShieldCheck } from "lucide-react-native";
import { useInsurancePolicies } from "@/hooks/useInsurancePolicies";
import { insurancePolicySchema, type InsurancePolicyInput } from "@repo/shared/schemas";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/common/Button";
import { AppText } from "@/components/common/AppText";
import { EmptyState } from "@/components/common/EmptyState";
import { InsuranceCard } from "@/components/insurance/InsuranceCard";
import { AssetForm, type AssetFieldConfig } from "@/components/assets/AssetForm";
import { confirmAssetDelete, findEditingRow, submitAssetForm, toFormDefaults } from "@/components/assets/assetFormHelpers";
import { useThemeColor } from "@/lib/colors";

const FIELDS: readonly AssetFieldConfig<InsurancePolicyInput>[] = [
  { name: "policy_type", label: "Policy Type", type: "enum", options: ["Term", "Health", "Motor", "Other"] },
  { name: "insurer", label: "Insurer", type: "text" },
  { name: "policy_number", label: "Policy Number", type: "text" },
  { name: "coverage_amount", label: "Coverage Amount", type: "number" },
  { name: "premium_amount", label: "Premium Amount", type: "number" },
  { name: "premium_due_date", label: "Premium Due Date", type: "date" },
  { name: "nominee", label: "Nominee", type: "text", optional: true },
];

const EMPTY_DEFAULTS = {
  policy_type: "Term" as const,
  insurer: "",
  policy_number: "",
  coverage_amount: 0,
  premium_amount: 0,
  premium_due_date: "",
};

export default function InsuranceScreen() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { data: policies, isLoading, error, createInsurancePolicy, updateInsurancePolicy, deleteInsurancePolicy } = useInsurancePolicies();
  const primary = useThemeColor("primary");

  function closeSheet() {
    setSheetOpen(false);
    setEditingId(null);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-32">
        <PageHeader
          title="Insurance"
          description="Term, health, motor, and other policies."
          action={
            <Button
              onPress={() => {
                setEditingId(null);
                setSheetOpen(true);
              }}
            >
              <Plus size={16} color="white" />
              <AppText className="text-sm font-medium text-primary-foreground">Add</AppText>
            </Button>
          }
        />

        {isLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator color={primary} />
          </View>
        ) : error ? (
          <AppText className="text-sm text-destructive">{error.message}</AppText>
        ) : policies && policies.length > 0 ? (
          <View className="gap-3">
            {policies.map((policy) => (
              <InsuranceCard
                key={policy.id}
                policy={policy}
                onEdit={() => {
                  setEditingId(policy.id);
                  setSheetOpen(true);
                }}
                onDelete={(id) => confirmAssetDelete(() => deleteInsurancePolicy(id))}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title="No insurance policies yet"
            description="Add your first policy to start tracking coverage and premium due dates."
            action={
              <Button onPress={() => setSheetOpen(true)}>
                <Plus size={16} color="white" />
                <AppText className="text-sm font-medium text-primary-foreground">Add Policy</AppText>
              </Button>
            }
          />
        )}
      </ScrollView>

      <AssetForm
        visible={sheetOpen}
        title={editingId ? "Edit Policy" : "Add Policy"}
        schema={insurancePolicySchema}
        fields={FIELDS}
        defaultValues={toFormDefaults(findEditingRow(policies, editingId), FIELDS, EMPTY_DEFAULTS)}
        onClose={closeSheet}
        onSubmit={(data) => submitAssetForm(editingId, data, createInsurancePolicy, updateInsurancePolicy, closeSheet)}
      />
    </SafeAreaView>
  );
}
