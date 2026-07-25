'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface ImageGallerySectionProps {
  images: string[];
}

// The bundled fallback stills are transparent-background product cutouts,
// not full-bleed editorial photography. Admin-uploaded replacements (via
// homeImages.gallery_1/2/3) are expected to be real photos and should still
// fill the card edge-to-edge like the rest of the homepage.
const FALLBACK_IMAGES = new Set([
  '/before-explore-collection-1.png',
  '/before-explore-collection-2.png',
  '/before-explore-collection-3.png',
]);

export default function ImageGallerySection({
  images,
}: ImageGallerySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <div ref={ref} className="bg-[#F5F5F5] py-23">
      {/* Mobile: edge-to-edge snap strip (was a fixed-width row that overflowed
          the viewport and dragged the whole page sideways). Desktop: 3-up grid.
          The source stills are transparent-background cutouts, not full-bleed
          photography, so object-cover alone left the subject stranded in a sea
          of see-through card background (the "cut"/bordered look). Each card
          now gets its own dark backdrop so the cutout reads as a composed
          product shot instead of a cropped photo with visible edges. */}
      <div className="scrollbar-hide flex snap-x snap-mandatory gap-[16px] overflow-x-auto px-[16px] md:grid md:snap-none md:grid-cols-3 md:gap-[48px] md:overflow-visible md:px-[32px] xl:gap-[64px] xl:px-[64px]">
        {images.map((src, index) => {
          const isCutoutFallback = FALLBACK_IMAGES.has(src);
          return (
            <motion.div
              key={index}
              className={`relative h-[280px] w-[72vw] flex-shrink-0 snap-center overflow-hidden md:h-[464px] md:w-auto ${
                isCutoutFallback ? 'bg-[#0B0B0C]' : ''
              }`}
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={
                isInView
                  ? { opacity: 1, y: 0, scale: 1 }
                  : { opacity: 0, y: 60, scale: 0.95 }
              }
              transition={{
                duration: 0.8,
                delay: index * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <motion.img
                src={src}
                alt={`SOISE editorial ${index + 1}`}
                className={
                  isCutoutFallback
                    ? 'absolute inset-0 h-full w-full object-contain object-center p-[12px]'
                    : 'h-full w-full object-cover'
                }
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
