'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateOrderStatus } from '../orders/actions';
import { showToast } from '@/lib/toast-utils';
import { AdminMoreHorizontalIcon } from '@/components/icons';

// Sensible next-step transitions per current status (keeps the quick-actions
// contextual rather than offering every status everywhere).
const NEXT_STATUSES: Record<string, string[]> = {
  created: ['processing', 'cancelled'],
  pending_payment: ['cancelled'],
  paid: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  refunded: [],
};

const LABELS: Record<string, string> = {
  processing: 'Mark as processing',
  shipped: 'Mark as shipped',
  delivered: 'Mark as delivered',
  cancelled: 'Cancel order',
};

export default function OrderActionsMenu({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // The dashboard payload may carry the full record id ("orders:abc"); the
  // status route wants just the key.
  const id = String(orderId).split(':').pop() || orderId;
  const transitions = NEXT_STATUSES[status] ?? [];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const act = async (newStatus: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await updateOrderStatus(id, newStatus);
      if (res?.success) {
        showToast.success(`Order marked as ${newStatus}`);
        setOpen(false);
        router.refresh();
      } else {
        showToast.error(res?.error || 'Could not update the order. Please try again.');
      }
    } catch {
      showToast.error('Could not update the order. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Order actions"
        className="cursor-pointer rounded-md p-1.5 text-[#121212] transition-colors hover:bg-[#F2F2F2] focus:bg-[#F2F2F2] focus:outline-none"
      >
        <AdminMoreHorizontalIcon color="#121212" />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-in fade-in zoom-in-95 absolute right-0 z-30 mt-1 w-52 origin-top-right overflow-hidden rounded-[12px] border border-[#F0F0F0] bg-white py-1 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
        >
          <Link
            href="/dashboard/orders"
            role="menuitem"
            className="block px-4 py-2.5 text-[13px] text-[#121212] transition-colors hover:bg-[#F6F6F6]"
            onClick={() => setOpen(false)}
          >
            View in Orders
          </Link>

          {transitions.length > 0 && <div className="my-1 h-px bg-[#F0F0F0]" />}

          {transitions.map((s) => (
            <button
              key={s}
              type="button"
              role="menuitem"
              disabled={busy}
              onClick={() => act(s)}
              className={`flex w-full items-center px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-[#F6F6F6] disabled:cursor-not-allowed disabled:opacity-50 ${
                s === 'cancelled' ? 'text-[#C0362C]' : 'text-[#121212]'
              }`}
            >
              {LABELS[s] || s}
            </button>
          ))}

          {transitions.length === 0 && (
            <div className="px-4 py-2.5 text-[12px] text-[#AFB1B0]">
              No further actions
            </div>
          )}
        </div>
      )}
    </div>
  );
}
