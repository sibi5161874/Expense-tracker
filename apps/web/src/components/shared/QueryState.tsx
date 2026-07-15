import { AlertCircle, Loader2 } from "lucide-react";
import { parseSupabaseError } from "@repo/shared/utils";

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex h-64 items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ErrorState({ error }: { error: Error }) {
  return (
    <div className="border-destructive/30 bg-destructive-subtle flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border text-center">
      <AlertCircle className="text-destructive size-6" />
      <p className="text-destructive text-sm font-medium">{parseSupabaseError(error)}</p>
    </div>
  );
}
