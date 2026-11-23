import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kashmap.in';
  const lastModified = new Date();

  const routes = [
    '',
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
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1.0 : route === '/pricing' || route === '/features' ? 0.8 : 0.5,
  }));
}
