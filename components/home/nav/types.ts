export interface ProductVariant {
  id: string;
  price: number;
  color: string;
  size: string;
  product_name?: string;
  media: { url: string; alt_text: string }[];
  // Backend-resolved fallback: this variant's own media, or (if empty) a
  // sibling variant's media of the same product. Prefer this over `media`
  // when rendering, since `media` alone can be legitimately empty for a
  // given color/size while the product still has photos to show.
  display_media?: { url: string; alt_text: string }[];
  product_primary_image?: string | null;
  product: string;
  [key: string]: any;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  sample_variants: ProductVariant[];
  primary_image?: string | null;
}

export interface CartItem {
  id: string;
  quantity: number;
  variant: string;
  meta: any;
}

export interface EnrichedCartItem extends CartItem {
  variantDetails?: ProductVariant;
}
