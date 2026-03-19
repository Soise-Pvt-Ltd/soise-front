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
    <div
      ref={ref}
      className="bg-[#F5F5F5] px-[16px] py-23 md:px-[32px] xl:px-[64px]"
    >
      <div className="flex items-center space-x-[48px] md:space-x-[98px]">
        {images.map((src, index) => (
          <motion.div
            key={index}
            className="mb-[24px] h-[280px] w-[170px] overflow-hidden md:h-[464px] md:w-full"
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
              alt={`Before Explore ${index + 1}`}
              className="h-full w-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
