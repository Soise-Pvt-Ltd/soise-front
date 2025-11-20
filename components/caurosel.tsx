"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { LikeIcon } from "./icons";

interface SwiperCarouselProps {
  items: {
    title: string;
    price?: number;
    tag?: string;
  }[];
}

export default function SwiperCarouselClient({ items }: SwiperCarouselProps) {
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
        {items.map((item, index) => (
          <SwiperSlide key={index}>
            <div className="h-[357px] w-full rounded-[10px] bg-[#F5F5F5] p-[10px]">
              <div className="flex justify-between items-center">
                <div className="uppercase text-[14px] font-medium">
                  {item.tag || "New"}
                </div>
                <LikeIcon />
              </div>
            </div>

            <div className="flex justify-between items-center px-[10px] mt-[10px] text-[14px] md:text-base">
              <div className="flex-wrap uppercase">{item.title}</div>
              <div className="font-medium pl-20">
                ${item.price?.toFixed(2)}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
