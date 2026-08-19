import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import StatueWatermark from '@/components/brand/StatueWatermark';
import { NOINDEX } from '@/lib/seo';

// A private invite landing page that duplicates the public /creators pitch.
// Indexing it would split ranking signals between two near-identical pages and
// publish a link that is supposed to feel personal — so /creators is the one
// that competes in search, and this stays out.
export const metadata: Metadata = {
  title: 'You’re Invited · Swaz Creator Program',
  description:
    'A private invitation to the Swaz Creator Program — your own code, commission on every sale, and early access to drops before anyone else.',
  ...NOINDEX,
};

/**
 * PRESSED INK — the invitation. This page renders NO global Nav/Footer (it is
 * a private, single-purpose landing), so it carries the full standalone shell:
 * masthead bar, bone ground, indexed sections, and one ink-filled plate for
 * the only action that matters — claiming the invitation.
 */

const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

const BENEFITS = [
  {
    title: 'Your own code',
    body: 'A personal code your audience uses at checkout — they save, you earn on every order.',
  },
  {
    title: 'Commission on every sale',
    body: 'Real earnings on each purchase made with your code, paid out to your wallet. The more you move, the higher your tier.',
  },
  {
    title: 'First access to drops',
    body: 'See and share new pieces before they’re public. Style them first; your audience follows.',
  },
  {
    title: 'Founding-creator status',
    body: 'Join the first cohort. Early creators get the best terms and an ambassador title that stays with you.',
  },
];

/** Index number + rule — the editorial section head, pressed harder. */
function IndexHead({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-x-3">
      <span className="text-[12px] font-bold tracking-[0.08em] text-[#B3101C]">
        {n}
      </span>
      <span className="brut-label">{title}</span>
      <span className="brut-rule mt-auto mb-[6px] flex-1 opacity-20" />
    </div>
  );
}

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const applyHref = `/auth/register?callbackUrl=${encodeURIComponent('/creators')}${
    ref ? `&ref=${encodeURIComponent(ref)}` : ''
  }`;
  const signInHref = `/auth/login?callbackUrl=${encodeURIComponent('/creators')}`;

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

      <div className="relative mx-auto max-w-[880px] px-5 pt-14 pb-24">
        {/* Ambient statue — the Soise muse watching over the invitation. */}
        <StatueWatermark
          tone="dark"
          width={460}
          opacity={0.05}
          className="pointer-events-none absolute top-1/2 left-[-200px] hidden -translate-y-1/2 lg:block"
        />

        {/* ── Masthead ───────────────────────────────────────────── */}
        <header className="brut-rise relative">
          {/* The muse-in-meander emblem (transparent), inked on the bone. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/swz.png"
            alt="Soise"
            className="mb-8 h-[64px] w-[64px] object-contain"
          />
          <p className="brut-label text-[#B3101C]">
            {ref ? 'Your invitation is verified' : 'By invitation'}
          </p>
          <h1
            className="mt-4 text-[46px] leading-[0.95] tracking-tight uppercase sm:text-[78px]"
            style={serif}
          >
            You’ve been invited to the Swaz Creator Program
            <span className="text-[#B3101C]">.</span>
          </h1>
          <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-[#3F3830]">
            A small, hand-picked circle of creators shaping how Nigeria wears
            SOISE. Your code, your commission, first access to every drop — and a
            founding seat while the room is still small.
          </p>

          {/* The heaviest plate on the page: the one thing we want pressed. */}
          <Link
            href={applyHref}
            className="brut-press mt-9 flex flex-col gap-1 rounded-[2px] border-2 border-[#121212] bg-[#121212] px-6 py-6 text-white sm:flex-row sm:items-baseline sm:justify-between"
          >
            <span className="text-[24px] uppercase sm:text-[32px]" style={serif}>
              Claim your invitation
            </span>
            <span className="text-[11px] font-bold tracking-[0.16em] uppercase opacity-70">
              Two minutes →
            </span>
          </Link>
          <div className="mt-4">
            <Link
              href={signInHref}
              className="brut-plate brut-press inline-flex px-5 py-3 text-[11px] font-bold tracking-[0.14em] uppercase"
            >
              I already have an account
            </Link>
          </div>
          <p className="mt-5 text-[12px] text-[#5C544A]">
            Takes two minutes. Acceptance is reviewed by our team within 48 hours.
          </p>
        </header>

        {/* ── 01 Milestone hook ──────────────────────────────────── */}
        <section className="brut-rise mt-16" style={{ animationDelay: '0.08s' }}>
          <IndexHead n="01" title="Every 10 sales" />
          <div className="brut-plate brut-shadow mt-5 px-6 py-6 sm:px-8">
            <span className="brut-stamp">₦100,000 bonus</span>
            <p className="mt-4 max-w-[52ch] text-[16px] leading-relaxed text-[#3F3830] sm:text-[18px]">
              Hit 10 verified sales on your code and you unlock ₦100,000 on top
              of your commission — added to your payout when you withdraw — plus
              fresh Soise gear from the drop, on us.
            </p>
          </div>
        </section>

        {/* ── 02 Benefits — one plate, ruled into four. ───────────── */}
        <section className="brut-rise mt-12" style={{ animationDelay: '0.16s' }}>
          <IndexHead n="02" title="What you get" />
          <div className="brut-plate brut-shadow mt-5 divide-y-2 divide-[#121212] sm:grid sm:grid-cols-2 sm:divide-y-0">
            {BENEFITS.map((b, i) => (
              <div
                key={b.title}
                className={`px-6 py-6 ${i % 2 === 1 ? 'sm:border-l-2 sm:border-[#121212]' : ''} ${
                  i >= 2 ? 'sm:border-t-2 sm:border-[#121212]' : ''
                }`}
              >
                <h3 className="text-[20px] leading-none uppercase" style={serif}>
                  {b.title}
                </h3>
                <p className="mt-3 text-[14px] leading-relaxed text-[#5C544A]">
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 03 How it works — ruled rows, not four cards. ───────── */}
        <section className="brut-rise mt-12" style={{ animationDelay: '0.24s' }}>
          <IndexHead n="03" title="How it works" />
          <ol className="brut-plate brut-shadow mt-5 divide-y-2 divide-[#121212]">
            {[
              ['Claim your invitation', 'Create your account — a minute, no more.'],
              [
                'Tell us about you',
                'Share your handle and niche so we can set you up right.',
              ],
              [
                'Get approved & onboard',
                'Our team reviews within 48 hours. Add your payout details and your code is live.',
              ],
              [
                'Share & earn',
                'Post your fits, share your code, and earn on every sale your audience makes.',
              ],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4 px-6 py-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border-2 border-[#B3101C] text-[13px] font-bold text-[#B3101C]">
                  {i + 1}
                </span>
                <div>
                  <p className="brut-label">{t}</p>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[#5C544A]">
                    {d}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-9 sm:max-w-[340px]">
            <Link href={applyHref} className="brut-btn brut-press">
              Claim your invitation
            </Link>
          </div>
        </section>

        {/* Footer line */}
        <footer
          className="brut-rise brut-rule mt-16 pt-8 text-[13px] leading-relaxed text-[#5C544A]"
          style={{ animationDelay: '0.32s' }}
        >
          <p>The Swaz Loop · SOISE — Lagos, Nigeria</p>
        </footer>
      </div>
    </main>
  );
}
