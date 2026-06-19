export const runtime = 'nodejs';

import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Nav from '@/components/home/nav/Nav';
import ProfileClient, {
  type WardrobePiece,
  type ProfileUser,
} from './ProfileClient';

export const metadata: Metadata = {
  title: 'Your Wardrobe',
  description: 'Your private Soise wardrobe — every piece you have collected.',
  robots: { index: false, follow: false },
};

const BASE = process.env.NEXT_PUBLIC_BASE_URL;

// Record ids arrive as "products:xyz" in some payloads and bare "xyz" in
// others — normalise to the part after the colon so catalog joins line up.
const norm = (id?: string | null) => (id ? String(id).split(':').pop() ?? '' : '');

// Only paid/fulfilled orders represent owned pieces. Pending carts are not a
// wardrobe.
const OWNED_STATUSES = new Set(['paid', 'completed']);

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  // A wardrobe is inherently personal — gate on auth and bounce guests to login
  // with a return path so they land right back here.
  if (!accessToken) {
    redirect('/auth/login?next=/shop/profile');
  }

  let userRaw: any = null;
  let orders: any[] = [];
  let products: any[] = [];

  try {
    if (BASE) {
      const headers = {
        Cookie: `access_token=${accessToken}`,
        Accept: 'application/json',
      };
      const [profileRes, ordersRes, productsRes] = await Promise.all([
        fetch(`${BASE}/profiles`, { headers, cache: 'no-store' }),
        fetch(`${BASE}/orders`, { headers, cache: 'no-store' }),
        // Public catalog — used purely to resolve product names + slugs.
        fetch(`${BASE}/products`, { cache: 'no-store' }),
      ]);
      if (profileRes.ok) {
        const j = await profileRes.json();
        userRaw = j?.data ?? null;
      }
      if (ordersRes.ok) {
        const j = await ordersRes.json();
        orders = Array.isArray(j?.data) ? j.data : [];
      }
      if (productsRes.ok) {
        const j = await productsRes.json();
        products = Array.isArray(j?.data) ? j.data : [];
      }
    }
  } catch (error) {
    // Degrade gracefully to an empty wardrobe rather than crashing the page.
    console.error('Profile page fetch failed:', error);
  }

  // productId -> { name, slug } so each owned variant can name + link to its
  // catalog entry. Delisted products simply won't resolve (handled in the UI).
  const catalog = new Map<string, { name: string; slug?: string }>();
  for (const p of products) {
    if (p?.id) catalog.set(norm(p.id), { name: p.name, slug: p.slug });
  }

  // Flatten owned orders into pieces, deduped by variant. A piece bought twice
  // counts once but remembers how many times + the earliest acquisition date.
  const byVariant = new Map<string, WardrobePiece>();
  for (const order of orders) {
    if (!OWNED_STATUSES.has(order?.status)) continue;
    const acquiredAt: string | null = order?.created_at ?? null;
    for (const item of order?.items ?? []) {
      const v = item?.variant;
      if (!v?.id) continue;
      const media = Array.isArray(v.media) ? v.media[0] : null;
      const image =
        media?.variants?.large ||
        media?.variants?.medium ||
        media?.url ||
        null;
      const cat = catalog.get(norm(v.product));
      const qty = Number(item?.quantity) || 1;

      const existing = byVariant.get(v.id);
      if (existing) {
        existing.timesPurchased += qty;
        if (
          acquiredAt &&
          (!existing.acquiredAt || acquiredAt < existing.acquiredAt)
        ) {
          existing.acquiredAt = acquiredAt;
        }
        continue;
      }
      byVariant.set(v.id, {
        variantId: v.id,
        productId: norm(v.product),
        name: cat?.name ?? null,
        slug: cat?.slug ?? null,
        image,
        color: v.color ?? null,
        size: v.size ?? null,
        acquiredAt,
        timesPurchased: qty,
      });
    }
  }

  // Newest acquisitions lead the rail.
  const pieces = Array.from(byVariant.values()).sort((a, b) =>
    (b.acquiredAt ?? '').localeCompare(a.acquiredAt ?? ''),
  );

  const user: ProfileUser = {
    firstName: userRaw?.first_name ?? null,
    lastName: userRaw?.last_name ?? null,
    email: userRaw?.email ?? null,
    avatar: userRaw?.avatar ?? null,
    memberSince: userRaw?.created_at ?? null,
  };

  return (
    <>
      <Nav />
      <ProfileClient user={user} pieces={pieces} />
    </>
  );
}
