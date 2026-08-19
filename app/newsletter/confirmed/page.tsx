import Link from 'next/link';
import Footer from '@/components/footer';
import Nav from '@/components/home/nav/Nav';

import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';

// Landing page for the double opt-in confirmation link. Transactional and
// reachable only from an emailed token — no search value, so keep it out of
// the index (robots.txt alone can't prevent URL-only indexing).
export const metadata: Metadata = NOINDEX;

/**
 * PRESSED INK — the double opt-in landing. Renders inside the global site
 * Nav/Footer, so no standalone masthead bar: just the bone ground and one
 * plate carrying the whole message.
 */
const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

/** Copy for each outcome the backend can redirect here with. */
const STATES = {
  confirmed: {
    eyebrow: 'Confirmed',
    title: "You're on the list.",
    body: 'First looks at every drop, before anyone else. Your 10% welcome code is on its way to your inbox.',
  },
  already: {
    eyebrow: 'Already confirmed',
    title: "You're already on the list.",
    body: 'Nothing more to do — this address is confirmed and subscribed.',
  },
  expired: {
    eyebrow: 'Link expired',
    title: 'That link has expired.',
    body: 'Confirmation links last 7 days. Enter your email again at the bottom of any page and we’ll send a fresh one.',
  },
  invalid: {
    eyebrow: 'Link not valid',
    title: "We couldn't confirm that link.",
    body: 'It may have already been used, or been cut short by your email client. Try subscribing again from the footer of any page.',
  },
  error: {
    eyebrow: 'Something went wrong',
    title: "We couldn't confirm you just now.",
    body: 'This one is on us. Try the link again in a moment, or email hello@soise.ng and we’ll sort it out.',
  },
} as const;

type StateKey = keyof typeof STATES;

export default async function NewsletterConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const params = await searchParams;
  const key = (params.state ?? '') as StateKey;
  const copy = STATES[key] ?? STATES.invalid;

  // Every state's headline already ends in a full stop. Split it off so the
  // house signature (a crimson period closing the h1) can be inked without
  // touching a single character of the copy.
  const stop = copy.title.endsWith('.');
  const headline = stop ? copy.title.slice(0, -1) : copy.title;

  return (
    <div className="min-h-screen bg-[#F5F0E8] text-[#121212]">
      <Nav />

      <main className="mx-auto max-w-[720px] px-5 pt-[96px] pb-[140px]" role="main">
        {/* One plate does all the work here — the page has a single thing to
            say, so it says it on a single sheet. */}
        <div className="brut-rise brut-plate brut-shadow px-6 py-9 sm:px-10 sm:py-12">
          <span className="brut-stamp">{copy.eyebrow}</span>

          <h1
            className="mt-6 text-[40px] leading-[0.95] tracking-tight uppercase md:text-[64px]"
            style={serif}
          >
            {headline}
            {stop && <span className="text-[#B3101C]">.</span>}
          </h1>

          <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-[#3F3830]">
            {copy.body}
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/shop" className="brut-btn brut-press">
              Shop the collection
            </Link>
            <Link href="/" className="brut-btn-paper brut-press">
              Back home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
