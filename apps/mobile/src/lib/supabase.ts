import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@repo/shared/types";
import { Platform } from "react-native";

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || "https://wkfyfslgfpcybyajjndl.supabase.co";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZnlmc2xnZnBjeWJ5YWpqbmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2OTQ1NzEsImV4cCI6MjA5OTI3MDU3MX0.grButg-0T-WfoPVwYDqxzaGejz_pmb2nzDk6fdj6Q4s";

const storageAdapter =
  Platform.OS === "web" && typeof window !== "undefined"
    ? {
        getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
        setItem: (key: string, value: string) => {
          window.localStorage.setItem(key, value);
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          window.localStorage.removeItem(key);
          return Promise.resolve();
        },
      }
    : AsyncStorage;

export const SUPABASE_URL = supabaseUrl;
export const IS_PROD_DB = supabaseUrl.includes("wkfyfslgfpcybyajjndl");
export const SUPABASE_PROJECT_REF = supabaseUrl.replace("https://", "").split(".")[0];

/**
 * One client for the app's lifetime — cross-platform storage adapter supporting both
 * native (AsyncStorage) and web (localStorage).
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});
