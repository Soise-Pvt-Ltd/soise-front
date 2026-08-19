export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { requireRole } from '@/lib/require-role';
import { fetchProspectStats, fetchProspects } from './prospects/actions';

import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';
// Personalised / transactional page — no search value, and indexing it would
// expose order-flow URLs. Explicit noindex (robots.txt alone can't prevent
// URL-only indexing of a linked page).
export const metadata: Metadata = NOINDEX;

const STAGES = [
  { key: 'sourced', label: 'Sourced' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'replied', label: 'Replied' },
  { key: 'applied', label: 'Applied' },
  { key: 'onboarded', label: 'Onboarded' },
];

const TIER_STYLES: Record<string, string> = {
  A: 'bg-[#E4EDE3] text-[#3D6B4A]',
  B: 'bg-[#F3E9D6] text-[#8A6218]',
  C: 'bg-[#EAE4D7] text-[#57503F]',
  unscored: 'bg-[#EAE4D7] text-[#8C8377]',
};

export default async function TeamOverviewPage() {
  await requireRole(['admin', 'outreach'], {
    deniedTo: '/',
    reason: 'team-only',
    loginCallback: '/team',
  });
  const [stats, recent] = await Promise.all([
    fetchProspectStats(),
    fetchProspects('', 'all', 'all'),
  ]);
  const byStage = stats.by_stage || {};
  const byTier = stats.by_tier || {};
  const recentRows = (recent.data || []).slice(0, 6);

  const onboarded = byStage['onboarded'] || 0;
  const contacted =
    (byStage['contacted'] || 0) +
    (byStage['replied'] || 0) +
    (byStage['applied'] || 0) +
    onboarded;
  const conv = contacted > 0 ? Math.round((onboarded / contacted) * 100) : 0;

  return (
    <div>
      <header className="mb-8">
        <p className="suite-eyebrow">Swaz Creator Program</p>
        <h1 className="suite-display mt-1 text-[28px] text-[#14110E]">
          Outreach Overview
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#5C544A]">
          Your team’s workspace for finding, scoring, and inviting creators into
          the Swaz Loop. New here? Start with the{' '}
          <Link href="/team/playbook" className="font-medium text-[#9C6F2E] hover:underline">
            Playbook
          </Link>
          .
        </p>
      </header>

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total prospects" value={stats.total || 0} />
        <Stat label="A-tier" value={byTier['A'] || 0} accent="#3D6B4A" />
        <Stat label="Onboarded" value={onboarded} accent="#9C6F2E" />
        <Stat label="Contact → onboard" value={`${conv}%`} />
      </div>

      {/* Pipeline funnel */}
      <section className="suite-panel mt-8 p-5">
        <h2 className="text-[14px] font-semibold text-[#14110E]">Pipeline</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {STAGES.map((s) => (
            <div
              key={s.key}
              className="rounded-[10px] border border-[#E2DBCC]/50 bg-[#F4F1EA] px-3 py-3"
            >
              <div className="suite-display text-[22px] text-[#14110E]">
                {byStage[s.key] || 0}
              </div>
              <div className="mt-0.5 text-[12px] text-[#8C8377]">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Link href="/team/prospects" className="suite-btn suite-btn-primary">
            Open prospect log →
          </Link>
        </div>
      </section>

      {/* Recently logged */}
      <section className="suite-panel mt-6 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-[#14110E]">
            Recently logged
          </h2>
          <Link
            href="/team/prospects"
            className="text-[13px] font-medium text-[#9C6F2E] hover:underline"
          >
            View all
          </Link>
        </div>
        {recentRows.length === 0 ? (
          <p className="mt-4 text-[13px] text-[#8C8377]">
            No prospects yet. Head to the prospect log to add your first creator.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[#E2DBCC]/50">
            {recentRows.map((p: any) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-[#14110E]">
                    {p.handle}
                  </p>
                  <p className="truncate text-[12px] text-[#8C8377]">
                    {p.niche || p.platform}
                    {p.location ? ` · ${p.location}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[12px] capitalize text-[#8C8377]">
                    {p.stage}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      TIER_STYLES[p.tier] || TIER_STYLES.unscored
                    }`}
                  >
                    {p.tier === 'unscored' ? '—' : p.tier}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="suite-panel px-4 py-3">
      <div
        className="suite-display text-[24px]"
        style={{ color: accent || '#14110E' }}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[12px] text-[#8C8377]">{label}</div>
    </div>
  );
}
