'use client';

import Link from 'next/link';
import { useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

import {
  AdminOverviewIcon,
  AdminProductsIcon,
  AdminUsersIcon,
  AdminPayoutIcon,
  AdminAnalyticsIcon,
  AdminSettingsIcon,
  AdminCreatorsIcon,
  AdminOrdersIcon,
} from '@/components/icons';

const Nav = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
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
          </div>
        </div>
      </nav>
    </>
  );
};

export default Nav;

interface LinksProps {
  path: string;
  svg: ReactNode;
  linkname: string;
}

function Links({ path, svg, linkname }: LinksProps) {
  const route = usePathname();
  return (
    <>
      <div>
        <Link href={path} className="text-[14px]">
          <div
            className={
              route === path
                ? 'rounded-[10px] bg-[#B3D5EB] p-[13px] text-[#0072BB]'
                : 'p-[13px] text-[#C8C8CA] hover:lg:text-[#0072BB]'
            }
          >
            <div className="flex items-center gap-x-[10px] text-base">
              <p>{svg}</p>
              <p>{linkname}</p>
            </div>
          </div>
        </Link>
      </div>
    </>
  );
}
