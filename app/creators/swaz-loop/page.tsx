import Link from 'next/link';
import type { Metadata } from 'next';
import CreatorNav from '@/components/creators/CreatorNav';
import Footer from '@/components/footer';
import { ArrowUpRightIcon, WalletIcon, TagIcon } from '@/components/icons';
import FaqAccordion, { type FaqCategory } from './FaqAccordion';
import { pageMetadata } from '@/lib/seo';

export const runtime = 'nodejs';

// The public, logged-out explainer for the Swaz Loop (middleware whitelists it
// in PUBLIC_PATHS). This is the page that should rank for "earn with Soise" /
// "creator commission Nigeria" — the signed-in /swaz-loop dashboard is
// noindexed so the two don't compete.
export const metadata: Metadata = pageMetadata({
  title: 'The Swaz Loop — Earn with SOISE',
  description:
    'How the Swaz Loop works for creators (cash commission on every sale) and for everyday shoppers (store credit for referrals). Share, sell, and earn with SOISE in Nigeria.',
  path: '/creators/swaz-loop',
  ogTitle: 'The Swaz Loop — Earn with SOISE',
  ogDescription:
    'Cash commission for creators, store credit for everyone. How earning with SOISE works.',
});

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    items: [
      {
        q: 'How do I make money with Soise?',
        a: 'Apply to become a creator to get a unique code and shareable link, then earn commission on every order placed with your code. Rates rise with your tier.',
      },
      {
        q: "What's the difference between my creator code and my referral link?",
        a: 'Your creator code gives your audience a discount and pays YOU cash commission (withdrawable). Your referral link (the Swaz Loop) is for everyone and earns store credit when a friend’s first order is paid.',
      },
      {
        q: "I'm a UGC/TikTok creator without a huge following — can I join?",
        a: 'Yes. Apply via the Creator Experience; we review every application. You can also earn store credit right now by sharing your referral link.',
      },
      {
        q: 'Does it cost anything?',
        a: 'No. Joining and sharing are free.',
      },
    ],
  },
  {
    id: 'earnings-payouts',
    title: 'Earnings & payouts',
    items: [
      {
        q: 'How much do creators earn?',
        a: 'Every tier pays a flat rate: Soise I 10%, Soise II 12%, Soise III 14%, Soise IV 17%, Soise V 20%. You always know exactly what you earn.',
      },
      {
        q: 'When and how do I get paid?',
        a: 'Commission lands in your creator wallet on each verified (paid) order; request a bank payout from your dashboard. Any ₦100,000 milestone bonuses you have earned are added to that payout.',
      },
      {
        q: 'Do I get anything besides cash commission?',
        a: 'Yes — every 10 verified sales on your code unlocks a ₦100,000 milestone bonus on top of your commission, plus fresh Soise gear from the current drop. We add the bonus to your payout when you withdraw.',
      },
      {
        q: 'How does store credit work?',
        a: "You earn store credit when friends' first orders are paid via your link, and you spend it at checkout.",
      },
      {
        q: 'Can I combine store credit with a creator code?',
        a: 'Yes, both apply at checkout.',
      },
    ],
  },
  {
    id: 'tiers-growth',
    title: 'Tiers & growth',
    items: [
      {
        q: 'How do I level up my tier?',
        a: 'By selling. Tiers move automatically on the number of paid orders placed with your code, counted for life: Soise I from 0, Soise II at 10 orders, Soise III at 50, Soise IV at 150, Soise V at 500. Not followers — orders. You can never drop a tier once you reach it.',
      },
      {
        q: 'Do my followers get anything?',
        a: 'Yes — your code gives them a checkout discount, which lifts conversions.',
      },
    ],
  },
  {
    id: 'performance',
    title: 'Performance',
    items: [
      {
        q: 'How do I track performance?',
        a: 'Your creator dashboard shows earnings, orders placed with your creator code, and tier progress.',
      },
      {
        q: 'What content performs best?',
        a: 'Short-form try-ons/hauls tagging Soise with your code in the caption or bio link. Authentic UGC beats ads.',
      },
    ],
  },
];

// FAQPage structured data, generated from the same array that renders the
// accordion so the markup and the visible answers can never disagree (Google
// penalises FAQ schema whose content isn't on the page). Eligible for the FAQ
// rich result, which expands the SERP listing and lifts CTR.
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_CATEGORIES.flatMap((category) =>
    category.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  ),
};

/** Instrument Serif — the Pressed Ink display face. */
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

