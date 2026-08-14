'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
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

const TagIcon = (
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
);

/**
 * Eleven flat links in one undifferentiated column gave no sense of what this
 * dashboard is for. Grouped under gold eyebrows, the shape of the business
 * reads at a glance: what we sell, who sells it, who buys it.
 */
const SECTIONS: {
  heading: string;
  links: { path: string; icon: ReactNode; label: string }[];
}[] = [
  {
    heading: 'The house',
    links: [
      { path: '/dashboard', icon: <AdminOverviewIcon />, label: 'Overview' },
      { path: '/dashboard/products', icon: <AdminProductsIcon />, label: 'Products' },
      { path: '/dashboard/orders', icon: <AdminOrdersIcon />, label: 'Orders' },
      { path: '/dashboard/home-content', icon: <AdminSettingsIcon />, label: 'Home Page' },
    ],
  },
  {
    heading: 'The stage',
    links: [
      { path: '/dashboard/creators', icon: <AdminCreatorsIcon />, label: 'Creators' },
      { path: '/dashboard/creator-codes', icon: TagIcon, label: 'Creator Codes' },
      { path: '/dashboard/applications', icon: <AdminCheckCircleIcon />, label: 'Applications' },
      { path: '/dashboard/tier-requests', icon: <AdminBadge1 />, label: 'Tier Requests' },
      { path: '/team', icon: <AdminCreatorsIcon />, label: 'Creator Team' },
      { path: '/dashboard/payout', icon: <AdminPayoutIcon />, label: 'Payout' },
    ],
  },
  {
    heading: 'The people',
    links: [{ path: '/dashboard/users', icon: <AdminUsersIcon />, label: 'Users' }],
  },
];

const Nav = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className="relative px-4 pb-6" aria-label="Admin sections">
      {SECTIONS.map((section) => (
        <div key={section.heading} className="mb-7">
          <p className="suite-eyebrow-on-ink mb-3 px-3 !text-[10px] opacity-70">
            {section.heading}
          </p>
          <div className="space-y-0.5">
            {section.links.map((link) => (
              <Links
                key={link.path + link.label}
                path={link.path}
                svg={link.icon}
                linkname={link.label}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="mt-8 border-t border-[#E2DBCC]/10 pt-5">
        <Links onClick={handleLogout} svg={<AdminLogoutIcon />} linkname="Log out" />
      </div>
    </nav>
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
  const isActive = path
    ? path === '/dashboard'
      ? route === path
      : route.startsWith(path)
    : false;

  const content = (
    <div
      className={`relative rounded-[10px] py-2.5 pr-3 pl-4 transition-colors duration-200 ${
        isActive
          ? 'bg-[#F4F1EA]/[0.07] text-[#F4F1EA]'
          : 'text-[#9F9A8E] hover:bg-[#F4F1EA]/[0.04] hover:text-[#F4F1EA]'
      }`}
    >
      {/* A gold rule marks the current section rather than a filled chip —
          the same accent /about uses to mark its numbered chapters. */}
      <span
        aria-hidden="true"
        className={`absolute top-1/2 left-0 h-[16px] w-[2px] -translate-y-1/2 rounded-full transition-opacity duration-200 ${
          isActive ? 'bg-[#C4AA6E] opacity-100' : 'opacity-0'
        }`}
      />
      <div className="flex items-center gap-x-3 text-[13.5px]">
        <span
          aria-hidden="true"
          className={isActive ? 'text-[#C4AA6E]' : 'text-current opacity-70'}
        >
          {svg}
        </span>
        <span>{linkname}</span>
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-[#C4AA6E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0E10] hover:!cursor-pointer"
        aria-label={linkname}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={path || '#'}
      className="block outline-none focus-visible:ring-2 focus-visible:ring-[#C4AA6E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0E10]"
      aria-current={isActive ? 'page' : undefined}
    >
      {content}
    </Link>
  );
}
