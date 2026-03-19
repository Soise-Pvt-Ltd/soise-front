export const dynamic = 'force-dynamic';

import UsersPage from './usersClient'; // The component is imported as 'UsersPage'
import { fetchUsers } from './actions';

export default async function UsersDashboardPage() {
  // fetch first page server-side
  const { success, data, meta } = await fetchUsers();

  return (
    <UsersPage
      initialData={data}
      initialMeta={meta}
      fetchServerData={fetchUsers}
    />
  );
}
