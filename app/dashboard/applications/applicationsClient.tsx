'use client';

import { useState, useEffect, useRef } from 'react';
import GridContainer from '../gridContainer';
import { showToast } from '../toast';
import { fetchApplications, reviewApplication, allowReapplication } from './actions';
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

type Application = {
  id: string;
  applicant_username?: string;
  applicant_email?: string;
  applicant_first_name?: string;
  applicant_last_name?: string;
  portfolio_url?: string;
  bio?: string;
  status: string;
  created_at?: string;
};

// Badge colours come from the suite's shared STATUS_TONE map (../ui).
const STATUSES = ['submitted', 'approved', 'rejected', 'all'] as const;

function shortId(id: string) {
  return (id || '').split(':').pop() || id;
}

export default function ApplicationsClient({
  initialData,
  initialStatus = 'submitted',
}: {
  initialData: Application[];
  initialStatus?: string;
}) {
  const [apps, setApps] = useState<Application[]>(initialData || []);
  const [status, setStatus] = useState<string>(initialStatus);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  // This screen had no paging at all: it took the backend's default 50 and the
  // table simply stopped, so older applications were unreachable.
  const [pagination, setPagination] = useState<PaginationMeta>({
    limit: 50,
    offset: 0,
    count: initialData?.length ?? 0,
  });
  const fetchIdRef = useRef(0);
  const lastFetchRef = useRef({
    status: initialStatus,
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
    const res = await fetchApplications(
      nextStatus,
      nextSearch,
      pagination.limit,
      nextOffset,
    );
    if (id !== fetchIdRef.current) return;
    setApps(res.success ? res.data : []);
    if (res.success && res.meta?.pagination) {
      setPagination({ ...res.meta.pagination, offset: nextOffset });
    }
    if (!res.success) showToast('error', res.error || 'Failed to load');
    setLoading(false);
  };

  // Debounced search by applicant name / email.
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

  const review = async (app: Application, action: 'approve' | 'reject') => {
    if (busyId) return;
    if (action === 'reject' && !confirm(`Reject @${app.applicant_username}'s creator application?`)) return;
    setBusyId(app.id);
    const res = await reviewApplication(shortId(app.id), action);
    setBusyId(null);
    if (res.success) {
      showToast('success', `Application ${action === 'approve' ? 'approved' : 'rejected'}`);
      // Drop it from the current (status-filtered) list
      setApps((prev) => prev.filter((a) => a.id !== app.id));
    } else {
      showToast('error', res.error || 'Review failed');
    }
  };

  const allowReapply = async (app: Application) => {
    if (busyId) return;
    if (
      !confirm(
        `Let @${app.applicant_username} re-apply now, bypassing the 30-day wait?`,
      )
    )
      return;
    setBusyId(app.id);
    const res = await allowReapplication(shortId(app.id));
    setBusyId(null);
    if (res.success) {
      showToast('success', 'Re-application enabled — they can apply again now');
    } else {
      showToast('error', res.error || 'Could not enable re-application');
    }
  };

  return (
    <GridContainer>
      <PageHeader
        eyebrow="The stage"
        title="Creator applications"
        description="Every drop is a collaboration — this is where the stage gets set. Approving upgrades an account so they can finish onboarding with bank details and a code."
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
          placeholder="Search applicant name or email…"
          label="Search applications"
        />
      </div>

      <TableShell>
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-[#E2DBCC]">
              <th className="thead pl-6">Applicant</th>
              <th className="thead">Portfolio</th>
              <th className="thead">Bio</th>
              <th className="thead">Status</th>
              <th className="thead pr-6">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState title="Loading…" />
                </td>
              </tr>
            ) : apps.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    title="No applications here"
                    hint={
                      status === 'all'
                        ? 'Nobody has applied to create with Soise yet.'
                        : `Nothing ${status} at the moment.`
                    }
                  />
                </td>
              </tr>
            ) : (
              apps.map((app) => (
                <tr key={app.id} className="suite-row">
                  <td className="td pl-6">
                    <div className="font-medium text-[#14110E]">
                      @{app.applicant_username || '—'}
                    </div>
                    <div className="text-[12px] text-[#8C8377]">
                      {app.applicant_email || ''}
                    </div>
                  </td>
                  <td className="td max-w-[180px] truncate">
                    {app.portfolio_url ? (
                      <a
                        href={app.portfolio_url}
                        target="_blank"
                        rel="noreferrer"
                        className="luxe-underline text-[#9C6F2E]"
                      >
                        {app.portfolio_url}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="td max-w-[260px] truncate text-[#5C544A]">
                    {app.bio || '—'}
                  </td>
                  <td className="td">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="td pr-6">
                    {app.status === 'submitted' || app.status === 'review' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => review(app, 'approve')}
                          disabled={busyId === app.id}
                          className="suite-btn-primary !px-4 !py-1.5 !text-[12px]"
                        >
                          {busyId === app.id ? '…' : 'Approve'}
                        </button>
                        <button
                          onClick={() => review(app, 'reject')}
                          disabled={busyId === app.id}
                          className="suite-btn-danger !px-4 !py-1.5 !text-[12px]"
                        >
                          Reject
                        </button>
                      </div>
                    ) : app.status === 'rejected' ? (
                      <button
                        onClick={() => allowReapply(app)}
                        disabled={busyId === app.id}
                        title="Bypass the 30-day cooldown so this applicant can re-apply now"
                        className="suite-btn-ghost !px-4 !py-1.5 !text-[12px]"
                      >
                        {busyId === app.id ? '…' : 'Allow re-application'}
                      </button>
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
        noun="applications"
      />
    </GridContainer>
  );
}
