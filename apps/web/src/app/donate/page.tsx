'use client';

import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { FadeIn } from '@/components/landing/FadeIn';
import { DonateContent } from '@/components/donate/DonateContent';

export default function DonatePage() {
  return (
    <div className="bg-background text-foreground min-h-full">
      <LandingNavbar />

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <FadeIn className="mx-auto max-w-2xl text-center">
            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Support KashMap
            </h1>
            <p className="text-muted-foreground mt-4 text-lg">
              KashMap is a labor of love. If it&apos;s helped you get on top of your money, consider
              buying the developer a coffee.
            </p>
          </FadeIn>

          <FadeIn delay={0.1} className="mt-14">
            <DonateContent />
          </FadeIn>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
