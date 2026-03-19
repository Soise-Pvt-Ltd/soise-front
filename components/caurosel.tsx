'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { LikeIcon } from './icons';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { useCurrency } from '@/lib/currency-context';

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
                  className="flex h-[357px] flex-col rounded-[10px] bg-[#F5F5F5] p-[15px]"
                  whileHover={{
                    y: -6,
                    boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                  }}
                >
                  {/* Image Container */}
                  <div className="flex flex-1 items-center justify-center overflow-hidden rounded-sm">
                    <motion.img
                      src={item.sample_variants?.[0]?.media?.[0]?.url}
                      alt={item.title || item.name}
                      className="size-[70%] object-cover"
                      whileHover={{ scale: 1.08 }}
                      transition={{
                        duration: 0.6,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  </div>
                </motion.div>
              </Link>

              {/* Product Info */}
              <motion.div
                className="mt-[10px] flex items-center justify-between text-[14px] md:text-base"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              >
                <div className="max-w-[65%] truncate uppercase">
                  {item.name}
                </div>
                <div className="font-medium whitespace-nowrap">
                  {formatPrice(item.base_price ?? 0)}
                </div>
              </motion.div>
            </motion.div>
          </SwiperSlide>
        ))}
      </Swiper>
    </motion.div>
  );
}
