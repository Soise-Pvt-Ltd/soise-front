'use client';

import { useState } from 'react';
import { CopyIcon, ShareIcon, ChainIcon } from '@/components/icons';
import { showToast } from '@/lib/toast-utils';
import ReferralPromoCard from '@/components/ReferralPromoCard';
import type { MyReferral } from './actions';

interface SwazLoopClientProps {
  referral: MyReferral;
}

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
    <div className="mx-auto max-w-3xl px-[20px] py-[40px] md:py-[64px]">
      {/* Header / offer */}
      <div className="text-center">
        <span className="inline-flex items-center gap-x-2 rounded-full bg-[#E8F1F9] px-3 py-1 text-[11px] font-medium tracking-wide text-[#0072BB] uppercase">
          Swaz Loop
        </span>
        <h1 className="font-display mt-4 text-[34px] leading-tight text-[#121212] md:text-[44px]">
          Invite friends, earn store credit
        </h1>
        <p className="mx-auto mt-4 max-w-[540px] text-[15px] leading-relaxed text-[#35373C]">
          Share your link. When a friend places their{' '}
          <span className="font-semibold text-[#121212]">FIRST paid order</span>,
          you earn{' '}
          <span className="font-semibold text-[#121212]">
            {referrerPercent}% of it as store credit
          </span>{' '}
          (up to {naira(referrerCap)}). They get{' '}
          <span className="font-semibold text-[#121212]">
            {naira(welcomeCredit)} off
          </span>{' '}
          their next order too. Store credit is spendable at checkout.
        </p>
      </div>

      {/* Store credit balance */}
      <div className="mt-[36px] rounded-[20px] bg-gradient-to-br from-[#0072BB] to-[#2D2C54] p-8 text-white">
        <p className="text-[12px] font-medium tracking-wide text-white/75 uppercase">
          Your store credit balance
        </p>
        <p className="mt-2 text-[48px] leading-none font-bold md:text-[56px]">
          {naira(store_credit_balance)}
        </p>
        <p className="mt-3 text-[13px] text-white/80">
          Spendable at checkout — toggle it on in your order summary.
        </p>
      </div>

      {/* Stats */}
      <div className="mt-[24px] grid grid-cols-2 gap-[16px]">
        <div className="rounded-[16px] border border-[#EAEAEA] p-5">
          <p className="text-[12px] tracking-wide text-[#8E8E93] uppercase">
            Friends converted
          </p>
          <p className="mt-2 text-[28px] font-bold text-[#121212]">
            {friends_converted ?? 0}
          </p>
        </div>
        <div className="rounded-[16px] border border-[#EAEAEA] p-5">
          <p className="text-[12px] tracking-wide text-[#8E8E93] uppercase">
            Total earned
          </p>
          <p className="mt-2 text-[28px] font-bold text-[#121212]">
            {naira(total_earned)}
          </p>
        </div>
      </div>

      {/* Share link + code */}
      <div className="mt-[24px] rounded-[20px] border border-[#EAEAEA] p-6">
        <p className="mb-[12px] flex items-center gap-x-2 text-[13px] font-medium text-[#121212]">
          <ChainIcon />
          Your shareable link
        </p>
        <div className="flex flex-col gap-x-3 gap-y-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center rounded-[10px] bg-[#F5F5F5] px-[16px] py-[14px]">
            <span className="truncate text-[13px] text-[#35373C]">
              {referral_link}
            </span>
          </div>
          <button
            type="button"
            onClick={() => copy(referral_link, setLinkCopied, 'Invite link')}
            className="flex h-[48px] shrink-0 items-center justify-center gap-x-2 rounded-[10px] border border-[#121212] px-[20px] text-[12px] font-bold text-[#121212] uppercase transition-colors hover:bg-[#121212] hover:text-white"
            title="Copy invite link"
          >
            {linkCopied ? (
              <span className="text-green-600">Copied!</span>
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
          className="btn_creators_solid mt-[16px] flex items-center justify-center gap-x-2 !text-[12px]"
        >
          Share your link <ShareIcon />
        </button>

        <div className="mt-[20px] flex items-center justify-between border-t border-[#EAEAEA] pt-[16px]">
          <div>
            <p className="text-[12px] text-[#8E8E93]">Referral code</p>
            <span className="font-semibold tracking-widest text-[#0072BB] uppercase">
              {referral_code}
            </span>
          </div>
          <button
            type="button"
            onClick={() => copy(referral_code, setCodeCopied, 'Referral code')}
            className="flex items-center gap-x-1 text-[#8E8E93] transition-colors hover:text-[#121212]"
            title="Copy referral code"
          >
            {codeCopied ? (
              <span className="text-sm font-medium text-green-600">Copied!</span>
            ) : (
              <CopyIcon />
            )}
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="mt-[40px]">
        <h2 className="text-[20px] font-bold text-[#121212]">How it works</h2>
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
              className="rounded-[16px] border border-[#EAEAEA] p-5"
            >
              <div className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#E8F1F9] text-[15px] font-bold text-[#0072BB]">
                {step.n}
              </div>
              <p className="mt-3 text-[14px] font-semibold text-[#121212]">
                {step.title}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[#8E8E93]">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Reward history */}
      <div className="mt-[40px]">
        <h2 className="text-[20px] font-bold text-[#121212]">
          Referral rewards
        </h2>
        {history && history.length > 0 ? (
          <ul className="mt-[16px] divide-y divide-[#EAEAEA] rounded-[16px] border border-[#EAEAEA]">
            {history.map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between px-5 py-4"
              >
                <div>
                  <p className="text-[14px] font-medium text-[#121212]">
                    Friend&apos;s order · {naira(item.order_total)}
                  </p>
                  <p className="text-[12px] text-[#8E8E93]">
                    {formatDate(item.created_at)} ·{' '}
                    <span className="capitalize">{item.status}</span>
                  </p>
                </div>
                <span
                  className={`text-[14px] font-semibold ${
                    item.status?.toLowerCase() === 'paid' ||
                    item.status?.toLowerCase() === 'credited'
                      ? 'text-[#32AC5B]'
                      : 'text-[#8E8E93]'
                  }`}
                >
                  +{naira(item.reward_value)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-[16px] rounded-[16px] border border-dashed border-[#EAEAEA] px-5 py-8 text-center">
            <p className="text-[14px] text-[#8E8E93]">
              No rewards yet. Share your link to start earning store credit.
            </p>
          </div>
        )}
      </div>

      {/* Credit ledger */}
      {ledger && ledger.length > 0 && (
        <div className="mt-[32px]">
          <h2 className="text-[20px] font-bold text-[#121212]">
            Store credit activity
          </h2>
          <ul className="mt-[16px] divide-y divide-[#EAEAEA] rounded-[16px] border border-[#EAEAEA]">
            {ledger.map((entry, i) => {
              const isCredit = entry.direction === 'credit';
              return (
                <li
                  key={i}
                  className="flex items-center justify-between px-5 py-4"
                >
                  <div>
                    <p className="text-[14px] font-medium text-[#121212]">
                      {entry.reason}
                    </p>
                    <p className="text-[12px] text-[#8E8E93]">
                      {formatDate(entry.created_at)}
                    </p>
                  </div>
                  <span
                    className={`text-[14px] font-semibold ${
                      isCredit ? 'text-[#32AC5B]' : 'text-[#C0362C]'
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
      <div className="mt-[40px]">
        <ReferralPromoCard title="Keep earning — invite more friends" />
      </div>
    </div>
  );
}
