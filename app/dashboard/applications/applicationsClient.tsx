'use client';

import { useState } from 'react';
import GridContainer from '../gridContainer';
import { showToast } from '../toast';
import { fetchApplications, reviewApplication } from './actions';

type Application = {
  id: string;
  applicant_username?: string;
  applicant_email?: string;
  applicant_first_name?: string;
  applicant_last_name?: string;
  portfolio_url?: string;
  bio?: string;
  status: string;
  created_at?: string;
};

const STATUSES = ['submitted', 'approved', 'rejected', 'all'] as const;

const statusStyle: Record<string, string> = {
  submitted: 'bg-[#FFF4E5] text-[#B25E09]',
  review: 'bg-[#E8F0FE] text-[#0072BB]',
  approved: 'bg-[#E7F6EC] text-[#1A7F37]',
  rejected: 'bg-[#FDECEC] text-[#C0362C]',
};

function shortId(id: string) {
  return (id || '').split(':').pop() || id;
}

export default function ApplicationsClient({
  initialData,
  initialStatus = 'submitted',
}: {
  initialData: Application[];
  initialStatus?: string;
}) {
  const [apps, setApps] = useState<Application[]>(initialData || []);
  const [status, setStatus] = useState<string>(initialStatus);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async (next: string) => {
    setStatus(next);
    setLoading(true);
    const res = await fetchApplications(next);
    setApps(res.success ? res.data : []);
    if (!res.success) showToast('error', res.error || 'Failed to load');
    setLoading(false);
  };

  const review = async (app: Application, action: 'approve' | 'reject') => {
    if (busyId) return;
    if (action === 'reject' && !confirm(`Reject @${app.applicant_username}'s creator application?`)) return;
    setBusyId(app.id);
    const res = await reviewApplication(shortId(app.id), action);
    setBusyId(null);
    if (res.success) {
      showToast('success', `Application ${action === 'approve' ? 'approved' : 'rejected'}`);
      // Drop it from the current (status-filtered) list
      setApps((prev) => prev.filter((a) => a.id !== app.id));
    } else {
      showToast('error', res.error || 'Review failed');
    }
  };

  return (
    <GridContainer>
      <div className="px-2">
        <h1 className="text-[22px] font-bold text-[#121212]">Creator Applications</h1>
        <p className="mt-1 text-[14px] text-[#8E8E93]">
          Review and approve people applying to become creators. Approving upgrades
          their account so they can finish onboarding (bank details + code).
        </p>

        <div className="mt-5 flex gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => load(s)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-medium capitalize transition-colors ${
                status === s
                  ? 'bg-[#0072BB] text-white'
                  : 'bg-[#F5F5F5] text-[#8E8E93] hover:text-[#121212]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-5 overflow-x-auto rounded-[12px] border border-[#F0F0F0]">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr>
                <th className="thead">Applicant</th>
                <th className="thead">Portfolio</th>
                <th className="thead">Bio</th>
                <th className="thead">Status</th>
                <th className="thead">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="td p-6 text-center text-[#8E8E93]" colSpan={5}>Loading…</td></tr>
              ) : apps.length === 0 ? (
                <tr><td className="td p-6 text-center text-[#8E8E93]" colSpan={5}>No {status === 'all' ? '' : status} applications.</td></tr>
              ) : (
                apps.map((app) => (
                  <tr key={app.id} className="border-t border-[#F0F0F0]">
                    <td className="td">
                      <div className="font-medium text-[#121212]">@{app.applicant_username || '—'}</div>
                      <div className="text-[12px] text-[#8E8E93]">{app.applicant_email || ''}</div>
                    </td>
                    <td className="td max-w-[180px] truncate">
                      {app.portfolio_url ? (
                        <a href={app.portfolio_url} target="_blank" rel="noreferrer" className="text-[#0072BB] underline">
                          {app.portfolio_url}
                        </a>
                      ) : '—'}
                    </td>
                    <td className="td max-w-[260px] truncate text-[#5b5b5b]">{app.bio || '—'}</td>
                    <td className="td">
                      <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium capitalize ${statusStyle[app.status] || 'bg-[#F5F5F5] text-[#8E8E93]'}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="td">
                      {app.status === 'submitted' || app.status === 'review' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => review(app, 'approve')}
                            disabled={busyId === app.id}
                            className="rounded-[8px] bg-[#1A7F37] px-3 py-1.5 text-[13px] font-medium text-white disabled:opacity-50"
                          >
                            {busyId === app.id ? '…' : 'Approve'}
                          </button>
                          <button
                            onClick={() => review(app, 'reject')}
                            disabled={busyId === app.id}
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
