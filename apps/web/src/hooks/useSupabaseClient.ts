import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useSupabaseClient() {
  const [supabase] = useState(() => createClient());
  return supabase;
}
