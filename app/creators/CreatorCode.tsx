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
        <p className="text-[#8E8E93]">Your creator code</p>
        <p className="mt-[8px] text-[16px] font-medium text-[#121212]">
          You don&apos;t have an active code yet
        </p>
        <p className="mt-[4px] text-[13px] text-[#8E8E93]">
          Once your creator code is issued it appears here, along with your
          shareable link. Contact us if you think this is a mistake.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header: label + usage */}
      <div className="flex items-center justify-between">
        <p className="text-[#8E8E93]">Your creator code</p>
        {usageCount > 0 && (
          <span className="text-[13px] text-[#8E8E93]">
            Used{' '}
            <span className="font-medium text-[#121212]">
              {usageCount.toLocaleString()}
            </span>{' '}
            {usageCount === 1 ? 'time' : 'times'}
          </span>
        )}
      </div>

      {/* The code + copy */}
      <div className="mt-[12px] flex items-center justify-between gap-x-[12px] rounded-[12px] bg-[#f9f9f9] px-[16px] py-[14px]">
        <span className="truncate text-[18px] font-semibold tracking-widest text-[#0072BB] uppercase">
          {code || '—'}
        </span>
        <button
          onClick={() => copy(code)}
          className="flex shrink-0 cursor-pointer items-center gap-x-1 text-[#8E8E93] transition-colors hover:text-[#121212]"
          title="Copy creator code"
          type="button"
        >
          {isCopied ? (
            <span className="text-sm font-medium text-green-600">Copied!</span>
          ) : (
            <CopyIcon />
          )}
        </button>
      </div>

      {/* What the code does */}
      <div className="mt-[20px] space-y-[12px]">
        <div className="flex items-start gap-x-[12px]">
          <div className="mt-[1px] rounded-full bg-[#121212] p-[8px]">
            <TagIcon />
          </div>
          <div>
            <p className="text-[14px] font-medium text-[#121212]">
              Customers save {fmtPct(discountPercentage)}
            </p>
            <p className="text-[13px] text-[#8E8E93]">
              Anyone who enters your code at checkout gets{' '}
              {fmtPct(discountPercentage)} off their order.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-x-[12px]">
          <div className="mt-[1px] rounded-full bg-[#121212] p-[8px]">
            <DollarIcon />
          </div>
          <div>
            <p className="text-[14px] font-medium text-[#121212]">
              You earn {fmtPct(commissionRate)} commission
            </p>
            <p className="text-[13px] text-[#8E8E93]">
              Every order placed with your code pays {fmtPct(commissionRate)}{' '}
              into your wallet
              {hasTier ? (
                <>
                  {' '}
                  at your{' '}
                  {/* Serif here too: the tier is a name, not a data point, and
                      it should read the same wherever a creator meets it.
                      Nudged up a size because Playfair sits small next to
                      Poppins at the same px. */}
                  <span
                    className="text-[15px] text-[#121212]"
                    style={{ fontFamily: 'var(--font-luxe, Georgia, serif)' }}
                  >
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
        <div className="mt-[20px] rounded-[10px] bg-[#F5F8FB] px-[14px] py-[12px]">
          <p className="text-[13px] font-medium text-[#121212]">
            Not happy with your code?
          </p>
          <p className="mt-1 text-[12px] text-[#8E8E93]">
            You can change it within{' '}
            <span className="font-medium text-[#0072BB]">24 hours</span> of
            onboarding
            {hoursLeft > 0
              ? ` — about ${hoursLeft} ${hoursLeft === 1 ? 'hour' : 'hours'} left.`
              : '.'}{' '}
            After that it becomes permanent.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-[12px] cursor-pointer text-[13px] font-semibold text-[#0072BB] underline-offset-2 hover:underline"
          >
            Request a new code
          </button>
        </div>
      ) : codeCreatedAt ? (
        <p className="mt-[16px] text-[12px] text-[#8E8E93]">
          Your code is now permanent.
        </p>
      ) : null}

      {/* Actions */}
      <div className="mt-[20px] flex flex-col gap-[12px] sm:flex-row sm:items-center">
        <button
          onClick={handleShare}
          className="btn_black flex items-center justify-center gap-x-2 !text-[12px] !font-medium !capitalize sm:!w-fit sm:!px-[40px]"
        >
          share link <ShareIcon />
        </button>
        <button
          onClick={copyLink}
          type="button"
          className="text-[13px] font-medium text-[#0072BB] transition-opacity hover:opacity-70 sm:px-[8px]"
        >
          {linkCopied ? 'Link copied!' : 'Copy link'}
        </button>
      </div>
      <p className="mt-[10px] text-[13px] text-[#8E8E93]">
        Your link applies your creator code automatically at checkout — they
        never have to type it.
      </p>

      {/* Change-code modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-code-title"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-sm rounded-[20px] bg-white p-[24px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <h2
                id="change-code-title"
                className="text-lg font-medium text-[#121212]"
              >
                Change your code
              </h2>
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close dialog"
                type="button"
              >
                <CloseIcon />
              </button>
            </div>

            <p className="mb-4 text-[13px] text-[#8E8E93]">
              Every code starts with{' '}
              <span className="font-medium text-[#121212]">
                {CREATOR_CODE_PREFIX}
              </span>{' '}
              — you pick what comes after it. You can only do this within 24
              hours of onboarding; after that your code is locked.
            </p>

            <label
              htmlFor="code-suffix"
              className="mb-2 block text-[12px] font-medium text-[#121212]"
            >
              Your ending
            </label>
            <div className="flex items-stretch overflow-hidden rounded-[10px] border border-gray-200 bg-[#F5F5F5] focus-within:ring-2 focus-within:ring-[#0072BB]">
              {/* Not aria-hidden: it is the first half of the code, and a
                  screen reader user needs to hear it to make sense of the
                  field. Unselectable so a copy of the field is just the tail. */}
              <span className="flex select-none items-center border-r border-gray-200 bg-[#ECECEC] px-3 text-[14px] font-semibold tracking-widest text-[#8E8E93]">
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
                className="w-full bg-transparent px-3 py-2 text-[14px] tracking-widest uppercase outline-none disabled:opacity-50"
              />
            </div>
            <p id="code-suffix-hint" className="mt-1 text-[11px] text-[#8E8E93]">
              {codeSuffix ? (
                suffixError ? (
                  suffixError
                ) : (
                  <>
                    Your code will be{' '}
                    <span className="font-medium text-[#121212]">
                      {buildCreatorCode(codeSuffix)}
                    </span>
                    . Must be unique.
                  </>
                )
              ) : (
                `2–${CREATOR_SUFFIX_MAX} characters: letters, numbers, or dashes. Must be unique.`
              )}
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => submitChange(buildCreatorCode(codeSuffix))}
                disabled={isSubmitting || !!suffixError}
                className="btn_black flex items-center justify-center !text-[13px] !font-medium disabled:opacity-50"
              >
                {isSubmitting ? 'Saving…' : 'Use this code'}
              </button>
              <button
                type="button"
                onClick={() => submitChange(undefined)}
                disabled={isSubmitting}
                className="flex items-center justify-center rounded-[10px] border border-[#0072BB] px-4 py-2 text-[13px] font-medium text-[#0072BB] transition-colors hover:bg-[#F5F8FB] disabled:opacity-50"
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
