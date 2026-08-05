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

const serif = { fontFamily: 'var(--font-luxe, Georgia, serif)' } as const;

function SectionHeading({
  kicker,
  title,
  dark = false,
}: {
  kicker: string;
  title: string;
  dark?: boolean;
}) {
  return (
    <>
      <p
        className={`text-[12px] font-medium uppercase tracking-[0.28em] ${
          dark ? 'text-[#C4AA6E]' : 'text-[#9C6F2E]'
        }`}
      >
        {kicker}
      </p>
      <h2 className="mt-5 text-[26px] leading-snug sm:text-[34px]" style={serif}>
        {title}
      </h2>
    </>
  );
}

export default function ReturnsPage() {
  return (
    <>
      <Nav />
      <main className="bg-[#F4F1EA] text-[#14110E]">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 pt-20 pb-20 text-center sm:pt-28">
          <StatueWatermark
            tone="dark"
            width={520}
            opacity={0.05}
            className="absolute -top-10 right-[-120px] hidden lg:block"
          />
          <div className="relative mx-auto max-w-[820px]">
            <p className="text-[12px] font-medium uppercase tracking-[0.34em] text-[#9C6F2E]">
              Returns &amp; Exchanges
            </p>
            <h1
              className="mx-auto mt-5 max-w-[680px] text-[38px] leading-[1.08] tracking-tight sm:text-[56px]"
              style={serif}
            >
              If it isn’t right, we make it right.
            </h1>
            <p className="mx-auto mt-6 max-w-[540px] text-[15px] leading-relaxed text-[#5C544A] sm:text-[17px]">
              Every Soise piece is cut in a limited run and checked by hand
              before it ships. If the fit is off or the piece isn’t what it
              should be, here is exactly what happens next — no fine print
              doing quiet work against you.
            </p>
          </div>
        </section>

        {/* ── The window ───────────────────────────────────────── */}
        <section className="bg-[#0E0E10] px-6 py-24 text-[#F4F1EA]">
          <div className="mx-auto max-w-[680px]">
            <SectionHeading dark kicker="The window" title="Seven days, from your hands." />
            <p className="mt-6 text-[15px] leading-relaxed text-[#B7B2A6] sm:text-[17px]">
              You have <span className="font-semibold text-[#F4F1EA]">7 days from delivery</span>{' '}
              to start a return or exchange within Nigeria — enough time to try
              the piece on properly, not enough for it to live a life first.
              Outside Nigeria, you have 14 days to write to us.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-[#B7B2A6] sm:text-[17px]">
              Noticed a defect? Tell us within{' '}
              <span className="font-semibold text-[#F4F1EA]">48 hours of delivery</span>{' '}
              with a photo, and we’ll treat it as our fault from the first
              message — because it is.
            </p>
          </div>
        </section>

        {/* ── Exchanges ────────────────────────────────────────── */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-[680px]">
            <SectionHeading kicker="The fit" title="Your first size exchange is on us." />
            <p className="mt-6 text-[15px] leading-relaxed text-[#5C544A] sm:text-[17px]">
              Buying without a fitting room takes trust, so we return it: if
              the size isn’t right, your{' '}
              <span className="font-semibold text-[#14110E]">
                first exchange on any order ships free within Nigeria
              </span>{' '}
              — we arrange the courier both ways. Tell us the size you need
              and we’ll hold it for you while the swap travels.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-[#5C544A] sm:text-[17px]">
              After the first exchange, or outside Nigeria, the shipping is
              yours — the exchange itself always costs nothing.
            </p>
          </div>
        </section>

        {/* ── Returns / store credit ───────────────────────────── */}
        <section className="bg-[#0E0E10] px-6 py-24 text-[#F4F1EA]">
          <div className="mx-auto max-w-[680px]">
            <SectionHeading dark kicker="Changed your mind" title="Store credit, in full, that never expires." />
            <p className="mt-6 text-[15px] leading-relaxed text-[#B7B2A6] sm:text-[17px]">
              If a piece simply isn’t you, send it back within the window and
              we’ll credit{' '}
              <span className="font-semibold text-[#F4F1EA]">
                the full amount as Soise store credit
              </span>{' '}
              once it arrives and passes inspection. The credit never expires
              and spends at checkout like cash. Return shipping for a
              change-of-mind return is yours.
            </p>
          </div>
        </section>

        {/* ── When it's on us ──────────────────────────────────── */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-[680px]">
            <SectionHeading kicker="When it’s on us" title="Our mistake, your full refund." />
            <p className="mt-6 text-[15px] leading-relaxed text-[#5C544A] sm:text-[17px]">
              A piece that arrives defective, an order we got wrong, a drop we
              couldn’t fulfil — that money was never ours to hold. You choose:
              a replacement on the next courier out, or a{' '}
              <span className="font-semibold text-[#14110E]">
                full refund to your original payment method
              </span>
              , shipping included, within 5–10 business days of our
              confirmation. Return shipping in these cases is ours too.
            </p>
          </div>
        </section>

        {/* ── Condition ────────────────────────────────────────── */}
        <section className="bg-[#0E0E10] px-6 py-24 text-[#F4F1EA]">
          <div className="mx-auto max-w-[680px]">
            <SectionHeading dark kicker="The condition" title="Tried on, not lived in." />
            <p className="mt-6 text-[15px] leading-relaxed text-[#B7B2A6] sm:text-[17px]">
              Trying a piece on for fit is exactly what the window is for. To
              come back to us, it must be{' '}
              <span className="font-semibold text-[#F4F1EA]">
                unworn beyond that, unwashed, unaltered, with tags attached
              </span>
              , in its original packaging. A returned piece that doesn’t meet
              this comes back to you, and we’ll tell you why before it does.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-[#B7B2A6] sm:text-[17px]">
              Pieces marked final sale at checkout are exactly that — except
              for defects, which are always ours to fix.
            </p>
          </div>
        </section>

        {/* ── How to begin ─────────────────────────────────────── */}
        <section className="px-6 py-24 text-center">
          <div className="mx-auto max-w-[680px]">
            <SectionHeading kicker="How to begin" title="One email starts everything." />
            <p className="mx-auto mt-6 max-w-[520px] text-[15px] leading-relaxed text-[#5C544A] sm:text-[17px]">
              Write to{' '}
              <a
                href={`mailto:${siteConfig.supportEmail}`}
                className="font-semibold text-[#14110E] underline underline-offset-4"
              >
                {siteConfig.supportEmail}
              </a>{' '}
              with your order number and what you’d like — exchange, credit,
              or refund. We reply within one business day, inspect within 48
              hours of a piece reaching us, and keep you told at every step.
            </p>
            <div className="mt-10">
              <Link
                href="/shop/product-listing"
                className="inline-flex h-[53px] items-center justify-center rounded-[10px] bg-[#14110E] px-10 text-[13px] font-bold uppercase text-[#F4F1EA] transition-all duration-300 ease-out hover:bg-[#2a2a2a] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] active:scale-[0.98]"
              >
                Shop with confidence
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
