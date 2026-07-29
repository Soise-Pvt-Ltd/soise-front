'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { HomepageTexts } from './hero';
import { cloudinaryHero } from '@/lib/cloudinary';

interface HeroClientProps {
  img?: string | null;
  texts?: HomepageTexts;
}

const EASE = [0.22, 1, 0.36, 1] as const;

export default function HeroClient({ img, texts }: HeroClientProps) {
  const reduceMotion = useReducedMotion();
  const headline = texts?.hero_headline || 'Wear the culture';
  const subheadline = texts?.hero_subheadline || 'New Collection Available';

  // The LCP element. Two problems it used to have: the raw 309KB original was
  // served untransformed, and a CSS background-image can't be discovered until
  // the stylesheet has parsed — so the single most important pixel on the site
  // started downloading last. f_auto cuts it to ~107KB and the preload lets the
  // browser start it immediately.
  const heroSrc = cloudinaryHero(img || '/hero.jpg');

  return (
    <>
      <link rel="preload" as="image" href={heroSrc} fetchPriority="high" />
      {/* Background image with a slow, expensive-feeling settle */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroSrc})` }}
        initial={reduceMotion ? false : { scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.4, ease: EASE }}
      />
      {/* Gradient overlay for depth */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
      />

      {/* Bottom editorial block */}
      <div className="absolute bottom-14 left-0 z-10 w-full px-[24px] md:bottom-16 md:px-[48px]">
        <div className="overflow-hidden">
          <motion.p
            className="mb-2 text-[11px] tracking-[0.3em] text-white/60 uppercase"
            initial={reduceMotion ? false : { y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
          >
            {subheadline}
          </motion.p>
        </div>
        <div className="overflow-hidden">
          <motion.h1
            className="font-display text-[44px] leading-[1.05] text-white md:text-[72px] lg:text-[88px]"
            initial={reduceMotion ? false : { y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 1, delay: 0.65, ease: EASE }}
          >
            {headline}
          </motion.h1>
        </div>
      </div>

      {/* Scroll cue — a thin line that draws itself, then breathes */}
      <motion.div
        className="absolute bottom-0 left-1/2 z-10 hidden w-px -translate-x-1/2 bg-white/70 md:block"
        initial={{ height: 0, opacity: 0 }}
        animate={
          reduceMotion
            ? { height: 40, opacity: 0.7 }
            : { height: [0, 48, 40], opacity: [0, 1, 0.7] }
        }
        transition={{ duration: 1.4, delay: 1.6, ease: EASE }}
        aria-hidden="true"
      />
    </>
  );
}
