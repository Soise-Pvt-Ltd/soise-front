'use client';

import { useState } from 'react';
import { CopyIcon, ShareIcon } from '@/components/icons';

interface ReferralCodeProps {
  code: string;
}

export default function ReferralCode({ code }: ReferralCodeProps) {
  const [isCopied, setIsCopied] = useState(false);

  const copy = async (text: string) => {
    if (isCopied) return; // Prevent multiple clicks
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000); // Revert back to icon after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Soise Creator Code',
          text: `Use my creator code on Soise: ${code}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copy(`Use my creator code on Soise: ${code}`);
    }
  };

  return (
    <div className="p-[12px]">
      <p className="mb-[16px] text-[#8E8E93]">Creator code</p>

      <div className="flex items-center gap-x-[17px]">
        <div className="space-y-[16px] font-semibold">
          <span>Referral code: </span>
          <span className="text-[#0072BB]">{code}</span>
        </div>
        <div onClick={() => copy(code)} className="w-[55px] cursor-pointer">
          {isCopied ? (
            <span className="text-sm font-medium text-green-600">Copied!</span>
          ) : (
            <CopyIcon />
          )}
        </div>
      </div>

      <div className="pt-[24px] text-[13px] text-[#8E8E93]">
        Invite customers and promote SOISE.
      </div>

      <button
        onClick={handleShare}
        className="btn_black mt-[24px] flex items-center justify-center gap-x-2 !text-[12px] !font-medium !capitalize sm:!w-fit sm:!px-[40px]"
      >
        share creator code <ShareIcon />
      </button>
    </div>
  );
}
