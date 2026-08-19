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

/** Playfair Display — the Ivory House display face. */
const serif = { fontFamily: 'var(--font-luxe, Georgia, serif)' } as const;

export default function CreatorSwazLoopPage() {
  return (
    /* IVORY HOUSE, light side. Unlike /creators and /join this page sits inside
       the site chrome — the creator bar above and the shared storefront footer
       below — so it keeps a light ground rather than going full-bleed charcoal
       and colliding with them. The register comes through in the type, the gold,
       the hairlines and the two inset charcoal panels. */
    <div className="min-h-screen bg-[#F4F1EA] text-[#14110E]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <CreatorNav />
      <div className="mx-auto max-w-3xl px-[20px] py-[40px] md:py-[64px]">
        {/* Hero — the one charcoal panel that carries the glow. */}
        <header className="relative overflow-hidden rounded-[16px] bg-[#0E0E10] px-6 py-14 text-center text-[#F4F1EA] sm:py-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                'radial-gradient(120% 80% at 50% -10%, rgba(196,170,110,0.18), transparent 60%)',
            }}
          />
          <div className="relative">
            <p className="text-[12px] font-medium tracking-[0.32em] text-[#C4AA6E] uppercase">
              The Swaz Loop
            </p>
            <h1
              className="mx-auto mt-5 max-w-[540px] text-[36px] leading-[1.08] font-medium tracking-tight sm:text-[48px]"
              style={serif}
            >
              Share. Sell. Earn.
            </h1>
            <p className="mx-auto mt-5 max-w-[540px] text-[15px] leading-relaxed text-[#B7B2A6]">
              The Swaz Loop is how SOISE rewards you for spreading the word —
              whether you&apos;re a creator earning withdrawable cash commission or
              a shopper earning store credit by inviting friends.
            </p>
          </div>
        </header>

        {/* Two paths */}
        <div className="mt-[40px] grid gap-[20px] md:grid-cols-2">
          {/* Creators */}
          <div className="rounded-[16px] border border-[#E8E4DA] bg-[#FBF9F4] p-6">
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#0E0E10] text-[#C4AA6E]">
              <WalletIcon />
            </div>
            <p className="mt-5 text-[12px] font-medium tracking-[0.28em] text-[#C4AA6E] uppercase">
              Creators
            </p>
            <h2
              className="mt-3 text-[24px] leading-snug font-medium tracking-tight text-[#14110E]"
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
                className="flex items-center gap-x-1 rounded-full bg-[#0E0E10] px-5 py-3 text-[13px] font-semibold tracking-wide text-[#F4F1EA] transition-transform hover:scale-[1.02]"
              >
                Become a creator <ArrowUpRightIcon />
              </Link>
              <Link
                href="/creators/dashboard"
                className="rounded-full border border-[#DCD6C8] px-5 py-3 text-[13px] font-medium text-[#3F3830] transition-colors hover:border-[#C4AA6E] hover:text-[#14110E]"
              >
                Creator dashboard
              </Link>
            </div>
          </div>

          {/* Everyday users */}
          <div className="rounded-[16px] border border-[#E8E4DA] bg-[#FBF9F4] p-6">
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#0E0E10] text-[#C4AA6E]">
              <TagIcon />
            </div>
            <p className="mt-5 text-[12px] font-medium tracking-[0.28em] text-[#C4AA6E] uppercase">
              Everyone
            </p>
            <h2
              className="mt-3 text-[24px] leading-snug font-medium tracking-tight text-[#14110E]"
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
                className="flex items-center gap-x-1 rounded-full bg-[#0E0E10] px-5 py-3 text-[13px] font-semibold tracking-wide text-[#F4F1EA] transition-transform hover:scale-[1.02]"
              >
                Get your referral link <ArrowUpRightIcon />
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-[56px]">
          <p className="text-[12px] font-medium tracking-[0.28em] text-[#C4AA6E] uppercase">
            Questions
          </p>
          <h2
            className="mt-3 text-[28px] leading-snug font-medium tracking-tight text-[#14110E] sm:text-[34px]"
            style={serif}
          >
            Frequently asked questions
          </h2>
          <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[#5C544A]">
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
                className="rounded-full border border-[#DCD6C8] bg-[#FBF9F4] px-4 py-2 text-[13px] font-medium text-[#5C544A] transition-colors hover:border-[#C4AA6E] hover:text-[#14110E]"
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
        <div className="mt-[56px] rounded-[16px] bg-[#0E0E10] p-8 text-center text-[#F4F1EA]">
          <p className="text-[12px] font-medium tracking-[0.28em] text-[#C4AA6E] uppercase">
            Ready?
          </p>
          <h3
            className="mt-4 text-[28px] leading-snug font-medium tracking-tight sm:text-[34px]"
            style={serif}
          >
            Ready to start earning?
          </h3>
          <p className="mx-auto mt-4 max-w-[46ch] text-[15px] leading-relaxed text-[#B7B2A6]">
            Apply to become a creator for cash commission, or grab your referral
            link right now to start banking store credit.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/creators"
              className="flex items-center justify-center rounded-full bg-[#C4AA6E] px-8 py-3.5 text-[14px] font-semibold tracking-wide text-[#0E0E10] transition-transform hover:scale-[1.02]"
            >
              Become a creator
            </Link>
            <Link
              href="/swaz-loop"
              className="flex items-center justify-center rounded-full border border-[#3A3A3D] px-8 py-3.5 text-[14px] font-medium text-[#D8D3C7] transition-colors hover:border-[#C4AA6E] hover:text-[#F4F1EA]"
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
