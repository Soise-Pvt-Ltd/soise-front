'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminMoreHorizontalIcon } from '@/components/icons';

export interface StatMenuItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export default function StatCardMenu({
  items,
  color = '#121212',
  ariaLabel = 'Card options',
}: {
  items: StatMenuItem[];
  color?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex cursor-pointer items-center justify-center rounded-full p-1 outline-none transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-current"
        style={{ color }}
      >
        <AdminMoreHorizontalIcon color={color} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-30 mt-1 w-48 overflow-hidden rounded-[10px] border border-gray-100 bg-white py-1 text-[#121212] shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
        >
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                if (item.onClick) item.onClick();
                else if (item.href) router.push(item.href);
              }}
              className="block w-full px-4 py-2 text-left text-[13px] text-[#35373C] transition-colors hover:bg-[#F5F5F5] hover:text-[#0072BB]"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
