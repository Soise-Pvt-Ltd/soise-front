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
import CreatorCode from '../CreatorCode';
import CreatorNav from '@/components/creators/CreatorNav';
import { getWallet } from './request-payout/actions';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const naira = (n: number) =>
  `₦${(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** Playfair Display — the Ivory House display face. */
const luxe = { fontFamily: 'var(--font-luxe, Georgia, serif)' } as const;

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
      <div className="min-h-screen bg-[#0E0E10] text-[#F4F1EA]">
        <CreatorNav balance={0} />
        <div className="page-shell px-[16px] py-[80px] text-center text-[16px] leading-relaxed text-[#B7B2A6]">
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

  // `month` arrives as an INTEGER 1-12 — the backend groups by
  // `time::month(created_at)`, not by a date. This used to do
  // `new Date(item.month).getMonth()`, which reads 7 as 7 *milliseconds* after
  // the epoch: 1 Jan 1970, month index 0. Every month therefore landed on the
  // January bar, and because the write was an assignment rather than a sum,
  // each row overwrote the last — so the chart showed one January column
  // holding whichever month happened to sort last.
  //
  // Still tolerant of a date string, in case the grouping ever changes shape.
  const monthlyEarnings = new Array(12).fill(0);
  if (Array.isArray(dashboard.earnings?.monthly_breakdown)) {
    dashboard.earnings.monthly_breakdown.forEach((item: any) => {
      const raw = item?.month;
      let index = -1;

      if (typeof raw === 'number' && raw >= 1 && raw <= 12) {
        index = raw - 1;
      } else if (typeof raw === 'string') {
        const asNumber = Number(raw);
        if (Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= 12) {
          index = asNumber - 1;
        } else {
          const parsed = new Date(raw);
          if (!Number.isNaN(parsed.getTime())) index = parsed.getMonth();
        }
      }

      if (index < 0 || index > 11) return;
      // Accumulate: the window is 365 days, so two rows can share a month
      // index across a year boundary and one must not erase the other.
      monthlyEarnings[index] += Number(item.earnings ?? item.amount ?? 0) || 0;
    });
  }

  const hasEarningsData = monthlyEarnings.some((amount) => amount > 0);

  // Ivory House: the bars are a wash of the house gold, and the CURRENT month
  // is the one column at full strength — one accent, spent on the column that
  // matters.
  const defaultBarColor = 'rgba(196, 170, 110, 0.30)';
  const currentMonthBarColor = 'rgba(196, 170, 110, 1)';
  const emptyBarColor = 'rgba(244, 241, 234, 0.06)';

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
        // Softened corners: nothing in this register has a hard edge.
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
        ticks: { color: hasEarningsData ? '#B7B2A6' : '#6E6A60' },
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
  // Same shape as CreatorCode's, and hardened for the same reason: the API
  // sends explicit nulls for an unassigned tier or code. The callers here do
  // guard with ??, but this is the function that took the dashboard down once.
  const fmtPct = (n: unknown) => {
    const value = Number(n);
    if (!Number.isFinite(value)) return '—';
    return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
  };

  // Tier progress toward the next milestone (from /tiers/dashboard).
  // The ladder is keyed on LIFETIME PAID ORDERS (`usage_count`), not naira:
  // monthly sales reset on the 1st, so the old bar emptied itself every month
  // and told a creator they had gone backwards.
  // `orders_needed` is the ABSOLUTE order threshold of the next tier, not a
  // remaining count — so remaining = needed - current. The bar is
  // tier-relative: progress within the current band (floor → next threshold),
  // not from zero. `tier.min_orders` is the current band's floor.
  const ordersPlaced = tiers?.usage_count ?? 0;
  const tierFloor = tiers?.tier?.min_orders ?? 0;
  const nextTierName = tiers?.next_milestone?.tier_name as string | undefined;
  const ordersNeeded = tiers?.next_milestone?.orders_needed as
    | number
    | undefined;
  const nextTierRate = tiers?.next_milestone?.rate as number | undefined;
  const hasNextMilestone =
    hasTier &&
    !!nextTierName &&
    typeof ordersNeeded === 'number' &&
    ordersNeeded > 0;
  const remainingOrders = hasNextMilestone
    ? Math.max(0, (ordersNeeded as number) - ordersPlaced)
    : 0;
  const tierBand = hasNextMilestone
    ? Math.max(1, (ordersNeeded as number) - tierFloor)
    : 1;
  const tierProgress = hasNextMilestone
    ? Math.min(1, Math.max(0, (ordersPlaced - tierFloor) / tierBand))
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
      // "Paid into your wallet" read as the withdrawable figure, which it is
      // not — this is lifetime commission credited, before any withdrawals.
      // The available balance is stated separately, below the chart.
      hint: 'Lifetime, before withdrawals',
      value: naira(totalEarnings),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0E0E10] text-[#F4F1EA]">
      <CreatorNav balance={balance} />
      <div className="page-shell flex flex-col gap-[20px] px-[16px] py-[28px] md:px-0">
        {/* Payout setup CTA */}
        {needsPayoutSetup && (
          <Link
            href="/creators/dashboard/withdrawal-bank"
            className="flex items-center justify-between gap-x-4 rounded-[16px] bg-[#121214] px-[22px] py-[20px] transition-colors hover:bg-[#16161A]"
          >
            <div>
              <span className="text-[12px] font-medium tracking-[0.28em] text-[#C4AA6E] uppercase">
                Set up payouts
              </span>
              <p className="mt-[10px] text-[14px] leading-relaxed text-[#9F9A8E]">
                Add a payout account to withdraw your earnings.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#C4AA6E] px-[24px] py-[11px] text-[14px] font-semibold tracking-wide text-[#0E0E10]">
              Set up
            </span>
          </Link>
        )}

        {/* Creator code — the centerpiece. The panel sits at ground level with
            a hairline so the code plate inside it is the thing that lifts. */}
        <div className="rounded-[16px] border border-[#1F1F22] p-[22px]">
          <CreatorCode
            code={dashboard.creator_code?.code}
            codeCreatedAt={codeCreatedAt}
            discountPercentage={dashboard.creator_code?.discount_percentage}
            commissionRate={dashboard.tier?.current_rate}
            usageCount={dashboard.creator_code?.usage_count}
            tierName={dashboard.tier?.name}
          />
        </div>

        {/* Tier + progress to next milestone. */}
        <div className="rounded-[16px] border border-[#1F1F22] bg-[#121214] p-[22px]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[12px] font-medium tracking-[0.28em] text-[#C4AA6E] uppercase">
                Your tier
              </p>
              <p className="mt-[10px] flex flex-wrap items-baseline gap-x-[12px]">
                {/* The tier name is the one piece of status on this page, so it
                    is set in the house display serif rather than body Poppins —
                    the same treatment the creator saw on onboarding, and the
                    one place gold is spent on a figure. */}
                <span
                  className="text-[34px] leading-tight font-medium tracking-tight text-[#C4AA6E]"
                  style={luxe}
                >
                  {hasTier ? tierName : 'No tier yet'}
                </span>
                <span className="text-[12px] tracking-[0.14em] text-[#7A766C] uppercase">
                  {fmtPct(currentRate)} commission
                </span>
              </p>
            </div>
            <Link
              href="/creators/dashboard/tier-upgrade"
              className="shrink-0 rounded-full border border-[#3A3A3D] px-[20px] py-[10px] text-[13px] font-medium text-[#D8D3C7] transition-colors hover:border-[#C4AA6E] hover:text-[#F4F1EA]"
            >
              {hasTier ? 'Tiers' : 'Get a tier'}
            </Link>
          </div>

          {hasNextMilestone && (
            <div className="mt-[22px]">
              <div className="flex items-center justify-between text-[12px] tracking-[0.08em] text-[#7A766C] uppercase">
                <span>
                  {ordersPlaced.toLocaleString()}{' '}
                  {ordersPlaced === 1 ? 'order' : 'orders'} so far
                </span>
                <span>Next: {nextTierName}</span>
              </div>
              <div className="mt-[10px] h-[6px] overflow-hidden rounded-full bg-[#F4F1EA]/10">
                <div
                  className="h-full rounded-full bg-[#C4AA6E] transition-all duration-500"
                  style={{ width: `${Math.round(tierProgress * 100)}%` }}
                />
              </div>
              <p className="mt-[12px] text-[13px] leading-relaxed text-[#9F9A8E]">
                {remainingOrders.toLocaleString()} more{' '}
                {remainingOrders === 1 ? 'order' : 'orders'} to reach{' '}
                {nextTierName}
                {typeof nextTierRate === 'number'
                  ? ` and ${fmtPct(nextTierRate)} commission`
                  : ' and a higher commission rate'}
                . Orders count for life — you never drop a tier.
              </p>
            </div>
          )}

          {atTopTier && (
            <p className="mt-[16px] text-[13px] leading-relaxed text-[#9F9A8E]">
              You&apos;re at our top tier — you earn our highest commission
              rate.
            </p>
          )}
        </div>

        {/* First-time guidance — only before any activity */}
        {!hasActivity && (
          <div className="rounded-[16px] bg-[#121214] p-[22px]">
            <p className="text-[12px] font-medium tracking-[0.28em] text-[#C4AA6E] uppercase">
              Start earning
            </p>
            <p className="mt-[10px] text-[14px] leading-relaxed text-[#9F9A8E]">
              Here&apos;s how your code turns into commission.
            </p>
            <ol className="mt-[20px] space-y-[16px]">
              {[
                'Share your code or link with your audience.',
                `They get ${fmtPct(discountPct)} off at checkout.`,
                `You earn ${fmtPct(
                  currentRate,
                )} of every order, paid to your wallet.`,
              ].map((step, i) => (
                <li key={i} className="flex gap-x-[14px]">
                  {/* The house numbered step: a gold ring, nothing else. */}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C4AA6E] text-[13px] font-semibold text-[#C4AA6E]">
                    {i + 1}
                  </span>
                  <span className="pt-[5px] text-[14px] leading-relaxed text-[#B7B2A6]">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Performance KPIs */}
        <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-3">
          {stats.map((stat, index) => (
            <div key={index} className="rounded-[16px] bg-[#121214] p-[22px]">
              <div className="mb-[16px] w-fit rounded-full border border-[#3A3A3D] p-[10px]">
                {stat.icon}
              </div>
              {/* Ivory, not gold: three gold figures side by side would spend
                  the accent on nothing. */}
              <div
                className="text-[32px] leading-tight font-medium tracking-tight text-[#F4F1EA]"
                style={luxe}
              >
                {stat.value}
              </div>
              <div className="mt-[8px] text-[15px] font-medium text-[#F4F1EA]">
                {stat.label}
              </div>
              <div className="text-[14px] leading-relaxed text-[#9F9A8E]">
                {stat.hint}
              </div>
            </div>
          ))}
        </div>

        {/* Earnings by month — only once there's something to show */}
        {hasActivity && (
          <div className="rounded-[16px] bg-[#121214] p-[22px]">
            <div className="flex items-baseline justify-between gap-4">
              <div
                className="text-[26px] leading-tight font-medium tracking-tight text-[#F4F1EA]"
                style={luxe}
              >
                Commission by month
              </div>
              <Link
                href="/creators/dashboard/request-payout"
                className="shrink-0 text-[12px] font-medium tracking-[0.14em] text-[#C4AA6E] uppercase transition-colors hover:text-[#F4F1EA]"
              >
                Withdraw
              </Link>
            </div>
            <p className="mt-[8px] text-[14px] text-[#9F9A8E]">
              {naira(balance)} available to withdraw now.
            </p>
            <div className="scrollbar-hide relative max-w-full overflow-x-auto pt-[20px] md:overflow-x-hidden md:px-[10px]">
              <div className="min-w-[600px]">
                <Bar data={barData} options={barOptions} />
                {!hasEarningsData && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="rounded-[16px] border border-[#1F1F22] bg-[#121214] px-6 py-4 text-center">
                      <p className="text-[12px] font-medium tracking-[0.28em] text-[#C4AA6E] uppercase">
                        No earnings yet
                      </p>
                      <p className="mt-2 text-[13px] text-[#9F9A8E]">
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
