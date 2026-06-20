import Link from 'next/link';
import type { Metadata } from 'next';
import StatueWatermark from '@/components/brand/StatueWatermark';

export const metadata: Metadata = {
  title: 'You’re Invited · Swaz Creator Program',
  description:
    'A private invitation to the Swaz Creator Program — your own code, commission on every sale, and early access to drops before anyone else.',
};

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
    <main className="relative min-h-screen overflow-hidden bg-[#0E0E10] text-[#F4F1EA]">
      {/* Ambient statue — the Soise muse watching over the invitation. */}
      <StatueWatermark
        tone="light"
        width={460}
        opacity={0.06}
        className="fixed top-1/2 left-[-110px] z-0 hidden -translate-y-1/2 lg:block"
      />
      {/* Hero */}
      <section className="relative z-10 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(120% 80% at 50% -10%, rgba(196,170,110,0.18), transparent 60%)',
          }}
        />
        <div className="relative mx-auto max-w-[860px] px-6 pb-16 pt-20 text-center sm:pt-28">
          {/* The muse-in-meander emblem, inverted to read on the dark canvas. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/swz.jpg"
            alt="Soise"
            className="mx-auto mb-8 h-[72px] w-[72px] object-contain"
            style={{ filter: 'invert(1)', mixBlendMode: 'screen' }}
          />
          <p className="text-[12px] font-medium uppercase tracking-[0.32em] text-[#C4AA6E]">
            {ref ? 'Your invitation is verified' : 'By invitation'}
          </p>
          <h1
            className="mx-auto mt-6 max-w-[640px] text-[40px] font-medium leading-[1.08] tracking-tight sm:text-[58px]"
            style={{ fontFamily: 'var(--font-luxe, Georgia, serif)' }}
          >
            You’ve been invited to the Swaz Creator Program.
          </h1>
          <p className="mx-auto mt-6 max-w-[540px] text-[15px] leading-relaxed text-[#B7B2A6] sm:text-[17px]">
            A small, hand-picked circle of creators shaping how Nigeria wears
            SOISE. Your code, your commission, first access to every drop — and a
            founding seat while the room is still small.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={applyHref}
              className="w-full rounded-full bg-[#F4F1EA] px-8 py-3.5 text-[14px] font-semibold tracking-wide text-[#0E0E10] transition-transform hover:scale-[1.02] sm:w-auto"
            >
              Claim your invitation
            </Link>
            <Link
              href={signInHref}
              className="w-full rounded-full border border-[#3A3A3D] px-8 py-3.5 text-[14px] font-medium text-[#D8D3C7] transition-colors hover:border-[#C4AA6E] hover:text-[#F4F1EA] sm:w-auto"
            >
              I already have an account
            </Link>
          </div>
          <p className="mt-5 text-[12px] text-[#7A766C]">
            Takes two minutes. Acceptance is reviewed by our team within 48 hours.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-t border-[#1C1C1F] bg-[#0E0E10]">
        <div className="mx-auto max-w-[980px] px-6 py-16">
          <div className="grid gap-px overflow-hidden rounded-[16px] border border-[#1F1F22] bg-[#1F1F22] sm:grid-cols-2">
            {BENEFITS.map((b) => (
              <div key={b.title} className="bg-[#121214] p-7">
                <h3
                  className="text-[20px] font-medium text-[#F4F1EA]"
                  style={{ fontFamily: 'var(--font-luxe, Georgia, serif)' }}
                >
                  {b.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#9F9A8E]">
                  {b.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-[#1C1C1F]">
        <div className="mx-auto max-w-[760px] px-6 py-16">
          <h2
            className="text-center text-[28px] font-medium tracking-tight sm:text-[34px]"
            style={{ fontFamily: 'var(--font-luxe, Georgia, serif)' }}
          >
            How it works
          </h2>
          <ol className="mx-auto mt-10 max-w-[520px] space-y-6">
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
              <li key={t} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C4AA6E] text-[13px] font-semibold text-[#C4AA6E]">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-[#F4F1EA]">{t}</p>
                  <p className="mt-0.5 text-[14px] leading-relaxed text-[#9F9A8E]">
                    {d}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-12 text-center">
            <Link
              href={applyHref}
              className="inline-block rounded-full bg-[#C4AA6E] px-9 py-3.5 text-[14px] font-semibold tracking-wide text-[#0E0E10] transition-transform hover:scale-[1.02]"
            >
              Claim your invitation
            </Link>
            <p className="mt-6 text-[12px] text-[#6E6A60]">
              The Swaz Loop · SOISE — Lagos, Nigeria
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
