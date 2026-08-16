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
        <div className="relative h-[120px] w-[100px] rounded-[6px] bg-[#f5f5f5]">
          <div className="flex justify-between">
            <div></div>
            <div className="z-10 m-[8px] flex h-[18px] w-[18px] items-center justify-center rounded-[4px] bg-[#121212] text-center text-[12px] text-white">
              {item.quantity}
            </div>
          </div>
          {image && (
            <img
              src={image}
              alt={name}
              className="absolute inset-0 h-full w-full rounded-[6px] object-cover"
            />
          )}
        </div>
        <div className="flex w-full justify-between">
          <div className="flex flex-col py-[3px] text-[14px]">
            <div className="flex-wrap pb-[16px] font-medium uppercase">
              {name}
            </div>
            <div className="text-[#8E8E93]">
              <div>
                Color: <span className="uppercase">{color}</span>
              </div>
              <div>
                Size: <span className="uppercase">{size}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-between py-[3px] text-right text-[14px]">
            <div>{formatPrice(price)}</div>
            <motion.button
              type="button"
              onClick={() => item.id && onRemove?.(item.id)}
              disabled={removing}
              className="cursor-pointer uppercase underline hover:no-underline disabled:cursor-not-allowed disabled:opacity-50"
              whileHover={removing ? {} : { scale: 1.05 }}
              whileTap={removing ? {} : { scale: 0.95 }}
            >
              {removing ? 'Removing...' : 'Remove'}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
