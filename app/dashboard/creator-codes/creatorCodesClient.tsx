'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import GridContainer from '../gridContainer';
import { showToast } from '../toast';
import {
  PageHeader,
  SearchInput,
  TableShell,
  Badge,
  EmptyState,
} from '../ui';

interface CreatorCode {
  id: string;
  code: string;
  active: boolean;
  current_rate: number;
  usage_count: number;
  total_sales: number;
  monthly_sales: number;
  discount_percentage: number;
  created_at: string;
  owner_id: string;
  owner_first_name: string;
  owner_last_name: string;
  owner_email: string;
  owner_avatar?: string;
  tier_name?: string;
  tier_level?: number;
}

interface Props {
  initialData: CreatorCode[];
  initialMeta: any;
  fetchServerData: (
    limit?: number,
    offset?: number,
    search?: string,
  ) => Promise<any>;
}

const ngn = (n: number) =>
  `₦${(Number(n) || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

export default function CreatorCodesClient({
  initialData,
  initialMeta,
  fetchServerData,
}: Props) {
  const [codes, setCodes] = useState<CreatorCode[]>(initialData || []);
  const [pagination, setPagination] = useState(
    initialMeta?.pagination || { limit: 50, offset: 0, count: 0, total: 0 },
  );
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') ?? '';
  const [search, setSearch] = useState(initialSearch);
  const [isLoading, setIsLoading] = useState(false);
  const fetchIdRef = useRef(0);
  const lastFetchRef = useRef({
    search: initialSearch,
    hasFetched: (initialData?.length ?? 0) > 0,
  });

  const fullName = (c: CreatorCode) =>
    `${c.owner_first_name || ''} ${c.owner_last_name || ''}`.trim() ||
    c.owner_email ||
    'Unknown';

  const stats = useMemo(() => {
    const active = codes.filter((c) => c.active).length;
    const sales = codes.reduce((s, c) => s + (Number(c.total_sales) || 0), 0);
    return { total: pagination.total ?? codes.length, active, sales };
  }, [codes, pagination.total]);

  const load = async (offset = 0) => {
    const id = ++fetchIdRef.current;
    lastFetchRef.current = { search, hasFetched: true };
    setIsLoading(true);
    const res = await fetchServerData(pagination.limit, offset, search);
    if (id !== fetchIdRef.current) return;
    if (res.success) {
      setCodes(res.data);
      setPagination({ ...res.meta.pagination, offset });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (
      lastFetchRef.current.hasFetched &&
      lastFetchRef.current.search === search
    ) {
      return;
    }
    const t = setTimeout(() => load(0), 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showToast('success', `Copied ${code}`);
    } catch {
      showToast('error', 'Could not copy');
    }
  };

  return (
    <GridContainer>
      <PageHeader
        eyebrow="The stage"
        title="Creator codes"
        description="Every code is a credit. Each one below carries its owner, tier, commission rate and the sales it has moved."
      />

      {/* The hairline three-up, straight from /about's product section. */}
      <div className="suite-grid-hairline mb-6 grid sm:grid-cols-3">
        <div className="bg-[#FBF9F4] p-6">
          <p className="suite-eyebrow">Total codes</p>
          <p className="suite-display mt-3 text-[30px] leading-none text-[#14110E]">
            {stats.total}
          </p>
          <p className="mt-2 text-[12px] text-[#8C8377]">Across all creators</p>
        </div>
        <div className="bg-[#FBF9F4] p-6">
          <p className="suite-eyebrow">Active</p>
          <p className="suite-display mt-3 text-[30px] leading-none text-[#14110E]">
            {stats.active}
          </p>
          <p className="mt-2 text-[12px] text-[#8C8377]">Currently usable</p>
        </div>
        <div className="bg-[#FBF9F4] p-6">
          <p className="suite-eyebrow">Sales generated</p>
          <p className="suite-display mt-3 text-[30px] leading-none text-[#14110E]">
            {ngn(stats.sales)}
          </p>
          <p className="mt-2 text-[12px] text-[#8C8377]">
            Attributed to the codes on this page
          </p>
        </div>
      </div>

      <div className="mb-5 flex justify-end">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search code or creator…"
          label="Search creator codes"
        />
      </div>

      <TableShell>
        {isLoading ? (
          <EmptyState title="Loading…" />
        ) : codes.length === 0 ? (
          <EmptyState
            title="No creator codes found"
            hint={
              search
                ? 'Try a different search.'
                : 'Codes appear here once creators are onboarded.'
            }
          />
        ) : (
          <table className="min-w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E2DBCC]">
                <th className="thead pl-6">Creator</th>
                <th className="thead">Code</th>
                <th className="thead">Tier</th>
                <th className="thead">Rate</th>
                <th className="thead">Uses</th>
                <th className="thead">Total sales</th>
                <th className="thead pr-6">Status</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className="suite-row">
                  <td className="td pl-6">
                    <div className="flex items-center gap-x-3">
                      <img
                        src={
                          c.owner_avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            fullName(c),
                          )}&background=EFEBE1&color=14110E`
                        }
                        alt=""
                        className="size-8 shrink-0 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium text-[#14110E]">
                          {fullName(c)}
                        </div>
                        <div className="truncate text-[11px] text-[#8C8377]">
                          {c.owner_email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <button
                      onClick={() => copyCode(c.code)}
                      title="Copy code"
                      className="rounded-full border border-[#DFD7C6] bg-[#EFEBE1] px-3 py-1 font-mono text-[12px] tracking-[0.08em] text-[#14110E] transition-colors hover:border-[#9C6F2E] hover:text-[#9C6F2E]"
                    >
                      {c.code}
                    </button>
                  </td>
                  <td className="td">
                    <Badge tone={c.tier_name ? 'warn' : 'neutral'}>
                      {c.tier_name || 'No tier'}
                    </Badge>
                  </td>
                  <td className="td suite-display text-[16px] text-[#14110E]">
                    {c.current_rate}%
                  </td>
                  <td className="td">{c.usage_count ?? 0}</td>
                  <td className="td">{ngn(c.total_sales)}</td>
                  <td className="td pr-6">
                    <Badge tone={c.active ? 'good' : 'neutral'}>
                      {c.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableShell>

      {pagination.total > pagination.limit && (
        <div className="mt-4 flex flex-col gap-y-3 border-t border-[#E2DBCC] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] tracking-[0.14em] text-[#8C8377] uppercase">
            Showing <span className="text-[#14110E]">{pagination.offset + 1}</span>–
            <span className="text-[#14110E]">
              {Math.min(pagination.offset + pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="text-[#14110E]">{pagination.total}</span> codes
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => load(pagination.offset - pagination.limit)}
              disabled={pagination.offset === 0 || isLoading}
              className="cursor-pointer rounded-full border border-[#DFD7C6] px-4 py-1.5 text-[12px] text-[#3F3830] transition-colors hover:border-[#14110E] hover:text-[#14110E] disabled:cursor-not-allowed disabled:opacity-35"
            >
              Previous
            </button>
            <button
              onClick={() => load(pagination.offset + pagination.limit)}
              disabled={
                pagination.offset + pagination.limit >= pagination.total ||
                isLoading
              }
              className="cursor-pointer rounded-full border border-[#DFD7C6] px-4 py-1.5 text-[12px] text-[#3F3830] transition-colors hover:border-[#14110E] hover:text-[#14110E] disabled:cursor-not-allowed disabled:opacity-35"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </GridContainer>
  );
}
