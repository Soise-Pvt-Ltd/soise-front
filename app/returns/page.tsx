import type { Metadata } from 'next';
import Link from 'next/link';
import Nav from '@/components/home/nav/Nav';
import Footer from '@/components/footer';
import StatueWatermark from '@/components/brand/StatueWatermark';
import { siteConfig } from '@/lib/site-config';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Returns & Exchanges',
  description:
    'The SOISE return policy: seven days from delivery, a free first size exchange within Nigeria, store credit that never expires, and full refunds when the fault is ours.',
  path: '/returns',
  ogTitle: 'Returns & Exchanges — SOISE',
  ogDescription:
    'Seven days, a free size exchange, and a promise: if it isn’t right, we make it right.',
});

/**
 * PRESSED INK — the policy page. Each clause is an indexed section so a
 * shopper scanning for one answer can find it by number; the two clauses
 * that actually change a purchase decision (the window, and how to start)
 * carry the crimson and the heaviest plates.
 *
 * Renders inside the global site Nav/Footer — no standalone masthead bar.
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

function ClauseTitle({ children }: { children: string }) {
  return (
    <h2
      className="mt-5 text-[26px] leading-[1.05] uppercase sm:text-[36px]"
      style={serif}
    >
      {children}
    </h2>
  );
}

export default function ReturnsPage() {
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
            <p className="brut-label text-[#B3101C]">Returns &amp; Exchanges</p>
            <h1
              className="mt-4 text-[52px] leading-[0.95] tracking-tight uppercase sm:text-[86px]"
              style={serif}
            >
              If it isn’t right, we make it right<span className="text-[#B3101C]">.</span>
            </h1>
            <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-[#3F3830]">
              Every Soise piece is cut in a limited run and checked by hand
              before it ships. If the fit is off or the piece isn’t what it
              should be, here is exactly what happens next — no fine print
              doing quiet work against you.
            </p>
          </header>

          {/* ── 01 The window — the clause that decides a purchase, so it
                 gets the ink plate. ─────────────────────────────────── */}
          <section className="brut-rise mt-16" style={{ animationDelay: '0.08s' }}>
            <IndexHead n="01" title="The window" />
            <div className="brut-press mt-5 rounded-[2px] border-2 border-[#121212] bg-[#121212] px-6 py-7 text-white sm:px-8 sm:py-9">
              <h2 className="text-[26px] leading-[1.05] uppercase sm:text-[36px]" style={serif}>
                Seven days, from your hands.
              </h2>
              <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-white/70">
                You have <span className="font-semibold text-white">7 days from delivery</span>{' '}
                to start a return or exchange within Nigeria — enough time to try
                the piece on properly, not enough for it to live a life first.
                Outside Nigeria, you have 14 days to write to us.
              </p>
              <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-white/70">
                Noticed a defect? Tell us within{' '}
                <span className="font-semibold text-white">48 hours of delivery</span>{' '}
                with a photo, and we’ll treat it as our fault from the first
                message — because it is.
              </p>
            </div>
          </section>

          {/* ── 02 Exchanges ─────────────────────────────────────── */}
          <section className="brut-rise mt-12" style={{ animationDelay: '0.16s' }}>
            <IndexHead n="02" title="The fit" />
            <ClauseTitle>Your first size exchange is on us.</ClauseTitle>
            <div className="brut-plate brut-shadow mt-5 px-6 py-6 sm:px-8">
              <p className="max-w-[52ch] text-[15px] leading-relaxed text-[#3F3830]">
                Buying without a fitting room takes trust, so we return it: if
                the size isn’t right, your{' '}
                <span className="font-semibold text-[#121212]">
                  first exchange on any order ships free within Nigeria
                </span>{' '}
                — we arrange the courier both ways. Tell us the size you need
                and we’ll hold it for you while the swap travels.
              </p>
              <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-[#5C544A]">
                After the first exchange, or outside Nigeria, the shipping is
                yours — the exchange itself always costs nothing.
              </p>
            </div>
          </section>

          {/* ── 03 Returns / store credit ────────────────────────── */}
          <section className="brut-rise mt-12" style={{ animationDelay: '0.24s' }}>
            <IndexHead n="03" title="Changed your mind" />
            <ClauseTitle>Store credit, in full, that never expires.</ClauseTitle>
            <div className="brut-plate brut-shadow mt-5 px-6 py-6 sm:px-8">
              <p className="max-w-[52ch] text-[15px] leading-relaxed text-[#3F3830]">
                If a piece simply isn’t you, send it back within the window and
                we’ll credit{' '}
                <span className="font-semibold text-[#121212]">
                  the full amount as Soise store credit
                </span>{' '}
                once it arrives and passes inspection. The credit never expires
                and spends at checkout like cash. Return shipping for a
                change-of-mind return is yours.
              </p>
            </div>
          </section>

          {/* ── 04 When it's on us ───────────────────────────────── */}
          <section className="brut-rise mt-12" style={{ animationDelay: '0.32s' }}>
            <IndexHead n="04" title="When it’s on us" />
            <ClauseTitle>Our mistake, your full refund.</ClauseTitle>
            <div className="brut-plate brut-shadow mt-5 px-6 py-6 sm:px-8">
              <p className="max-w-[52ch] text-[15px] leading-relaxed text-[#3F3830]">
                A piece that arrives defective, an order we got wrong, a drop we
                couldn’t fulfil — that money was never ours to hold. You choose:
                a replacement on the next courier out, or a{' '}
                <span className="font-semibold text-[#121212]">
                  full refund to your original payment method
                </span>
                , shipping included, within 5–10 business days of our
                confirmation. Return shipping in these cases is ours too.
              </p>
            </div>
          </section>

          {/* ── 05 Condition ─────────────────────────────────────── */}
          <section className="brut-rise mt-12" style={{ animationDelay: '0.4s' }}>
            <IndexHead n="05" title="The condition" />
            <ClauseTitle>Tried on, not lived in.</ClauseTitle>
            <div className="brut-plate brut-shadow mt-5 px-6 py-6 sm:px-8">
              <p className="max-w-[52ch] text-[15px] leading-relaxed text-[#3F3830]">
                Trying a piece on for fit is exactly what the window is for. To
                come back to us, it must be{' '}
                <span className="font-semibold text-[#121212]">
                  unworn beyond that, unwashed, unaltered, with tags attached
                </span>
                , in its original packaging. A returned piece that doesn’t meet
                this comes back to you, and we’ll tell you why before it does.
              </p>
              <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-[#5C544A]">
                Pieces marked final sale at checkout are exactly that — except
                for defects, which are always ours to fix.
              </p>
            </div>
          </section>

          {/* ── 06 How to begin — the one action, so the one crimson link
                 and the ink button. ────────────────────────────────── */}
          <section className="brut-rise mt-12" style={{ animationDelay: '0.48s' }}>
            <IndexHead n="06" title="How to begin" />
            <ClauseTitle>One email starts everything.</ClauseTitle>
            <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-[#3F3830]">
              Write to{' '}
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="font-bold text-[#B3101C] underline underline-offset-2"
              >
                {siteConfig.supportEmail}
              </a>{' '}
              with your order number and what you’d like — exchange, credit,
              or refund. We reply within one business day, inspect within 48
              hours of a piece reaching us, and keep you told at every step.
            </p>
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className="brut-press mt-6 flex flex-col gap-1 rounded-[2px] border-2 border-[#121212] bg-[#121212] px-6 py-6 text-white sm:flex-row sm:items-baseline sm:justify-between"
            >
              <span className="text-[20px] break-all sm:text-[26px]" style={serif}>
                {siteConfig.supportEmail}
              </span>
              <span className="text-[11px] font-bold tracking-[0.16em] uppercase opacity-70">
                Start a return →
              </span>
            </a>
            <div className="mt-8 sm:max-w-[340px]">
              <Link
                href="/shop/product-listing"
                className="brut-btn-paper brut-press"
              >
                Shop with confidence
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
