'use client';

import Link from 'next/link';
import { useState, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/components/home/nav/actions';

import {
  AdminOverviewIcon,
  AdminProductsIcon,
  AdminUsersIcon,
  AdminPayoutIcon,
  AdminLogoutIcon,
  AdminCreatorsIcon,
  AdminOrdersIcon,
} from '@/components/icons';

const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <>
      <nav className="relative">
        <div className="space-y-3 px-5">
          <Links
            path={'/dashboard'}
            svg={<AdminOverviewIcon />}
            linkname={'Overview'}
          />

          <Links
            path={'/dashboard/products'}
            svg={<AdminProductsIcon />}
            linkname={'Products'}
          />

          <Links
            path={'/dashboard/users'}
            svg={<AdminUsersIcon />}
            linkname={'Users'}
          />
          <Links
            path={'/dashboard/creators'}
            svg={<AdminCreatorsIcon />}
            linkname={'Creators'}
          />

          <Links
            path={'/dashboard/orders'}
            svg={<AdminOrdersIcon />}
            linkname={'Orders'}
          />

          <Links
            path={'/dashboard/payout'}
            svg={<AdminPayoutIcon />}
            linkname={'Payout'}
          />

          <Links
            onClick={handleLogout}
            svg={<AdminLogoutIcon />}
            linkname={'Logout'}
          />
          {/* <Links
            path={'/dashboard/analytics'}
            svg={<AdminAnalyticsIcon />}
            linkname={'Analytics'}
          />
          <div>
            <Links
              path={'/dashboard/settings'}
              svg={<AdminSettingsIcon />}
              linkname={'Settings'}
            />
          </div> */}
        </div>
      </nav>
    </>
  );
};

export default Nav;

interface LinksProps {
  path?: string;
  svg: ReactNode;
  linkname: string;
  onClick?: () => void;
}

function Links({ path, svg, linkname, onClick }: LinksProps) {
  const route = usePathname();
  const isActive = path ? (path === '/dashboard' ? route === path : route.startsWith(path)) : false;

  const content = (
    <div
      className={
        isActive
          ? 'rounded-[10px] bg-[#B3D5EB] p-[13px] text-[#0072BB]'
          : 'rounded-[10px] p-[13px] text-[#C8C8CA] transition-colors duration-150 hover:bg-[#F5F5F5] hover:lg:text-[#0072BB]'
      }
    >
      <div className="flex items-center gap-x-[10px] text-base">
        <span aria-hidden="true">{svg}</span>
        <span>{linkname}</span>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[#0072BB] focus-visible:ring-offset-2 hover:!cursor-pointer"
        aria-label={linkname}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={path || '#'}
      className="block text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-[#0072BB] focus-visible:ring-offset-2"
      aria-current={isActive ? 'page' : undefined}
    >
      {content}
    </Link>
  );
}
