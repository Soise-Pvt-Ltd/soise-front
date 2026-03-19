import Nav from './nav/Nav';
import HeroClient from './hero-client';

export default function Hero() {
  return (
    <div className="relative h-[607px] w-full overflow-hidden">
      <HeroClient />
      <div className="relative z-10 h-full">
        <Nav />
      </div>
    </div>
  );
}
