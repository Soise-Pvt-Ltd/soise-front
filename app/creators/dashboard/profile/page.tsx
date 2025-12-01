'use client';

import DashboardHeader from '../DashboardHeader';
import {
  ArrowProfileRightIcon,
  CopyIcon,
  ArrowLeftIcon,
} from '@/components/icons';
import { useState } from 'react';

export default function profilePage() {
  const [copiedReferralCode, setCopiedReferralCode] = useState(false);

  const referralCode = 'CREATOR2024'; // Define the referral code

  const handleCopyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedReferralCode(true);
      setTimeout(() => {
        setCopiedReferralCode(false);
      }, 2000); // Reset "Copied!" message after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Optionally, provide user feedback about the failure
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <DashboardHeader balance={0.0} />
      <div className="mx-auto flex flex-col gap-[16px] px-[16px] py-[24px] md:max-w-7xl md:px-0">
        <div className="flex items-center gap-x-2">
          <ArrowLeftIcon />{' '}
          <span className="font-bold uppercase">My profile</span>
        </div>
        <div className="space-y-[30px] rounded-[10px] bg-white p-[16px] text-sm">
          <div className="mx-auto mb-[36px] size-[64px] rounded-full bg-[#f9f9f9] md:mx-0"></div>
          <div className="flex items-center justify-between">
            <div>Referral Code</div>
            <div className="flex items-center gap-x-[8px] text-[#AEAEB2]">
              <div>{referralCode}</div> {/* Use the variable here */}
              <div
                className="flex cursor-pointer items-center gap-x-1" // Make it clickable and add some spacing for "Copied!"
                onClick={handleCopyReferralCode}
                title="Copy referral code"
              >
                {copiedReferralCode ? (
                  <span className="text-green-600">Copied!</span>
                ) : (
                  <CopyIcon />
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>Account Tier</div>
            <div className="flex cursor-pointer items-center gap-x-[8px] text-[#AEAEB2]">
              <div className="">Tier 3</div>
              <div>
                <ArrowProfileRightIcon />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-[30px] rounded-[10px] bg-white p-[16px] text-sm">
          {profileDetails.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="w-[40%] text-gray-800">{item.label}</div>
              <div className="flex w-[60%] cursor-pointer items-center justify-end gap-x-[8px] text-[#AEAEB2]">
                <div className={item.truncate ? 'truncate' : ''}>
                  {item.value}
                </div>
                {item.hasArrow && (
                  <div>
                    <ArrowProfileRightIcon />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-[10px] bg-white p-[16px]">
          <div className="flex items-center justify-between">
            <div>Withdrawal Bank</div>
            <div className="flex cursor-pointer items-center gap-x-[8px] text-[#AEAEB2]">
              <div className="text-right">
                <div>Ecobank</div>
                <div className="text-[12px]">27893212456</div>
              </div>
              <div>
                <ArrowProfileRightIcon />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const profileDetails = [
  {
    label: 'Full Name',
    value: 'John Swazz',
    hasArrow: true,
    truncate: false,
  },
  {
    label: 'Mobile Number',
    value: '1234567890',
    hasArrow: true,
    truncate: false,
  },
  {
    label: 'Gender',
    value: 'Male',
    hasArrow: true,
    truncate: false,
  },
  {
    label: 'Email',
    value: 'boy@example.com',
    hasArrow: true,
    truncate: false,
  },
  {
    label: 'Address',
    value:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    hasArrow: true,
    truncate: true,
  },
];
