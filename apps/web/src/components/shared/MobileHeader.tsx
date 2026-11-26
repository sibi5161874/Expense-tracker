"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Settings, Sliders, CreditCard, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAvatarUrl } from "@/hooks/useAvatarUrl";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { APP_BRANDING } from "@repo/shared/config";

/**
 * Mobile top app bar: Logo + App Name on the left, Profile Avatar on the right opening
 * the executive profile dropdown (Config, Settings, Billing, Sign Out).
 * Sticky at the top, hidden on desktop (≥ md:) where the desktop sidebar is visible.
 */
export function MobileHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const avatarUrl = useAvatarUrl();
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "??";

  async function handleSignOut() {
    setShowSignOutConfirm(false);
    await signOut();
    router.push("/login");
  }

  return (
    <>
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

        {/* Right: Signature Profile Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="User Profile Menu"
            className="flex size-9 items-center justify-center transition-transform active:scale-95 outline-none"
          >
            <Avatar className="size-8 ring-2 ring-primary/30">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="User Avatar" />}
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-xl">
            <DropdownMenuLabel className="px-2 py-1.5 font-normal">
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-semibold leading-none text-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground">KashMap Account</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => router.push("/config")} className="gap-2.5 py-2 cursor-pointer">
              <Sliders className="size-4 text-primary" />
              <span>Config & Rules</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => router.push("/settings")} className="gap-2.5 py-2 cursor-pointer">
              <Settings className="size-4 text-primary" />
              <span>Settings & Appearance</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => router.push("/billing")} className="gap-2.5 py-2 cursor-pointer">
              <CreditCard className="size-4 text-primary" />
              <span>Billing & Pro Plans</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setShowSignOutConfirm(true)}
              className="gap-2.5 py-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
            >
              <LogOut className="size-4 text-destructive" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <ConfirmDialog
        open={showSignOutConfirm}
        onOpenChange={setShowSignOutConfirm}
        title="Sign Out of KashMap?"
        description="Are you sure you want to end your current session?"
        confirmLabel="Sign Out"
        destructive
        onConfirm={handleSignOut}
      />
    </>
  );
}
