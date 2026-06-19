'use client';

import SwiperCarouselClient from '@/components/caurosel';

// Thin client wrapper so server pages can drop in a labeled recommendation row.
// The underlying carousel is client-only (Swiper + framer-motion), so it must
// live inside a client boundary. Renders nothing when there are no items, so
// there's no empty/thin row and no layout shift.
export default function RecommendationCarousel({
  title,
  items = [],
  headingId,
  className = '',
}: {
  title: string;
  items?: any[];
  headingId?: string;
  className?: string;
}) {
  if (!items || items.length === 0) return null;

  const id =
    headingId ?? `rec-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <section aria-labelledby={id} className={className}>
      <h2 id={id} className="mb-[24px] text-[16px] font-bold uppercase">
        {title}
      </h2>
      <SwiperCarouselClient items={items} />
    </section>
  );
}
