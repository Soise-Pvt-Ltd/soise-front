'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CreatorNav from '@/components/creators/CreatorNav';
import { EyeIcon, EyeOffIcon, ArrowLeftIcon } from '@/components/icons';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getWallet, requestPayout, getUserPayouts } from './actions';
import { payoutStatusView, isInFlight } from '@/lib/payout-status';
import { payoutBankDetails } from '@/lib/payout-details';

const naira = (n: number) =>
  `₦${(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** Playfair Display — the Ivory House display face. */
const luxe = { fontFamily: 'var(--font-luxe, Georgia, serif)' } as const;

// components/icons.tsx is shared with the storefront and off-limits here, so
// its hard-coded dark strokes are flipped at the call site instead.
const INVERT_ICON = { filter: 'invert(1)' } as const;

export default function RequestPayoutPage() {
  const router = useRouter();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [balance, setBalance] = useState(0);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [hasBank, setHasBank] = useState(false);
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadWallet = useCallback(async () => {
    const result = await getWallet();
    if (result.success && result.data?.wallets) {
      const wallet = result.data.wallets;
      setBalance(wallet.balance || 0);
      // Flat (Bachs) or legacy nested (Paystack) — see lib/payout-details.ts.
      const details = payoutBankDetails(wallet);
      setHasBank(Boolean(details?.bank_name));
      setBankName(details?.bank_name || '');
      setAccountNumber(details?.account_number || '');
    }
  }, []);

  const loadPayouts = useCallback(async () => {
    const result = await getUserPayouts();
    if (result.success) setPayouts(result.data || []);
    setHistoryLoaded(true);
  }, []);

  // History loads with the page rather than behind a button. A creator cannot
  // safely decide whether to request another payout without seeing the ones
  // already in flight, and hiding that behind a click is how you get duplicate
  // requests against the same balance.
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await Promise.all([loadWallet(), loadPayouts()]);
      setIsLoading(false);
    })();
  }, [loadWallet, loadPayouts]);

  const pending = useMemo(
    () => payouts.filter((p) => isInFlight(p.status)),
    [payouts],
  );
  const pendingTotal = useMemo(
    () => pending.reduce((sum, p) => sum + (p.amount || 0), 0),
    [pending],
  );

  const numAmount = Number(amount);
  const amountValid = numAmount > 0 && numAmount <= balance;

  const handleSubmit = async () => {
    if (!hasBank) {
      setErrorMessage('Add your payout account before withdrawing');
      return;
    }
    if (!numAmount || numAmount <= 0) {
      setErrorMessage('Enter an amount to withdraw');
      return;
    }
    if (numAmount > balance) {
      setErrorMessage(`That's more than your balance of ${naira(balance)}`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    const result = await requestPayout(numAmount);
    if (result.success) {
      setSuccessMessage(
        `${naira(numAmount)} requested. We'll send it to your ${bankName} account shortly.`,
      );
      setAmount('');
      // Re-read the wallet rather than subtracting locally. The balance is
      // debited server-side inside the reserve transaction, and guessing at it
      // here means the number drifts from the truth the moment anything else
      // touches it — a concurrent request, a failure that refunds, a webhook.
      await Promise.all([loadWallet(), loadPayouts()]);
    } else {
      setErrorMessage(result.error || 'Could not submit that request');
      // A rejection may well be a stale balance, so re-sync before they retry.
      await loadWallet();
    }
    setIsSubmitting(false);
  };

  const formatDate = (dateString: string) =>
    dateString
      ? new Date(dateString).toLocaleDateString('en-GB', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : '';

  return (
    <div className="min-h-screen bg-[#0E0E10] text-[#F4F1EA]">
      <CreatorNav balance={balance} />
      {/* A single-column money form, not a dashboard grid — so it gets a
          reading-width column instead of page-shell's 7xl. At 1280px the
          amount input was stretching past 1100px, which makes a six-digit
          figure look lost and puts the label a screen-width from its field. */}
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-[20px] px-[16px] py-[28px] md:px-0">
        <button
          type="button"
          className="flex w-fit cursor-pointer items-center gap-x-2 text-[#B7B2A6] transition-colors hover:text-[#F4F1EA]"
          onClick={() => router.back()}
        >
          <span style={INVERT_ICON}>
            <ArrowLeftIcon />
          </span>
          <span className="text-[12px] font-medium tracking-[0.28em] text-[#C4AA6E] uppercase">
            Request payout
          </span>
        </button>

        {/* Balance — the largest figure in the portal, set in the display
            serif on a raised panel. The old card was white text on #B3D5EB,
            roughly 1.4:1, which is below any legibility threshold. */}
        <div className="rounded-[16px] border border-[#1F1F22] bg-[#121214] px-[24px] py-[28px]">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-medium tracking-[0.28em] text-[#C4AA6E] uppercase">
              Available to withdraw
            </p>
            <button
              type="button"
              onClick={() => setIsBalanceVisible((v) => !v)}
              aria-label={isBalanceVisible ? 'Hide balance' : 'Show balance'}
              aria-pressed={!isBalanceVisible}
              className="cursor-pointer rounded-full p-[8px] opacity-60 transition-opacity hover:opacity-100"
            >
              {isBalanceVisible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          <div
            className="mt-[14px] text-[44px] leading-tight font-medium tracking-tight text-[#F4F1EA] tabular-nums sm:text-[56px]"
            style={luxe}
            aria-live="polite"
          >
            {isLoading ? (
              <span className="inline-block h-[44px] w-[220px] animate-pulse rounded-[10px] bg-[#F4F1EA]/10 align-middle" />
            ) : isBalanceVisible ? (
              naira(balance)
            ) : (
              '₦ ✱✱✱✱✱✱'
            )}
          </div>

          {!isLoading && hasBank && (
            <p className="mt-[16px] text-[12px] tracking-[0.14em] text-[#7A766C] uppercase">
              Paid to {bankName}
              {accountNumber ? ` ••${accountNumber.slice(-4)}` : ''}
            </p>
          )}
        </div>

        {/* Money already committed. Shown before the form, because it changes
            what a sensible request looks like. */}
        {!isLoading && pending.length > 0 && (
          <div className="rounded-[16px] bg-[#121214] px-[22px] py-[18px]">
            <p className="text-[15px] font-medium text-[#F4F1EA]">
              {naira(pendingTotal)} already on the way
            </p>
            <p className="mt-[4px] text-[14px] leading-relaxed text-[#9F9A8E]">
              {pending.length} request{pending.length === 1 ? '' : 's'} being
              processed. That amount has already left your balance.
            </p>
          </div>
        )}

        {/* States are carried by tone and the one accent, not a hue palette:
            a settled message is quiet ivory on a panel, a problem takes the
            restrained red as type only. */}
        {successMessage && (
          <div
            role="status"
            className="rounded-[16px] bg-[#121214] px-5 py-4 text-[14px] leading-relaxed text-[#F4F1EA]"
          >
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div
            role="alert"
            className="rounded-[16px] bg-[#C0362C]/12 px-5 py-4 text-[14px] leading-relaxed font-medium text-[#C0362C]"
          >
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-[12px]">
            <div className="h-[80px] animate-pulse rounded-[16px] bg-[#F4F1EA]/5" />
            <div className="h-[53px] animate-pulse rounded-full bg-[#F4F1EA]/5" />
          </div>
        ) : !hasBank ? (
          <div className="rounded-[16px] bg-[#121214] px-[22px] py-[34px] text-center">
            <h3
              className="text-[26px] leading-tight font-medium tracking-tight text-[#F4F1EA]"
              style={luxe}
            >
              Add a payout account to withdraw
            </h3>
            <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-[#9F9A8E]">
              We need the bank account your earnings should be sent to before
              you can request a payout.
            </p>
            <Link
              href="/creators/dashboard/withdrawal-bank"
              className="mt-[26px] inline-flex items-center justify-center rounded-full bg-[#F4F1EA] px-9 py-3.5 text-[14px] font-semibold tracking-wide text-[#0E0E10] transition-transform hover:scale-[1.02]"
            >
              Add payout account
            </Link>
          </div>
        ) : (
          <div className="rounded-[16px] bg-[#121214] p-[22px]">
            <label
              htmlFor="amount_to_withdraw"
              className="text-[12px] font-medium tracking-[0.14em] text-[#9F9A8E] uppercase"
            >
              Amount to withdraw
            </label>
            <div className="mt-[10px] flex items-center rounded-[10px] border border-[#2A2A2D] transition-colors focus-within:border-[#C4AA6E]">
              <span
                className="pl-[16px] text-[26px] text-[#7A766C]"
                style={luxe}
              >
                ₦
              </span>
              {/* border-0/ring-0: @tailwindcss/forms puts a grey 1px border on
                  bare inputs, which drew a second rectangle inside this
                  field's own rounded wrapper. */}
              <input
                id="amount_to_withdraw"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                className="w-full border-0 bg-transparent px-[8px] py-[14px] text-[26px] text-[#F4F1EA] tabular-nums outline-none placeholder-[#5C584F] focus:ring-0"
                style={luxe}
                placeholder="0.00"
                value={amount}
                aria-describedby="amount_help"
                onChange={(e) => {
                  // A number input accepts "e", "+" and multiple dots, all of
                  // which reach Number() as NaN and silently disable the
                  // button with no explanation. Constrain the keystrokes.
                  const cleaned = e.target.value
                    .replace(/[^\d.]/g, '')
                    .replace(/(\..*)\./g, '$1');
                  setAmount(cleaned);
                  setErrorMessage('');
                }}
              />
              <button
                type="button"
                onClick={() => {
                  setAmount(String(balance));
                  setErrorMessage('');
                }}
                disabled={balance <= 0}
                className="mr-[10px] shrink-0 cursor-pointer rounded-full border border-[#3A3A3D] px-[14px] py-[6px] text-[12px] font-medium tracking-[0.1em] text-[#D8D3C7] uppercase transition-colors hover:border-[#C4AA6E] hover:text-[#F4F1EA] disabled:cursor-not-allowed disabled:opacity-40"
              >
                All
              </button>
            </div>
            <p id="amount_help" className="mt-[8px] text-[13px] text-[#7A766C]">
              {numAmount > balance
                ? `You only have ${naira(balance)} available.`
                : `Up to ${naira(balance)}.`}
            </p>

            <div className="mt-[24px]">
              <p className="text-[12px] font-medium tracking-[0.14em] text-[#9F9A8E] uppercase">
                Sent to
              </p>
              <div className="mt-[10px] flex items-center justify-between rounded-[10px] border border-[#2A2A2D] px-[16px] py-[14px]">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-[#F4F1EA]">
                    {bankName}
                  </p>
                  {accountNumber && (
                    <p className="text-[13px] text-[#9F9A8E] tabular-nums">
                      {accountNumber}
                    </p>
                  )}
                </div>
                <Link
                  href="/creators/dashboard/withdrawal-bank"
                  className="shrink-0 pl-3 text-[12px] font-medium tracking-[0.14em] text-[#C4AA6E] uppercase transition-colors hover:text-[#F4F1EA]"
                >
                  Change
                </Link>
              </div>
            </div>

            {/* The money action: the one gold pill on the page. */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !amountValid}
              className="mt-[26px] flex w-full cursor-pointer items-center justify-center rounded-full bg-[#C4AA6E] px-8 py-3.5 text-[14px] font-semibold tracking-wide text-[#0E0E10] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting
                ? 'Submitting…'
                : amountValid
                  ? `Withdraw ${naira(numAmount)}`
                  : 'Withdraw'}
            </button>
            <p className="mt-[14px] text-center text-[13px] text-[#7A766C]">
              Reviewed and sent by our team, usually within one business day.
            </p>
          </div>
        )}

        {/* History, always present once loaded. */}
        <div className="mb-[64px] rounded-[16px] bg-[#121214] p-[22px]">
          <h3
            className="text-[26px] leading-tight font-medium tracking-tight text-[#F4F1EA]"
            style={luxe}
          >
            Payout history
          </h3>
          {!historyLoaded ? (
            <div className="mt-[12px] h-[44px] animate-pulse rounded-[10px] bg-[#F4F1EA]/5" />
          ) : payouts.length === 0 ? (
            <p className="mt-[8px] text-[14px] text-[#9F9A8E]">
              Nothing yet. Your withdrawals will appear here.
            </p>
          ) : (
            /* Panel the container, divide the rows — a separate card per row
               is unreadable once the history runs long. */
            <ul className="mt-[14px] divide-y divide-[#1C1C1F]">
              {payouts.map((p: any) => {
                const view = payoutStatusView(p.status);
                return (
                  <li
                    key={p.id}
                    className="flex items-start justify-between gap-3 py-[16px] first:pt-0"
                  >
                    <div className="min-w-0">
                      <p
                        className="text-[22px] leading-tight font-medium text-[#F4F1EA] tabular-nums"
                        style={luxe}
                      >
                        {naira(p.amount)}
                      </p>
                      <p className="mt-[4px] text-[13px] leading-relaxed text-[#7A766C]">
                        {formatDate(p.created_at)} · {view.meaning}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-[12px] py-[5px] text-[10px] font-medium tracking-[0.14em] uppercase ${view.className}`}
                    >
                      {view.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
