'use client';

import { useState, useMemo } from 'react';
import axios from 'axios';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import { MinusIcon, PlusIcon, LikeIcon } from '@/components/icons';
import SwiperCarouselClient from '@/components/caurosel';
import { toast, Toaster } from 'sonner';

interface Media {
  url: string;
  alt_text: string;
  variants: {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
  };
}

interface SampleVariant {
  id: string;
  color: string;
  size: string;
  price: number;
  media: Media[] | null;
}

interface Collection {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  collection: Collection | null;
  description: string;
  base_price: number;
  sample_variants?: SampleVariant[];
}

export default function ProductPageClient({
  product,
  recommendedProducts,
}: {
  product: Product | null;
  recommendedProducts: Product[];
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const mainImage = useMemo(() => {
    if (selectedImage) return selectedImage;
    if (
      product?.sample_variants &&
      product.sample_variants[0]?.media &&
      product.sample_variants[0].media[0]
    ) {
      return product.sample_variants[0].media[0].variants.large;
    }
    return '/placeholder.png'; // Fallback image
  }, [selectedImage]);

  if (!product) {
    return <div>Product not found.</div>;
  }

  const availableColors = useMemo(
    () =>
      product.sample_variants
        ? [...new Set(product.sample_variants.map((v) => v.color))]
        : [],
    [product.sample_variants],
  );
  const availableSizes = useMemo(
    () =>
      product.sample_variants
        ? [...new Set(product.sample_variants.map((v) => v.size))]
        : [],
    [product.sample_variants],
  );

  const addToBag = async () => {
    if (!selectedColor || !selectedSize) {
      toast.error('Please select a color and size.');
      return;
    }

    const selectedVariant = product.sample_variants?.find(
      (variant) =>
        variant.color === selectedColor && variant.size === selectedSize,
    );

    if (!selectedVariant) {
      toast.error('This combination is not available.');
      return;
    }

    try {
      // Check for an existing session_id in sessionStorage
      const sessionId = sessionStorage.getItem('session_id');

      const payload = {
        variant_id: selectedVariant.id,
        quantity: quantity,
        ...(sessionId && { session_id: sessionId }), // Add session_id if it exists
      };

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/cart/items`,
        payload,
      );

      toast.success('Added to bag!');

      // If the response contains a session_id, store it
      if (response.data && response.data.session_id) {
        sessionStorage.setItem('session_id', response.data.session_id);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : 'Failed to add item to cart.',
      );
    }
  };

  return (
    <>
      <Toaster position="bottom-center" richColors />
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
                <div className="flex flex-grow items-center justify-center">
                  <img
                    src={mainImage}
                    alt={product.name}
                    className="h-96 w-auto object-contain"
                  />
                </div>
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
            <div className="px-[16px] md:col-span-2">
              <div className="pb-[20px] text-[14px] uppercase">
                <span className="font-semibold">
                  {product.collection?.name}/{' '}
                </span>
                <span className="text-[#AEAEB2]">{product.name}</span>
              </div>
              <div className="flex items-center justify-between text-[16px]">
                <h1 className="font-bold uppercase">{product.name}</h1>
                <p className="text-[14px] font-medium">${product.base_price}</p>
              </div>
              <div className="mt-[24px] space-y-[24px]">
                <div>
                  <div>
                    <div className="mb-[16px] text-[11px] text-[#AEAEB2] uppercase">
                      Select color
                    </div>
                    <div className="flex flex-wrap gap-[8px]">
                      {availableColors.map((color, index) => (
                        <div
                          onClick={() => setSelectedColor(color)}
                          style={{ backgroundColor: color }}
                          className={`size-[44px] cursor-pointer transition-all ${selectedColor === color ? 'ring-2 ring-black ring-offset-2' : ''}`}
                          key={index}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2">
                  <div>
                    <div className="mb-[16px] text-[11px] text-[#AEAEB2] uppercase">
                      Select size
                    </div>
                    <div className="flex flex-wrap gap-[8px] uppercase">
                      {availableSizes.map((size, index) => (
                        <button
                          onClick={() => setSelectedSize(size)}
                          key={index}
                          className={`flex h-[40px] w-[54px] items-center justify-center border-1 bg-[#F5F5F5] text-[11px] transition-colors ${selectedSize === size ? 'border-2' : 'border-[#8E8E93] bg-[#F5F5F5]'}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-[16px] text-[11px] text-[#AEAEB2] uppercase">
                    Select Qty
                  </div>

                  <div className="flex h-[36px] w-[96px] items-center justify-between rounded-[4px] border border-[#AEAEB2] p-[6px]">
                    <button
                      onClick={() =>
                        setQuantity((prev) => Math.max(1, prev - 1))
                      }
                      className="cursor-pointer p-1"
                    >
                      <MinusIcon />
                    </button>
                    <div className="text-center">{quantity}</div>
                    <button
                      onClick={() => setQuantity((prev) => prev + 1)}
                      className="cursor-pointer p-1"
                    >
                      <PlusIcon />
                    </button>
                  </div>
                </div>
              </div>
              <button
                className="btn_black !mt-[36px] !mb-[56px]"
                onClick={addToBag}
              >
                Add to bag
              </button>
            </div>
          </div>
          <div></div>
        </div>
        <div className="mt-[56px] px-[16px]">
          <div>
            <div className="mb-[24px] text-[16px] font-bold uppercase">
              Description
            </div>
            <div className="text-[13px] font-medium">{product.description}</div>
          </div>
          <div className="mt-[56px] mb-[24px] text-[16px] font-bold uppercase md:mt-[112px]">
            recommended products
          </div>
          {recommendedProducts.length > 0 ? (
            <SwiperCarouselClient items={recommendedProducts} />
          ) : (
            <p className="text-[#AEAEB2]">no recommended product</p>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
