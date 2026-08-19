'use client';

import { useRouter } from 'next/navigation';
import CreatorNav from '@/components/creators/CreatorNav';
import { ArrowLeftIcon, CopyIconSolidWhite } from '@/components/icons';
import { useState, useEffect } from 'react';
import {
  getWallet,
  getBanks,
  savePayoutAccount,
  resolveAccount,
} from '../request-payout/actions';
import { showToast } from '@/lib/toast-utils';

interface Bank {
  name: string;
  code: string;
}

export default function WithdrawalBankPage() {
  const router = useRouter();
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [balance, setBalance] = useState(0);
  const [hasBank, setHasBank] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const [banks, setBanks] = useState<Bank[]>([]);
  const [form, setForm] = useState({
    bankCode: '',
    accountNumber: '',
  });

  // The verified holder name, straight from the bank. Null until the pair
  // resolves — and saving is blocked until it does.
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolveError, setResolveError] = useState('');

  const loadWallet = async () => {
    const result = await getWallet();
    if (result.success && result.data?.wallets) {
      const wallet = result.data.wallets;
      setBalance(wallet.balance || 0);
      const details = wallet.payout_metadata?.details || {};
      if (details.bank_name) {
        setHasBank(true);
        setBankName(details.bank_name);
        // Keep the CODE, not just the name. Prefilling the edit form used to
        // match the saved bank by NAME against the provider's list; any drift in
        // spelling or spacing meant the select silently fell back to "Select
        // your bank" and the creator had to find their bank again.
        setBankCode(details.bank_code || '');
        setAccountNumber(details.account_number || '');
        setAccountName(details.account_name || '');
      } else {
        setHasBank(false);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const [, banksRes] = await Promise.all([loadWallet(), getBanks()]);
      if (banksRes.success && Array.isArray(banksRes.data)) {
        setBanks(banksRes.data);
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const handleCopy = () => {
    if (accountNumber) {
      navigator.clipboard.writeText(accountNumber).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
    }
  };

  const beginEdit = () => {
    // Prefill from the saved code, falling back to a name match only for
    // accounts saved before bank_code was persisted.
    const fallback = banks.find((b) => b.name === bankName)?.code || '';
    setForm({
      bankCode: bankCode || fallback,
      accountNumber: accountNumber || '',
    });
    setResolvedName(null);
    setResolveError('');
    setIsEditing(true);
  };

  // Resolve as soon as both halves are present. Debounced so typing the tenth
  // digit doesn't fire a request per keystroke.
  useEffect(() => {
    if (!isEditing) return;
    const { bankCode: code, accountNumber: number } = form;

    setResolvedName(null);
    setResolveError('');

    if (!code || !/^\d{10}$/.test(number)) return;

    let cancelled = false;
    setIsResolving(true);
    const timer = setTimeout(async () => {
      const res = await resolveAccount(number, code);
      if (cancelled) return;
      setIsResolving(false);
      if (res.success && res.data?.account_name) {
        setResolvedName(res.data.account_name);
      } else {
        setResolveError(res.error || "We couldn't verify that account");
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      setIsResolving(false);
    };
  }, [form, isEditing]);

  const handleSave = async () => {
    const selectedBank = banks.find((b) => b.code === form.bankCode);

    if (!selectedBank) {
      showToast.error('Please select your bank');
      return;
    }
    if (!/^\d{10}$/.test(form.accountNumber)) {
      showToast.error('Account number must be exactly 10 digits');
      return;
    }
    // The name is the bank's answer, never the creator's typing. If it hasn't
    // resolved there is no verified account to save, and saving anyway is how
    // a transfer ends up at a stranger's account.
    if (!resolvedName) {
      showToast.error('Confirm your account details before saving');
      return;
    }

    setIsSaving(true);
    const res = await savePayoutAccount({
      bank_name: selectedBank.name,
      bank_code: selectedBank.code,
      account_number: form.accountNumber,
      account_name: resolvedName,
    });
    setIsSaving(false);

    if (res.success) {
      showToast.success('Payout account saved');
      setIsEditing(false);
      await loadWallet();
    } else {
      showToast.error(res.error || 'Failed to save payout account');
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA]">
      <CreatorNav balance={balance} />
      {/* Reading-width column: this is a form, not a dashboard. */}
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-[16px] px-[16px] py-[24px] md:px-0">
        <div
          className="flex items-center gap-x-2 text-[#14110E] hover:cursor-pointer"
          onClick={() => router.back()}
        >
          <ArrowLeftIcon />{' '}
          <span className="font-bold tracking-[0.08em] uppercase">Payout account</span>
        </div>
        {/* "Funds would be sent in a few minutes" was not true and set the
            wrong expectation: a payout request is queued at status
            'requested' and an admin initiates the Bachs transfer by hand
            (a creator must never be able to trigger the transfer OTP). The
            request-payout page already says one business day; these two now
            agree. */}
        <div className="pt-[13px] text-[#5C544A]">
          This is where your earnings are sent when you withdraw. Our team
          reviews and sends each transfer, usually within one business day.
        </div>

        {isLoading ? (
          <div className="h-[104px] animate-pulse rounded-[10px] bg-[#14110E]/5" />
        ) : (
          <>
            {/* Saved account card (only when a bank is set and not editing).
                Ink, not the old #B3D5EB — white text on that pale blue was
                about 1.4:1, so the account number was barely readable. */}
            {hasBank && !isEditing && (
              <div className="space-y-[24px]">
                <div className="rounded-[14px] bg-[#0E0E10] px-[20px] py-[24px]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 text-[#F4F1EA]">
                      <p className="text-[16px] font-medium">{bankName}</p>
                      <p className="mt-[2px] text-[15px] text-[#F4F1EA]/80 tabular-nums">
                        {accountNumber}
                      </p>
                      {accountName && (
                        <p className="mt-[6px] text-[13px] text-[#C4AA6E]">
                          {accountName}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="shrink-0 cursor-pointer rounded-full px-[10px] py-[6px] text-[12px] font-medium text-[#F4F1EA]/70 transition-colors hover:bg-[#F4F1EA]/10 hover:text-[#F4F1EA]"
                      aria-label="Copy account number"
                    >
                      {isCopied ? 'Copied' : <CopyIconSolidWhite />}
                    </button>
                  </div>
                </div>
                <button onClick={beginEdit} className="suite-btn suite-btn-primary w-full">
                  Update payout account
                </button>
              </div>
            )}

            {/* Empty state (no bank set yet and not editing) */}
            {!hasBank && !isEditing && (
              <div className="space-y-[24px]">
                <div className="rounded-[10px] bg-[#F3E9D6] px-[16px] py-[24px] text-sm text-[#8A6218]">
                  <p className="font-medium">
                    You haven&apos;t set up a payout account
                  </p>
                  <p className="mt-1 text-[#8A6218]/75">
                    Add your bank details so we know where to send your earnings
                    when you withdraw.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setForm({ bankCode: '', accountNumber: '' });
                    setResolvedName(null);
                    setResolveError('');
                    setIsEditing(true);
                  }}
                  className="suite-btn suite-btn-primary w-full"
                >
                  Set up payout account
                </button>
              </div>
            )}

            {/* Edit / create form */}
            {isEditing && (
              <div className="mt-[8px] space-y-[24px]">
                <div>
                  <label
                    htmlFor="bank"
                    className="mb-[7px] block text-[11px] font-medium tracking-[0.18em] text-[#8C8377] uppercase"
                  >
                    Bank
                  </label>
                  <select
                    id="bank"
                    name="bankCode"
                    value={form.bankCode}
                    onChange={(e) =>
                      setForm({ ...form, bankCode: e.target.value })
                    }
                    className="suite-input appearance-none"
                  >
                    <option value="">Select your bank</option>
                    {banks.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="account_number"
                    className="mb-[7px] block text-[11px] font-medium tracking-[0.18em] text-[#8C8377] uppercase"
                  >
                    Account Number
                  </label>
                  <input
                    id="account_number"
                    name="accountNumber"
                    value={form.accountNumber}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        accountNumber: e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 10),
                      })
                    }
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    className="suite-input"
                    placeholder="0123456789"
                    maxLength={10}
                    aria-describedby="account_status"
                  />
                </div>

                {/* The account holder, per the bank. Not a field — there is
                    nothing here for the creator to author. */}
                <div id="account_status" aria-live="polite">
                  {isResolving && (
                    <div className="rounded-[10px] bg-[#EFEBE1] px-[14px] py-[13px] text-[14px] text-[#8C8377]">
                      Checking account…
                    </div>
                  )}
                  {!isResolving && resolvedName && (
                    <div className="rounded-[10px] bg-[#E4EDE3] px-[14px] py-[13px]">
                      <p className="text-[12px] tracking-[0.08em] text-[#3D6B4A] uppercase">
                        Account name
                      </p>
                      <p className="mt-[2px] text-[16px] font-medium text-[#14110E]">
                        {resolvedName}
                      </p>
                      <p className="mt-[4px] text-[12px] text-[#3D6B4A]">
                        Check this is you — transfers can&apos;t be reversed.
                      </p>
                    </div>
                  )}
                  {!isResolving && resolveError && (
                    <div className="rounded-[10px] bg-[#F2E1DB] px-[14px] py-[13px] text-[14px] text-[#8C3A2B]">
                      {resolveError}
                    </div>
                  )}
                  {!isResolving && !resolvedName && !resolveError && (
                    <div className="rounded-[10px] bg-[#EFEBE1] px-[14px] py-[13px] text-[14px] text-[#8C8377]">
                      Pick your bank and enter your 10-digit account number —
                      we&apos;ll confirm the name on the account.
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 pt-[8px] sm:flex-row">
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !resolvedName}
                    className="suite-btn suite-btn-primary w-full sm:w-auto"
                  >
                    {isSaving ? 'Saving…' : 'Save payout account'}
                  </button>
                  {hasBank && (
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="suite-btn suite-btn-ghost w-full sm:w-auto"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
