import NavClient, { type Collection } from './NavClient';

// Static Nav shell. Only fetches public collection data (cached), so the Nav —
// and every page that renders it — can be statically generated and served as a
// CDN hit. All session-specific data (cart, auth, identity, store credit) is
// fetched client-side after hydration via getNavSession() in NavClient, so no
// `cookies()` call here that would force dynamic rendering.
export default async function Nav() {
  let collections: Collection[] = [];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  try {
    if (baseUrl) {
      const collectionRes = await fetch(`${baseUrl}/products/collections`, {
        next: { revalidate: 60 },
      });
      if (collectionRes.ok) {
        const json = await collectionRes.json();
        collections = json?.data ?? [];
      }
    }
  } catch (error) {
    console.error('Nav collections fetch failed:', error);
  }

  return <NavClient collections={collections} />;
}
