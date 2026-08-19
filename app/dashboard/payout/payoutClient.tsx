'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import GridContainer from '../gridContainer';
import { PageHeader } from '../ui';
import { AdminSoundLevelsIcon, AdminSuccessCheckIcon } from '@/components/icons';
import {
  confirmPayout,
  initiatePayout,
  getProviderBalance,
  getPayoutBreakdown,
} from './actions';
import { showToast } from '../toast';
import { totalRows } from '@/lib/pagination';
import { formatDate, formatTime } from '@/lib/admin-datetime';

type PayoutStatus =
  | 'requested'
  | 'processing'
  | 'paid'
  | 'completed'
  | 'failed';

interface TransferData {
  amount: number;
  createdAt: string;
  currency: string;
  domain: string;
  id: number;
  integration: number;
  reason: string;
  recipient: number;
  reference: string;
  request: number;
  source: string;
  status: string;
  transfer_code: string;
  transfersessionid: any[];
  transfertrials: any[];
  updatedAt: string;
}

interface User {
  avatar: string;
  created_at: string;
  email: string;
  email_verified: boolean;
  first_name: string;
  google_id: string;
  id: string;
  last_name: string;
  role: string;
  updated_at: string;
  username: string;
}

interface Payout {
  amount: number;
  created_at: string;
  currency: string;
  id: string;
  status: PayoutStatus;
  transfer_data: TransferData;
  updated_at: string;
  user: User;
  wallet: string;
}

interface PayoutClientProps {
  initialData: Payout[];
  initialMeta: any;
  fetchServerData: (
    limit?: number,
    offset?: number,
    search?: string,
    status?: string,
    period?: string,
  ) => Promise<any>;
}

