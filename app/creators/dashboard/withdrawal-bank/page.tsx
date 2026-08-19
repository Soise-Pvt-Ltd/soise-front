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
import { payoutBankDetails } from '@/lib/payout-details';

/** Playfair Display — the Ivory House display face. */
const luxe = { fontFamily: 'var(--font-luxe, Georgia, serif)' } as const;

/** Shared field styling — the house form block. */
const FIELD =
  'w-full appearance-none rounded-[10px] border border-[#2A2A2D] bg-[#121214] px-4 py-3 text-[14px] text-[#F4F1EA] outline-none transition-colors placeholder-[#5C584F] focus:border-[#C4AA6E] focus:ring-0';
const FIELD_LABEL =
  'text-[12px] font-medium uppercase tracking-[0.14em] text-[#9F9A8E]';

// components/icons.tsx is shared with the storefront and off-limits here, so
// its hard-coded dark strokes are flipped at the call site instead.
const INVERT_ICON = { filter: 'invert(1)' } as const;

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
      // Reads the current flat shape AND the legacy nested one — see
      // lib/payout-details.ts. Reading only `.details` is what made a freshly
      // saved account come back empty.
      const details = payoutBankDetails(wallet) || ({} as any);
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
    <div className="min-h-screen bg-[#0E0E10] text-[#F4F1EA]">
      <CreatorNav balance={balance} />
      {/* Reading-width column: this is a form, not a dashboard. */}
      <div className="mx-auto flex w-full max-w-[640px] flex-col gap-[20px] px-[16px] py-[28px] md:px-0">
        <div
          className="flex w-fit items-center gap-x-2 text-[#B7B2A6] transition-colors hover:cursor-pointer hover:text-[#F4F1EA]"
          onClick={() => router.back()}
        >
          <span style={INVERT_ICON}>
            <ArrowLeftIcon />
          </span>{' '}
          <span className="text-[12px] font-medium tracking-[0.28em] text-[#C4AA6E] uppercase">
            Payout account
          </span>
        </div>
        {/* "Funds would be sent in a few minutes" was not true and set the
            wrong expectation: a payout request is queued at status
            'requested' and an admin initiates the Bachs transfer by hand
            (a creator must never be able to trigger the transfer OTP). The
            request-payout page already says one business day; these two now
            agree. */}
        <div className="pt-[8px] text-[15px] leading-relaxed text-[#B7B2A6]">
          This is where your earnings are sent when you withdraw. Our team
          reviews and sends each transfer, usually within one business day.
        </div>

        {isLoading ? (
          <div className="h-[104px] animate-pulse rounded-[16px] bg-[#F4F1EA]/5" />
        ) : (
          <>
            {/* Saved account summary (only when a bank is set and not editing).
                A raised panel, not the old #B3D5EB — white text on that pale
                blue was about 1.4:1, so the account number was barely
                readable. */}
            {hasBank && !isEditing && (
              <div className="space-y-[24px]">
                <div className="rounded-[16px] border border-[#1F1F22] bg-[#121214] px-[24px] py-[28px]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className="text-[26px] leading-tight font-medium tracking-tight text-[#F4F1EA]"
                        style={luxe}
                      >
                        {bankName}
                      </p>
                      <p className="mt-[8px] text-[15px] text-[#B7B2A6] tabular-nums">
                        {accountNumber}
                      </p>
                      {accountName && (
                        <p className="mt-[12px] text-[12px] font-medium tracking-[0.14em] text-[#C4AA6E] uppercase">
                          {accountName}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="shrink-0 cursor-pointer rounded-full px-[12px] py-[6px] text-[12px] font-medium tracking-[0.12em] text-[#9F9A8E] uppercase opacity-70 transition-opacity hover:opacity-100"
                      aria-label="Copy account number"
                    >
                      {isCopied ? 'Copied' : <CopyIconSolidWhite />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={beginEdit}
                  className="flex w-full cursor-pointer items-center justify-center rounded-full bg-[#F4F1EA] px-8 py-3.5 text-[14px] font-semibold tracking-wide text-[#0E0E10] transition-transform hover:scale-[1.02]"
                >
                  Update payout account
                </button>
              </div>
            )}

            {/* Empty state (no bank set yet and not editing) */}
            {!hasBank && !isEditing && (
              <div className="space-y-[24px]">
                <div className="rounded-[16px] bg-[#121214] px-[22px] py-[26px]">
                  <span className="text-[12px] font-medium tracking-[0.28em] text-[#C4AA6E] uppercase">
                    No payout account
                  </span>
                  <p className="mt-[14px] text-[15px] font-medium text-[#F4F1EA]">
                    You haven&apos;t set up a payout account
                  </p>
                  <p className="mt-1 text-[14px] leading-relaxed text-[#9F9A8E]">
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
                  className="flex w-full cursor-pointer items-center justify-center rounded-full bg-[#F4F1EA] px-8 py-3.5 text-[14px] font-semibold tracking-wide text-[#0E0E10] transition-transform hover:scale-[1.02]"
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
                    className={`mb-[8px] block ${FIELD_LABEL}`}
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
                    className={FIELD}
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
                    className={`mb-[8px] block ${FIELD_LABEL}`}
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
                    className={FIELD}
                    placeholder="0123456789"
                    maxLength={10}
                    aria-describedby="account_status"
                  />
                </div>

                {/* The account holder, per the bank. Not a field — there is
                    nothing here for the creator to author. */}
                <div id="account_status" aria-live="polite">
                  {isResolving && (
                    <div className="rounded-[16px] bg-[#121214] px-[18px] py-[16px] text-[14px] text-[#9F9A8E]">
                      Checking account…
                    </div>
                  )}
                  {!isResolving && resolvedName && (
                    <div className="rounded-[16px] border border-[#C4AA6E]/40 bg-[#121214] px-[18px] py-[16px]">
                      <p className="text-[12px] font-medium tracking-[0.28em] text-[#C4AA6E] uppercase">
                        Account name
                      </p>
                      <p
                        className="mt-[8px] text-[24px] leading-tight font-medium tracking-tight text-[#F4F1EA]"
                        style={luxe}
                      >
                        {resolvedName}
                      </p>
                      <p className="mt-[8px] text-[13px] text-[#9F9A8E]">
                        Check this is you — transfers can&apos;t be reversed.
                      </p>
                    </div>
                  )}
                  {!isResolving && resolveError && (
                    <div className="rounded-[16px] bg-[#C0362C]/12 px-[18px] py-[16px] text-[14px] leading-relaxed font-medium text-[#C0362C]">
                      {resolveError}
                    </div>
                  )}
                  {!isResolving && !resolvedName && !resolveError && (
                    <div className="rounded-[16px] bg-[#121214] px-[18px] py-[16px] text-[14px] leading-relaxed text-[#9F9A8E]">
                      Pick your bank and enter your 10-digit account number —
                      we&apos;ll confirm the name on the account.
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 pt-[8px] sm:flex-row">
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !resolvedName}
                    className="flex w-full cursor-pointer items-center justify-center rounded-full bg-[#F4F1EA] px-8 py-3.5 text-[14px] font-semibold tracking-wide text-[#0E0E10] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-[40px]"
                  >
                    {isSaving ? 'Saving…' : 'Save payout account'}
                  </button>
                  {hasBank && (
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="flex w-full cursor-pointer items-center justify-center rounded-full border border-[#3A3A3D] px-8 py-3.5 text-[14px] font-medium text-[#D8D3C7] transition-colors hover:border-[#C4AA6E] hover:text-[#F4F1EA] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-[40px]"
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
