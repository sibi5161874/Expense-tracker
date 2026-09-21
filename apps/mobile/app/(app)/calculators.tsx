import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Calculator, Sparkles } from "lucide-react-native";
import { useEntitlements } from "@/hooks/useEntitlements";
import { calculateSipFutureValue, calculateLumpsumFutureValue, calculatePnL, calculateWAC } from "@repo/shared/logic";
import { formatINR } from "@repo/shared/utils/currency";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { SegmentedControl } from "@/components/common/SegmentedControl";
import { ProLockedButton } from "@/components/shared/ProGate";
import { useThemeColor } from "@/lib/colors";

type CalcTab = "sip" | "averaging" | "lumpsum" | "pnl";

const TAB_OPTIONS = [
  { value: "sip", label: "SIP" },
  { value: "averaging", label: "Averaging" },
  { value: "lumpsum", label: "Lumpsum" },
  { value: "pnl", label: "P&L" },
];

/** Parses a calculator input field: blank stays 0 rather than NaN, so a half-typed field never blows up a live formula. */
function num(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function Field({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  return <TextField label={suffix ? `${label} (${suffix})` : label} keyboardType="decimal-pad" value={value} onChangeText={onChange} />;
}

function ResultCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "destructive" }) {
  return (
    <View className="flex-1 gap-1 rounded-2xl bg-muted p-4">
      <AppText className="text-xs text-muted-foreground">{label}</AppText>
      <AppText
        className={
          tone === "success"
            ? "text-xl font-semibold text-success"
            : tone === "destructive"
              ? "text-xl font-semibold text-destructive"
              : "text-xl font-semibold"
        }
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {value}
      </AppText>
    </View>
  );
}

function SipCalculator() {
  const [monthly, setMonthly] = useState("10000");
  const [rate, setRate] = useState("12");
  const [years, setYears] = useState("10");
  const fv = useMemo(() => calculateSipFutureValue(num(monthly), num(rate), num(years)), [monthly, rate, years]);
  const invested = num(monthly) * num(years) * 12;

  return (
    <View className="gap-4">
      <Field label="Monthly Amount" value={monthly} onChange={setMonthly} suffix="₹" />
      <Field label="Expected Return" value={rate} onChange={setRate} suffix="% p.a." />
      <Field label="Duration" value={years} onChange={setYears} suffix="years" />
      <View className="flex-row gap-4">
        <ResultCard label="Invested Amount" value={formatINR(invested)} />
        <ResultCard label="Future Value" value={formatINR(fv)} tone="success" />
      </View>
    </View>
  );
}

function AveragingCalculator() {
  const [qty1, setQty1] = useState("10");
  const [price1, setPrice1] = useState("100");
  const [qty2, setQty2] = useState("10");
  const [price2, setPrice2] = useState("120");
  const wac = useMemo(
    () =>
      calculateWAC([
        { qty: num(qty1), price: num(price1) },
        { qty: num(qty2), price: num(price2) },
      ]),
    [qty1, price1, qty2, price2]
  );
  const totalQty = num(qty1) + num(qty2);

  return (
    <View className="gap-4">
      <View className="flex-row gap-4">
        <View className="flex-1">
          <Field label="Quantity 1" value={qty1} onChange={setQty1} />
        </View>
        <View className="flex-1">
          <Field label="Price 1" value={price1} onChange={setPrice1} suffix="₹" />
        </View>
      </View>
      <View className="flex-row gap-4">
        <View className="flex-1">
          <Field label="Quantity 2" value={qty2} onChange={setQty2} />
        </View>
        <View className="flex-1">
          <Field label="Price 2" value={price2} onChange={setPrice2} suffix="₹" />
        </View>
      </View>
      <View className="flex-row gap-4">
        <ResultCard label="Total Quantity" value={totalQty.toLocaleString("en-IN")} />
        <ResultCard label="New Average Price" value={formatINR(wac)} tone="success" />
      </View>
    </View>
  );
}

