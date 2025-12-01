'use client';

import DashboardHeader from '../DashboardHeader';
import {
  EyeIcon,
  EyeOffIcon,
  CheckShieldIcon,
  RightWhiteArrowIcon,
  ArrowLeftIcon,
} from '@/components/icons';
import { useState } from 'react';

export default function RequestPayoutPage() {
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <DashboardHeader balance={0.0} />
      <div className="mx-auto flex flex-col gap-[16px] px-[16px] py-[24px] md:max-w-7xl md:px-0">
        <div className="flex items-center gap-x-2">
          <ArrowLeftIcon />{' '}
          <span className="font-bold uppercase">My profile</span>
        </div>
        <div className="space-y-[30px] rounded-[10px] bg-[#B3D5EB] px-[16px] py-[24px] text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-x-2">
              <CheckShieldIcon />{' '}
              <span className="font-medium text-[#0072BB]">
                Available Balance
              </span>
            </div>
            <div className="flex items-center gap-x-2 text-white">
              Transaction History <RightWhiteArrowIcon />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div
              className="w-fit cursor-pointer rounded-full bg-[#0072BB] p-[10px]"
              onClick={() => setIsBalanceVisible(!isBalanceVisible)}
            >
              {isBalanceVisible ? <EyeOffIcon /> : <EyeIcon />}
            </div>

            <div className="text-[20px] font-semibold text-white">
              {isBalanceVisible ? 'N 2,000.00' : '✱✱✱✱✱✱✱'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
