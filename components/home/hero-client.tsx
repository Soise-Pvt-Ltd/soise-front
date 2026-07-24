'use client';

import { motion } from 'framer-motion';
import type { HomepageTexts } from './hero';

interface HeroClientProps {
  img?: string | null;
  texts?: HomepageTexts;
}

export default function HeroClient({ img, texts }: HeroClientProps) {
  const headline = texts?.hero_headline || 'Wear the culture';
  const subheadline = texts?.hero_subheadline || 'New Collection Available';

  return (
    <>
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${img || '/hero.jpg'})` }}
      />
      {/* Gradient overlay for depth */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.3 }}
      />

      {/* Bottom tagline */}
      <div className="absolute bottom-12 left-0 z-10 w-full px-[24px] md:px-[48px]">
        <div className="overflow-hidden">
          <motion.p
            className="font-display text-[28px] text-white/90 md:text-[36px]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.6,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {headline}
          </motion.p>
        </div>
        <div className="overflow-hidden">
          <motion.p
            className="mt-1 text-[13px] tracking-[0.2em] text-white/60 uppercase"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {subheadline}
          </motion.p>
        </div>
      </div>
    </>
  );
}
