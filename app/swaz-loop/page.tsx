import { cookies } from 'next/headers';
import Link from 'next/link';
import type { Metadata } from 'next';
import Nav from '@/components/home/nav/Nav';
import Footer from '@/components/footer';
import { getMyReferral } from './actions';
import SwazLoopClient from './SwazLoopClient';

export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: 'Swaz Loop — Invite friends, earn store credit',
  description:
    'Share your link. When a friend places their first paid order, you earn 10% of it as store credit (up to ₦10,000). They get ₦1,000 off too.',
};

function CenteredMessage({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-[64px] text-center">
      <span className="mb-3 inline-flex items-center gap-x-2 rounded-full bg-[#E8F1F9] px-3 py-1 text-[11px] font-medium tracking-wide text-[#0072BB] uppercase">
        Swaz Loop
      </span>
      <h1 className="font-display text-[32px] leading-tight text-[#121212]">
        {title}
      </h1>
      <p className="mt-3 max-w-[440px] text-[14px] text-[#8E8E93]">{body}</p>
      {cta && (
        <Link
          href={cta.href}
          className="btn_creators_solid mt-8 flex max-w-[280px] items-center justify-center"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

export default async function SwazLoopPage() {
  const isLoggedIn = (await cookies()).has('access_token');

  if (!isLoggedIn) {
    return (
      <>
        <Nav />
        <CenteredMessage
          title="Invite friends, earn store credit"
          body="Share your link and when a friend places their first paid order, you earn 10% of it as store credit (up to ₦10,000) — they get ₦1,000 off too. Log in to get your unique link."
          cta={{
            href: '/auth/login?callbackUrl=/swaz-loop',
            label: 'Log in to get your link',
          }}
        />
        <Footer />
      </>
    );
  }

  const result = await getMyReferral();

  if (!result.success) {
    return (
      <>
        <Nav />
        <CenteredMessage
          title="We couldn't load your Swaz Loop"
          body="Something went wrong fetching your referral details. Please refresh the page or try again shortly."
          cta={{ href: '/swaz-loop', label: 'Try again' }}
        />
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <SwazLoopClient referral={result.data} />
      <Footer />
    </>
  );
}
