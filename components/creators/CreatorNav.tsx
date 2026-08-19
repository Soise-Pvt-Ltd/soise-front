'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { MenuIcon, CloseIcon, WalletIcon, ArrowUpRightIcon } from '@/components/icons';

interface CreatorNavProps {
  /**
   * Optional creator wallet balance. When provided, a glass balance chip is
   * shown in the bar (matching the old DashboardHeader capability).
   */
  balance?: number;
}

interface NavLink {
  name: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { name: 'Dashboard', href: '/creators/dashboard' },
  { name: 'Request Payout', href: '/creators/dashboard/request-payout' },
  { name: 'Payout Account', href: '/creators/dashboard/withdrawal-bank' },
  { name: 'Tier Upgrade', href: '/creators/dashboard/tier-upgrade' },
  { name: 'Profile', href: '/creators/dashboard/profile' },
  { name: 'Swaz Loop', href: '/creators/swaz-loop' },
];

// Shared focus-visible ring (matches the main site nav quality bar).
const FOCUS_RING =
  'focus-visible:ring-2 focus-visible:ring-[#9C6F2E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F4F1EA] focus-visible:outline-none';

function formatBalance(balance: number) {
  return `₦${balance.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function CreatorNav({ balance }: CreatorNavProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Remember the trigger so focus returns to it on close (a11y).
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Exact-match active detection: dashboard sub-routes (payout, profile, …) are
  // their own links, so we must not light up "Dashboard" for /dashboard/profile.
  const isActive = (href: string) => pathname === href;

  const closeMenu = () => {
    setIsMenuOpen(false);
    triggerRef.current?.focus();
  };

  // Body scroll-lock while the drawer is open; restore the prior value on close.
  useEffect(() => {
    if (!isMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMenuOpen]);

  // Escape closes the drawer.
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeMenu();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMenuOpen]);

  const hasBalance = typeof balance === 'number';
  const balanceTone =
    hasBalance && balance > 0 ? 'text-[#3D6B4A]' : 'text-[#8C3A2B]';

  return (
    <>
      {/* ---------- Suite paper sticky bar ---------- */}
      <div className="sticky top-0 z-40 px-[12px] pt-[12px] md:px-[20px] md:pt-[16px]">
        <nav
          aria-label="Creator portal"
          className="page-shell relative flex items-center justify-between gap-x-3 overflow-hidden rounded-[14px] border border-[#E2DBCC] bg-[#FBF9F4]/95 px-[14px] py-[10px] backdrop-blur-md md:px-[20px]"
        >

          {/* Logo → dashboard */}
          <Link
            href="/creators/dashboard"
            aria-label="Creator dashboard home"
            className={`relative z-10 inline-flex shrink-0 items-center rounded-[8px] ${FOCUS_RING}`}
          >
            <Image
              src="/logo.png"
              alt="Soise"
              width={76}
              height={44}
              priority
              className="h-auto w-[68px] md:w-[76px]"
            />
          </Link>

          {/* Desktop primary links */}
          <div className="relative z-10 hidden items-center gap-x-1 lg:flex">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-full px-[14px] py-[8px] text-[13px] font-medium transition-all duration-200 ${FOCUS_RING} ${
                    active
                      ? 'border border-[#14110E] bg-[#14110E] text-[#F4F1EA]'
                      : 'text-[#5C544A] hover:bg-[#14110E]/[0.04] hover:text-[#14110E]'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Right cluster */}
          <div className="relative z-10 flex shrink-0 items-center gap-x-2 md:gap-x-3">
            {hasBalance && (
              <div className="flex items-center gap-x-2 rounded-full border border-[#E2DBCC] bg-[#F4F1EA] px-[12px] py-[7px]">
                <WalletIcon />
                <span className={`text-[13px] font-semibold tabular-nums ${balanceTone}`}>
                  {formatBalance(balance!)}
                </span>
              </div>
            )}

            {/* Back to Shop — the key missing affordance, made obvious. */}
            <Link
              href="/"
              className={`hidden items-center gap-x-1.5 rounded-full bg-[#14110E] px-[16px] py-[9px] text-[12px] font-semibold tracking-wide text-[#F4F1EA] uppercase transition-all duration-200 hover:bg-[#241f19] active:scale-[0.97] sm:inline-flex ${FOCUS_RING}`}
            >
              Back to Shop <ArrowUpRightIcon />
            </Link>

            {/* Mobile drawer trigger (≥44px tap target) */}
            <button
              type="button"
              onClick={(e) => {
                triggerRef.current = e.currentTarget;
                setIsMenuOpen(true);
              }}
              aria-label="Open creator menu"
              aria-haspopup="dialog"
              aria-expanded={isMenuOpen}
              aria-controls="creator-nav-drawer"
              className={`grid h-11 w-11 place-items-center rounded-full border border-[#E2DBCC] bg-[#FBF9F4] text-[#14110E] transition-colors duration-200 hover:bg-[#EFEBE1] lg:hidden ${FOCUS_RING}`}
            >
              <MenuIcon />
            </button>
          </div>
        </nav>
      </div>

      {/* ---------- Mobile drawer ---------- */}
      {isMenuOpen && (
        <CreatorDrawer
          pathname={pathname}
          isActive={isActive}
          onClose={closeMenu}
          balance={hasBalance ? balance! : undefined}
        />
      )}
    </>
  );
}

