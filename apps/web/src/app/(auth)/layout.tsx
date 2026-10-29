'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { APP_BRANDING } from '@repo/shared/config';
import { AuthCarousel } from '@/components/auth/AuthCarousel';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname?.startsWith('/login');

  return (
    <div className="bg-background flex min-h-svh flex-col overflow-hidden lg:flex-row">
      <motion.div
        layout
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ order: isLogin ? 1 : 0 }}
        className="flex min-h-svh flex-1 flex-col items-center justify-center p-4 sm:p-8"
      >
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center gap-2 text-sm font-semibold tracking-tight">
            <Image
              src={APP_BRANDING.logoUrl}
              alt={APP_BRANDING.name}
              width={28}
              height={28}
              className="size-7 rounded-lg"
            />
            {APP_BRANDING.name}
          </Link>
          {children}
        </div>
      </motion.div>

      <motion.div
        layout
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ order: isLogin ? 0 : 1 }}
        className="hidden flex-1 lg:block"
      >
        <AuthCarousel />
      </motion.div>
    </div>
  );
}
