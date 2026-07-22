'use client';

import {
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
  /** Ref to the trigger button (the three-dots icon). */
  anchorRef: RefObject<HTMLElement | null>;
  /** Tailwind width class, e.g. 'w-32' or 'w-40'. */
  widthClass?: string;
  children: ReactNode;
}

const GAP = 8; // px between trigger and menu

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
 */
export default function RowActionMenu({
  open,
  onClose,
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

  useLayoutEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight ?? 96;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < menuHeight + GAP && rect.top > menuHeight;

      setCoords({
        top: openUp ? rect.top - GAP : rect.bottom + GAP,
        left: rect.right,
        openUp,
      });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose, anchorRef]);

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
      className={`ring-opacity-5 z-[1000] ${widthClass} origin-top-right rounded-md bg-white text-sm shadow-md ring-1 ring-[#F5F5F5] transition-opacity duration-150 focus:outline-none`}
    >
      <div className="py-1">{children}</div>
    </div>,
    document.body,
  );
}