const money = (n: number) =>
  `₦${(Number(n) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const shortId = (id: any) => String(id ?? '').split(':').pop()?.slice(0, 8) ?? '—';

export default function PayoutClient({
  initialData,
  initialMeta,
  fetchServerData,
}: PayoutClientProps) {
  const [activeTab, setActiveTab] = useState('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [pagination, setPagination] = useState(
    initialMeta?.pagination || { limit: 50, offset: 0, count: 0 },
  );
  // Whole-table counts by status, for the summary cards.
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>(
    initialMeta?.status_counts || {},
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [payouts, setPayouts] = useState<Payout[]>(initialData || []);
  const fetchIdRef = useRef(0);
  const lastFetchRef = useRef({
    search: '',
    status: 'All',
    period: 'All Time',
    hasFetched: (initialData?.length ?? 0) > 0,
  });
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const [pendingInitiate, setPendingInitiate] = useState<Payout | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  // Live Bachs balance — payouts draw from it. null = unknown/not loaded.
  const [providerBalance, setProviderBalance] = useState<number | null>(null);

  // Payout breakdown modal — the traceable orders behind a payout.
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<any | null>(null);

  const openBreakdown = async (payout: Payout) => {
    setShowBreakdown(true);
    setBreakdownLoading(true);
    setBreakdown(null);
    const res = await getPayoutBreakdown(payout.id);
    setBreakdown(res.success ? res.data : null);
    setBreakdownLoading(false);
  };

  const loadBalance = useCallback(async () => {
    const res = await getProviderBalance();
    if (res.success && typeof res.balance === 'number') {
      setProviderBalance(res.balance);
    }
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const periodOptions = ['All Time', 'Today', 'Last 7 Days', 'Last 30 Days'];
  const tabs = [
    { id: 'All', label: 'All' },
    { id: 'requested', label: 'Requested' },
    // { id: 'rejected', label: 'Rejected' },
  ];

  // formatDate/formatTime come from lib/admin-datetime — they pin the timezone
  // so the server and the browser render the same string. Reading the ambient
  // zone here is the same hydration mismatch the overview was throwing.

  // Helper function to get full name
  const getFullName = (user: User) => {
    return `${user.first_name} ${user.last_name}`;
  };

  // Summary cards, from whole-table counts supplied by the backend.
  //
  // These used to be counted from `payouts` — the rows currently on screen.
  // That made the cards lie in two ways: switching to the Requested tab sends
  // pending=true, so Confirmed dropped to 0; and past the first page both
  // numbers silently described only the newest 50 payouts, under labels
  // reading "Total paid" and "Awaiting transfer".
  const stats = useMemo(() => {
    const c = statusCounts || {};
    // Same independent-deploy caveat as the product badges: if the backend
    // isn't sending status_counts yet, fall back to the old page-derived
    // numbers rather than reporting a confident zero.
    if (!Object.keys(c).length) {
      return {
        completed: payouts.filter(
          (p) => p.status === 'completed' || p.status === 'paid',
        ).length,
        requested: payouts.filter(
          (p) => p.status === 'requested' || p.status === 'processing',
        ).length,
        failed: payouts.filter((p) => p.status === 'failed').length,
      };
    }
    return {
      completed: (c.completed ?? 0) + (c.paid ?? 0),
      requested: (c.requested ?? 0) + (c.processing ?? 0),
      failed: c.failed ?? 0,
    };
  }, [statusCounts, payouts]);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
      setIsDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    const next = {
      search: searchQuery,
      status: activeTab,
      period: selectedPeriod,
    };
    if (
      lastFetchRef.current.hasFetched &&
      next.search === lastFetchRef.current.search &&
      next.status === lastFetchRef.current.status &&
      next.period === lastFetchRef.current.period
    ) {
      return;
    }

    const timer = setTimeout(() => {
      handleFilterChange();
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, activeTab, selectedPeriod]);

  const handleFilterChange = async () => {
    const id = ++fetchIdRef.current;
    lastFetchRef.current = {
      search: searchQuery,
      status: activeTab,
      period: selectedPeriod,
      hasFetched: true,
    };
    setIsLoading(true);
    const result = await fetchServerData(
      pagination.limit,
      0,
      searchQuery,
      activeTab,
      selectedPeriod,
    );
    if (id !== fetchIdRef.current) return;
    if (result.success) {
      setPayouts(result.data);
      setPagination({ ...result.meta.pagination, offset: 0 });
      if (result.meta?.status_counts) setStatusCounts(result.meta.status_counts);
    } else {
      // Without this the spinner just stops and the old rows stay put under
      // the new tab label, so a failed refetch reads as a filter result.
      showToast('error', 'Could not refresh the list. Showing the previous results.');
    }
    setIsLoading(false);
  };

  const handlePageChange = async (newOffset: number) => {
    if (newOffset < 0 || newOffset >= totalRows(pagination)) return;
    const id = ++fetchIdRef.current;
    setIsLoading(true);
    const result = await fetchServerData(
      pagination.limit,
      newOffset,
      searchQuery,
      activeTab,
      selectedPeriod,
    );
    if (id !== fetchIdRef.current) return;
    if (result.success) {
      setPayouts(result.data);
      setPagination(result.meta.pagination);
      if (result.meta?.status_counts) setStatusCounts(result.meta.status_counts);
    } else {
      showToast('error', 'Could not load that page. Please try again.');
    }
    setIsLoading(false);
  };

  // Admin initiates the Bachs withdrawal for a queued ('requested') payout.
  // Bachs has no transfer OTP: the withdrawal goes straight to 'processing'
  // and the payout.paid webhook marks it paid.
  // Sending money is the least reversible thing this dashboard does, so it
  // asks first — every time, not only when the balance looks short. Deleting a
  // product already opened a styled dialog while a bank transfer went straight
  // through on one click, which had the confirmation scaled backwards. The old
  // insufficient-balance warning was a raw window.confirm: unstyled, easy to
  // dismiss out of habit, and suppressible by the browser's "prevent this page
  // from creating more dialogs". It is now a state of this dialog instead.
  const handleInitiateClick = (payout: Payout) => setPendingInitiate(payout);

  const confirmInitiate = async () => {
    const payout = pendingInitiate;
    if (!payout) return;
    setPendingInitiate(null);
    setProcessingId(payout.id);
    try {
      const result = await initiatePayout(payout.id);
      if (!result.success) {
        showToast('error', result.message || 'Could not initiate transfer');
        loadBalance();
        handleFilterChange();
        return;
      }
      showToast('success', result.message || 'Transfer initiated.');
      handleFilterChange();
      loadBalance();
    } catch {
      showToast('error', 'An error occurred while initiating the transfer');
    } finally {
      setProcessingId(null);
    }
  };

  // For a 'processing' payout: ask Bachs for the withdrawal's current status
  // and settle it if the payout.paid/payout.failed webhook was missed.
  const handleCheckStatus = async (id: string) => {
    setProcessingId(id);
    try {
      const result = await confirmPayout(id);
      if (result.success) {
        const status = result.data?.status;
        showToast(
          'success',
          status === 'paid'
            ? 'Payout confirmed — transfer delivered.'
            : 'Still processing at Bachs. The webhook will complete it.',
        );
        handleFilterChange();
        loadBalance();
      } else {
        showToast('error', result.message || 'Could not check this payout');
        handleFilterChange();
      }
    } catch {
      showToast('error', 'An error occurred while checking the payout');
    } finally {
      setProcessingId(null);
    }
  };

  const renderActionButtons = (payout: Payout) => {
    switch (payout.status) {
      case 'requested':
        // Admin starts the Bachs withdrawal. Creators only queue the request.
        return (
          <button
            onClick={() => handleInitiateClick(payout)}
            disabled={processingId === payout.id}
            className="flex h-[30px] items-center justify-center gap-x-[4px] rounded-full bg-[#14110E] px-[12px] font-medium text-[#F4F1EA] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processingId === payout.id ? 'Initiating…' : 'Initiate transfer'}
          </button>
        );
      case 'processing':
        // Withdrawal initiated; the payout.paid webhook completes it. The
        // button is a manual re-check for the day a webhook goes missing.
        return (
          <div className="flex items-center gap-x-2">
            <button
              onClick={() => handleCheckStatus(payout.id)}
              disabled={processingId === payout.id}
              className="flex h-[30px] items-center justify-center gap-x-[4px] rounded-full border border-[#14110E]/25 px-[14px] font-medium text-[#14110E] transition-colors hover:border-[#14110E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processingId === payout.id ? 'Checking…' : 'Check status'}
            </button>
          </div>
        );
      case 'completed':
      case 'paid':
        return (
          <span className="flex h-[30px] items-center gap-x-[2px] rounded-full border border-[#E4EDE3] bg-[#E4EDE3] p-[6px] !pr-[8px] font-medium text-[#3D6B4A]">
            <AdminSuccessCheckIcon />
            Paid
          </span>
        );
      case 'failed':
        return (
          <span className="rounded-full border border-[#F2E1DB] bg-[#F2E1DB] px-3 py-1 text-xs font-medium text-[#8C3A2B]">
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (payouts.length === 0) {
      return (
        <div className="flex flex-col items-center px-[24px] py-[48px] text-center">
          <p className="suite-display text-[18px] text-[#14110E]">No payouts found</p>
          <p className="mt-2 max-w-[340px] text-[13px] leading-relaxed text-[#8C8377]">
            {searchQuery || activeTab !== 'All'
              ? 'Try adjusting your search or filters'
              : 'Payout requests from creators will appear here'}
          </p>
        </div>
      );
    }

    return (
      <>
        {isLoading && (
          <div className="py-4 text-center text-sm text-[#8C8377]">
            Loading...
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="text-medium min-w-full text-left text-[13px]">
            <thead>
              <tr>
                <th scope="col" className="thead">
                  Creator
                </th>
                <th scope="col" className="thead">
                  Date
                </th>
                <th scope="col" className="thead">
                  Time
                </th>
                <th scope="col" className="thead">
                  Payout
                </th>
                <th scope="col" className="thead">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((payout: any) => (
                <tr
                  key={payout.id}
                  onClick={() => openBreakdown(payout)}
                  title="Tap to verify the orders behind this payout"
                  className="suite-row cursor-pointer"
                >
                  <td className="td">
                    <div className="flex items-center gap-x-[5px]">
                      <img
                        src={`https://ui-avatars.com/api/?name=${getFullName(payout.user)[0]}`}
                        alt={getFullName(payout.user)}
                        className="size-8 rounded-full object-cover"
                      />
                      <div className="truncate">{getFullName(payout.user)}</div>
                    </div>
                  </td>
                  <td className="td">{formatDate(payout.created_at)}</td>
                  <td className="td">{formatTime(payout.created_at)}</td>
                  <td className="td">
                    {payout.currency === 'NGN' ? '₦' : payout.currency}
                    {payout.amount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="td" onClick={(e) => e.stopPropagation()}>
                    {renderActionButtons(payout)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const shortfall =
    pendingInitiate !== null &&
    providerBalance !== null &&
    pendingInitiate.amount > providerBalance;

  return (
    <GridContainer>
      {pendingInitiate && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="initiate-payout-title"
          className="fixed inset-0 z-50 grid place-items-center bg-[#0E0E10]/55 px-4"
          onClick={() => setPendingInitiate(null)}
        >
          <div
            className="w-full max-w-[420px] rounded-[14px] bg-[#FBF9F4] p-[24px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="initiate-payout-title"
              className="suite-display text-[19px] text-[#14110E]"
            >
              Send {money(pendingInitiate.amount)} to{' '}
              {getFullName(pendingInitiate.user)}?
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#5C544A]">
              This starts a real bank transfer through Bachs. Once it leaves,
              it cannot be recalled from here.
            </p>
            {/* The destination is restated rather than assumed: the admin is
                approving a transfer to a specific person, and the row they
                clicked is behind the overlay. */}
            <dl className="mt-[16px] rounded-[10px] border border-[#E2DBCC] bg-[#F4F1EA] px-[14px] py-[12px] text-[13px]">
              <div className="flex justify-between gap-x-4">
                <dt className="text-[#5C544A]">Amount</dt>
                <dd className="font-medium text-[#14110E] tabular-nums">
                  {money(pendingInitiate.amount)}
                </dd>
              </div>
              <div className="mt-[6px] flex justify-between gap-x-4">
                <dt className="text-[#5C544A]">Creator</dt>
                <dd className="truncate text-[#14110E]">
                  {pendingInitiate.user?.email}
                </dd>
              </div>
            </dl>
            {shortfall && (
              <p className="mt-[14px] rounded-[10px] bg-[#F3E9D6] px-[14px] py-[10px] text-[13px] leading-relaxed text-[#8A6218]">
                Your Bachs balance is {money(providerBalance as number)} — less
                than this payout. In live mode Bachs rejects it and the amount
                returns to the creator. Top up first.
              </p>
            )}
            <div className="mt-[20px] flex justify-end gap-x-3">
              <button
                type="button"
                onClick={() => setPendingInitiate(null)}
                className="cursor-pointer rounded-[10px] border border-[#DFD7C6] px-[16px] py-[9px] text-[13px]"
              >
                Not yet
              </button>
              <button
                type="button"
                onClick={confirmInitiate}
                className={`cursor-pointer rounded-full px-[16px] py-[9px] text-[13px] font-medium text-[#F4F1EA] ${
                  shortfall ? 'bg-[#8C3A2B]' : 'bg-[#14110E]'
                }`}
              >
                {shortfall
                  ? 'Send anyway'
                  : `Send ${money(pendingInitiate.amount)}`}
              </button>
            </div>
          </div>
        </div>
      )}
      <PageHeader
        eyebrow="The stage"
        title="Payout"
        description="Every sale moves us toward a creator economy that pays its own. This is where that money actually leaves."
      />

      {/* 1st layer — the hairline three-up used across the suite. */}
      <div className="suite-grid-hairline mb-6 grid sm:grid-cols-3">
        <div className="bg-[#FBF9F4] p-6">
          <p className="suite-eyebrow">Confirmed</p>
          <p className="suite-display mt-3 text-[30px] leading-none text-[#14110E]">
            {stats.completed}
          </p>
          <p className="mt-2 text-[12px] text-[#8C8377]">Total paid</p>
        </div>
        <div className="bg-[#FBF9F4] p-6">
          <p className="suite-eyebrow">Requested</p>
          <p className="suite-display mt-3 text-[30px] leading-none text-[#14110E]">
            {stats.requested}
          </p>
          <p className="mt-2 text-[12px] text-[#8C3A2B]">Awaiting transfer</p>
        </div>
        <div className="bg-[#FBF9F4] p-6">
          <p className="suite-eyebrow">Bachs balance</p>
          <p className="suite-display mt-3 text-[30px] leading-none text-[#14110E]">
            {providerBalance === null
              ? '—'
              : `₦${providerBalance.toLocaleString('en-NG', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
          </p>
          <p className="mt-2 text-[12px] text-[#8C8377]">
            Funds available to pay out
          </p>
        </div>
      </div>

      {/* 2nd layer */}
      <div className="">
        <div className="rounded-t-[14px] border border-[#E2DBCC] bg-[#FBF9F4] px-[24px] pt-[24px] text-[#14110E]">
          <div className="scrollbar-hide relative flex flex-col-reverse items-start justify-between gap-4 overflow-visible sm:flex-row sm:items-center">
            <div className="flex items-center gap-8">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative cursor-pointer pb-4 text-[14px] transition-all duration-200 ease-in-out ${
                      isActive
                        ? 'text-[#14110E]'
                        : 'text-[#8C8377] hover:text-[#5C544A]'
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <span className="absolute top-full left-0 z-10 h-[2px] w-full translate-y-[-2px] rounded-t-sm bg-[#9C6F2E] sm:translate-y-[5px]" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex w-full items-center gap-x-2 sm:w-auto">
              <div className="w-full pb-4 sm:w-auto">
                <input
                  type="text"
                  placeholder="Search creators..."
                  aria-label="Search creators"
                  className="h-[36px] w-full rounded-full border border-[#DFD7C6] bg-[#EFEBE1] text-[#14110E] placeholder:text-[#8C8377] text-[12px] outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#9C6F2E] md:w-[245px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div ref={filterDropdownRef} className="relative flex items-center pb-4">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="btn_admin_outline flex items-center gap-x-[2px]"
                  aria-label="Filter by time period"
                  aria-expanded={isDropdownOpen}
                >
                  <AdminSoundLevelsIcon />
                  <span className="hidden whitespace-nowrap md:inline-block">
                    {selectedPeriod}
                  </span>
                </button>
                {isDropdownOpen && (
                  <div className="absolute top-full right-0 z-10 -mt-2 w-32 origin-top-right rounded-[10px] border border-[#E2DBCC] bg-[#FBF9F4] shadow-[0_18px_40px_-20px_rgba(20,17,14,0.35)]">
                    <div className="py-1">
                      {periodOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSelectedPeriod(option);
                            setIsDropdownOpen(false);
                          }}
                          className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-[#8C8377] hover:bg-[#EFEAE0] hover:text-[#8C8377]"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-b-[14px] border border-t-0 border-[#E2DBCC] bg-[#FBF9F4] px-[24px]">
          {renderContent()}
        </div>
        {/* Pagination Controls */}
        {totalRows(pagination) > 0 && (
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() =>
                  handlePageChange(pagination.offset - pagination.limit)
                }
                disabled={pagination.offset === 0 || isLoading}
                className="relative inline-flex items-center rounded-[8px] border border-[#DFD7C6] bg-[#FBF9F4] px-4 py-2 text-sm font-medium text-[#3F3830] hover:bg-[#EFEBE1] disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  handlePageChange(pagination.offset + pagination.limit)
                }
                disabled={
                  pagination.offset + pagination.limit >= totalRows(pagination) ||
                  isLoading
                }
                className="relative ml-3 inline-flex items-center rounded-[8px] border border-[#DFD7C6] bg-[#FBF9F4] px-4 py-2 text-sm font-medium text-[#3F3830] hover:bg-[#EFEBE1] disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-[#3F3830]">
                  Showing{' '}
                  <span className="font-medium">{pagination.offset + 1}</span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(
                      pagination.offset + pagination.limit,
                      totalRows(pagination),
                    )}
                  </span>{' '}
                  of <span className="font-medium">{totalRows(pagination)}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-[8px] shadow-xs"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() =>
                      handlePageChange(pagination.offset - pagination.limit)
                    }
                    disabled={pagination.offset === 0 || isLoading}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-[#8C8377] ring-1 ring-[#DFD7C6] ring-inset hover:bg-[#EFEBE1] focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      handlePageChange(pagination.offset + pagination.limit)
                    }
                    disabled={
                      pagination.offset + pagination.limit >=
                        totalRows(pagination) || isLoading
                    }
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-[#8C8377] ring-1 ring-[#DFD7C6] ring-inset hover:bg-[#EFEBE1] focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {showBreakdown && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E0E10]/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="breakdown-title"
          onClick={() => setShowBreakdown(false)}
        >
          <div
            className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4] shadow-[0_30px_80px_-30px_rgba(20,17,14,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#E2DBCC] px-[24px] py-[20px]">
              <div>
                <h2
                  id="breakdown-title"
                  className="text-[18px] font-semibold text-[#14110E]"
                >
                  Payout verification
                </h2>
                <p className="mt-[2px] text-[13px] text-[#5C544A]">
                  The orders that built this creator&rsquo;s balance.
                </p>
              </div>
              <button
                onClick={() => setShowBreakdown(false)}
                aria-label="Close"
                className="flex h-[32px] w-[32px] items-center justify-center rounded-full text-[#8C8377] transition-colors hover:bg-[#EFEAE0] hover:text-[#5C544A] focus-visible:ring-2 focus-visible:ring-[#9C6F2E] focus-visible:outline-none"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M15 5L5 15M5 5l10 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto px-[24px] py-[20px]">
              {breakdownLoading ? (
                <div className="py-12 text-center text-sm text-[#8C8377]">
                  Loading breakdown…
                </div>
              ) : !breakdown ? (
                <div className="py-12 text-center text-sm text-[#8C3A2B]">
                  Could not load this payout&rsquo;s breakdown.
                </div>
              ) : (
                <>
                  <div className="mb-[18px]">
                    <div className="text-[15px] font-medium text-[#14110E]">
                      {breakdown.creator?.name || '—'}
                    </div>
                    <div className="text-[12px] text-[#5C544A]">
                      {breakdown.creator?.email}
                      {breakdown.creator?.code
                        ? ` · ${breakdown.creator.code}`
                        : ''}
                    </div>
                  </div>

                  <div className="mb-[22px] grid grid-cols-2 gap-[10px] sm:grid-cols-4">
                    {[
                      {
                        label: 'This payout',
                        value: money(breakdown.summary?.this_payout),
                        accent: 'text-[#9C6F2E]',
                      },
                      {
                        label: 'Total earned',
                        value: money(breakdown.summary?.total_earned),
                      },
                      {
                        label: 'Paid out',
                        value: money(breakdown.summary?.total_paid_out),
                      },
                      {
                        label: 'Available',
                        value: money(breakdown.summary?.available_balance),
                      },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-[12px] bg-[#F8F5EE] px-[14px] py-[12px]"
                      >
                        <div className="text-[11px] tracking-wide text-[#8C8377] uppercase">
                          {s.label}
                        </div>
                        <div
                          className={`mt-[4px] text-[15px] font-semibold ${s.accent || 'text-[#14110E]'}`}
                        >
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Flag any commission tied to a non-paid order */}
                  {(breakdown.orders || []).some(
                    (o: any) =>
                      o.order_status !== 'paid' &&
                      o.order_status !== 'completed',
                  ) && (
                    <div className="mb-[14px] rounded-[10px] border border-[#F2E1DB] bg-[#F2E1DB] px-[14px] py-[10px] text-[12px] text-[#8C3A2B]">
                      ⚠ Some commission below is tied to an order that is not in a
                      paid state — verify before sending this payout.
                    </div>
                  )}

                  <div className="mb-[8px] text-[12px] font-medium tracking-wide text-[#8C8377] uppercase">
                    Commission-earning orders ({breakdown.orders?.length || 0})
                  </div>
                  {breakdown.orders?.length ? (
                    <div className="overflow-x-auto rounded-[12px] border border-[#E2DBCC]">
                      <table className="min-w-full text-left text-[12px]">
                        <thead className="bg-[#F8F5EE]">
                          <tr>
                            <th className="px-[12px] py-[8px] font-medium text-[#8C8377]">
                              Order
                            </th>
                            <th className="px-[12px] py-[8px] font-medium text-[#8C8377]">
                              Date
                            </th>
                            <th className="px-[12px] py-[8px] font-medium text-[#8C8377]">
                              Order total
                            </th>
                            <th className="px-[12px] py-[8px] font-medium text-[#8C8377]">
                              Status
                            </th>
                            <th className="px-[12px] py-[8px] text-right font-medium text-[#8C8377]">
                              Commission
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {breakdown.orders.map((o: any, i: number) => {
                            const paid =
                              o.order_status === 'paid' ||
                              o.order_status === 'completed';
                            return (
                              <tr
                                key={i}
                                className="border-t border-[#E2DBCC]"
                              >
                                <td className="px-[12px] py-[10px] font-mono text-[#14110E]">
                                  #{shortId(o.order_id)}
                                </td>
                                <td className="px-[12px] py-[10px] text-[#3F3830]">
                                  {o.order_created_at
                                    ? formatDate(o.order_created_at)
                                    : formatDate(o.created_at)}
                                </td>
                                <td className="px-[12px] py-[10px] text-[#3F3830]">
                                  {o.order_total != null
                                    ? money(o.order_total)
                                    : '—'}
                                </td>
                                <td className="px-[12px] py-[10px]">
                                  <span
                                    className={`rounded-full px-[8px] py-[2px] text-[11px] font-medium ${
                                      paid
                                        ? 'bg-[#E4EDE3] text-[#3D6B4A]'
                                        : 'bg-[#F2E1DB] text-[#8C3A2B]'
                                    }`}
                                  >
                                    {(o.order_status || 'unknown').replace(
                                      '_',
                                      ' ',
                                    )}
                                  </span>
                                </td>
                                <td className="px-[12px] py-[10px] text-right font-semibold text-[#14110E]">
                                  {money(o.commission)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-[12px] border border-[#E2DBCC] py-8 text-center text-[13px] text-[#5C544A]">
                      No commission orders found for this creator.
                    </div>
                  )}

                  <p className="mt-[12px] text-[11px] leading-relaxed text-[#8C8377]">
                    Payouts draw from the creator&rsquo;s accumulated balance, so
                    a single payout isn&rsquo;t tied to one order — this is the
                    full earning history behind the balance.
                  </p>

                  {breakdown.prior_payouts?.length > 1 && (
                    <div className="mt-[18px]">
                      <div className="mb-[8px] text-[12px] font-medium tracking-wide text-[#8C8377] uppercase">
                        Payout history
                      </div>
                      <div className="space-y-[6px]">
                        {breakdown.prior_payouts.map((p: any, i: number) => (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded-[8px] bg-[#F8F5EE] px-[12px] py-[8px] text-[12px]"
                          >
                            <span className="text-[#3F3830]">
                              {formatDate(p.created_at)}
                            </span>
                            <span className="font-medium">{money(p.amount)}</span>
                            <span className="text-[#5C544A] capitalize">
                              {p.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </GridContainer>
  );
}
