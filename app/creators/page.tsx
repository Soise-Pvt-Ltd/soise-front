import CreatorsApplicationClient from './creatorsClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

function StatusScreen({
  title,
  body,
  tone,
}: {
  title: string;
  body: string;
  tone: 'pending' | 'rejected';
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <Image src="/logo.png" alt="Soise" width={100} height={58} className="mb-8" />
      <span
        className={`mb-3 rounded-full px-3 py-1 text-[12px] font-medium uppercase ${
          tone === 'pending'
            ? 'bg-[#FFF4E5] text-[#B25E09]'
            : 'bg-[#FDECEC] text-[#C0362C]'
        }`}
      >
        {tone === 'pending' ? 'Under review' : 'Not approved'}
      </span>
      <h1 className="font-display text-[32px] leading-tight text-[#121212]">{title}</h1>
      <p className="mt-3 max-w-[420px] text-[14px] text-[#8E8E93]">{body}</p>
      <Link
        href="/"
        className="btn_black mt-8 flex max-w-[280px] items-center justify-center"
      >
        Back to Home
      </Link>
    </div>
  );
}

export default async function creatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const authHeaders = { Cookie: `access_token=${accessToken ?? ''}` };

  // If the user is ALREADY a creator, never show the apply form. An onboarded
  // creator (has a code) goes to their dashboard; an approved-but-not-yet-onboarded
  // creator goes to onboarding. (redirect() must be called outside try/catch — it
  // throws NEXT_REDIRECT internally, which a catch would otherwise swallow.)
  let creatorRedirect: string | null = null;
  try {
    const codesRes = await fetch(`${baseUrl}/creators/codes`, {
      headers: authHeaders,
      cache: 'no-store',
    });
    if (codesRes.ok) {
      const codes = await codesRes.json();
      const hasCode = Array.isArray(codes?.data)
        ? codes.data.length > 0
        : !!codes?.data;
      if (hasCode) creatorRedirect = '/creators/dashboard';
    }
    if (!creatorRedirect) {
      const profileRes = await fetch(`${baseUrl}/profiles`, {
        headers: authHeaders,
        cache: 'no-store',
      });
      if (profileRes.ok) {
        const profile = await profileRes.json();
        if (profile?.data?.role === 'creator') creatorRedirect = '/creators/onboarding';
      }
    }
  } catch {
    // fall through to the application-status logic below
  }
  if (creatorRedirect) redirect(creatorRedirect);

  let status: string | null = null;
  try {
    const res = await fetch(`${baseUrl}/creators/application`, {
      method: 'GET',
      headers: authHeaders,
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      status = data?.data?.status ?? null;
    }
  } catch {
    // Treat as "no application" and show the apply form.
  }

  // Approved → continue to onboarding (bank details + code generation).
  if (status === 'approved') redirect('/creators/onboarding');

  // Pending admin review — do NOT allow onboarding until approved.
  if (status === 'submitted' || status === 'review') {
    return (
      <StatusScreen
        tone="pending"
        title="Your application is under review"
        body="Thanks for applying to the Creator Experience! Our team is reviewing your application. You'll be able to set up your creator account as soon as it's approved."
      />
    );
  }

  if (status === 'rejected') {
    return (
      <StatusScreen
        tone="rejected"
        title="Application not approved"
        body="Unfortunately your creator application wasn't approved this time. If you think this was a mistake, please reach out to support."
      />
    );
  }

  // No application yet → show the apply form (with a reason banner if the user
  // was redirected here for lacking creator access).
  return (
    <>
      {reason === 'not-creator' && (
        <div className="bg-[#FFF4E5] px-6 py-3 text-center text-[13px] font-medium text-[#B25E09]">
          You need an approved creator account to access the Creator Portal —
          apply below to get started.
        </div>
      )}
      <CreatorsApplicationClient />
    </>
  );
}
