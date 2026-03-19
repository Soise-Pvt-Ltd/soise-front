'use client';

import { motion } from 'framer-motion';

export default function HeroClient() {
  return (
    <>
      {/* Background image — fixed so it stays "glued" while page scrolls */}
      <motion.div
        className="absolute inset-0 bg-[url('/hero.jpg')] bg-cover bg-fixed bg-center"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
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
            Wear the culture
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
            New Collection Available
          </motion.p>
        </div>
      </div>
    </>
  );
}