export default function CreatorSwazLoopPage() {
  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#121212]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <CreatorNav />
      <div className="mx-auto max-w-3xl px-[20px] py-[40px] md:py-[64px]">
        {/* Editorial masthead — the page already carries the portal bar above,
            so this is the headline block, not a second masthead. */}
        <header className="brut-rise">
          <p className="brut-label text-[#B3101C]">The Swaz Loop</p>
          <h1
            className="mt-4 text-[64px] leading-[0.95] tracking-tight uppercase sm:text-[88px]"
            style={serif}
          >
            Share. Sell. Earn<span className="text-[#B3101C]">.</span>
          </h1>
          <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-[#3F3830]">
            The Swaz Loop is how SOISE rewards you for spreading the word —
            whether you&apos;re a creator earning withdrawable cash commission or
            a shopper earning store credit by inviting friends.
          </p>
        </header>

        {/* Two paths */}
        <div className="mt-[48px] grid gap-[20px] md:grid-cols-2">
          {/* Creators */}
          <div className="brut-plate p-6">
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[2px] bg-[#121212] text-white">
              <WalletIcon />
            </div>
            <div className="mt-5">
              <IndexHead n="01" title="Creators" />
            </div>
            <h2
              className="mt-3 text-[28px] leading-[0.95] tracking-tight text-[#121212] uppercase"
              style={serif}
            >
              For creators — cash commission
            </h2>
            <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-[#3F3830]">
              <li>
                Get a unique <span className="font-medium">creator code</span> +
                shareable link. Your audience gets a checkout discount.
              </li>
              <li>
                You earn{' '}
                <span className="font-medium">
                  withdrawable cash commission
                </span>{' '}
                on every verified (paid) order placed with your code.
              </li>
              <li>
                <span className="font-medium">Every 10 verified sales</span>{' '}
                unlocks a <span className="font-medium">₦100,000 bonus</span> on
                top of your commission, plus fresh Soise gear from the current
                drop. We add the bonus to your payout when you withdraw.
              </li>
              <li>
                <span className="font-medium">Tiers raise your rate</span> —
                Soise I to Soise V at 10, 50, 150 and 500 paid orders. Flat
                rates: 10%, 12%, 14%, 17%, 20%.
              </li>
              <li>
                <span className="font-medium">Orders count for life</span> and
                move you up automatically. Not followers, and you never drop a
                tier once you have reached it.
              </li>
              <li>
                Commission lands in your{' '}
                <span className="font-medium">creator wallet</span>; request a
                bank payout from your dashboard.
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/creators"
                className="brut-press flex items-center gap-x-1 rounded-[2px] border-2 border-[#121212] bg-[#121212] px-5 py-3 text-[11px] font-bold tracking-[0.14em] text-white uppercase"
              >
                Become a creator <ArrowUpRightIcon />
              </Link>
              <Link
                href="/creators/dashboard"
                className="brut-plate brut-press px-5 py-3 text-[11px] font-bold tracking-[0.14em] uppercase"
              >
                Creator dashboard
              </Link>
            </div>
          </div>

          {/* Everyday users */}
          <div className="brut-plate p-6">
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[2px] bg-[#121212] text-white">
              <TagIcon />
            </div>
            <div className="mt-5">
              <IndexHead n="02" title="Everyone" />
            </div>
            <h2
              className="mt-3 text-[28px] leading-[0.95] tracking-tight text-[#121212] uppercase"
              style={serif}
            >
              For everyone — store credit
            </h2>
            <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-[#3F3830]">
              <li>
                Share your personal <span className="font-medium">referral link</span>{' '}
                — no application needed.
              </li>
              <li>
                When a friend places their{' '}
                <span className="font-medium">first paid order</span>, you earn{' '}
                <span className="font-medium">
                  10% of it as store credit
                </span>{' '}
                (up to ₦10,000).
              </li>
              <li>
                Your friend gets{' '}
                <span className="font-medium">₦1,000 off</span> their next order.
              </li>
              <li>
                Store credit is{' '}
                <span className="font-medium">spendable at checkout</span> — and
                yes, it stacks with a creator code.
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/swaz-loop"
                className="brut-press flex items-center gap-x-1 rounded-[2px] border-2 border-[#121212] bg-[#121212] px-5 py-3 text-[11px] font-bold tracking-[0.14em] text-white uppercase"
              >
                Get your referral link <ArrowUpRightIcon />
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-[56px]">
          <IndexHead n="03" title="Questions" />
          <h2
            className="mt-4 text-[40px] leading-[0.95] tracking-tight text-[#121212] uppercase sm:text-[52px]"
            style={serif}
          >
            Frequently asked questions
          </h2>
          <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-[#3F3830]">
            Everything you need to know about earning with Soise.
          </p>
          {/* Category index */}
          <nav
            aria-label="FAQ categories"
            className="mt-[16px] flex flex-wrap gap-2"
          >
            {FAQ_CATEGORIES.map((category) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                className="brut-plate brut-press px-4 py-2 text-[11px] font-bold tracking-[0.12em] text-[#121212] uppercase"
              >
                {category.title}
              </a>
            ))}
          </nav>
          <div className="mt-[24px]">
            <FaqAccordion categories={FAQ_CATEGORIES} />
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-[56px] rounded-[2px] border-2 border-[#121212] bg-[#121212] p-8 text-white">
          <p className="brut-label text-[#B3101C]">Ready?</p>
          <h3
            className="mt-4 text-[40px] leading-[0.95] tracking-tight uppercase sm:text-[52px]"
            style={serif}
          >
            Ready to start earning<span className="text-[#B3101C]">?</span>
          </h3>
          <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-white/70">
            Apply to become a creator for cash commission, or grab your referral
            link right now to start banking store credit.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/creators"
              className="brut-press flex items-center justify-center rounded-[2px] border-2 border-white bg-white px-6 py-3.5 text-[11px] font-bold tracking-[0.14em] text-[#121212] uppercase"
            >
              Become a creator
            </Link>
            <Link
              href="/swaz-loop"
              className="flex items-center justify-center rounded-[2px] border-2 border-white/40 px-6 py-3.5 text-[11px] font-bold tracking-[0.14em] text-white uppercase transition-colors hover:border-white"
            >
              Invite &amp; earn credit
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
