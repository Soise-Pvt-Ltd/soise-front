'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { MenuIcon, CloseIcon, WalletIcon, ArrowUpRightIcon } from '@/components/icons';

interface CreatorNavProps {
  /**
   * Optional creator wallet balance. When provided, a plated balance chip is
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
  'focus-visible:ring-2 focus-visible:ring-[#B3101C] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F0E8] focus-visible:outline-none';

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
  // One accent only: a funded wallet is plain ink, an empty one is the crimson
  // that needs attention. No traffic-light green/red.
  const balanceTone =
    hasBalance && balance > 0 ? 'text-[#121212]' : 'text-[#B3101C]';

  return (
    <>
      {/* ---------- Pressed Ink masthead ---------- */}
      <div className="sticky top-0 z-40 border-b-2 border-[#121212] bg-[#F5F0E8]">
        <nav
          aria-label="Creator portal"
          className="page-shell relative flex items-center justify-between gap-x-3 px-[14px] py-[12px] md:px-[20px]"
        >

          {/* Logo → dashboard */}
          <Link
            href="/creators/dashboard"
            aria-label="Creator dashboard home"
            className={`brut-plate brut-press relative z-10 inline-flex shrink-0 items-center px-[10px] py-[6px] ${FOCUS_RING}`}
          >
            <Image
              src="/logo.png"
              alt="Soise"
              width={76}
              height={44}
              priority
              className="h-auto w-[62px] md:w-[70px]"
            />
          </Link>

          {/* Desktop primary links — small plates; the active one is inked in. */}
          <div className="relative z-10 hidden items-center gap-x-1.5 lg:flex">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-[2px] border-2 px-[12px] py-[7px] text-[11px] font-bold tracking-[0.1em] uppercase transition-colors duration-200 ${FOCUS_RING} ${
                    active
                      ? 'border-[#121212] bg-[#121212] text-white'
                      : 'border-transparent text-[#5C544A] hover:border-[#121212] hover:text-[#121212]'
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
              <div className="brut-plate flex items-center gap-x-2 px-[12px] py-[8px]">
                <WalletIcon />
                <span className={`text-[13px] font-bold tabular-nums ${balanceTone}`}>
                  {formatBalance(balance!)}
                </span>
              </div>
            )}

            {/* Back to Shop — the key missing affordance, made obvious. The one
                ink-filled plate in the bar. */}
            <Link
              href="/"
              className={`brut-press hidden items-center gap-x-1.5 rounded-[2px] border-2 border-[#121212] bg-[#121212] px-[16px] py-[9px] text-[11px] font-bold tracking-[0.14em] text-white uppercase sm:inline-flex ${FOCUS_RING}`}
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
              className={`brut-plate brut-press grid h-11 w-11 place-items-center text-[#121212] lg:hidden ${FOCUS_RING}`}
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
    hasBalance && balance! > 0 ? 'text-[#121212]' : 'text-[#B3101C]';

  return (
    <>
      {/* Scrim — flat ink, no blur. */}
      <div
        className="fixed inset-0 z-40 bg-[#121212]/40"
        onClick={onClose}
      />
      {/* Plated paper drawer */}
      <div
        ref={panelRef}
        id="creator-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Creator portal menu"
        onKeyDown={handleKeyDown}
        className="fixed inset-y-0 right-0 z-50 flex w-[84%] max-w-[340px] flex-col border-l-2 border-[#121212] bg-[#F5F0E8]"
      >
        <div className="flex items-center justify-between border-b-2 border-[#121212] px-[20px] pt-[22px] pb-[18px]">
          <span className="brut-label text-[#B3101C]">
            Creator Portal
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className={`brut-plate brut-press grid h-11 w-11 place-items-center text-[#121212] ${FOCUS_RING}`}
          >
            <CloseIcon />
          </button>
        </div>

        {hasBalance && (
          <div className="brut-plate mx-[20px] mt-[18px] mb-[10px] flex items-center justify-between px-[16px] py-[12px]">
            <span className="flex items-center gap-x-2 text-[13px] font-medium text-[#3F3830]">
              <WalletIcon /> Balance
            </span>
            <span className={`text-[14px] font-bold tabular-nums ${balanceTone}`}>
              {formatBalance(balance!)}
            </span>
          </div>
        )}

        {/* Plate the container, rule the rows — a stack of shadowed cards is
            unreadable at this length. */}
        <nav
          aria-label="Creator portal"
          className="brut-plate mx-[20px] mt-[8px] flex-1 overflow-y-auto p-0"
        >
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                onClick={onClose}
                className={`flex min-h-[52px] items-center border-b-2 border-[#121212] px-[16px] text-[12px] font-bold tracking-[0.1em] uppercase transition-colors duration-200 last:border-b-0 ${FOCUS_RING} ${
                  active
                    ? 'bg-[#121212] text-white'
                    : 'text-[#3F3830] hover:bg-[#F5F0E8] hover:text-[#121212]'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Back to Shop, pinned at the bottom */}
        <div className="border-t-2 border-[#121212] px-[20px] py-[18px]">
          <Link
            href="/"
            onClick={onClose}
            className={`brut-btn brut-press gap-x-1.5 ${FOCUS_RING}`}
          >
            Back to Shop <ArrowUpRightIcon />
          </Link>
        </div>
      </div>
    </>
  );
}
