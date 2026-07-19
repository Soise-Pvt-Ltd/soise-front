'use client';

import { LikeIcon } from '@/components/icons';
import Footer from '@/components/footer';
import { FilterIcon } from '@/components/icons';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useCurrency } from '@/lib/currency-context';
import { getDisplayPrice } from '@/lib/product-price';

interface Media {
  url: string;
  alt_text: string;
  variants: {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
  };
}

interface SampleVariant {
  media: Media[] | null;
  price?: number | null;
}

interface Collection {
  id: string;
  name: string;
}

interface Product {
  id: string | number;
  name: string;
  slug: string;
  base_price: number;
  material?: string;
  sample_variants?: SampleVariant[];
  primary_image?: string | null;
  title?: string; // For alt text
  collection: Collection | null;
}
interface ProductListingClientProps {
  products: Product[];
  initialCategory?: string;
}

export default function ProductListingClient({
  products,
  initialCategory,
}: ProductListingClientProps) {
  const { formatPrice } = useCurrency();
  // Defensive: the API shape isn't guaranteed, so normalize to a safe array
  // before any .length / .map / .filter access downstream.
  const safeProducts = Array.isArray(products) ? products : [];
  // Assuming products is an array of product objects, we can get unique categories.
  const categories = safeProducts.length
    ? [
        'All',
        ...new Set(
          safeProducts
            .filter((p) => p.collection)
            .map((p) => p.collection!.name),
        ),
      ]
    : [];

  // Pre-select the collection passed via ?collection= when it matches a known
  // category; otherwise fall back to the first category ("All") or a safe default.
  const defaultCategory =
    initialCategory && categories.includes(initialCategory)
      ? initialCategory
      : (categories[0] ?? 'All');
  const [activeCategory, setActiveCategory] = useState<string>(defaultCategory);

  const filteredProducts =
    activeCategory === 'All'
      ? safeProducts
      : safeProducts.filter(
          (product) => product.collection?.name === activeCategory,
        );

  function isNewProduct(createdAt?: string, days = 14): boolean {
    if (!createdAt) return false;
    const createdDate = new Date(createdAt);
    if (isNaN(createdDate.getTime())) return false;

    const now = new Date();
    const diffInMs = now.getTime() - createdDate.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    return diffInDays <= days;
  }

  const productsWithNewFlag = filteredProducts.map((products: any) => ({
    ...products,
    isNew: isNewProduct(products.created_at, 14),
  }));

  return (
    <>
      <div className="mx-auto md:max-w-7xl">
        <div className="pb-[33px]">
          <div className="px-[18px] md:px-0">
            <motion.div
              className="font-display text-[22px] capitalize"
              key={activeCategory}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeCategory}
            </motion.div>
            <div className="mb-[16px] flex items-center gap-y-[24px]">
              <FilterIcon />
              <span className="ml-2 font-medium uppercase">Filters</span>
            </div>
          </div>
          <div className="scrollbar-hide flex items-center gap-x-[8px] overflow-x-auto pl-[18px] md:pl-0">
            {categories.map((category, index) => (
              <motion.button
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
                key={index}
                className={`relative cursor-pointer rounded-full border-1 px-[12px] py-[6px] font-medium capitalize transition-colors duration-300 ${
                  activeCategory === category
                    ? 'border-[#121212] bg-[#121212] text-white'
                    : 'border-[#8E8E93] text-[#8E8E93] hover:border-[#121212] hover:text-[#121212]'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                {String(category)}
              </motion.button>
            ))}
          </div>
        </div>
        <div className="pb-[50px]">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-[80px] text-center">
              <p className="text-[16px] text-[#8E8E93]">
                No products available right now.
              </p>
              <p className="mt-2 text-[14px] text-[#AEAEB2]">
                Please check back soon.
              </p>
            </div>
          ) : productsWithNewFlag.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-[80px] text-center">
              <p className="text-[16px] text-[#8E8E93]">
                No products in this collection.
              </p>
              <button
                onClick={() => setActiveCategory('All')}
                className="mt-4 cursor-pointer text-[14px] underline hover:no-underline"
              >
                View all products
              </button>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-1 grid-cols-2 gap-x-[10px] gap-y-[24px] md:grid-cols-3 lg:grid-cols-4"
              key={activeCategory}
            >
              <AnimatePresence>
                {productsWithNewFlag?.map((product: any, index: number) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.06,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link
                    href={`/shop/product-listing/${product.slug}`}
                    className="text-inherit no-underline"
                  >
                    <motion.div
                      className="relative flex h-[244px] w-full flex-col"
                      whileHover={{
                        y: -6,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                      }}
                    >
                      {/* Badge */}
                      {product.isNew && (
                        <motion.div
                          className="absolute top-[10px] left-[10px] text-[12px] font-medium uppercase"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 + index * 0.06 }}
                        >
                          New
                        </motion.div>
                      )}

                      {/* Image */}
                      <div className="flex flex-1 items-center justify-center overflow-hidden">
                        {(() => {
                          const src =
                            product.primary_image ||
                            product.sample_variants?.[0]?.media?.[0]?.url;
                          return (
                            src && (
                              <motion.img
                                src={src}
                                alt={product.title || product.name}
                                className="size-[70%] max-h-full max-w-full object-contain"
                                whileHover={{ scale: 1.1 }}
                                transition={{
                                  duration: 0.6,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                              />
                            )
                          );
                        })()}
                      </div>
                    </motion.div>
                  </Link>

                  {/* Product name + price */}
                  <div className="mt-[10px] px-[7.5px] text-[14px] md:text-base">
                    <p className="truncate uppercase">{product.name}</p>
                    <div className="mt-1 font-medium">
                      {(() => {
                        const { amount, isFrom } = getDisplayPrice(product);
                        return (
                          <>
                            {isFrom && (
                              <span className="mr-1 text-[11px] font-normal text-[#8E8E93]">
                                from
                              </span>
                            )}
                            {formatPrice(amount)}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
