import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Nav from '@/components/home/nav/Nav';
import Footer from '@/components/footer';
import StatueWatermark from '@/components/brand/StatueWatermark';
import { SITE_URL, pageMetadata, breadcrumbJsonLd } from '@/lib/seo';

/**
 * PRESSED INK — the editorial page for the queries the brand needs to own:
 * "Nigerian streetwear", "Nigeria streetwear brand fashion" and their
 * variants. The results page for those searches is won by editorial — scene
 * write-ups, brand round-ups — not by storefronts, so this is Soise's own
 * authoritative piece on the culture it sells to. It only ranks if it is
 * genuinely worth reading: the scene is covered honestly (including the other
 * brands that built it) and SOISE is positioned inside that story, not pasted
 * over it.
 */

export const metadata: Metadata = pageMetadata({
  title: 'Nigerian Streetwear — The Brands, the Culture, and the New Wave',
  description:
    'Nigerian streetwear, explained — how brands from Lagos to Abuja turned street fashion into a movement, what defines the culture, and where creator-led labels like SOISE fit in. Plus where to buy Nigerian streetwear online.',
  path: '/nigerian-streetwear',
  ogTitle: 'Nigerian Streetwear — Worn by the Culture',
  type: 'article',
});

const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

/** Index number + rule — the editorial section head, pressed harder. */
function IndexHead({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-x-3">
      <span className="text-[12px] font-bold tracking-[0.08em] text-[#B3101C]">
        {n}
      </span>
      <span className="brut-label">{title}</span>
      <span className="brut-rule mt-auto mb-[6px] flex-1 opacity-20" />
    </div>
  );
}

