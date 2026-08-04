import { cookies } from 'next/headers';
import Link from 'next/link';
import type { Metadata } from 'next';
import Nav from '@/components/home/nav/Nav';
import Footer from '@/components/footer';
import { getMyReferral } from './actions';
import SwazLoopClient from './SwazLoopClient';
import { NOINDEX } from '@/lib/seo';

export const runtime = 'nodejs';

// This page is the signed-in Swaz Loop dashboard: it reads cookies and renders
// the visitor's own referral link, so there is nothing stable for a crawler to
// index. /creators/swaz-loop is the public explainer that ranks for the topic.
export const metadata: Metadata = {
  title: 'Swaz Loop — Invite friends, earn store credit',
  description:
    'Share your link. When a friend places their first paid order, you earn 10% of it as store credit (up to ₦10,000). They get ₦1,000 off too.',
  ...NOINDEX,
};

const serif = { fontFamily: 'var(--font-luxe, Georgia, serif)' } as const;

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
      <p className="text-[12px] font-medium uppercase tracking-[0.34em] text-[#9C6F2E]">
        The Swaz Loop
      </p>
      <h1 className="mt-5 text-[34px] leading-[1.08] tracking-tight sm:text-[44px]" style={serif}>
        {title}
      </h1>
      <p className="mt-5 max-w-[440px] text-[15px] leading-relaxed text-[#5C544A]">
        {body}
      </p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-8 inline-flex h-[53px] items-center justify-center rounded-[10px] bg-[#14110E] px-10 text-[13px] font-bold uppercase text-[#F4F1EA] transition-all duration-300 ease-out hover:bg-[#2a2a2a] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] active:scale-[0.98]"
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
        <main className="bg-[#F4F1EA] text-[#14110E]">
          <CenteredMessage
            title="Invite friends, earn store credit"
            body="Share your link and when a friend places their first paid order, you earn 10% of it as store credit (up to ₦10,000) — they get ₦1,000 off too. Log in to get your unique link."
            cta={{
              href: '/auth/login?callbackUrl=/swaz-loop',
              label: 'Log in to get your link',
            }}
          />
        </main>
        <Footer />
      </>
    );
  }

  const result = await getMyReferral();

  if (!result.success) {
    return (
      <>
        <Nav />
        <main className="bg-[#F4F1EA] text-[#14110E]">
          <CenteredMessage
            title="We couldn’t load your Swaz Loop"
            body="Something went wrong fetching your referral details. Please refresh the page or try again shortly."
            cta={{ href: '/swaz-loop', label: 'Try again' }}
          />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="bg-[#F4F1EA] text-[#14110E]">
        <SwazLoopClient referral={result.data} />
      </main>
      <Footer />
    </>
  );
}
