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

/** Playfair Display — the Ivory House display face. */
const luxe = { fontFamily: 'var(--font-luxe, Georgia, serif)' } as const;

// The shared icon set carries hard-coded strokes and cannot be edited from
// this register, so a white-stroked glyph landing on a light pill is flipped
// here instead.
const INVERT_ICON = { filter: 'invert(1)' } as const;

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
        <p className="text-[12px] font-medium tracking-[0.28em] text-[#C4AA6E] uppercase">
          Your creator code
        </p>
        <p
          className="mt-[12px] text-[26px] leading-tight font-medium tracking-tight text-[#F4F1EA]"
          style={luxe}
        >
          You don&apos;t have an active code yet
        </p>
        <p className="mt-[8px] text-[14px] leading-relaxed text-[#9F9A8E]">
          Once your creator code is issued it appears here, along with your
          shareable link. Contact us if you think this is a mistake.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header: eyebrow + capsule + usage */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-x-3">
          <p className="text-[12px] font-medium tracking-[0.28em] text-[#C4AA6E] uppercase">
            Your creator code
          </p>
          {/* The gold capsule: the tier a code carries, or what it saves. */}
          <span className="inline-flex items-center rounded-full border border-[#C4AA6E] px-[12px] py-[3px] text-[11px] font-medium tracking-[0.14em] text-[#C4AA6E] uppercase">
            {hasTier ? tierName : `${fmtPct(discountPercentage)} off`}
          </span>
        </div>
        {usageCount > 0 && (
          <span className="text-[12px] tracking-[0.08em] text-[#7A766C] uppercase">
            Used{' '}
            <span className="text-[#F4F1EA]">
              {usageCount.toLocaleString()}
            </span>{' '}
            {usageCount === 1 ? 'time' : 'times'}
          </span>
        )}
      </div>

      {/* The code — the centrepiece of the portal: a raised panel with the
          code itself set oversized in the display serif. */}
      <div className="mt-[16px] flex items-center justify-between gap-x-[12px] rounded-[16px] bg-[#121214] px-[22px] py-[22px]">
        <span
          className="truncate text-[34px] leading-[1.05] font-medium tracking-tight text-[#F4F1EA] uppercase sm:text-[46px]"
          style={luxe}
        >
          {code || '—'}
        </span>
        <button
          onClick={() => copy(code)}
          className="flex shrink-0 cursor-pointer items-center gap-x-1 opacity-70 transition-opacity hover:opacity-100"
          title="Copy creator code"
          type="button"
        >
          {isCopied ? (
            <span className="text-[11px] font-medium tracking-[0.16em] text-[#C4AA6E] uppercase">
              Copied!
            </span>
          ) : (
            <CopyIcon />
          )}
        </button>
      </div>

      {/* What the code does */}
      <div className="mt-[22px] space-y-[16px]">
        <div className="flex items-start gap-x-[12px]">
          <div className="mt-[1px] rounded-full border border-[#3A3A3D] p-[8px]">
            <TagIcon />
          </div>
          <div>
            <p className="text-[15px] font-medium text-[#F4F1EA]">
              Customers save {fmtPct(discountPercentage)}
            </p>
            <p className="text-[14px] leading-relaxed text-[#9F9A8E]">
              Anyone who enters your code at checkout gets{' '}
              {fmtPct(discountPercentage)} off their order.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-x-[12px]">
          <div className="mt-[1px] rounded-full border border-[#3A3A3D] p-[8px]">
            <DollarIcon />
          </div>
          <div>
            <p className="text-[15px] font-medium text-[#F4F1EA]">
              You earn {fmtPct(commissionRate)} commission
            </p>
            <p className="text-[14px] leading-relaxed text-[#9F9A8E]">
              Every order placed with your code pays {fmtPct(commissionRate)}{' '}
              into your wallet
              {hasTier ? (
                <>
                  {' '}
                  at your{' '}
                  {/* Serif here too: the tier is a name, not a data point, and
                      it should read the same wherever a creator meets it.
                      Nudged up a size because the display face sits small next
                      to Poppins at the same px. */}
                  <span className="text-[17px] text-[#F4F1EA]" style={luxe}>
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
        <div className="mt-[22px] rounded-[16px] border border-[#1F1F22] bg-[#121214] px-[18px] py-[16px]">
          <p className="text-[14px] font-medium text-[#F4F1EA]">
            Not happy with your code?
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#9F9A8E]">
            You can change it within{' '}
            <span className="text-[#C4AA6E]">24 hours</span> of onboarding
            {hoursLeft > 0
              ? ` — about ${hoursLeft} ${hoursLeft === 1 ? 'hour' : 'hours'} left.`
              : '.'}{' '}
            After that it becomes permanent.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-[12px] cursor-pointer text-[12px] font-medium tracking-[0.14em] text-[#C4AA6E] uppercase transition-colors hover:text-[#F4F1EA]"
          >
            Request a new code
          </button>
        </div>
      ) : codeCreatedAt ? (
        <p className="mt-[18px] text-[12px] tracking-[0.14em] text-[#7A766C] uppercase">
          Your code is now permanent.
        </p>
      ) : null}

      {/* Actions */}
      <div className="mt-[22px] flex flex-col gap-[12px] sm:flex-row sm:items-center">
        <button
          onClick={handleShare}
          className="flex w-full cursor-pointer items-center justify-center gap-x-2 rounded-full bg-[#F4F1EA] px-8 py-3.5 text-[14px] font-semibold tracking-wide text-[#0E0E10] transition-transform hover:scale-[1.02] sm:w-fit"
        >
          Share link{' '}
          <span style={INVERT_ICON}>
            <ShareIcon />
          </span>
        </button>
        <button
          onClick={copyLink}
          type="button"
          className="cursor-pointer rounded-full border border-[#3A3A3D] px-8 py-3.5 text-[14px] font-medium text-[#D8D3C7] transition-colors hover:border-[#C4AA6E] hover:text-[#F4F1EA] sm:w-fit"
        >
          {linkCopied ? 'Link copied!' : 'Copy link'}
        </button>
      </div>
      <p className="mt-[14px] text-[14px] leading-relaxed text-[#9F9A8E]">
        Your link applies your creator code automatically at checkout — they
        never have to type it.
      </p>

      {/* Change-code modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0E0E10]/70 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-code-title"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-sm rounded-[16px] border border-[#1F1F22] bg-[#121214] p-[24px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2
                id="change-code-title"
                className="text-[26px] leading-tight font-medium tracking-tight text-[#F4F1EA]"
                style={luxe}
              >
                Change your code
              </h2>
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="flex h-[32px] w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#3A3A3D] transition-colors hover:border-[#C4AA6E] disabled:opacity-50"
                aria-label="Close dialog"
                type="button"
              >
                <span style={INVERT_ICON}>
                  <CloseIcon />
                </span>
              </button>
            </div>

            <p className="mb-4 text-[14px] leading-relaxed text-[#B7B2A6]">
              Every code starts with{' '}
              <span className="text-[#F4F1EA]">{CREATOR_CODE_PREFIX}</span> —
              you pick what comes after it. You can only do this within 24
              hours of onboarding; after that your code is locked.
            </p>

            <label
              htmlFor="code-suffix"
              className="mb-2 block text-[12px] font-medium tracking-[0.14em] text-[#9F9A8E] uppercase"
            >
              Your ending
            </label>
            <div className="flex items-stretch overflow-hidden rounded-[10px] border border-[#2A2A2D] bg-[#121214] transition-colors focus-within:border-[#C4AA6E]">
              {/* Not aria-hidden: it is the first half of the code, and a
                  screen reader user needs to hear it to make sense of the
                  field. Unselectable so a copy of the field is just the tail. */}
              <span className="flex select-none items-center border-r border-[#2A2A2D] px-3 text-[14px] tracking-widest text-[#9F9A8E]">
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
                className="w-full border-0 bg-transparent px-3 py-3 text-[14px] tracking-widest text-[#F4F1EA] uppercase outline-none placeholder-[#5C584F] focus:ring-0 disabled:opacity-50"
              />
            </div>
            <p id="code-suffix-hint" className="mt-2 text-[12px] text-[#7A766C]">
              {codeSuffix ? (
                suffixError ? (
                  suffixError
                ) : (
                  <>
                    Your code will be{' '}
                    <span className="text-[#F4F1EA]">
                      {buildCreatorCode(codeSuffix)}
                    </span>
                    . Must be unique.
                  </>
                )
              ) : (
                `2–${CREATOR_SUFFIX_MAX} characters: letters, numbers, or dashes. Must be unique.`
              )}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => submitChange(buildCreatorCode(codeSuffix))}
                disabled={isSubmitting || !!suffixError}
                className="w-full cursor-pointer rounded-full bg-[#F4F1EA] px-8 py-3.5 text-[14px] font-semibold tracking-wide text-[#0E0E10] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? 'Saving…' : 'Use this code'}
              </button>
              <button
                type="button"
                onClick={() => submitChange(undefined)}
                disabled={isSubmitting}
                className="w-full cursor-pointer rounded-full border border-[#3A3A3D] px-8 py-3.5 text-[14px] font-medium text-[#D8D3C7] transition-colors hover:border-[#C4AA6E] hover:text-[#F4F1EA] disabled:cursor-not-allowed disabled:opacity-40"
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