function LumpsumCalculator() {
  const [amount, setAmount] = useState("100000");
  const [rate, setRate] = useState("10");
  const [years, setYears] = useState("10");
  const fv = useMemo(() => calculateLumpsumFutureValue(num(amount), num(rate), num(years)), [amount, rate, years]);

  return (
    <View className="gap-4">
      <Field label="Amount" value={amount} onChange={setAmount} suffix="₹" />
      <Field label="Expected Return" value={rate} onChange={setRate} suffix="% p.a." />
      <Field label="Duration" value={years} onChange={setYears} suffix="years" />
      <View className="flex-row gap-4">
        <ResultCard label="Invested Amount" value={formatINR(num(amount))} />
        <ResultCard label="Future Value" value={formatINR(fv)} tone="success" />
      </View>
    </View>
  );
}

function PnlCalculator() {
  const [buyPrice, setBuyPrice] = useState("100");
  const [qty, setQty] = useState("10");
  const [currentPrice, setCurrentPrice] = useState("120");
  const result = useMemo(() => calculatePnL(num(buyPrice), num(qty), num(currentPrice)), [buyPrice, qty, currentPrice]);

  return (
    <View className="gap-4">
      <Field label="Buy Price" value={buyPrice} onChange={setBuyPrice} suffix="₹" />
      <Field label="Quantity" value={qty} onChange={setQty} />
      <Field label="Current Price" value={currentPrice} onChange={setCurrentPrice} suffix="₹" />
      <View className="flex-row flex-wrap gap-4">
        <ResultCard label="Total P&L" value={formatINR(result.totalPnl)} tone={result.totalPnl >= 0 ? "success" : "destructive"} />
        <ResultCard
          label="% Return"
          value={`${result.pctReturn >= 0 ? "+" : ""}${result.pctReturn.toFixed(2)}%`}
          tone={result.pctReturn >= 0 ? "success" : "destructive"}
        />
        <ResultCard label="Break-Even Price" value={formatINR(result.breakEvenPrice)} />
      </View>
    </View>
  );
}

export default function CalculatorsScreen() {
  const { hasFeature } = useEntitlements();
  const [tab, setTab] = useState<CalcTab>("sip");
  const mutedForeground = useThemeColor("mutedForeground");
  const info = useThemeColor("info");

  if (!hasFeature("financialCalculators")) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        <ScrollView contentContainerClassName="gap-4 p-4 pb-32">
          <PageHeader title="Calculators" description="SIP, lumpsum, stock averaging, and P&L planning tools." />
          <View className="items-center gap-3 rounded-2xl bg-card p-8">
            <Calculator size={32} color={mutedForeground} />
            <AppText className="text-center text-sm font-medium">The Financial Calculator Suite is a Pro feature.</AppText>
            <AppText className="text-center text-sm text-muted-foreground">
              Start your free trial to unlock SIP, lumpsum, stock averaging, and P&L calculators.
            </AppText>
            <ProLockedButton label="Unlock Calculators" onUpgradePress={() => router.push("/(app)/billing")} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-4 p-4 pb-32">
        <PageHeader title="Calculators" description="SIP, lumpsum, stock averaging, and P&L planning tools." />

        <View className="flex-row items-start gap-3 rounded-2xl bg-card p-4">
          <Sparkles size={18} color={info} />
          <AppText className="flex-1 text-sm text-muted-foreground">
            These tools are for planning, not advice — every result is a projection based on the numbers you
            enter, not a guarantee. Actual returns depend on market performance, which nothing here can predict.
          </AppText>
        </View>

        <View className="gap-6 rounded-2xl bg-card p-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <SegmentedControl options={TAB_OPTIONS} value={tab} onChange={(v) => setTab(v as CalcTab)} />
          </ScrollView>

          {tab === "sip" && <SipCalculator />}
          {tab === "averaging" && <AveragingCalculator />}
          {tab === "lumpsum" && <LumpsumCalculator />}
          {tab === "pnl" && <PnlCalculator />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
