import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function will run for any path that matches the `matcher` below.
export function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const sessionValue = req.cookies.get('sessionId')?.value;

  // Rule 1: Protect admin routes
  if (path.startsWith('/admin')) {
    // If the user is not an admin, redirect to login.
    if (sessionValue !== 'admin') {
      return NextResponse.redirect(new URL('/auth', req.url));
    }
    // If they are an admin, allow access.
    return NextResponse.next();
  }

  // Rule 2: Protect user-specific routes like checkout.
  // const userProtectedPaths = ["/checkout", "/wishlist", "/order-history"];
  const userProtectedPaths = [''];
  // For these routes, any session value is considered "logged in".
  // if (userProtectedPaths.some((p) => path.startsWith(p))) {
  //   // If there is no session, redirect to login.
  //   if (!sessionValue) {
  //     // You could optionally add a callbackUrl to redirect the user back after login
  //     // const loginUrl = new URL("/login", req.url);
  //     // loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
  //     // return NextResponse.redirect(loginUrl);
  //     return NextResponse.redirect(new URL('/auth', req.url));
  //   }
  // }

  // If none of the above rules caused a redirect, allow the request to proceed.
  return NextResponse.next();
}

export const config = {
  // The middleware will only run on these paths.
  // Public pages like '/' or '/products' will not be affected.
  matcher: [
    '/admin/:path*',
    '/checkout/:path*',
    '/wishlist/:path*',
    '/order-history/:path*',
  ],
};
