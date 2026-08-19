'use client';

import { useState } from 'react';
import { Toaster } from 'sonner';
import { useRouter } from 'next/navigation';
import { showToast } from '@/lib/toast-utils';
import { submitTierUpgrade } from './actions';
import CreatorNav from '@/components/creators/CreatorNav';

type Req = {
  id: string;
  follower_count?: number;
  social_handle?: string;
  status?: string;
  review_note?: string;
  created_at?: string;
};

/** Playfair Display — the Ivory House display face. */
const luxe = { fontFamily: 'var(--font-luxe, Georgia, serif)' } as const;

/** Shared field styling — the house form block. */
const FIELD =
  'w-full appearance-none rounded-[10px] border border-[#2A2A2D] bg-[#121214] px-4 py-3 text-[14px] text-[#F4F1EA] outline-none transition-colors placeholder-[#5C584F] focus:border-[#C4AA6E] focus:ring-0';

// State by the one gold accent and by tone, not a hue palette: the request
// that came good is gold, one still under review is a muted ivory wash, and a
// rejection carries the restrained red as type only.
const statusStyle: Record<string, string> = {
  pending:
    'inline-flex rounded-full bg-[#F4F1EA]/8 px-[12px] py-[5px] text-[10px] font-medium tracking-[0.14em] text-[#9F9A8E] uppercase',
  approved:
    'inline-flex rounded-full bg-[#C4AA6E]/12 px-[12px] py-[5px] text-[10px] font-medium tracking-[0.14em] text-[#C4AA6E] uppercase',
  rejected:
    'inline-flex rounded-full bg-[#C0362C]/12 px-[12px] py-[5px] text-[10px] font-medium tracking-[0.14em] text-[#C0362C] uppercase',
};

const NEUTRAL_STATUS =
  'inline-flex rounded-full bg-[#F4F1EA]/8 px-[12px] py-[5px] text-[10px] font-medium tracking-[0.14em] text-[#9F9A8E] uppercase';

export default function TierUpgradeClient({ initialRequests }: { initialRequests: Req[] }) {
  const router = useRouter();
  const [requests, setRequests] = useState<Req[]>(initialRequests || []);
  const [followers, setFollowers] = useState('');
  const [handle, setHandle] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasPending = requests.some((r) => r.status === 'pending');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(followers.replace(/\D/g, ''), 10);
    if (!count || count < 0) {
      showToast.error('Enter your current follower count.');
      return;
    }
    setSubmitting(true);
    const res = await submitTierUpgrade(count, handle || undefined, note || undefined);
    setSubmitting(false);
    if (res.success) {
      showToast.success('Tier-upgrade request submitted for review.');
      setFollowers(''); setHandle(''); setNote('');
      router.refresh();
      setRequests((prev) => [
        { id: 'new', follower_count: count, social_handle: handle, status: 'pending' },
        ...prev,
      ]);
    } else {
      showToast.error(res.error || 'Could not submit request.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E10] text-[#F4F1EA]">
      <Toaster position="top-center" richColors />
      <CreatorNav />
      <div className="mx-auto max-w-xl px-[20px] py-[48px]">
        <p className="text-[12px] font-medium tracking-[0.32em] text-[#C4AA6E] uppercase">
          Tier upgrade
        </p>
        <h1
          className="mt-5 text-[40px] leading-[1.08] font-medium tracking-tight sm:text-[52px]"
          style={luxe}
        >
          Request a tier upgrade
        </h1>
        <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-[#B7B2A6]">
          Grown your social following? Submit your latest numbers and our team will
          review you for a higher commission tier.
        </p>

        {hasPending ? (
          <div className="mt-8 rounded-[16px] border border-[#C4AA6E]/40 bg-[#121214] p-6">
            <span className="text-[12px] font-medium tracking-[0.28em] text-[#C4AA6E] uppercase">
              Under review
            </span>
            <p className="mt-3 text-[14px] leading-relaxed text-[#9F9A8E]">
              You have a request under review. We&apos;ll update you once it&apos;s decided.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <input
              className={FIELD}
              inputMode="numeric"
              placeholder="Current follower count (e.g. 52000)"
              value={followers}
              onChange={(e) => setFollowers(e.target.value.replace(/\D/g, ''))}
              required
            />
            <input
              className={FIELD}
              placeholder="Social handle (e.g. @yourname on Instagram)"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
            <textarea
              className={`${FIELD} min-h-[110px]`}
              placeholder="Anything else we should know? (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full cursor-pointer items-center justify-center rounded-full bg-[#C4AA6E] px-8 py-3.5 text-[14px] font-semibold tracking-wide text-[#0E0E10] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Submitting…' : 'Submit for review'}
            </button>
          </form>
        )}

        {requests.length > 0 && (
          <div className="mt-12">
            <p className="text-[12px] font-medium tracking-[0.28em] text-[#C4AA6E] uppercase">
              Your requests
            </p>
            {/* A hairline-divided grid: the 1px gaps ARE the rules. */}
            <div className="mt-5 grid gap-px overflow-hidden rounded-[16px] border border-[#1F1F22] bg-[#1F1F22]">
              {requests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-4 bg-[#121214] p-6"
                >
                  <div>
                    <div
                      className="text-[24px] leading-tight font-medium tracking-tight text-[#F4F1EA]"
                      style={luxe}
                    >
                      {(r.follower_count ?? 0).toLocaleString()} followers
                    </div>
                    {r.social_handle && (
                      <div className="mt-[6px] text-[13px] text-[#9F9A8E]">{r.social_handle}</div>
                    )}
                    {r.review_note && (
                      <div className="mt-1 text-[13px] text-[#9F9A8E]">Note: {r.review_note}</div>
                    )}
                  </div>
                  <span className={`shrink-0 ${statusStyle[r.status || 'pending'] || NEUTRAL_STATUS}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
