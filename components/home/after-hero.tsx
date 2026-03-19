'use client';

import SwiperCarousel from '../caurosel';

export default function AfterHero({ products }: any) {
  return (
    <div className="my-[34px] px-[16px] md:my-[68px] md:px-[32px] xl:my-[98px] xl:px-[64px]">
      <SwiperCarousel items={products} />
    </div>
  );
}
