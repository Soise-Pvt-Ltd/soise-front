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
  AdminCheckCircleIcon,
  AdminBadge1,
  AdminSettingsIcon,
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
            path={'/dashboard/home-content'}
            svg={<AdminSettingsIcon />}
            linkname={'Home Page'}
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
            path={'/dashboard/creator-codes'}
            svg={
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.2 1.6H3.2a1.6 1.6 0 0 0-1.6 1.6v5c0 .42.17.83.47 1.13l5.6 5.6c.62.62 1.64.62 2.26 0l4.4-4.4c.62-.62.62-1.64 0-2.26l-5.6-5.6c-.3-.3-.71-.47-1.13-.47ZM4.8 5.6a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6Z"
                  fill="currentColor"
                />
              </svg>
            }
            linkname={'Creator Codes'}
          />

          <Links
            path={'/dashboard/applications'}
            svg={<AdminCheckCircleIcon />}
            linkname={'Applications'}
          />

          <Links
            path={'/dashboard/tier-requests'}
            svg={<AdminBadge1 />}
            linkname={'Tier Requests'}
          />

          <Links
            path={'/dashboard/orders'}
            svg={<AdminOrdersIcon />}
            linkname={'Orders'}
          />

          <Links
            path={'/team'}
            svg={<AdminCreatorsIcon />}
            linkname={'Creator Team'}
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
