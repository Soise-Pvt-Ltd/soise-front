'use client';

import { useState, useMemo } from 'react';
import Nav from '@/components/nav';
import Footer from '@/components/footer';

import { LikeIcon } from '@/components/icons';
import SwiperCarouselClient from '@/components/caurosel';

export interface ProductDetail {
  id: number;
  title: string;
  category: string;
  description: string;
  price: number;
  images: string[];
}

export default function ProductPageClient({
  product,
  recommendedProducts,
}: {
  product: ProductDetail | null;
  recommendedProducts: ProductDetail[];
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const mainImage = useMemo(() => {
    if (selectedImage) return selectedImage;
    if (product?.images?.length) return product.images[0];
    return '';
  }, [selectedImage, product?.images]);

  if (!product) {
    return <div>Product not found.</div>;
  }

  const color = ['#2A2A2A', '#33567A', '#33567A'];
  const size = ['s', 'm', 'l', 'xl', 'xxl'];

  return (
    <>
      <Nav />
      <div className="mx-auto md:max-w-7xl">
        <div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
            {/* Image Gallery Section */}
            <div className="md:col-span-3">
              <div className="mb-4 h-[501px] w-full bg-[#F5F5F5] p-[10px] md:h-full">
                <div className="flex items-center justify-between p-[30px]">
                  <div></div>
                  <LikeIcon />
                </div>
                <img
                  src={mainImage}
                  alt={product.title}
                  className="mx-auto h-80 w-auto object-contain"
                />
              </div>
              {/* <div className="flex space-x-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`${product.title} thumbnail ${index + 1}`}
                  onClick={() => setSelectedImage(image)}
                  className={`h-20 w-20 cursor-pointer rounded-md border-2 object-cover ${mainImage === image ? 'border-blue-500' : 'border-transparent'}`}
                />
              ))}
            </div> */}
            </div>

            {/* Product Details Section */}
            <div className="md:col-span-2">
              <div className="pb-[20px] text-[14px] uppercase">
                <span className="font-semibold">{product.category}/ </span>
                <span className="text-[#AEAEB2]">{product.title}</span>
              </div>
              <div className="flex items-center justify-between text-[16px]">
                <h1 className="font-bold uppercase">{product.title}</h1>
                <p className="text-[14px] font-medium">${product.price}</p>
              </div>
              <div className="mt-[24px]">
                <div className="mb-[30px]">
                  <div className="mb-[16px] text-[11px] text-[#AEAEB2] uppercase">
                    Select color
                  </div>
                  <div className="flex gap-x-[8px]">
                    {color.map((color, index) => (
                      <div
                        style={{ backgroundColor: color }}
                        className="size-[44px] cursor-pointer"
                        key={index}
                      ></div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-[16px] text-[11px] text-[#AEAEB2] uppercase">
                    Select size
                  </div>
                  <div className="flex flex-wrap gap-[8px] uppercase">
                    {size.map((size, index) => (
                      <div
                        className="flex h-[40px] w-[54px] cursor-pointer items-center justify-center border-1 border-[#8E8E93] bg-[#F5F5F5] text-[11px]"
                        key={index}
                      >
                        {size}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button className="btn_black !mt-[36px] !mb-[56px]">
                Add to bag
              </button>
              <div>
                <div className="mb-[24px] text-[16px] font-bold uppercase">
                  Description
                </div>
                <div className="text-[13px] font-medium">
                  {product.description}
                </div>
              </div>
            </div>
          </div>
          <div></div>
        </div>
        <div>
          <div className="mt-[56px] mb-[24px] text-[16px] font-bold uppercase md:mt-[112px]">
            recommended products
          </div>
          <SwiperCarouselClient items={recommendedProducts} />
        </div>
      </div>

      <Footer />
    </>
  );
}
