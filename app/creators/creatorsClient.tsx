'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { submitCreatorApplication } from './actions';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { showToast } from '@/lib/toast-utils';
import StatueWatermark from '@/components/brand/StatueWatermark';

/**
 * PRESSED INK — the creator pitch, letterpressed. This page used to be the one
 * dark gold-on-charcoal surface left in the app, a register of its own that
 * predated both design systems. It now speaks the same language as /contact and
 * the checkout: bone paper, 2px ink rules, Instrument Serif, one crimson accent.
 *
 * The watermark flipped to `tone="dark"` because the ground went from ink to
 * paper — a light statue on bone is invisible.
 */

const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

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
      <main className="relative min-h-screen overflow-hidden bg-[#F5F0E8] text-[#121212]">
        <StatueWatermark
          tone="dark"
          width={460}
          opacity={0.05}
          className="fixed top-1/2 left-[-110px] z-0 hidden -translate-y-1/2 lg:block"
        />

        {/* Masthead bar */}
        <div className="relative z-10 mx-auto flex max-w-[880px] items-center justify-between px-5 pt-7">
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

        {submissionSuccess ? (
          /* ── Success state ─────────────────────────────────── */
          <div className="relative z-10 mx-auto max-w-[880px] px-5 pt-20 pb-24">
            <span className="brut-rise brut-stamp">Application received</span>
            <h1
              className="brut-rise mt-6 text-[44px] leading-[0.95] tracking-tight uppercase sm:text-[64px]"
              style={{ ...serif, animationDelay: '0.08s' }}
            >
              You’re in the room. Now let’s see if you’re in the cohort
              <span className="text-[#B3101C]">.</span>
            </h1>
            <p
              className="brut-rise mt-6 max-w-[46ch] text-[15px] leading-relaxed text-[#3F3830]"
              style={{ animationDelay: '0.16s' }}
            >
              Our team reviews every application within 48 hours. The moment
              you’re approved, your code, your rate, and your first drop are
              waiting.
            </p>
            <div
              className="brut-rise mt-10 flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: '0.24s' }}
            >
              <button
                onClick={() => router.push('/')}
                className="brut-btn brut-press sm:w-auto sm:px-[40px]"
              >
                Shop while you wait
              </button>
              <Link
                href="/creators/swaz-loop"
                className="brut-btn-paper brut-press sm:w-auto sm:px-[40px]"
              >
                See how earning works
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative z-10 mx-auto max-w-[880px] px-5 pt-14 pb-24">
            {/* ── Hero ──────────────────────────────────────────── */}
            <header className="brut-rise">
              <p className="brut-label text-[#B3101C]">
                The Swaz Creator Program
              </p>
              <h1
                className="mt-4 text-[52px] leading-[0.95] tracking-tight uppercase sm:text-[80px]"
                style={serif}
              >
                Your fit already moves people. Get paid for it
                <span className="text-[#B3101C]">.</span>
              </h1>
              <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-[#3F3830]">
                Get your own SOISE code, real cash commission on every sale,
                and first look at every drop — before it’s public. Apply
                below; our team reviews every application within 48 hours.
              </p>
              <a
                href="#apply"
                className="brut-btn brut-press mt-9 sm:w-fit sm:px-[48px]"
              >
                Apply to become a creator
              </a>
            </header>

            {/* ── Milestone hook — the loudest offer on the page, so it
                 takes the heaviest plate (ink fill, white type). ──── */}
            <section
              className="brut-rise mt-16"
              style={{ animationDelay: '0.08s' }}
            >
              <div className="brut-press rounded-[2px] border-2 border-[#121212] bg-[#121212] px-6 py-7 text-white">
                <p className="text-[11px] font-bold tracking-[0.16em] text-[#B3101C] uppercase">
                  Every 10 sales
                </p>
                <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed sm:text-[18px]">
                  Hit 10 verified sales on your code and you unlock ₦100,000 on
                  top of your commission — added to your payout when you
                  withdraw — plus fresh Soise gear from the drop, on us.
                </p>
              </div>
            </section>

            {/* ── Benefits ──────────────────────────────────────── */}
            <section
              className="brut-rise mt-14"
              style={{ animationDelay: '0.16s' }}
            >
              <IndexHead n="01" title="What you get" />
              {/* Ink-grounded grid: the 2px gaps ARE the rules between cells. */}
              <div className="brut-plate mt-5 grid gap-[2px] overflow-hidden bg-[#121212] sm:grid-cols-2">
                {BENEFITS.map((b) => (
                  <div key={b.title} className="bg-white p-6">
                    <h3 className="text-[22px] uppercase" style={serif}>
                      {b.title}
                    </h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-[#5C544A]">
                      {b.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Who thrives here ──────────────────────────────── */}
            <section
              className="brut-rise mt-14"
              style={{ animationDelay: '0.24s' }}
            >
              <IndexHead n="02" title="Who thrives here" />
              <h2
                className="mt-5 max-w-[20ch] text-[30px] leading-[1.0] tracking-tight uppercase sm:text-[40px]"
                style={serif}
              >
                You don’t need a million followers. You need a real one
                <span className="text-[#B3101C]">.</span>
              </h2>
              <ul className="brut-plate mt-6 divide-y-2 divide-[#121212]">
                {FIT.map((line) => (
                  <li key={line} className="flex gap-3 px-6 py-4">
                    <span className="mt-[7px] h-[6px] w-[6px] shrink-0 bg-[#B3101C]" />
                    <span className="text-[14px] leading-relaxed text-[#3F3830]">
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-[13px] leading-relaxed text-[#5C544A]">
                Not there yet? You can still earn — grab your{' '}
                <Link
                  href="/swaz-loop"
                  className="font-bold text-[#B3101C] underline underline-offset-2"
                >
                  referral link
                </Link>{' '}
                and start banking store credit today, no application needed.
              </p>
            </section>

            {/* ── Application form ──────────────────────────────── */}
            <section
              id="apply"
              className="brut-rise mt-14"
              style={{ animationDelay: '0.32s' }}
            >
              <IndexHead n="03" title="Two minutes. That’s it." />
              <h2
                className="mt-5 text-[30px] leading-[1.0] tracking-tight uppercase sm:text-[40px]"
                style={serif}
              >
                Tell us who you are
                <span className="text-[#B3101C]">.</span>
              </h2>
              <p className="mt-4 max-w-[46ch] text-[14px] leading-relaxed text-[#3F3830]">
                Earn cash commission on every order placed with your code.{' '}
                <Link
                  href="/creators/swaz-loop"
                  className="font-bold text-[#B3101C] underline underline-offset-2"
                >
                  Learn how the Swaz Loop works
                </Link>
                .
              </p>

              <div className="mt-8 space-y-6">
                <div>
                  <label htmlFor="portfolioUrl" className="brut-label mb-[8px] block">
                    Portfolio / social link
                  </label>
                  <input
                    id="portfolioUrl"
                    name="portfolioUrl"
                    value={formData.portfolioUrl}
                    onChange={handleChange}
                    type="text"
                    placeholder="instagram.com/yourhandle"
                    className="brut-input"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="brut-label mb-[8px] block">
                    Bio
                  </label>
                  {/* brut-input hard-sets a 56px height; a textarea needs its
                      own so the field can breathe. */}
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="A short line on who you are and what you post."
                    className="brut-input h-auto min-h-[120px] resize-none py-[14px]"
                  />
                </div>

                <div>
                  <label htmlFor="niche" className="brut-label mb-[8px] block">
                    Your niche
                  </label>
                  <input
                    id="niche"
                    name="niche"
                    value={formData.niche}
                    onChange={handleChange}
                    type="text"
                    placeholder="Streetwear, styling, lifestyle…"
                    className="brut-input"
                  />
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={isLoading || !formData.portfolioUrl || !formData.bio || !formData.niche}
                className="brut-btn brut-press mt-9"
              >
                {isLoading ? 'Submitting…' : 'Submit application'}
              </button>
              <p className="mt-5 text-center text-[12px] text-[#5C544A]">
                Reviewed within 48 hours · The Swaz Creator Program · SOISE
              </p>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
