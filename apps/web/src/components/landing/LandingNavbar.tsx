'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Wallet } from 'lucide-react';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { APP_BRANDING } from '@repo/shared/config';

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#reports', label: 'Reports' },
  { href: '#pricing', label: 'Pricing' },
];

export function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-xl">
            <Wallet className="size-4.5" />
          </span>
          {APP_BRANDING.name}
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground rounded-xl px-3 py-2 text-sm font-medium transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:brightness-95 active:scale-[0.98]"
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
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-border/60 overflow-hidden border-t md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-foreground rounded-xl px-3 py-2.5 text-sm font-medium"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-border/60 mt-2 flex items-center gap-2 border-t pt-3">
                <Link href="/login" className="text-foreground flex-1 rounded-xl px-3 py-2.5 text-center text-sm font-medium">
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary text-primary-foreground flex-1 rounded-xl px-3 py-2.5 text-center text-sm font-semibold"
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
