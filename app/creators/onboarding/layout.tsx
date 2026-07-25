import { requireRole } from '@/lib/require-role';
import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';

// robots.txt stops crawling, not indexing: a URL discovered from any inbound
// link can still be indexed URL-only. An explicit noindex is the only thing
// that keeps authenticated areas out of search results entirely.
export const metadata: Metadata = NOINDEX;

export const dynamic = 'force-dynamic';

// Onboarding (bank/payout setup + code) is only for approved creators (role
// already elevated to "creator" on approval) and admins. A non-creator who
// lands here is sent to the apply page with a reason rather than filling out a
// form the backend would reject.
export default async function CreatorOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole(['creator', 'admin'], {
    deniedTo: '/creators',
    reason: 'not-creator',
    loginCallback: '/creators/onboarding',
  });
  return <>{children}</>;
}
