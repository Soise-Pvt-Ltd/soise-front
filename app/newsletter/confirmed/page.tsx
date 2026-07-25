import Link from 'next/link';
import Footer from '@/components/footer';
import Nav from '@/components/home/nav/Nav';

import type { Metadata } from 'next';
import { NOINDEX } from '@/lib/seo';

// Landing page for the double opt-in confirmation link. Transactional and
// reachable only from an emailed token — no search value, so keep it out of
// the index (robots.txt alone can't prevent URL-only indexing).
export const metadata: Metadata = NOINDEX;

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

  return (
    <div className="min-h-screen bg-white">
      <Nav />

      <main className="mx-auto max-w-[720px] px-[20px] pt-[120px] pb-[160px]" role="main">
        <p className="mb-[24px] text-[11px] tracking-[0.2em] text-[#8A8371] uppercase">
          {copy.eyebrow}
        </p>

        <h1 className="font-display mb-[28px] text-[40px] leading-[1.15] text-[#121212] md:text-[56px]">
          {copy.title}
        </h1>

        <p className="max-w-[520px] text-[16px] leading-[1.7] text-[#55534E]">{copy.body}</p>

        <div className="mt-[48px] flex flex-col gap-[12px] sm:flex-row">
          <Link
            href="/shop"
            className="inline-flex h-[48px] items-center justify-center rounded-[10px] bg-[#121212] px-[32px] text-[13px] tracking-[0.1em] text-white uppercase transition-opacity hover:opacity-90"
          >
            Shop the collection
          </Link>
          <Link
            href="/"
            className="inline-flex h-[48px] items-center justify-center rounded-[10px] border border-[#AEAEB2] px-[32px] text-[13px] tracking-[0.1em] text-[#121212] uppercase transition-colors hover:border-[#121212]"
          >
            Back home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
