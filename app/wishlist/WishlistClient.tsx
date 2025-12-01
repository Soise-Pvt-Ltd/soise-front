'use client';

import { LikeIcon, LikeIconSolid } from '@/components/icons';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import { FilterIcon } from '@/components/icons';
import Link from 'next/link';
import { useState } from 'react';

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

  const [activeCategory, setActiveCategory] = useState<string>(categories[0]);

  const filteredProducts =
    activeCategory === 'All'
      ? products
      : products.filter((product) => product.category === activeCategory);

  return (
    <>
      <Nav />
      <div className="mx-auto md:max-w-7xl">
        <div className="pb-[35px]">
          <div className="px-[16px]">
            <div className="font-display text-[22px] capitalize">Wishlist</div>
            <div className="mb-[16px] flex items-center pt-[20px]">
              <FilterIcon />
              <span className="ml-2 font-medium uppercase">Filters</span>
            </div>
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
            {filteredProducts.map((product: Product) => (
              <div key={product.id}>
                <Link
                  href={`/${product.id}`}
                  className="text-inherit no-underline"
                >
                  <div className="h-[244px] w-full bg-[#F5F5F5] p-[10px]">
                    <div className="flex items-center justify-between">
                      <div></div>
                      <LikeIconSolid />
                    </div>
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="mx-auto h-40 w-auto object-contain"
                    />
                  </div>
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
                    ${product.price.toFixed(0)}
                  </div>
                  <button className="btn_black mt-[16px]">Add</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
