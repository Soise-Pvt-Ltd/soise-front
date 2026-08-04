'use client';

import { useState } from 'react';
import { CopyIcon, ShareIcon, ChainIcon } from '@/components/icons';
import { showToast } from '@/lib/toast-utils';
import ReferralPromoCard from '@/components/ReferralPromoCard';
import type { MyReferral } from './actions';

interface SwazLoopClientProps {
  referral: MyReferral;
}

const serif = { fontFamily: 'var(--font-luxe, Georgia, serif)' } as const;

function naira(amount: number): string {
  return `₦${Math.round(amount ?? 0).toLocaleString('en-NG')}`;
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function SwazLoopClient({ referral }: SwazLoopClientProps) {
  const {
    referral_code,
    referral_link,
    store_credit_balance,
    total_earned,
    friends_converted,
    history,
    ledger,
    reward_terms,
  } = referral;

  const referrerPercent = reward_terms?.referrer_percent ?? 10;
  const referrerCap = reward_terms?.referrer_cap ?? 10000;
  const welcomeCredit = reward_terms?.friend_welcome_credit ?? 1000;

  const [linkCopied, setLinkCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const copy = async (
    text: string,
    setFlag: (v: boolean) => void,
    label: string,
  ) => {
    try {
      await navigator.clipboard.writeText(text);
      setFlag(true);
      showToast.success(`${label} copied!`);
      setTimeout(() => setFlag(false), 2000);
    } catch {
      showToast.error('Could not copy. Please copy it manually.');
    }
  };

  const handleShare = async () => {
    const shareText = `Shop SOISE with my link and get ${naira(welcomeCredit)} off your first order: ${referral_link}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Shop SOISE with me',
          text: `Get ${naira(welcomeCredit)} off your first SOISE order`,
          url: referral_link,
        });
      } catch {
        // user dismissed the share sheet — no-op
      }
    } else {
      copy(shareText, setLinkCopied, 'Invite link');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-[20px] py-[48px] md:py-[72px]">
      {/* Header / offer */}
      <div className="text-center">
        <p className="text-[12px] font-medium uppercase tracking-[0.34em] text-[#9C6F2E]">
          The Swaz Loop
        </p>
        <h1
          className="mx-auto mt-5 text-[34px] leading-[1.08] tracking-tight md:text-[48px]"
          style={serif}
        >
          Invite friends, earn store credit
        </h1>
        <p className="mx-auto mt-5 max-w-[540px] text-[15px] leading-relaxed text-[#5C544A] sm:text-[16px]">
          Share your link. When a friend places their{' '}
          <span className="font-semibold text-[#14110E]">first paid order</span>,
          you earn{' '}
          <span className="font-semibold text-[#14110E]">
            {referrerPercent}% of it as store credit
          </span>{' '}
          (up to {naira(referrerCap)}). They get{' '}
          <span className="font-semibold text-[#14110E]">
            {naira(welcomeCredit)} off
          </span>{' '}
          their next order too. Store credit is spendable at checkout.
        </p>
      </div>

      {/* Store credit balance — the house dark panel */}
      <div className="mt-[40px] bg-[#0E0E10] p-8 text-[#F4F1EA] sm:p-10">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#C4AA6E]">
          Your store credit balance
        </p>
        <p className="mt-3 text-[52px] leading-none md:text-[64px]" style={serif}>
          {naira(store_credit_balance)}
        </p>
        <p className="mt-4 text-[13px] text-[#B7B2A6]">
          Spendable at checkout — toggle it on in your order summary.
        </p>
      </div>

      {/* Stats */}
      <div className="mt-[20px] grid grid-cols-2 gap-[16px]">
        <div className="border border-[#DFD7C6] bg-[#FBF9F4] p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A8271]">
            Friends converted
          </p>
          <p className="mt-2 text-[30px] leading-none" style={serif}>
            {friends_converted ?? 0}
          </p>
        </div>
        <div className="border border-[#DFD7C6] bg-[#FBF9F4] p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A8271]">
            Total earned
          </p>
          <p className="mt-2 text-[30px] leading-none" style={serif}>
            {naira(total_earned)}
          </p>
        </div>
      </div>

      {/* Share link + code */}
      <div className="mt-[20px] border border-[#DFD7C6] bg-[#FBF9F4] p-6 sm:p-7">
        <p className="mb-[14px] flex items-center gap-x-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A8271]">
          <ChainIcon />
          Your shareable link
        </p>
        <div className="flex flex-col gap-x-3 gap-y-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center border border-[#EAE3D4] bg-[#F4F1EA] px-[16px] py-[14px]">
            <span className="truncate text-[13px] text-[#5C544A]">
              {referral_link}
            </span>
          </div>
          <button
            type="button"
            onClick={() => copy(referral_link, setLinkCopied, 'Invite link')}
            className="flex h-[48px] shrink-0 items-center justify-center gap-x-2 rounded-[10px] border border-[#14110E] px-[20px] text-[12px] font-bold uppercase text-[#14110E] transition-colors hover:bg-[#14110E] hover:text-[#F4F1EA]"
            title="Copy invite link"
          >
            {linkCopied ? (
              <span className="text-[#9C6F2E]">Copied!</span>
            ) : (
              <>
                <CopyIcon /> Copy
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="mt-[16px] flex h-[53px] w-full items-center justify-center gap-x-2 rounded-[10px] bg-[#14110E] text-[12px] font-bold uppercase text-[#F4F1EA] transition-all duration-300 ease-out hover:bg-[#2a2a2a] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] active:scale-[0.98]"
        >
          Share your link <ShareIcon />
        </button>

        <div className="mt-[20px] flex items-center justify-between border-t border-[#EAE3D4] pt-[16px]">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#8A8271]">
              Referral code
            </p>
            <span className="font-semibold tracking-widest text-[#9C6F2E] uppercase">
              {referral_code}
            </span>
          </div>
          <button
            type="button"
            onClick={() => copy(referral_code, setCodeCopied, 'Referral code')}
            className="flex items-center gap-x-1 text-[#8A8271] transition-colors hover:text-[#14110E]"
            title="Copy referral code"
          >
            {codeCopied ? (
              <span className="text-sm font-medium text-[#9C6F2E]">Copied!</span>
            ) : (
              <CopyIcon />
            )}
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-[48px]">
        <h2 className="text-[24px] leading-snug" style={serif}>
          How it works
        </h2>
        <div className="mt-[20px] grid gap-[16px] sm:grid-cols-3">
          {[
            {
              n: '1',
              title: 'Share your link',
              body: 'Send your unique link to friends by text, WhatsApp or socials.',
            },
            {
              n: '2',
              title: 'They shop & save',
              body: `Your friend gets ${naira(welcomeCredit)} off, then places their first paid order.`,
            },
            {
              n: '3',
              title: 'You earn credit',
              body: `You get ${referrerPercent}% of their order as store credit (up to ${naira(referrerCap)}).`,
            },
          ].map((step) => (
            <div
              key={step.n}
              className="border border-[#DFD7C6] bg-[#FBF9F4] p-5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#9C6F2E] text-[13px] font-semibold text-[#9C6F2E]">
                {step.n}
              </span>
              <p className="mt-3 text-[14px] font-semibold text-[#14110E]">
                {step.title}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[#8A8271]">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Reward history */}
      <div className="mt-[48px]">
        <h2 className="text-[24px] leading-snug" style={serif}>
          Referral rewards
        </h2>
        {history && history.length > 0 ? (
          <ul className="mt-[16px] divide-y divide-[#EAE3D4] border border-[#DFD7C6] bg-[#FBF9F4]">
            {history.map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <p className="text-[14px] font-medium text-[#14110E]">
                    Friend&apos;s order · {naira(item.order_total)}
                  </p>
                  <p className="text-[12px] text-[#8A8271]">
                    {formatDate(item.created_at)} ·{' '}
                    <span className="capitalize">{item.status}</span>
                  </p>
                </div>
                <span
                  className={`text-[14px] font-semibold ${
                    item.status?.toLowerCase() === 'paid' ||
                    item.status?.toLowerCase() === 'credited'
                      ? 'text-[#9C6F2E]'
                      : 'text-[#8A8271]'
                  }`}
                >
                  +{naira(item.reward_value)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-[16px] border border-dashed border-[#DFD7C6] px-5 py-8 text-center">
            <p className="text-[14px] text-[#8A8271]">
              No rewards yet. Share your link to start earning store credit.
            </p>
          </div>
        )}
      </div>

      {/* Credit ledger */}
      {ledger && ledger.length > 0 && (
        <div className="mt-[40px]">
          <h2 className="text-[24px] leading-snug" style={serif}>
            Store credit activity
          </h2>
          <ul className="mt-[16px] divide-y divide-[#EAE3D4] border border-[#DFD7C6] bg-[#FBF9F4]">
            {ledger.map((entry, i) => {
              const isCredit = entry.direction === 'credit';
              return (
                <li
                  key={i}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div>
                    <p className="text-[14px] font-medium text-[#14110E]">
                      {entry.reason}
                    </p>
                    <p className="text-[12px] text-[#8A8271]">
                      {formatDate(entry.created_at)}
                    </p>
                  </div>
                  <span
                    className={`text-[14px] font-semibold ${
                      isCredit ? 'text-[#9C6F2E]' : 'text-[#8A3B33]'
                    }`}
                  >
                    {isCredit ? '+' : '-'}
                    {naira(entry.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Repeat the offer at the bottom */}
      <div className="mt-[48px]">
        <ReferralPromoCard
          variant="editorial"
          title="Keep earning — invite more friends"
        />
      </div>
    </div>
  );
}
