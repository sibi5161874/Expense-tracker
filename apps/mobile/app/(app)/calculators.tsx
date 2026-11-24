import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calculator, TrendingUp, PiggyBank, ArrowDownUp } from "lucide-react-native";
import { calculateSipFutureValue, calculateLumpsumFutureValue, calculatePnL } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/common/Card";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { TextField } from "@/components/common/TextField";
import { AppText } from "@/components/common/AppText";
import { AmountText } from "@/components/common/AmountText";
import { useTheme } from "@/theme/ThemeProvider";

type CalcType = "sip" | "lumpsum" | "pnl";

const CALC_OPTIONS = [
  { value: "sip", label: "SIP" },
  { value: "lumpsum", label: "Lumpsum" },
  { value: "pnl", label: "P&L" },
];

/**
 * Material 3 Calculators Screen
 * Pure functional data container for SIP, Lumpsum, and PnL calculations.
 */
export default function CalculatorsScreen() {
  const { theme } = useTheme();
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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        <PageHeader
          title="Calculators"
          description="Financial planning mathematical models"
        />

        {/* Tab Selector */}
        <SegmentedControl
          options={CALC_OPTIONS}
          value={activeTab}
          onChange={(val) => setActiveTab(val as CalcType)}
        />

        {/* SIP Calculator */}
        {activeTab === "sip" && (
          <Card variant="outlined" className="gap-4 p-5">
            <View className="flex-row items-center gap-2">
              <PiggyBank size={20} color={theme.primary} />
              <AppText className="text-base font-semibold text-foreground">
                Systematic Investment Plan (SIP)
              </AppText>
            </View>

            <TextField
              label="Monthly Investment (₹)"
              value={sipMonthly}
              onChangeText={setSipMonthly}
              keyboardType="numeric"
              placeholder="10000"
            />
            <TextField
              label="Expected Annual Return (%)"
              value={sipReturnRate}
              onChangeText={setSipReturnRate}
              keyboardType="numeric"
              placeholder="12"
            />
            <TextField
              label="Time Period (Years)"
              value={sipYears}
              onChangeText={setSipYears}
              keyboardType="numeric"
              placeholder="10"
            />

            <View className="rounded-2xl border border-outline-variant/40 bg-surface-container-highest/60 p-4 gap-2.5 mt-1">
              <View className="flex-row justify-between items-center">
                <AppText className="text-sm text-muted-foreground">Invested Amount</AppText>
                <AppText className="text-sm font-semibold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                  {formatINR(Math.round(sipInvested))}
                </AppText>
              </View>
              <View className="flex-row justify-between items-center">
                <AppText className="text-sm text-muted-foreground">Est. Wealth Gain</AppText>
                <AmountText value={Math.round(sipReturns)} sign="positive" className="text-sm font-semibold" />
              </View>
              <View className="pt-2 border-t border-border/60 flex-row justify-between items-center">
                <AppText className="text-base font-bold text-foreground">Total Maturity Value</AppText>
                <AppText className="text-lg font-bold text-success" style={{ fontVariant: ["tabular-nums"] }}>
                  {formatINR(Math.round(sipFV))}
                </AppText>
              </View>
            </View>
          </Card>
        )}

        {/* Lumpsum Calculator */}
        {activeTab === "lumpsum" && (
          <Card variant="outlined" className="gap-4 p-5">
            <View className="flex-row items-center gap-2">
              <TrendingUp size={20} color={theme.primary} />
              <AppText className="text-base font-semibold text-foreground">
                Lumpsum Investment Calculator
              </AppText>
            </View>

            <TextField
              label="Total Investment (₹)"
              value={lumpPrincipal}
              onChangeText={setLumpPrincipal}
              keyboardType="numeric"
              placeholder="100000"
            />
            <TextField
              label="Expected Annual Return (%)"
              value={lumpReturnRate}
              onChangeText={setLumpReturnRate}
              keyboardType="numeric"
              placeholder="12"
            />
            <TextField
              label="Time Period (Years)"
              value={lumpYears}
              onChangeText={setLumpYears}
              keyboardType="numeric"
              placeholder="10"
            />

            <View className="rounded-2xl border border-outline-variant/40 bg-surface-container-highest/60 p-4 gap-2.5 mt-1">
              <View className="flex-row justify-between items-center">
                <AppText className="text-sm text-muted-foreground">Invested Amount</AppText>
                <AppText className="text-sm font-semibold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                  {formatINR(Math.round(lumpPrincipalVal))}
                </AppText>
              </View>
              <View className="flex-row justify-between items-center">
                <AppText className="text-sm text-muted-foreground">Est. Wealth Gain</AppText>
                <AmountText value={Math.round(lumpReturns)} sign="positive" className="text-sm font-semibold" />
              </View>
              <View className="pt-2 border-t border-border/60 flex-row justify-between items-center">
                <AppText className="text-base font-bold text-foreground">Total Maturity Value</AppText>
                <AppText className="text-lg font-bold text-success" style={{ fontVariant: ["tabular-nums"] }}>
                  {formatINR(Math.round(lumpFV))}
                </AppText>
              </View>
            </View>
          </Card>
        )}

        {/* P&L Calculator */}
        {activeTab === "pnl" && (
          <Card variant="outlined" className="gap-4 p-5">
            <View className="flex-row items-center gap-2">
              <ArrowDownUp size={20} color={theme.primary} />
              <AppText className="text-base font-semibold text-foreground">
                Profit & Loss (P&L) Calculator
              </AppText>
            </View>

            <TextField
              label="Buy Price (₹)"
              value={buyPrice}
              onChangeText={setBuyPrice}
              keyboardType="numeric"
              placeholder="100"
            />
            <TextField
              label="Sell Price (₹)"
              value={sellPrice}
              onChangeText={setSellPrice}
              keyboardType="numeric"
              placeholder="150"
            />
            <TextField
              label="Quantity"
              value={qty}
              onChangeText={setQty}
              keyboardType="numeric"
              placeholder="50"
            />

            <View className="rounded-2xl border border-outline-variant/40 bg-surface-container-highest/60 p-4 gap-2.5 mt-1">
              <View className="flex-row justify-between items-center">
                <AppText className="text-sm text-muted-foreground">Total Buy Value</AppText>
                <AppText className="text-sm font-semibold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                  {formatINR(totalBuy)}
                </AppText>
              </View>
              <View className="flex-row justify-between items-center">
                <AppText className="text-sm text-muted-foreground">Total Sell Value</AppText>
                <AppText className="text-sm font-semibold text-foreground" style={{ fontVariant: ["tabular-nums"] }}>
                  {formatINR(totalSell)}
                </AppText>
              </View>
              <View className="pt-2 border-t border-border/60 flex-row justify-between items-center">
                <AppText className="text-base font-bold text-foreground">Net P&L</AppText>
                <View className="flex-row items-center gap-1.5">
                  <AmountText
                    value={pnlResult.totalPnl}
                    sign={pnlResult.totalPnl >= 0 ? "positive" : "negative"}
                    className="text-lg font-bold"
                  />
                  <AppText
                    className={pnlResult.totalPnl >= 0 ? "text-sm text-success font-semibold" : "text-sm text-destructive font-semibold"}
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    ({pnlResult.pctReturn >= 0 ? "+" : ""}{pnlResult.pctReturn.toFixed(2)}%)
                  </AppText>
                </View>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
