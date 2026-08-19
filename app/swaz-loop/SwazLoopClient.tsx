'use client';

import { useState } from 'react';
import { CopyIcon, ShareIcon, ChainIcon } from '@/components/icons';
import { showToast } from '@/lib/toast-utils';
import ReferralPromoCard from '@/components/ReferralPromoCard';
import type { MyReferral } from './actions';

interface SwazLoopClientProps {
  referral: MyReferral;
}

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
    <div className="mx-auto max-w-[880px] px-5 py-[48px] md:py-[72px]">
      {/* Header / offer */}
      <header className="brut-rise">
        <p className="brut-label text-[#B3101C]">The Swaz Loop</p>
        <h1
          className="mt-4 text-[44px] leading-[0.95] tracking-tight uppercase md:text-[72px]"
          style={serif}
        >
          Invite friends, earn store credit<span className="text-[#B3101C]">.</span>
        </h1>
        <p className="mt-6 max-w-[52ch] text-[15px] leading-relaxed text-[#3F3830] sm:text-[16px]">
          Share your link. When a friend places their{' '}
          <span className="font-semibold text-[#121212]">first paid order</span>,
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
      </header>

      {/* 01 — the link is the centrepiece: an ink-filled plate, the way
          /contact plates the email address. Everything else on this page is
          a white plate so this one reads as the action. */}
      <section className="brut-rise mt-16" style={{ animationDelay: '0.08s' }}>
        <IndexHead n="01" title="Your shareable link" />
        <div className="mt-5 rounded-[2px] border-2 border-[#121212] bg-[#121212] px-6 py-6 text-white sm:px-8 sm:py-7">
          <p className="flex items-center gap-x-2 text-[11px] font-bold tracking-[0.16em] uppercase opacity-70">
            <ChainIcon />
            Your shareable link
          </p>
          <div className="mt-[14px] flex flex-col gap-x-3 gap-y-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center rounded-[2px] border-2 border-white/25 px-[16px] py-[14px]">
              <span className="truncate text-[15px] sm:text-[18px]" style={serif}>
                {referral_link}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copy(referral_link, setLinkCopied, 'Invite link')}
              className="flex h-[48px] shrink-0 cursor-pointer items-center justify-center gap-x-2 rounded-[2px] border-2 border-white bg-white px-[20px] text-[12px] font-bold tracking-[0.1em] text-[#121212] uppercase transition-colors hover:bg-transparent hover:text-white"
              title="Copy invite link"
            >
              {linkCopied ? <span>Copied!</span> : (
                <>
                  <CopyIcon /> Copy
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="mt-[16px] flex h-[53px] w-full cursor-pointer items-center justify-center gap-x-2 rounded-[2px] border-2 border-[#B3101C] bg-[#B3101C] text-[12px] font-bold tracking-[0.1em] text-white uppercase transition-colors hover:bg-transparent"
          >
            Share your link <ShareIcon />
          </button>

          <div className="mt-[20px] flex items-center justify-between border-t-2 border-white/25 pt-[16px]">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase opacity-70">
                Referral code
              </p>
              <span
                className="text-[20px] tracking-widest uppercase sm:text-[24px]"
                style={serif}
              >
                {referral_code}
              </span>
            </div>
            <button
              type="button"
              onClick={() => copy(referral_code, setCodeCopied, 'Referral code')}
              className="flex cursor-pointer items-center gap-x-1 text-white/60 transition-colors hover:text-white"
              title="Copy referral code"
            >
              {codeCopied ? (
                <span className="text-sm font-bold uppercase">Copied!</span>
              ) : (
                <CopyIcon />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 02 — the balance and the counters, one plate ruled into three. */}
      <section className="brut-rise mt-12" style={{ animationDelay: '0.16s' }}>
        <IndexHead n="02" title="What you've earned" />
        <div className="brut-plate brut-shadow mt-5 px-6 py-6 sm:px-8">
          <p className="brut-label text-[#B3101C]">Your store credit balance</p>
          <p className="mt-3 text-[52px] leading-none md:text-[64px]" style={serif}>
            {naira(store_credit_balance)}
          </p>
          <p className="mt-4 text-[13px] text-[#5C544A]">
            Spendable at checkout — toggle it on in your order summary.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-x-6 border-t-2 border-[#121212] pt-5">
            <div>
              <p className="brut-label text-[#5C544A]">Friends converted</p>
              <p className="mt-2 text-[30px] leading-none" style={serif}>
                {friends_converted ?? 0}
              </p>
            </div>
            <div>
              <p className="brut-label text-[#5C544A]">Total earned</p>
              <p className="mt-2 text-[30px] leading-none" style={serif}>
                {naira(total_earned)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 03 — how it works */}
      <section className="brut-rise mt-12" style={{ animationDelay: '0.24s' }}>
        <IndexHead n="03" title="How it works" />
        <div className="brut-plate brut-shadow mt-5 divide-y-2 divide-[#121212] sm:grid sm:grid-cols-3 sm:divide-x-2 sm:divide-y-0">
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
            <div key={step.n} className="px-6 py-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-[2px] border-2 border-[#B3101C] text-[13px] font-bold text-[#B3101C]">
                {step.n}
              </span>
              <p className="brut-label mt-4">{step.title}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[#5C544A]">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 04 — reward history: ruled rows inside one plate, never a card per row. */}
      <section className="brut-rise mt-12" style={{ animationDelay: '0.32s' }}>
        <IndexHead n="04" title="Referral rewards" />
        {history && history.length > 0 ? (
          <ul className="brut-plate brut-shadow mt-5 divide-y-2 divide-[#121212]">
            {history.map((item, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-x-4 px-5 py-4 sm:px-6"
              >
                <div>
                  <p className="text-[14px] font-medium text-[#121212]">
                    Friend&apos;s order · {naira(item.order_total)}
                  </p>
                  <p className="text-[12px] text-[#5C544A]">
                    {formatDate(item.created_at)} ·{' '}
                    <span className="capitalize">{item.status}</span>
                  </p>
                </div>
                <span
                  className={`text-[16px] whitespace-nowrap ${
                    item.status?.toLowerCase() === 'paid' ||
                    item.status?.toLowerCase() === 'credited'
                      ? 'text-[#B3101C]'
                      : 'text-[#5C544A]'
                  }`}
                  style={serif}
                >
                  +{naira(item.reward_value)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-5 rounded-[2px] border-2 border-dashed border-[#121212]/35 px-5 py-8 text-center">
            <p className="text-[14px] text-[#5C544A]">
              No rewards yet. Share your link to start earning store credit.
            </p>
          </div>
        )}
      </section>

      {/* 05 — credit ledger, same ruled-rows treatment. */}
      {ledger && ledger.length > 0 && (
        <section className="brut-rise mt-12" style={{ animationDelay: '0.4s' }}>
          <IndexHead n="05" title="Store credit activity" />
          <ul className="brut-plate brut-shadow mt-5 divide-y-2 divide-[#121212]">
            {ledger.map((entry, i) => {
              const isCredit = entry.direction === 'credit';
              return (
                <li
                  key={i}
                  className="flex items-center justify-between gap-x-4 px-5 py-4 sm:px-6"
                >
                  <div>
                    <p className="text-[14px] font-medium text-[#121212]">
                      {entry.reason}
                    </p>
                    <p className="text-[12px] text-[#5C544A]">
                      {formatDate(entry.created_at)}
                    </p>
                  </div>
                  <span
                    className={`text-[16px] whitespace-nowrap ${
                      isCredit ? 'text-[#121212]' : 'text-[#B3101C]'
                    }`}
                    style={serif}
                  >
                    {isCredit ? '+' : '-'}
                    {naira(entry.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Repeat the offer at the bottom */}
      <div className="brut-rise mt-12" style={{ animationDelay: '0.48s' }}>
        <ReferralPromoCard
          variant="editorial"
          title="Keep earning — invite more friends"
        />
      </div>
    </div>
  );
}
