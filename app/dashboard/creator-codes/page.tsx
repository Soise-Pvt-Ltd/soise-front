export const dynamic = 'force-dynamic';

import CreatorCodesClient from './creatorCodesClient';
import { fetchCreatorCodes } from './actions';

export default async function CreatorCodesPage() {
  const { data, meta } = await fetchCreatorCodes();
  return (
    <CreatorCodesClient
      initialData={data}
      initialMeta={meta}
      fetchServerData={fetchCreatorCodes}
    />
  );
}
