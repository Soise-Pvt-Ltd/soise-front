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

/** Instrument Serif — the Pressed Ink display face. */
const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

// State by ink weight and the one accent, not a hue palette: an approved
// request is the ink-filled plate, a rejected one carries the crimson, and a
// request still under review is the hand-inked crimson stamp.
const statusStyle: Record<string, string> = {
  pending: 'brut-stamp',
  approved:
    'inline-flex rounded-[2px] border-2 border-[#121212] bg-[#121212] px-[8px] py-[3px] text-[10px] font-bold tracking-[0.18em] text-white uppercase',
  rejected:
    'inline-flex rounded-[2px] border-2 border-[#B3101C] bg-white px-[8px] py-[3px] text-[10px] font-bold tracking-[0.18em] text-[#B3101C] uppercase',
};

const NEUTRAL_STATUS =
  'inline-flex rounded-[2px] border-2 border-[#121212] bg-white px-[8px] py-[3px] text-[10px] font-bold tracking-[0.18em] text-[#5C544A] uppercase';

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
    <div className="min-h-screen bg-[#F5F0E8] text-[#121212]">
      <Toaster position="top-center" richColors />
      <CreatorNav />
      <div className="mx-auto max-w-xl px-[20px] py-[48px]">
        <p className="brut-label text-[#B3101C]">Tier upgrade</p>
        <h1
          className="mt-4 text-[44px] leading-[0.95] tracking-tight uppercase sm:text-[56px]"
          style={serif}
        >
          Request a tier upgrade<span className="text-[#B3101C]">.</span>
        </h1>
        <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-[#3F3830]">
          Grown your social following? Submit your latest numbers and our team will
          review you for a higher commission tier.
        </p>

        {hasPending ? (
          <div className="brut-plate mt-8 p-5 text-[14px] leading-relaxed text-[#3F3830]">
            <span className="brut-stamp">Under review</span>
            <p className="mt-3">
              You have a request under review. We&apos;ll update you once it&apos;s decided.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <input
              className="brut-input"
              inputMode="numeric"
              placeholder="Current follower count (e.g. 52000)"
              value={followers}
              onChange={(e) => setFollowers(e.target.value.replace(/\D/g, ''))}
              required
            />
            <input
              className="brut-input"
              placeholder="Social handle (e.g. @yourname on Instagram)"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
            <textarea
              className="brut-input !h-auto min-h-[110px] py-3"
              placeholder="Anything else we should know? (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button type="submit" disabled={submitting} className="brut-btn brut-press">
              {submitting ? 'Submitting…' : 'Submit for review'}
            </button>
          </form>
        )}

        {requests.length > 0 && (
          <div className="mt-10">
            <div className="flex items-baseline gap-x-3">
              <span className="text-[12px] font-bold tracking-[0.08em] text-[#B3101C]">01</span>
              <span className="brut-label">Your requests</span>
              <span className="brut-rule mt-auto mb-[6px] flex-1 opacity-20" />
            </div>
            <div className="mt-5 space-y-4">
              {requests.map((r) => (
                <div key={r.id} className="brut-plate flex items-center justify-between gap-4 p-5">
                  <div>
                    <div className="text-[24px] leading-[1] tracking-tight text-[#121212]" style={serif}>
                      {(r.follower_count ?? 0).toLocaleString()} followers
                    </div>
                    {r.social_handle && (
                      <div className="mt-[6px] text-[12px] text-[#5C544A]">{r.social_handle}</div>
                    )}
                    {r.review_note && (
                      <div className="mt-1 text-[12px] text-[#5C544A]">Note: {r.review_note}</div>
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
