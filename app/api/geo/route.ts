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
  // soise.ng is proxied through Cloudflare, so the IP Vercel geolocates is
  // the Cloudflare edge node's, not the shopper's. Nigerian ISPs route to
  // Amsterdam and London, so x-vercel-ip-country said NL and a Lagos visitor
  // was priced in euros. Cloudflare stamps the real client's country in
  // cf-ipcountry before forwarding; read that first. 'XX' / 'T1' are
  // Cloudflare's "unknown" / Tor markers, treated as unreadable.
  const cf = request.headers.get('cf-ipcountry') ?? '';
  const country =
    cf && cf !== 'XX' && cf !== 'T1'
      ? cf
      : request.headers.get('x-vercel-ip-country') ?? '';
  // One line into the function logs so "are internationals arriving?" is
  // answerable from `vercel logs` without touching any dashboard. The geo
  // endpoint only fires for first-visit browsers, so each line is a NEW
  // visitor's country — a live diaspora-demand signal.
  console.log(`geo: ${country || 'unknown'}`);
  return Response.json(
    { country },
    { headers: { 'cache-control': 'private, no-store' } },
  );
}
