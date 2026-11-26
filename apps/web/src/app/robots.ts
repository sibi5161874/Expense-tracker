import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://web-six-beta-34.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/features',
          '/how-it-works',
          '/pricing',
          '/reports-overview',
          '/donate',
          '/privacy',
          '/terms',
          '/refund-policy',
          '/login',
          '/signup',
        ],
        disallow: [
          '/api/',
          '/dashboard',
          '/investments',
          '/cashbook',
          '/goals',
          '/assets',
          '/reports',
          '/transactions',
          '/settings',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
