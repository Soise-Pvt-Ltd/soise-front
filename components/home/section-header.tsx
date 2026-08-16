import Link from 'next/link';

interface SectionHeaderProps {
  index: string; // editorial index, e.g. "01"
  title: string;
  href?: string;
  linkLabel?: string;
}

/**
 * Editorial section header: small index + serif title on the left, quiet
 * "view all" on the right. Gives each product row a name and a path deeper
 * into the catalog instead of an anonymous strip of images.
 */
export default function SectionHeader({
  index,
  title,
  href = '/shop/product-listing',
  linkLabel = 'View all',
}: SectionHeaderProps) {
  return (
    <div className="mb-[24px] flex items-end justify-between md:mb-[36px]">
      <div className="flex items-baseline gap-3">
        {/* Crimson index — the same accent that marks 1/2 · 2/2 at checkout,
            threading the ad creatives' palette through the homepage. */}
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#B3101C]">
          {index}
        </span>
        <h2 className="font-display text-[26px] leading-none text-[#121212] md:text-[34px]">
          {title}
        </h2>
      </div>
      <Link
        href={href}
        className="luxe-underline text-[11px] tracking-[0.2em] text-[#8E8E93] uppercase transition-colors duration-200 hover:text-[#121212]"
      >
        {linkLabel}
      </Link>
    </div>
  );
}
