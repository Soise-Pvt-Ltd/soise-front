export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { fetchProspectStats, fetchProspects } from './prospects/actions';

const STAGES = [
  { key: 'sourced', label: 'Sourced' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'replied', label: 'Replied' },
  { key: 'applied', label: 'Applied' },
  { key: 'onboarded', label: 'Onboarded' },
];

const TIER_STYLES: Record<string, string> = {
  A: 'bg-[#E8F6EE] text-[#1E7A45]',
  B: 'bg-[#FBF4E0] text-[#9A7B12]',
  C: 'bg-[#F1F1F3] text-[#6B6B70]',
  unscored: 'bg-[#F1F1F3] text-[#9A9AA0]',
};

export default async function TeamOverviewPage() {
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
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#0072BB]">
          Swaz Creator Program
        </p>
        <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-[#121212]">
          Outreach Overview
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#6B6B70]">
          Your team’s workspace for finding, scoring, and inviting creators into
          the Swaz Loop. New here? Start with the{' '}
          <Link href="/team/playbook" className="font-medium text-[#0072BB] hover:underline">
            Playbook
          </Link>
          .
        </p>
      </header>

      {/* Top stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total prospects" value={stats.total || 0} />
        <Stat label="A-tier" value={byTier['A'] || 0} accent="#1E7A45" />
        <Stat label="Onboarded" value={onboarded} accent="#0072BB" />
        <Stat label="Contact → onboard" value={`${conv}%`} />
      </div>

      {/* Pipeline funnel */}
      <section className="mt-8 rounded-[14px] border border-[#ECECEF] bg-white p-5">
        <h2 className="text-[14px] font-semibold text-[#121212]">Pipeline</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {STAGES.map((s) => (
            <div
              key={s.key}
              className="rounded-[10px] border border-[#F0F0F2] bg-[#FAFBFC] px-3 py-3"
            >
              <div className="text-[22px] font-semibold text-[#121212]">
                {byStage[s.key] || 0}
              </div>
              <div className="mt-0.5 text-[12px] text-[#8A8A8F]">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Link
            href="/team/prospects"
            className="inline-flex items-center gap-1.5 rounded-[9px] bg-[#0072BB] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#005c98]"
          >
            Open prospect log →
          </Link>
        </div>
      </section>

      {/* Recently logged */}
      <section className="mt-6 rounded-[14px] border border-[#ECECEF] bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-[#121212]">
            Recently logged
          </h2>
          <Link
            href="/team/prospects"
            className="text-[13px] font-medium text-[#0072BB] hover:underline"
          >
            View all
          </Link>
        </div>
        {recentRows.length === 0 ? (
          <p className="mt-4 text-[13px] text-[#8A8A8F]">
            No prospects yet. Head to the prospect log to add your first creator.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-[#F2F2F4]">
            {recentRows.map((p: any) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-[#121212]">
                    {p.handle}
                  </p>
                  <p className="truncate text-[12px] text-[#8A8A8F]">
                    {p.niche || p.platform}
                    {p.location ? ` · ${p.location}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[12px] capitalize text-[#8A8A8F]">
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
    <div className="rounded-[12px] border border-[#ECECEF] bg-white px-4 py-3">
      <div
        className="text-[24px] font-semibold tracking-tight"
        style={{ color: accent || '#121212' }}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[12px] text-[#8A8A8F]">{label}</div>
    </div>
  );
}
