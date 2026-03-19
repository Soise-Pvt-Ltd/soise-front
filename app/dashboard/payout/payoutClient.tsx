'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import GridContainer from '../gridContainer';
import {
  AdminSoundLevelsIcon,
  AdminMoreHorizontalIcon,
  AdminSuccessCheckIcon,
} from '@/components/icons';
import { confirmPayout } from './actions';
import { showToast } from '../toast';

type PayoutStatus = 'requested' | 'completed' | 'failed';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [payouts, setPayouts] = useState<Payout[]>(initialData || []);
  const isFirstRender = useRef(true);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [pendingPayoutId, setPendingPayoutId] = useState<string | null>(null);

  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const periodOptions = ['All Time', 'Today', 'Last 7 Days', 'Last 30 Days'];
  const tabs = [
    { id: 'All', label: 'All' },
    { id: 'requested', label: 'Requested' },
    // { id: 'rejected', label: 'Rejected' },
  ];

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper function to format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Helper function to get full name
  const getFullName = (user: User) => {
    return `${user.first_name} ${user.last_name}`;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const completed = payouts.filter((p) => p.status === 'completed').length;
    const requested = payouts.filter((p) => p.status === 'requested').length;
    const failed = payouts.filter((p) => p.status === 'failed').length;

    return { completed, requested, failed };
  }, [payouts]);

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
    if (!showOtpModal) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowOtpModal(false);
        setPendingPayoutId(null);
        setOtpValue('');
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showOtpModal]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = setTimeout(() => {
      handleFilterChange();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, selectedPeriod]);

  const handleFilterChange = async () => {
    setIsLoading(true);
    const result = await fetchServerData(
      pagination.limit,
      0,
      searchQuery,
      activeTab,
      selectedPeriod,
    );
    if (result.success) {
      setPayouts(result.data);
      setPagination({ ...result.meta.pagination, offset: 0 });
    }
    setIsLoading(false);
  };

  const handlePageChange = async (newOffset: number) => {
    if (newOffset < 0 || newOffset >= pagination.count) return;
    setIsLoading(true);
    const result = await fetchServerData(
      pagination.limit,
      newOffset,
      searchQuery,
      activeTab,
      selectedPeriod,
    );
    if (result.success) {
      setPayouts(result.data);
      setPagination(result.meta.pagination);
    }
    setIsLoading(false);
  };

  const handleConfirmClick = (id: string) => {
    setPendingPayoutId(id);
    setOtpValue('');
    setShowOtpModal(true);
  };

  const handleOtpSubmit = async () => {
    if (!pendingPayoutId || !otpValue.trim()) return;
    setShowOtpModal(false);
    setProcessingId(pendingPayoutId);
    try {
      const result = await confirmPayout(pendingPayoutId, otpValue.trim());
      if (result.success) {
        showToast('success', 'Payout confirmed successfully');
        handleFilterChange();
      } else {
        showToast('error', `Failed to confirm payout: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      showToast('error', 'An error occurred while confirming the payout');
    } finally {
      setProcessingId(null);
      setPendingPayoutId(null);
    }
  };

  const renderActionButtons = (payout: Payout) => {
    switch (payout.status) {
      case 'requested':
        return (
          <div className="flex items-center gap-x-2">
            <button
              onClick={() => handleConfirmClick(payout.id)}
              disabled={processingId === payout.id}
              className="flex h-[30px] w-[90px] items-center justify-center gap-x-[2px] rounded-[6px] border border-[#AEAEB2] p-[6px] font-medium disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processingId === payout.id ? (
                'Confirming...'
              ) : (
                <>
                  <AdminSuccessCheckIcon />
                  Confirm
                </>
              )}
            </button>
          </div>
        );
      case 'completed':
        return (
          <button className="flex h-[30px] items-center gap-x-[2px] rounded-full border border-[#CCEAD6] bg-[#CCEAD6] p-[6px] !pr-[8px] font-medium text-[#32AC5B]">
            <AdminSuccessCheckIcon />
            Completed
          </button>
        );
      case 'failed':
        return (
          <span className="rounded-full border border-[#E5C6BF] bg-[#E5C6BF] px-3 py-1 text-xs font-medium text-[#991C00]">
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
          <p className="text-base font-medium text-gray-500">No payouts found</p>
          <p className="mt-1 text-sm text-gray-400">
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
          <div className="py-4 text-center text-sm text-gray-500">
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
                <tr key={payout.id}>
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
                  <td className="td">{renderActionButtons(payout)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <GridContainer>
      <div className="px-[16px]">
        <div className="py-[22px]">
          <span className="text-[20px] font-medium">Payout</span>
        </div>
      </div>

      {/* 1st layer */}
      <div className="mb-[25px]">
        <div className="rounded-[20px] bg-white px-[30px] py-[30px] text-[#121212]">
          <div className="grid grid-cols-1 divide-y divide-gray-200 md:grid-cols-2 md:divide-x md:divide-y-0">
            <div className="space-y-[16px] py-4 md:py-0 md:pr-6">
              <div className="flex items-center justify-between">
                <div className="text-[14px] text-[#AFB1B0]">Confirmed</div>
                <AdminMoreHorizontalIcon color="#35373C" />
              </div>
              <div className="text-[22px] font-medium">{stats.completed}</div>
              <div className="text-[14px] text-[#0072BB]">Total completed</div>
            </div>
            <div className="space-y-[16px] py-4 md:px-6 md:py-0">
              <div className="flex items-center justify-between">
                <div className="text-[14px] text-[#AFB1B0]">Requested</div>
                <AdminMoreHorizontalIcon color="#35373C" />
              </div>
              <div className="text-[22px] font-medium">{stats.requested}</div>
              <div className="text-[14px] text-[#991C00]">
                Pending confirmation
              </div>
            </div>
            {/* <div className="space-y-[16px] py-4 md:py-0 md:pl-6">
              <div className="flex items-center justify-between">
                <div className="text-[14px] text-[#AFB1B0]">Rejected</div>
                <AdminMoreHorizontalIcon color="#35373C" />
              </div>
              <div className="text-[22px] font-medium">{stats.rejected}</div>
              <div className="text-[14px] text-[#AFB1B0]">Total rejected</div>
            </div> */}
          </div>
        </div>
      </div>

      {/* 2nd layer */}
      <div className="">
        <div className="rounded-t-[20px] border-b border-[#AEAEB266]/40 bg-white px-[24px] pt-[24px] text-[#121212]">
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
                        ? 'text-gray-900'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <span className="absolute top-full left-0 z-10 h-[2px] w-full translate-y-[-2px] rounded-t-sm bg-gray-900 sm:translate-y-[5px]" />
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
                  className="h-[36px] w-full rounded-[10px] border-0 bg-[#F5F5F5] text-[12px] outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#0072BB] md:w-[245px]"
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
                  <div className="ring-opacity-6 absolute top-full right-0 z-10 -mt-2 w-32 origin-top-right rounded-md bg-white ring-1 ring-gray-200">
                    <div className="py-1">
                      {periodOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setSelectedPeriod(option);
                            setIsDropdownOpen(false);
                          }}
                          className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-[#AFB1B0] hover:bg-gray-100 hover:text-gray-400"
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
        <div className="rounded-b-[20px] bg-white px-[24px]">
          {renderContent()}
        </div>
        {/* Pagination Controls */}
        {pagination.count > 0 && (
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() =>
                  handlePageChange(pagination.offset - pagination.limit)
                }
                disabled={pagination.offset === 0 || isLoading}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  handlePageChange(pagination.offset + pagination.limit)
                }
                disabled={
                  pagination.offset + pagination.limit >= pagination.count ||
                  isLoading
                }
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{pagination.offset + 1}</span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(
                      pagination.offset + pagination.limit,
                      pagination.count,
                    )}
                  </span>{' '}
                  of <span className="font-medium">{pagination.count}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-md shadow-xs"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() =>
                      handlePageChange(pagination.offset - pagination.limit)
                    }
                    disabled={pagination.offset === 0 || isLoading}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
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
                        pagination.count || isLoading
                    }
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
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

      {showOtpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="otp-modal-title"
        >
          <div className="w-full max-w-sm rounded-[20px] bg-white p-[24px] shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="otp-modal-title" className="text-lg font-medium">Confirm Payout</h2>
              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setPendingPayoutId(null);
                  setOtpValue('');
                }}
                className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-[#0072BB] focus-visible:outline-none"
                aria-label="Close dialog"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <p className="mb-4 text-sm text-[#8E8E93]">
              Enter the OTP sent to your Paystack-registered device to finalize this transfer.
            </p>
            <input
              type="text"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value)}
              placeholder="Enter OTP"
              className="mb-4 w-full rounded-[10px] border border-gray-200 px-4 py-3 text-sm focus:border-[#0072BB] focus:ring-1 focus:ring-[#0072BB] focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && otpValue.trim()) handleOtpSubmit();
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setPendingPayoutId(null);
                  setOtpValue('');
                }}
                className="flex-1 rounded-[10px] border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleOtpSubmit}
                disabled={!otpValue.trim()}
                className="flex-1 rounded-[10px] bg-[#0072BB] px-4 py-2 text-sm font-medium text-white hover:bg-[#005A94] disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </GridContainer>
  );
}
