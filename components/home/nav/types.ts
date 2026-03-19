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
  sample_variants: ProductVariant[];
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