const FAQ = [
  {
    q: 'What is Nigerian streetwear?',
    a: 'Nigerian streetwear is street fashion designed and made by Nigerian brands — tees, hoodies, denim, beanies and accessories that mix global streetwear language with Nigerian culture, music and identity. It grew out of Lagos skate and music scenes in the early 2010s and has become one of the most influential fashion movements in Africa.',
  },
  {
    q: 'Which Nigerian streetwear brands should I know?',
    a: 'The scene was built by pioneers like Severe Nature and WafflesnCream (both founded in 2012), followed by luxury-leaning labels like Ashluxe and a wave of independents. SOISE is part of the newest wave: a creator-led Nigerian streetwear brand releasing limited capsule drops designed with the stylists, artists and creators shaping the culture.',
  },
  {
    q: 'Where can I buy Nigerian streetwear online?',
    a: 'You can shop Nigerian streetwear directly from brand webstores. SOISE sells online at soise.ng with delivery across Nigeria and worldwide — cards from over 120 countries are accepted, and drops are limited, so pieces sell out.',
  },
  {
    q: 'Does SOISE ship outside Nigeria?',
    a: 'Yes. SOISE ships worldwide with free delivery. Prices are shown in your local currency and international cards are billed in USD.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Nigerian Streetwear — The Brands, the Culture, and the New Wave',
  description:
    'How Nigerian streetwear brands turned street fashion into a movement, and where the creator-led new wave is taking it.',
  url: `${SITE_URL}/nigerian-streetwear`,
  author: { '@id': `${SITE_URL}/#organization` },
  publisher: { '@id': `${SITE_URL}/#organization` },
  image: `${SITE_URL}/og`,
  mainEntityOfPage: `${SITE_URL}/nigerian-streetwear`,
};

export default function NigerianStreetwearPage() {
  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Nigerian Streetwear', path: '/nigerian-streetwear' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Nav />
      <main className="bg-[#F5F0E8] text-[#121212]">
        <div className="relative mx-auto max-w-[880px] px-5 pt-14 pb-24">
          <StatueWatermark
            tone="dark"
            width={520}
            opacity={0.05}
            className="pointer-events-none absolute -top-10 right-[-220px] hidden lg:block"
          />

          {/* ── Masthead ─────────────────────────────────────────── */}
          <header className="brut-rise relative">
            <Image
              src="/main-logo.png"
              alt="Soise"
              width={150}
              height={150}
              priority
              className="h-[72px] w-[72px] object-contain sm:h-[88px] sm:w-[88px]"
            />
            <p className="brut-label mt-8 text-[#B3101C]">A field guide</p>
            <h1
              className="mt-4 text-[44px] leading-[0.95] tracking-tight uppercase sm:text-[76px]"
              style={serif}
            >
              Nigerian streetwear<span className="text-[#B3101C]">.</span>
            </h1>
            <p className="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-[#3F3830]">
              How a generation of Nigerian brands turned street fashion into a
              movement — the history, the culture, and the creator-led new wave.
              Written from inside it.
            </p>
          </header>

          {/* ── 01 The scene ─────────────────────────────────────── */}
          <section className="brut-rise mt-16" style={{ animationDelay: '0.08s' }}>
            <IndexHead n="01" title="The scene" />
            <h2 className="mt-5 text-[26px] leading-[1.05] uppercase sm:text-[36px]" style={serif}>
              Africa&rsquo;s loudest quiet revolution.
            </h2>
            <p className="mt-5 max-w-[58ch] text-[15px] leading-relaxed text-[#3F3830]">
              Over the last decade, Nigeria has become an African style capital,
              and streetwear sits at the heart of it. What started in Lagos skate
              circles and music-video wardrobes is now a full fashion economy —
              homegrown brands, conventions that draw thousands, and a generation
              that treats a tee drop the way an earlier one treated an album
              release. Nigerian streetwear isn&rsquo;t an imitation of New York or
              Tokyo. It is its own dialect: cut for the heat, priced for the
              street, and loaded with local reference.
            </p>
          </section>

          {/* ── 02 The history ───────────────────────────────────── */}
          <section className="brut-rise mt-12" style={{ animationDelay: '0.16s' }}>
            <IndexHead n="02" title="The history" />
            <h2 className="mt-5 text-[26px] leading-[1.05] uppercase sm:text-[36px]" style={serif}>
              Built by pioneers, carried by culture.
            </h2>
            <p className="mt-5 max-w-[58ch] text-[15px] leading-relaxed text-[#3F3830]">
              The modern era traces back to 2012, when Severe Nature set out to
              push street-luxury boundaries and WafflesnCream built a brand on
              Lagos&rsquo;s nascent skate subculture. Labels like Ashluxe later
              took Nigerian streetwear into luxury territory, while conventions
              like Street Souk gave the scene a physical home — thousands of
              young Nigerians buying, selling and styling local-made pieces. Any
              honest telling of this story names those brands. They opened the
              door the new wave now walks through.
            </p>
          </section>

          {/* ── 03 What defines it ───────────────────────────────── */}
          <section className="brut-rise mt-12" style={{ animationDelay: '0.24s' }}>
            <IndexHead n="03" title="What defines it" />
            <div className="brut-plate brut-shadow mt-8 divide-y-2 divide-[#121212] sm:grid sm:grid-cols-3 sm:divide-x-2 sm:divide-y-0">
              {[
                ['Identity first', 'Nigerian streetwear wears its origin openly — language, music, symbols, the city itself.'],
                ['Scarcity', 'Drops are small and finite. The culture values what not everyone can have.'],
                ['The co-sign', 'Style travels through people, not billboards. What the culture wears, the country wears.'],
              ].map(([t, d]) => (
                <div key={t} className="px-6 py-6">
                  <h3 className="text-[19px] leading-none uppercase" style={serif}>
                    {t}
                  </h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-[#5C544A]">{d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── 04 The new wave ──────────────────────────────────── */}
          <section className="brut-rise mt-12" style={{ animationDelay: '0.32s' }}>
            <IndexHead n="04" title="The new wave" />
            <div className="brut-press mt-5 rounded-[2px] border-2 border-[#121212] bg-[#121212] px-6 py-7 text-white sm:px-8 sm:py-9">
              <h2 className="text-[26px] leading-[1.05] uppercase sm:text-[36px]" style={serif}>
                Creator-led is the next chapter.
              </h2>
              <p className="mt-5 max-w-[54ch] text-[15px] leading-relaxed text-white/70">
                SOISE is a Nigerian streetwear brand built for this chapter.
                Instead of designing in a studio and advertising outward, we
                build every capsule with the stylists, artists and creators the
                culture already follows — they wear it first, they earn from
                every piece it moves. Limited runs of hoodies, tees, beanies and
                denim: considered, deliberately scarce, quiet by design. Say
                less, look more.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/shop/product-listing" className="brut-btn-paper brut-press">
                  Shop the current drop
                </Link>
                <Link href="/about" className="brut-btn-paper brut-press">
                  Read the SOISE story
                </Link>
              </div>
            </div>
          </section>

          {/* ── 05 Questions ─────────────────────────────────────── */}
          <section className="brut-rise mt-12" style={{ animationDelay: '0.4s' }}>
            <IndexHead n="05" title="Questions, answered" />
            <dl className="brut-plate brut-shadow mt-8 divide-y-2 divide-[#121212]">
              {FAQ.map(({ q, a }) => (
                <div key={q} className="px-6 py-6">
                  <dt className="text-[19px] leading-tight uppercase" style={serif}>
                    {q}
                  </dt>
                  <dd className="mt-3 max-w-[62ch] text-[14px] leading-relaxed text-[#5C544A]">
                    {a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* ── Colophon ─────────────────────────────────────────── */}
          <footer
            className="brut-rise brut-rule mt-16 pt-8"
            style={{ animationDelay: '0.48s' }}
          >
            <p className="brut-label text-[#B3101C]">From the source</p>
            <p className="mt-3 max-w-[56ch] text-[13px] leading-relaxed text-[#5C544A]">
              Written and maintained by SOISE — a Nigerian streetwear brand,
              incorporated in Abuja, worn across Nigeria and shipped worldwide
              from soise.ng.
            </p>
          </footer>
        </div>
      </main>
      <Footer />
    </>
  );
}
