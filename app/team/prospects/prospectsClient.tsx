'use client';

import { useState, useTransition } from 'react';
import { showToast } from '@/lib/toast-utils';
import {
  fetchProspects,
  createProspect,
  updateProspect,
  deleteProspect,
  type ProspectPayload,
} from './actions';

interface Prospect {
  id: string;
  handle: string;
  platform: string;
  display_name?: string;
  profile_url?: string;
  contact?: string;
  niche?: string;
  location?: string;
  follower_count?: number;
  engagement_rate?: number;
  source?: string;
  notes?: string;
  stage: string;
  tier: string;
  total_score: number;
  score_aesthetic: number;
  score_engagement: number;
  score_audience: number;
  score_cadence: number;
  score_fit: number;
  owner_first_name?: string;
}

const PLATFORMS = ['instagram', 'tiktok', 'twitter', 'youtube', 'other'];
const STAGES = [
  'sourced',
  'contacted',
  'replied',
  'applied',
  'onboarded',
  'passed',
];
const SCORE_DIMS: { field: keyof Prospect; label: string }[] = [
  { field: 'score_aesthetic', label: 'Aesthetic fit' },
  { field: 'score_engagement', label: 'Engagement quality' },
  { field: 'score_audience', label: 'Audience overlap' },
  { field: 'score_cadence', label: 'Posting cadence' },
  { field: 'score_fit', label: 'Personal fit' },
];

const TIER_STYLES: Record<string, string> = {
  A: 'bg-[#E8F6EE] text-[#1E7A45]',
  B: 'bg-[#FBF4E0] text-[#9A7B12]',
  C: 'bg-[#F1F1F3] text-[#6B6B70]',
  unscored: 'bg-[#F1F1F3] text-[#9A9AA0]',
};

function deriveTier(scores: number[]): { total: number; tier: string } {
  const total = scores.reduce((a, b) => a + b, 0);
  if (scores.some((v) => v === 0)) return { total, tier: 'unscored' };
  return { total, tier: total >= 20 ? 'A' : total >= 14 ? 'B' : 'C' };
}

type FormState = {
  handle: string;
  platform: string;
  display_name: string;
  niche: string;
  location: string;
  contact: string;
  profile_url: string;
  follower_count: string;
  engagement_rate: string;
  source: string;
  stage: string;
  notes: string;
  score_aesthetic: number;
  score_engagement: number;
  score_audience: number;
  score_cadence: number;
  score_fit: number;
};

const BLANK: FormState = {
  handle: '',
  platform: 'instagram',
  display_name: '',
  niche: '',
  location: '',
  contact: '',
  profile_url: '',
  follower_count: '',
  engagement_rate: '',
  source: '',
  stage: 'sourced',
  notes: '',
  score_aesthetic: 0,
  score_engagement: 0,
  score_audience: 0,
  score_cadence: 0,
  score_fit: 0,
};

