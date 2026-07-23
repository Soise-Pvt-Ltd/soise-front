import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Lightweight search proxy for the nav search panel.
// The client fetches a relative URL (`/api/products?q=...`) so the backend
// origin never needs to be exposed to the browser. We fetch the catalogue
// from the backend and filter server-side by name/description.
export async function GET(request: NextRequest) {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();

  if (!BASE_URL) {
    return NextResponse.json(
      { success: false, error: 'Search is unavailable', data: [] },
      { status: 503 },
    );
  }

  if (!q) {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    const res = await fetch(`${BASE_URL}/products`, { next: { revalidate: 60 } });
    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: 'Search failed', data: [] },
        { status: 502 },
      );
    }

    const payload = await res.json();
    const all = Array.isArray(payload?.data) ? payload.data : [];

    const results = all
      .filter((p: any) => p?.status === 'active')
      .filter((p: any) => {
        const name = String(p?.name ?? '').toLowerCase();
        const description = String(p?.description ?? '').toLowerCase();
        const collection = String(p?.collection?.name ?? '').toLowerCase();
        return (
          name.includes(q) ||
          description.includes(q) ||
          collection.includes(q)
        );
      })
      .slice(0, 20);

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Product search error:', error);
    return NextResponse.json(
      { success: false, error: 'Search error', data: [] },
      { status: 500 },
    );
  }
}
