'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

interface RowActionMenuProps {
  open: boolean;
  onClose: () => void;
  /**
   * The trigger element itself, captured from the click event
   * (`e.currentTarget`). Preferred over `anchorRef`: it can't be null and
   * doesn't depend on when React attaches refs.
   */
  anchorEl?: HTMLElement | null;
  /** Legacy: ref to the trigger button. Used only if `anchorEl` is absent. */
  anchorRef?: RefObject<HTMLElement | null>;
  /** Tailwind width class, e.g. 'w-32' or 'w-40'. */
  widthClass?: string;
  children: ReactNode;
}

const GAP = 8; // px between trigger and menu
const EDGE = 8; // px minimum distance from the viewport edge

/**
 * Row action menu rendered via a portal into document.body with
 * `position: fixed` coordinates derived from the trigger's bounding rect.
 *
 * Table row menus used to be `position: absolute` inside a
 * `div.relative` nested inside an `overflow-x-auto` table wrapper. Any
 * ancestor with a non-visible overflow-x forces the browser to compute
 * overflow-y as non-visible too (CSS2.1 overflow interaction), so the
 * wrapper silently clipped the menu instead of stacking it above the
 * page. Portaling to body sidesteps that clipping context entirely.
 *
 * Three things here exist to stop the menu silently doing nothing:
 *
 * 1. `anchorEl`. The old API took a single ref shared by every row and
 *    attached conditionally (`ref={isOpenRow ? sharedRef : undefined}`), so
 *    whether it resolved depended on ref-attachment order relative to this
 *    component's layout effect. Taking the element straight off the click
 *    event removes the question entirely.
 * 2. A retry. If no anchor resolves on the first pass the menu used to stay
 *    at `visibility: hidden` forever, because the effect only re-ran when
 *    `open` changed. Now it retries on the next few frames.
 * 3. Viewport clamping. Coordinates came straight from the trigger's rect,
 *    so a trigger near the right edge (or in a horizontally scrolled table)
 *    put the menu off-screen -- indistinguishable from "the button is dead".
 */
export default function RowActionMenu({
  open,
  onClose,
  anchorEl,
  anchorRef,
  widthClass = 'w-32',
  children,
}: RowActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    openUp: boolean;
  } | null>(null);

  const resolveAnchor = useCallback(
    () => anchorEl ?? anchorRef?.current ?? null,
    [anchorEl, anchorRef],
  );

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }

    let frame = 0;
    let attempts = 0;

    const updatePosition = () => {
      const anchor = resolveAnchor();
      if (!anchor || !anchor.isConnected) {
        // Anchor not ready (or gone). Try again next frame rather than
        // leaving the menu invisible with no way to recover.
        if (attempts++ < 5) frame = requestAnimationFrame(updatePosition);
        return;
      }

      const rect = anchor.getBoundingClientRect();
      const menuEl = menuRef.current;
      const menuHeight = menuEl?.offsetHeight || 96;
      const menuWidth = menuEl?.offsetWidth || 128;

      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < menuHeight + GAP && rect.top > menuHeight;

      // The menu is translated -100% on X, so `left` is its right edge.
      const maxRight = window.innerWidth - EDGE;
      const minRight = Math.min(menuWidth + EDGE, maxRight);
      const left = Math.min(Math.max(rect.right, minRight), maxRight);

      const rawTop = openUp ? rect.top - GAP : rect.bottom + GAP;
      const maxTop = openUp
        ? window.innerHeight - EDGE
        : window.innerHeight - menuHeight - EDGE;
      const top = Math.min(Math.max(rawTop, openUp ? menuHeight + EDGE : EDGE), Math.max(maxTop, EDGE));

      setCoords({ top, left, openUp });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, resolveAnchor]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: Event) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (resolveAnchor()?.contains(target)) return;
      onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    // pointerdown covers mouse, touch and pen in one listener; mousedown
    // alone missed touch interactions on some mobile browsers.
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose, resolveAnchor]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      data-menu-root
      style={{
        position: 'fixed',
        top: coords ? coords.top : -9999,
        left: coords ? coords.left : -9999,
        transform: `translate(-100%, ${coords?.openUp ? '-100%' : '0'})`,
        visibility: coords ? 'visible' : 'hidden',
      }}
      className={`ring-opacity-5 z-[1000] ${widthClass} origin-top-right rounded-md bg-[#FBF9F4] text-sm shadow-md ring-1 ring-[#EFEBE1] transition-opacity duration-150 focus:outline-none`}
    >
      <div className="py-1">{children}</div>
    </div>,
    document.body,
  );
}
