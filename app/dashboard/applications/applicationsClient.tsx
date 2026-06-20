'use client';

import { useState, useEffect, useRef } from 'react';
import GridContainer from '../gridContainer';
import { showToast } from '../toast';
import { fetchApplications, reviewApplication, allowReapplication } from './actions';

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
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const firstRender = useRef(true);

  const load = async (nextStatus = status, nextSearch = search) => {
    setStatus(nextStatus);
    setLoading(true);
    const res = await fetchApplications(nextStatus, nextSearch);
    setApps(res.success ? res.data : []);
    if (!res.success) showToast('error', res.error || 'Failed to load');
    setLoading(false);
  };

  // Debounced search by applicant name / email.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => load(status, search), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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

  const allowReapply = async (app: Application) => {
    if (busyId) return;
    if (
      !confirm(
        `Let @${app.applicant_username} re-apply now, bypassing the 30-day wait?`,
      )
    )
      return;
    setBusyId(app.id);
    const res = await allowReapplication(shortId(app.id));
    setBusyId(null);
    if (res.success) {
      showToast('success', 'Re-application enabled — they can apply again now');
    } else {
      showToast('error', res.error || 'Could not enable re-application');
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

        <div className="mt-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applicant name or email…"
            aria-label="Search applications"
            className="h-[38px] w-full max-w-[320px] rounded-[10px] border-0 bg-[#F5F5F5] px-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-[#0072BB]"
          />
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
                      ) : app.status === 'rejected' ? (
                        <button
                          onClick={() => allowReapply(app)}
                          disabled={busyId === app.id}
                          title="Bypass the 30-day cooldown so this applicant can re-apply now"
                          className="rounded-[8px] border border-[#0072BB] px-3 py-1.5 text-[13px] font-medium text-[#0072BB] transition-colors hover:bg-[#0072BB] hover:text-white disabled:opacity-50"
                        >
                          {busyId === app.id ? '…' : 'Allow re-application'}
                        </button>
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
