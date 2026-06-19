export const dynamic = 'force-dynamic';

import TierUpgradeClient from './tierUpgradeClient';
import { getMyTierRequests } from './actions';

export default async function TierUpgradePage() {
  const { data } = await getMyTierRequests();
  return <TierUpgradeClient initialRequests={data || []} />;
}
