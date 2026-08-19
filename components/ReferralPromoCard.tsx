import Link from 'next/link';
import { ArrowUpRightIcon } from '@/components/icons';

interface ReferralPromoCardProps {
  /** Optional override for the headline. */
  title?: string;
  /** Optional extra wrapper classes. */
  className?: string;
  /**
   * Visual language. Both speak the house ink-and-gold: `editorial` is the
   * ivory-house dark panel (as on /about and the admin surfaces); `default`
   * is a rounded card version of the same palette for softer storefront
   * placements. (The old blue Swaz Loop gradient was the last survivor of the
   * retired stock-template accent.)
   */
  variant?: 'default' | 'editorial';
}

const serif = { fontFamily: 'var(--font-luxe, Georgia, serif)' } as const;

/**
 * Reusable Swaz Loop awareness card. Repeats the core offer ("share your link,
 * earn store credit") and links to the referral hub at /swaz-loop. Placed on
 * the referral hub itself and on the post-checkout thank-you page so users
 * keep learning that they accumulate spendable store credit.
 */
export default function ReferralPromoCard({
  title = 'Share your link, earn store credit',
  className = '',
  variant = 'default',
}: ReferralPromoCardProps) {
  if (variant === 'editorial') {
    return (
      <Link
        href="/swaz-loop"
        className={`group block bg-[#0E0E10] p-7 text-left text-[#F4F1EA] transition-shadow hover:shadow-[0_12px_40px_rgba(14,14,16,0.35)] sm:p-8 ${className}`}
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#C4AA6E]">
          The Swaz Loop
        </p>
        <h3 className="mt-4 text-[22px] leading-snug sm:text-[26px]" style={serif}>
          {title}
        </h3>
        <p className="mt-4 max-w-[440px] text-[13px] leading-relaxed text-[#B7B2A6] sm:text-[14px]">
          When a friend places their first paid order with your link, you earn{' '}
          <span className="font-semibold text-[#F4F1EA]">10% of it as store credit</span>{' '}
          (up to ₦10,000). They get{' '}
          <span className="font-semibold text-[#F4F1EA]">₦1,000 off</span> their next
          order too. Store credit is spendable at checkout.
        </p>
        <span className="mt-5 inline-flex items-center gap-x-1 text-[13px] font-semibold text-[#C4AA6E] underline-offset-4 group-hover:underline">
          Get your link
          <ArrowUpRightIcon />
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/swaz-loop"
      className={`group block rounded-[20px] bg-gradient-to-br from-[#0E0E10] to-[#2A2A2D] p-6 text-left text-[#F4F1EA] transition-shadow hover:shadow-[0_12px_40px_rgba(14,14,16,0.35)] ${className}`}
    >
      <div className="mb-2 inline-flex items-center gap-x-2 rounded-full bg-[#C4AA6E]/15 px-3 py-1 text-[11px] font-medium tracking-wide text-[#C4AA6E] uppercase">
        Swaz Loop
      </div>
      <div className="flex items-start justify-between gap-x-4">
        <div>
          <h3 className="text-[20px] font-bold leading-tight md:text-[22px]">
            {title}
          </h3>
          <p className="mt-2 max-w-[440px] text-[13px] leading-relaxed text-[#B7B2A6]">
            When a friend places their FIRST paid order with your link, you earn{' '}
            <span className="font-semibold text-[#F4F1EA]">
              10% of it as store credit
            </span>{' '}
            (up to ₦10,000). They get{' '}
            <span className="font-semibold text-[#F4F1EA]">₦1,000 off</span> their
            next order too. Store credit is spendable at checkout.
          </p>
          <span className="mt-4 inline-flex items-center gap-x-1 text-[13px] font-semibold text-[#C4AA6E] underline-offset-4 group-hover:underline">
            Get your link
            <ArrowUpRightIcon />
          </span>
        </div>
      </div>
    </Link>
  );
}
