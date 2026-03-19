'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function ExploreCollectionClient() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <div
      ref={ref}
      className="flex h-[464px] w-full flex-col justify-between bg-[#040000] p-[24px] md:p-[48px]"
    >
      <div className="flex flex-grow items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={
            isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }
          }
          transition={{
            duration: 0.9,
            delay: 0.15,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <Image
            src="/explore-collection.png"
            alt="Explore Collection"
            width={211}
            height={113}
          />
        </motion.div>
      </div>

      <div className="overflow-hidden">
        <motion.div
          initial={{ y: '100%' }}
          animate={isInView ? { y: 0 } : { y: '100%' }}
          transition={{
            duration: 0.7,
            delay: 0.4,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {/* <Link
            href="/shop/product-listing"
            className="mt-1 text-right text-[13px] tracking-[0.2em] text-white/60 !uppercase"
          >
            EXPLORE COLLECTION
          </Link> */}
        </motion.div>
      </div>
    </div>
  );
}
