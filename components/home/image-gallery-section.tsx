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
          These are raw, untrimmed renders on purpose — no Cloudinary crop, no
          local pre-crop. object-contain guarantees the full render is always
          visible with zero cropping, whatever its actual aspect ratio turns
          out to be; a card shaped to *guess* that aspect and object-cover
          was what caused every crop/zoom bug in this section so far. */}
      <div className="scrollbar-hide flex snap-x snap-mandatory gap-[16px] overflow-x-auto px-[16px] md:grid md:snap-none md:grid-cols-3 md:gap-[48px] md:overflow-visible md:px-[32px] xl:gap-[64px] xl:px-[64px]">
        {images.map((src, index) => (
          <motion.div
            key={index}
            className="relative aspect-[3/4] w-[72vw] flex-shrink-0 snap-center overflow-hidden bg-[#0B0B0C] md:w-auto"
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
