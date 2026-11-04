import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { APP_BRANDING } from "@repo/shared/config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: APP_BRANDING.name,
  description: APP_BRANDING.tagline,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true' &&
          process.env.NEXT_PUBLIC_ADSENSE_CLIENT &&
          process.env.NEXT_PUBLIC_E2E_MODE !== 'true' && (
            <Script
              id="adsense-script"
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
              strategy="afterInteractive"
              crossOrigin="anonymous"
            />
          )}
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <CurrencyProvider>
                <LocaleProvider>
                  {children}
                  <Toaster />
                </LocaleProvider>
              </CurrencyProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
