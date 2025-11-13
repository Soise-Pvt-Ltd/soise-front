import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get("sessionId")?.value;

  const publicPaths = ["/", "/checkout", "/login"];
  const isPublicPath = publicPaths.includes(path);

  if (isPublicPath) {
    return NextResponse.next();
  }

  if (path.startsWith("/admin") && token !== "admin") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/checkout", "/login"],
};