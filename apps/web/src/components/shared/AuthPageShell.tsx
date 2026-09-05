import type { ReactNode } from "react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";

export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <LandingNavbar />
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
