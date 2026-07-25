import { requireRole } from '@/lib/require-role';
import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';

// robots.txt stops crawling, not indexing: a URL discovered from any inbound
// link can still be indexed URL-only. An explicit noindex is the only thing
// that keeps authenticated areas out of search results entirely.
export const metadata: Metadata = NOINDEX;

export const dynamic = 'force-dynamic';

// Gate the entire Creator Portal (/creators/dashboard/*): only creators (and
// admins) may enter. Non-creators are sent to the Creator Experience apply
// page with a reason, instead of seeing an empty/broken creator dashboard.
export default async function CreatorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(['creator', 'admin'], {
    deniedTo: '/creators',
    reason: 'not-creator',
    loginCallback: '/creators/dashboard',
  });
  return <>{children}</>;
}