/* ---------------- Mobile drawer ---------------- */

function CreatorDrawer({
  isActive,
  onClose,
  balance,
}: {
  pathname: string;
  isActive: (href: string) => boolean;
  onClose: () => void;
  balance?: number;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  // Move focus into the drawer on mount (a11y).
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Simple focus trap: keep Tab / Shift+Tab cycling within the drawer.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const root = panelRef.current;
    if (!root) return;

    const focusable = Array.from(
      root.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);

    if (focusable.length === 0) {
      e.preventDefault();
      closeButtonRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (e.shiftKey) {
      if (active === first || !root.contains(active)) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const hasBalance = typeof balance === 'number';
  const balanceTone =
    hasBalance && balance! > 0 ? 'text-[#3D6B4A]' : 'text-[#8C3A2B]';

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 z-40 bg-[#0E0E10]/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/* Paper drawer */}
      <div
        ref={panelRef}
        id="creator-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Creator portal menu"
        onKeyDown={handleKeyDown}
        className="fixed inset-y-0 right-0 z-50 flex w-[84%] max-w-[340px] flex-col border-l border-[#E2DBCC] bg-[#FBF9F4]"
      >
        <div className="flex items-center justify-between px-[20px] pt-[22px] pb-[18px]">
          <span className="text-[12px] font-medium tracking-[0.18em] text-[#8C8377] uppercase">
            Creator Portal
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className={`grid h-11 w-11 place-items-center rounded-full border border-[#E2DBCC] bg-[#F4F1EA] text-[#14110E] transition-colors hover:bg-[#EFEBE1] ${FOCUS_RING}`}
          >
            <CloseIcon />
          </button>
        </div>

        {hasBalance && (
          <div className="mx-[20px] mb-[8px] flex items-center justify-between rounded-[14px] border border-[#E2DBCC] bg-[#F4F1EA] px-[16px] py-[12px]">
            <span className="flex items-center gap-x-2 text-[13px] font-medium text-[#3F3830]">
              <WalletIcon /> Balance
            </span>
            <span className={`text-[14px] font-semibold tabular-nums ${balanceTone}`}>
              {formatBalance(balance!)}
            </span>
          </div>
        )}

        <nav
          aria-label="Creator portal"
          className="flex-1 overflow-y-auto px-[12px] py-[8px]"
        >
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                onClick={onClose}
                className={`flex min-h-[48px] items-center rounded-[12px] px-[16px] text-[15px] font-medium transition-all duration-200 ${FOCUS_RING} ${
                  active
                    ? 'bg-[#14110E] text-[#F4F1EA]'
                    : 'text-[#3F3830] hover:bg-[#14110E]/[0.04] hover:text-[#14110E]'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Back to Shop, pinned at the bottom */}
        <div className="border-t border-[#E2DBCC] px-[20px] py-[18px]">
          <Link
            href="/"
            onClick={onClose}
            className={`flex min-h-[48px] items-center justify-center gap-x-1.5 rounded-full bg-[#14110E] px-[16px] text-[13px] font-semibold tracking-wide text-[#F4F1EA] uppercase transition-all hover:bg-[#241f19] active:scale-[0.98] ${FOCUS_RING}`}
          >
            Back to Shop <ArrowUpRightIcon />
          </Link>
        </div>
      </div>
    </>
  );
}
