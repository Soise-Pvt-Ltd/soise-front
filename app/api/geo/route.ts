export const runtime = 'edge';

/**
 * The visitor's country, from Vercel's edge geo header.
 *
 * Pages are statically generated (deliberately — see currency-context), so
 * they can't read request headers themselves. This tiny edge endpoint is the
 * one dynamic touchpoint: the currency layer calls it once, on a first visit
 * with no saved preference, to pick a sensible default currency.
 */
export async function GET(request: Request) {
  const country = request.headers.get('x-vercel-ip-country') ?? '';
  return Response.json(
    { country },
    { headers: { 'cache-control': 'private, no-store' } },
  );
}
