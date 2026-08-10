'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { HomepageTexts } from './hero';
import { heroImage, isTransformable } from '@/lib/images';

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
  // started downloading last. Format negotiation cuts it to ~107KB and the
  // preload lets the browser start it immediately.
  const heroUrl = img || '/hero.jpg';
  const heroSrc = heroImage(heroUrl);

  // 1600px is the desktop ceiling, but it was going to phones too — 160KB to
  // paint a ~400px-wide viewport. Cloudflare can cut the same frame to any
  // width, so let the browser pick: a 640w phone takes ~31KB instead.
  //
  // Gated on isTransformable, NOT on a substring of the URL: the /hero.jpg
  // fallback (and any non-Cloudflare CMS URL) passes through heroImage()
  // untouched, which would emit a srcSet of four identical URLs.
  const heroSrcSet = isTransformable(heroUrl)
    ? [640, 960, 1280, 1600]
        .map((w) => `${heroImage(heroUrl, w)} ${w}w`)
        .join(', ')
    : undefined;

  return (
    <>
      {/*
        No hand-written <link rel="preload"> here any more. React 19 emits one
        automatically for the eager <img> below — carrying its fetchPriority,
        srcSet and sizes — so an explicit hint just duplicated it. That's the
        same auto-preload behaviour that was hoisting five carousel cards ahead
        of this image; the fix was to make those lazy, not to fight it here.
      */}
      {/* Background image with a slow, expensive-feeling settle */}
      <motion.div
        className="absolute inset-0"
        initial={reduceMotion ? false : { scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.4, ease: EASE }}
      >
        {/*
          Was a CSS background-image. As an <img> it stays discoverable by the
          preload scanner AND can carry srcSet — a background can't. Decorative:
          the headline below is the real content, so it's aria-hidden with an
          empty alt.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroSrc}
          srcSet={heroSrcSet}
          sizes={heroSrcSet ? '100vw' : undefined}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover object-center"
        />
      </motion.div>
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
