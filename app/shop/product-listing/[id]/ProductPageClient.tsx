'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Footer from '@/components/footer';
import { MinusIcon, PlusIcon, LikeIcon, LikeIconSolid } from '@/components/icons';
import SwiperCarouselClient from '@/components/caurosel';
import { Toaster } from 'sonner';
import { showToast } from '@/lib/toast-utils';
import { addToBag as addToBagAction } from './actions';
import { addToWishlist as addToWishlistAction } from '@/app/shop/wishlist/actions';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn } from '@/components/motion';
import { useCurrency } from '@/lib/currency-context';

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
  stock?: number;
  media: Media[] | null;
  display_media?: Media[];
  has_own_media?: boolean;
}

// A variant is sold out only when the backend reports a numeric stock of 0
// or less. Missing/undefined stock is treated as available to avoid hiding
// buyable items if the field is ever absent.
const isVariantSoldOut = (v?: SampleVariant | null) =>
  !!v && typeof v.stock === 'number' && v.stock <= 0;

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
  frequentlyBoughtTogether = [],
  similarProducts = [],
}: {
  product: Product | null;
  frequentlyBoughtTogether?: Product[];
  similarProducts?: Product[];
}) {
  const { formatPrice } = useCurrency();
  const router = useRouter();
  const pathname = usePathname();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<SampleVariant | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [wishlistPending, setWishlistPending] = useState(false);
  const [saved, setSaved] = useState(false);

  const variants = useMemo(() => product?.sample_variants || [], [product?.sample_variants]);

  // Unique colors in order of first appearance
  const uniqueColors = useMemo(() => {
    const seen = new Set<string>();
    return variants.filter((v) => {
      if (seen.has(v.color)) return false;
      seen.add(v.color);
      return true;
    });
  }, [variants]);

  // Sizes available for selected color
  const availableSizes = useMemo(() => {
    const source = selectedColor
      ? variants.filter((v) => v.color === selectedColor)
      : variants;
    const seen = new Set<string>();
    return source.filter((v) => {
      if (seen.has(v.size)) return false;
      seen.add(v.size);
      return true;
    });
  }, [selectedColor, variants]);

  // Sync variant when color or size changes
  useEffect(() => {
    if (!selectedColor || !selectedSize) return;
    const match = variants.find((v) => v.color === selectedColor && v.size === selectedSize) || null;
    setSelectedVariant(match);
    setSelectedImageIndex(0);
  }, [selectedColor, selectedSize, variants]);

  // Initialize selection
  useEffect(() => {
    if (variants.length > 0 && !selectedColor) {
      setSelectedColor(variants[0].color);
      setSelectedSize(variants[0].size);
    }
  }, [variants, selectedColor]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    // Auto-select first available size for this color
    const firstSize = variants.find((v) => v.color === color)?.size ?? null;
    setSelectedSize(firstSize);
  };

  // Images for the currently selected variant. The backend already resolves
  // display_media with sibling-variant fallback (so an unphotographed color
  // still shows something), but we fall back client-side too in case a
  // cached/older payload doesn't have display_media yet.
  const currentImages = useMemo(() => {
    if (!selectedVariant) return [];
    if (selectedVariant.display_media?.length) return selectedVariant.display_media;
    if (selectedVariant.media?.length) return selectedVariant.media;
    const sameColor = variants.find(
      (v) => v.color === selectedVariant.color && v.media?.length,
    );
    if (sameColor) return sameColor.media as Media[];
    const anyWithMedia = variants.find((v) => v.media?.length);
    return anyWithMedia?.media ?? [];
  }, [selectedVariant, variants]);

  const mainImage = useMemo(() => {
    if (currentImages.length > 0) {
      return (currentImages[selectedImageIndex] ?? currentImages[0]).variants.large;
    }
    return '/placeholder.png';
  }, [currentImages, selectedImageIndex]);

  const currentPrice = useMemo(() => {
    if (selectedVariant && selectedVariant.price > 0) return selectedVariant.price;
    return product?.base_price ?? 0;
  }, [selectedVariant, product?.base_price]);

  const isOutOfStock = isVariantSoldOut(selectedVariant);

  // Upper bound for the quantity stepper: the selected variant's stock when the
  // backend reports a positive number, otherwise an unknown fallback so users
  // can't increment without limit and overshoot available inventory.
  const maxQty =
    typeof selectedVariant?.stock === 'number' && selectedVariant.stock > 0
      ? selectedVariant.stock
      : undefined;

  const handleAddToWishlist = async () => {
    if (!product?.id || wishlistPending || saved) return;
    setWishlistPending(true);
    const result = await addToWishlistAction(product.id);
    setWishlistPending(false);
    if (result.success) {
      setSaved(true);
      showToast.success('Saved to your wishlist.');
    } else if (result.unauthenticated) {
      showToast.error('Please sign in to save items.');
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(pathname));
    } else {
      showToast.error(result.message || 'Could not save to wishlist.');
    }
  };

  const addToBag = async () => {
    if (!selectedVariant) {
      showToast.error('Please select a variant before adding to bag.');
      return;
    }
    if (isOutOfStock) {
      showToast.error('This item is sold out.');
      return;
    }
    setIsAdding(true);
    const toastId = showToast.loading(`Adding ${quantity} item${quantity > 1 ? 's' : ''} to bag...`);
    const result = await addToBagAction(selectedVariant.id, quantity);
    showToast.dismiss(toastId);
    if (result.success) {
      showToast.success(`Added ${quantity} item${quantity > 1 ? 's' : ''} to bag!`);
    } else {
      showToast.error(result.message || 'Failed to add item to bag. Please try again.');
    }
    setIsAdding(false);
  };

  if (!product) {
    return <div>Product not found.</div>;
  }

  return (
    <>
      <Toaster position="bottom-center" richColors />
      <div className="mx-auto md:max-w-7xl">
        <div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
            {/* Image Gallery Section */}
            <motion.div
              className="md:col-span-3"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex flex-col gap-4 md:flex-row">
                {/* Main Image */}
                <div className="order-1 flex-1 md:order-2">
                  <div className="flex h-[500px] w-full flex-col">
                    <div className="flex flex-1 items-center justify-center">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={mainImage}
                          src={mainImage}
                          alt={product.name}
                          className="max-h-full max-w-full object-contain"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 1.02 }}
                          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                          whileHover={{ scale: 1.08 }}
                        />
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Thumbnail strip — browses images of the selected variant */}
                {currentImages.length > 1 && (
                  <div className="order-2 flex space-x-2 overflow-x-auto px-[16px] pb-2 md:order-1 md:max-h-[500px] md:w-24 md:flex-col md:space-y-2 md:space-x-0 md:overflow-y-auto md:px-0 md:pb-0">
                    {currentImages.map((img, i) => {
                      const isSelected = selectedImageIndex === i;
                      return (
                        <motion.button
                          key={i}
                          type="button"
                          aria-label={`Select image ${i + 1}`}
                          onClick={() => setSelectedImageIndex(i)}
                          className={`relative h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-md border-2 transition-colors duration-300 ${
                            isSelected ? 'border-black' : 'border-gray-200 hover:border-gray-400'
                          }`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08, duration: 0.4 }}
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <img
                            src={img.variants.thumbnail}
                            alt={`${product.name} view ${i + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Product Details Section */}
            <motion.div
              className="px-[16px] md:col-span-2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="pb-[20px] text-[14px] uppercase"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
              >
                <span className="font-semibold">{product.collection?.name}/ </span>
                <span className="text-[#AEAEB2]">{product.name}</span>
              </motion.div>

              <motion.div
                className="flex items-center justify-between text-[16px]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <h1 className="font-bold uppercase">{product.name}</h1>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentPrice}
                    className="text-[14px] font-medium"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25 }}
                  >
                    {formatPrice(currentPrice)}
                  </motion.p>
                </AnimatePresence>
              </motion.div>

              <motion.div
                className="mt-4 space-y-5"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Color Selector */}
                {uniqueColors.length > 0 && (
                  <div>
                    <div className="mb-2 text-[11px] text-[#AEAEB2] uppercase">
                      Color
                      {selectedColor && (
                        <span className="ml-2 text-[#121212] capitalize">{selectedColor}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {uniqueColors.map((v) => {
                        const isSelected = selectedColor === v.color;
                        const isLight =
                          v.color.toLowerCase() === '#ffffff' ||
                          v.color.toLowerCase() === 'white';
                        return (
                          <motion.button
                            key={v.color}
                            type="button"
                            aria-label={`Select color ${v.color}`}
                            onClick={() => handleColorSelect(v.color)}
                            className={`h-8 w-8 rounded-full transition-all duration-200 ${
                              isLight ? 'border border-gray-400' : ''
                            } ${
                              isSelected
                                ? 'ring-2 ring-black ring-offset-2'
                                : 'ring-1 ring-transparent hover:ring-gray-400 hover:ring-offset-1'
                            }`}
                            style={{ backgroundColor: v.color }}
                            title={v.color}
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Size Selector */}
                {availableSizes.length > 0 && (
                  <div>
                    <div className="mb-2 text-[11px] text-[#AEAEB2] uppercase">Size</div>
                    <div className="flex flex-wrap gap-2">
                      {availableSizes.map((v) => {
                        const isSelected = selectedSize === v.size;
                        const soldOut = isVariantSoldOut(v);
                        return (
                          <motion.button
                            key={v.size}
                            onClick={() => !soldOut && setSelectedSize(v.size)}
                            disabled={soldOut}
                            title={soldOut ? 'Sold out' : undefined}
                            className={`flex h-9 min-w-[40px] items-center justify-center rounded-[2px] border px-2 text-[11px] uppercase transition-colors duration-200 ${
                              soldOut
                                ? 'cursor-not-allowed border-[#E5E5E5] bg-[#FAFAFA] text-[#C7C7CC] line-through'
                                : isSelected
                                  ? 'border-black bg-black text-white'
                                  : 'border-[#8E8E93] bg-[#F5F5F5] hover:border-black'
                            }`}
                            whileHover={soldOut ? {} : { scale: 1.05 }}
                            whileTap={soldOut ? {} : { scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                          >
                            {v.size}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <div className="mb-2 text-[11px] text-[#AEAEB2] uppercase">Quantity</div>
                  <div className="flex h-[36px] w-[96px] items-center justify-between rounded-[4px] border border-[#AEAEB2] px-2">
                    <motion.button
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      className="p-1"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.85 }}
                    >
                      <MinusIcon />
                    </motion.button>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={quantity}
                        className="text-sm"
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                      >
                        {quantity}
                      </motion.span>
                    </AnimatePresence>
                    <motion.button
                      onClick={() =>
                        setQuantity((q) => Math.min(q + 1, maxQty ?? 999))
                      }
                      className="p-1"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.85 }}
                    >
                      <PlusIcon />
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              <motion.button
                className="btn_black !mt-[36px] !mb-[56px] disabled:cursor-not-allowed disabled:opacity-40"
                onClick={addToBag}
                disabled={isAdding || !selectedVariant || isOutOfStock}
                whileHover={
                  isOutOfStock
                    ? {}
                    : { scale: 1.02, boxShadow: '0 8px 30px rgba(0,0,0,0.2)' }
                }
                whileTap={isOutOfStock ? {} : { scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                {isOutOfStock
                  ? 'Sold out'
                  : isAdding
                    ? 'Adding...'
                    : 'Add to bag'}
              </motion.button>

              <motion.button
                type="button"
                onClick={handleAddToWishlist}
                disabled={wishlistPending || saved}
                className="mb-[56px] flex w-full items-center justify-center gap-x-2 text-[13px] font-medium uppercase text-[#121212] disabled:opacity-60"
                whileHover={saved ? {} : { scale: 1.02 }}
                whileTap={saved ? {} : { scale: 0.97 }}
              >
                {saved ? <LikeIconSolid /> : <LikeIcon />}
                {saved
                  ? 'Saved to wishlist'
                  : wishlistPending
                    ? 'Saving...'
                    : 'Save to wishlist'}
              </motion.button>
            </motion.div>
          </div>
        </div>

        <div className="mt-[56px] px-[16px]">
          <FadeIn direction="up" delay={0.1}>
            <div>
              <div className="mb-[24px] text-[16px] font-bold uppercase">Description</div>
              <div className="text-[13px] font-medium">{product.description}</div>
            </div>
          </FadeIn>
          {/* Frequently bought together — co-purchase recommendations. Hidden
              entirely when empty so we never render a thin/empty row. */}
          {frequentlyBoughtTogether.length > 0 && (
            <section aria-labelledby="freq-bought-heading">
              <FadeIn direction="up" delay={0.2}>
                <h2
                  id="freq-bought-heading"
                  className="mt-[56px] mb-[24px] text-[16px] font-bold uppercase md:mt-[112px]"
                >
                  frequently bought together
                </h2>
              </FadeIn>
              <SwiperCarouselClient items={frequentlyBoughtTogether} />
            </section>
          )}

          {/* Products like this — deterministic feature similarity. */}
          {similarProducts.length > 0 && (
            <section aria-labelledby="similar-heading">
              <FadeIn direction="up" delay={0.2}>
                <h2
                  id="similar-heading"
                  className="mt-[56px] mb-[24px] text-[16px] font-bold uppercase md:mt-[112px]"
                >
                  products like this
                </h2>
              </FadeIn>
              <SwiperCarouselClient items={similarProducts} />
            </section>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
