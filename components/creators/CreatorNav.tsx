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
  'focus-visible:ring-2 focus-visible:ring-[#0072BB] focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:outline-none';

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
    hasBalance && balance > 0 ? 'text-[#15803D]' : 'text-[#FF8073]';

  return (
    <>
      {/* ---------- Liquid Glass sticky bar ---------- */}
      <div className="sticky top-0 z-40 px-[12px] pt-[12px] md:px-[20px] md:pt-[16px]">
        <nav
          aria-label="Creator portal"
          className="relative mx-auto flex max-w-7xl items-center justify-between gap-x-3 overflow-hidden rounded-[18px] border border-white/50 bg-white/55 px-[14px] py-[10px] shadow-[0_8px_32px_rgba(15,23,42,0.10)] ring-1 ring-white/40 backdrop-blur-xl backdrop-saturate-150 md:px-[20px]"
        >
          {/* Refractive top highlight — a soft inset gradient hairline that gives
              the glass its "lit edge" without hurting legibility. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[18px] bg-gradient-to-b from-white/70 via-white/0 to-white/20"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent"
          />

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
                      ? 'border border-white/60 bg-white/70 text-[#0072BB] shadow-[0_2px_10px_rgba(0,114,187,0.18)]'
                      : 'text-[#35373C] hover:bg-white/50 hover:text-[#121212]'
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
              <div className="flex items-center gap-x-2 rounded-full border border-white/60 bg-white/70 px-[12px] py-[7px] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                <WalletIcon />
                <span className={`text-[13px] font-semibold tabular-nums ${balanceTone}`}>
                  {formatBalance(balance!)}
                </span>
              </div>
            )}

            {/* Back to Shop — the key missing affordance, made obvious. */}
            <Link
              href="/"
              className={`hidden items-center gap-x-1.5 rounded-full bg-[#121212] px-[16px] py-[9px] text-[12px] font-semibold tracking-wide text-white uppercase transition-all duration-200 hover:bg-[#2a2a2a] hover:shadow-[0_6px_20px_rgba(0,0,0,0.25)] active:scale-[0.97] sm:inline-flex ${FOCUS_RING}`}
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
              className={`grid h-11 w-11 place-items-center rounded-full border border-white/60 bg-white/70 text-[#121212] transition-colors duration-200 hover:bg-white/90 lg:hidden ${FOCUS_RING}`}
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
    hasBalance && balance! > 0 ? 'text-[#15803D]' : 'text-[#FF8073]';

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
        onClick={onClose}
      />
      {/* Glass drawer */}
      <div
        ref={panelRef}
        id="creator-nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Creator portal menu"
        onKeyDown={handleKeyDown}
        className="fixed inset-y-0 right-0 z-50 flex w-[84%] max-w-[340px] flex-col border-l border-white/50 bg-white/80 shadow-[0_8px_40px_rgba(15,23,42,0.25)] ring-1 ring-white/40 backdrop-blur-2xl backdrop-saturate-150"
      >
        <div className="flex items-center justify-between px-[20px] pt-[22px] pb-[18px]">
          <span className="text-[12px] font-semibold tracking-[0.14em] text-[#8E8E93] uppercase">
            Creator Portal
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className={`grid h-11 w-11 place-items-center rounded-full border border-white/60 bg-white/70 text-[#121212] transition-colors hover:bg-white/90 ${FOCUS_RING}`}
          >
            <CloseIcon />
          </button>
        </div>

        {hasBalance && (
          <div className="mx-[20px] mb-[8px] flex items-center justify-between rounded-[14px] border border-white/60 bg-white/70 px-[16px] py-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
            <span className="flex items-center gap-x-2 text-[13px] font-medium text-[#35373C]">
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
                    ? 'border border-white/60 bg-white/80 text-[#0072BB] shadow-[0_2px_10px_rgba(0,114,187,0.18)]'
                    : 'text-[#35373C] hover:bg-white/60 hover:text-[#121212]'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Back to Shop, pinned at the bottom */}
        <div className="border-t border-white/50 px-[20px] py-[18px]">
          <Link
            href="/"
            onClick={onClose}
            className={`flex min-h-[48px] items-center justify-center gap-x-1.5 rounded-[12px] bg-[#121212] px-[16px] text-[13px] font-semibold tracking-wide text-white uppercase transition-all hover:bg-[#2a2a2a] active:scale-[0.98] ${FOCUS_RING}`}
          >
            Back to Shop <ArrowUpRightIcon />
          </Link>
        </div>
      </div>
    </>
  );
}
