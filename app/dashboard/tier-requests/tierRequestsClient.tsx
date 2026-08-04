'use client';

import { useState, useEffect, useRef } from 'react';
import GridContainer from '../gridContainer';
import { showToast } from '../toast';
import { fetchTierRequests, reviewTierRequest } from './actions';
import PaginationBar from '../PaginationBar';
import {
  PageHeader,
  FilterPills,
  SearchInput,
  TableShell,
  StatusBadge,
  EmptyState,
} from '../ui';
import type { PaginationMeta } from '@/lib/pagination';

type Req = {
  id: string;
  requester_username?: string;
  code?: string;
  current_tier?: string;
  current_rate?: number;
  follower_count?: number;
  social_handle?: string;
  note?: string;
  status: string;
};

type Tier = {
  id: string;
  name: string;
  level?: number;
  base_rate?: number;
  max_rate?: number;
  active?: boolean;
};

// Status vocabulary and its colours now live in ../ui (STATUS_TONE), so a
// "pending" pill looks the same here as it does on orders and applications.
const STATUSES = ['pending', 'approved', 'rejected', 'all'] as const;

function shortId(id: string) {
  return (id || '').split(':').pop() || id;
}

export default function TierRequestsClient({
  initialData,
  tiers,
}: {
  initialData: Req[];
  tiers: Tier[];
}) {
  // Filtered here as well as in the request, because the two repos deploy
  // independently: until the backend ships `?active=true`, the param is simply
  // ignored and the retired SWAZ-* ladder comes back with everything else.
  const liveTiers = (tiers || []).filter((t) => t.active !== false);

  const [reqs, setReqs] = useState<Req[]>(initialData || []);
  const [status, setStatus] = useState<string>('pending');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tierChoice, setTierChoice] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  // Previously unpaginated: the action sent no limit/offset, the backend
  // defaulted to 50, and the table just ended there.
  const [pagination, setPagination] = useState<PaginationMeta>({
    limit: 50,
    offset: 0,
    count: initialData?.length ?? 0,
  });
  const fetchIdRef = useRef(0);
  const lastFetchRef = useRef({
    status: 'pending',
    search: '',
    hasFetched: (initialData?.length ?? 0) > 0,
  });

  const load = async (
    nextStatus = status,
    nextSearch = search,
    nextOffset = 0,
  ) => {
    const id = ++fetchIdRef.current;
    lastFetchRef.current = {
      status: nextStatus,
      search: nextSearch,
      hasFetched: true,
    };
    setStatus(nextStatus);
    setLoading(true);
    const res = await fetchTierRequests(
      nextStatus,
      nextSearch,
      pagination.limit,
      nextOffset,
    );
    if (id !== fetchIdRef.current) return;
    setReqs(res.success ? res.data : []);
    if (res.success && res.meta?.pagination) {
      setPagination({ ...res.meta.pagination, offset: nextOffset });
    }
    if (!res.success) showToast('error', res.error || 'Failed to load');
    setLoading(false);
  };

  // Debounced search by creator username / email / code.
  useEffect(() => {
    if (
      lastFetchRef.current.hasFetched &&
      lastFetchRef.current.status === status &&
      lastFetchRef.current.search === search
    ) {
      return;
    }
    const t = setTimeout(() => load(status, search), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const review = async (req: Req, action: 'approve' | 'reject') => {
    if (busyId) return;
    setBusyId(req.id);
    const tierId = action === 'approve' ? tierChoice[req.id] : undefined;
    const res = await reviewTierRequest(shortId(req.id), action, tierId);
    setBusyId(null);
    if (res.success) {
      showToast('success', `Request ${action === 'approve' ? 'approved' : 'rejected'}`);
      setReqs((prev) => prev.filter((r) => r.id !== req.id));
    } else {
      showToast('error', res.error || 'Review failed');
    }
  };

  return (
    <GridContainer>
      <PageHeader
        eyebrow="The stage"
        title="Tier-upgrade requests"
        description="Creators submit their latest social following to request a higher commission tier. Approving applies their followers and auto-evaluates the tier — or pick one explicitly."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterPills
          options={STATUSES}
          value={status}
          onChange={(s) => load(s)}
          label="Filter by status"
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search creator, email or code…"
          label="Search tier requests"
        />
      </div>

      <TableShell>
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="border-b border-[#E2DBCC]">
              <th className="thead pl-6">Creator</th>
              <th className="thead">Code / current tier</th>
              <th className="thead">Reported followers</th>
              <th className="thead">Status</th>
              <th className="thead pr-6">Decision</th>
            </tr>
          </thead>
          <tbody>
            {reqs.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    title="Nothing to review"
                    hint={
                      status === 'all'
                        ? 'No creator has requested a tier upgrade yet.'
                        : `No ${status} requests right now.`
                    }
                  />
                </td>
              </tr>
            ) : (
              reqs.map((req) => (
                <tr key={req.id} className="ad-row">
                  <td className="td pl-6 font-medium text-[#14110E]">
                    @{req.requester_username || '—'}
                  </td>
                  <td className="td">
                    <div>{req.code || '—'}</div>
                    <div className="text-[12px] text-[#8C8377]">
                      {req.current_tier || 'no tier'} · {req.current_rate ?? '—'}%
                    </div>
                  </td>
                  <td className="td">
                    <div className="ad-display text-[17px] text-[#14110E]">
                      {(req.follower_count ?? 0).toLocaleString()}
                    </div>
                    {req.social_handle && (
                      <div className="text-[12px] text-[#8C8377]">{req.social_handle}</div>
                    )}
                    {req.note && (
                      <div className="text-[12px] text-[#8C8377] italic">“{req.note}”</div>
                    )}
                  </td>
                  <td className="td">
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="td pr-6">
                    {req.status === 'pending' ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={tierChoice[req.id] || ''}
                          onChange={(e) =>
                            setTierChoice((p) => ({ ...p, [req.id]: e.target.value }))
                          }
                          aria-label={`Tier for @${req.requester_username || 'creator'}`}
                          className="h-[34px] rounded-full border border-[#DFD7C6] bg-transparent py-0 pr-7 pl-3 text-[12px] text-[#3F3830] transition-colors outline-none hover:border-[#9C6F2E] focus:border-[#9C6F2E] focus:ring-0"
                        >
                          <option value="">Auto-evaluate</option>
                          {liveTiers.map((t) => (
                            <option key={t.id} value={shortId(t.id)}>
                              {t.name} ({t.base_rate}%)
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => review(req, 'approve')}
                          disabled={busyId === req.id}
                          className="ad-btn-primary !px-4 !py-1.5 !text-[12px]"
                        >
                          {busyId === req.id ? '…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => review(req, 'reject')}
                          disabled={busyId === req.id}
                          className="ad-btn-danger !px-4 !py-1.5 !text-[12px]"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[12px] tracking-[0.14em] text-[#8C8377] uppercase">
                        Reviewed
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>
      <PaginationBar
        pagination={pagination}
        onChange={(offset) => load(status, search, offset)}
        disabled={loading}
        noun="requests"
      />
    </GridContainer>
  );
}
