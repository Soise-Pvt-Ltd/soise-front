'use client';

import { useState } from 'react';
import GridContainer from '../gridContainer';
import { showToast } from '../toast';
import { fetchTierRequests, reviewTierRequest } from './actions';

type Req = {
  id: string;
  requester_username?: string;
  code?: string;
  current_tier?: string;
  current_rate?: number;
  follower_count?: number;
  social_handle?: string;
  note?: string;
  status: string;
};

type Tier = { id: string; name: string; level?: number; base_rate?: number; max_rate?: number };

const STATUSES = ['pending', 'approved', 'rejected', 'all'] as const;
const statusStyle: Record<string, string> = {
  pending: 'bg-[#FFF4E5] text-[#B25E09]',
  approved: 'bg-[#E7F6EC] text-[#1A7F37]',
  rejected: 'bg-[#FDECEC] text-[#C0362C]',
};

function shortId(id: string) {
  return (id || '').split(':').pop() || id;
}

export default function TierRequestsClient({
  initialData,
  tiers,
}: {
  initialData: Req[];
  tiers: Tier[];
}) {
  const [reqs, setReqs] = useState<Req[]>(initialData || []);
  const [status, setStatus] = useState<string>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tierChoice, setTierChoice] = useState<Record<string, string>>({});

  const load = async (next: string) => {
    setStatus(next);
    const res = await fetchTierRequests(next);
    setReqs(res.success ? res.data : []);
    if (!res.success) showToast('error', res.error || 'Failed to load');
  };

  const review = async (req: Req, action: 'approve' | 'reject') => {
    if (busyId) return;
    setBusyId(req.id);
    const tierId = action === 'approve' ? tierChoice[req.id] : undefined;
    const res = await reviewTierRequest(shortId(req.id), action, tierId);
    setBusyId(null);
    if (res.success) {
      showToast('success', `Request ${action === 'approve' ? 'approved' : 'rejected'}`);
      setReqs((prev) => prev.filter((r) => r.id !== req.id));
    } else {
      showToast('error', res.error || 'Review failed');
    }
  };

  return (
    <GridContainer>
      <div className="px-2">
        <h1 className="text-[22px] font-bold text-[#121212]">Tier-Upgrade Requests</h1>
        <p className="mt-1 text-[14px] text-[#8E8E93]">
          Creators submit their latest social following to request a higher commission
          tier. Approve to apply their followers and auto-evaluate the tier — or pick a
          tier explicitly. Auto-evaluate is used when no tier is chosen.
        </p>

        <div className="mt-5 flex gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => load(s)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-medium capitalize ${
                status === s ? 'bg-[#0072BB] text-white' : 'bg-[#F5F5F5] text-[#8E8E93] hover:text-[#121212]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-5 overflow-x-auto rounded-[12px] border border-[#F0F0F0]">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr>
                <th className="thead">Creator</th>
                <th className="thead">Code / current tier</th>
                <th className="thead">Reported followers</th>
                <th className="thead">Status</th>
                <th className="thead">Decision</th>
              </tr>
            </thead>
            <tbody>
              {reqs.length === 0 ? (
                <tr><td className="td p-6 text-center text-[#8E8E93]" colSpan={5}>No {status === 'all' ? '' : status} requests.</td></tr>
              ) : (
                reqs.map((req) => (
                  <tr key={req.id} className="border-t border-[#F0F0F0]">
                    <td className="td font-medium text-[#121212]">@{req.requester_username || '—'}</td>
                    <td className="td">
                      <div>{req.code || '—'}</div>
                      <div className="text-[12px] text-[#8E8E93]">
                        {req.current_tier || 'no tier'} · {req.current_rate ?? '—'}%
                      </div>
                    </td>
                    <td className="td">
                      <div className="font-medium">{(req.follower_count ?? 0).toLocaleString()}</div>
                      {req.social_handle && <div className="text-[12px] text-[#8E8E93]">{req.social_handle}</div>}
                      {req.note && <div className="text-[12px] text-[#8E8E93]">“{req.note}”</div>}
                    </td>
                    <td className="td">
                      <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium capitalize ${statusStyle[req.status] || ''}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="td">
                      {req.status === 'pending' ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={tierChoice[req.id] || ''}
                            onChange={(e) => setTierChoice((p) => ({ ...p, [req.id]: e.target.value }))}
                            className="rounded-[8px] border border-[#E5E5E5] px-2 py-1.5 text-[13px]"
                          >
                            <option value="">Auto-evaluate</option>
                            {tiers.map((t) => (
                              <option key={t.id} value={shortId(t.id)}>
                                {t.name} ({t.base_rate}%)
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => review(req, 'approve')}
                            disabled={busyId === req.id}
                            className="rounded-[8px] bg-[#1A7F37] px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-50"
                          >
                            {busyId === req.id ? '…' : 'Approve'}
                          </button>
                          <button
                            onClick={() => review(req, 'reject')}
                            disabled={busyId === req.id}
                            className="rounded-[8px] border border-[#C0362C] px-3 py-1.5 text-[13px] font-medium text-[#C0362C] disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[13px] text-[#8E8E93]">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </GridContainer>
  );
}
