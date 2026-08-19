import Link from 'next/link';
import { ArrowUpRightIcon } from '@/components/icons';

interface ReferralPromoCardProps {
  /** Optional override for the headline. */
  title?: string;
  /** Optional extra wrapper classes. */
  className?: string;
  /**
   * Visual language. Both speak PRESSED INK — a white plate with a 2px ink
   * border, sharp `rounded-[2px]` corners and a hard offset shadow, with the
   * crimson accent doing the pointing: `editorial` wears the plain uppercase
   * eyebrow (as on /thank-you and the referral hub); `default` wears the
   * off-register `brut-stamp` for louder storefront placements. (The old blue
   * Swaz Loop gradient was the last survivor of the retired stock-template
   * accent; the gold that replaced it went out with the letterpress.)
   */
  variant?: 'default' | 'editorial';
}

const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

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
        className={`group brut-plate brut-press block px-6 py-7 text-left sm:px-8 sm:py-8 ${className}`}
      >
        <p className="brut-label text-[#B3101C]">The Swaz Loop</p>
        <h3
          className="mt-4 text-[24px] leading-[1.02] uppercase sm:text-[30px]"
          style={serif}
        >
          {title}
        </h3>
        <p className="mt-4 max-w-[440px] text-[13px] leading-relaxed text-[#3F3830] sm:text-[14px]">
          When a friend places their first paid order with your link, you earn{' '}
          <span className="font-semibold text-[#121212]">10% of it as store credit</span>{' '}
          (up to ₦10,000). They get{' '}
          <span className="font-semibold text-[#121212]">₦1,000 off</span> their next
          order too. Store credit is spendable at checkout.
        </p>
        <span className="mt-5 inline-flex items-center gap-x-1 text-[11px] font-bold tracking-[0.16em] text-[#B3101C] uppercase underline-offset-2 group-hover:underline">
          Get your link
          <ArrowUpRightIcon />
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/swaz-loop"
      className={`group brut-plate brut-press block px-6 py-6 text-left ${className}`}
    >
      <span className="brut-stamp">Swaz Loop</span>
      <div className="flex items-start justify-between gap-x-4">
        <div>
          <h3
            className="mt-4 text-[22px] leading-[1.02] uppercase md:text-[26px]"
            style={serif}
          >
            {title}
          </h3>
          <p className="mt-3 max-w-[440px] text-[13px] leading-relaxed text-[#3F3830]">
            When a friend places their FIRST paid order with your link, you earn{' '}
            <span className="font-semibold text-[#121212]">
              10% of it as store credit
            </span>{' '}
            (up to ₦10,000). They get{' '}
            <span className="font-semibold text-[#121212]">₦1,000 off</span> their
            next order too. Store credit is spendable at checkout.
          </p>
          <span className="mt-4 inline-flex items-center gap-x-1 text-[11px] font-bold tracking-[0.16em] text-[#B3101C] uppercase underline-offset-2 group-hover:underline">
            Get your link
            <ArrowUpRightIcon />
          </span>
        </div>
      </div>
    </Link>
  );
}
