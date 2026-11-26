import { useRef, useState } from "react";
import {
  View,
  Image,
  FlatList,
  Dimensions,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TrendingUp,
  PieChart,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react-native";
import { ONBOARDING_SLIDES, type OnboardingSlide } from "@repo/shared/config";
import { AppText } from "@/components/common/AppText";
import { Button } from "@/components/common/Button";
import { useTheme } from "@/theme/ThemeProvider";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ICON_MAP: Record<string, any> = {
  TrendingUp,
  PieChart,
  ShieldCheck,
  Sparkles,
};

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  async function completeOnboarding() {
    try {
      await AsyncStorage.setItem("@kashmap/has-seen-onboarding", "true");
    } finally {
      router.replace("/login");
    }
  }

  function handleNext() {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    } else {
      completeOnboarding();
    }
  }

  function handleMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    setCurrentIndex(index);
  }

  const isLast = currentIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top", "bottom"]}>
      {/* Top Header: Brand Wordmark + Skip Action */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 24,
          paddingVertical: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Image
            source={require("../../assets/logo.jpg")}
            style={{ width: 28, height: 28, borderRadius: 14 }}
            resizeMode="cover"
          />
          <AppText style={{ fontSize: 18, fontWeight: "800", color: theme.foreground, letterSpacing: -0.3 }}>
            KashMap
          </AppText>
        </View>
        {!isLast && (
          <Pressable onPress={completeOnboarding} hitSlop={14} style={{ padding: 4 }}>
            <AppText style={{ fontSize: 14, fontWeight: "700", color: theme.primary }}>
              Skip
            </AppText>
          </Pressable>
        )}
      </View>

      {/* Slide Carousel */}
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onScrollToIndexFailed={(info) => {
          flatListRef.current?.scrollToOffset({
            offset: info.index * SCREEN_WIDTH,
            animated: true,
          });
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        renderItem={({ item }) => {
          const IconComponent = ICON_MAP[item.iconName] || Sparkles;
          return (
            <View
              style={{
                width: SCREEN_WIDTH,
                paddingHorizontal: 32,
                justifyContent: "center",
                alignItems: "center",
                gap: 28,
              }}
            >
              {/* Feature Hero Illustration Squircle */}
              <View
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: 36,
                  backgroundColor: theme.primaryContainer || "#E0E7FF",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.2,
                  shadowRadius: 18,
                  elevation: 8,
                }}
              >
                <IconComponent size={64} color={theme.primary} strokeWidth={1.8} />
              </View>

              {/* Text Group */}
              <View style={{ alignItems: "center", gap: 12, paddingHorizontal: 8 }}>
                <View
                  style={{
                    backgroundColor: theme.primary + "18",
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <AppText style={{ fontSize: 11, fontWeight: "700", color: theme.primary, letterSpacing: 0.8 }}>
                    {item.badge}
                  </AppText>
                </View>

                <AppText
                  style={{
                    fontSize: 26,
                    fontWeight: "800",
                    color: theme.foreground,
                    textAlign: "center",
                    letterSpacing: -0.5,
                  }}
                >
                  {item.title}
                </AppText>

                <AppText
                  style={{
                    fontSize: 14,
                    color: theme.mutedForeground,
                    textAlign: "center",
                    lineHeight: 22,
                  }}
                >
                  {item.description}
                </AppText>
              </View>
            </View>
          );
        }}
      />

      {/* Footer: Indicator Dots & Action Buttons */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 20, gap: 24 }}>
        {/* Animated Pill Dots */}
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 }}>
          {ONBOARDING_SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: "clamp",
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                key={i}
                style={{
                  height: 8,
                  width: dotWidth,
                  borderRadius: 4,
                  backgroundColor: theme.primary,
                  opacity,
                }}
              />
            );
          })}
        </View>

        {/* Action Button */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onPress={handleNext}
          trailingIcon={
            isLast ? (
              <Check size={18} color={theme.onPrimary} />
            ) : (
              <ArrowRight size={18} color={theme.onPrimary} />
            )
          }
        >
          {isLast ? "Get Started" : "Continue"}
        </Button>
      </View>
    </SafeAreaView>
  );
}
