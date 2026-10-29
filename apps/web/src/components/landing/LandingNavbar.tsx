'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { APP_BRANDING } from '@repo/shared/config';

const LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/reports-overview', label: 'Reports' },
  { href: '/pricing', label: 'Pricing' },
];

export function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="glass-surface sticky top-0 z-50">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <Image src={APP_BRANDING.logoUrl} alt={APP_BRANDING.name} width={28} height={28} className="size-7 rounded-lg" />
          {APP_BRANDING.name}
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="bg-primary text-primary-foreground rounded-full px-3.5 py-1.5 text-[13px] font-semibold shadow-sm transition-[filter,transform] hover:brightness-95 active:scale-[0.98]"
          >
            Get started free
          </Link>
        </div>

        <button
          className="text-foreground md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ gridTemplateRows: '0fr', opacity: 0 }}
            animate={{ gridTemplateRows: '1fr', opacity: 1 }}
            exit={{ gridTemplateRows: '0fr', opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-border/60 grid overflow-hidden border-t md:hidden"
          >
            <div className="flex min-h-0 flex-col gap-1 px-4 py-4">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-foreground rounded-xl px-3 py-2.5 text-sm font-medium"
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-border/60 mt-2 flex items-center gap-2 border-t pt-3">
                <Link href="/login" className="text-foreground flex-1 rounded-full px-3 py-2.5 text-center text-sm font-medium">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary text-primary-foreground flex-1 rounded-full px-3 py-2.5 text-center text-sm font-semibold"
                >
                  Get started free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
