import type { PostgrestError } from "@supabase/supabase-js";

/** Maps raw Postgres/Supabase errors to plain-language, user-facing messages. */
export function parseSupabaseError(error: PostgrestError | Error | null): string {
  if (!error) return "Something went wrong. Please try again.";

  const code = "code" in error ? error.code : undefined;

  switch (code) {
    case "23505":
      return "That entry already exists.";
    case "23503":
      return "This record is linked to other data and can't be changed that way.";
    case "23514":
      return "That value isn't valid for this field.";
    case "42501":
      return "You don't have permission to do that.";
    default:
      return "Couldn't complete that action. Please try again.";
  }
}
