export interface ProductVariant {
  id: string;
  price: number;
  color: string;
  size: string;
  product_name?: string;
  media: { url: string; alt_text: string }[];
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
