export const dynamic = 'force-dynamic';

import ApplicationsClient from './applicationsClient';
import { fetchApplications } from './actions';

export default async function ApplicationsDashboardPage() {
  const { data } = await fetchApplications('submitted');
  return <ApplicationsClient initialData={data || []} initialStatus="submitted" />;
}