export default function ProspectsClient({
  initial,
  stats,
}: {
  initial: Prospect[];
  stats: { total: number; by_stage: Record<string, number>; by_tier: Record<string, number> };
}) {
  const [rows, setRows] = useState<Prospect[]>(initial);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Prospect | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  async function refresh(s = search, st = stageFilter, t = tierFilter) {
    const res = await fetchProspects(s, st, t);
    if (res.success) setRows(res.data as Prospect[]);
  }

  function openCreate() {
    setEditing(null);
    setForm(BLANK);
    setShowForm(true);
  }

  function openEdit(p: Prospect) {
    setEditing(p);
    setForm({
      handle: p.handle || '',
      platform: p.platform || 'instagram',
      display_name: p.display_name || '',
      niche: p.niche || '',
      location: p.location || '',
      contact: p.contact || '',
      profile_url: p.profile_url || '',
      follower_count: p.follower_count != null ? String(p.follower_count) : '',
      engagement_rate: p.engagement_rate != null ? String(p.engagement_rate) : '',
      source: p.source || '',
      stage: p.stage || 'sourced',
      notes: p.notes || '',
      score_aesthetic: p.score_aesthetic || 0,
      score_engagement: p.score_engagement || 0,
      score_audience: p.score_audience || 0,
      score_cadence: p.score_cadence || 0,
      score_fit: p.score_fit || 0,
    });
    setShowForm(true);
  }

  const preview = deriveTier([
    form.score_aesthetic,
    form.score_engagement,
    form.score_audience,
    form.score_cadence,
    form.score_fit,
  ]);

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form.handle.trim()) {
      showToast.error('A social handle is required.');
      return;
    }
    setSaving(true);
    const payload: ProspectPayload = {
      handle: form.handle.trim(),
      platform: form.platform,
      display_name: form.display_name || undefined,
      niche: form.niche || undefined,
      location: form.location || undefined,
      contact: form.contact || undefined,
      profile_url: form.profile_url || undefined,
      follower_count: form.follower_count ? Number(form.follower_count) : undefined,
      engagement_rate: form.engagement_rate ? Number(form.engagement_rate) : undefined,
      source: form.source || undefined,
      stage: form.stage,
      notes: form.notes || undefined,
      score_aesthetic: form.score_aesthetic,
      score_engagement: form.score_engagement,
      score_audience: form.score_audience,
      score_cadence: form.score_cadence,
      score_fit: form.score_fit,
    };
    const res = editing
      ? await updateProspect(editing.id, payload)
      : await createProspect(payload);
    setSaving(false);
    if (!res.success) {
      showToast.error(res.error || 'Something went wrong.');
      return;
    }
    showToast.success(editing ? 'Prospect updated' : 'Prospect logged');
    setShowForm(false);
    setEditing(null);
    setForm(BLANK);
    await refresh();
  }

  function changeStage(p: Prospect, stage: string) {
    // optimistic
    setRows((r) => r.map((x) => (x.id === p.id ? { ...x, stage } : x)));
    startTransition(async () => {
      const res = await updateProspect(p.id, { stage });
      if (!res.success) {
        showToast.error('Could not move stage');
        await refresh();
      }
    });
  }

  async function remove(p: Prospect) {
    if (!confirm(`Remove ${p.handle} from the prospect log?`)) return;
    setRows((r) => r.filter((x) => x.id !== p.id));
    const res = await deleteProspect(p.id);
    if (!res.success) {
      showToast.error('Could not remove');
      await refresh();
    } else {
      showToast.success('Removed');
    }
  }

  function applyFilters(next: { search?: string; stage?: string; tier?: string }) {
    const s = next.search ?? search;
    const st = next.stage ?? stageFilter;
    const t = next.tier ?? tierFilter;
    setSearch(s);
    setStageFilter(st);
    setTierFilter(t);
    startTransition(() => {
      refresh(s, st, t);
    });
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#0072BB]">
            Swaz Creator Program
          </p>
          <h1 className="mt-1 text-[24px] font-semibold tracking-tight text-[#121212]">
            Prospect Log
          </h1>
          <p className="mt-1 text-[13px] text-[#8A8A8F]">
            {stats.total} logged · {stats.by_tier?.A || 0} A-tier ·{' '}
            {stats.by_stage?.onboarded || 0} onboarded
          </p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-[9px] bg-[#0072BB] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#005c98]"
        >
          + Log a creator
        </button>
      </header>

      {/* Filter bar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => applyFilters({ search: e.target.value })}
          placeholder="Search handle, niche, location…"
          className="h-9 w-full max-w-[280px] rounded-[8px] border border-[#DADADE] px-3 text-[13px] outline-none focus:border-[#0072BB] focus:ring-1 focus:ring-[#0072BB]"
        />
        <select
          value={stageFilter}
          onChange={(e) => applyFilters({ stage: e.target.value })}
          className="h-9 rounded-[8px] border border-[#DADADE] bg-white px-2 text-[13px] capitalize outline-none focus:border-[#0072BB]"
        >
          <option value="all">All stages</option>
          {STAGES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
        <select
          value={tierFilter}
          onChange={(e) => applyFilters({ tier: e.target.value })}
          className="h-9 rounded-[8px] border border-[#DADADE] bg-white px-2 text-[13px] outline-none focus:border-[#0072BB]"
        >
          <option value="all">All tiers</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="unscored">Unscored</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[14px] border border-[#ECECEF] bg-white">
        <div className="hidden grid-cols-[1.6fr_1.2fr_0.7fr_0.7fr_1.1fr_0.6fr] gap-3 border-b border-[#F0F0F2] bg-[#FAFBFC] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#9A9AA0] md:grid">
          <div>Creator</div>
          <div>Niche / location</div>
          <div>Reach</div>
          <div>Tier</div>
          <div>Stage</div>
          <div className="text-right">Actions</div>
        </div>

        {rows.length === 0 ? (
          <div className="px-4 py-12 text-center text-[13px] text-[#9A9AA0]">
            No prospects match. Log your first creator with “+ Log a creator”.
          </div>
        ) : (
          rows.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-1 gap-2 border-b border-[#F4F4F6] px-4 py-3 last:border-0 md:grid-cols-[1.6fr_1.2fr_0.7fr_0.7fr_1.1fr_0.6fr] md:items-center md:gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[14px] font-semibold text-[#121212]">
                    {p.handle}
                  </p>
                  <span className="rounded-full bg-[#F0F0F2] px-1.5 py-0.5 text-[10px] capitalize text-[#8A8A8F]">
                    {p.platform}
                  </span>
                </div>
                {p.display_name && (
                  <p className="truncate text-[12px] text-[#8A8A8F]">
                    {p.display_name}
                  </p>
                )}
              </div>

              <div className="min-w-0 text-[13px] text-[#48484C]">
                <span className="truncate">{p.niche || '—'}</span>
                {p.location && (
                  <span className="text-[#9A9AA0]"> · {p.location}</span>
                )}
              </div>

              <div className="text-[13px] text-[#48484C]">
                {p.follower_count != null
                  ? Intl.NumberFormat('en', { notation: 'compact' }).format(
                      p.follower_count,
                    )
                  : '—'}
                {p.engagement_rate != null && (
                  <span className="text-[#9A9AA0]"> · {p.engagement_rate}%</span>
                )}
              </div>

              <div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    TIER_STYLES[p.tier] || TIER_STYLES.unscored
                  }`}
                >
                  {p.tier === 'unscored' ? '—' : p.tier}
                  {p.total_score > 0 && (
                    <span className="opacity-70">{p.total_score}/25</span>
                  )}
                </span>
              </div>

              <div>
                <select
                  value={p.stage}
                  onChange={(e) => changeStage(p, e.target.value)}
                  className="h-8 w-full max-w-[140px] rounded-[7px] border border-[#E0E0E4] bg-white px-2 text-[12px] capitalize outline-none focus:border-[#0072BB]"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-start gap-1 md:justify-end">
                <button
                  onClick={() => openEdit(p)}
                  className="rounded-[7px] px-2.5 py-1 text-[12px] font-medium text-[#0072BB] transition-colors hover:bg-[#E7F1F8]"
                >
                  Score / edit
                </button>
                <button
                  onClick={() => remove(p)}
                  aria-label="Remove prospect"
                  className="rounded-[7px] px-2 py-1 text-[12px] font-medium text-[#B0413A] transition-colors hover:bg-[#FBEEEB]"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form drawer */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div
            className="absolute inset-0"
            onClick={() => !saving && setShowForm(false)}
          />
          <form
            onSubmit={submitForm}
            className="relative h-full w-full max-w-[480px] overflow-y-auto bg-white p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[17px] font-semibold text-[#121212]">
                {editing ? 'Score / edit prospect' : 'Log a creator'}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-[7px] px-2 py-1 text-[18px] leading-none text-[#9A9AA0] hover:bg-[#F4F4F6]"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <Field label="Handle *">
                <input
                  value={form.handle}
                  onChange={(e) => setForm({ ...form, handle: e.target.value })}
                  placeholder="@ada.styles"
                  className={inputCls}
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Platform">
                  <select
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value })}
                    className={`${inputCls} capitalize`}
                  >
                    {PLATFORMS.map((p) => (
                      <option key={p} value={p} className="capitalize">
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Stage">
                  <select
                    value={form.stage}
                    onChange={(e) => setForm({ ...form, stage: e.target.value })}
                    className={`${inputCls} capitalize`}
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Display name">
                <input
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Niche">
                  <input
                    value={form.niche}
                    onChange={(e) => setForm({ ...form, niche: e.target.value })}
                    placeholder="streetwear"
                    className={inputCls}
                  />
                </Field>
                <Field label="Location">
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Lagos"
                    className={inputCls}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Followers">
                  <input
                    type="number"
                    value={form.follower_count}
                    onChange={(e) =>
                      setForm({ ...form, follower_count: e.target.value })
                    }
                    className={inputCls}
                  />
                </Field>
                <Field label="Engagement %">
                  <input
                    type="number"
                    step="0.1"
                    value={form.engagement_rate}
                    onChange={(e) =>
                      setForm({ ...form, engagement_rate: e.target.value })
                    }
                    className={inputCls}
                  />
                </Field>
              </div>

              <Field label="Contact (DM / email / phone)">
                <input
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Profile URL">
                  <input
                    value={form.profile_url}
                    onChange={(e) => setForm({ ...form, profile_url: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Source">
                  <input
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    placeholder="hashtag / own customer…"
                    className={inputCls}
                  />
                </Field>
              </div>

              {/* Scorecard */}
              <div className="mt-1 rounded-[12px] border border-[#ECECEF] bg-[#FAFBFC] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-[#121212]">
                    Scorecard
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                      TIER_STYLES[preview.tier]
                    }`}
                  >
                    {preview.tier === 'unscored'
                      ? `${preview.total}/25 · finish scoring`
                      : `Tier ${preview.tier} · ${preview.total}/25`}
                  </span>
                </div>
                <div className="space-y-2">
                  {SCORE_DIMS.map((d) => (
                    <div key={d.field} className="flex items-center justify-between gap-2">
                      <span className="text-[13px] text-[#48484C]">{d.label}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((n) => {
                          const cur = form[d.field as keyof FormState] as number;
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() =>
                                setForm({
                                  ...form,
                                  [d.field]: cur === n ? 0 : n,
                                })
                              }
                              className={`h-7 w-7 rounded-[6px] text-[12px] font-semibold transition-colors ${
                                cur >= n && cur > 0
                                  ? 'bg-[#0072BB] text-white'
                                  : 'bg-white text-[#9A9AA0] ring-1 ring-[#E0E0E4] hover:ring-[#0072BB]'
                              }`}
                              aria-label={`${d.label} ${n}`}
                            >
                              {n}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-[#9A9AA0]">
                  Click a number to set 1–5; click it again to clear. All five must
                  be set to earn a tier.
                </p>
              </div>

              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </Field>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-[9px] bg-[#0072BB] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#005c98] disabled:opacity-60"
              >
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Log prospect'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-[9px] border border-[#DADADE] px-4 py-2.5 text-[14px] font-medium text-[#48484C] transition-colors hover:bg-[#F4F4F6]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const inputCls =
  'h-9 w-full rounded-[8px] border border-[#DADADE] px-3 text-[13px] outline-none focus:border-[#0072BB] focus:ring-1 focus:ring-[#0072BB]';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-[#6B6B70]">
        {label}
      </span>
      {children}
    </label>
  );
}
