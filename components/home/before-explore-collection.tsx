import SwiperCarousel from '../caurosel';
import SectionHeader from './section-header';

export default function BeforeExploreCollection({ products }: any) {
  return (
    <div className="my-[34px] px-[16px] md:my-[68px] md:px-[32px] xl:my-[98px] xl:px-[64px]">
      <SectionHeader index="02" title="The rotation" />
      <SwiperCarousel items={products} />
    </div>
  );
}
