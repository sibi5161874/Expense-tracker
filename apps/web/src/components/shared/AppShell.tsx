"use client";

import { Sidebar } from "@/components/shared/Sidebar";
import { MobileNav } from "@/components/shared/MobileNav";
import { PageTransition } from "@/components/shared/PageTransition";
import { AiChatWidget } from "@/components/shared/AiChatWidget";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex h-svh overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 overflow-y-auto p-4 pb-28 md:p-8">
          <PageTransition>{children}</PageTransition>
        </main>
        <MobileNav />
      </div>
      <AiChatWidget />
    </div>
  );
}
