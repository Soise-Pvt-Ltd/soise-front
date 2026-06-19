'use client';

import { useRouter } from 'next/navigation';
import DashboardHeader from '../DashboardHeader';
import { ArrowLeftIcon, CopyIconSolidWhite } from '@/components/icons';
import { useState, useEffect } from 'react';
import { getWallet, getBanks, savePayoutAccount } from '../request-payout/actions';
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
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const [banks, setBanks] = useState<Bank[]>([]);
  const [form, setForm] = useState({
    bankCode: '',
    accountNumber: '',
    accountName: '',
  });

  const loadWallet = async () => {
    const result = await getWallet();
    if (result.success && result.data?.wallets) {
      const wallet = result.data.wallets;
      setBalance(wallet.balance || 0);
      const details = wallet.payout_metadata?.details || {};
      if (details.bank_name) {
        setHasBank(true);
        setBankName(details.bank_name);
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
    // Prefill the form from the currently saved details.
    const matched = banks.find((b) => b.name === bankName);
    setForm({
      bankCode: matched?.code || '',
      accountNumber: accountNumber || '',
      accountName: accountName || '',
    });
    setIsEditing(true);
  };

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
    if (!form.accountName.trim()) {
      showToast.error('Please enter the account name');
      return;
    }

    setIsSaving(true);
    const res = await savePayoutAccount({
      bank_name: selectedBank.name,
      bank_code: selectedBank.code,
      account_number: form.accountNumber,
      account_name: form.accountName.trim(),
    });
    setIsSaving(false);

    if (res.success) {
      showToast.success('Payout account saved successfully');
      setIsEditing(false);
      await loadWallet();
    } else {
      showToast.error(res.error || 'Failed to save payout account');
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <DashboardHeader balance={balance} />
      <div className="mx-auto flex flex-col gap-[16px] px-[16px] py-[24px] md:max-w-7xl md:px-0">
        <div
          className="flex items-center gap-x-2 hover:cursor-pointer"
          onClick={() => router.back()}
        >
          <ArrowLeftIcon />{' '}
          <span className="font-bold uppercase">Payout account</span>
        </div>
        <div className="pt-[13px] text-[#8E8E93]">
          This is where your total earnings will be sent to when you initiate a
          withdrawal. Funds would be sent in a few minutes.
        </div>

        {isLoading ? (
          <div className="rounded-[10px] bg-[#B3D5EB] px-[16px] py-[24px] text-center text-sm text-white">
            Loading payout details...
          </div>
        ) : (
          <>
            {/* Saved account card (only when a bank is set and not editing) */}
            {hasBank && !isEditing && (
              <div className="space-y-[24px]">
                <div className="space-y-[30px] rounded-[10px] bg-[#B3D5EB] px-[16px] py-[24px] text-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-white">
                      <span className="text-[16px] font-medium">
                        {bankName}
                      </span>
                      <p>{accountNumber}</p>
                      {accountName && (
                        <p className="mt-1 text-xs text-white/70">
                          {accountName}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="cursor-pointer text-green-500"
                      aria-label="Copy account number"
                    >
                      {isCopied ? 'Copied!' : <CopyIconSolidWhite />}
                    </button>
                  </div>
                </div>
                <button onClick={beginEdit} className="btn_creators_solid">
                  Update payout account
                </button>
              </div>
            )}

            {/* Empty state (no bank set yet and not editing) */}
            {!hasBank && !isEditing && (
              <div className="space-y-[24px]">
                <div className="rounded-[10px] bg-[#F5F1CC] px-[16px] py-[24px] text-sm text-[#9C8E18]">
                  <p className="font-medium">
                    You haven&apos;t set up a payout account
                  </p>
                  <p className="mt-1 text-[#B5A93D]">
                    Add your bank details so we know where to send your earnings
                    when you withdraw.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setForm({
                      bankCode: '',
                      accountNumber: '',
                      accountName: '',
                    });
                    setIsEditing(true);
                  }}
                  className="btn_creators_solid"
                >
                  Set up payout account
                </button>
              </div>
            )}

            {/* Edit / create form */}
            {isEditing && (
              <div className="profile mt-[8px] space-y-[24px]">
                <div>
                  <label htmlFor="bank">Bank</label>
                  <select
                    id="bank"
                    name="bankCode"
                    value={form.bankCode}
                    onChange={(e) =>
                      setForm({ ...form, bankCode: e.target.value })
                    }
                    className="solid"
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
                  <label htmlFor="account_number">Account Number</label>
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
                    className="solid"
                    placeholder="0123456789"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label htmlFor="account_name">Account Name</label>
                  <input
                    id="account_name"
                    name="accountName"
                    value={form.accountName}
                    onChange={(e) =>
                      setForm({ ...form, accountName: e.target.value })
                    }
                    type="text"
                    className="solid"
                    placeholder="John Sosie"
                  />
                </div>

                <div className="flex flex-col gap-3 pt-[8px] sm:flex-row">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="btn_creators_solid disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save payout account'}
                  </button>
                  {hasBank && (
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                      className="btn_outline !mt-0 disabled:cursor-not-allowed disabled:opacity-50"
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
