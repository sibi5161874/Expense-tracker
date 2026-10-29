'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PieChart, ShieldCheck, FileCheck2 } from 'lucide-react';

const SLIDES = [
  {
    icon: PieChart,
    title: 'Every rupee, one ledger.',
    description: 'Track 14 asset classes — equities to EPF — in a single sovereign dashboard.',
  },
  {
    icon: ShieldCheck,
    title: 'Your data never leaves your device.',
    description: 'Bank-grade client-side encryption. Zero telemetry, zero credential sharing.',
  },
  {
    icon: FileCheck2,
    title: 'Built for the Indian tax code.',
    description: 'CA-ready capital gains schedules, auto-computed for Budget 2024 slabs.',
  },
];

const AUTOPLAY_MS = 4500;

export function AuthCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[index];
  const Icon = slide.icon;

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      <Image
        src="/auth/auth-hero.jpg"
        alt=""
        fill
        priority
        className="object-cover opacity-80"
        sizes="50vw"
      />
      {/* Brand-tinted gradient so the stock art reads as KashMap, not generic stock art */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-primary/20" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-transparent" />

      <div className="relative flex h-full flex-col justify-between p-10">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
          <span className="bg-primary flex size-7 items-center justify-center rounded-lg text-primary-foreground text-xs font-bold">
            K
          </span>
          KashMap
        </div>

        <div className="max-w-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="bg-primary/20 border-primary/30 mb-4 flex size-11 items-center justify-center rounded-xl border backdrop-blur-sm [box-shadow:var(--glass-edge)]">
                <Icon className="text-primary-foreground size-5" />
              </div>
              <h2 className="font-serif text-2xl font-medium leading-snug text-white">
                {slide.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{slide.description}</p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center gap-1.5">
            {SLIDES.map((s, i) => (
              <button
                key={s.title}
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="h-1.5 w-6 overflow-hidden rounded-full bg-white/30 hover:bg-white/50"
              >
                {/* Fixed track width throughout — only the fill's transform animates, never
                    width/height directly (Hallmark floor rule 10a). */}
                <span
                  className="block h-full origin-left scale-x-[0.25] rounded-full bg-primary transition-transform duration-300 motion-reduce:transition-none data-[active=true]:scale-x-100"
                  data-active={i === index}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
