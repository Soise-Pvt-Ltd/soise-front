'use client';

import { CloseIcon } from '@/components/icons';
import Link from 'next/link';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  showMenuItems?: boolean;
}

const menu_1 = [
  {
    name: 'Dashboard',
    href: '/creators/dashboard',
  },
  {
    name: 'Request Payout',
    href: '/creators/dashboard/request-payout',
  },
  {
    name: 'Creator Profile',
    href: '/creators/dashboard/profile',
  },
];

function FullscreenPanel({ children, onClose }: any) {
  return (
    <div className="text-primary fixed inset-0 z-50 flex min-h-screen w-full flex-col bg-white">
      {/* Panel Header */}
      <div className="flex justify-between px-[24px] pt-[70px] pb-[64px]">
        <div></div>
        <button onClick={onClose} className="cursor-pointer">
          <CloseIcon />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-grow overflow-y-auto pb-[24px]">{children}</div>
    </div>
  );
}

export default function Menu({
  isOpen,
  onClose,
  showMenuItems = true,
}: MenuProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <FullscreenPanel onClose={onClose}>
      <div className="flex h-full flex-col justify-end">
        {showMenuItems && (
          <div className="flex-grow space-y-[36px] px-[24px] !text-[13px] !font-medium text-[#121212] uppercase">
            {menu_1.map((item, index) => (
              <div key={index}>
                <Link href={item.href} className="hover:cursor-pointer">
                  {item.name}
                </Link>
              </div>
            ))}
          </div>
        )}
        <div className="px-[24px] pt-[40px] text-[13px] text-[#121212]">
          Country / Region: NG / English
        </div>
      </div>
    </FullscreenPanel>
  );
}
