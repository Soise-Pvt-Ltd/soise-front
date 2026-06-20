export const dynamic = 'force-dynamic';

import ProspectsClient from './prospectsClient';
import { fetchProspects, fetchProspectStats } from './actions';

export default async function ProspectsPage() {
  const [list, stats] = await Promise.all([
    fetchProspects('', 'all', 'all'),
    fetchProspectStats(),
  ]);
  return <ProspectsClient initial={list.data || []} stats={stats} />;
}
