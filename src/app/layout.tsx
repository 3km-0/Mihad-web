import type { Metadata, Viewport } from 'next';
import {
  Inter,
  Instrument_Serif,
  JetBrains_Mono,
  Noto_Sans_Arabic,
} from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { MsalProvider } from '@/components/providers/MsalProvider';
import { ThemeInitializer } from '@/components/providers/ThemeInitializer';
import { absoluteUrl } from '@/lib/seo';
import './globals.css';

const sourceSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-source-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-instrument-serif',
  display: 'swap',
});

const vectorSans = Inter({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl('/')),
  title: {
    default: 'Mihad',
    template: '%s | Mihad',
  },
  description:
    'Mihad is Saudi Arabia’s private digest of exceptional homes, quietly open to serious interest through screened confidential inquiry.',
  applicationName: 'Mihad',
  keywords: [
    'private Saudi homes',
    'luxury home digest',
    'confidential property inquiry',
    'screened serious interest',
    'owner-controlled showcase',
  ],
  authors: [{ name: 'Mihad' }],
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  alternates: {
    canonical: absoluteUrl('/home'),
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Mihad',
    description:
      'Exceptional Saudi homes. Privately showcased. Quietly open to serious interest.',
    url: absoluteUrl('/home'),
    siteName: 'Mihad',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: absoluteUrl('/icon.png'),
        width: 512,
        height: 512,
        alt: 'Mihad',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mihad',
    description:
      'Exceptional Saudi homes. Privately showcased. Quietly open to serious interest.',
    images: [absoluteUrl('/icon.png')],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={dir}
      data-theme="zohal-dark"
      className={`${sourceSerif.variable} ${inter.variable} ${notoSansArabic.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} ${vectorSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          <MsalProvider>
            <ThemeInitializer />
            {children}
          </MsalProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
