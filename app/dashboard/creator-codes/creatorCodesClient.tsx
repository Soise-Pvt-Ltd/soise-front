'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import GridContainer from '../gridContainer';
import { showToast } from '../toast';

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
      <div className="px-[16px]">
        <div className="py-[22px]">
          <span className="text-[20px] font-medium">Creator Codes</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-[25px]">
        <div className="rounded-[20px] bg-white px-[30px] py-[30px] text-[#121212]">
          <div className="grid grid-cols-1 divide-y divide-gray-200 md:grid-cols-3 md:divide-x md:divide-y-0">
            <div className="space-y-[12px] py-4 md:py-0 md:pr-6">
              <div className="text-[14px] text-[#AFB1B0]">Total codes</div>
              <div className="text-[22px] font-medium">{stats.total}</div>
              <div className="text-[14px] text-[#0072BB]">Across all creators</div>
            </div>
            <div className="space-y-[12px] py-4 md:px-6 md:py-0">
              <div className="text-[14px] text-[#AFB1B0]">Active</div>
              <div className="text-[22px] font-medium">{stats.active}</div>
              <div className="text-[14px] text-[#32AC5B]">Currently usable</div>
            </div>
            <div className="space-y-[12px] py-4 md:py-0 md:pl-6">
              <div className="text-[14px] text-[#AFB1B0]">
                Sales generated (this page)
              </div>
              <div className="text-[22px] font-medium">{ngn(stats.sales)}</div>
              <div className="text-[14px] text-[#AFB1B0]">
                Attributed to these codes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div>
        <div className="rounded-t-[20px] border-b border-[#AEAEB266]/40 bg-white px-[24px] pt-[24px] pb-[16px] text-[#121212]">
          <div className="flex flex-col-reverse items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="text-[14px] text-[#8E8E93]">
              Every creator code, its owner, tier, commission rate and
              performance.
            </div>
            <input
              type="text"
              placeholder="Search code or creator…"
              aria-label="Search creator codes"
              className="h-[36px] w-full rounded-[10px] border-0 bg-[#F5F5F5] px-3 text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-[#0072BB] sm:w-[260px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-b-[20px] bg-white px-[24px] pb-[10px]">
          {isLoading ? (
            <div className="py-12 text-center text-sm text-gray-500">Loading…</div>
          ) : codes.length === 0 ? (
            <div className="flex flex-col items-center px-[24px] py-[48px] text-center">
              <p className="text-base font-medium text-gray-500">
                No creator codes found
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {search
                  ? 'Try a different search.'
                  : 'Codes appear here once creators are onboarded.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-[13px]">
                <thead>
                  <tr>
                    <th className="thead">Creator</th>
                    <th className="thead">Code</th>
                    <th className="thead">Tier</th>
                    <th className="thead">Rate</th>
                    <th className="thead">Uses</th>
                    <th className="thead">Total sales</th>
                    <th className="thead">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c.id} className="border-t border-[#F5F5F5]">
                      <td className="td">
                        <div className="flex items-center gap-x-[8px]">
                          <img
                            src={
                              c.owner_avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                fullName(c),
                              )}&background=EAEAEA&color=121212`
                            }
                            alt=""
                            className="size-8 shrink-0 rounded-full object-cover"
                          />
                          <div className="min-w-0">
                            <div className="truncate font-medium text-[#121212]">
                              {fullName(c)}
                            </div>
                            <div className="truncate text-[11px] text-[#AFB1B0]">
                              {c.owner_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="td">
                        <button
                          onClick={() => copyCode(c.code)}
                          title="Copy code"
                          className="rounded-[6px] bg-[#F5F5F5] px-[8px] py-[4px] font-mono text-[12px] font-medium tracking-wide text-[#121212] transition-colors hover:bg-[#E8E8E8]"
                        >
                          {c.code}
                        </button>
                      </td>
                      <td className="td">
                        <span className="rounded-full bg-[#C0CBF2] px-[8px] py-[2px] text-[11px] font-medium text-[#0072BB]">
                          {c.tier_name || 'No tier'}
                        </span>
                      </td>
                      <td className="td font-medium">{c.current_rate}%</td>
                      <td className="td">{c.usage_count ?? 0}</td>
                      <td className="td">{ngn(c.total_sales)}</td>
                      <td className="td">
                        {c.active ? (
                          <span className="rounded-full bg-[#CCEAD6] px-[8px] py-[2px] text-[11px] font-medium text-[#32AC5B]">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#E5C6BF] px-[8px] py-[2px] text-[11px] font-medium text-[#991C00]">
                            Inactive
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="mt-3 flex items-center justify-between px-2 text-sm text-gray-600">
            <span>
              Showing {pagination.offset + 1}–
              {Math.min(pagination.offset + pagination.limit, pagination.total)}{' '}
              of {pagination.total}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => load(pagination.offset - pagination.limit)}
                disabled={pagination.offset === 0 || isLoading}
                className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => load(pagination.offset + pagination.limit)}
                disabled={
                  pagination.offset + pagination.limit >= pagination.total ||
                  isLoading
                }
                className="rounded-md border border-gray-300 px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </GridContainer>
  );
}
