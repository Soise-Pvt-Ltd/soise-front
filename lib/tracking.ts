import { cookies } from 'next/headers';

/**
 * Cookie header value to forward to the API (api.soise.ng) on server-side
 * requests that trigger TikTok CAPI events (AddToCart, InitiateCheckout,
 * Purchase).
 *
 * Those requests originate from Next server code, not the browser, so the
 * visitor's cookies are NOT automatically sent on to api.soise.ng. The
 * backend's request_context() attributes server-side conversions using
 * `_ttp` (the pixel browser id, set by the base pixel) and `ttclid` (the ad
 * click id, captured by components/tracking/TikTokClickId). Unless we copy
 * them across by hand, every ad-driven conversion reaches TikTok with no click
 * id and goes unattributed — which is exactly why the campaign reported 0
 * conversions while the store was taking organic orders.
 *
 * `access_token` is included so existing auth behaviour is unchanged.
 */
export async function apiForwardCookie(): Promise<string> {
  const store = await cookies();
  const parts: string[] = [];

  const accessToken = store.get('access_token')?.value;
  if (accessToken) parts.push(`access_token=${accessToken}`);

  const ttp = store.get('_ttp')?.value;
  if (ttp) parts.push(`_ttp=${ttp}`);

  const ttclid = store.get('ttclid')?.value;
  if (ttclid) parts.push(`ttclid=${ttclid}`);

  return parts.join('; ');
}
