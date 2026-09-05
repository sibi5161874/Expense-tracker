import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { APP_BRANDING } from "@repo/shared/config";

export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="p-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold">
          <Image
            src={APP_BRANDING.logoUrl}
            alt={APP_BRANDING.name}
            width={28}
            height={28}
            className="size-7 rounded-lg"
          />
          {APP_BRANDING.name}
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center p-4 pt-0">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
