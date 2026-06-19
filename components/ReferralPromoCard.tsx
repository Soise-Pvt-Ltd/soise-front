import Link from 'next/link';
import { ArrowUpRightIcon } from '@/components/icons';

interface ReferralPromoCardProps {
  /** Optional override for the headline. */
  title?: string;
  /** Optional extra wrapper classes. */
  className?: string;
}

/**
 * Reusable Swaz Loop awareness card. Repeats the core offer ("share your link,
 * earn store credit") and links to the referral hub at /swaz-loop. Placed on
 * the referral hub itself and on the post-checkout thank-you page so users
 * keep learning that they accumulate spendable store credit.
 */
export default function ReferralPromoCard({
  title = 'Share your link, earn store credit',
  className = '',
}: ReferralPromoCardProps) {
  return (
    <Link
      href="/swaz-loop"
      className={`group block rounded-[20px] bg-gradient-to-br from-[#0072BB] to-[#2D2C54] p-6 text-left text-white transition-shadow hover:shadow-[0_12px_40px_rgba(0,114,187,0.35)] ${className}`}
    >
      <div className="mb-2 inline-flex items-center gap-x-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium tracking-wide uppercase">
        Swaz Loop
      </div>
      <div className="flex items-start justify-between gap-x-4">
        <div>
          <h3 className="text-[20px] font-bold leading-tight md:text-[22px]">
            {title}
          </h3>
          <p className="mt-2 max-w-[440px] text-[13px] leading-relaxed text-white/85">
            When a friend places their FIRST paid order with your link, you earn{' '}
            <span className="font-semibold text-white">
              10% of it as store credit
            </span>{' '}
            (up to ₦10,000). They get{' '}
            <span className="font-semibold text-white">₦1,000 off</span> their
            next order too. Store credit is spendable at checkout.
          </p>
          <span className="mt-4 inline-flex items-center gap-x-1 text-[13px] font-semibold underline-offset-4 group-hover:underline">
            Get your link
            <ArrowUpRightIcon />
          </span>
        </div>
      </div>
    </Link>
  );
}
