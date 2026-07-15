import { View } from "react-native";
import { formatINR } from "@repo/shared/utils";
import { AppText } from "@/components/common/AppText";

export default function TransactionsScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      <AppText style={{ fontSize: 18, fontWeight: "600" }}>Transactions</AppText>
      <AppText style={{ marginTop: 8, textAlign: "center", color: "#666" }}>
        Paginated transaction list lands here in Phase 4, using the same {"\n"}
        @repo/shared query functions, Zod schemas, and formatINR() as web — e.g.{" "}
        {formatINR(0)} is the shared currency formatter already wired up.
      </AppText>
    </View>
  );
}
