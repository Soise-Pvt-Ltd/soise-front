import Nav from './nav/Nav';
import HeroClient from './hero-client';

interface HeroProps {
  img?: string | null;
}

export default function Hero({ img }: HeroProps) {
  return (
    <div className="relative h-[607px] w-full overflow-hidden">
      <HeroClient img={img} />
      <div className="relative z-10 h-full">
        <Nav />
      </div>
    </div>
  );
}
