export const dynamic = 'force-dynamic';

import TierRequestsClient from './tierRequestsClient';
import { fetchTierRequests, fetchTiers } from './actions';

export default async function TierRequestsDashboardPage() {
  const [reqs, tiers] = await Promise.all([fetchTierRequests('pending'), fetchTiers()]);
  return <TierRequestsClient initialData={reqs.data || []} tiers={tiers.data || []} />;
}
