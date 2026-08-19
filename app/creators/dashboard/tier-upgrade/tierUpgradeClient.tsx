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

const statusStyle: Record<string, string> = {
  pending: 'suite-badge-warn',
  approved: 'suite-badge-good',
  rejected: 'suite-badge-bad',
};

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
    <div className="min-h-screen bg-[#F4F1EA]">
      <Toaster position="top-center" richColors />
      <CreatorNav />
      <div className="mx-auto max-w-xl px-[20px] py-[48px]">
        <h1 className="suite-display text-[26px] text-[#14110E]">Request a tier upgrade</h1>
        <p className="mt-2 text-[14px] text-[#5C544A]">
          Grown your social following? Submit your latest numbers and our team will
          review you for a higher commission tier.
        </p>

        {hasPending ? (
          <div className="mt-6 rounded-[10px] bg-[#F3E9D6] p-4 text-[14px] text-[#8A6218]">
            You have a request under review. We&apos;ll update you once it&apos;s decided.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <input
              className="suite-input"
              inputMode="numeric"
              placeholder="Current follower count (e.g. 52000)"
              value={followers}
              onChange={(e) => setFollowers(e.target.value.replace(/\D/g, ''))}
              required
            />
            <input
              className="suite-input"
              placeholder="Social handle (e.g. @yourname on Instagram)"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
            <textarea
              className="suite-input !h-auto min-h-[90px] py-2"
              placeholder="Anything else we should know? (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button type="submit" disabled={submitting} className="suite-btn suite-btn-primary w-full">
              {submitting ? 'Submitting…' : 'Submit for review'}
            </button>
          </form>
        )}

        {requests.length > 0 && (
          <div className="mt-10">
            <h2 className="text-[11px] font-medium tracking-[0.18em] text-[#8C8377] uppercase">Your requests</h2>
            <div className="mt-3 space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="suite-panel flex items-center justify-between p-4">
                  <div>
                    <div className="text-[14px] font-medium text-[#14110E]">
                      {(r.follower_count ?? 0).toLocaleString()} followers
                    </div>
                    {r.social_handle && (
                      <div className="text-[12px] text-[#8C8377]">{r.social_handle}</div>
                    )}
                    {r.review_note && (
                      <div className="mt-1 text-[12px] text-[#5C544A]">Note: {r.review_note}</div>
                    )}
                  </div>
                  <span className={`suite-badge ${statusStyle[r.status || 'pending'] || 'suite-badge-neutral'}`}>
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
