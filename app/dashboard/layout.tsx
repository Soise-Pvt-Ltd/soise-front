import { requireRole } from '@/lib/require-role';

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
