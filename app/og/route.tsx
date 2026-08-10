import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_URL, shareCard } from '@/lib/seo';

export const runtime = 'nodejs';

// Regenerate at most hourly. The card is derived from the admin-managed
// homepage hero, so a new drop's hero propagates to every social preview
// without anyone having to re-export an image by hand.
export const revalidate = 3600;

const WIDTH = 1200;
const HEIGHT = 630;

/** The live hero image + headline, straight from the homepage CMS content. */
async function getHero(): Promise<{ img: string; headline: string }> {
  const fallback = {
    img: `${SITE_URL}/hero.jpg`,
    headline: 'Wear the culture',
  };
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) return fallback;
  try {
    const res = await fetch(`${baseUrl}/content/homepage`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return fallback;
    const json = await res.json();
    const img = json?.data?.images?.hero;
    const headline = json?.data?.texts?.hero_headline;
    return {
      // Baseline JPEG at exact card size — satori decodes those reliably and
      // it keeps the fetch to ~100KB instead of the multi-MB original.
      img: img ? shareCard(img) : fallback.img,
      headline: headline || fallback.headline,
    };
  } catch {
    return fallback;
  }
}

/** Brand display serif, so the card reads like the site rather than like a default. */
async function getDisplayFont(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(
      'https://fonts.gstatic.com/s/instrumentserif/v5/jizBRFtNs2ka5fXjeivQ4LroWlx-2zI.ttf',
      { next: { revalidate: 60 * 60 * 24 * 30 } },
    );
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    return await renderCard();
  } catch {
    // A social scraper that gets a 500 caches the failure and shows a bare
    // link — often for days. Falling back to the committed static card means
    // the worst case is a slightly stale image, never a broken preview.
    return Response.redirect(`${SITE_URL}/og-image.jpg`, 302);
  }
}

async function renderCard() {
  const [{ img, headline }, displayFont] = await Promise.all([
    getHero(),
    getDisplayFont(),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: '#121212',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={img}
          alt=""
          width={WIDTH}
          height={HEIGHT}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />

        {/* Scrim. Heavy on purpose: the hero is admin-managed and is often a
            bright outdoor shot (snow, sand, daylight), where a gentle scrim
            leaves white type unreadable.

            Two things satori is fussy about, both learned the hard way here:
            it needs `backgroundImage` (not the `background` shorthand) for
            gradients, and it needs EXPLICIT width/height — a gradient on a
            div sized only by `inset: 0` silently renders as nothing. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: WIDTH,
            height: HEIGHT,
            display: 'flex',
            backgroundImage:
              'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.80) 20%, rgba(0,0,0,0.44) 40%, rgba(0,0,0,0.12) 64%, rgba(0,0,0,0.26) 100%)',
          }}
        />

        {/* Wordmark, top-left */}
        <div
          style={{
            position: 'absolute',
            top: 46,
            left: 56,
            display: 'flex',
            alignItems: 'center',
            fontFamily: 'Display',
            fontSize: 34,
            letterSpacing: 14,
            color: '#ffffff',
          }}
        >
          {SITE_NAME}
        </div>

        {/* Editorial block, bottom-left — mirrors the real hero layout */}
        <div
          style={{
            position: 'absolute',
            left: 56,
            bottom: 52,
            right: 56,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 18,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.88)',
              marginBottom: 14,
            }}
          >
            Say less. Look more.
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: 'Display',
              // Headline copy is admin-editable and varies a lot in length
              // ("Wear the culture" vs "say less, let your drip talk."), so
              // size down and wrap rather than let it run off the card.
              fontSize: headline.length > 22 ? 68 : 90,
              lineHeight: 1.05,
              maxWidth: 1000,
              color: '#ffffff',
            }}
          >
            {headline}
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 20,
              fontSize: 20,
              letterSpacing: 1,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            Creator-led streetwear · Limited capsule drops · soise.ng
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      ...(displayFont
        ? {
            fonts: [
              {
                name: 'Display',
                data: displayFont,
                weight: 400 as const,
                style: 'normal' as const,
              },
            ],
          }
        : {}),
      headers: {
        // Long CDN cache: social scrapers hammer this and each miss costs a
        // cold render plus two upstream fetches.
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, immutable',
      },
    },
  );
}
