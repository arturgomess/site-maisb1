import type { Metadata } from 'next';
import { DM_Sans, DM_Serif_Display } from 'next/font/google';
import { SiteFooter } from '../components/site-footer';
import { SiteHeader } from '../components/site-header';
import { RouteTheme } from '../components/route-theme';
import { AnalyticsConsent } from '../components/analytics/analytics-consent';
import { PublicAnalyticsTracker } from '../components/analytics/public-analytics-tracker';
import { AnalyticsConsentProvider } from '../components/analytics/analytics-consent-provider';
import { getSiteSettings } from '../lib/content';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-dm-sans',
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-dm-serif',
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    alternates: settings.canonicalUrl ? { canonical: settings.canonicalUrl } : undefined,
    title: {
      default: settings.defaultTitle,
      template: `%s | ${settings.siteName}`,
    },
    description: settings.defaultDescription,
    keywords: settings.defaultKeywords,
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      siteName: settings.siteName,
      title: settings.defaultTitle,
      description: settings.defaultDescription,
      images: settings.ogImage ? [{ url: settings.ogImage, alt: settings.siteName }] : undefined,
    },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${dmSerifDisplay.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=DM+Serif+Display:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <AnalyticsConsentProvider>
          <RouteTheme />
          <SiteHeader />
          <div id="next-page-content">{children}</div>
          <SiteFooter />
          <PublicAnalyticsTracker />
          <AnalyticsConsent />
        </AnalyticsConsentProvider>
      </body>
    </html>
  );
}
