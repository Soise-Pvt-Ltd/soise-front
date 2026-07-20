'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import { LikeIcon } from './icons';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import type { CSSProperties } from 'react';
import { useCurrency } from '@/lib/currency-context';
import { getDisplayPrice } from '@/lib/product-price';

export default function SwiperCarouselClient({ items: products }: any) {
  const { formatPrice } = useCurrency();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  function isNewProduct(createdAt: string, days = 14): boolean {
    const createdDate = new Date(createdAt);
    const now = new Date();

    const diffInMs = now.getTime() - createdDate.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    return diffInDays <= days;
  }

  const productsWithNewFlag = products.map((products: any) => ({
    ...products,
    isNew: isNewProduct(products.created_at, 14),
  }));

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <Swiper
        breakpoints={{
          0: { slidesPerView: 1.2, spaceBetween: 8 },
          640: { slidesPerView: 2.2, spaceBetween: 12 },
          768: { slidesPerView: 2.5, spaceBetween: 16 },
          1024: { slidesPerView: 3.2, spaceBetween: 20 },
        }}
      >
        {productsWithNewFlag.map((item: any, index: number) => (
          <SwiperSlide key={item.id || index}>
            <motion.div
              className="mx-auto w-full"
              initial={{ opacity: 0, y: 30 }}
              animate={
                isInView
                  ? { opacity: 1, y: 0 }
                  : { opacity: 0, y: 30 }
              }
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Link href={`/shop/product-listing/${item.slug}`}>
                <motion.div
                  className="flex h-[357px] flex-col rounded-[10px]"
                  whileHover={{
                    y: -6,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                  }}
                >
                  {/* Photo(s) - swipable when the variant has more than one */}
                  <div className="relative flex flex-1 items-center justify-center overflow-hidden">
                    {(() => {
                      const rawMedia =
                        (item.sample_variants?.[0]?.media?.length &&
                          item.sample_variants[0].media) ||
                        (item.images?.length && item.images) ||
                        (item.primary_image ? [{ url: item.primary_image }] : []);
                      const photoUrls: string[] = (rawMedia ?? [])
                        .map((m: { url?: string } | null) => m?.url)
                        .filter((url: string | undefined): url is string => Boolean(url));

                      if (photoUrls.length === 0) return null;

                      if (photoUrls.length === 1) {
                        return (
                          <motion.img
                            src={photoUrls[0]}
                            alt={item.title || item.name}
                            className="h-full w-full object-contain"
                            whileHover={{ scale: 1.08 }}
                            transition={{
                              duration: 0.6,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                          />
                        );
                      }

                      return (
                        <Swiper
                          modules={[Pagination]}
                          pagination={{ clickable: true }}
                          nested
                          className="h-full w-full"
                          style={
                            {
                              '--swiper-pagination-color': '#fff',
                              '--swiper-pagination-bullet-inactive-color': '#fff',
                              '--swiper-pagination-bullet-inactive-opacity': '0.5',
                              '--swiper-pagination-bullet-size': '5px',
                              '--swiper-pagination-bottom': '8px',
                            } as CSSProperties
                          }
                          onClick={(_swiper, e) => {
                            const target = e.target as HTMLElement;
                            if (target.closest('.swiper-pagination-bullet')) {
                              e.stopPropagation();
                            }
                          }}
                        >
                          {photoUrls.map((url, photoIndex) => (
                            <SwiperSlide
                              key={url || photoIndex}
                              className="flex items-center justify-center"
                            >
                              <img
                                src={url}
                                alt={item.title || item.name}
                                className="h-full w-full object-contain"
                              />
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      );
                    })()}
                  </div>
                </motion.div>
              </Link>

              {/* Product Info */}
              <motion.div
                className="mt-[10px] text-[14px] md:text-base"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              >
                <div className="truncate uppercase">{item.name}</div>
                <div className="mt-1 font-medium">
                  {(() => {
                    const { amount, isFrom } = getDisplayPrice(item);
                    return (
                      <>
                        {isFrom && (
                          <span className="mr-1 text-[11px] font-normal text-[#8E8E93]">
                            from
                          </span>
                        )}
                        {formatPrice(amount)}
                      </>
                    );
                  })()}
                </div>
              </motion.div>
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>
    </motion.div>
  );
}
