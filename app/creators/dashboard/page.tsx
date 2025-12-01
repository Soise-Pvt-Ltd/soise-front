'use client';
import { ChainIcon, TagIcon, DollarIcon } from '@/components/icons';
import ReferralCode from '../ReferralCode';
import DashboardHeader from './DashboardHeader';

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

export default function dashboardPage() {
  const doughnutData = {
    labels: ['Total Referrals', 'Sales Generated', 'Payouts Due'],
    backgroundColor: ['#2D2C54#0072BB', '#121212'],
    datasets: [
      {
        label: '# of Votes',
        data: [10, 10, 10],
        backgroundColor: ['#2D2C54', '#0072BB', '#121212'],
        borderRadius: 0,
        spacing: 0,
        hoverOffset: 10,
      },
    ],
  };

  const doughnutOptions: ChartOptions<'doughnut'> = {
    // 5. Thinner Ring (Cutout)
    cutout: '60%',
    responsive: false,

    // 6. Removing the gray box outline on the canvas
    layout: {
      padding: 0,
    },

    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          boxWidth: 15, // Sets the width of the colored box in pixels
          usePointStyle: false, // The comment here was incorrect. `false` uses rectangles.
          pointStyle: 'square',
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

  // This would likely come from props or state in a real app
  const balance = 0.0;
  const stats = [
    {
      icon: <ChainIcon />,
      label: 'Total Referrals',
      value: 27,
      valueColor: 'text-[#0072BB]',
    },
    {
      icon: <TagIcon />,
      label: 'Sales',
      value: '$1,267',
      valueColor: 'text-[#0072BB]',
    },
    {
      icon: <DollarIcon />,
      label: 'Payouts Due',
      value: '$500',
      valueColor: 'text-[#0072BB]',
    },
  ];

  return (
    <>
      <div className="bg-[#f9f9f9]">
        <DashboardHeader balance={balance} />
        <div className="mx-auto flex flex-col gap-[16px] px-[16px] py-[24px] md:max-w-7xl md:px-0">
          <div className="rounded-2xl bg-white p-[12px]">
            <div className="text-[16px] font-medium text-[#8E8E93] capitalize">
              performance metrics
            </div>
            <div className="pt-[20px] md:w-[35%]">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </div>
          <div className="rounded-2xl bg-white">
            <ReferralCode code="CREATOR2024" />
          </div>

          <div className="rounded-2xl bg-white p-[12px]">
            <div className="text-[16px] font-medium text-[#8E8E93] capitalize">
              Earning Summary
            </div>
            <div className="mt-[8px] text-[22px] font-medium">$527.5</div>
            <div className="scrollbar-hide max-w-full overflow-x-auto pt-[20px] md:overflow-x-hidden md:px-[10px]">
              <div className="min-w-[600px]">
                {' '}
                {/* or whatever minimum width you need */}
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          </div>

          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-2xl bg-white px-[16px] py-[20px]"
            >
              <div className="flex items-center gap-x-[16px]">
                <div className="rounded-full bg-[#121212] p-[10px]">
                  {stat.icon}
                </div>
                <div className="font-medium">{stat.label}</div>
              </div>
              <div className={`font-medium ${stat.valueColor}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
