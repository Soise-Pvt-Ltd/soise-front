import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Nav from '@/components/home/nav/Nav';
import Footer from '@/components/footer';
import StatueWatermark from '@/components/brand/StatueWatermark';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'About',
  description:
    'SOISE is creator-led streetwear built on a simple truth — people wear what they see the culture wearing. Considered capsule drops, quiet luxury, and a stage for the creatives shaping what comes next. Say less, look more.',
  path: '/about',
  ogTitle: 'About SOISE — Worn by the Culture',
  ogDescription:
    'Creator-led streetwear, considered capsule drops, and a stage for the creatives shaping the culture. Say less, look more.',
});

/**
 * PRESSED INK — the brand story, letterpressed. This page is where the old
 * quiet-luxury editorial register was written, so it keeps its bones (the
 * masthead, the numbered chapters, the colophon) and swaps the materials:
 * 2px ink rules for hairlines, hard offset shadows for flat cards, the ad
 * creatives' crimson for gold, Instrument Serif for Playfair.
 *
 * Renders inside the global site Nav/Footer, so there is no standalone
 * masthead bar here — the site chrome already does that job.
 */

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

export default function AboutPage() {
  return (
    <>
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
            <p className="brut-label mt-8 text-[#B3101C]">Say less, look more</p>
            <h1
              className="mt-4 text-[52px] leading-[0.95] tracking-tight uppercase sm:text-[86px]"
              style={serif}
            >
              Style isn’t announced. It’s seen<span className="text-[#B3101C]">.</span>
            </h1>
            <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-[#3F3830]">
              SOISE is creator-led streetwear, built on a truth as old as fashion
              itself — people wear what they see the culture wearing. So we put the
              culture first, and let the clothes follow.
            </p>
          </header>

          {/* ── 01 The insight ───────────────────────────────────── */}
          <section className="brut-rise mt-16" style={{ animationDelay: '0.08s' }}>
            <IndexHead n="01" title="The insight" />
            <div className="brut-press mt-5 rounded-[2px] border-2 border-[#121212] bg-[#121212] px-6 py-7 text-white sm:px-8 sm:py-9">
              <h2 className="text-[26px] leading-[1.05] uppercase sm:text-[36px]" style={serif}>
                Nobody is sold a look. They’re shown one.
              </h2>
              <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-white/70">
                A friend, a stranger on your feed, the creator you can’t scroll past —
                that’s how style actually travels. SOISE is designed around it:
                creator-led, visual-first, made to be seen before it’s ever sold. The
                marketing isn’t bolted onto the product. It <em>is</em> the product
                strategy.
              </p>
            </div>
          </section>

          {/* ── 02 The mission ───────────────────────────────────── */}
          <section className="brut-rise mt-12" style={{ animationDelay: '0.16s' }}>
            <IndexHead n="02" title="The mission" />
            <div className="mt-5 grid items-center gap-8 lg:grid-cols-[1fr_0.7fr]">
              <div>
                <h2 className="text-[26px] leading-[1.05] uppercase sm:text-[36px]" style={serif}>
                  A stage for the culture’s makers.
                </h2>
                <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-[#3F3830]">
                  The country is full of creatives — stylists, visual artists,
                  designers — with the eye and the vision, but nowhere to stand. SOISE
                  is that stage. Every drop is a collaboration. Every code is a credit.
                  Every sale moves us toward a creator economy that actually pays its
                  own.
                </p>
              </div>
              <div className="brut-plate brut-shadow flex justify-center px-6 py-8">
                <StatueWatermark tone="dark" width={240} opacity={0.9} />
              </div>
            </div>
          </section>

          {/* ── 03 The product ───────────────────────────────────── */}
          <section className="brut-rise mt-12" style={{ animationDelay: '0.24s' }}>
            <IndexHead n="03" title="The product" />
            <h2 className="mt-5 text-[26px] leading-[1.05] uppercase sm:text-[36px]" style={serif}>
              Considered, and deliberately scarce.
            </h2>
            <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-[#3F3830]">
              Tees, hoodies, beanies, denim — released in limited capsule drops,
              never in floods. We would rather make less and make it matter. Quiet
              luxury for people who don’t need to raise their voice to be heard.
            </p>
            {/* One plate, ruled into three — not three shadowed cards. */}
            <div className="brut-plate brut-shadow mt-8 divide-y-2 divide-[#121212] sm:grid sm:grid-cols-3 sm:divide-x-2 sm:divide-y-0">
              {[
                ['Creator-led', 'Built with the people the culture already follows.'],
                ['Capsule drops', 'Limited runs. Once it’s gone, it’s gone.'],
                ['Quiet luxury', 'Considered cuts. Nothing loud. Say less, look more.'],
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

          {/* ── 04 The ethos ─────────────────────────────────────── */}
          <section className="brut-rise mt-12" style={{ animationDelay: '0.32s' }}>
            <IndexHead n="04" title="The ethos" />
            <h2 className="mt-5 text-[26px] leading-[1.05] uppercase sm:text-[36px]" style={serif}>
              Say less, look more.
            </h2>
            <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-[#3F3830]">
              Our mark is a classical muse held inside a Greek-key loop — timeless
              form, drawn into the now. It’s a quiet reminder that the loudest thing
              in the room rarely has the most to say. We make pieces that let your
              look do the talking, and a loop that keeps the value moving between the
              people who make culture and the people who wear it.
            </p>
          </section>

          {/* ── 05 The long game ─────────────────────────────────── */}
          <section className="brut-rise mt-12" style={{ animationDelay: '0.4s' }}>
            <IndexHead n="05" title="The long game" />
            <h2 className="mt-5 text-[26px] leading-[1.05] uppercase sm:text-[36px]" style={serif}>
              We’re building this in chapters.
            </h2>
            {/* Ruled rows inside one plate: a sequence reads as a list, not as
                three competing objects. */}
            <ol className="brut-plate brut-shadow mt-8 divide-y-2 divide-[#121212]">
              {[
                ['Now', 'Lean drops, real creators, real reach. Small runs that sell out and prove the model.'],
                ['Next', 'A home where creators and community build together — collaboration, credit, and the numbers to show for it.'],
                ['Then', 'The designers and makers who scale it into something bigger, without losing the soul.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-5 px-6 py-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[2px] border-2 border-[#B3101C] text-[13px] font-bold text-[#B3101C]">
                    {i + 1}
                  </span>
                  <div>
                    <p className="brut-label">{t}</p>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-[#5C544A]">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* ── 06 CTA — the heaviest plate is the one we want pressed ── */}
          <section className="brut-rise mt-12" style={{ animationDelay: '0.48s' }}>
            <IndexHead n="06" title="Wear the culture" />
            <h2 className="mt-5 text-[34px] leading-[0.95] tracking-tight uppercase sm:text-[52px]" style={serif}>
              Wear the culture<span className="text-[#B3101C]">.</span>
            </h2>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-[#3F3830]">
              Shop the latest capsule, or step onto the stage as a creator.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/" className="brut-btn brut-press">
                Shop the drop
              </Link>
              <Link href="/creators" className="brut-btn-paper brut-press">
                Create with us
              </Link>
            </div>
          </section>

          {/* ── Colophon ─────────────────────────────────────────── */}
          <footer
            className="brut-rise brut-rule mt-16 pt-8"
            style={{ animationDelay: '0.56s' }}
          >
            <p className="brut-label text-[#B3101C]">Incorporated</p>
            <p className="mt-3 max-w-[52ch] text-[13px] leading-relaxed text-[#5C544A]">
              SOISE PVT. LTD was incorporated in Abuja, Nigeria on 15 April 2025 —
              a private company limited by shares. RC 8413888.
            </p>
          </footer>
        </div>
      </main>
      <Footer />
    </>
  );
}
