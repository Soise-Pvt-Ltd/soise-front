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

/**
 * PRESSED INK — the referral hub shell. Renders inside the global site
 * Nav/Footer, so there is no standalone masthead bar: the bone ground, the
 * plates and the crimson accent carry the language on their own.
 */
const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

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
    <div className="mx-auto flex min-h-[60vh] max-w-[880px] flex-col justify-center px-5 py-[64px]">
      <div className="brut-rise">
        <p className="brut-label text-[#B3101C]">The Swaz Loop</p>
        <h1
          className="mt-4 text-[44px] leading-[0.95] tracking-tight uppercase sm:text-[68px]"
          style={serif}
        >
          {title}
          <span className="text-[#B3101C]">.</span>
        </h1>
        <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-[#3F3830]">
          {body}
        </p>
        {cta && (
          <div className="mt-9 sm:max-w-[340px]">
            <Link href={cta.href} className="brut-btn brut-press">
              {cta.label}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function SwazLoopPage() {
  const isLoggedIn = (await cookies()).has('access_token');

  if (!isLoggedIn) {
    return (
      <>
        <Nav />
        <main className="min-h-screen bg-[#F5F0E8] text-[#121212]">
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
        <main className="min-h-screen bg-[#F5F0E8] text-[#121212]">
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
      <main className="min-h-screen bg-[#F5F0E8] text-[#121212]">
        <SwazLoopClient referral={result.data} />
      </main>
      <Footer />
    </>
  );
}
