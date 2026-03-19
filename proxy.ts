import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected paths outside the function to avoid recreating the array on every request
const USER_PROTECTED_PATHS = [
  '/shop/checkout',
  '/shop/wishlist',
  '/creators',
  '/shop/order-history',
  '/shop/user',
];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const accessToken = req.cookies.get('access_token')?.value;
  const isAdmin = req.cookies.get('isAdmin')?.value === 'true';

  // Rule 1: Protect admin routes
  if (path.startsWith('/dashboard')) {
    if (!accessToken) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Check admin status from cookie
    if (isAdmin) {
      return NextResponse.next();
    } else {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Rule 2: Protect user-specific routes like checkout.
  // For these routes, any session value is considered "logged in".
  if (USER_PROTECTED_PATHS.some((p) => path.startsWith(p))) {
    // If there is no session, redirect to login.
    if (!accessToken) {
      // Optional: add a callbackUrl to redirect the user back after login
      const loginUrl = new URL('/auth/login', req.url);
      loginUrl.searchParams.set(
        'callbackUrl',
        req.nextUrl.pathname + req.nextUrl.search,
      );
      return NextResponse.redirect(loginUrl);
    }
  }

  // If none of the above rules caused a redirect, allow the request to proceed.
  return NextResponse.next();
}

export const config = {
  // The middleware will only run on these paths.
  // Public pages like '/' or '/products' will not be affected.
  matcher: [
    '/dashboard/:path*',
    '/creators/:path*',
    '/shop/checkout/:path*',
    '/shop/wishlist/:path*',
    '/shop/order-history/:path*',
    '/shop/user/:path*',
  ],
};
