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

/** Instrument Serif — the Pressed Ink display face. */
const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

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
    <main className="min-h-screen bg-[#F5F0E8] text-[#121212]">
      {/* Masthead bar */}
      <div className="mx-auto flex max-w-[880px] items-center justify-between px-5 pt-7">
        <Link
          href="/"
          aria-label="Back to shop"
          className="brut-plate brut-press flex h-[48px] w-[48px] items-center justify-center bg-white"
        >
          <Image
            src="/main-logo.png"
            alt="Soise"
            width={34}
            height={34}
            className="h-[30px] w-[30px] object-contain"
          />
        </Link>
        <Link
          href="/"
          className="brut-plate brut-press px-4 py-2.5 text-[11px] font-bold tracking-[0.14em] uppercase"
        >
          Back to shop
        </Link>
      </div>

      <div className="mx-auto max-w-[880px] px-5 pt-20 pb-24">
        {/* Under review is a hand-inked stamp; not approved is a plated,
            settled mark — state by ink weight and the one accent. */}
        {tone === 'pending' ? (
          <span className="brut-rise brut-stamp">Under review</span>
        ) : (
          <span className="brut-rise inline-flex rounded-[2px] border-2 border-[#121212] bg-[#121212] px-[10px] py-[4px] text-[10px] font-bold tracking-[0.18em] text-white uppercase">
            Not approved
          </span>
        )}
        <h1
          className="brut-rise mt-6 text-[56px] leading-[0.95] tracking-tight uppercase sm:text-[80px]"
          style={{ ...serif, animationDelay: '0.08s' }}
        >
          {title}
          <span className="text-[#B3101C]">.</span>
        </h1>
        <p
          className="brut-rise mt-6 max-w-[46ch] text-[15px] leading-relaxed text-[#3F3830]"
          style={{ animationDelay: '0.16s' }}
        >
          {body}
        </p>
        <Link
          href="/"
          className="brut-btn brut-press brut-rise mt-10 sm:w-fit sm:px-[48px]"
          style={{ animationDelay: '0.24s' }}
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
        <div className="border-y-2 border-[#121212] bg-[#F5F0E8] px-6 py-3 text-center text-[12px] font-bold tracking-[0.08em] text-[#121212]">
          You need an approved creator account to access the Creator Portal —
          apply below to get started.
        </div>
      )}
      <CreatorsApplicationClient />
    </>
  );
}
