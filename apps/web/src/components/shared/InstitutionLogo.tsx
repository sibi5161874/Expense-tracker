'use client';

import { useState } from 'react';
import { Landmark } from 'lucide-react';

interface InstitutionLogoProps {
  /** The institution's own web domain (`Institution.domain`), when confidently known. */
  domain?: string;
}

/**
 * A small favicon for a bank/broker in the import picker — fetched live from Google's public
 * favicon service rather than bundling logo assets here (see institutions.ts's doc comment).
 * Falls back to a generic building icon both when `domain` isn't known and when the favicon
 * request itself fails (a domain typo, or the service being unreachable) — a broken-image icon
 * would look worse than no logo at all.
 */
export function InstitutionLogo({ domain }: InstitutionLogoProps) {
  const [failed, setFailed] = useState(false);

  if (!domain || failed) {
    return <Landmark className="text-muted-foreground size-4 shrink-0" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- a tiny live favicon from an external service, not worth next/image's overhead
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`}
      alt=""
      className="size-4 shrink-0 rounded-sm"
      onError={() => setFailed(true)}
    />
  );
}
