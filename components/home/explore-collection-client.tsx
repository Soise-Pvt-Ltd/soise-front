'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon } from '../icons';

interface ExploreCollectionClientProps {
  image?: string | null;
}

const EASE = [0.22, 1, 0.36, 1] as const;

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
      className="relative flex min-h-[520px] w-full flex-col justify-between overflow-hidden bg-[#040000] p-[24px] md:p-[48px]"
    >
      {isCustom ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            src={src}
            alt="Explore Collection"
            // Below the fold — see the note in caurosel.tsx. Eager here cost a
            // 148KB w_1400 preload ahead of the hero.
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={
              isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.08 }
            }
            transition={{ duration: 1.2, ease: EASE }}
          />
          {/* Keep the closing statement legible over any image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </>
      ) : (
        <div className="flex flex-grow items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={
              isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }
            }
            transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
          >
            {isRemote ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt="Explore Collection"
                width={211}
                height={113}
                loading="lazy"
                decoding="async"
              />
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

      {/* Closing statement — the collection's question, then a way in. */}
      <div className="relative z-10 mt-auto">
        <div className="overflow-hidden">
          <motion.p
            className="font-display text-[36px] leading-[1.05] text-white md:text-[56px]"
            initial={{ y: '110%' }}
            animate={isInView ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 0.9, delay: 0.3, ease: EASE }}
          >
            Do you have <span className="italic">motion</span>?
          </motion.p>
        </div>
        <div className="overflow-hidden">
          <motion.div
            initial={{ y: '110%' }}
            animate={isInView ? { y: 0 } : { y: '110%' }}
            transition={{ duration: 0.9, delay: 0.45, ease: EASE }}
          >
            <Link
              href="/shop/product-listing"
              className="group mt-4 inline-flex items-center gap-2 text-[12px] tracking-[0.25em] text-white/60 uppercase transition-colors duration-200 hover:text-white"
            >
              Explore the collection
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                <ArrowRightIcon />
              </span>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
