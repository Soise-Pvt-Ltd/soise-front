'use client';

import { LikeIcon, LikeIconSolid } from '@/components/icons';
import Footer from '@/components/footer';
import { FilterIcon } from '@/components/icons';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useCurrency } from '@/lib/currency-context';

interface Product {
  id: string | number;
  title: string;
  price: number;
  thumbnail: string;
  category: string;
}
interface ProductListingClientProps {
  products: Product[];
}
export default function WishlistClient({
  products,
}: ProductListingClientProps) {
  // Assuming products is an array of product objects, we can get unique categories.
  const categories = products?.length
    ? ['All', ...new Set(products.map((p: Product) => p.category))]
    : [];

  const { formatPrice } = useCurrency();
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]);

  const filteredProducts =
    activeCategory === 'All'
      ? products
      : products.filter((product) => product.category === activeCategory);

  return (
    <>
      <div className="mx-auto md:max-w-7xl">
        <div className="pb-[35px]">
          <div className="px-[16px]">
            <motion.div
              className="font-display text-[22px] capitalize"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              Wishlist
            </motion.div>
            <motion.div
              className="mb-[16px] flex items-center pt-[20px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <FilterIcon />
              <span className="ml-2 font-medium uppercase">Filters</span>
            </motion.div>
          </div>
          {/* <div className="scrollbar-hide flex items-center gap-x-[8px] overflow-x-auto pl-[18px] md:pl-0">
            {categories.map((category, index) => (
              <div
                onClick={() => setActiveCategory(category)}
                key={index}
                className={`cursor-pointer rounded-full border-1 px-[12px] py-[6px] font-medium capitalize ${
                  activeCategory === category
                    ? 'border-[#121212] bg-[#121212] text-white'
                    : 'border-[#8E8E93] text-[#8E8E93]'
                }`}
              >
                {String(category)}
              </div>
            ))}
          </div> */}
        </div>
        <div className="pb-[50px]">
          <div className="grid grid-cols-1 grid-cols-2 gap-x-[10px] gap-y-[24px] md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((product: Product, index: number) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Link
                  href={`/${product.id}`}
                  className="text-inherit no-underline"
                >
                  <motion.div
                    className="h-[244px] w-full bg-[#F5F5F5] p-[10px]"
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
                    <div className="flex items-center justify-between">
                      <div></div>
                      <motion.div
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.85 }}
                      >
                        <LikeIconSolid />
                      </motion.div>
                    </div>
                    <motion.img
                      src={product.thumbnail}
                      alt={product.title}
                      className="mx-auto h-40 w-auto object-contain"
                      whileHover={{ scale: 1.08 }}
                      transition={{
                        duration: 0.6,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                  </motion.div>
                </Link>
                <div className="mt-[10px] px-[7.5px] px-[8px] text-[14px] md:text-base">
                  <div className="text=[#8E8E93] uppercase">
                    <div className="min-w-0 flex-1">
                      <p className="truncate uppercase">{product.title}</p>
                    </div>
                    <div className="text-[#8E8E93]">
                      <div className="flex-shrink-0">
                        Color: {product.category}
                      </div>
                      <div className="flex-shrink-0">
                        Size: {product.category}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 font-medium">
                    {formatPrice(product.price)}
                  </div>
                  <motion.button
                    className="btn_black mt-[16px]"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Add
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
