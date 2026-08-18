'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Footer from '@/components/footer';
import { MinusIcon, PlusIcon, LikeIcon, LikeIconSolid } from '@/components/icons';
import SwiperCarouselClient from '@/components/caurosel';
import { Toaster } from 'sonner';
import { showToast } from '@/lib/toast-utils';
import { withImageTransform, isTransformable } from '@/lib/images';

/**
 * Widths offered for the main product image. Every entry is one more unique
 * image+options pair against the 5,000/month free transformation quota, so this
 * ladder is deliberately short: four rungs across the ~440px (1x) to ~1300px
 * (3x) range the frame can actually paint.
 */
const MAIN_IMAGE_WIDTHS = [400, 640, 828, 1200] as const;
import { addToBag as addToBagAction } from './actions';
import { addToWishlist as addToWishlistAction } from '@/app/shop/wishlist/actions';
import { notifyCartChanged } from '@/lib/cart-events';
import { trackViewContent } from '@/lib/tracking-client';
import { motion, AnimatePresence } from 'framer-motion';
import { FadeIn } from '@/components/motion';
import { useCurrency } from '@/lib/currency-context';
import {
  type ColorFinish,
  finishSwatchStyle,
  isValidHex,
  guessHexFromName,
} from '@/lib/color-palette';

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
  color_hex?: string | null;
  finish?: ColorFinish | null;
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
  // Seeded from variants[0] on the FIRST render, not in an effect.
  //
  // These used to start null and get filled by the "Initialize selection"
  // effect, which then triggered the "Sync variant" effect. Both run only after
  // hydration, so the server-rendered HTML had no variant, `currentImages` was
  // empty, and `mainImage` fell through to /placeholder.png. The real product
  // photo was not merely late — it was not in the markup at all, so the preload
  // scanner could not see it and the browser only began fetching it after
  // HTML -> JS download -> parse -> hydrate -> two effect passes -> re-render.
  // On a Nigerian mobile connection that chain is seconds before the main image
  // is even requested.
  //
  // variants[0] is exactly what the init effect chose, so the selection is
  // unchanged — only its timing. The effects below still handle every later
  // change, and both no-op on mount now (the init effect is guarded on
  // !selectedColor, and the sync effect resolves to this same object reference,
  // so React bails out without a re-render).
  //
  // Reads `product?.sample_variants` rather than the `variants` memo on purpose:
  // that memo is declared further down the component, so referencing it here
  // would be a temporal-dead-zone ReferenceError at runtime. This is the same
  // array the memo wraps.
  const firstVariant = product?.sample_variants?.[0] ?? null;
  const [selectedVariant, setSelectedVariant] = useState<SampleVariant | null>(
    () => firstVariant,
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(
    () => firstVariant?.color ?? null,
  );
  const [selectedSize, setSelectedSize] = useState<string | null>(
    () => firstVariant?.size ?? null,
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [wishlistPending, setWishlistPending] = useState(false);
  const [saved, setSaved] = useState(false);

  // Report ViewContent from the browser. This page is statically prerendered
  // with ISR, so the backend's server-side ViewContent (GET /products/:id) is
  // never reached by a real visitor — see lib/tracking-client.ts. Keyed on the
  // product id so client-side navigation between products reports each one, and
  // a re-render of the same product does not double-count.
  const productId = product?.id;
  const productName = product?.name;
  const productPrice = product?.base_price;
  useEffect(() => {
    if (!productId) return;
    trackViewContent({
      id: productId,
      name: productName ?? '',
      base_price: productPrice ?? 0,
    });
  }, [productId, productName, productPrice]);

  // Mobile sticky buy bar: shown whenever the primary Add-to-bag button is
  // off-screen, so the purchase affordance never disappears while browsing
  // the description or recommendation rows.
  const buyButtonRef = useRef<HTMLButtonElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  useEffect(() => {
    const el = buyButtonRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

  // Responsive ladder for the main product image, which was pinned to the
  // stored `variants.large` (width=1200) for every device.
  //
  // Sizing here is HEIGHT-bound, not viewport-bound: the frame is h-[500px] with
  // object-contain, and the catalogue is portrait (ratios ~0.62-0.88), so the
  // image paints roughly 310-440 CSS px wide no matter how wide the screen is.
  // A 3x phone therefore genuinely needs ~1300px and keeps getting 1200 — mobile
  // was never the waste. A 1x desktop needs ~440px and was also getting 1200,
  // which is 65KB where 25KB would do.
  //
  // sizes="500px" is the worst case that frame can paint (a square image filling
  // the 500px height). Slightly overstating for portrait art is the safe
  // direction: the browser rounds up to the next rung rather than under-serving.
  //
  // quality stays 85 unlike the hero's 70 — this is the garment itself, the one
  // image a customer studies before spending money.
  const mainImageSrcSet = useMemo(() => {
    if (!isTransformable(mainImage)) return undefined;
    return MAIN_IMAGE_WIDTHS.map(
      (w) =>
        `${withImageTransform(
          mainImage,
          `width=${w},fit=scale-down,format=auto,quality=85`,
        )} ${w}w`,
    ).join(', ');
  }, [mainImage]);

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

  /**
   * Add the selected variant to the bag.
   *
   * `then` decides where the shopper lands:
   *   'bag'      — open the bag panel, so Tap To Checkout is one tap away
   *   'checkout' — skip the bag entirely and go straight to the order summary
   *
   * Adding used to do neither: it fired a toast and left the shopper on the
   * product page, so reaching checkout meant noticing the badge, finding the
   * bag icon, opening it, and only then tapping through.
   */
  const addToBag = async (then: 'bag' | 'checkout' = 'bag') => {
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
      if (then === 'checkout') {
        // Nav still needs to know, even though we're navigating away.
        notifyCartChanged();
        // Hard navigation, deliberately — NOT router.push.
        //
        // addToBagAction writes the `soise_guestId` cookie on every call, and a
        // cookie written inside a server action makes Next refresh the current
        // route. That refresh raced the client-side push and won: the item
        // landed in the bag, the URL never changed, and "Buy it now" looked
        // like a dead button on the product page. (Verified in a real browser:
        // bag went to 1 item, URL unchanged, no console error — twice, so it
        // is not just the first-visit cookie write.)
        //
        // A full navigation cannot be cancelled by that refresh, and it also
        // guarantees the freshly-set cookie rides along on the request for the
        // order summary — which is the page that needs it most.
        window.location.assign('/shop/order-summary');
        return;
      }
      // Tell the Nav (client-side, static shell) to refresh AND open the bag.
      // No success toast: the bag sliding open is the confirmation, and a
      // toast on top of it is just noise covering the button.
      notifyCartChanged({ openBag: true });
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
      <div className="page-shell">
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
                    <div className="flex flex-1 items-center justify-center overflow-hidden">
                      <AnimatePresence mode="wait">
                        <motion.img
                          key={mainImage}
                          src={mainImage}
                          srcSet={mainImageSrcSet}
                          sizes={mainImageSrcSet ? '500px' : undefined}
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
              className="px-[16px] md:col-span-2 md:sticky md:top-24 md:self-start"
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <h1 className="font-display text-[28px] leading-[1.1] text-[#121212] uppercase md:text-[32px]">
                  {product.name}
                </h1>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentPrice}
                    className="font-display mt-2 text-[22px] text-[#121212]"
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
                        const hex = isValidHex(v.color_hex)
                          ? v.color_hex
                          : guessHexFromName(v.color);
                        const isLight =
                          hex.toLowerCase() === '#ffffff' ||
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
                            style={finishSwatchStyle(hex, v.finish)}
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
                      aria-label="Decrease quantity"
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
                      aria-label="Increase quantity"
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

                {/* Quiet scarcity — only when it's genuinely true. */}
                {typeof selectedVariant?.stock === 'number' &&
                  selectedVariant.stock > 0 &&
                  selectedVariant.stock <= 5 && (
                    <p className="text-[11px] font-bold tracking-[0.15em] text-[#B3101C] uppercase">
                      Only {selectedVariant.stock} left
                    </p>
                  )}
              </motion.div>

              <motion.button
                ref={buyButtonRef}
                className="btn_black !mt-[36px] disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => addToBag('bag')}
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

              {/* Straight to the order summary for someone who has already
                  decided. Skips the bag entirely: two taps become one. */}
              <motion.button
                className="btn_outline disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => addToBag('checkout')}
                disabled={isAdding || !selectedVariant || isOutOfStock}
                whileHover={isOutOfStock ? {} : { scale: 1.02 }}
                whileTap={isOutOfStock ? {} : { scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                Buy it now
              </motion.button>

              {/* Checkout confidence — factual, quiet, right where doubt lives.
                  Leads with FREE delivery because that's the promise every live
                  ad makes: a shopper weighing ₦90-150k is silently adding an
                  imagined delivery fee on this exact screen, and "ships across
                  Nigeria" never told them the answer is zero. */}
              <p className="mt-3 mb-[32px] text-center text-[11px] tracking-[0.12em] text-[#8E8E93] uppercase">
                Free delivery, worldwide&ensp;·&ensp;7-day
                exchange&ensp;·&ensp;Secure checkout
              </p>

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
              <div className="font-display mb-[24px] text-[24px] text-[#121212]">Description</div>
              <div className="max-w-[65ch] whitespace-pre-wrap text-[13px] leading-[1.9] text-[#3A3A3C]">{product.description}</div>
            </div>
          </FadeIn>
          {/* Frequently bought together — co-purchase recommendations. Hidden
              entirely when empty so we never render a thin/empty row. */}
          {frequentlyBoughtTogether.length > 0 && (
            <section aria-labelledby="freq-bought-heading">
              <FadeIn direction="up" delay={0.2}>
                <h2
                  id="freq-bought-heading"
                  className="font-display mt-[56px] mb-[24px] text-[24px] text-[#121212] md:mt-[112px]"
                >
                  Frequently bought together
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
                  className="font-display mt-[56px] mb-[24px] text-[24px] text-[#121212] md:mt-[112px]"
                >
                  Products like this
                </h2>
              </FadeIn>
              <SwiperCarouselClient items={similarProducts} />
            </section>
          )}
        </div>
      </div>

      {/* Mobile sticky buy bar — the purchase affordance follows the reader.
          Its button is BUY NOW, not add-to-bag: ad traffic is ~all mobile, a
          scrolling shopper is exactly who this bar exists for, and the one-tap
          path to the order summary otherwise disappears the moment the main
          buttons scroll off-screen — leaving only the multi-tap bag-panel
          route. Anyone who wants the bag instead can scroll back up; the item
          is in their bag either way. */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-[#E5E5E5] bg-white/95 px-[16px] pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] tracking-[0.08em] text-[#121212] uppercase">
                  {product.name}
                </p>
                <p className="font-display text-[15px] text-[#121212]">
                  {formatPrice(currentPrice)}
                  <span className="font-sans ml-2 text-[10px] tracking-[0.08em] text-[#B3101C] uppercase">
                    Free delivery
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => addToBag('checkout')}
                disabled={isAdding || !selectedVariant || isOutOfStock}
                className="h-[46px] shrink-0 cursor-pointer rounded-[10px] bg-[#121212] px-6 text-[12px] font-bold text-white uppercase transition-all duration-300 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isOutOfStock ? 'Sold out' : isAdding ? 'One sec…' : 'Buy now'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}
