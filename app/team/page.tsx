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

/**
 * PRESSED INK — the storefront's editorial language run through a letterpress
 * (see the brut- tokens in globals.css and app/contact/page.tsx). Ink on paper,
 * Instrument Serif display, index-numbered sections, hard offset shadows and
 * the ad creatives' crimson (#B3101C) as the only accent. Display type is
 * scaled down from the storefront's 96px masthead — this is a working
 * dashboard, not a landing page.
 */

const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

const STAGES = [
  { key: 'sourced', label: 'Sourced' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'replied', label: 'Replied' },
  { key: 'applied', label: 'Applied' },
  { key: 'onboarded', label: 'Onboarded' },
];

// Tier marks: A is the hand-inked crimson stamp, B/C are ink plates, unscored
// is the same plate with the ink pulled back. Status is carried by ink weight
// and the one accent — never by a hue palette.
const TIER_STYLES: Record<string, string> = {
  A: 'brut-stamp',
  B: 'inline-flex items-center rounded-[2px] border-2 border-[#121212] bg-white px-[8px] py-[2px] text-[10px] font-bold tracking-[0.18em] text-[#121212] uppercase',
  C: 'inline-flex items-center rounded-[2px] border-2 border-[#121212] bg-white px-[8px] py-[2px] text-[10px] font-bold tracking-[0.18em] text-[#5C544A] uppercase',
  unscored:
    'inline-flex items-center rounded-[2px] border-2 border-[#121212]/25 px-[8px] py-[2px] text-[10px] font-bold tracking-[0.18em] text-[#5C544A] uppercase',
};

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
      <header className="brut-rise mb-10">
        <p className="brut-label text-[#B3101C]">Swaz Creator Program</p>
        <h1
          className="mt-4 text-[40px] leading-[0.95] tracking-tight uppercase sm:text-[56px]"
          style={serif}
        >
          Outreach Overview<span className="text-[#B3101C]">.</span>
        </h1>
        <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-[#3F3830]">
          Your team’s workspace for finding, scoring, and inviting creators into
          the Swaz Loop. New here? Start with the{' '}
          <Link
            href="/team/playbook"
            className="font-bold text-[#B3101C] underline underline-offset-2"
          >
            Playbook
          </Link>
          .
        </p>
      </header>

      {/* Top stats */}
      <div
        className="brut-rise grid grid-cols-2 gap-3 sm:grid-cols-4"
        style={{ animationDelay: '0.08s' }}
      >
        <Stat label="Total prospects" value={stats.total || 0} />
        <Stat label="A-tier" value={byTier['A'] || 0} accent="#B3101C" />
        <Stat label="Onboarded" value={onboarded} />
        <Stat label="Contact → onboard" value={`${conv}%`} />
      </div>

      {/* Pipeline funnel */}
      <section className="brut-rise mt-12" style={{ animationDelay: '0.16s' }}>
        <IndexHead n="01" title="Pipeline" />
        {/* Ink container, 2px gaps — the gaps ARE the rules between cells. */}
        <div className="brut-plate mt-5 grid grid-cols-2 gap-[2px] bg-[#121212] sm:grid-cols-5">
          {STAGES.map((s, i) => (
            <div
              key={s.key}
              className={`bg-white px-3 py-4 ${
                i === STAGES.length - 1 ? 'col-span-2 sm:col-span-1' : ''
              }`}
            >
              <div className="text-[28px] leading-none" style={serif}>
                {byStage[s.key] || 0}
              </div>
              <div className="brut-label mt-2 text-[#5C544A]">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <Link
            href="/team/prospects"
            className="brut-press inline-flex items-center rounded-[2px] border-2 border-[#121212] bg-[#121212] px-6 py-4 text-[13px] font-bold tracking-[0.1em] text-white uppercase"
          >
            Open prospect log →
          </Link>
        </div>
      </section>

      {/* Recently logged */}
      <section className="brut-rise mt-12" style={{ animationDelay: '0.24s' }}>
        <IndexHead n="02" title="Recently logged" />
        <div className="mt-5 flex justify-end">
          <Link
            href="/team/prospects"
            className="text-[11px] font-bold tracking-[0.14em] text-[#B3101C] uppercase underline underline-offset-2"
          >
            View all
          </Link>
        </div>
        {recentRows.length === 0 ? (
          <div className="brut-plate mt-3 px-5 py-10 text-center text-[13px] text-[#5C544A]">
            No prospects yet. Head to the prospect log to add your first creator.
          </div>
        ) : (
          <ul className="brut-plate mt-3 divide-y-2 divide-[#121212]">
            {recentRows.map((p: any) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold text-[#121212]">
                    {p.handle}
                  </p>
                  <p className="truncate text-[12px] text-[#5C544A]">
                    {p.niche || p.platform}
                    {p.location ? ` · ${p.location}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-[11px] font-bold tracking-[0.14em] text-[#5C544A] uppercase">
                    {p.stage}
                  </span>
                  <span className={TIER_STYLES[p.tier] || TIER_STYLES.unscored}>
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
    <div className="brut-plate px-4 py-4">
      <div
        className="text-[30px] leading-none"
        style={{ ...serif, color: accent || '#121212' }}
      >
        {value}
      </div>
      <div className="brut-label mt-2 text-[#5C544A]">{label}</div>
    </div>
  );
}
