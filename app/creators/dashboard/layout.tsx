import { requireRole } from '@/lib/require-role';

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
