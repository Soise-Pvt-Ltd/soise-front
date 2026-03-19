// PayoutPage.tsx
import PayoutClient from './payoutClient';
import { fetchPayouts } from './actions';

export const dynamic = 'force-dynamic';

export default async function PayoutPage() {
  // fetch first page server-side
  const { success, data, meta } = await fetchPayouts();

  return (
    <PayoutClient
      initialData={data}
      initialMeta={meta}
      fetchServerData={fetchPayouts}
    />
  );
}
