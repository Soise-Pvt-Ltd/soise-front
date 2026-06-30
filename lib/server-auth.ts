import { cookies } from 'next/headers';

/**
 * The backend session token for the current request.
 *
 * Email/password login sets the `access_token` cookie; Google login sets
 * `token`. Both hold a valid backend JWT, so server actions / route handlers
 * forward whichever exists to the API as `Cookie: access_token=<token>`.
 * Returning `token` here is what lets Google-authenticated users save.
 */
export async function getBackendToken(): Promise<string | null> {
  const c = await cookies();
  return c.get('access_token')?.value ?? c.get('token')?.value ?? null;
}
