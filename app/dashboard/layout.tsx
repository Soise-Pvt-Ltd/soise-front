import { requireRole } from '@/lib/require-role';
import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';

// robots.txt stops crawling, not indexing: a URL discovered from any inbound
// link can still be indexed URL-only. An explicit noindex is the only thing
// that keeps authenticated areas out of search results entirely.
export const metadata: Metadata = NOINDEX;

export const dynamic = 'force-dynamic';

// Gate the entire Admin dashboard (/dashboard/*): admins only. This is the
// authoritative server-side check (the `isAdmin` cookie is only a UX hint;
// the backend role is the source of truth).
export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(['admin'], {
    deniedTo: '/',
    reason: 'admin-only',
    loginCallback: '/dashboard',
  });
  return <>{children}</>;
}
