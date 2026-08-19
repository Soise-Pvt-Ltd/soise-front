'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CreatorNav from '@/components/creators/CreatorNav';
import { EyeIcon, EyeOffIcon, ArrowLeftIcon } from '@/components/icons';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getWallet, requestPayout, getUserPayouts } from './actions';
import { payoutStatusView, isInFlight } from '@/lib/payout-status';

const naira = (n: number) =>
  `₦${(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/** Instrument Serif — the Pressed Ink display face. */
const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

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
      const details = wallet.payout_metadata?.details;
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
    <div className="min-h-screen bg-[#F5F0E8] text-[#121212]">
      <CreatorNav balance={balance} />
      {/* A single-column money form, not a dashboard grid — so it gets a
          reading-width column instead of page-shell's 7xl. At 1280px the
          amount input was stretching past 1100px, which makes a six-digit
          figure look lost and puts the label a screen-width from its field. */}
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-[20px] px-[16px] py-[28px] md:px-0">
        <button
          type="button"
          className="flex w-fit cursor-pointer items-center gap-x-2 text-[#121212]"
          onClick={() => router.back()}
        >
          <ArrowLeftIcon />
          <span className="brut-label">Request payout</span>
        </button>

        {/* Balance — ink, matching the tier card on the dashboard. The old
            card was white text on #B3D5EB, roughly 1.4:1, which is below any
            legibility threshold; this is 17:1. */}
        <div className="rounded-[2px] border-2 border-[#121212] bg-[#121212] px-[22px] py-[26px] text-white">
          <div className="flex items-center justify-between">
            <p className="brut-label text-[#B3101C]">Available to withdraw</p>
            <button
              type="button"
              onClick={() => setIsBalanceVisible((v) => !v)}
              aria-label={isBalanceVisible ? 'Hide balance' : 'Show balance'}
              aria-pressed={!isBalanceVisible}
              className="cursor-pointer rounded-[2px] p-[6px] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              {isBalanceVisible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          <div
            className="mt-[12px] text-[44px] leading-[0.95] tracking-tight tabular-nums sm:text-[56px]"
            style={serif}
            aria-live="polite"
          >
            {isLoading ? (
              <span className="inline-block h-[44px] w-[220px] animate-pulse rounded-[2px] bg-white/15 align-middle" />
            ) : isBalanceVisible ? (
              naira(balance)
            ) : (
              '₦ ✱✱✱✱✱✱'
            )}
          </div>

          {!isLoading && hasBank && (
            <p className="mt-[14px] text-[11px] font-bold tracking-[0.14em] text-white/50 uppercase">
              Paid to {bankName}
              {accountNumber ? ` ••${accountNumber.slice(-4)}` : ''}
            </p>
          )}
        </div>

        {/* Money already committed. Shown before the form, because it changes
            what a sensible request looks like. */}
        {!isLoading && pending.length > 0 && (
          <div className="brut-plate px-[20px] py-[16px]">
            <p className="text-[14px] font-bold text-[#121212]">
              {naira(pendingTotal)} already on the way
            </p>
            <p className="mt-[4px] text-[13px] leading-relaxed text-[#5C544A]">
              {pending.length} request{pending.length === 1 ? '' : 's'} being
              processed. That amount has already left your balance.
            </p>
          </div>
        )}

        {/* States are carried by ink and the one accent, not a hue palette:
            a settled message is plain ink on paper, a problem is crimson. */}
        {successMessage && (
          <div
            role="status"
            className="brut-plate px-4 py-3 text-sm text-[#121212]"
          >
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div
            role="alert"
            className="rounded-[2px] border-2 border-[#B3101C] bg-white px-4 py-3 text-sm font-medium text-[#B3101C]"
          >
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-[12px]">
            <div className="h-[80px] animate-pulse rounded-[2px] bg-[#121212]/5" />
            <div className="h-[53px] animate-pulse rounded-[2px] bg-[#121212]/5" />
          </div>
        ) : !hasBank ? (
          <div className="brut-plate px-[20px] py-[32px] text-center">
            <h3
              className="text-[26px] leading-[0.95] tracking-tight text-[#121212] uppercase"
              style={serif}
            >
              Add a payout account to withdraw
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#3F3830]">
              We need the bank account your earnings should be sent to before
              you can request a payout.
            </p>
            <Link
              href="/creators/dashboard/withdrawal-bank"
              className="brut-press mt-[24px] inline-flex items-center justify-center rounded-[2px] border-2 border-[#121212] bg-[#121212] px-[40px] py-[16px] text-[13px] font-bold tracking-[0.1em] text-white uppercase"
            >
              Add payout account
            </Link>
          </div>
        ) : (
          <div className="brut-plate p-[20px]">
            <label htmlFor="amount_to_withdraw" className="brut-label">
              Amount to withdraw
            </label>
            <div className="mt-[10px] flex items-center rounded-[2px] border-2 border-[#121212] bg-white transition-shadow duration-150 focus-within:shadow-[4px_4px_0_#B3101C]">
              <span
                className="pl-[14px] text-[26px] text-[#5C544A]"
                style={serif}
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
                className="w-full border-0 bg-transparent px-[8px] py-[14px] text-[26px] text-[#121212] tabular-nums outline-none focus:ring-0"
                style={serif}
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
                className="mr-[10px] shrink-0 cursor-pointer rounded-[2px] border-2 border-[#121212] px-[10px] py-[6px] text-[11px] font-bold tracking-[0.12em] text-[#121212] uppercase transition-colors hover:bg-[#F5F0E8] disabled:cursor-not-allowed disabled:opacity-40"
              >
                All
              </button>
            </div>
            <p id="amount_help" className="mt-[8px] text-[12px] text-[#5C544A]">
              {numAmount > balance
                ? `You only have ${naira(balance)} available.`
                : `Up to ${naira(balance)}.`}
            </p>

            <div className="mt-[22px]">
              <p className="brut-label">Sent to</p>
              <div className="mt-[10px] flex items-center justify-between rounded-[2px] border-2 border-[#121212] bg-[#F5F0E8] px-[16px] py-[14px]">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-bold text-[#121212]">
                    {bankName}
                  </p>
                  {accountNumber && (
                    <p className="text-[13px] text-[#5C544A] tabular-nums">
                      {accountNumber}
                    </p>
                  )}
                </div>
                <Link
                  href="/creators/dashboard/withdrawal-bank"
                  className="shrink-0 pl-3 text-[11px] font-bold tracking-[0.14em] text-[#B3101C] uppercase underline underline-offset-2"
                >
                  Change
                </Link>
              </div>
            </div>

            {/* The money action: the heaviest plate on the page. */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !amountValid}
              className="brut-btn brut-press mt-[24px]"
            >
              {isSubmitting
                ? 'Submitting…'
                : amountValid
                  ? `Withdraw ${naira(numAmount)}`
                  : 'Withdraw'}
            </button>
            <p className="mt-[12px] text-center text-[12px] text-[#5C544A]">
              Reviewed and sent by our team, usually within one business day.
            </p>
          </div>
        )}

        {/* History, always present once loaded. */}
        <div className="brut-plate mb-[64px] p-[20px]">
          <h3
            className="text-[24px] leading-[0.95] tracking-tight text-[#121212] uppercase"
            style={serif}
          >
            Payout history
          </h3>
          {!historyLoaded ? (
            <div className="mt-[12px] h-[44px] animate-pulse rounded-[2px] bg-[#121212]/5" />
          ) : payouts.length === 0 ? (
            <p className="mt-[8px] text-[13px] text-[#5C544A]">
              Nothing yet. Your withdrawals will appear here.
            </p>
          ) : (
            /* Plate the container, rule the rows — a shadowed plate per row is
               unreadable once the history runs long. */
            <ul className="mt-[14px]">
              {payouts.map((p: any) => {
                const view = payoutStatusView(p.status);
                return (
                  <li
                    key={p.id}
                    className="brut-rule flex items-start justify-between gap-3 py-[14px] first:border-t-0 first:pt-0"
                  >
                    <div className="min-w-0">
                      <p
                        className="text-[22px] leading-[1] text-[#121212] tabular-nums"
                        style={serif}
                      >
                        {naira(p.amount)}
                      </p>
                      <p className="mt-[4px] text-[12px] text-[#5C544A]">
                        {formatDate(p.created_at)} · {view.meaning}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-[2px] px-[10px] py-[4px] text-[10px] font-bold tracking-[0.14em] uppercase ${view.className}`}
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
