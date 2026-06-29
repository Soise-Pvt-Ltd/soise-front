'use client';

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
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChainIcon, TagIcon, DollarIcon } from '@/components/icons';
import ReferralCode from '../ReferralCode';
import CreatorNav from '@/components/creators/CreatorNav';
import { getWallet } from './request-payout/actions';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const naira = (n: number) =>
  `₦${(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function CreatorDashboard({
  dashboard,
  codeCreatedAt,
  tiers,
}: {
  dashboard?: any;
  codeCreatedAt?: string | null;
  tiers?: any;
}) {
  if (!dashboard) {
    return (
      <div className="min-h-screen bg-[#f9f9f9]">
        <CreatorNav balance={0} />
        <div className="mx-auto max-w-7xl px-[16px] py-[80px] text-center text-[16px] text-[#8E8E93]">
          We couldn&apos;t load your creator dashboard. Please refresh, or sign
          in again.
        </div>
      </div>
    );
  }

  // Performance metrics
  const totalReferrals = dashboard.performance_metrics?.total_referrals || 0;
  const salesGenerated = dashboard.performance_metrics?.sales_generated || 0;
  const totalEarnings =
    dashboard.earnings?.total_earnings ||
    dashboard.earnings?.summary_total ||
    0;
  const balance = dashboard.earnings?.current_balance || 0;
  const summaryTotal = dashboard.earnings?.summary_total || 0;

  const hasActivity =
    totalReferrals > 0 || salesGenerated > 0 || totalEarnings > 0;

  // Bar chart — monthly commission breakdown
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

  const monthlyEarnings = new Array(12).fill(0);
  if (
    dashboard.earnings?.monthly_breakdown &&
    dashboard.earnings.monthly_breakdown.length > 0
  ) {
    dashboard.earnings.monthly_breakdown.forEach((item: any) => {
      const monthIndex = new Date(item.month).getMonth();
      monthlyEarnings[monthIndex] = item.earnings || item.amount || 0;
    });
  }

  const hasEarningsData = monthlyEarnings.some((amount) => amount > 0);

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
      legend: { display: false },
      tooltip: {
        enabled: hasEarningsData,
        callbacks: {
          label: (ctx) => naira(ctx.parsed.y ?? 0),
        },
      },
    },
    scales: {
      y: { display: false },
      x: {
        grid: { display: false },
        ticks: { color: hasEarningsData ? '#000' : '#9CA3AF' },
      },
    },
  };

  // Tier
  const tierName = dashboard.tier?.name as string | undefined;
  const currentRate = dashboard.tier?.current_rate ?? 10;
  const hasTier =
    !!tierName &&
    !['no tier', 'unassigned'].includes(tierName.toLowerCase());
  const discountPct = dashboard.creator_code?.discount_percentage ?? 10;
  const fmtPct = (n: number) =>
    Number.isInteger(n) ? `${n}%` : `${n.toFixed(1)}%`;

  // Tier progress toward the next milestone (from /tiers/dashboard).
  // `sales_needed` is the ABSOLUTE monthly-sales threshold of the next tier,
  // not a remaining amount — so remaining = needed - current. The bar is
  // tier-relative: progress within the current band (floor → next threshold),
  // not from zero. `tier.min_monthly_sales` is the current band's floor.
  const monthlySales = tiers?.monthly_sales ?? 0;
  const tierFloor = tiers?.tier?.min_monthly_sales ?? 0;
  const nextTierName = tiers?.next_milestone?.tier_name as string | undefined;
  const salesNeeded = tiers?.next_milestone?.sales_needed as number | undefined;
  const hasNextMilestone =
    hasTier &&
    !!nextTierName &&
    typeof salesNeeded === 'number' &&
    salesNeeded > 0;
  const remainingSales = hasNextMilestone
    ? Math.max(0, (salesNeeded as number) - monthlySales)
    : 0;
  const tierBand = hasNextMilestone
    ? Math.max(1, (salesNeeded as number) - tierFloor)
    : 1;
  const tierProgress = hasNextMilestone
    ? Math.min(1, Math.max(0, (monthlySales - tierFloor) / tierBand))
    : 0;
  const atTopTier = hasTier && !!tiers && !nextTierName;

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
      label: 'Orders placed',
      hint: 'Checkouts that used your code',
      value: totalReferrals.toLocaleString(),
    },
    {
      icon: <TagIcon />,
      label: "Sales you've driven",
      hint: 'Total value of those orders',
      value: naira(salesGenerated),
    },
    {
      icon: <DollarIcon />,
      label: 'Commission earned',
      hint: 'Paid into your wallet',
      value: naira(totalEarnings),
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

        {/* Creator code — the centerpiece */}
        <div className="rounded-2xl bg-white p-[16px]">
          <ReferralCode
            code={dashboard.creator_code?.code}
            codeCreatedAt={codeCreatedAt}
            discountPercentage={dashboard.creator_code?.discount_percentage}
            commissionRate={dashboard.tier?.current_rate}
            usageCount={dashboard.creator_code?.usage_count}
            tierName={dashboard.tier?.name}
          />
        </div>

        {/* Tier + progress to next milestone */}
        <div className="rounded-2xl bg-[#121212] p-[16px] text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-white/60">Your tier</p>
              <p className="text-[16px] font-medium">
                {hasTier ? tierName : 'No tier yet'}
                <span className="ml-[8px] text-[13px] font-normal text-white/60">
                  {fmtPct(currentRate)} commission
                </span>
              </p>
            </div>
            <Link
              href="/creators/dashboard/tier-upgrade"
              className="shrink-0 rounded-full bg-white px-[18px] py-[8px] text-[13px] font-medium text-[#121212] transition-opacity hover:opacity-80"
            >
              {hasTier ? 'Tiers' : 'Get a tier'}
            </Link>
          </div>

          {hasNextMilestone && (
            <div className="mt-[16px]">
              <div className="flex items-center justify-between text-[12px] text-white/60">
                <span>{naira(monthlySales)} this month</span>
                <span>Next: {nextTierName}</span>
              </div>
              <div className="mt-[8px] h-[6px] overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${Math.round(tierProgress * 100)}%` }}
                />
              </div>
              <p className="mt-[8px] text-[12px] text-white/70">
                {naira(remainingSales)} more in sales this month to reach{' '}
                {nextTierName} and a higher commission rate.
              </p>
            </div>
          )}

          {atTopTier && (
            <p className="mt-[12px] text-[12px] text-white/70">
              You&apos;re at our top tier — you earn our highest commission
              rate.
            </p>
          )}
        </div>

        {/* First-time guidance — only before any activity */}
        {!hasActivity && (
          <div className="rounded-2xl bg-white p-[16px]">
            <div className="text-[16px] font-medium text-[#121212]">
              Start earning
            </div>
            <p className="mt-[2px] text-[13px] text-[#8E8E93]">
              Here&apos;s how your code turns into commission.
            </p>
            <ol className="mt-[16px] space-y-[14px]">
              {[
                'Share your code or link with your audience.',
                `They get ${fmtPct(discountPct)} off at checkout.`,
                `You earn ${fmtPct(
                  currentRate,
                )} of every order, paid to your wallet.`,
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-x-[12px]">
                  <span className="flex size-[24px] shrink-0 items-center justify-center rounded-full bg-[#0072BB] text-[12px] font-medium text-white">
                    {i + 1}
                  </span>
                  <span className="text-[14px] text-[#121212]">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Performance KPIs */}
        <div className="grid grid-cols-1 gap-[16px] sm:grid-cols-3">
          {stats.map((stat, index) => (
            <div key={index} className="rounded-2xl bg-white p-[16px]">
              <div className="mb-[12px] w-fit rounded-full bg-[#121212] p-[10px]">
                {stat.icon}
              </div>
              <div className="text-[22px] font-medium text-[#0072BB]">
                {stat.value}
              </div>
              <div className="mt-[2px] text-[14px] font-medium text-[#121212]">
                {stat.label}
              </div>
              <div className="text-[13px] text-[#8E8E93]">{stat.hint}</div>
            </div>
          ))}
        </div>

        {/* Earnings by month — only once there's something to show */}
        {hasActivity && (
          <div className="rounded-2xl bg-white p-[16px]">
            <div className="flex items-baseline justify-between">
              <div className="text-[16px] font-medium text-[#121212]">
                Commission by month
              </div>
              <Link
                href="/creators/dashboard/request-payout"
                className="text-[13px] font-medium text-[#0072BB] transition-opacity hover:opacity-70"
              >
                Withdraw
              </Link>
            </div>
            <p className="mt-[2px] text-[13px] text-[#8E8E93]">
              {naira(balance)} available to withdraw now.
            </p>
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
                        Share your code to start earning
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
