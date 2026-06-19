'use client';

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
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChainIcon, TagIcon, DollarIcon } from '@/components/icons';
import ReferralCode from '../ReferralCode';
import CreatorNav from '@/components/creators/CreatorNav';
import { getWallet } from './request-payout/actions';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
);

export default function CreatorDashboard({ dashboard }: { dashboard?: any }) {
  // Extract performance metrics
  const totalReferrals = dashboard.performance_metrics?.total_referrals || 0;
  const salesGenerated = dashboard.performance_metrics?.sales_generated || 0;
  const payoutsDue = dashboard.performance_metrics?.payouts_due || 0;

  // Check if all metrics are zero
  const hasPerformanceData =
    totalReferrals > 0 || salesGenerated > 0 || payoutsDue > 0;

  // Doughnut chart data using actual performance metrics
  const doughnutData = {
    labels: ['Total Referrals', 'Sales Generated', 'Payouts Due'],
    datasets: [
      {
        label: 'Metrics',
        data: hasPerformanceData
          ? [totalReferrals, salesGenerated, payoutsDue]
          : [1, 1, 1], // Equal segments for empty state
        backgroundColor: hasPerformanceData
          ? ['#2D2C54', '#0072BB', '#121212']
          : ['#E5E7EB', '#E5E7EB', '#E5E7EB'], // Gray for empty state
        borderRadius: 0,
        spacing: 0,
        hoverOffset: 10,
      },
    ],
  };

  const doughnutOptions: ChartOptions<'doughnut'> = {
    cutout: '60%',
    responsive: false,
    layout: {
      padding: 0,
    },
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 20,
          boxWidth: 15,
          usePointStyle: false,
          pointStyle: 'rect',
          font: {
            size: 12,
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          },
          color: hasPerformanceData ? '#000' : '#9CA3AF',
        },
      },
      tooltip: {
        enabled: hasPerformanceData,
      },
    },
  };

  // Bar chart data using monthly breakdown
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

  // Extract monthly earnings data
  const monthlyEarnings = new Array(12).fill(0);
  if (
    dashboard.earnings?.monthly_breakdown &&
    dashboard.earnings.monthly_breakdown.length > 0
  ) {
    dashboard.earnings.monthly_breakdown.forEach((item: any) => {
      const monthIndex = new Date(item.month).getMonth();
      monthlyEarnings[monthIndex] = item.amount || 0;
    });
  }

  const hasEarningsData = monthlyEarnings.some((amount) => amount > 0);
  const summaryTotal = dashboard.earnings?.summary_total || 0;

  const defaultBarColor = 'rgba(0, 114, 187, 0.3)';
  const currentMonthBarColor = 'rgba(0, 114, 187, 1)';
  const emptyBarColor = 'rgba(229, 231, 235, 0.5)';

  const barBackgroundColors = barLabels.map((_, index) => {
    if (!hasEarningsData) return emptyBarColor;
    return index === currentMonthIndex ? currentMonthBarColor : defaultBarColor;
  });

  const barData = {
    labels: barLabels,
    datasets: [
      {
        label: 'Earnings',
        data: hasEarningsData ? monthlyEarnings : new Array(12).fill(10),
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
      tooltip: {
        enabled: hasEarningsData,
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
        ticks: {
          color: hasEarningsData ? '#000' : '#9CA3AF',
        },
      },
    },
  };

  const balance = dashboard.earnings?.current_balance || 0;

  // Lightweight client check: surface a CTA when the creator has earnings but
  // has not yet set up a payout account (no bank on their cash wallet).
  const [needsPayoutSetup, setNeedsPayoutSetup] = useState(false);

  useEffect(() => {
    const checkPayoutAccount = async () => {
      const result = await getWallet();
      if (result.success) {
        const wallet = result.data?.wallets;
        const hasBank = Boolean(wallet?.payout_metadata?.details?.bank_name);
        const hasFunds =
          (wallet?.balance || 0) > 0 || summaryTotal > 0 || balance > 0;
        setNeedsPayoutSetup(!hasBank && hasFunds);
      }
    };
    checkPayoutAccount();
  }, [balance, summaryTotal]);

  const stats = [
    {
      icon: <ChainIcon />,
      label: 'Total Referrals',
      value: totalReferrals,
      valueColor: 'text-[#0072BB]',
    },
    {
      icon: <TagIcon />,
      label: 'Sales',
      value: `₦${salesGenerated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      valueColor: 'text-[#0072BB]',
    },
    {
      icon: <DollarIcon />,
      label: 'Payouts Due',
      value: `₦${payoutsDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      valueColor: 'text-[#0072BB]',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <CreatorNav balance={balance} />
      <div className="mx-auto flex flex-col gap-[16px] px-[16px] py-[24px] md:max-w-7xl md:px-0">
        {/* Payout setup CTA */}
        {needsPayoutSetup && (
          <Link
            href="/creators/dashboard/withdrawal-bank"
            className="flex items-center justify-between gap-x-4 rounded-2xl bg-[#F5F1CC] px-[16px] py-[16px] transition-shadow hover:shadow-[0_8px_30px_rgba(216,199,50,0.2)]"
          >
            <div>
              <p className="text-[15px] font-semibold text-[#9C8E18]">
                Set up payouts
              </p>
              <p className="mt-0.5 text-[13px] text-[#B5A93D]">
                Add a payout account to withdraw your earnings.
              </p>
            </div>
            <span className="shrink-0 rounded-[8px] bg-[#0072BB] px-4 py-2 text-[12px] font-bold text-white uppercase">
              Set up
            </span>
          </Link>
        )}

        {/* Performance Metrics */}
        <div className="rounded-2xl bg-white p-[12px]">
          <div className="text-[16px] font-medium text-[#8E8E93] capitalize">
            performance metrics
          </div>
          <div className="relative pt-[20px] md:w-[35%]">
            <Doughnut data={doughnutData} options={doughnutOptions} />
            {/* {!hasPerformanceData && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-start">
                <div className="rounded-lg bg-white/90 px-4 py-2 text-center">
                  <p className="text-sm font-medium text-gray-400">
                    No data yet
                  </p>
                  <p className="mt-1 text-xs text-gray-300">
                    Start referring to see metrics
                  </p>
                </div>
              </div>
            )} */}
          </div>
        </div>

        {/* Referral Code */}
        <div className="rounded-2xl bg-white p-[12px]">
          <ReferralCode code={dashboard.creator_code?.code} />
        </div>

        {/* Earning Summary */}
        <div className="rounded-2xl bg-white p-[12px]">
          <div className="text-[16px] font-medium text-[#8E8E93] capitalize">
            Earning Summary
          </div>
          <div className="mt-[8px] text-[22px] font-medium">
            ₦{summaryTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="scrollbar-hide relative max-w-full overflow-x-auto pt-[20px] md:overflow-x-hidden md:px-[10px]">
            <div className="min-w-[600px]">
              <Bar data={barData} options={barOptions} />
              {!hasEarningsData && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="rounded-lg bg-white/90 px-4 py-2 text-center">
                    <p className="text-sm font-medium text-gray-400">
                      No earnings yet
                    </p>
                    <p className="mt-1 text-xs text-gray-300">
                      Your earnings will appear here
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
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
            <div className={`font-medium ${stat.valueColor}`}>{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
