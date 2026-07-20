import Link from 'next/link';
import type { Metadata } from 'next';
import CreatorNav from '@/components/creators/CreatorNav';
import Footer from '@/components/footer';
import { ArrowUpRightIcon, WalletIcon, TagIcon } from '@/components/icons';
import FaqAccordion, { type FaqCategory } from './FaqAccordion';

export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: 'The Swaz Loop — Earn with Soise',
  description:
    'How the Swaz Loop works for creators (cash commission) and everyday users (store credit). Share, sell, and earn with Soise.',
};

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
        a: "Commission starts at your tier's base rate and increases as you hit follower/sales milestones, up to your tier cap.",
      },
      {
        q: 'When and how do I get paid?',
        a: 'Commission lands in your creator wallet on each verified (paid) order; request a bank payout from your dashboard.',
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
        a: 'Submit a tier-upgrade request with your follower count and social handle; an admin reviews it. Higher tiers earn higher commission.',
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
        a: 'Your creator dashboard shows earnings, referrals, and tier progress.',
      },
      {
        q: 'What content performs best?',
        a: 'Short-form try-ons/hauls tagging Soise with your code in the caption or bio link. Authentic UGC beats ads.',
      },
    ],
  },
];

export default function CreatorSwazLoopPage() {
  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <CreatorNav />
      <div className="mx-auto max-w-3xl px-[20px] py-[40px] md:py-[64px]">
        {/* Hero */}
        <div className="rounded-[24px] bg-[#0E0E10] px-6 py-14 text-center text-[#F4F1EA] sm:py-16">
          <span className="text-[12px] font-medium uppercase tracking-[0.32em] text-[#C4AA6E]">
            The Swaz Loop
          </span>
          <h1
            className="mx-auto mt-5 max-w-[520px] text-[34px] leading-[1.1] tracking-tight md:text-[46px]"
            style={{ fontFamily: 'var(--font-luxe, Georgia, serif)' }}
          >
            Share. Sell. Earn.
          </h1>
          <p className="mx-auto mt-5 max-w-[540px] text-[15px] leading-relaxed text-[#B7B2A6]">
            The Swaz Loop is how SOISE rewards you for spreading the word —
            whether you&apos;re a creator earning withdrawable cash commission or
            a shopper earning store credit by inviting friends.
          </p>
        </div>

        {/* Two paths */}
        <div className="mt-[40px] grid gap-[16px] md:grid-cols-2">
          {/* Creators */}
          <div className="rounded-[20px] border border-[#EAEAEA] p-6">
            <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#E8F1F9] text-[#0072BB]">
              <WalletIcon />
            </div>
            <h2 className="mt-4 text-[20px] font-bold text-[#121212]">
              For creators — cash commission
            </h2>
            <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-[#35373C]">
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
                <span className="font-medium">Tiers raise your rate</span> — hit
                follower/sales milestones to climb, up to your tier cap.
              </li>
              <li>
                Commission lands in your{' '}
                <span className="font-medium">creator wallet</span>; request a
                bank payout from your dashboard.
              </li>
              <li>
                Submit a <span className="font-medium">tier-upgrade request</span>{' '}
                with your follower count — an admin reviews it.
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/creators"
                className="btn_creators_solid_no_height flex items-center gap-x-1 px-5 py-3"
              >
                Become a creator <ArrowUpRightIcon />
              </Link>
              <Link
                href="/creators/dashboard"
                className="rounded-[10px] border border-[#121212] px-5 py-3 text-[13px] font-bold text-[#121212] uppercase transition-colors hover:bg-[#121212] hover:text-white"
              >
                Creator dashboard
              </Link>
            </div>
          </div>

          {/* Everyday users */}
          <div className="rounded-[20px] border border-[#EAEAEA] p-6">
            <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#E8F1F9] text-[#0072BB]">
              <TagIcon />
            </div>
            <h2 className="mt-4 text-[20px] font-bold text-[#121212]">
              For everyone — store credit
            </h2>
            <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-[#35373C]">
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
                className="btn_creators_solid_no_height flex items-center gap-x-1 px-5 py-3"
              >
                Get your referral link <ArrowUpRightIcon />
              </Link>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-[48px]">
          <h2 className="text-[24px] font-bold text-[#121212]">
            Frequently asked questions
          </h2>
          <p className="mt-2 text-[14px] text-[#8E8E93]">
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
                className="rounded-full border border-[#EAEAEA] bg-white px-4 py-2 text-[13px] font-medium text-[#35373C] transition-colors hover:border-[#0072BB] hover:text-[#0072BB]"
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
        <div className="mt-[40px] rounded-[20px] bg-[#0E0E10] p-8 text-center text-[#F4F1EA]">
          <h3
            className="text-[24px]"
            style={{ fontFamily: 'var(--font-luxe, Georgia, serif)' }}
          >
            Ready to start earning?
          </h3>
          <p className="mx-auto mt-2 max-w-[420px] text-[14px] text-[#B7B2A6]">
            Apply to become a creator for cash commission, or grab your referral
            link right now to start banking store credit.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/creators"
              className="rounded-full bg-[#C4AA6E] px-6 py-3 text-[13px] font-bold text-[#0E0E10] uppercase transition-transform hover:scale-[1.02]"
            >
              Become a creator
            </Link>
            <Link
              href="/swaz-loop"
              className="rounded-full border border-[#3A3A3D] px-6 py-3 text-[13px] font-bold text-[#D8D3C7] uppercase transition-colors hover:border-[#C4AA6E] hover:text-[#F4F1EA]"
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
