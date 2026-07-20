import Nav from './nav/Nav';
import HeroClient from './hero-client';

export interface HomepageTexts {
  hero_headline?: string | null;
  hero_subheadline?: string | null;
  mens_tops_title?: string | null;
  mens_tops_cta?: string | null;
}

interface HeroProps {
  img?: string | null;
  texts?: HomepageTexts;
}

export default function Hero({ img, texts }: HeroProps) {
  return (
    <div className="relative h-[607px] w-full overflow-hidden">
      <HeroClient img={img} texts={texts} />
      <div className="relative z-10 h-full">
        <Nav />
      </div>
    </div>
  );
}
