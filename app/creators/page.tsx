import type { Metadata } from 'next';
import CreatorsApplicationClient from './creatorsClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Become a Creator · Swaz Creator Program',
  description:
    'Apply to the Swaz Creator Program — your own SOISE code, cash commission on every sale, and first access to every drop before it’s public.',
  path: '/creators',
  ogTitle: 'Become a Creator — SOISE',
  ogDescription:
    'Your own code, cash commission on every sale, and first access to every drop. Apply to the Swaz Creator Program.',
});

/** Playfair Display — the Ivory House display face. */
const serif = { fontFamily: 'var(--font-luxe, Georgia, serif)' } as const;

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
    <main className="min-h-screen bg-[#0E0E10] text-[#F4F1EA]">
      {/* Top bar */}
      <div className="mx-auto flex max-w-[980px] items-center justify-between px-6 pt-8">
        <Link href="/" aria-label="Back to shop">
          <Image
            src="/main-logo.png"
            alt="Soise"
            width={44}
            height={44}
            className="h-[40px] w-[40px] object-contain"
          />
        </Link>
        <Link
          href="/"
          className="rounded-full border border-[#3A3A3D] px-4 py-2 text-[12px] font-medium tracking-wide text-[#D8D3C7] uppercase transition-colors hover:border-[#C4AA6E] hover:text-[#F4F1EA]"
        >
          Back to shop
        </Link>
      </div>

      <div className="mx-auto flex max-w-[560px] flex-col items-center px-6 py-28 text-center">
        {/* Under review is the gold, attention state; not approved is the one
            restrained negative — carried by type alone, never a fill. */}
        <p
          className={`text-[12px] font-medium tracking-[0.32em] uppercase ${
            tone === 'pending' ? 'text-[#C4AA6E]' : 'text-[#C0362C]'
          }`}
        >
          {tone === 'pending' ? 'Under review' : 'Not approved'}
        </p>
        <h1
          className="mt-4 text-[32px] leading-[1.1] font-medium tracking-tight sm:text-[42px]"
          style={serif}
        >
          {title}
        </h1>
        <p className="mt-5 max-w-[420px] text-[15px] leading-relaxed text-[#9F9A8E]">
          {body}
        </p>
        <Link
          href="/"
          className="mt-9 w-full rounded-full bg-[#F4F1EA] px-8 py-3.5 text-[14px] font-semibold tracking-wide text-[#0E0E10] transition-transform hover:scale-[1.02] sm:w-auto"
        >
          Back to Home
        </Link>
      </div>
    </main>
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
        <div className="border-y border-[#1C1C1F] bg-[#121214] px-6 py-3 text-center text-[12px] leading-relaxed text-[#B7B2A6]">
          You need an approved creator account to access the Creator Portal —
          apply below to get started.
        </div>
      )}
      <CreatorsApplicationClient />
    </>
  );
}
