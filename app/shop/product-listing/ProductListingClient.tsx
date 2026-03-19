'use client';

import { LikeIcon } from '@/components/icons';
import Footer from '@/components/footer';
import { FilterIcon } from '@/components/icons';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useCurrency } from '@/lib/currency-context';

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
  title?: string; // For alt text
  collection: Collection | null;
}
interface ProductListingClientProps {
  products: Product[];
}

export default function ProductListingClient({
  products,
}: ProductListingClientProps) {
  const { formatPrice } = useCurrency();
  // Assuming products is an array of product objects, we can get unique categories.
  const categories = products?.length
    ? [
        'All',
        ...new Set(
          products.filter((p) => p.collection).map((p) => p.collection!.name),
        ),
      ]
    : [];

  const [activeCategory, setActiveCategory] = useState<string>(categories[0]);

  const filteredProducts =
    activeCategory === 'All'
      ? products
      : products.filter(
          (product) => product.collection?.name === activeCategory,
        );

  function isNewProduct(createdAt: string, days = 14): boolean {
    const createdDate = new Date(createdAt);
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
              <motion.div
                onClick={() => setActiveCategory(category)}
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
              </motion.div>
            ))}
          </div>
        </div>
        <div className="pb-[50px]">
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
                      className="relative flex h-[244px] w-full flex-col bg-[#F5F5F5] p-[10px]"
                      whileHover={{
                        y: -6,
                        boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
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
                        {product.sample_variants?.[0]?.media?.[0]?.url && (
                          <motion.img
                            src={product.sample_variants[0].media[0].url}
                            alt={product.title || product.name}
                            className="size-[70%] max-h-full max-w-full object-contain"
                            whileHover={{ scale: 1.1 }}
                            transition={{
                              duration: 0.6,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                          />
                        )}
                      </div>
                    </motion.div>
                  </Link>

                  {/* Product name + price */}
                  <div className="mt-[10px] flex items-center justify-between px-[7.5px] text-[14px] md:text-base">
                    <div className="min-w-0 flex-1">
                      <p className="truncate uppercase">{product.name}</p>
                    </div>
                    <div className="flex-shrink-0 pl-2 font-medium">
                      {formatPrice(product.base_price)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
}
