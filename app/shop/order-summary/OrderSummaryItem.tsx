'use client';

import { motion } from 'framer-motion';
import { EnrichedCartItem } from '@/components/home/nav/types';
import { mediaThumb } from '@/lib/images';
import { useCurrency } from '@/lib/currency-context';

export function OrderSummaryItem({
  item,
  index = 0,
  onRemove,
  removing = false,
}: {
  item: EnrichedCartItem;
  index?: number;
  onRemove?: (id: string) => void;
  removing?: boolean;
}) {
  const { formatPrice } = useCurrency();
  const name = item.variantDetails?.product_name ?? 'Product';
  const color = item.variantDetails?.color ?? 'N/A';
  const size = item.variantDetails?.size ?? 'N/A';
  const price = item.variantDetails?.price ?? 0;
  const image =
    mediaThumb(item.variantDetails?.display_media?.[0]) ??
    mediaThumb(item.variantDetails?.media?.[0]) ??
    item.variantDetails?.product_primary_image ??
    undefined;

  return (
    <motion.div
      className="h-[120px] px-[20px]"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div className="flex w-full justify-between gap-x-[16px]">
        {/* Plate thumb: 2px ink border, hard corner, quantity as a stamped
            square riding the frame. */}
        <div className="relative h-[120px] w-[100px] shrink-0 rounded-[2px] border-2 border-[#121212] bg-[#f5f5f5]">
          <div className="absolute -top-[2px] -right-[2px] z-10 flex h-[22px] w-[22px] items-center justify-center border-2 border-[#121212] bg-[#121212] text-center text-[12px] font-bold text-white">
            {item.quantity}
          </div>
          {image && (
            <img
              src={image}
              alt={name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>
        <div className="flex w-full justify-between">
          <div className="flex flex-col py-[3px] text-[14px]">
            <div className="flex-wrap pb-[12px] font-medium tracking-[0.02em] uppercase">
              {name}
            </div>
            <div className="text-[12px] tracking-[0.06em] text-[#5C544A] uppercase">
              <div>{color}</div>
              <div className="mt-[2px]">Size {size}</div>
            </div>
          </div>
          <div className="flex flex-col justify-between py-[3px] text-right text-[14px]">
            <div
              className="text-[16px]"
              style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}
            >
              {formatPrice(price)}
            </div>
            <motion.button
              type="button"
              onClick={() => item.id && onRemove?.(item.id)}
              disabled={removing}
              className="cursor-pointer text-[11px] font-bold tracking-[0.1em] uppercase underline underline-offset-2 hover:no-underline disabled:cursor-not-allowed disabled:opacity-50"
              whileHover={removing ? {} : { scale: 1.05 }}
              whileTap={removing ? {} : { scale: 0.95 }}
            >
              {removing ? 'Removing…' : 'Remove'}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
