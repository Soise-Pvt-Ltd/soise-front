'use client';

import { useState, useEffect, ReactNode } from 'react';
import Nav from './nav';
import Image from 'next/image';
import AdminGlobalSearch from './AdminGlobalSearch';
import { useRouter } from 'next/navigation';
import { ToastContainer } from './toast';
import StatueWatermark from '@/components/brand/StatueWatermark';

interface GridContainerProps {
  children: ReactNode;
  user?: { username?: string; [key: string]: unknown };
}

/**
 * The admin shell, in the /about design language.
 *
 * The suite reads as one object: an ink spine (the dark sections of /about)
 * holding a bone page (its light ones). No blue chrome, no drop shadows —
 * hairlines, serif headings and a single gold accent, exactly as the
 * storefront presents itself.
 */
const GridContainer = ({ children, user }: GridContainerProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const userName = user?.username || 'Admin';

  const toggleMenu = () => setOpen((v) => !v);

  // The drawer used to be gated on a `screenWidth` state that started at 0 on
  // the server, so the whole branch flipped after mount. A CSS breakpoint does
  // the same job without the hydration churn.
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  // A drawer that leaves the page scrollable behind it feels broken on touch.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const sidebar = (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#0E0E10]">
      <button
        className="shrink-0 cursor-pointer px-6 pt-8 pb-7 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#C4AA6E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0E0E10]"
        onClick={() => router.push('/')}
        aria-label="Go to homepage"
      >
        {/* The muse-in-meander emblem, not the full main-logo: that mark is a
            wide two-part composition and collapses to noise at this size. This
            one is square, and it is the exact figure /about's ethos section
            describes. It's transparent line art, so `invert` recolours the
            lines to bone without touching the background. */}
        <Image
          src="/swz.png"
          alt="Soise"
          width={96}
          height={96}
          priority
          className="h-[48px] w-[48px] object-contain invert"
        />
        <p className="ad-eyebrow-on-ink mt-4 !text-[10px]">Admin suite</p>
      </button>

      <div className="scrollbar-hide relative z-10 flex-1 overflow-y-auto">
        <Nav />
      </div>

      {/* The muse at the foot of the spine. Anchored hard into the bottom-left
          corner so it reads as texture in the margin rather than a backdrop
          behind the nav links, and at 0.10 rather than 0.06 — on #0E0E10 the
          lower value resolves to about #1E1E20 and simply isn't there. */}
      <StatueWatermark
        tone="light"
        width={200}
        opacity={0.1}
        className="pointer-events-none absolute bottom-[-44px] left-[-58px] z-0"
      />
    </div>
  );

  return (
    <>
      {/* ── Mobile bar ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-[#E2DBCC] bg-[#F4F1EA] px-5 py-4 lg:hidden">
        <button
          onClick={() => router.push('/')}
          className="cursor-pointer"
          aria-label="Go to homepage"
        >
          <Image
            src="/swz.png"
            alt="Soise"
            width={72}
            height={72}
            priority
            className="h-[36px] w-[36px] object-contain"
          />
        </button>
        <button
          className="flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-full border border-[#DFD7C6] text-[#14110E] outline-none transition-colors hover:border-[#14110E] focus-visible:ring-2 focus-visible:ring-[#9C6F2E]"
          onClick={toggleMenu}
          aria-label="Open navigation menu"
          aria-expanded={open}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M3 9a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 9Zm0 6.75a.75.75 0 0 1 .75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </header>

      {/* ── Mobile drawer ──────────────────────────────────────── */}
      {open && (
        <div className="lg:hidden">
          <div
            className="fixed inset-0 z-70 bg-[#0E0E10]/70 backdrop-blur-[2px]"
            onClick={toggleMenu}
            aria-hidden="true"
          />
          <aside
            className="fixed top-0 left-0 z-70 h-full w-[300px] max-w-[85vw]"
            role="navigation"
            aria-label="Main navigation"
          >
            {sidebar}
          </aside>
          <button
            onClick={toggleMenu}
            className="fixed top-4 right-4 z-70 flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-full border border-[#F4F1EA]/25 text-[#F4F1EA] outline-none focus-visible:ring-2 focus-visible:ring-[#C4AA6E]"
            aria-label="Close navigation menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* ── Frame ──────────────────────────────────────────────── */}
      <div className="relative min-h-screen bg-[#F4F1EA] text-[#14110E]">
        {/* The bone canvas is the suite's largest surface and the direct
            analogue of /about's light sections, where the statue always drifts
            at the edge. AmbientStatue deliberately skips /dashboard, so the
            page carries its own.

            Fixed rather than absolute: the content column is its own scroll
            container, so an absolutely-positioned mark would anchor to the
            bottom of the scrolled content — miles down a long products list —
            instead of resting in the corner of the view. The grid above is
            transparent, so this shows through in the gutters and is covered by
            the opaque cards, exactly as it is on /about.

            The `shell-max` wrapper is load-bearing, for the same reason
            AmbientStatue carries one: <body> is capped and centred, so a
            plain viewport-fixed mark strands itself in the empty side rail on
            anything wider than 1536px. This box re-creates the content column
            and the statue hangs off its edge. */}
        <div className="shell-max pointer-events-none fixed inset-0 z-0 hidden lg:block">
          <StatueWatermark
            tone="dark"
            width={400}
            opacity={0.04}
            className="absolute right-[-100px] bottom-[-40px]"
          />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:h-screen lg:grid-cols-[248px_1fr] lg:overflow-hidden 3xl:grid-cols-[276px_1fr]">
          <div className="hidden h-screen lg:block">{sidebar}</div>

          <div className="scrollbar-hide col-span-1 block min-h-screen overflow-y-auto">
            <div className="flex flex-col justify-between gap-4 border-b border-[#E2DBCC] px-6 py-6 lg:flex-row lg:items-center lg:px-10">
              <div>
                <p className="ad-eyebrow">Say less, look more</p>
                <p className="ad-display mt-1.5 text-[22px] leading-none text-[#14110E]">
                  Hello, {userName}
                </p>
              </div>
              <AdminGlobalSearch />
            </div>
            <div className="px-6 py-8 lg:px-10">{children}</div>
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
};

export default GridContainer;
