'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ExploreCollectionClientProps {
  image?: string | null;
}

export default function ExploreCollectionClient({
  image,
}: ExploreCollectionClientProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const src = image || '/explore-collection.png';
  const isRemote = /^https?:\/\//.test(src);
  // An admin-uploaded graphic fills the whole panel (like the hero/featured
  // backgrounds). The bundled default is a small transparent logo, so it keeps
  // its centered-on-dark treatment.
  const isCustom = Boolean(image);

  return (
    <div
      ref={ref}
      className="relative flex h-[464px] w-full flex-col justify-between overflow-hidden bg-[#040000] p-[24px] md:p-[48px]"
    >
      {isCustom ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={src}
            alt="Explore Collection"
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={
              isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.08 }
            }
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          />
          {/* Keep the bottom caption legible over any image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </>
      ) : (
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
            {isRemote ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="Explore Collection" width={211} height={113} />
            ) : (
              <Image
                src={src}
                alt="Explore Collection"
                width={211}
                height={113}
              />
            )}
          </motion.div>
        </div>
      )}

      <div className="relative z-10 overflow-hidden">
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
