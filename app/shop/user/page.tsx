import UserClient from './userClient';
import Nav from '@/components/home/nav/Nav';

export default async function UserPage() {
  return (
    <>
      <Nav />
      <UserClient />
    </>
  );
}
