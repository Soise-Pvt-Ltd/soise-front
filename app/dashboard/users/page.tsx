import axios from 'axios';
import UsersPage from './usersClient'; // The component is imported as 'UsersPage'

export default async function UsersDashboardPage() {
  try {
    // Changed endpoint to fetch users instead of products
    const res = await axios.get(`${process.env.NEXT_PUBLIC_BASE_URL}/users`, {
      headers: {
        'Cache-Control': 'no-store',
        Authorization: `Bearer ${process.env.API_KEY}`, // Assuming you need auth for this
      },
    });

    // Use the capitalized component name and pass the fetched users as a prop
    return <UsersPage users={res.data.data} />;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw new Error('Failed to fetch users');
  }
}
