'use client';

import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  ChartOptions,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useRouter } from 'next/navigation';
import GridContainer from '../gridContainer';
import OrderActionsMenu from './OrderActionsMenu';
import FunnelCard from './FunnelCard';
import StatCardMenu from './StatCardMenu';
import {
  PageHeader,
  Panel,
  StatTile,
  StatusBadge,
  EmptyState,
  SearchInput,
} from '../ui';
import { formatTime, currentMonthIndex } from '@/lib/admin-datetime';

// The doughnut ("Visitors") was commented out of the markup long ago; its
// ArcElement registration and config went with it.
ChartJS.register(Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const getCount = (val: any) => {
  if (typeof val === 'object' && val !== null && 'count' in val) {
    return val.count;
  }
  return val;
};

type HomeClientProps = {
  data: any;
  /** The dashboard fetch failed — the zeros below are placeholders, not facts. */
  loadFailed?: boolean;
  /** Cart-to-purchase funnel; null when unavailable. */
  funnel?: any;
};

export default function HomeClient({
  data: rawData,
  loadFailed = false,
  funnel = null,
}: HomeClientProps) {
  // Normalize the payload to a guaranteed shape so a missing/partial/error
  // response from the backend can never crash the admin dashboard.
  const d = rawData && typeof rawData === 'object' ? rawData : {};
  const data = {
    ...d,
    revenue: { total: 0, percentage_change: 0, ...(d.revenue || {}) },
    payout: { total: 0, percentage_change: 0, ...(d.payout || {}) },
    products: { total: 0, active: 0, ...(d.products || {}) },
    items_sold: {
      current_month: 0,
      current_week: 0,
      current_year: 0,
      percentage_change: 0,
      ...(d.items_sold || {}),
    },
    users: { total: 0, new_this_month: 0, creators: 0, ...(d.users || {}) },
    monthly_sales: Array.isArray(d.monthly_sales) ? d.monthly_sales : [],
    latest_orders: Array.isArray(d.latest_orders) ? d.latest_orders : [],
    top_products: Array.isArray(d.top_products) ? d.top_products : [],
  };

  const [itemsPeriod, setItemsPeriod] = useState<'week' | 'month' | 'year'>(
    'month',
  );

  const barLabels = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const monthIndex = currentMonthIndex();
  // Gold for the year, ink for the month we're standing in.
  const defaultBarColor = 'rgba(156, 111, 46, 0.30)';
  const currentMonthBarColor = 'rgba(20, 17, 14, 0.92)';

  // Create sales data array with zeros, then fill in the months we have data for
  const salesByMonth = Array(12).fill(0);
  data.monthly_sales.forEach((item: any) => {
    // Month is 1-indexed in the data, convert to 0-indexed
    if (item.month >= 1 && item.month <= 12) {
      salesByMonth[item.month - 1] = item.sales;
    }
  });

  const barBackgroundColors = barLabels.map((_, index) => {
    return index === monthIndex ? currentMonthBarColor : defaultBarColor;
  });

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: '',
        data: salesByMonth,
        backgroundColor: barBackgroundColors,
        barPercentage: 0.8,
        categoryPercentage: 1.1,
        borderRadius: 5,
      },
    ],
  };

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#14110E',
        titleColor: '#F4F1EA',
        bodyColor: '#C4AA6E',
        cornerRadius: 8,
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      y: { display: false },
      x: {
        grid: { display: false },
        border: { color: '#E2DBCC' },
        // Month labels are supporting information, not the chart — set in the
        // same faint uppercase key as every other label in the suite.
        ticks: {
          color: '#8C8377',
          font: { size: 10 },
        },
      },
    },
  };

  // formatTime/currentMonthIndex come from lib/admin-datetime: reading the
  // ambient timezone here rendered UTC on the server and local time in the
  // browser, which is the hydration mismatch (#418) this page was throwing.

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const router = useRouter();

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  // Trend badge — shows "New" when there is current-period activity but no
  // prior-period baseline (where a percentage would be a misleading +0.0%).
  const trendBadge = (
    metric: { percentage_change: number; is_new?: boolean },
    variant: 'onDark' | 'onLight',
  ) => {
    if (metric?.is_new) {
      return (
        <span
          className={`suite-badge ${
            variant === 'onDark'
              ? 'bg-[#C4AA6E]/15 text-[#C4AA6E]'
              : 'bg-[#E4EDE3] text-[#3D6B4A]'
          }`}
        >
          New
        </span>
      );
    }
    const pos = (metric?.percentage_change ?? 0) >= 0;
    const cls =
      variant === 'onDark'
        ? pos
          ? 'bg-[#C4AA6E]/15 text-[#C4AA6E]'
          : 'bg-[#F2E1DB]/15 text-[#D9A79B]'
        : pos
          ? 'bg-[#E4EDE3] text-[#3D6B4A]'
          : 'bg-[#F2E1DB] text-[#8C3A2B]';
    return (
      <span className={`suite-badge ${cls}`}>
        {formatPercentage(metric?.percentage_change ?? 0)}
      </span>
    );
  };

  return (
    <GridContainer>
      <main className="!text-[#3F3830]" role="main">
        <PageHeader
          eyebrow="The house"
          title="Overview"
          description="Where the drop stands today — what came in, what goes out, and what the culture is actually buying."
        />

        {/* Without this an unreachable backend renders a fully-populated
            dashboard reading zero revenue, zero products and "no recent
            orders" — identical to a store that has never sold anything. */}
        {loadFailed && (
          <div
            role="alert"
            className="mb-6 flex flex-col gap-y-3 rounded-[14px] border border-[#E2DBCC] border-l-2 border-l-[#8C3A2B] bg-[#F8EDE8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="suite-display text-[17px] text-[#8C3A2B]">
                Couldn&apos;t load dashboard data
              </div>
              <div className="mt-1 text-[13px] text-[#5C544A]">
                The figures below are placeholders, not real numbers. Nothing
                has been lost.
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="suite-btn-danger shrink-0 !text-[12px]"
            >
              Try again
            </button>
          </div>
        )}

        {/* Revenue carries the ink treatment — /about alternates light and dark
            to mark what matters, and here exactly one number does. */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatTile
            tone="ink"
            label="Total revenue"
            value={formatCurrency(data.revenue.total)}
            meta={trendBadge(data.revenue, 'onDark')}
            action={
              <StatCardMenu
                color="#C4AA6E"
                ariaLabel="Revenue options"
                items={[
                  { label: 'View all orders', href: '/dashboard/orders' },
                  { label: 'View payouts', href: '/dashboard/payout' },
                  { label: 'Refresh data', onClick: () => router.refresh() },
                ]}
              />
            }
          />

          <StatTile
            label="Payout"
            value={formatCurrency(data.payout.total)}
            meta={trendBadge(data.payout, 'onLight')}
            action={
              <StatCardMenu
                color="#14110E"
                ariaLabel="Payout options"
                items={[
                  { label: 'Manage payouts', href: '/dashboard/payout' },
                  { label: 'Refresh data', onClick: () => router.refresh() },
                ]}
              />
            }
          />

          <StatTile
            label="Total products"
            value={getCount(data.products.total)}
            meta={
              <span className="text-[12px] text-[#8C8377]">
                {getCount(data.products.active)} active
              </span>
            }
            action={
              <StatCardMenu
                color="#14110E"
                ariaLabel="Products options"
                items={[
                  { label: 'Manage products', href: '/dashboard/products' },
                  { label: 'Refresh data', onClick: () => router.refresh() },
                ]}
              />
            }
          />

          <StatTile
            label="Items sold"
            value={getCount(
              itemsPeriod === 'week'
                ? data.items_sold.current_week
                : itemsPeriod === 'year'
                  ? data.items_sold.current_year
                  : data.items_sold.current_month,
            )}
            meta={
              /* This select had no value, no onChange and no state behind it —
                 it rendered the 30-day figure whichever period was chosen. */
              <select
                value={itemsPeriod}
                onChange={(e) =>
                  setItemsPeriod(e.target.value as 'week' | 'month' | 'year')
                }
                aria-label="Items sold period"
                className="h-[30px] cursor-pointer rounded-full border border-[#DFD7C6] bg-transparent py-0 pr-7 pl-3 text-[11px] tracking-[0.1em] text-[#5C544A] uppercase transition-colors outline-none hover:border-[#9C6F2E] focus:border-[#9C6F2E] focus:ring-0"
              >
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            }
            action={
              <StatCardMenu
                color="#14110E"
                ariaLabel="Items sold options"
                items={[
                  { label: 'View all orders', href: '/dashboard/orders' },
                  { label: 'Refresh data', onClick: () => router.refresh() },
                ]}
              />
            }
          />
        </div>

        <FunnelCard funnel={funnel} />

        {/* Second layer — sales over the year */}
        <div className="mt-6">
          <Panel eyebrow="Sales statistics" title={formatCurrency(data.revenue.total)}>
            <div className="scrollbar-hide overflow-x-auto pt-2">
              <Bar data={barData} options={barOptions} />
            </div>
          </Panel>
        </div>

        {/* Third layer */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-5">
          <Panel
            eyebrow="Just in"
            title="Latest orders"
            className="!h-fit md:col-span-2"
            bodyClassName="!px-0"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[300px] text-left text-[13px]">
                {data.latest_orders.length > 0 && (
                  <thead>
                    <tr className="border-b border-[#E2DBCC]">
                      <th className="thead pl-6">Customer</th>
                      <th className="thead">Status</th>
                      <th className="thead">Time</th>
                      <th className="thead pr-6"></th>
                    </tr>
                  </thead>
                )}
                <tbody>
                  {data.latest_orders.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState
                          title="No recent orders"
                          hint="Orders will appear here once customers place them."
                        />
                      </td>
                    </tr>
                  ) : (
                    data.latest_orders.map((order: any) => (
                      <tr key={order.id} className="suite-row">
                        <td className="py-4 pl-6 text-wrap text-[#3F3830]">
                          {order.customer_name || 'Guest'}
                        </td>
                        <td className="py-4">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="py-4 text-[#5C544A]">
                          {formatTime(order.created_at)}
                        </td>
                        <td className="py-4 pr-6 text-right">
                          <OrderActionsMenu
                            orderId={order.id}
                            status={order.status}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
          <div className="md:col-span-3">
            <AllProductsTable products={data.top_products} />
          </div>
        </div>
      </main>
    </GridContainer>
  );
}

const AllProductsTable = ({ products }: { products: any[] }) => {
  const [globalFilter, setGlobalFilter] = useState('');

  const filteredProducts = products.filter((product) =>
    (product.product_name || '')
      .toLowerCase()
      .includes(globalFilter.toLowerCase()),
  );

  const formatCurrency = (amount: number | null) => {
    // A product with no revenue has sold nothing — that is zero, a real and
    // useful figure on a "top products" table. 'N/A' read as broken data and
    // made the column impossible to scan against its neighbours.
    if (amount === null) return '₦0.00';
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Panel
      eyebrow="Worn most"
      title="Top products"
      className="!h-fit"
      bodyClassName="!px-0"
      actions={
        <SearchInput
          value={globalFilter}
          onChange={setGlobalFilter}
          placeholder="Search products…"
          label="Search top products"
          className="!h-[36px] !max-w-[220px] !text-[12px]"
        />
      }
    >
      <div className="scrollbar-hide overflow-x-auto">
        <table
          className="w-full min-w-[600px] text-left text-[13px]"
          aria-label="Top Products"
        >
          {filteredProducts.length > 0 && (
            <thead>
              <tr className="border-b border-[#E2DBCC]">
                <th className="thead pl-6" scope="col">
                  Product
                </th>
                <th className="thead" scope="col">
                  Price
                </th>
                <th className="thead" scope="col">
                  Total sales
                </th>
                <th className="thead pr-6" scope="col">
                  Revenue
                </th>
              </tr>
            </thead>
          )}
          <tbody>
            {filteredProducts.map((product, index) => (
              <tr key={product.product_id || index} className="suite-row">
                <td className="py-4 pr-3 pl-6">
                  <div className="flex items-center gap-x-3">
                    {product.product_image && (
                      <img
                        src={product.product_image}
                        alt={product.product_name || 'Product'}
                        className="h-10 w-10 rounded-[6px] object-cover"
                      />
                    )}
                    <span className="text-[#14110E]">
                      {product.product_name || 'Unknown Product'}
                    </span>
                  </div>
                </td>
                <td className="py-4 pr-3 text-[#3F3830]">
                  {formatCurrency(product.price)}
                </td>
                <td className="suite-display py-4 pr-3 text-[16px] text-[#14110E]">
                  {product.total_sales}
                </td>
                <td className="suite-display py-4 pr-6 text-[16px] text-[#14110E]">
                  {formatCurrency(product.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <EmptyState
            title="No products found"
            hint={
              globalFilter
                ? 'Try adjusting your search.'
                : 'Top sellers appear here once the drop starts moving.'
            }
          />
        )}
      </div>
    </Panel>
  );
};
