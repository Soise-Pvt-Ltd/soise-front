'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { submitCreatorApplication } from './actions';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { showToast } from '@/lib/toast-utils';
import StatueWatermark from '@/components/brand/StatueWatermark';

const serif = { fontFamily: 'var(--font-luxe, Georgia, serif)' } as const;

const BENEFITS = [
  {
    title: 'Your own code',
    body: 'A personal code your audience uses at checkout — they save, you earn on every order.',
  },
  {
    title: 'Cash on every sale',
    body: 'Real, withdrawable commission on every verified order placed with your code. Not points. Not credit. Cash.',
  },
  {
    title: 'First access to drops',
    body: 'Style the pieces before they’re public. Your audience sees it on you first.',
  },
  {
    title: 'Founding-creator status',
    body: 'Join early and it stays with you — better terms, and a seat at the table as SOISE grows.',
  },
];

const FIT = [
  'You already post fits, hauls, or “where I got this” content.',
  'Your audience actually replies, saves, and shows up — not just scrolls past.',
  'You want to be paid for the influence you already have, not chase a brand deal for it.',
];

export default function CreatorsApplicationClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [formData, setFormData] = useState({
    portfolioUrl: '',
    bio: '',
    niche: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.portfolioUrl || !formData.bio || !formData.niche) {
      showToast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const payload = new FormData();
    payload.append('portfolioUrl', formData.portfolioUrl);
    payload.append('bio', formData.bio);
    payload.append('niche', formData.niche);

    const result = await submitCreatorApplication(payload);
    setIsLoading(false);
    if (result?.success) {
      setSubmissionSuccess(true);
    } else {
      showToast.error(result?.error || 'An error occurred during submission. Please try again.');
    }
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <main className="relative min-h-screen overflow-hidden bg-[#0E0E10] text-[#F4F1EA]">
        <StatueWatermark
          tone="light"
          width={460}
          opacity={0.06}
          className="fixed top-1/2 left-[-110px] z-0 hidden -translate-y-1/2 lg:block"
        />

        {/* Top bar */}
        <div className="relative z-10 mx-auto flex max-w-[980px] items-center justify-between px-6 pt-8">
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

        {submissionSuccess ? (
          /* ── Success state ─────────────────────────────────── */
          <div className="relative z-10 mx-auto flex max-w-[560px] flex-col items-center px-6 py-28 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#C4AA6E] text-[22px] text-[#C4AA6E]">
              ✓
            </span>
            <p className="mt-8 text-[12px] font-medium uppercase tracking-[0.32em] text-[#C4AA6E]">
              Application received
            </p>
            <h1
              className="mt-4 text-[32px] leading-[1.1] tracking-tight sm:text-[42px]"
              style={serif}
            >
              You’re in the room. Now let’s see if you’re in the cohort.
            </h1>
            <p className="mt-5 max-w-[420px] text-[15px] leading-relaxed text-[#B7B2A6]">
              Our team reviews every application within 48 hours. The moment
              you’re approved, your code, your rate, and your first drop are
              waiting.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <button
                onClick={() => router.push('/')}
                className="w-full rounded-full bg-[#F4F1EA] px-8 py-3.5 text-[14px] font-semibold tracking-wide text-[#0E0E10] transition-transform hover:scale-[1.02] sm:w-auto"
              >
                Shop while you wait
              </button>
              <Link
                href="/creators/swaz-loop"
                className="w-full rounded-full border border-[#3A3A3D] px-8 py-3.5 text-[14px] font-medium text-[#D8D3C7] transition-colors hover:border-[#C4AA6E] hover:text-[#F4F1EA] sm:w-auto"
              >
                See how earning works
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* ── Hero ──────────────────────────────────────────── */}
            <section className="relative z-10">
              <div
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{
                  background:
                    'radial-gradient(120% 80% at 50% -10%, rgba(196,170,110,0.16), transparent 60%)',
                }}
              />
              <div className="relative mx-auto max-w-[820px] px-6 pt-14 pb-16 text-center">
                <p className="text-[12px] font-medium uppercase tracking-[0.32em] text-[#C4AA6E]">
                  The Swaz Creator Program
                </p>
                <h1
                  className="mx-auto mt-6 max-w-[680px] text-[36px] leading-[1.08] tracking-tight sm:text-[54px]"
                  style={serif}
                >
                  Your fit already moves people. Get paid for it.
                </h1>
                <p className="mx-auto mt-6 max-w-[520px] text-[15px] leading-relaxed text-[#B7B2A6] sm:text-[17px]">
                  Get your own SOISE code, real cash commission on every sale,
                  and first look at every drop — before it’s public. Apply
                  below; our team reviews every application within 48 hours.
                </p>
                <div className="mt-9">
                  <a
                    href="#apply"
                    className="inline-block w-full rounded-full bg-[#C4AA6E] px-9 py-3.5 text-[14px] font-semibold tracking-wide text-[#0E0E10] transition-transform hover:scale-[1.02] sm:w-auto"
                  >
                    Apply to become a creator
                  </a>
                </div>
              </div>
            </section>

            {/* ── Benefits ──────────────────────────────────────── */}
            <section className="relative z-10 border-t border-[#1C1C1F]">
              <div className="mx-auto max-w-[980px] px-6 py-16">
                <div className="grid gap-px overflow-hidden rounded-[16px] border border-[#1F1F22] bg-[#1F1F22] sm:grid-cols-2">
                  {BENEFITS.map((b) => (
                    <div key={b.title} className="bg-[#121214] p-7">
                      <h3 className="text-[20px] font-medium text-[#F4F1EA]" style={serif}>
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

            {/* ── Who thrives here ──────────────────────────────── */}
            <section className="relative z-10 border-t border-[#1C1C1F]">
              <div className="mx-auto max-w-[640px] px-6 py-16 text-center">
                <h2 className="text-[24px] leading-snug sm:text-[30px]" style={serif}>
                  You don’t need a million followers. You need a real one.
                </h2>
                <ul className="mx-auto mt-8 max-w-[480px] space-y-4 text-left">
                  {FIT.map((line) => (
                    <li key={line} className="flex gap-3">
                      <span className="mt-[3px] h-[6px] w-[6px] shrink-0 rounded-full bg-[#C4AA6E]" />
                      <span className="text-[14px] leading-relaxed text-[#B7B2A6]">
                        {line}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-8 text-[13px] text-[#7A766C]">
                  Not there yet? You can still earn — grab your{' '}
                  <Link href="/swaz-loop" className="font-medium text-[#C4AA6E] underline">
                    referral link
                  </Link>{' '}
                  and start banking store credit today, no application needed.
                </p>
              </div>
            </section>

            {/* ── Application form ──────────────────────────────── */}
            <section id="apply" className="relative z-10 border-t border-[#1C1C1F] bg-[#0E0E10]">
              <div className="mx-auto max-w-[560px] px-6 py-16">
                <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-[#C4AA6E]">
                  Two minutes. That’s it.
                </p>
                <h2 className="mt-3 text-[26px] leading-snug sm:text-[30px]" style={serif}>
                  Tell us who you are.
                </h2>
                <p className="mt-4 text-[14px] leading-relaxed text-[#9F9A8E]">
                  Earn cash commission on every order placed with your code.{' '}
                  <Link
                    href="/creators/swaz-loop"
                    className="font-medium text-[#C4AA6E] underline"
                  >
                    Learn how the Swaz Loop works
                  </Link>
                  .
                </p>

                <div className="mt-8 space-y-6">
                  <div>
                    <label className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#9F9A8E]">
                      Portfolio / social link
                    </label>
                    <input
                      name="portfolioUrl"
                      value={formData.portfolioUrl}
                      onChange={handleChange}
                      type="text"
                      placeholder="instagram.com/yourhandle"
                      className="mt-2 w-full rounded-[10px] border border-[#2A2A2D] bg-[#121214] px-4 py-3 text-[14px] text-[#F4F1EA] placeholder-[#5C584F] outline-none transition-colors focus:border-[#C4AA6E]"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#9F9A8E]">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="A short line on who you are and what you post."
                      className="mt-2 min-h-[100px] w-full resize-none rounded-[10px] border border-[#2A2A2D] bg-[#121214] px-4 py-3 text-[14px] text-[#F4F1EA] placeholder-[#5C584F] outline-none transition-colors focus:border-[#C4AA6E]"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#9F9A8E]">
                      Your niche
                    </label>
                    <input
                      name="niche"
                      value={formData.niche}
                      onChange={handleChange}
                      type="text"
                      placeholder="Streetwear, styling, lifestyle…"
                      className="mt-2 w-full rounded-[10px] border border-[#2A2A2D] bg-[#121214] px-4 py-3 text-[14px] text-[#F4F1EA] placeholder-[#5C584F] outline-none transition-colors focus:border-[#C4AA6E]"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isLoading || !formData.portfolioUrl || !formData.bio || !formData.niche}
                  className="mt-9 w-full rounded-full bg-[#C4AA6E] px-8 py-3.5 text-[14px] font-semibold tracking-wide text-[#0E0E10] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                >
                  {isLoading ? 'Submitting…' : 'Submit application'}
                </button>
                <p className="mt-5 text-center text-[12px] text-[#6E6A60]">
                  Reviewed within 48 hours · The Swaz Creator Program · SOISE
                </p>
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}
