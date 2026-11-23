import { useMemo, useState } from "react";
import { ScrollView, View, Text, TextInput, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { calculateSipFutureValue, calculateLumpsumFutureValue, calculatePnL } from "@repo/shared/logic";

type CalcType = "sip" | "lumpsum" | "pnl";

/**
 * Headless Calculators Container
 * Pure functional data container for SIP, Lumpsum, and PnL calculations.
 */
export default function CalculatorsScreen() {
  const [activeTab, setActiveTab] = useState<CalcType>("sip");

  // SIP inputs
  const [sipMonthly, setSipMonthly] = useState("10000");
  const [sipReturnRate, setSipReturnRate] = useState("12");
  const [sipYears, setSipYears] = useState("10");

  // Lumpsum inputs
  const [lumpPrincipal, setLumpPrincipal] = useState("100000");
  const [lumpReturnRate, setLumpReturnRate] = useState("12");
  const [lumpYears, setLumpYears] = useState("10");

  // P&L inputs
  const [buyPrice, setBuyPrice] = useState("100");
  const [sellPrice, setSellPrice] = useState("150");
  const [qty, setQty] = useState("50");

  const monthlyVal = Number(sipMonthly) || 0;
  const sipYearsVal = Number(sipYears) || 0;
  const sipInvested = monthlyVal * 12 * sipYearsVal;
  const sipFV = useMemo(() => {
    return calculateSipFutureValue(monthlyVal, Number(sipReturnRate) || 0, sipYearsVal);
  }, [monthlyVal, sipReturnRate, sipYearsVal]);
  const sipReturns = Math.max(0, sipFV - sipInvested);

  const lumpPrincipalVal = Number(lumpPrincipal) || 0;
  const lumpYearsVal = Number(lumpYears) || 0;
  const lumpFV = useMemo(() => {
    return calculateLumpsumFutureValue(lumpPrincipalVal, Number(lumpReturnRate) || 0, lumpYearsVal);
  }, [lumpPrincipalVal, lumpReturnRate, lumpYearsVal]);
  const lumpReturns = Math.max(0, lumpFV - lumpPrincipalVal);

  const buyVal = Number(buyPrice) || 0;
  const sellVal = Number(sellPrice) || 0;
  const qtyVal = Number(qty) || 0;
  const totalBuy = buyVal * qtyVal;
  const totalSell = sellVal * qtyVal;
  const pnlResult = useMemo(() => {
    return calculatePnL(buyVal, qtyVal, sellVal);
  }, [buyVal, qtyVal, sellVal]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#ffffff" }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold" }}>Calculators</Text>
          <Text style={{ fontSize: 13, color: "#6b7280" }}>Financial planning mathematical models</Text>
        </View>

        {/* Tab Selector */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {(["sip", "lumpsum", "pnl"] as CalcType[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: "center",
                backgroundColor: activeTab === tab ? "#2563eb" : "#f3f4f6",
                borderRadius: 6,
              }}
            >
              <Text style={{ color: activeTab === tab ? "#ffffff" : "#000000", fontWeight: "600", textTransform: "uppercase" }}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* SIP Calculator */}
        {activeTab === "sip" && (
          <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 12 }}>
            <Text style={{ fontWeight: "bold" }}>Systematic Investment Plan (SIP)</Text>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Monthly Investment (₹)</Text>
              <TextInput
                value={sipMonthly}
                onChangeText={setSipMonthly}
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
              />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Expected Annual Return (%)</Text>
              <TextInput
                value={sipReturnRate}
                onChangeText={setSipReturnRate}
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
              />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Time Period (Years)</Text>
              <TextInput
                value={sipYears}
                onChangeText={setSipYears}
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
              />
            </View>

            <View style={{ padding: 12, backgroundColor: "#f9fafb", borderRadius: 6, gap: 4, marginTop: 8 }}>
              <Text style={{ fontSize: 14 }}>Invested: ₹{Math.round(sipInvested).toLocaleString("en-IN")}</Text>
              <Text style={{ fontSize: 14 }}>Est. Returns: ₹{Math.round(sipReturns).toLocaleString("en-IN")}</Text>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#16a34a" }}>
                Total Value: ₹{Math.round(sipFV).toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        )}

        {/* Lumpsum Calculator */}
        {activeTab === "lumpsum" && (
          <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 12 }}>
            <Text style={{ fontWeight: "bold" }}>Lumpsum Investment Calculator</Text>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Total Investment (₹)</Text>
              <TextInput
                value={lumpPrincipal}
                onChangeText={setLumpPrincipal}
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
              />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Expected Annual Return (%)</Text>
              <TextInput
                value={lumpReturnRate}
                onChangeText={setLumpReturnRate}
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
              />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Time Period (Years)</Text>
              <TextInput
                value={lumpYears}
                onChangeText={setLumpYears}
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
              />
            </View>

            <View style={{ padding: 12, backgroundColor: "#f9fafb", borderRadius: 6, gap: 4, marginTop: 8 }}>
              <Text style={{ fontSize: 14 }}>Invested: ₹{Math.round(lumpPrincipalVal).toLocaleString("en-IN")}</Text>
              <Text style={{ fontSize: 14 }}>Est. Returns: ₹{Math.round(lumpReturns).toLocaleString("en-IN")}</Text>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: "#16a34a" }}>
                Total Value: ₹{Math.round(lumpFV).toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        )}

        {/* P&L Calculator */}
        {activeTab === "pnl" && (
          <View style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 12 }}>
            <Text style={{ fontWeight: "bold" }}>Profit & Loss (P&L) Calculator</Text>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Buy Price (₹)</Text>
              <TextInput
                value={buyPrice}
                onChangeText={setBuyPrice}
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
              />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Sell Price (₹)</Text>
              <TextInput
                value={sellPrice}
                onChangeText={setSellPrice}
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
              />
            </View>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 12, color: "#6b7280" }}>Quantity</Text>
              <TextInput
                value={qty}
                onChangeText={setQty}
                keyboardType="numeric"
                style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 6, padding: 8 }}
              />
            </View>

            <View style={{ padding: 12, backgroundColor: "#f9fafb", borderRadius: 6, gap: 4, marginTop: 8 }}>
              <Text style={{ fontSize: 14 }}>Total Buy: ₹{totalBuy.toLocaleString("en-IN")}</Text>
              <Text style={{ fontSize: 14 }}>Total Sell: ₹{totalSell.toLocaleString("en-IN")}</Text>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: pnlResult.totalPnl >= 0 ? "#16a34a" : "#dc2626",
                }}
              >
                Net P&L: ₹{pnlResult.totalPnl.toLocaleString("en-IN")} ({pnlResult.pctReturn.toFixed(2)}%)
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
