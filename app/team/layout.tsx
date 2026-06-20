import { getCurrentRole } from '@/lib/require-role';
import TeamNav from './TeamNav';
import StatueWatermark from '@/components/brand/StatueWatermark';

export const dynamic = 'force-dynamic';

// Shared shell for /team. Auth is enforced PER PAGE: the Overview and Prospects
// pages gate to admin/outreach (they expose the prospect pipeline), while the
// Playbook is intentionally PUBLIC and shareable — so we must not block it here.
// We still read the role to tailor the chrome (internal nav for the outreach team, a clean
// public header for everyone else).
export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getCurrentRole();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#FAFBFC]">
      {/* Ambient Soise statue — quiet brand presence, never forefront. */}
      <StatueWatermark
        tone="dark"
        width={560}
        opacity={0.04}
        className="pointer-events-none fixed -right-24 bottom-[-40px] z-0 hidden lg:block"
      />
      <TeamNav role={role} />
      <main className="relative z-10 mx-auto max-w-[1180px] px-5 pb-24 pt-8 sm:px-8">
        {children}
      </main>
    </div>
  );
}
