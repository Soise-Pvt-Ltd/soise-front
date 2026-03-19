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

export default function ProfileClient({ dashboard }: any) {
  const router = useRouter();
  const [copiedReferralCode, setCopiedReferralCode] = useState(false);

  // Extract data from dashboard prop
  const profile = dashboard?.profile;
  const referralCode = dashboard?.creator_code?.code || 'N/A';
  const tier = dashboard?.tier || {};
  const withdrawalBank = dashboard?.withdrawal_bank || {};
  const currentBalance = dashboard?.earnings?.current_balance || 0;

  const handleCopyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedReferralCode(true);
      setTimeout(() => {
        setCopiedReferralCode(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Dynamic profile details using dashboard data
  const profileDetails = [
    {
      label: 'Full Name',
      value: profile?.full_name || 'Not set',
      hasArrow: true,
      truncate: false,
    },
    {
      label: 'Mobile Number',
      value: profile?.phone || 'Not set',
      hasArrow: true,
      truncate: false,
    },
    {
      label: 'Gender',
      value: profile?.gender || 'Not set',
      hasArrow: true,
      truncate: false,
    },
    {
      label: 'Email',
      value: profile?.email || 'Not set',
      hasArrow: true,
      truncate: false,
    },
    {
      label: 'Address',
      value: profile?.address || 'Not set',
      hasArrow: true,
      truncate: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <DashboardHeader balance={currentBalance} />
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
              src={`https://ui-avatars.com/api/?name=${profile.full_name[0]}&background=F5F5F5&color=000000`}
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
              <div>{referralCode}</div>
              <div
                className="flex cursor-pointer items-center gap-x-1"
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
              <div className="">{tier?.name || 'No Tier'}</div>
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
                <div>{withdrawalBank?.bank_name || 'Not set'}</div>
                <div className="text-[12px]">
                  {withdrawalBank?.account_number || 'N/A'}
                </div>
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
