'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSearchIcon } from '@/components/icons';

/**
 * The admin shell's top search. Each dashboard section keeps its own (efficient)
 * search, so this is a scoped quick-launcher: pick a section, type, hit enter —
 * it routes to that section with `?search=`, which the section seeds itself from.
 */
const TARGETS = [
  { value: 'products', label: 'Products', path: '/dashboard/products' },
  { value: 'orders', label: 'Orders', path: '/dashboard/orders' },
  { value: 'users', label: 'Users', path: '/dashboard/users' },
  { value: 'creators', label: 'Creators', path: '/dashboard/creators' },
  { value: 'creator-codes', label: 'Creator codes', path: '/dashboard/creator-codes' },
] as const;

export default function AdminGlobalSearch() {
  const router = useRouter();
  const [target, setTarget] = useState<string>('products');
  const [q, setQ] = useState('');

  const current = TARGETS.find((t) => t.value === target) ?? TARGETS[0];

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(
      query ? `${current.path}?search=${encodeURIComponent(query)}` : current.path,
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <select
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        aria-label="Search section"
        className="h-[44px] shrink-0 rounded-[10px] bg-[#F5F5F5] px-2 text-[13px] text-[#5B5B5B] outline-none focus-visible:ring-2 focus-visible:ring-[#0072BB]"
      >
        {TARGETS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <div className="flex h-[44px] w-full items-center gap-2 rounded-[10px] bg-[#F5F5F5] pr-[12px] pl-[14px] lg:w-[260px]">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${current.label.toLowerCase()}…`}
          aria-label="Search dashboard"
          className="w-full border-0 bg-transparent text-[14px] placeholder:text-[#9A9A9A] outline-none focus:ring-0"
        />
        <button
          type="submit"
          aria-label="Search"
          className="flex cursor-pointer items-center outline-none focus-visible:ring-2 focus-visible:ring-[#0072BB]"
        >
          <AdminSearchIcon />
        </button>
      </div>
    </form>
  );
}
