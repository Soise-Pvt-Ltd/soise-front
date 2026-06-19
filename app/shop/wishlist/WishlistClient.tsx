'use client';

import { LikeIconSolid } from '@/components/icons';
import Footer from '@/components/footer';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '@/lib/currency-context';
import { showToast } from '@/lib/toast-utils';
import { Toaster } from 'sonner';
import { removeFromWishlist } from './actions';

export interface WishlistItem {
  id: string;
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  status: string;
}

export default function WishlistClient({ items }: { items: WishlistItem[] }) {
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const [list, setList] = useState<WishlistItem[]>(items);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (productId: string) => {
    if (!productId || removingId) return;
    setRemovingId(productId);
    const previous = list;
    setList((prev) => prev.filter((p) => p.productId !== productId));
    const result = await removeFromWishlist(productId);
    if (!result.success) {
      setList(previous);
      showToast.error('Could not remove item. Please try again.');
    } else {
      router.refresh();
    }
    setRemovingId(null);
  };

  return (
    <>
      <Toaster position="top-center" />
      <div className="mx-auto md:max-w-7xl">
        <div className="px-[16px] pt-[8px] pb-[35px]">
          <motion.div
            className="font-display text-[22px] capitalize"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            Wishlist
          </motion.div>
          <div className="pt-[8px] text-[14px] text-[#8E8E93]">
            {list.length > 0
              ? `${list.length} item${list.length > 1 ? 's' : ''} saved`
              : 'Items you save will appear here.'}
          </div>
        </div>

        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-[80px] text-center">
            <p className="text-[16px] text-[#8E8E93]">
              Your wishlist is empty.
            </p>
            <Link
              href="/shop/product-listing"
              className="btn_black mt-6 flex max-w-[280px] items-center justify-center"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="pb-[50px]">
            <div className="grid grid-cols-2 gap-x-[10px] gap-y-[24px] md:grid-cols-3 lg:grid-cols-4">
              <AnimatePresence>
                {list.map((product, index) => {
                  const href = product.slug
                    ? `/shop/product-listing/${product.slug}`
                    : '/shop/product-listing';
                  const soldOut = product.status !== 'active';
                  return (
                    <motion.div
                      key={product.id || product.productId}
                      layout
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{
                        duration: 0.45,
                        delay: index * 0.05,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      <div className="relative h-[244px] w-full bg-[#F5F5F5] p-[10px]">
                        <div className="flex items-center justify-end">
                          <motion.button
                            type="button"
                            aria-label="Remove from wishlist"
                            title="Remove from wishlist"
                            onClick={() => handleRemove(product.productId)}
                            disabled={removingId === product.productId}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.85 }}
                            className="cursor-pointer disabled:opacity-50"
                          >
                            <LikeIconSolid />
                          </motion.button>
                        </div>
                        <Link href={href}>
                          {product.image ? (
                            <motion.img
                              src={product.image}
                              alt={product.name}
                              className="mx-auto h-40 w-auto object-contain"
                              whileHover={{ scale: 1.08 }}
                              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            />
                          ) : (
                            <div className="mx-auto flex h-40 items-center justify-center text-[12px] text-[#AEAEB2]">
                              No image
                            </div>
                          )}
                        </Link>
                        {soldOut && (
                          <span className="absolute bottom-2 left-2 rounded-[4px] bg-black/80 px-2 py-1 text-[10px] text-white uppercase">
                            Unavailable
                          </span>
                        )}
                      </div>
                      <div className="mt-[10px] px-[8px] text-[14px] md:text-base">
                        <Link href={href} className="text-inherit no-underline">
                          <p className="truncate uppercase">{product.name}</p>
                        </Link>
                        <div className="mt-1 font-medium">
                          {formatPrice(product.price)}
                        </div>
                        <Link href={href}>
                          <motion.button
                            className="btn_black mt-[16px]"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                          >
                            View Product
                          </motion.button>
                        </Link>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
