"use client";

import SwiperCarousel from "../caurosel";

export default function AfterHero() {
   const items  = ([
    { title: "Nike Air Max", price: Math.random() * 200, tag: "Hot" },
    { title: "Adidas Runner", price: Math.random() * 200 },
    { title: "Puma X90", price: Math.random() * 200, tag: "New" },
    { title: "Jordan 4 Retro", price: Math.random() * 200 },
  ]);

  return (
    <div className="my-[34px] md:my-[68px] xl:my-[98px] px-[16px] md:px-[32px] xl:px-[64px]">
      <SwiperCarousel items={items} />
    </div>
  );
}
