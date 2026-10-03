'use client';

import { useState } from 'react';
import { Landmark } from 'lucide-react';
import { getInstitutionLogo } from '@repo/shared/logic';
import { cn } from '@/lib/utils';

interface InstitutionLogoProps {
  /** The institution's own web domain (`Institution.domain`), when confidently known. */
  domain?: string;
  /** The institution identifier (e.g. 'HDFC', 'ZERODHA') */
  institutionId?: string;
  /** Name of the bank or broker */
  name?: string;
  /** Explicit logo URL / path if known */
  logo?: string;
  /** Additional custom classNames */
  className?: string;
}

/**
 * Renders an institution logo using bundled high-resolution brand assets first,
 * falling back to Google favicon service, and finally a generic Landmark icon.
 */
export function InstitutionLogo({ domain, institutionId, name, logo, className }: InstitutionLogoProps) {
  const [failed, setFailed] = useState(false);

  // 1. Check direct logo or resolved local bundled asset
  const localLogo = logo || getInstitutionLogo(institutionId) || getInstitutionLogo(name) || getInstitutionLogo(domain);

  if (localLogo && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={localLogo}
        alt={name || institutionId || 'Institution logo'}
        className={cn('size-4 shrink-0 rounded-sm object-contain bg-white/10', className)}
        onError={() => setFailed(true)}
      />
    );
  }

  // 2. Fall back to domain favicon
  if (domain && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`}
        alt=""
        className={cn('size-4 shrink-0 rounded-sm object-contain', className)}
        onError={() => setFailed(true)}
      />
    );
  }

  // 3. Fallback icon
  return <Landmark className={cn('text-muted-foreground size-4 shrink-0', className)} />;
}

