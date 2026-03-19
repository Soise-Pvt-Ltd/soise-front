'use client';

import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import GridContainer from '../gridContainer';
import { AdminMoreHorizontalIcon, AdminEditIcon } from '@/components/icons';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
);

const getCount = (val: any) => {
  if (typeof val === 'object' && val !== null && 'count' in val) {
    return val.count;
  }
  return val;
};

type HomeClientProps = {
  data: any;
};

export default function HomeClient({ data }: HomeClientProps) {
  const doughnutData = {
    labels: ['Social Media', 'Creators', 'Ads', 'Purchased'],
    backgroundColor: ['#2D2C54', '#0072BB', '#121212', '#C0CBF2'],
    datasets: [
      {
        label: '# of Votes',
        data: [10, 10, 10, 5],
        backgroundColor: ['#2D2C54', '#0072BB', '#121212', '#C0CBF2'],
        borderRadius: 0,
        spacing: 0,
        hoverOffset: 10,
      },
    ],
  };

  const doughnutOptions: ChartOptions<'doughnut'> = {
    cutout: '60%',
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 0,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          boxWidth: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          },
        },
      },
    },
  };

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

  const currentMonthIndex = new Date().getMonth();
  const defaultBarColor = 'rgba(0, 114, 187, 0.3)';
  const currentMonthBarColor = 'rgba(0, 114, 187, 1)';

  // Create sales data array with zeros, then fill in the months we have data for
  const salesByMonth = Array(12).fill(0);
  data.monthly_sales.forEach((item: any) => {
    // Month is 1-indexed in the data, convert to 0-indexed
    if (item.month >= 1 && item.month <= 12) {
      salesByMonth[item.month - 1] = item.sales;
    }
  });

  const barBackgroundColors = barLabels.map((_, index) => {
    return index === currentMonthIndex ? currentMonthBarColor : defaultBarColor;
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
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        display: false,
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

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
    abandoned: 'bg-[#F5F1CC] text-[#D8C732] border border-[#F5F1CC] rounded-full',
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  return (
    <GridContainer>
      <main className="mt-[22px] !text-[#35373C]" role="main">
        {/* First layer */}
        <div className="grid grid-cols-1 space-y-[24px] gap-x-[16px] md:grid-cols-3 lg:grid-cols-4 lg:space-y-0">
          {/* 1st grid - Total Revenue */}
          <div className="flex flex-col justify-between rounded-[20px] bg-[#0072BB] px-[24px] py-[30px] text-white" role="region" aria-label="Total Revenue">
            <div className="flex items-center justify-between">
              <div className="text-[14px]">Total Revenue</div>
              <div className="cursor-pointer text-white">
                <AdminMoreHorizontalIcon />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[22px] font-medium">
                {formatCurrency(data.revenue.total)}
              </div>
              <div
                className={`w-fit rounded-full p-[10px] text-[14px] ${
                  data.revenue.percentage_change >= 0
                    ? 'bg-white text-[#0072BB]'
                    : 'bg-[#F0DEDC] text-[#D87C86]'
                }`}
              >
                {formatPercentage(data.revenue.percentage_change)}
              </div>
            </div>
          </div>

          {/* 2nd grid - Payout */}
          <div className="flex flex-col justify-between rounded-[20px] bg-white px-[24px] py-[30px] text-[#121212]" role="region" aria-label="Payout">
            <div className="flex items-center justify-between">
              <div className="text-[14px] text-[#AFB1B0]">Payout</div>
              <div className="cursor-pointer text-[#121212]">
                <AdminMoreHorizontalIcon color="#121212" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[22px] font-medium">
                {formatCurrency(data.payout.total)}
              </div>
              {data.payout.percentage_change !== 0 && (
                <div
                  className={`w-fit rounded-full p-[10px] text-[14px] ${
                    data.payout.percentage_change >= 0
                      ? 'bg-[#CCEAD6] text-[#32AC5B]'
                      : 'bg-[#F0DEDC] text-[#D87C86]'
                  }`}
                >
                  {formatPercentage(data.payout.percentage_change)}
                </div>
              )}
            </div>
          </div>

          {/* 3rd grid - Total Products */}
          <div className="flex flex-col justify-between rounded-[20px] bg-white px-[24px] py-[30px] text-[#121212]" role="region" aria-label="Total Products">
            <div className="flex items-center justify-between">
              <div className="text-[14px] text-[#AFB1B0]">Total Products</div>
              <div className="cursor-pointer text-[#121212]">
                <AdminMoreHorizontalIcon color="#121212" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[22px] font-medium">
                {getCount(data.products.total)}
              </div>
              <div className="text-[12px] text-[#AFB1B0]">
                {getCount(data.products.active)} active
              </div>
            </div>
          </div>

          {/* 4th grid - Items Sold */}
          <div className="flex flex-col justify-between rounded-[20px] bg-white px-[24px] py-[30px] text-[#121212]" role="region" aria-label="Items Sold">
            <div className="flex items-center justify-between">
              <div className="text-[14px] text-[#AFB1B0]">Items Sold</div>
              <div className="cursor-pointer text-[#121212]">
                <AdminMoreHorizontalIcon color="#121212" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[22px] font-medium">
                {getCount(data.items_sold.current_month)}
              </div>
              <div>
                <select className="cursor-pointer rounded-[6px] border-2 border-[#F6F6F6] px-2 py-1 pr-8 text-[13px] text-[#AFB1B0] outline-none">
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Yearly</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Second layer */}
        <div className="my-[38px] space-y-[24px] gap-x-[16px] md:space-y-0">
          {/* <div className="my-[38px] grid grid-cols-1 space-y-[24px] gap-x-[16px] md:grid-cols-6 md:space-y-0"> */}
          <div className="rounded-[20px] bg-white px-[24px] py-[30px] md:col-span-4">
            <div>
              <p className="text-[14px] font-medium text-[#AFB1B0]">
                Sales Statistics
              </p>
              <p className="text-[36px] font-medium">
                {formatCurrency(data.revenue.total)}
              </p>
            </div>
            <div>
              <div className="scrollbar-hide overflow-x-auto pt-[20px] md:px-[10px]">
                <div>
                  <Bar data={barData} options={barOptions} />
                </div>
              </div>
            </div>
          </div>
          {/* <div className="flex flex-col rounded-[20px] bg-white px-[24px] py-[30px] md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="text-[18px]">Visitors</div>
              <div>
                <select className="cursor-pointer rounded-[6px] border-2 border-[#F6F6F6] px-2 py-1 pr-8 text-[13px] text-[#AFB1B0] outline-none">
                  <option>Weekly</option>
                  <option>Monthly</option>
                  <option>Yearly</option>
                </select>
              </div>
            </div>
            <div className="relative flex-grow pt-4">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div> */}
        </div>

        {/* Third layer */}
        <div className="mt-[38px] grid grid-cols-1 space-y-[24px] gap-x-[16px] md:grid-cols-5 md:space-y-0">
          <div className="!h-fit rounded-[20px] bg-white px-[24px] py-[27px] md:col-span-2">
            <div className="mb-4 flex flex-col justify-between gap-4 border-none sm:flex-row sm:items-center">
              <div className="text-[18px] font-medium">Latest Orders</div>
              <div className="h-[36px]"></div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[300px] text-left !text-[13px]">
                <thead>
                  {data.latest_orders.length > 0 && (
                    <tr className="text-[#AFB1B0]">
                      <th className="pb-2 font-normal">Customer</th>
                      <th className="pb-2 font-normal">Status</th>
                      <th className="pb-2 font-normal">Time</th>
                      <th className="pb-2 font-normal"></th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {data.latest_orders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center">
                        <p className="text-base font-medium text-gray-500">No recent orders</p>
                        <p className="mt-1 text-sm text-gray-400">Orders will appear here once customers place them</p>
                      </td>
                    </tr>
                  ) : (
                    data.latest_orders.map((order: any) => (
                      <tr key={order.id} className="border-t border-[#F6F6F6]">
                        <td className="py-3 text-wrap">
                          {order.customer_name || 'Guest'}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 text-xs font-medium ${
                              statusClasses[order.status] ||
                              statusClasses.created
                            }`}
                          >
                            {order.status.charAt(0).toUpperCase() +
                              order.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3">{formatTime(order.created_at)}</td>
                        <td className="py-3 text-right">
                          <AdminMoreHorizontalIcon color="#121212" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="!h-fit rounded-[20px] bg-white px-[24px] py-[27px] md:col-span-3">
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
    if (amount === null) return 'N/A';
    return `₦${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <>
      <div className="mb-4 flex flex-col justify-between gap-4 border-none sm:flex-row sm:items-center">
        <div className="text-[18px] font-medium">Top Products</div>
        <input
          type="search"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search products..."
          aria-label="Search top products"
          className="rounded-[10px] border-0 bg-[#F5F5F5] text-[12px] outline-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-[#0072BB] md:w-[245px]"
        />
      </div>
      <div className="scrollbar-hide overflow-x-auto">
        <table className="w-full min-w-[600px] text-left !text-[13px]" aria-label="Top Products">
          {filteredProducts.length > 0 && (
            <thead>
              <tr className="text-[#AFB1B0]">
                <th className="pb-2 font-normal" scope="col">Product Name</th>
                <th className="pb-2 font-normal" scope="col">Price</th>
                <th className="pb-2 font-normal" scope="col">Total Sales</th>
                <th className="pb-2 font-normal" scope="col">Revenue</th>
              </tr>
            </thead>
          )}
          <tbody>
            {filteredProducts.length > 0 &&
              filteredProducts.map((product, index) => (
                <tr
                  key={product.product_id || index}
                  className="border-t border-[#F6F6F6]"
                >
                  <td className="py-3 pr-2" scope="row">
                    <div className="flex items-center gap-x-2">
                      {product.product_image && (
                        <img
                          src={product.product_image}
                          alt={product.product_name || 'Product'}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      )}
                      <span>{product.product_name || 'Unknown Product'}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-2">
                    <div className="h-[25px] w-fit rounded-[6px] bg-[#C0CBF2] px-2 py-1 text-[#0072BB]">
                      {formatCurrency(product.price)}
                    </div>
                  </td>
                  <td className="py-3 pr-2">
                    <div className="h-[25px] w-fit rounded-[6px] bg-[#C0CBF2] px-2 py-1 text-[#0072BB]">
                      {product.total_sales}
                    </div>
                  </td>
                  <td className="py-3 pr-2">
                    <div className="h-[25px] w-fit rounded-[6px] bg-[#C0CBF2] px-2 py-1 text-[#0072BB]">
                      {formatCurrency(product.revenue)}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-base font-medium text-gray-500">No products found</p>
            <p className="mt-1 text-sm text-gray-400">
              {globalFilter ? 'Try adjusting your search' : 'No top products to display'}
            </p>
          </div>
        )}
      </div>
    </>
  );
};
