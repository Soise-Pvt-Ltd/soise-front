'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CopyIcon,
  ShareIcon,
  CloseIcon,
  TagIcon,
  DollarIcon,
} from '@/components/icons';
import { showToast } from '@/lib/toast-utils';
import {
  CREATOR_CODE_PREFIX,
  CREATOR_SUFFIX_MAX,
  buildCreatorCode,
  creatorSuffixError,
  sanitizeCreatorSuffix,
} from '@/lib/creator-code';
import { changeCreatorCode } from './dashboard/actions';

interface CreatorCodeProps {
  code: string;
  /**
   * ISO timestamp of when the active code was created. The creator may only
   * change their code within 24h of this moment; after that it is permanent.
   */
  codeCreatedAt?: string | null;
  /** % the customer saves when they redeem the code */
  discountPercentage?: number | null;
  /** % the creator earns on every order placed with the code */
  commissionRate?: number | null;
  /** how many times the code has been used so far */
  usageCount?: number | null;
  /** the creator's current tier name, if any */
  tierName?: string;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/** Instrument Serif — the Pressed Ink display face. */
const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

export default function CreatorCode({
  code,
  codeCreatedAt,
  // Deliberately NOT default parameters. A default only fills in `undefined`,
  // and this data comes from the API as explicit `null` — the dashboard query
  // returns creator_code as {code: null, discount_percentage: null, ...} for
  // any creator without an ACTIVE code. `null` sailed past the defaults, so
  // fmtPct called (null).toFixed(1) and threw, which the route error boundary
  // turned into "We hit an unexpected error" for the WHOLE dashboard — a
  // creator with no active code could not see their dashboard at all.
  // Normalised with ?? below instead, which catches null and undefined.
  discountPercentage: discountPercentageProp,
  commissionRate: commissionRateProp,
  usageCount: usageCountProp,
  tierName,
}: CreatorCodeProps) {
  const discountPercentage = discountPercentageProp ?? 10;
  const commissionRate = commissionRateProp ?? 10;
  const usageCount = usageCountProp ?? 0;
  const router = useRouter();
  const [isCopied, setIsCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  // Only the tail of the code is the creator's to choose — the `SWAZ-` prefix
  // is fixed and rendered beside the field, never typed.
  const [codeSuffix, setCodeSuffix] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 24h gate, computed once on render. We only surface the "change" affordance
  // while inside the window; the server still enforces this authoritatively.
  const createdMs = codeCreatedAt ? new Date(codeCreatedAt).getTime() : NaN;
  const withinWindow =
    !Number.isNaN(createdMs) && Date.now() - createdMs < TWENTY_FOUR_HOURS_MS;
  const hoursLeft = !Number.isNaN(createdMs)
    ? Math.max(
        0,
        Math.ceil((createdMs + TWENTY_FOUR_HOURS_MS - Date.now()) / (60 * 60 * 1000)),
      )
    : 0;

  // Belt and braces: this renders inside the dashboard's only error boundary,
  // so anything that throws here costs the creator the entire page. A bad
  // number should degrade to a dash, not to a stack trace.
  const fmtPct = (n: unknown) => {
    const value = Number(n);
    if (!Number.isFinite(value)) return '—';
    return Number.isInteger(value) ? `${value}%` : `${value.toFixed(1)}%`;
  };

  const hasTier =
    !!tierName &&
    !['no tier', 'unassigned'].includes(tierName.toLowerCase());

  // A shareable link that pre-applies the code at checkout (captured by
  // RefCapture via the `?code=` param). Built at call time so we read the real
  // origin on the client without risking a hydration mismatch.
  const buildShareUrl = () => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://soise.ng';
    return `${origin}/shop/product-listing?code=${encodeURIComponent(code)}`;
  };

  const copy = async (text: string) => {
    if (isCopied) return; // Prevent multiple clicks
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000); // Revert back to icon after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const copyLink = async () => {
    if (linkCopied) return;
    try {
      await navigator.clipboard.writeText(buildShareUrl());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link: ', err);
    }
  };

  const shareMessage = `Get ${fmtPct(
    discountPercentage,
  )} off on Soise with my creator code ${code}`;

