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

/**
 * PRESSED INK — the saved-items grid, pressed to match the checkout these
 * pieces are headed for (see the brut- tokens in globals.css). Bone paper,
 * plated cards, money in Instrument Serif, one crimson accent.
 */
const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

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
      {/* Bone ground runs behind the footer too, so the page has one paper. */}
      <div className="bg-[#F5F0E8] text-[#121212]">
        <div className="page-shell px-[16px] pt-10 pb-[50px]">
          <header className="brut-rise">
            <p className="brut-label text-[#B3101C]">Saved for later</p>
            <h1
              className="mt-4 text-[48px] leading-[0.95] tracking-tight uppercase sm:text-[72px]"
              style={serif}
            >
              Wishlist<span className="text-[#B3101C]">.</span>
            </h1>
            <p className="brut-rule mt-8 pt-[16px] text-[11px] font-bold tracking-[0.16em] text-[#5C544A] uppercase">
              {list.length > 0
                ? `${list.length} item${list.length > 1 ? 's' : ''} saved`
                : 'Items you save will appear here.'}
            </p>
          </header>

          {list.length === 0 ? (
            <div
              className="brut-rise brut-plate brut-shadow mt-[28px] flex flex-col items-center justify-center px-6 py-[72px] text-center"
              style={{ animationDelay: '0.08s' }}
            >
              <p
                className="text-[30px] leading-[0.95] tracking-tight uppercase sm:text-[40px]"
                style={serif}
              >
                Your wishlist is empty.
              </p>
              <Link
                href="/shop/product-listing"
                className="brut-press mt-[26px] inline-flex h-[50px] items-center justify-center rounded-[2px] border-2 border-[#121212] bg-[#121212] px-[34px] text-[12px] font-bold tracking-[0.14em] text-white uppercase"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="brut-rise pt-[28px]" style={{ animationDelay: '0.08s' }}>
              <div className="grid grid-cols-2 gap-x-[16px] gap-y-[28px] md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 4xl:grid-cols-6">
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
                        <div className="brut-plate brut-press relative h-[244px] w-full p-[10px]">
                          <div className="flex items-center justify-end">
                            {/* A small ink plate. The heart glyph ships with a
                                hardcoded black fill, so it's inverted here
                                rather than in components/icons.tsx. */}
                            <button
                              type="button"
                              aria-label="Remove from wishlist"
                              title="Remove from wishlist"
                              onClick={() => handleRemove(product.productId)}
                              disabled={removingId === product.productId}
                              className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[2px] border-2 border-[#121212] bg-[#121212] transition-transform duration-150 hover:-translate-y-[2px] active:translate-y-[1px] disabled:opacity-40 [&_svg_path]:fill-white"
                            >
                              <LikeIconSolid />
                            </button>
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
                              <div className="mx-auto flex h-40 items-center justify-center text-[12px] text-[#5C544A]">
                                No image
                              </div>
                            )}
                          </Link>
                          {soldOut && (
                            <span className="absolute bottom-2 left-2 rounded-[2px] border-2 border-[#121212] bg-[#121212] px-2 py-[2px] text-[10px] font-bold tracking-[0.12em] text-white uppercase">
                              Unavailable
                            </span>
                          )}
                        </div>
                        <div className="mt-[12px] px-[2px] text-[14px] md:text-base">
                          <Link href={href} className="text-inherit no-underline">
                            <p className="truncate uppercase">{product.name}</p>
                          </Link>
                          {/* Money speaks serif, the same voice it keeps on
                              the listing, in the bag and at PAY. */}
                          <div className="mt-1 text-[16px]" style={serif}>
                            {formatPrice(product.price)}
                          </div>
                          <Link href={href}>
                            <button
                              type="button"
                              className="brut-btn-paper brut-press mt-[16px] !h-[46px] !text-[11px]"
                            >
                              View Product
                            </button>
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
      </div>
    </>
  );
}
