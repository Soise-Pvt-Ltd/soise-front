export const dynamic = 'force-dynamic';

import ProspectsClient from './prospectsClient';
import { fetchProspects, fetchProspectStats } from './actions';
import { requireRole } from '@/lib/require-role';

import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';
// Personalised / transactional page — no search value, and indexing it would
// expose order-flow URLs. Explicit noindex (robots.txt alone can't prevent
// URL-only indexing of a linked page).
export const metadata: Metadata = NOINDEX;

export default async function ProspectsPage() {
  await requireRole(['admin', 'outreach'], {
    deniedTo: '/',
    reason: 'team-only',
    loginCallback: '/team',
  });
  const [list, stats] = await Promise.all([
    fetchProspects('', 'all', 'all'),
    fetchProspectStats(),
  ]);
  return <ProspectsClient initial={list.data || []} stats={stats} />;
}