  const handleShare = async () => {
    const url = buildShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Soise Creator Code',
          text: shareMessage,
          url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copy(`${shareMessage}: ${url}`);
    }
  };

  const submitChange = async (preferred?: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = await changeCreatorCode(preferred);
      if (result.success) {
        showToast.success(
          preferred
            ? 'Your creator code has been updated.'
            : 'A new creator code has been generated.',
        );
        setShowModal(false);
        setCodeSuffix('');
        router.refresh();
      } else {
        showToast.error(result.error || 'Could not change your code.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setShowModal(false);
    setCodeSuffix('');
  };

  const suffixError = creatorSuffixError(codeSuffix);

  // No active code yet. Everything below assumes one exists: the share URL
  // becomes `?code=null`, the share message reads "my creator code null", and
  // Copy puts the string "null" on the clipboard. Say so plainly instead of
  // handing out a broken link.
  if (!code) {
    return (
      <div>
        <p className="brut-label text-[#B3101C]">Your creator code</p>
        <p className="mt-[10px] text-[24px] leading-[1.05] text-[#121212]" style={serif}>
          You don&apos;t have an active code yet
        </p>
        <p className="mt-[8px] text-[13px] leading-relaxed text-[#5C544A]">
          Once your creator code is issued it appears here, along with your
          shareable link. Contact us if you think this is a mistake.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header: label + stamp + usage */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-x-3">
          <p className="brut-label text-[#B3101C]">Your creator code</p>
          {/* The hand-inked mark: the tier a code carries, or what it saves. */}
          <span className="brut-stamp">
            {hasTier ? tierName : `${fmtPct(discountPercentage)} off`}
          </span>
        </div>
        {usageCount > 0 && (
          <span className="text-[12px] font-bold tracking-[0.1em] text-[#5C544A] uppercase">
            Used{' '}
            <span className="text-[#121212]">
              {usageCount.toLocaleString()}
            </span>{' '}
            {usageCount === 1 ? 'time' : 'times'}
          </span>
        )}
      </div>

      {/* The code — the heaviest thing in the portal: an ink plate, the code
          itself set oversized in the display serif. */}
      <div className="mt-[14px] flex items-center justify-between gap-x-[12px] rounded-[2px] border-2 border-[#121212] bg-[#121212] px-[20px] py-[20px]">
        <span
          className="truncate text-[34px] leading-[0.95] tracking-tight text-white uppercase sm:text-[46px]"
          style={serif}
        >
          {code || '—'}
        </span>
        <button
          onClick={() => copy(code)}
          className="flex shrink-0 cursor-pointer items-center gap-x-1 text-white/60 transition-colors hover:text-white"
          title="Copy creator code"
          type="button"
        >
          {isCopied ? (
            <span className="text-[11px] font-bold tracking-[0.16em] text-[#B3101C] uppercase">
              Copied!
            </span>
          ) : (
            <CopyIcon />
          )}
        </button>
      </div>

      {/* What the code does */}
      <div className="mt-[20px] space-y-[14px]">
        <div className="flex items-start gap-x-[12px]">
          <div className="mt-[1px] rounded-[2px] bg-[#121212] p-[8px]">
            <TagIcon />
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#121212]">
              Customers save {fmtPct(discountPercentage)}
            </p>
            <p className="text-[13px] leading-relaxed text-[#5C544A]">
              Anyone who enters your code at checkout gets{' '}
              {fmtPct(discountPercentage)} off their order.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-x-[12px]">
          <div className="mt-[1px] rounded-[2px] bg-[#121212] p-[8px]">
            <DollarIcon />
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#121212]">
              You earn {fmtPct(commissionRate)} commission
            </p>
            <p className="text-[13px] leading-relaxed text-[#5C544A]">
              Every order placed with your code pays {fmtPct(commissionRate)}{' '}
              into your wallet
              {hasTier ? (
                <>
                  {' '}
                  at your{' '}
                  {/* Serif here too: the tier is a name, not a data point, and
                      it should read the same wherever a creator meets it.
                      Nudged up a size because Instrument Serif sits small next
                      to Poppins at the same px. */}
                  <span className="text-[16px] text-[#121212]" style={serif}>
                    {tierName}
                  </span>{' '}
                  tier
                </>
              ) : null}
              . Orders count for life — keep selling to climb.
            </p>
          </div>
        </div>
      </div>

      {/* 24h change-code window */}
      {withinWindow ? (
        <div className="brut-plate mt-[20px] px-[16px] py-[14px]">
          <p className="text-[13px] font-bold text-[#121212]">
            Not happy with your code?
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-[#5C544A]">
            You can change it within{' '}
            <span className="font-bold text-[#B3101C]">24 hours</span> of
            onboarding
            {hoursLeft > 0
              ? ` — about ${hoursLeft} ${hoursLeft === 1 ? 'hour' : 'hours'} left.`
              : '.'}{' '}
            After that it becomes permanent.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-[12px] cursor-pointer text-[11px] font-bold tracking-[0.14em] text-[#B3101C] uppercase underline underline-offset-2"
          >
            Request a new code
          </button>
        </div>
      ) : codeCreatedAt ? (
        <p className="mt-[16px] text-[11px] font-bold tracking-[0.14em] text-[#5C544A] uppercase">
          Your code is now permanent.
        </p>
      ) : null}

      {/* Actions */}
      <div className="mt-[20px] flex flex-col gap-[12px] sm:flex-row sm:items-center">
        <button
          onClick={handleShare}
          className="brut-plate brut-press flex h-[52px] w-full cursor-pointer items-center justify-center gap-x-2 text-[12px] font-bold tracking-[0.12em] uppercase sm:w-fit sm:px-[40px]"
        >
          share link <ShareIcon />
        </button>
        <button
          onClick={copyLink}
          type="button"
          className="cursor-pointer text-[11px] font-bold tracking-[0.14em] text-[#B3101C] uppercase underline underline-offset-2 sm:px-[8px]"
        >
          {linkCopied ? 'Link copied!' : 'Copy link'}
        </button>
      </div>
      <p className="mt-[12px] text-[13px] leading-relaxed text-[#5C544A]">
        Your link applies your creator code automatically at checkout — they
        never have to type it.
      </p>

      {/* Change-code modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#121212]/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-code-title"
          onClick={closeModal}
        >
          <div
            className="brut-plate brut-shadow w-full max-w-sm p-[24px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2
                id="change-code-title"
                className="text-[26px] leading-[0.95] tracking-tight text-[#121212] uppercase"
                style={serif}
              >
                Change your code<span className="text-[#B3101C]">.</span>
              </h2>
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="flex h-[32px] w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-[2px] border-2 border-[#121212] transition-colors hover:bg-[#F5F0E8] disabled:opacity-50"
                aria-label="Close dialog"
                type="button"
              >
                <CloseIcon />
              </button>
            </div>

            <p className="mb-4 text-[13px] leading-relaxed text-[#3F3830]">
              Every code starts with{' '}
              <span className="font-bold text-[#121212]">
                {CREATOR_CODE_PREFIX}
              </span>{' '}
              — you pick what comes after it. You can only do this within 24
              hours of onboarding; after that your code is locked.
            </p>

            <label htmlFor="code-suffix" className="brut-label mb-2 block">
              Your ending
            </label>
            <div className="flex items-stretch rounded-[2px] border-2 border-[#121212] bg-white transition-shadow duration-150 focus-within:shadow-[4px_4px_0_#B3101C]">
              {/* Not aria-hidden: it is the first half of the code, and a
                  screen reader user needs to hear it to make sense of the
                  field. Unselectable so a copy of the field is just the tail. */}
              <span className="flex select-none items-center border-r-2 border-[#121212] bg-[#F5F0E8] px-3 text-[14px] font-bold tracking-widest text-[#5C544A]">
                {CREATOR_CODE_PREFIX}
              </span>
              <input
                id="code-suffix"
                type="text"
                value={codeSuffix}
                onChange={(e) =>
                  setCodeSuffix(sanitizeCreatorSuffix(e.target.value))
                }
                placeholder="JANE10"
                maxLength={CREATOR_SUFFIX_MAX}
                autoFocus
                disabled={isSubmitting}
                aria-describedby="code-suffix-hint"
                className="w-full border-0 bg-transparent px-3 py-2 text-[14px] tracking-widest text-[#121212] uppercase outline-none focus:ring-0 disabled:opacity-50"
              />
            </div>
            <p id="code-suffix-hint" className="mt-2 text-[11px] text-[#5C544A]">
              {codeSuffix ? (
                suffixError ? (
                  suffixError
                ) : (
                  <>
                    Your code will be{' '}
                    <span className="font-bold text-[#121212]">
                      {buildCreatorCode(codeSuffix)}
                    </span>
                    . Must be unique.
                  </>
                )
              ) : (
                `2–${CREATOR_SUFFIX_MAX} characters: letters, numbers, or dashes. Must be unique.`
              )}
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => submitChange(buildCreatorCode(codeSuffix))}
                disabled={isSubmitting || !!suffixError}
                className="brut-btn brut-press"
              >
                {isSubmitting ? 'Saving…' : 'Use this code'}
              </button>
              <button
                type="button"
                onClick={() => submitChange(undefined)}
                disabled={isSubmitting}
                className="brut-btn-paper brut-press"
              >
                {isSubmitting ? 'Please wait…' : 'Randomize a new code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
