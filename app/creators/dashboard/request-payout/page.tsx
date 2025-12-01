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
        <div className="profile mt-[36px] space-y-[36px]">
          <div>
            <label htmlFor="amount_to_withdraw">Amount to withdraw</label>
            <input
              id="amount_to_withdraw"
              type="number"
              className="solid"
              placeholder="N 1,000"
            />
          </div>

          <div>
            <label htmlFor="funds_destination">Funds Destination</label>
            <select id="funds_destination" className="solid">
              <option value="">Select destination</option>
              <option value="bank1">Bank 1</option>
              <option value="bank2">Bank 2</option>
              <option value="bank3">Bank 3</option>
            </select>
          </div>

          <div>
            <div>
              <label htmlFor="acount_number">
                Enter the OTP sent to your email
              </label>
              <input
                id="account_number"
                type="number"
                className="solid"
                placeholder="Enter OTP"
              />
            </div>
            <div className="mt-[16px] w-fit cursor-pointer rounded-full bg-[#B3D5EB] p-[10px] text-[12px] text-[#0072BB]">
              Tap here to Generate OTP
            </div>
          </div>
        </div>

        <button className="btn_creators_solid mt-[116px] mb-[64px]">
          Withdraw
        </button>
      </div>
    </div>
  );
}
