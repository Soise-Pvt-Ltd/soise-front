'use client';

import GridContainer from '../gridContainer';
import { PageHeader, StatusBadge } from '../ui';
import RowActionMenu from '@/components/admin/RowActionMenu';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AdminMoreVerticalIcon,
  AdminSoundLevelsIcon,
} from '@/components/icons';
import { updateOrderStatus, deleteOrder, ShipmentDetails } from './actions';
import { showToast } from '../toast';
import { totalRows } from '@/lib/pagination';
import { formatDate, todayIso } from '@/lib/admin-datetime';
import { VALID_ORDER_TRANSITIONS } from '@/lib/order-transitions';

type Order = {
  id: string;
  order_number?: number;
  created_at: string;
  status: string;
  currency: string;
  total: number;
  user?: string;
  guest_email?: string;
  customer_first_name?: string;
  customer_last_name?: string;
  customer_email?: string;
  item_count?: number;
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
  // Deleting is irreversible and sits in the same menu as the routine status
  // changes, so it goes behind an explicit confirm naming the order.
  const [pendingDeleteOrder, setPendingDeleteOrder] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(
    null,
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [orders, setOrders] = useState<Order[]>(initialData || []);
  const [pagination, setPagination] = useState(
    initialMeta?.pagination || { limit: 50, offset: 0, count: 0 },
  );
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') ?? '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [isLoading, setIsLoading] = useState(false);
  const fetchIdRef = useRef(0);
  const lastFetchRef = useRef({
    search: initialSearch,
    status: 'All',
    period: 'All Time',
    hasFetched: (initialData?.length ?? 0) > 0,
  });
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // "Shipped" needs real tracking info before the customer email goes out --
  // previously there was no prompt at all, so every shipped-order email sent
  // with placeholder N/A tracking data and a dead "#" tracking link.
  const [shippingModalOrder, setShippingModalOrder] = useState<Order | null>(
    null,
  );
  const [shipmentForm, setShipmentForm] = useState<ShipmentDetails>({
    tracking_number: '',
    carrier: '',
    estimated_delivery: '',
    tracking_url: '',
  });
  const COMMON_CARRIERS = ['GIG Logistics', 'Kwik', 'ShipBubble', 'DHL Express'];

  // "Delivered" needs an actual date -- this used to have no prompt at all,
  // so the delivered-order email always defaulted to the literal string
  // "Today" regardless of when delivery actually happened.
  const [deliveredModalOrder, setDeliveredModalOrder] = useState<Order | null>(
    null,
  );
  const [deliveredDate, setDeliveredDate] = useState(todayIso());

  // Status colours moved to the suite-wide STATUS_TONE map in ../ui, so an
  // order reads the same here as on the overview and in a payout row.

  // Shared with the home dashboard's quick-action menu so the two screens
  // can't drift apart again. Mirrors backend VALID_ORDER_TRANSITIONS.
  const validTransitions = VALID_ORDER_TRANSITIONS;

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
      setOrders(result.data);
      setPagination({ ...result.meta.pagination, offset: 0 });
    } else {
      // Without this the spinner simply stops and the previous rows stay on
      // screen under the newly-selected tab, so a failed refetch is
      // indistinguishable from a filter that returned those rows.
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
      setOrders(result.data);
      setPagination(result.meta.pagination);
    } else {
      showToast('error', 'Could not load that page. Please try again.');
    }
    setIsLoading(false);
  };

  // formatDate/todayIso come from lib/admin-datetime — getDate()/getFullYear()
  // read the ambient timezone, so an order placed late in the day rendered one
  // date on the server and another in the browser.

  const customerName = (o: Order) => {
    const name = `${o.customer_first_name ?? ''} ${o.customer_last_name ?? ''}`.trim();
    if (name) return name;
    return o.user ? 'Registered customer' : 'Guest';
  };
  const customerEmail = (o: Order) => o.customer_email || o.guest_email || '—';
  const shortRef = (order: Order) =>
    order.order_number != null
      ? String(order.order_number).padStart(4, '0')
      : (String(order.id ?? '').split(':').pop() ?? order.id);
  const copyRef = async (o: Order) => {
    try {
      await navigator.clipboard.writeText(shortRef(o));
      showToast('success', 'Order ID copied');
    } catch {
      showToast('error', 'Could not copy');
    }
  };
  const initials = (o: Order) =>
    (
      (o.customer_first_name?.[0] ?? '') + (o.customer_last_name?.[0] ?? '') ||
      (o.customer_email || o.guest_email || 'G')[0]
    ).toUpperCase();

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: string,
    shipmentDetails?: ShipmentDetails,
  ) => {
    setIsUpdating(true);
    try {
      const result = await updateOrderStatus(orderId, newStatus, shipmentDetails);
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

  const handleShipmentSubmit = async () => {
    if (!shippingModalOrder) return;
    if (!shipmentForm.tracking_number?.trim() || !shipmentForm.carrier?.trim()) {
      showToast('error', 'Tracking number and carrier are required');
      return;
    }
    await handleUpdateStatus(shippingModalOrder.id, 'shipped', {
      tracking_number: shipmentForm.tracking_number.trim(),
      carrier: shipmentForm.carrier.trim(),
      estimated_delivery: shipmentForm.estimated_delivery?.trim() || undefined,
      tracking_url: shipmentForm.tracking_url?.trim() || undefined,
    });
    setShippingModalOrder(null);
    setShipmentForm({
      tracking_number: '',
      carrier: '',
      estimated_delivery: '',
      tracking_url: '',
    });
  };

  const handleDeliveredSubmit = async () => {
    if (!deliveredModalOrder) return;
    await handleUpdateStatus(deliveredModalOrder.id, 'delivered', {
      delivered_date: deliveredDate,
    });
    setDeliveredModalOrder(null);
    setDeliveredDate(todayIso());
  };

  const handleMarkStatusClick = (order: Order, status: string) => {
    if (status === 'shipped') {
      setShippingModalOrder(order);
      setActiveActionMenuId(null);
    } else if (status === 'delivered') {
      setDeliveredModalOrder(order);
      setDeliveredDate(todayIso());
      setActiveActionMenuId(null);
    } else {
      handleUpdateStatus(order.id, status);
    }
  };

  const renderContent = () => {
    return (
      <>
        {isLoading && (
          <div className="py-4 text-center text-sm text-[#8C8377]">
            Loading...
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-[13px]">
            <thead>
              <tr>
                <th scope="col" className="thead">
                  Customer
                </th>
                <th scope="col" className="thead">
                  Order #
                </th>
                <th scope="col" className="thead">
                  Items
                </th>
                <th scope="col" className="thead">
                  Total
                </th>
                <th scope="col" className="thead">
                  Status
                </th>
                <th scope="col" className="thead">
                  Date
                </th>
                <th scope="col" className="thead">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index, arr) => (
                <tr key={order.id} className="suite-row">
                  <td className="td">
                    <div className="flex items-center gap-x-[10px]">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#E2DBCC] text-[11px] font-semibold text-[#14110E]">
                        {initials(order)}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-[#14110E]">
                          {customerName(order)}
                        </div>
                        <div className="truncate text-[11px] text-[#8C8377]">
                          {customerEmail(order)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <button
                      onClick={() => copyRef(order)}
                      title="Copy full order ID"
                      className="rounded-[6px] bg-[#EFEBE1] px-[8px] py-[3px] font-mono text-[12px] text-[#14110E] transition-colors hover:bg-[#E2DBCC]"
                    >
                      #{shortRef(order)}
                    </button>
                  </td>
                  <td className="td">{order.item_count ?? 0}</td>
                  <td className="td font-medium">
                    {order.currency === 'NGN' ? '₦' : `${order.currency} `}
                    {Number(order.total).toLocaleString()}
                  </td>
                  <td className="td">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="td whitespace-nowrap">
                    {order.created_at ? formatDate(order.created_at) : '—'}
                  </td>
                  <td className="td">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          const next =
                            activeActionMenuId === order.id ? null : order.id;
                          setMenuAnchorEl(next ? e.currentTarget : null);
                          setActiveActionMenuId(next);
                        }}
                        className="flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[6px] bg-[#EFEBE1] outline-none transition-colors duration-150 hover:bg-[#E2DBCC] focus-visible:ring-2 focus-visible:ring-[#9C6F2E] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isUpdating}
                        aria-label={`Actions for order ${order.id}`}
                        aria-expanded={activeActionMenuId === order.id}
                      >
                        <AdminMoreVerticalIcon />
                      </button>
                      <RowActionMenu
                        open={activeActionMenuId === order.id}
                        onClose={() => {
                          setActiveActionMenuId(null);
                          setMenuAnchorEl(null);
                        }}
                        anchorEl={menuAnchorEl}
                        widthClass="w-40"
                      >
                        {(validTransitions[order.status] || []).length > 0 ? (
                          (validTransitions[order.status] || []).map((status) => (
                            <button
                              key={status}
                              className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-[#3F3830] capitalize hover:bg-[#EFEAE0] disabled:cursor-not-allowed disabled:opacity-50"
                              onClick={() => handleMarkStatusClick(order, status)}
                              disabled={isUpdating}
                            >
                              Mark as {status.replace('_', ' ')}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-[#8C8377] italic">
                            No transitions available
                          </div>
                        )}
                        <div className="my-1 h-px bg-[#E2DBCC]" />
                        <button
                          className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-[#8C3A2B] hover:bg-[#F8EDE8] disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={() => {
                            setActiveActionMenuId(null);
                            setMenuAnchorEl(null);
                            setPendingDeleteOrder(order);
                          }}
                          disabled={isUpdating}
                        >
                          Delete order
                        </button>
                      </RowActionMenu>
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

  const confirmDelete = async () => {
    if (!pendingDeleteOrder || deleting) return;
    setDeleting(true);
    const result = await deleteOrder(pendingDeleteOrder.id);
    setDeleting(false);
    if (result.success) {
      setOrders((prev) => prev.filter((o) => o.id !== pendingDeleteOrder.id));
      setPendingDeleteOrder(null);
      showToast('success', 'Order deleted');
    } else {
      showToast('error', result.error || 'Could not delete the order.');
    }
  };

  return (
    <GridContainer>
      {pendingDeleteOrder && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-order-title"
          className="fixed inset-0 z-50 grid place-items-center bg-[#0E0E10]/55 px-4"
          onClick={() => !deleting && setPendingDeleteOrder(null)}
        >
          <div
            className="w-full max-w-[420px] rounded-[14px] bg-[#FBF9F4] p-[24px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-order-title" className="suite-display text-[19px] text-[#14110E]">
              Delete order #{pendingDeleteOrder.order_number ?? ''}?
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#5C544A]">
              This permanently removes the order, its items and its payment
              records. It cannot be undone.
            </p>
            {/* A real order should be cancelled, not erased — cancelling keeps
                the record and the customer's history. Say so here rather than
                relying on the admin to know the difference. */}
            <p className="mt-2 text-[13px] leading-relaxed text-[#8A6218]">
              If this is a real customer order, cancel it instead — that keeps
              the record.
            </p>
            <div className="mt-[20px] flex justify-end gap-x-3">
              <button
                type="button"
                onClick={() => setPendingDeleteOrder(null)}
                disabled={deleting}
                className="cursor-pointer rounded-[10px] border border-[#DFD7C6] px-[16px] py-[9px] text-[13px] disabled:opacity-50"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="cursor-pointer rounded-full bg-[#8C3A2B] px-[16px] py-[9px] text-[13px] font-medium text-[#F4F1EA] disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
      <PageHeader
        eyebrow="The house"
        title="Orders"
        description="Every order the store has taken, from the moment a bag was filled to the moment it shipped."
      />

      <div className="relative">
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
            <div className="mb-4 flex w-full items-center justify-between gap-x-2 sm:w-auto">
              <input
                type="text"
                placeholder="Search order ID, customer or email…"
                aria-label="Search orders by ID, customer name or email"
                className="h-[36px] w-full rounded-full border border-[#DFD7C6] bg-[#EFEBE1] text-[#14110E] placeholder:text-[#8C8377] px-3 text-[12px] outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#9C6F2E] sm:w-[290px]"
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
                  <div className="absolute top-full right-0 z-[60] mt-2 w-32 origin-top-right rounded-[10px] border border-[#E2DBCC] bg-[#FBF9F4] shadow-[0_18px_40px_-20px_rgba(20,17,14,0.35)]">
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
        {orders.length > 0 ? (
          <div className="h-full rounded-b-[14px] border border-t-0 border-[#E2DBCC] bg-[#FBF9F4] px-[24px]">
            {renderContent()}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-b-[14px] border border-t-0 border-[#E2DBCC] bg-[#FBF9F4] px-[24px] py-[48px]">
            <p className="suite-display text-[18px] text-[#14110E]">
              No orders found
            </p>
            <p className="mt-2 max-w-[340px] text-[13px] leading-relaxed text-[#8C8377]">
              {searchQuery || activeTab !== 'All'
                ? 'Try adjusting your search or filters'
                : 'Orders will appear here once customers place them'}
            </p>
          </div>
        )}
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

      {shippingModalOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0E0E10]/55 px-4">
          <div className="w-full max-w-[420px] rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4] p-6 shadow-[0_30px_80px_-30px_rgba(20,17,14,0.5)]">
            <h3 className="text-[16px] font-semibold text-[#14110E]">
              Shipment details
            </h3>
            <p className="mt-1 text-[13px] text-[#5C544A]">
              Order #{shortRef(shippingModalOrder)} — this goes straight
              into the customer&apos;s shipped-order email.
            </p>

            <div className="mt-5 flex flex-col gap-y-4">
              <div>
                <label className="text-[12px] font-medium text-[#5C544A]">
                  Tracking number *
                </label>
                <input
                  type="text"
                  value={shipmentForm.tracking_number}
                  onChange={(e) =>
                    setShipmentForm({ ...shipmentForm, tracking_number: e.target.value })
                  }
                  className="mt-1 w-full rounded-[8px] border border-[#DFD7C6] px-3 py-2 text-[14px] outline-none focus:border-[#14110E]"
                  placeholder="e.g. GIG123456789"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#5C544A]">
                  Carrier *
                </label>
                <input
                  type="text"
                  list="carrier-options"
                  value={shipmentForm.carrier}
                  onChange={(e) =>
                    setShipmentForm({ ...shipmentForm, carrier: e.target.value })
                  }
                  className="mt-1 w-full rounded-[8px] border border-[#DFD7C6] px-3 py-2 text-[14px] outline-none focus:border-[#14110E]"
                  placeholder="e.g. GIG Logistics"
                />
                <datalist id="carrier-options">
                  {COMMON_CARRIERS.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#5C544A]">
                  Estimated delivery
                </label>
                <input
                  type="text"
                  value={shipmentForm.estimated_delivery}
                  onChange={(e) =>
                    setShipmentForm({ ...shipmentForm, estimated_delivery: e.target.value })
                  }
                  className="mt-1 w-full rounded-[8px] border border-[#DFD7C6] px-3 py-2 text-[14px] outline-none focus:border-[#14110E]"
                  placeholder="e.g. 2-3 business days"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#5C544A]">
                  Tracking link
                </label>
                <input
                  type="text"
                  value={shipmentForm.tracking_url}
                  onChange={(e) =>
                    setShipmentForm({ ...shipmentForm, tracking_url: e.target.value })
                  }
                  className="mt-1 w-full rounded-[8px] border border-[#DFD7C6] px-3 py-2 text-[14px] outline-none focus:border-[#14110E]"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-x-3">
              <button
                onClick={() => setShippingModalOrder(null)}
                className="rounded-[8px] px-4 py-2 text-[14px] font-medium text-[#5C544A] hover:bg-[#EFEAE0]"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleShipmentSubmit}
                className="rounded-full bg-[#14110E] px-4 py-2 text-[14px] font-medium text-[#F4F1EA] hover:bg-[#241F19] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isUpdating}
              >
                {isUpdating ? 'Marking as shipped…' : 'Mark as shipped'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deliveredModalOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0E0E10]/55 px-4">
          <div className="w-full max-w-[420px] rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4] p-6 shadow-[0_30px_80px_-30px_rgba(20,17,14,0.5)]">
            <h3 className="text-[16px] font-semibold text-[#14110E]">
              Delivery date
            </h3>
            <p className="mt-1 text-[13px] text-[#5C544A]">
              Order #{shortRef(deliveredModalOrder)} — this goes straight
              into the customer&apos;s delivered-order email.
            </p>

            <div className="mt-5">
              <label className="text-[12px] font-medium text-[#5C544A]">
                Delivered on *
              </label>
              <input
                type="date"
                value={deliveredDate}
                max={todayIso()}
                onChange={(e) => setDeliveredDate(e.target.value)}
                className="mt-1 w-full rounded-[8px] border border-[#DFD7C6] px-3 py-2 text-[14px] outline-none focus:border-[#14110E]"
              />
            </div>

            <div className="mt-6 flex justify-end gap-x-3">
              <button
                onClick={() => setDeliveredModalOrder(null)}
                className="rounded-[8px] px-4 py-2 text-[14px] font-medium text-[#5C544A] hover:bg-[#EFEAE0]"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleDeliveredSubmit}
                className="rounded-full bg-[#14110E] px-4 py-2 text-[14px] font-medium text-[#F4F1EA] hover:bg-[#241F19] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isUpdating || !deliveredDate}
              >
                {isUpdating ? 'Marking as delivered…' : 'Mark as delivered'}
              </button>
            </div>
          </div>
        </div>
      )}
    </GridContainer>
  );
}
