'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface ImageGallerySectionProps {
  images: string[];
}

export default function ImageGallerySection({
  images,
}: ImageGallerySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <div ref={ref} className="bg-[#F5F5F5] py-23">
      {/* Mobile: edge-to-edge snap strip (was a fixed-width row that overflowed
          the viewport and dragged the whole page sideways). Desktop: 3-up grid.
          Full renders, zero cropping -- object-contain guarantees that.
          Uploads are trimmed once, at upload time, by trim_transparent_margin
          in the backend's app/domain/media.py: it removes the dead transparent
          canvas margin around the subject and keeps 100% of the subject.
          (Cloudinary did this per-delivery with e_trim; Cloudflare Images has
          no equivalent transform, so it moved into the upload path.) Bundled
          /public fallbacks are pre-trimmed the same way. Trimming the empty
          margin is not the same thing as cropping into the subject -- that
          distinction is why this card is still object-contain and not
          object-cover.
          The cards deliberately have NO background of their own. The renders
          are transparent PNGs and e_trim leaves a ~1:3 subject inside a 3:4
          card, so any card colour shows as a large slab either side of the
          model -- which is what the black #0B0B0C was doing. Letting the
          section's #F5F5F5 show through reads as a cutout instead. */}
      <div className="scrollbar-hide flex snap-x snap-mandatory gap-[16px] overflow-x-auto px-[16px] md:grid md:snap-none md:grid-cols-3 md:gap-[48px] md:overflow-visible md:px-[32px] xl:gap-[64px] xl:px-[64px]">
        {images.map((src, index) => (
          <motion.div
            key={index}
            className="relative aspect-[3/4] w-[72vw] flex-shrink-0 snap-center overflow-hidden md:w-auto"
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
              // Below the fold, and previously eager: three full-resolution
              // renders downloading in parallel with the LCP hero.
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-contain object-center"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
