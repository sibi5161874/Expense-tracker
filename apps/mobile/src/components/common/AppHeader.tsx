import { useState } from "react";
import {
  View,
  Pressable,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Sliders,
  Settings,
  CreditCard,
  Sparkles,
  MessageSquare,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Compass,
} from "lucide-react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/theme/ThemeProvider";
import { AppText } from "@/components/common/AppText";
import { Dialog } from "@/components/common/Dialog";
import { IS_PROD_DB, SUPABASE_PROJECT_REF } from "@/lib/supabase";

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function AppHeader({ title = "KashMap", showBack, onBack }: AppHeaderProps) {
  const { theme } = useTheme();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const email = user?.email ?? "User";
  const initials = email.slice(0, 2).toUpperCase();

  function navigateTo(path: any) {
    setMenuOpen(false);
    setTimeout(() => {
      router.push(path);
    }, 150);
  }

  async function handleSignOut() {
    setConfirmSignOut(false);
    setMenuOpen(false);
    await signOut();
    router.replace("/login");
  }

  return (
    <>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.outlineVariant ? `${theme.outlineVariant}25` : "transparent",
          backgroundColor: theme.background,
        }}
      >
        {/* Left: Brand Identity */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {showBack && (
            <Pressable
              onPress={onBack || (() => router.back())}
              hitSlop={12}
              style={{ padding: 4, marginRight: 2 }}
            >
              <ChevronLeft size={22} color={theme.foreground} />
            </Pressable>
          )}

          <Pressable
            onPress={() => router.push("/dashboard")}
            style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            {/* Jewel Logo Container */}
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: theme.primary,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 4,
              }}
            >
              <Sparkles size={18} color={theme.onPrimary ?? "#ffffff"} />
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <AppText style={{ fontSize: 20, fontWeight: "800", letterSpacing: -0.5, color: theme.foreground }}>
                KashMap
              </AppText>
              {!IS_PROD_DB && (
                <View
                  style={{
                    backgroundColor: "#F59E0B22",
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "#F59E0B44",
                  }}
                >
                  <AppText style={{ color: "#D97706", fontSize: 10, fontWeight: "700" }}>DEV</AppText>
                </View>
              )}
            </View>
          </Pressable>
        </View>

        {/* Right: Signature Profile Avatar */}
        <Pressable
          onPress={() => setMenuOpen(true)}
          style={({ pressed }) => [
            {
              flexDirection: "row",
              alignItems: "center",
              padding: 2,
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: theme.primary + "40",
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: theme.primaryContainer,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText style={{ fontSize: 13, fontWeight: "700", color: theme.primary }}>
              {initials}
            </AppText>
          </View>
        </Pressable>
      </View>

      {/* Signature Profile Menu Sheet */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
        statusBarTranslucent
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setMenuOpen(false)} />
          <SafeAreaView
            edges={["bottom"]}
            style={{
              backgroundColor: theme.surfaceContainerHigh || theme.card,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              borderTopWidth: 1,
              borderColor: theme.outlineVariant ? `${theme.outlineVariant}30` : theme.border,
              paddingTop: 8,
              maxHeight: "85%",
            }}
          >
            {/* Grab Handle */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: theme.outlineVariant || "#88888840",
                alignSelf: "center",
                marginBottom: 12,
              }}
            />

            {/* Menu Header / User Identity Card */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: theme.outlineVariant ? `${theme.outlineVariant}20` : "#88888820",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: theme.primaryContainer,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: theme.primary + "30",
                  }}
                >
                  <AppText style={{ fontSize: 17, fontWeight: "700", color: theme.primary }}>
                    {initials}
                  </AppText>
                </View>
                <View style={{ gap: 2 }}>
                  <AppText style={{ fontSize: 16, fontWeight: "700", color: theme.foreground }}>
                    {email}
                  </AppText>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View
                      style={{
                        backgroundColor: IS_PROD_DB ? theme.primary + "18" : "#F59E0B20",
                        paddingHorizontal: 6,
                        paddingVertical: 1,
                        borderRadius: 4,
                      }}
                    >
                      <AppText
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          color: IS_PROD_DB ? theme.primary : "#D97706",
                        }}
                      >
                        {IS_PROD_DB ? "Production" : "Dev DB"} ({SUPABASE_PROJECT_REF})
                      </AppText>
                    </View>
                  </View>
                </View>
              </View>

              <Pressable
                onPress={() => setMenuOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: theme.surfaceContainerHighest || "#88888815",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} color={theme.foreground} />
              </Pressable>
            </View>

            {/* Navigation Options List */}
            <ScrollView
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 4 }}
              showsVerticalScrollIndicator={false}
            >
              <MenuItem
                icon={<Sliders size={20} color={theme.primary} />}
                title="Config & Master Data"
                subtitle="Accounts, categories, budget limits, recurring"
                onPress={() => navigateTo("/config")}
                theme={theme}
              />
              <MenuItem
                icon={<Settings size={20} color={theme.primary} />}
                title="Settings & Appearance"
                subtitle="Light / Dark mode, PRISM accents, profile"
                onPress={() => navigateTo("/settings")}
                theme={theme}
              />
              <MenuItem
                icon={<CreditCard size={20} color={theme.primary} />}
                title="Billing & Subscription"
                subtitle="Unlock Pro reports and smart automated features"
                onPress={() => navigateTo("/billing")}
                theme={theme}
              />
              <MenuItem
                icon={<Compass size={20} color={theme.primary} />}
                title="App Highlights & Tour"
                subtitle="Explore KashMap features and capabilities"
                onPress={() => navigateTo("/onboarding")}
                theme={theme}
              />
              <MenuItem
                icon={<MessageSquare size={20} color={theme.primary} />}
                title="Feedback & Roadmap"
                subtitle="Submit feedback, ideas, or report a bug"
                onPress={() => navigateTo("/feedback")}
                theme={theme}
              />

              {/* Sign Out Button */}
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.outlineVariant ? `${theme.outlineVariant}20` : "#88888820" }}>
                <Pressable
                  onPress={() => setConfirmSignOut(true)}
                  style={({ pressed }) => [
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: 16,
                      backgroundColor: pressed ? theme.destructive + "15" : "transparent",
                    },
                  ]}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      backgroundColor: theme.destructive + "18",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LogOut size={18} color={theme.destructive} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText style={{ fontSize: 15, fontWeight: "600", color: theme.destructive }}>
                      Sign Out
                    </AppText>
                    <AppText style={{ fontSize: 12, color: theme.mutedForeground }}>
                      Safely disconnect active session
                    </AppText>
                  </View>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Sign Out Confirmation Dialog */}
      <Dialog
        visible={confirmSignOut}
        title="Sign Out of KashMap?"
        description="Are you sure you want to end your active session on this device?"
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleSignOut}
        onCancel={() => setConfirmSignOut(false)}
      />
    </>
  );
}

function MenuItem({
  icon,
  title,
  subtitle,
  onPress,
  theme,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  theme: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 16,
          backgroundColor: pressed ? (theme.surfaceContainerHighest || "#88888815") : "transparent",
        },
      ]}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: theme.primaryContainer || "#88888812",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <AppText style={{ fontSize: 14, fontWeight: "600", color: theme.foreground }}>
          {title}
        </AppText>
        <AppText style={{ fontSize: 11, color: theme.mutedForeground }}>
          {subtitle}
        </AppText>
      </View>
      <ChevronRight size={18} color={theme.mutedForeground} />
    </Pressable>
  );
}
