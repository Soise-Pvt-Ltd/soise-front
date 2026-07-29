import type { Metadata, Viewport } from 'next';
import { Poppins, Instrument_Serif, Playfair_Display } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import LuxeCursor from '@/components/cursor/LuxeCursor';
import AmbientStatue from '@/components/brand/AmbientStatue';
import TikTokClickId from '@/components/tracking/TikTokClickId';
import {
  SITE_URL,
  SITE_NAME,
  SITE_TAGLINE,
  DEFAULT_DESCRIPTION,
  KEYWORDS,
  ORG_JSONLD,
  buildOpenGraph,
  buildTwitter,
} from '@/lib/seo';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Only the weights the storefront actually uses. All nine were declared, which
// meant nine woff2 files downloaded AND preloaded on every page — competing for
// bandwidth with the LCP image. 100/200/300/800/900 have zero occurrences
// across app/ and components/.
const body_font = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

// Editorial display serif — sharp, high-fashion, internet-native. Replaces the
// old script font (Molle), which read as playful/hand-made and undercut the
// quiet-luxury positioning. One weight + italic keeps the payload small.
const display_font = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-display',
});

// High-contrast editorial serif reserved for the LVMH-style private wardrobe
// (the immersive customer profile). Loaded as a CSS variable so it never alters
// the storefront's Poppins body type — it's opt-in via `var(--font-luxe)`.
// 400 and 500 only. Four weights x two styles is eight woff2 files preloaded
// on every page, and --font-luxe is only ever used at the default weight,
// font-medium, and once in italic — 600 and 700 are never reached.
const luxe_font = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500'],
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
  openGraph: buildOpenGraph({
    title: `${SITE_NAME} — Creator-Led Streetwear, Worn by the Culture`,
    description: DEFAULT_DESCRIPTION,
    path: '/',
  }),
  twitter: buildTwitter({
    title: `${SITE_NAME} — Creator-Led Streetwear, Worn by the Culture`,
    description: DEFAULT_DESCRIPTION,
  }),
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
      <body className="font-body shell-max antialiased">
        <Providers>{children}</Providers>
        <TikTokClickId />
        <AmbientStatue />
        <LuxeCursor />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
