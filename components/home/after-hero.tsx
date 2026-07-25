import SwiperCarousel from '../caurosel';
import SectionHeader from './section-header';

export default function AfterHero({ products }: any) {
  return (
    <div className="my-[34px] px-[16px] md:my-[68px] md:px-[32px] xl:my-[98px] xl:px-[64px]">
      <SectionHeader index="01" title="Latest drop" />
      <SwiperCarousel items={products} />
    </div>
  );
}
