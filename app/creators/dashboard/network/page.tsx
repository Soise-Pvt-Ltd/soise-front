export const dynamic = 'force-dynamic';

import NetworkClient from './networkClient';
import { getNetwork } from './actions';

export default async function NetworkPage() {
  const { data } = await getNetwork();
  return <NetworkClient network={data} />;
}
