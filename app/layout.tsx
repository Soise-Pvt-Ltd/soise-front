import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Poppins, Molle, Playfair_Display } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import LuxeCursor from '@/components/cursor/LuxeCursor';
import AmbientStatue from '@/components/brand/AmbientStatue';
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  DEFAULT_DESCRIPTION,
  KEYWORDS,
  ORG_JSONLD,
} from '@/lib/seo';
import { Analytics } from '@vercel/analytics/next';

const body_font = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-body',
});

const display_font = Molle({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
});

// High-contrast editorial serif reserved for the LVMH-style private wardrobe
// (the immersive customer profile). Loaded as a CSS variable so it never alters
// the storefront's Poppins body type — it's opt-in via `var(--font-luxe)`.
const luxe_font = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-luxe',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE} | Nigerian Streetwear`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: KEYWORDS,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { telephone: true, email: true },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Creator-Led Streetwear, Worn by the Culture`,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Streetwear from Nigeria`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@soise',
    creator: '@soise',
    title: `${SITE_NAME} — Creator-Led Streetwear, Worn by the Culture`,
    description: DEFAULT_DESCRIPTION,
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'SOISE',
    statusBarStyle: 'black-translucent',
  },
  other: {
    'msapplication-TileColor': '#121212',
    'msapplication-config': '/browserconfig.xml',
  },
  category: 'fashion',
};

export const viewport: Viewport = {
  themeColor: '#121212',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const savedCurrency = cookieStore.get('soise_currency')?.value;
  const initialCurrency =
    savedCurrency === 'USD' || savedCurrency === 'NGN'
      ? savedCurrency
      : undefined;

  return (
    <html
      lang="en-NG"
      className={`${body_font.variable} ${display_font.variable} ${luxe_font.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }}
        />
      </head>
      <body className="font-body 4xl:mx-auto 4xl:max-w-screen-4x mx-auto max-w-screen-2xl antialiased">
        <Providers initialCurrency={initialCurrency}>{children}</Providers>
        <AmbientStatue />
        <LuxeCursor />
        <Analytics />
      </body>
    </html>
  );
}
