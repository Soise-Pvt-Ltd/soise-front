'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRightIcon } from '../icons';
import Link from 'next/link';

export default function MensTopsClient() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <div
      ref={ref}
      className="relative flex h-[464px] w-full flex-col justify-between overflow-hidden p-[24px] md:p-[48px]"
    >
      {/* Background with subtle zoom on scroll */}
      <motion.div
        className="absolute inset-0 bg-[url('/mens-top.jpg')] bg-cover bg-center"
        initial={{ scale: 1.15 }}
        animate={isInView ? { scale: 1 } : { scale: 1.15 }}
        transition={{ duration: 1.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      />

      {/* Gradient overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />

      <div className="relative z-10"></div>
      <div className="relative z-10 flex items-center justify-between">
        <div></div>
        <div>
          <div className="overflow-hidden">
            <motion.p
              className="font-display text-[28px] text-white/90 md:text-[36px]"
              initial={{ y: '100%' }}
              animate={isInView ? { y: 0 } : { y: '100%' }}
              transition={{
                duration: 0.7,
                delay: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              Men&apos;s Tops
            </motion.p>
          </div>
          <div className="overflow-hidden">
            <motion.div
              initial={{ y: '100%' }}
              animate={isInView ? { y: 0 } : { y: '100%' }}
              transition={{
                duration: 0.7,
                delay: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Link
                href="/shop/product-listing"
                className="group flex items-center justify-end gap-2 text-right text-white/60 transition-colors duration-200 hover:text-white"
              >
                <span className="text-[13px] tracking-[0.2em] uppercase">
                  Explore Collection
                </span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowRightIcon />
                </span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
