'use client';

import { useState, useMemo } from 'react';
import GridContainer from './gridContainer';
import { AdminMoreHorizontalIcon } from '@/components/icons';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getFilteredRowModel,
  ColumnDef,
} from '@tanstack/react-table';
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
import { faker } from '@faker-js/faker';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
);

type Product = {
  name: string;
  price: number;
  totalSales: number;
};

export default function DashboardPage() {
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
    // 5. Thinner Ring (Cutout)
    cutout: '60%',
    responsive: true,
    maintainAspectRatio: false,
    // 6. Removing the gray box outline on the canvas
    layout: {
      padding: 0,
    },

    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          boxWidth: 15, // Sets the width of the colored box in pixels
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12, // Reduced font size for the legend text
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          },
        },
      },
      // tooltip: {
      //   backgroundColor: '#1f2937', // Dark gray tooltips
      //   padding: 12,
      //   bodyFont: {
      //     size: 14,
      //   },
      //   callbacks: {
      //     // Custom text in tooltip
      //     label: (context: any) => ` ${context.label}: ${context.raw} users`,
      //   },
      // },
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

  const currentMonthIndex = new Date().getMonth(); // 0 for Jan, 11 for Dec
  const defaultBarColor = 'rgba(0, 114, 187, 0.3)';
  const currentMonthBarColor = 'rgba(0, 114, 187, 1)'; // A more solid color for the current month

  const barBackgroundColors = barLabels.map((_, index) => {
    return index === currentMonthIndex ? currentMonthBarColor : defaultBarColor;
  });

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: '',
        data: barLabels.map(() => faker.number.int({ min: 0, max: 1000 })),
        backgroundColor: barBackgroundColors,
        barPercentage: 0.8, // Increase bar width
        categoryPercentage: 1.1, // Use full category width
        borderRadius: 5, // Makes the bars have rounded corners
      },
    ],
  };

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        display: false, // This hides the legend
      },
    },
    scales: {
      y: {
        display: false, // This hides the entire y-axis, including labels and grid lines
      },
      x: {
        grid: {
          display: false, // This hides the vertical grid lines
        },
      },
    },
  };

  const orderStatuses = ['completed', 'abandoned', 'failed'] as const;
  type OrderStatus = (typeof orderStatuses)[number];

  const latestOrders = Array.from({ length: 5 }, () => ({
    customer: faker.person.fullName(),
    status: faker.helpers.arrayElement(orderStatuses),
    time: faker.date
      .recent()
      .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }));

  const statusClasses: Record<OrderStatus, string> = {
    completed:
      'bg-[#EAF9F0] text-[#52B47D] border border-[#BEE5CF] rounded-[4px]',
    abandoned:
      'bg-[#FEF6E9] text-[#F3A027] border border-[#FCDDB3] rounded-[4px]',
    failed: 'bg-[#FDEBEB] text-[#E55C5C] border border-[#F8CACA] rounded-[4px]',
  };
  return (
    <GridContainer>
      <main className="mt-[22px] !text-[#35373C]">
        {/* First layer */}
        <div className="grid grid-cols-1 space-y-[24px] gap-x-[16px] md:grid-cols-3 lg:grid-cols-4 lg:space-y-0">
          {/* 1st grid */}
          <div className="flex flex-col justify-between rounded-[20px] bg-[#0072BB] px-[24px] py-[30px] text-white">
            <div className="flex items-center justify-between">
              <div className="text-[14px]">Total Revenue</div>
              <div className="cursor-pointer text-white">
                <AdminMoreHorizontalIcon />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[22px] font-medium">$74.8k</div>
              <div className="w-fit rounded-full bg-white p-[10px] text-[14px] text-[#0072BB]">
                +2.5%
              </div>
            </div>
          </div>
          {/* 2nd grid */}
          <div className="flex flex-col justify-between rounded-[20px] bg-white px-[24px] py-[30px] text-[#121212]">
            <div className="flex items-center justify-between">
              <div className="text-[14px] text-[#AFB1B0]">Total Revenue</div>
              <div className="cursor-pointer text-[#121212]">
                <AdminMoreHorizontalIcon color="#121212" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[22px] font-medium">$11.3k</div>
              <div className="w-fit rounded-full bg-[#F0DEDC] p-[10px] text-[14px] text-[#D87C86]">
                +1.5%
              </div>
            </div>
          </div>
          {/* 3rd grid */}
          <div className="flex flex-col justify-between rounded-[20px] bg-white px-[24px] py-[30px] text-[#121212]">
            <div className="flex items-center justify-between">
              <div className="text-[14px] text-[#AFB1B0]">Total Products</div>
              <div className="cursor-pointer text-[#121212]">
                <AdminMoreHorizontalIcon color="#121212" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[22px] font-medium">26</div>
              <div></div>
            </div>
          </div>
          {/* 4th grid */}
          <div className="flex flex-col justify-between rounded-[20px] bg-white px-[24px] py-[30px] text-[#121212]">
            <div className="flex items-center justify-between">
              <div className="text-[14px] text-[#AFB1B0]">Items Sold</div>
              <div className="cursor-pointer text-[#121212]">
                <AdminMoreHorizontalIcon color="#121212" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-[22px] font-medium">48</div>
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
        <div className="my-[38px] grid grid-cols-1 space-y-[24px] gap-x-[16px] md:grid-cols-6 md:space-y-0">
          <div className="rounded-[20px] bg-white px-[24px] py-[30px] md:col-span-4">
            <div>
              <p className="text-[14px] font-medium text-[#AFB1B0]">
                Sales Statistics
              </p>
              <p className="text-[36px] font-medium">$527.5</p>
            </div>
            <div>
              <div className="scrollbar-hide overflow-x-auto pt-[20px] md:px-[10px]">
                <div>
                  <Bar data={barData} options={barOptions} />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col rounded-[20px] bg-white px-[24px] py-[30px] md:col-span-2">
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
          </div>
        </div>

        {/* Third layer */}
        <div className="mt-[38px] grid grid-cols-1 space-y-[24px] gap-x-[16px] md:grid-cols-5 md:space-y-0">
          <div className="!h-fit rounded-[20px] bg-white px-[24px] py-[30px] md:col-span-2">
            <div className="text-[18px] font-medium">Latest Orders</div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[300px] text-left !text-[13px]">
                <thead>
                  <tr className="text-[#AFB1B0]">
                    <th className="pb-2 font-normal">Customer</th>
                    <th className="pb-2 font-normal">Status</th>
                    <th className="pb-2 font-normal">Time</th>
                    <th className="pb-2 font-normal"></th>
                  </tr>
                </thead>
                <tbody>
                  {latestOrders.map((order, index) => (
                    <tr key={index} className="border-t border-[#F6F6F6]">
                      <td className="py-3">{order.customer}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 text-xs font-medium ${statusClasses[order.status]}`}
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3">{order.time}</td>
                      <td className="py-3 text-right">
                        <AdminMoreHorizontalIcon color="#121212" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="!h-fit rounded-[20px] bg-white px-[24px] py-[30px] md:col-span-3">
            <AllProductsTable />
          </div>
        </div>
      </main>
    </GridContainer>
  );
}

const AllProductsTable = () => {
  const [globalFilter, setGlobalFilter] = useState('');

  const products = useMemo(
    () =>
      Array.from({ length: 8 }, () => ({
        name: faker.commerce.productName(),
        price: parseFloat(faker.commerce.price()),
        totalSales: faker.number.int({ min: 100, max: 5000 }),
      })),
    [],
  );

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      { accessorKey: 'name', header: 'Product Name' },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: (info) => `$${info.getValue<number>().toFixed(2)}`,
      },
      {
        accessorKey: 'totalSales',
        header: 'Total Sales',
        cell: (info) => `$${info.getValue<number>().toLocaleString('en-US')}`,
      },
      {
        id: 'edit',
        header: 'Edit',
        cell: () => (
          <button className="cursor-pointer">
            <AdminMoreHorizontalIcon color="#121212" />
          </button>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: products,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <>
      <div className="mb-4 flex flex-col justify-between gap-4 border-none sm:flex-row sm:items-center">
        <div className="text-[18px] font-medium">All Products</div>
        <input
          type="text"
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search products..."
          className="rounded-[10px] border-0 bg-[#F5F5F5] text-[12px] focus:ring-0 md:w-[245px]"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] text-left !text-[13px]">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="text-[#AFB1B0]">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="pb-2 font-normal">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-t border-[#F6F6F6]">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="py-3 pr-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
