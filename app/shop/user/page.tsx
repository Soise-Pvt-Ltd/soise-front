import UserClient from './userClient';
import Nav from '@/components/home/nav/Nav';
import { getAccount } from './actions';

export default async function UserPage() {
  const result = await getAccount();
  const account = result.success ? (result.data as any) : null;

  return (
    <>
      <Nav />
      <UserClient account={account} />
    </>
  );
}
