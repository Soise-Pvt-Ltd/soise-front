'use client';

import { LikeIcon } from '@/components/icons';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import { FilterIcon } from '@/components/icons';
import Link from 'next/link';
import { useState } from 'react';

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

  return (
    <>
      <Nav />
      <div className="mx-auto md:max-w-7xl">
        <div className="pb-[33px]">
          <div className="px-[18px] md:px-0">
            <div className="font-display text-[22px] capitalize">
              {activeCategory}
            </div>
            <div className="mb-[16px] flex items-center gap-y-[24px]">
              <FilterIcon />
              <span className="ml-2 font-medium uppercase">Filters</span>
            </div>
          </div>
          <div className="scrollbar-hide flex items-center gap-x-[8px] overflow-x-auto pl-[18px] md:pl-0">
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
          </div>
        </div>
        <div className="pb-[50px]">
          <div className="grid grid-cols-1 grid-cols-2 gap-x-[10px] gap-y-[24px] md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts?.map((product: Product) => (
              <div key={product.id}>
                <Link
                  href={`/${product.slug}`}
                  className="text-inherit no-underline"
                >
                  <div className="flex h-[244px] w-full flex-col justify-between bg-[#F5F5F5] p-[10px]">
                    <div className="flex items-center justify-between">
                      <div className="text-[14px] font-medium uppercase">
                        {'New'}
                      </div>
                      <LikeIcon />
                    </div>
                    <div className="flex h-full items-center justify-center">
                      {product.sample_variants &&
                        product.sample_variants.length > 0 &&
                        product.sample_variants[0].media &&
                        product.sample_variants[0].media.length > 0 && (
                          <img
                            src={product.sample_variants[0].media[0].url}
                            alt={product.title || product.name}
                            className="mx-auto h-40 w-auto object-contain"
                          />
                        )}
                    </div>
                  </div>
                </Link>
                <div className="mt-[10px] flex items-center justify-between px-[7.5px] text-[14px] md:text-base">
                  <div className="min-w-0 flex-1">
                    <p className="truncate uppercase">{product.name}</p>
                  </div>
                  <div className="flex-shrink-0 pl-2 font-medium">
                    ${product.base_price.toFixed(2)}
                  </div>
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
