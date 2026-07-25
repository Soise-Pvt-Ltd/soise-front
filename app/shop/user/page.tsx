import UserClient from './userClient';
import Nav from '@/components/home/nav/Nav';
import { getAccount } from './actions';

import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';
// Personalised / transactional page — no search value, and indexing it would
// expose order-flow URLs. Explicit noindex (robots.txt alone can't prevent
// URL-only indexing of a linked page).
export const metadata: Metadata = NOINDEX;

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
