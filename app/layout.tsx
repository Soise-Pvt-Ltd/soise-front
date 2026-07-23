import type { Metadata, Viewport } from 'next';
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
import { SpeedInsights } from '@vercel/speed-insights/next';

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
  // No cookies()/headers() here: reading them would opt every route into
  // dynamic rendering. The saved currency preference is restored client-side in
  // CurrencyProvider (from the soise_currency cookie) so all pages under this
  // layout can be statically generated and served as CDN cache hits.
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
        <script
          dangerouslySetInnerHTML={{
            __html: `!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};


  ttq.load('D9E3SJ3C77U2EG6DMPMG');
  ttq.page();
}(window, document, 'ttq');`,
          }}
        />
      </head>
      <body className="font-body 4xl:mx-auto 4xl:max-w-screen-4x mx-auto max-w-screen-2xl antialiased">
        <Providers>{children}</Providers>
        <AmbientStatue />
        <LuxeCursor />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
