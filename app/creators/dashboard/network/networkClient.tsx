'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Toaster } from 'sonner';
import { showToast } from '@/lib/toast-utils';
import CreatorNav from '@/components/creators/CreatorNav';
import type { Network, Recruit } from './actions';

/** Playfair Display — the Ivory House display face. */
const luxe = { fontFamily: 'var(--font-luxe, Georgia, serif)' } as const;

const naira = (n: number) =>
  `₦${(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const fmtPct = (n: unknown) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return '—';
  return Number.isInteger(v) ? `${v}%` : `${v.toFixed(1)}%`;
};

const fmtDate = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// One gold accent, spent on the state that is earning. Everything else is a
// muted ivory wash; "not approved" carries the restrained red as type only.
const STATE: Record<Recruit['state'], { label: string; cls: string }> = {
  active: {
    label: 'Earning',
    cls: 'bg-[#C4AA6E]/12 text-[#C4AA6E]',
  },
  onboarding: {
    label: 'Approved · onboarding',
    cls: 'bg-[#F4F1EA]/8 text-[#B7B2A6]',
  },
  applied: {
    label: 'Applied',
    cls: 'bg-[#F4F1EA]/8 text-[#9F9A8E]',
  },
  not_approved: {
    label: 'Not approved',
    cls: 'bg-[#C0362C]/12 text-[#C0362C]',
  },
};

export default function NetworkClient({ network }: { network: Network | null }) {
  const [copied, setCopied] = useState(false);

  if (!network) {
    return (
      <div className="min-h-screen bg-[#0E0E10] text-[#F4F1EA]">
        <CreatorNav />
        <div className="page-shell px-[16px] py-[80px] text-center text-[16px] leading-relaxed text-[#B7B2A6]">
          We couldn&apos;t load your network. Please refresh, or sign in again.
        </div>
      </div>
    );
  }

  const link = network.invite_link;
  const recruits = network.recruits || [];
  const earning = recruits.filter((r) => r.state === 'active');
  const total = network.override_earnings?.total || 0;
  const thisMonth = network.override_earnings?.this_month || 0;

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      showToast.success('Invite link copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast.error('Could not copy — long-press the link to copy it');
    }
  };

  const share = async () => {
    if (!link) return;
    const text = `I'm a SOISE creator. Join through my link and we both earn: ${link}`;
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: 'Join the Soise Creator Program', text, url: link });
        return;
      } catch {
        /* user dismissed */
      }
    }
    await copy();
  };

  return (
    <div className="min-h-screen bg-[#0E0E10] text-[#F4F1EA]">
      <Toaster position="top-center" richColors />
      <CreatorNav />
      <div className="page-shell flex flex-col gap-[20px] px-[16px] py-[28px] md:px-0">
        {/* Header */}
        <div>
          <p className="text-[12px] font-medium tracking-[0.28em] text-[#C4AA6E] uppercase">
            Your network
          </p>
          <h1
            className="mt-2 text-[30px] leading-tight font-medium tracking-tight sm:text-[38px]"
            style={luxe}
          >
            Bring in a creator. Earn on everything they sell.
          </h1>
          <p className="mt-3 max-w-[560px] text-[14px] leading-relaxed text-[#9F9A8E]">
            Every creator who joins through your link pays you{' '}
            <span className="text-[#F4F1EA]">{fmtPct(network.override_rate)}</span> of every
            order their code drives, for as long as you both hold an active code. It comes on
            top of their commission, never out of it, and lands in your wallet automatically.
          </p>
          {network.recruited_by && (
            <p className="mt-3 text-[13px] text-[#6E6A60]">
              You were brought in by{' '}
              <span className="text-[#B7B2A6]">{network.recruited_by.name || 'a Soise creator'}</span>
              .
            </p>
          )}
        </div>

        {/* Invite link */}
        <div className="rounded-[16px] bg-[#121214] p-[22px]">
          <p className="text-[12px] font-medium tracking-[0.14em] text-[#9F9A8E] uppercase">
            Your invite link
          </p>
          {link ? (
            <>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <code className="min-w-0 flex-1 truncate rounded-[10px] border border-[#2A2A2D] bg-[#0E0E10] px-4 py-3 font-mono text-[13px] text-[#F4F1EA]">
                  {link}
                </code>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copy}
                    className="rounded-full border border-[#3A3A3D] px-5 py-3 text-[13px] font-medium text-[#D8D3C7] transition-colors hover:border-[#C4AA6E] hover:text-[#F4F1EA]"
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={share}
                    className="rounded-full bg-[#C4AA6E] px-5 py-3 text-[13px] font-semibold text-[#0E0E10] transition-transform hover:scale-[1.02]"
                  >
                    Share
                  </button>
                </div>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-[#6E6A60]">
                Send it to creators you rate. They apply through it, our team reviews within 48
                hours, and the moment their code is live you start earning.
              </p>
            </>
          ) : (
            <p className="mt-3 text-[14px] text-[#B7B2A6]">
              Your invite link appears once your creator code is live.{' '}
              <Link href="/creators/onboarding" className="text-[#C4AA6E] underline underline-offset-2">
                Finish onboarding
              </Link>
              .
            </p>
          )}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-[20px] sm:grid-cols-3">
          {[
            {
              label: 'Creators you brought in',
              hint: `${earning.length} earning right now`,
              value: String(network.recruits_count || 0),
            },
            {
              label: 'Override earned',
              hint: 'Lifetime, before withdrawals',
              value: naira(total),
            },
            {
              label: 'Last 30 days',
              hint: 'Override credited this month',
              value: naira(thisMonth),
            },
          ].map((s) => (
            <div key={s.label} className="rounded-[16px] bg-[#121214] p-[22px]">
              <div
                className="text-[32px] leading-tight font-medium tracking-tight text-[#F4F1EA]"
                style={luxe}
              >
                {s.value}
              </div>
              <div className="mt-[8px] text-[15px] font-medium text-[#F4F1EA]">{s.label}</div>
              <div className="text-[14px] leading-relaxed text-[#9F9A8E]">{s.hint}</div>
            </div>
          ))}
        </div>

        {/* Recruits */}
        <div className="rounded-[16px] bg-[#121214] p-[22px]">
          <div
            className="text-[26px] leading-tight font-medium tracking-tight text-[#F4F1EA]"
            style={luxe}
          >
            Your creators
          </div>
          {recruits.length === 0 ? (
            <div className="mt-6 rounded-[12px] border border-[#1F1F22] px-6 py-10 text-center">
              <p className="text-[12px] font-medium tracking-[0.28em] text-[#C4AA6E] uppercase">
                No one yet
              </p>
              <p className="mt-2 text-[14px] text-[#9F9A8E]">
                Share your link with one creator you&apos;d vouch for. That&apos;s the whole job.
              </p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-[#1C1C1F]">
              {recruits.map((r) => {
                const st = STATE[r.state] ?? STATE.applied;
                return (
                  <div
                    key={r.user_id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#2A2A2D] text-[13px] font-semibold text-[#C4AA6E]">
                        {(r.name || '?').slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-medium text-[#F4F1EA]">
                          {r.name || 'Creator'}
                        </p>
                        <p className="truncate text-[12px] text-[#6E6A60]">
                          {r.code ? (
                            <span className="font-mono tracking-wide">{r.code}</span>
                          ) : (
                            'No code yet'
                          )}
                          {r.tier_name ? ` · ${r.tier_name}` : ''}
                          {r.joined_at ? ` · joined ${fmtDate(r.joined_at)}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-right">
                        <p className="text-[11px] tracking-[0.14em] text-[#6E6A60] uppercase">
                          Their orders
                        </p>
                        <p className="text-[14px] tabular-nums text-[#B7B2A6]">{r.orders}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] tracking-[0.14em] text-[#6E6A60] uppercase">
                          You earned
                        </p>
                        <p className="text-[14px] font-medium tabular-nums text-[#F4F1EA]">
                          {naira(r.override_earned)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 rounded-full px-[12px] py-[5px] text-[10px] font-medium tracking-[0.14em] uppercase ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent override credits */}
        {network.recent && network.recent.length > 0 && (
          <div className="rounded-[16px] bg-[#121214] p-[22px]">
            <div
              className="text-[26px] leading-tight font-medium tracking-tight text-[#F4F1EA]"
              style={luxe}
            >
              Recent override
            </div>
            <div className="mt-4 divide-y divide-[#1C1C1F]">
              {network.recent.map((row, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] text-[#F4F1EA]">
                      {row.recruit_name || 'Creator'}{' '}
                      <span className="text-[#6E6A60]">
                        · {row.creator_code}
                        {row.order_total ? ` · order ${naira(row.order_total)}` : ''}
                      </span>
                    </p>
                    <p className="text-[12px] text-[#6E6A60]">
                      {fmtDate(row.created_at)}
                      {row.meta?.override_rate ? ` · ${fmtPct(row.meta.override_rate)}` : ''}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-[14px] font-medium tabular-nums ${
                      row.status === 'cancelled'
                        ? 'text-[#6E6A60] line-through'
                        : 'text-[#F4F1EA]'
                    }`}
                  >
                    {naira(row.reward_value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
