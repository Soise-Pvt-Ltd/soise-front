'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { LikeIcon } from './icons';
import Link from 'next/link';

export default function SwiperCarouselClient({ items }: any) {
  return (
    <div>
      <Swiper
        breakpoints={{
          0: { slidesPerView: 1.2, spaceBetween: 8 },
          640: { slidesPerView: 2.2, spaceBetween: 12 },
          768: { slidesPerView: 2.5, spaceBetween: 16 },
          1024: { slidesPerView: 3.2, spaceBetween: 20 },
        }}
      >
        {items.map((item: any, index: number) => (
          <SwiperSlide key={index}>
            <Link href={`/${item.id}`}>
              <div className="h-[357px] w-full rounded-[10px] bg-[#F5F5F5] p-[10px]">
                <div className="flex items-center justify-between">
                  <div className="text-[14px] font-medium uppercase">
                    {item.tag || 'New'}
                  </div>
                  <LikeIcon />
                </div>
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="mx-auto h-full w-auto object-contain pt-[44px] pb-[46px]"
                />
              </div>
            </Link>

            <div className="mt-[10px] flex items-center justify-between px-[10px] text-[14px] md:text-base">
              <div className="flex-wrap truncate uppercase">{item.title}</div>
              <div className="pl-20 font-medium">${item.price?.toFixed(2)}</div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
