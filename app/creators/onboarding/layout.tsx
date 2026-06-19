import { requireRole } from '@/lib/require-role';

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
