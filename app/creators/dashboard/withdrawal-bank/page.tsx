'use client';

import { useRouter } from 'next/navigation';
import DashboardHeader from '../DashboardHeader';
import {
  EyeIcon,
  EyeOffIcon,
  CheckShieldIcon,
  RightWhiteArrowIcon,
  ArrowLeftIcon,
  CopyIconSolidWhite,
} from '@/components/icons';
import { useState } from 'react';

export default function WithdrawalBankPage() {
  const router = useRouter();
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <DashboardHeader balance={0.0} />
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
        <div className="space-y-[30px] rounded-[10px] bg-[#B3D5EB] px-[16px] py-[24px] text-sm">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <span className="text-[16px] font-medium">Ecobank</span>
              <p id="account-number">27893212456</p>
            </div>
            <button
              onClick={() => {
                const accountNumber =
                  document.getElementById('account-number')?.innerText;
                if (accountNumber) {
                  navigator.clipboard.writeText(accountNumber).then(() => {
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 2000);
                  });
                }
              }}
              className="cursor-pointer text-green-500"
            >
              {isCopied ? 'Copied!' : <CopyIconSolidWhite />}
            </button>
          </div>
        </div>
        <div className="profile mt-[36px] space-y-[36px]">
          <div>
            <label htmlFor="funds_destination">Change your bank</label>
            <select id="funds_destination" className="solid">
              <option value="">Select destination</option>
              <option value="bank1">Bank 1</option>
              <option value="bank2">Bank 2</option>
              <option value="bank3">Bank 3</option>
            </select>
          </div>
        </div>

        <button className="btn_creators_solid mt-[116px] mb-[64px]">
          Save
        </button>
      </div>
    </div>
  );
}
