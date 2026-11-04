"use client";

import Link from "next/link";
import Image from "next/image";
import { Settings } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { APP_BRANDING } from "@repo/shared/config";

/**
 * Mobile top app bar: Logo + App Name on the left, Settings icon + Profile Avatar on the right.
 * Sticky at the top, hidden on desktop (≥ md:) where the desktop sidebar is visible.
 */
export function MobileHeader() {
  const { user } = useAuth();
  const avatarUrl = useAvatarUrl();
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur-md md:hidden">
      {/* Left: Logo + App Name */}
      <Link href="/dashboard" className="flex items-center gap-2.5 transition-opacity active:opacity-80">
        <Image
          src={APP_BRANDING.logoUrl}
          alt={APP_BRANDING.name}
          width={28}
          height={28}
          className="size-7 rounded-lg object-cover ring-1 ring-border/50"
        />
        <span className="font-serif text-lg font-bold tracking-tight text-foreground">
          {APP_BRANDING.name}
        </span>
      </Link>

      {/* Right: Settings Icon + Profile Avatar */}
      <div className="flex items-center gap-1.5">
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground active:scale-95"
        >
          <Settings className="size-5" />
        </Link>
        <Link
          href="/settings"
          aria-label="Profile"
          className="flex size-9 items-center justify-center transition-transform active:scale-95"
        >
          <Avatar className="size-8 ring-1 ring-border/60">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="User Avatar" />}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}

