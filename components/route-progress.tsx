'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * A thin progress bar for route transitions.
 *
 * Fills the gap the loading.tsx skeletons don't: navigations too quick to
 * justify a full skeleton but too slow to feel instant — roughly 300ms to 1s,
 * which on this store's TTFB is most of them. Without it a tap in that band
 * produces no motion at all and reads as a tap that didn't register.
 *
 * Why not useLinkStatus, which Next provides for exactly this: it only reports
 * the pending state of the <Link> it is rendered INSIDE, so a global bar would
 * mean wrapping every Link in the app and routing each one's state up. This
 * listens for the click instead — one component, no per-link wiring, and it
 * covers anchors rendered by code that doesn't know this exists.
 *
 * Deliberately NOT using useSearchParams to detect completion: reading it in a
 * client component under the root layout opts every page into dynamic
 * rendering, which would cost far more than this bar is worth.
 */

/** Below this, a navigation feels instant and a bar would only flicker. */
const SHOW_AFTER_MS = 180;
/** Nothing should be able to leave the bar stuck on screen. */
const MAX_VISIBLE_MS = 15000;

export default function RouteProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);

  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const creepTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const failsafe = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAll = () => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (creepTimer.current) clearInterval(creepTimer.current);
    if (failsafe.current) clearTimeout(failsafe.current);
    if (settle.current) clearTimeout(settle.current);
    showTimer.current = creepTimer.current = failsafe.current = settle.current = null;
  };

  // Snap to full, then fade out and unmount. Called both by the pathname
  // effect and by the creep interval's URL watch, whichever notices first.
  const finish = () => {
    clearAll();
    setWidth(100);
    settle.current = setTimeout(() => {
      setVisible(false);
      setWidth(0);
    }, 260);
  };

  useEffect(() => {
    const start = () => {
      clearAll();
      // The URL we were on when the click happened. Watched below because a
      // navigation that only changes search params never changes `pathname`,
      // so the completion effect would never fire and the bar would hang until
      // the failsafe. No such link exists today; this keeps it that way.
      const from = window.location.href;

      showTimer.current = setTimeout(() => {
        setVisible(true);
        setWidth(12);
        // Ease toward 90% and stop. The bar must never claim to be finished
        // while the page is still coming — the last 10% belongs to the
        // navigation actually completing.
        creepTimer.current = setInterval(() => {
          if (window.location.href !== from) {
            finish();
            return;
          }
          setWidth((w) => (w >= 90 ? w : w + Math.max((90 - w) * 0.12, 0.4)));
        }, 120);
      }, SHOW_AFTER_MS);

      failsafe.current = setTimeout(() => {
        clearAll();
        setVisible(false);
        setWidth(0);
      }, MAX_VISIBLE_MS);
    };

    const onClick = (event: MouseEvent) => {
      // Modified clicks open a new tab; this document isn't navigating.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.('a[href]') as
        | HTMLAnchorElement
        | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      // External, or a jump within this same page — neither is a route change.
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      start();
    };

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      clearAll();
    };
  }, []);

  // The route changed: the navigation this bar was tracking is done. If the
  // bar never got as far as showing (a fast navigation), this just cancels the
  // pending show — which is what keeps quick taps from flickering.
  useEffect(() => {
    if (!visible) {
      clearAll();
      return;
    }
    finish();
    // Intentionally keyed on pathname alone — see the note about
    // useSearchParams above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[2px]"
    >
      <div
        className="h-full bg-[#121212] transition-[width,opacity] duration-200 ease-out motion-reduce:transition-none"
        style={{ width: `${width}%`, opacity: width >= 100 ? 0 : 1 }}
      />
    </div>
  );
}
