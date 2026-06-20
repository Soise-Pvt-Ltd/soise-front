export const dynamic = 'force-dynamic';

import ProspectsClient from './prospectsClient';
import { fetchProspects, fetchProspectStats } from './actions';
import { requireRole } from '@/lib/require-role';

export default async function ProspectsPage() {
  await requireRole(['admin', 'staff'], {
    deniedTo: '/',
    reason: 'team-only',
    loginCallback: '/team',
  });
  const [list, stats] = await Promise.all([
    fetchProspects('', 'all', 'all'),
    fetchProspectStats(),
  ]);
  return <ProspectsClient initial={list.data || []} stats={stats} />;
}
