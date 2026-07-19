import { supabase } from "@/lib/supabase";

/** Kept as a hook (rather than importing the singleton directly) so hook files mirror apps/web 1:1. */
export function useSupabaseClient() {
  return supabase;
}
