"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  // next-themes leaves resolvedTheme undefined until its client-side script has resolved
  // the actual theme (it can't be known during SSR) — that's the mount signal already, so
  // there's no need for a separate mounted-state-plus-effect to get the same information.
  if (resolvedTheme === undefined) {
    return <Button variant="ghost" size="icon" className="size-9" disabled />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
    </Button>
  );
}
