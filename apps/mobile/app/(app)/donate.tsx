import { useState } from "react";
import { ScrollView, View, Image, Linking, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Coffee, Smartphone, Copy, Check } from "lucide-react-native";
import { PageHeader } from "@/components/common/PageHeader";
import { AppText } from "@/components/common/AppText";
import { TextField } from "@/components/common/TextField";
import { Button } from "@/components/common/Button";
import { Chip } from "@/components/common/Chip";

const BMC_URL = "https://buymeacoffee.com/sibi24sibi5";
const UPI_ID = "sibi24sibi-1@okicici";
const UPI_PAYEE_NAME = "sibi V";
const DEFAULT_NOTE = "Thanks for KashMap!";

const NOTE_PRESETS = [
  { label: "Casual", value: "Thanks for KashMap! ☕" },
  { label: "Formal", value: "Supporting KashMap's development — thank you." },
  { label: "Cheerful", value: "Loving the app, keep up the great work! 🎉" },
];

function buildUpiUri(note: string): string {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_PAYEE_NAME,
    aid: "uGICAgIDN-LfKBQ",
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

export default function DonateScreen() {
  const [note, setNote] = useState(DEFAULT_NOTE);
  const [copied, setCopied] = useState(false);

  async function handleBuyMeACoffee() {
    await Linking.openURL(BMC_URL);
  }

  async function handlePayViaUpiApp() {
    const upiUri = buildUpiUri(note);
    const supported = await Linking.canOpenURL(upiUri).catch(() => false);
    if (!supported) {
      Alert.alert(
        "UPI App Not Found",
        "No installed UPI app could handle this request. You can copy the UPI ID below to pay via GPay, PhonePe, Paytm, or BHIM."
      );
      return;
    }
    await Linking.openURL(upiUri);
  }

  function handleCopyUpi() {
    setCopied(true);
    Alert.alert("UPI ID Copied", `Copied "${UPI_ID}" to clipboard.`);
    setTimeout(() => setCopied(false), 2000);
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    buildUpiUri(note)
  )}`;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 p-4 pb-32">
        <PageHeader title="Donate" description="Support KashMap with a coffee or a UPI donation." />

        {/* Buy Me a Coffee Card */}
        <View className="items-center gap-3 rounded-2xl bg-card p-6 text-center border border-border">
          <View className="size-12 items-center justify-center rounded-full bg-[#FFDD00]/20">
            <Coffee size={24} color="#D97706" />
          </View>
          <AppText className="text-lg font-semibold">Buy me a coffee</AppText>
          <AppText className="text-center text-sm text-muted-foreground">
            If KashMap has been useful to you, a coffee goes a long way — every bit keeps development going.
          </AppText>
          <Button
            onPress={handleBuyMeACoffee}
            className="mt-2 w-full bg-[#FFDD00]"
          >
            <View className="flex-row items-center gap-2">
              <Coffee size={18} color="#000" />
              <AppText className="font-semibold text-black">Buy me a coffee</AppText>
            </View>
          </Button>
        </View>

        {/* Donate via UPI Card */}
        <View className="gap-4 rounded-2xl bg-card p-6 border border-border">
          <AppText className="text-lg font-semibold">Donate via UPI</AppText>
          <AppText className="text-sm text-muted-foreground">
            Scan the QR code with any UPI app (GPay, PhonePe, Paytm), or tap the button below.
          </AppText>

          <View className="items-center justify-center py-2">
            <View className="overflow-hidden rounded-2xl border border-border bg-white p-3">
              <Image source={{ uri: qrUrl }} style={{ width: 180, height: 180 }} />
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <View className="flex-1 rounded-xl bg-muted px-4 py-3">
              <AppText className="font-mono text-xs text-foreground">{UPI_ID}</AppText>
            </View>
            <Button
              variant="outline"
              size="sm"
              onPress={handleCopyUpi}
            >
              <View className="flex-row items-center gap-1.5">
                {copied ? <Check size={16} color="#22c55e" /> : <Copy size={16} />}
                <AppText className="text-xs font-medium text-foreground">{copied ? "Copied" : "Copy"}</AppText>
              </View>
            </Button>
          </View>

          <View className="gap-2">
            <TextField
              label="Note to include"
              value={note}
              onChangeText={setNote}
              maxLength={50}
              placeholder="Thanks for KashMap!"
            />
            <View className="flex-row flex-wrap gap-2 pt-1">
              {NOTE_PRESETS.map((preset) => (
                <Chip
                  key={preset.label}
                  label={preset.label}
                  selected={note === preset.value}
                  onPress={() => setNote(preset.value)}
                />
              ))}
            </View>
          </View>

          <Button
            variant="outline"
            onPress={handlePayViaUpiApp}
            className="mt-2"
          >
            <View className="flex-row items-center gap-2">
              <Smartphone size={18} />
              <AppText className="text-sm font-medium text-foreground">Pay via UPI app</AppText>
            </View>
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
