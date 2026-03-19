'use client';

import GridContainer from '../gridContainer';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  AdminMoreVerticalIcon,
  AdminSoundLevelsIcon,
} from '@/components/icons';
import { updateOrderStatus } from './actions';
import { showToast } from '../toast';

type Order = {
  id: string;
  created_at: string;
  status: string;
  currency: string;
  total: number;
  user?: string;
  guest_email?: string;
};

interface OrdersPageProps {
  initialData: Order[];
  initialMeta: any;
  fetchServerData: (
    limit?: number,
    offset?: number,
    search?: string,
    status?: string,
    period?: string,
  ) => Promise<any>;
}

export default function OrdersPage({
  initialData,
  initialMeta,
  fetchServerData,
}: OrdersPageProps) {
  const [activeTab, setActiveTab] = useState('All');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(
    null,
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [orders, setOrders] = useState<Order[]>(initialData || []);
  const [pagination, setPagination] = useState(
    initialMeta?.pagination || { limit: 50, offset: 0, count: 0 },
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isFirstRender = useRef(true);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  const statusClasses: Record<string, string> = {
    created: 'bg-[#C0CBF2] text-[#0072BB] border border-[#C0CBF2] rounded-full',
    pending_payment: 'bg-[#F5F1CC] text-[#D8C732] border border-[#F5F1CC] rounded-full',
    paid: 'bg-[#CCEAD6] text-[#32AC5B] border border-[#CCEAD6] rounded-full',
    processing: 'bg-[#E8D5F5] text-[#7B2CBF] border border-[#E8D5F5] rounded-full',
    shipped: 'bg-[#D5E8F5] text-[#1A6FB5] border border-[#D5E8F5] rounded-full',
    delivered: 'bg-[#C2E6D3] text-[#1B7A3D] border border-[#C2E6D3] rounded-full',
    cancelled: 'bg-[#E5C6BF] text-[#991C00] border border-[#E5C6BF] rounded-full',
    refunded: 'bg-[#F0E0D6] text-[#8B5E3C] border border-[#F0E0D6] rounded-full',
    failed: 'bg-[#E5C6BF] text-[#991C00] border border-[#E5C6BF] rounded-full',
  };

  // Must match backend VALID_ORDER_TRANSITIONS
  const validTransitions: Record<string, string[]> = {
    created: ['pending_payment', 'cancelled'],
    pending_payment: ['paid', 'cancelled'],
    paid: ['processing', 'cancelled', 'refunded'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: ['refunded'],
    cancelled: [],
    refunded: [],
  };

  const [selectedPeriod, setSelectedPeriod] = useState('All Time');
  const periodOptions = ['All Time', 'Daily', 'Weekly', 'Monthly'];
  const tabs = [
    { id: 'All', label: 'All' },
    { id: 'paid', label: 'Paid' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipped', label: 'Shipped' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
      setActiveActionMenuId(null);
    }
    if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
      setIsDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

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
      setOrders(result.data);
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
      setOrders(result.data);
      setPagination(result.meta.pagination);
    }
    setIsLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString('en-US', {
      month: 'short',
    })} ${date.getFullYear()}`;
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(true);
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      if (result.success) {
        setActiveActionMenuId(null);
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order,
          ),
        );
        showToast('success', `Order marked as ${newStatus.replace('_', ' ')}`);
      } else {
        showToast('error', result.error || 'Failed to update order status');
      }
    } catch (error) {
      showToast('error', 'An error occurred while updating the order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const renderContent = () => {
    return (
      <>
        {isLoading && (
          <div className="py-4 text-center text-sm text-gray-500">
            Loading...
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-[13px]">
            <thead>
              <tr>
                <th scope="col" className="thead truncate">
                  User
                </th>
                <th scope="col" className="thead">
                  Total
                </th>
                <th scope="col" className="thead">
                  Order ID
                </th>
                <th scope="col" className="thead">
                  Date
                </th>
                <th scope="col" className="thead">
                  Status
                </th>
                <th scope="col" className="thead">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index, arr) => (
                <tr key={order.id}>
                  <td className="td">
                    {order.guest_email || order.user || 'Guest'}
                  </td>
                  <td className="td">
                    {order.currency} {order.total.toLocaleString()}
                  </td>
                  <td className="td">{order.id}</td>
                  <td className="td">{formatDate(order.created_at)}</td>
                  <td className="td">
                    <span
                      className={`px-2 py-1 capitalize ${statusClasses[order.status] || ''}`}
                    >
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="td">
                    <div ref={activeActionMenuId === order.id ? actionMenuRef : undefined} className="relative">
                      <button
                        onClick={() =>
                          setActiveActionMenuId(
                            activeActionMenuId === order.id ? null : order.id,
                          )
                        }
                        className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[6px] bg-[#F5F5F5] outline-none transition-colors duration-150 hover:bg-[#EBEBEB] focus-visible:ring-2 focus-visible:ring-[#0072BB] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isUpdating}
                        aria-label={`Actions for order ${order.id}`}
                        aria-expanded={activeActionMenuId === order.id}
                      >
                        <AdminMoreVerticalIcon />
                      </button>
                      {activeActionMenuId === order.id && (
                        <div
                          className={`ring-opacity-5 absolute right-0 z-[100] w-40 origin-top-right rounded-md bg-white text-sm shadow-md ring-1 ring-[#F5F5F5] focus:outline-none ${
                            index >= arr.length - 2
                              ? 'bottom-full mb-2'
                              : 'mt-2'
                          }`}
                        >
                          <div className="py-1">
                            {(validTransitions[order.status] || []).length > 0 ? (
                              (validTransitions[order.status] || []).map((status) => (
                                <button
                                  key={status}
                                  className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-gray-700 capitalize hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  onClick={() =>
                                    handleUpdateStatus(order.id, status)
                                  }
                                  disabled={isUpdating}
                                >
                                  Mark as {status.replace('_', ' ')}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-sm text-gray-400 italic">
                                No transitions available
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
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
          <span className="text-[20px] font-medium">Orders</span>
        </div>
      </div>

      <div className="relative">
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
            <div className="mb-4 flex w-full items-center justify-between gap-x-2 sm:w-auto">
              <input
                type="text"
                placeholder="Search orders..."
                aria-label="Search orders"
                className="h-[36px] w-full rounded-[10px] border-0 bg-[#F5F5F5] text-[12px] outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#0072BB] sm:w-[245px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <div ref={filterDropdownRef} className="relative z-20 flex items-center">
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
                  <div className="ring-opacity-6 absolute top-full right-0 z-[60] mt-2 w-32 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-gray-200">
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
        {orders.length > 0 ? (
          <div className="h-full rounded-b-[20px] bg-white px-[24px]">
            {renderContent()}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-b-[20px] bg-white px-[24px] py-[48px]">
            <p className="text-base font-medium text-gray-500">
              No orders found
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {searchQuery || activeTab !== 'All'
                ? 'Try adjusting your search or filters'
                : 'Orders will appear here once customers place them'}
            </p>
          </div>
        )}
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
    </GridContainer>
  );
}
