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
    <div className="min-h-screen bg-[#f9f9f9]">
      <CreatorNav balance={balance} />
      {/* A single-column money form, not a dashboard grid — so it gets a
          reading-width column instead of page-shell's 7xl. At 1280px the
          amount input was stretching past 1100px, which makes a six-digit
          figure look lost and puts the label a screen-width from its field. */}
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-[16px] px-[16px] py-[24px] md:px-0">
        <button
          type="button"
          className="flex w-fit cursor-pointer items-center gap-x-2"
          onClick={() => router.back()}
        >
          <ArrowLeftIcon />
          <span className="font-bold uppercase">Request payout</span>
        </button>

        {/* Balance — ink, matching the tier card on the dashboard. The old
            card was white text on #B3D5EB, roughly 1.4:1, which is below any
            legibility threshold; this is 17:1. */}
        <div className="rounded-2xl bg-[#121212] px-[20px] py-[24px] text-white">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-white/60">Available to withdraw</p>
            <button
              type="button"
              onClick={() => setIsBalanceVisible((v) => !v)}
              aria-label={isBalanceVisible ? 'Hide balance' : 'Show balance'}
              aria-pressed={!isBalanceVisible}
              className="cursor-pointer rounded-full p-[6px] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              {isBalanceVisible ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          <div
            className="mt-[6px] text-[30px] leading-tight font-semibold tabular-nums"
            aria-live="polite"
          >
            {isLoading ? (
              <span className="inline-block h-[34px] w-[180px] animate-pulse rounded bg-white/15 align-middle" />
            ) : isBalanceVisible ? (
              naira(balance)
            ) : (
              '₦ ✱✱✱✱✱✱'
            )}
          </div>

          {!isLoading && hasBank && (
            <p className="mt-[12px] text-[12px] text-white/50">
              Paid to {bankName}
              {accountNumber ? ` ••${accountNumber.slice(-4)}` : ''}
            </p>
          )}
        </div>

        {/* Money already committed. Shown before the form, because it changes
            what a sensible request looks like. */}
        {!isLoading && pending.length > 0 && (
          <div className="rounded-2xl border border-[#E6E6E6] bg-white px-[16px] py-[14px]">
            <p className="text-[14px] font-medium text-[#121212]">
              {naira(pendingTotal)} already on the way
            </p>
            <p className="mt-[2px] text-[13px] text-[#8E8E93]">
              {pending.length} request{pending.length === 1 ? '' : 's'} being
              processed. That amount has already left your balance.
            </p>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="rounded-[10px] bg-[#CCEAD6] px-4 py-3 text-sm text-[#1B7A3D]"
          >
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div
            role="alert"
            className="rounded-[10px] bg-[#E5C6BF] px-4 py-3 text-sm text-[#991C00]"
          >
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-[12px]">
            <div className="h-[80px] animate-pulse rounded-2xl bg-black/5" />
            <div className="h-[53px] animate-pulse rounded-[10px] bg-black/5" />
          </div>
        ) : !hasBank ? (
          <div className="rounded-2xl bg-white px-[16px] py-[32px] text-center">
            <h3 className="text-[16px] font-semibold text-[#121212]">
              Add a payout account to withdraw
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#8E8E93]">
              We need the bank account your earnings should be sent to before
              you can request a payout.
            </p>
            <Link
              href="/creators/dashboard/withdrawal-bank"
              className="btn_creators_solid mt-[24px] inline-flex w-fit items-center justify-center px-[40px] py-[15px]"
            >
              Add payout account
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-[16px]">
            <label
              htmlFor="amount_to_withdraw"
              className="text-[14px] text-[#8E8E93]"
            >
              Amount to withdraw
            </label>
            <div className="mt-[7px] flex items-center rounded-[10px] border border-[#E6E6E6] focus-within:border-[#121212]">
              <span className="pl-[14px] text-[22px] text-[#8E8E93]">₦</span>
              {/* border-0/ring-0: @tailwindcss/forms puts a grey 1px border on
                  bare inputs, which drew a second rectangle inside this
                  field's own rounded wrapper. */}
              <input
                id="amount_to_withdraw"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                className="w-full border-0 bg-transparent px-[8px] py-[12px] text-[22px] font-medium tabular-nums outline-none focus:ring-0"
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
                className="mr-[8px] shrink-0 cursor-pointer rounded-[6px] px-[10px] py-[6px] text-[12px] font-bold text-[#0072BB] uppercase transition-colors hover:bg-[#E4EDF5] disabled:cursor-not-allowed disabled:opacity-40"
              >
                All
              </button>
            </div>
            <p id="amount_help" className="mt-[6px] text-[12px] text-[#8E8E93]">
              {numAmount > balance
                ? `You only have ${naira(balance)} available.`
                : `Up to ${naira(balance)}.`}
            </p>

            <div className="mt-[20px]">
              <p className="text-[14px] text-[#8E8E93]">Sent to</p>
              <div className="mt-[7px] flex items-center justify-between rounded-[10px] bg-[#F6F6F6] px-[14px] py-[13px]">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-[#121212]">
                    {bankName}
                  </p>
                  {accountNumber && (
                    <p className="text-[13px] text-[#8E8E93] tabular-nums">
                      {accountNumber}
                    </p>
                  )}
                </div>
                <Link
                  href="/creators/dashboard/withdrawal-bank"
                  className="shrink-0 pl-3 text-[13px] font-medium text-[#0072BB] hover:underline"
                >
                  Change
                </Link>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !amountValid}
              className="btn_creators_solid mt-[24px] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? 'Submitting…'
                : amountValid
                  ? `Withdraw ${naira(numAmount)}`
                  : 'Withdraw'}
            </button>
            <p className="mt-[10px] text-center text-[12px] text-[#8E8E93]">
              Reviewed and sent by our team, usually within one business day.
            </p>
          </div>
        )}

        {/* History, always present once loaded. */}
        <div className="mb-[64px] rounded-2xl bg-white p-[16px]">
          <h3 className="text-[16px] font-medium text-[#121212]">
            Payout history
          </h3>
          {!historyLoaded ? (
            <div className="mt-[12px] h-[44px] animate-pulse rounded bg-black/5" />
          ) : payouts.length === 0 ? (
            <p className="mt-[4px] text-[13px] text-[#8E8E93]">
              Nothing yet. Your withdrawals will appear here.
            </p>
          ) : (
            <ul className="mt-[8px]">
              {payouts.map((p: any) => {
                const view = payoutStatusView(p.status);
                return (
                  <li
                    key={p.id}
                    className="flex items-start justify-between gap-3 border-b border-[#F0F0F0] py-[12px] last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-[#121212] tabular-nums">
                        {naira(p.amount)}
                      </p>
                      <p className="text-[12px] text-[#8E8E93]">
                        {formatDate(p.created_at)} · {view.meaning}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-[10px] py-[3px] text-[12px] font-medium ${view.className}`}
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
