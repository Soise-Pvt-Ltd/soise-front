import { requireRole } from '@/lib/require-role';
import TeamNav from './TeamNav';

export const dynamic = 'force-dynamic';

// Gate the entire /team workspace to admin + staff. This is the authoritative
// server-side check (the `getCurrentRole` helper reads the role from the backend
// profile, not a client cookie). Staff is the outreach role: this tooling holds
// no financial data, so they can use it without access to the money dashboard.
export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await requireRole(['admin', 'staff'], {
    deniedTo: '/',
    reason: 'team-only',
    loginCallback: '/team',
  });

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <TeamNav role={role} />
      <main className="mx-auto max-w-[1180px] px-5 pb-24 pt-8 sm:px-8">
        {children}
      </main>
    </div>
  );
}
