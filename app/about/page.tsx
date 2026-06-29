import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Nav from '@/components/home/nav/Nav';
import Footer from '@/components/footer';
import StatueWatermark from '@/components/brand/StatueWatermark';

export const metadata: Metadata = {
  title: 'About',
  description:
    'SOISE is creator-led streetwear built on a simple truth — people wear what they see the culture wearing. Considered capsule drops, quiet luxury, and a stage for the creatives shaping what comes next. Say less, look more.',
  alternates: { canonical: '/about' },
  openGraph: {
    type: 'website',
    title: 'About SOISE — Worn by the Culture',
    description:
      'Creator-led streetwear, considered capsule drops, and a stage for the creatives shaping the culture. Say less, look more.',
    url: '/about',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About SOISE — Worn by the Culture',
    description:
      'Creator-led streetwear and a stage for the creatives shaping the culture. Say less, look more.',
    images: ['/og-image.jpg'],
  },
};

const serif = { fontFamily: 'var(--font-luxe, Georgia, serif)' } as const;

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main className="bg-[#F4F1EA] text-[#14110E]">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 pt-20 pb-24 text-center sm:pt-28">
          <StatueWatermark
            tone="dark"
            width={520}
            opacity={0.05}
            className="absolute -top-10 right-[-120px] hidden lg:block"
          />
          <div className="relative mx-auto max-w-[820px]">
            <Image
              src="/main-logo.png"
              alt="Soise"
              width={150}
              height={150}
              priority
              className="mx-auto h-[120px] w-[120px] object-contain sm:h-[150px] sm:w-[150px]"
            />
            <p className="mt-8 text-[12px] font-medium uppercase tracking-[0.34em] text-[#9C6F2E]">
              Say less, look more
            </p>
            <h1
              className="mx-auto mt-5 max-w-[680px] text-[38px] leading-[1.08] tracking-tight sm:text-[56px]"
              style={serif}
            >
              Style isn’t announced. It’s seen.
            </h1>
            <p className="mx-auto mt-6 max-w-[540px] text-[15px] leading-relaxed text-[#5C544A] sm:text-[17px]">
              SOISE is creator-led streetwear, built on a truth as old as fashion
              itself — people wear what they see the culture wearing. So we put the
              culture first, and let the clothes follow.
            </p>
          </div>
        </section>

        {/* ── The insight (dark) ───────────────────────────────── */}
        <section className="relative overflow-hidden bg-[#0E0E10] px-6 py-24 text-[#F4F1EA]">
          <StatueWatermark
            tone="light"
            width={420}
            opacity={0.07}
            className="absolute bottom-[-40px] left-[-100px] hidden lg:block"
          />
          <div className="relative mx-auto max-w-[760px]">
            <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-[#C4AA6E]">
              The insight
            </p>
            <h2 className="mt-5 text-[26px] leading-snug sm:text-[34px]" style={serif}>
              Nobody is sold a look. They’re shown one.
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-[#B7B2A6] sm:text-[17px]">
              A friend, a stranger on your feed, the creator you can’t scroll past —
              that’s how style actually travels. SOISE is designed around it:
              creator-led, visual-first, made to be seen before it’s ever sold. The
              marketing isn’t bolted onto the product. It <em>is</em> the product
              strategy.
            </p>
          </div>
        </section>

        {/* ── The stage (light, statue centrepiece) ────────────── */}
        <section className="px-6 py-24">
          <div className="mx-auto grid max-w-[1000px] items-center gap-12 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-[#9C6F2E]">
                The mission
              </p>
              <h2 className="mt-5 text-[26px] leading-snug sm:text-[34px]" style={serif}>
                A stage for the culture’s makers.
              </h2>
              <p className="mt-6 text-[15px] leading-relaxed text-[#5C544A] sm:text-[17px]">
                The country is full of creatives — stylists, visual artists,
                designers — with the eye and the vision, but nowhere to stand. SOISE
                is that stage. Every drop is a collaboration. Every code is a credit.
                Every sale moves us toward a creator economy that actually pays its
                own.
              </p>
            </div>
            <div className="flex justify-center">
              <StatueWatermark tone="dark" width={300} opacity={0.9} />
            </div>
          </div>
        </section>

        {/* ── Considered + scarce (dark) ───────────────────────── */}
        <section className="bg-[#0E0E10] px-6 py-24 text-[#F4F1EA]">
          <div className="mx-auto max-w-[760px]">
            <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-[#C4AA6E]">
              The product
            </p>
            <h2 className="mt-5 text-[26px] leading-snug sm:text-[34px]" style={serif}>
              Considered, and deliberately scarce.
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-[#B7B2A6] sm:text-[17px]">
              Tees, hoodies, beanies, denim — released in limited capsule drops,
              never in floods. We would rather make less and make it matter. Quiet
              luxury for people who don’t need to raise their voice to be heard.
            </p>
            <div className="mt-10 grid gap-px overflow-hidden rounded-[14px] border border-[#1F1F22] bg-[#1F1F22] sm:grid-cols-3">
              {[
                ['Creator-led', 'Built with the people the culture already follows.'],
                ['Capsule drops', 'Limited runs. Once it’s gone, it’s gone.'],
                ['Quiet luxury', 'Considered cuts. Nothing loud. Say less, look more.'],
              ].map(([t, d]) => (
                <div key={t} className="bg-[#121214] p-6">
                  <h3 className="text-[16px]" style={serif}>
                    {t}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#9F9A8E]">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── The ethos (light) ────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 py-24">
          <StatueWatermark
            tone="dark"
            width={460}
            opacity={0.05}
            className="absolute top-1/2 right-[-130px] hidden -translate-y-1/2 lg:block"
          />
          <div className="relative mx-auto max-w-[760px]">
            <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-[#9C6F2E]">
              The ethos
            </p>
            <h2 className="mt-5 text-[26px] leading-snug sm:text-[34px]" style={serif}>
              Say less, look more.
            </h2>
            <p className="mt-6 text-[15px] leading-relaxed text-[#5C544A] sm:text-[17px]">
              Our mark is a classical muse held inside a Greek-key loop — timeless
              form, drawn into the now. It’s a quiet reminder that the loudest thing
              in the room rarely has the most to say. We make pieces that let your
              look do the talking, and a loop that keeps the value moving between the
              people who make culture and the people who wear it.
            </p>
          </div>
        </section>

        {/* ── The long game (dark) ─────────────────────────────── */}
        <section className="bg-[#0E0E10] px-6 py-24 text-[#F4F1EA]">
          <div className="mx-auto max-w-[760px]">
            <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-[#C4AA6E]">
              The long game
            </p>
            <h2 className="mt-5 text-[26px] leading-snug sm:text-[34px]" style={serif}>
              We’re building this in chapters.
            </h2>
            <ol className="mt-8 space-y-6">
              {[
                ['Now', 'Lean drops, real creators, real reach. Small runs that sell out and prove the model.'],
                ['Next', 'A home where creators and community build together — collaboration, credit, and the numbers to show for it.'],
                ['Then', 'The designers and makers who scale it into something bigger, without losing the soul.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#C4AA6E] text-[13px] font-semibold text-[#C4AA6E]">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold">{t}</p>
                    <p className="mt-1 text-[14px] leading-relaxed text-[#9F9A8E]">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── CTA (light) ──────────────────────────────────────── */}
        <section className="px-6 py-24 text-center">
          <div className="mx-auto max-w-[640px]">
            <h2 className="text-[30px] leading-tight tracking-tight sm:text-[44px]" style={serif}>
              Wear the culture.
            </h2>
            <p className="mx-auto mt-5 max-w-[460px] text-[15px] leading-relaxed text-[#5C544A]">
              Shop the latest capsule, or step onto the stage as a creator.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/"
                className="w-full rounded-full bg-[#14110E] px-8 py-3.5 text-[14px] font-semibold tracking-wide text-[#F4F1EA] transition-transform hover:scale-[1.02] sm:w-auto"
              >
                Shop the drop
              </Link>
              <Link
                href="/creators"
                className="w-full rounded-full border border-[#14110E]/25 px-8 py-3.5 text-[14px] font-medium text-[#14110E] transition-colors hover:border-[#14110E] sm:w-auto"
              >
                Create with us
              </Link>
            </div>
          </div>
        </section>

        {/* ── Incorporated (colophon) ──────────────────────────── */}
        <section className="border-t border-[#14110E]/10 px-6 py-12 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#9C6F2E]">
            Incorporated
          </p>
          <p className="mx-auto mt-3 max-w-[480px] text-[13px] leading-relaxed text-[#5C544A]">
            SOISE PVT. LTD was incorporated in Abuja, Nigeria on 15 April 2025 —
            a private company limited by shares. RC 8413888.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
