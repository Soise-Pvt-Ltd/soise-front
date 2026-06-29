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
import { changeCreatorCode } from './dashboard/actions';

interface ReferralCodeProps {
  code: string;
  /**
   * ISO timestamp of when the active code was created. The creator may only
   * change their code within 24h of this moment; after that it is permanent.
   */
  codeCreatedAt?: string | null;
  /** % the customer saves when they redeem the code */
  discountPercentage?: number;
  /** % the creator earns on every order placed with the code */
  commissionRate?: number;
  /** how many times the code has been used so far */
  usageCount?: number;
  /** the creator's current tier name, if any */
  tierName?: string;
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export default function ReferralCode({
  code,
  codeCreatedAt,
  discountPercentage = 10,
  commissionRate = 10,
  usageCount = 0,
  tierName,
}: ReferralCodeProps) {
  const router = useRouter();
  const [isCopied, setIsCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [customCode, setCustomCode] = useState('');
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

  const fmtPct = (n: number) =>
    Number.isInteger(n) ? `${n}%` : `${n.toFixed(1)}%`;

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
        setCustomCode('');
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
    setCustomCode('');
  };

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
                  <span className="font-medium text-[#121212]">{tierName}</span>{' '}
                  tier
                </>
              ) : null}
              . Sell more to grow your rate.
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
        Your link applies the discount automatically at checkout — they never
        have to type the code.
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
              Pick a custom code or let us randomize one for you. You can only do
              this within 24 hours of onboarding — after that your code is locked.
            </p>

            <label
              htmlFor="custom-code"
              className="mb-2 block text-[12px] font-medium text-[#121212]"
            >
              Preferred code (optional)
            </label>
            <input
              id="custom-code"
              type="text"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              placeholder="E.G. JANE10"
              maxLength={30}
              autoFocus
              disabled={isSubmitting}
              className="w-full rounded-[10px] border border-gray-200 bg-[#F5F5F5] px-3 py-2 text-[14px] tracking-widest uppercase outline-none focus-visible:ring-2 focus-visible:ring-[#0072BB] disabled:opacity-50"
            />
            <p className="mt-1 text-[11px] text-[#8E8E93]">
              3–30 characters: letters, numbers, or dashes. Must be unique.
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => submitChange(customCode.trim() || undefined)}
                disabled={isSubmitting || customCode.trim().length === 0}
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
