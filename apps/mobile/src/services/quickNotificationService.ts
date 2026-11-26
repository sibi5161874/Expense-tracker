import { Platform } from "react-native";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const NOTIFICATION_STORAGE_KEY = "@kashmap/persistent_quick_add_notification";

export async function isQuickNotificationEnabled(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
    return val === "true";
  } catch {
    return false;
  }
}

export async function setQuickNotificationEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, enabled ? "true" : "false");
}

export function openQuickAddScreen(): void {
  Linking.openURL("moneymanager://quick-add");
}
