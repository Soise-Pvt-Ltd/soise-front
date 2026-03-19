'use client';

import { useRouter } from 'next/navigation';
import DashboardHeader from '../DashboardHeader';
import {
  ArrowLeftIcon,
  CopyIconSolidWhite,
} from '@/components/icons';
import { useState, useEffect } from 'react';
import { getWallet } from '../request-payout/actions';

export default function WithdrawalBankPage() {
  const router = useRouter();
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  useEffect(() => {
    const loadWallet = async () => {
      setIsLoading(true);
      const result = await getWallet();
      if (result.success && result.data?.wallets) {
        const wallet = result.data.wallets;
        setBalance(wallet.balance || 0);
        const details = wallet.payout_metadata?.details || {};
        setBankName(details.bank_name || 'No bank set');
        setAccountNumber(details.account_number || '');
        setAccountName(details.account_name || '');
      }
      setIsLoading(false);
    };
    loadWallet();
  }, []);

  const handleCopy = () => {
    if (accountNumber) {
      navigator.clipboard.writeText(accountNumber).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      });
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
          <span className="font-bold uppercase">Withdrawal bank</span>
        </div>
        <div className="pt-[13px] text-[#8E8E93]">
          This is where your total earnings will be sent to when you initiate a
          withdrawal. Funds would be sent in a few minutes.
        </div>

        {isLoading ? (
          <div className="rounded-[10px] bg-[#B3D5EB] px-[16px] py-[24px] text-center text-sm text-white">
            Loading bank details...
          </div>
        ) : accountNumber ? (
          <div className="space-y-[30px] rounded-[10px] bg-[#B3D5EB] px-[16px] py-[24px] text-sm">
            <div className="flex items-center justify-between">
              <div className="text-white">
                <span className="text-[16px] font-medium">{bankName}</span>
                <p>{accountNumber}</p>
                {accountName && (
                  <p className="mt-1 text-xs text-white/70">{accountName}</p>
                )}
              </div>
              <button
                onClick={handleCopy}
                className="cursor-pointer text-green-500"
              >
                {isCopied ? 'Copied!' : <CopyIconSolidWhite />}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-[10px] bg-[#F5F1CC] px-[16px] py-[24px] text-sm text-[#D8C732]">
            No bank account linked. Please complete creator onboarding to set up
            your withdrawal bank.
          </div>
        )}

        <div className="profile mt-[36px]">
          <p className="text-sm text-[#8E8E93]">
            To update your bank details, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
