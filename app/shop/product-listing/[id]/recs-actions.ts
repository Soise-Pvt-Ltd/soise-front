'use server';

// Product-recommendation fetchers. These hit live, public, no-auth endpoints
// and must NEVER throw — they always resolve to an array so callers can render
// (or hide) a section without try/catch noise at the call site.

export interface RecProduct {
  id: string;
  name: string;
  slug: string;
  base_price?: number | null;
  sample_variants?: Array<{
    price?: number | null;
    media?: Array<{ url: string }> | null;
  }> | null;
  [key: string]: any;
}

async function fetchProductList(path: string): Promise<RecProduct[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) return [];
  try {
    const res = await fetch(`${baseUrl}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const data = await res.json().catch(() => null);
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

// "Frequently bought together" — co-purchase signal with backend fallback to
// same-collection / recent products. Can legitimately be empty for tiny catalogs.
export async function getRecommendations(
  productId: string,
  limit = 8,
): Promise<RecProduct[]> {
  if (!productId) return [];
  return fetchProductList(
    `/products/${encodeURIComponent(productId)}/recommendations?limit=${limit}`,
  );
}

// "Products like this" — deterministic feature similarity.
export async function getSimilarProducts(
  productId: string,
  limit = 8,
): Promise<RecProduct[]> {
  if (!productId) return [];
  return fetchProductList(
    `/products/${encodeURIComponent(productId)}/similar?limit=${limit}`,
  );
}

// Generic fallback row (thank-you page when no purchased product id is known).
export async function getFeaturedProducts(limit = 8): Promise<RecProduct[]> {
  const featured = await fetchProductList(`/products/featured?limit=${limit}`);
  if (featured.length > 0) return featured.slice(0, limit);
  // Fall back to the general products list if there's no featured endpoint/data.
  const all = await fetchProductList(`/products`);
  return all.slice(0, limit);
}
