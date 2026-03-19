export const dynamic = 'force-dynamic';

import CreatorsClient from './creatorsClient';
import { fetchCreators } from './actions';

export default async function creatorsDashboardPage() {
  // fetch first page server-side
  const { success, data, meta } = await fetchCreators();

  return (
    <CreatorsClient
      initialData={data}
      initialMeta={meta}
      fetchServerData={fetchCreators}
    />
  );
}
