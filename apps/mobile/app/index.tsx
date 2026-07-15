import { Redirect } from "expo-router";

export default function RootIndex() {
  // Auth is web-only for now (Phase 1 scope) — mobile auth lands in Phase 4.
  return <Redirect href="/(app)/dashboard" />;
}
