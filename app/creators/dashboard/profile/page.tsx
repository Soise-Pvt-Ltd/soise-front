'use client';

import { useRouter } from 'next/navigation';
import DashboardHeader from '../DashboardHeader';
import {
  CameraIcon,
  ArrowProfileRightIcon,
  CopyIcon,
  ArrowLeftIcon,
} from '@/components/icons';
import { useState } from 'react';

export default function profilePage() {
  const router = useRouter();
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
      <div className="mx-auto flex flex-col gap-[16px] px-[16px] pt-[24px] pb-[121px] md:max-w-7xl md:px-0">
        <div
          className="flex items-center gap-x-2 hover:cursor-pointer"
          onClick={() => router.back()}
        >
          <ArrowLeftIcon />{' '}
          <span className="font-bold uppercase">My profile</span>
        </div>
        <div className="space-y-[30px] rounded-[10px] bg-white p-[16px]">
          <div className="relative mx-auto mb-[36px] size-[64px] rounded-full md:mx-0">
            <img
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=2960&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Profile picture"
              className="h-full w-full rounded-full object-cover"
            />
            <div className="absolute bottom-0 flex h-1/2 w-full cursor-pointer items-center justify-center rounded-b-full bg-[#D1D1D6E5]">
              <button title="Change profile picture">
                <CameraIcon />
              </button>
            </div>
          </div>
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

        <div className="space-y-[30px] rounded-[10px] bg-white p-[16px]">
          {profileDetails.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="w-[40%] text-[#121212]">{item.label}</div>
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
