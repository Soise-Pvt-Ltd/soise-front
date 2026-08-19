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

/** Instrument Serif — the Pressed Ink display face. */
const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

/** Index number + rule — the editorial section head, pressed harder. */
function IndexHead({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-x-3">
      <span className="text-[12px] font-bold tracking-[0.08em] text-[#B3101C]">
        {n}
      </span>
      <span className="brut-label">{title}</span>
      <span className="brut-rule mt-auto mb-[6px] flex-1 opacity-20" />
    </div>
  );
}

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
      <div className="min-h-screen bg-[#F5F0E8] text-[#121212]">
        <CreatorNav balance={0} />
        <div className="page-shell px-[16px] py-[80px] text-center text-[16px] text-[#5C544A]">
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

  // Pressed Ink: the bars are ink, and the CURRENT month is the single crimson
  // mark on the chart — one accent, spent on the one column that matters.
  const defaultBarColor = 'rgba(18, 18, 18, 0.25)';
  const currentMonthBarColor = 'rgba(179, 16, 28, 1)';
  const emptyBarColor = 'rgba(18, 18, 18, 0.08)';

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
        // Sharp corners: nothing in this language is rounded.
        borderRadius: 0,
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
        ticks: { color: hasEarningsData ? '#121212' : '#5C544A' },
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
    <div className="min-h-screen bg-[#F5F0E8] text-[#121212]">
      <CreatorNav balance={balance} />
      <div className="page-shell flex flex-col gap-[20px] px-[16px] py-[28px] md:px-0">
        {/* Payout setup CTA */}
        {needsPayoutSetup && (
          <Link
            href="/creators/dashboard/withdrawal-bank"
            className="brut-plate brut-press flex items-center justify-between gap-x-4 px-[20px] py-[18px]"
          >
            <div>
              <span className="brut-stamp">Set up payouts</span>
              <p className="mt-[10px] text-[13px] text-[#3F3830]">
                Add a payout account to withdraw your earnings.
              </p>
            </div>
            <span className="shrink-0 rounded-[2px] border-2 border-[#121212] bg-[#121212] px-[18px] py-[11px] text-[11px] font-bold tracking-[0.14em] text-white uppercase">
              Set up
            </span>
          </Link>
        )}

        {/* Creator code — the centerpiece */}
        <div className="brut-plate brut-shadow p-[20px]">
          <CreatorCode
            code={dashboard.creator_code?.code}
            codeCreatedAt={codeCreatedAt}
            discountPercentage={dashboard.creator_code?.discount_percentage}
            commissionRate={dashboard.tier?.current_rate}
            usageCount={dashboard.creator_code?.usage_count}
            tierName={dashboard.tier?.name}
          />
        </div>

        {/* Tier + progress to next milestone — the one ink plate on the page. */}
        <div className="rounded-[2px] border-2 border-[#121212] bg-[#121212] p-[20px] text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="brut-label text-[#B3101C]">Your tier</p>
              <p className="mt-[8px] flex flex-wrap items-baseline gap-x-[10px]">
                {/* The tier name is the one piece of status on this page, so it
                    is set in the house display serif rather than body Poppins —
                    the same treatment the creator saw on onboarding. Instrument
                    Serif's default weight is the intended one; font-medium here
                    would pull a second file for no gain. */}
                <span
                  className="text-[34px] leading-[0.95] tracking-tight uppercase"
                  style={serif}
                >
                  {hasTier ? tierName : 'No tier yet'}
                </span>
                <span className="text-[11px] font-bold tracking-[0.14em] text-white/60 uppercase">
                  {fmtPct(currentRate)} commission
                </span>
              </p>
            </div>
            <Link
              href="/creators/dashboard/tier-upgrade"
              className="brut-press shrink-0 rounded-[2px] border-2 border-white bg-white px-[16px] py-[10px] text-[11px] font-bold tracking-[0.14em] text-[#121212] uppercase"
            >
              {hasTier ? 'Tiers' : 'Get a tier'}
            </Link>
          </div>

          {hasNextMilestone && (
            <div className="mt-[20px]">
              <div className="flex items-center justify-between text-[11px] font-bold tracking-[0.1em] text-white/60 uppercase">
                <span>
                  {ordersPlaced.toLocaleString()}{' '}
                  {ordersPlaced === 1 ? 'order' : 'orders'} so far
                </span>
                <span>Next: {nextTierName}</span>
              </div>
              <div className="mt-[10px] h-[10px] overflow-hidden rounded-[2px] border-2 border-white/25 bg-white/10">
                <div
                  className="h-full bg-[#B3101C] transition-all duration-500"
                  style={{ width: `${Math.round(tierProgress * 100)}%` }}
                />
              </div>
              <p className="mt-[10px] text-[12px] leading-relaxed text-white/70">
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
            <p className="mt-[14px] text-[12px] leading-relaxed text-white/70">
              You&apos;re at our top tier — you earn our highest commission
              rate.
            </p>
          )}
        </div>

        {/* First-time guidance — only before any activity */}
        {!hasActivity && (
          <div className="brut-plate p-[20px]">
            <IndexHead n="01" title="Start earning" />
            <p className="mt-[10px] text-[13px] leading-relaxed text-[#5C544A]">
              Here&apos;s how your code turns into commission.
            </p>
            <ol className="mt-[18px] space-y-[14px]">
              {[
                'Share your code or link with your audience.',
                `They get ${fmtPct(discountPct)} off at checkout.`,
                `You earn ${fmtPct(
                  currentRate,
                )} of every order, paid to your wallet.`,
              ].map((step, i) => (
                <li key={i} className="flex items-baseline gap-x-[12px]">
                  {/* The IndexHead idiom, reused: crimson index, no chrome. */}
                  <span className="shrink-0 text-[12px] font-bold tracking-[0.08em] text-[#B3101C]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[14px] leading-relaxed text-[#121212]">
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
            <div key={index} className="brut-plate p-[20px]">
              <div className="mb-[14px] w-fit rounded-[2px] bg-[#121212] p-[10px]">
                {stat.icon}
              </div>
              {/* Ink, not crimson: three crimson figures side by side would
                  spend the accent on nothing. */}
              <div
                className="text-[30px] leading-[0.95] tracking-tight text-[#121212]"
                style={serif}
              >
                {stat.value}
              </div>
              <div className="mt-[8px] text-[14px] font-bold text-[#121212]">
                {stat.label}
              </div>
              <div className="text-[13px] text-[#5C544A]">{stat.hint}</div>
            </div>
          ))}
        </div>

        {/* Earnings by month — only once there's something to show */}
        {hasActivity && (
          <div className="brut-plate p-[20px]">
            <div className="flex items-baseline justify-between gap-4">
              <div
                className="text-[24px] leading-[0.95] tracking-tight text-[#121212] uppercase"
                style={serif}
              >
                Commission by month
              </div>
              <Link
                href="/creators/dashboard/request-payout"
                className="shrink-0 text-[11px] font-bold tracking-[0.14em] text-[#B3101C] uppercase underline underline-offset-2"
              >
                Withdraw
              </Link>
            </div>
            <p className="mt-[8px] text-[13px] text-[#5C544A]">
              {naira(balance)} available to withdraw now.
            </p>
            <div className="scrollbar-hide relative max-w-full overflow-x-auto pt-[20px] md:overflow-x-hidden md:px-[10px]">
              <div className="min-w-[600px]">
                <Bar data={barData} options={barOptions} />
                {!hasEarningsData && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="rounded-[2px] border-2 border-[#121212] bg-[#F5F0E8] px-5 py-3 text-center">
                      <p className="brut-label">No earnings yet</p>
                      <p className="mt-1 text-[12px] text-[#5C544A]">
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
