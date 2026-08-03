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
    <form onSubmit={onSubmit} className="flex items-stretch gap-2">
      <select
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        aria-label="Search section"
        className="h-[42px] shrink-0 rounded-full border border-[#DFD7C6] bg-transparent py-0 pr-8 pl-3.5 text-[12px] text-[#5C544A] transition-colors outline-none hover:border-[#9C6F2E] focus:border-[#9C6F2E] focus:ring-0"
      >
        {TARGETS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <div className="flex h-[42px] w-full items-center gap-2 rounded-full border border-[#DFD7C6] bg-[#EFEBE1] pr-3 pl-4 transition-colors focus-within:border-[#9C6F2E] focus-within:bg-[#F8F5EE] lg:w-[264px]">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${current.label.toLowerCase()}…`}
          aria-label="Search dashboard"
          className="w-full border-0 bg-transparent p-0 text-[13px] text-[#14110E] placeholder:text-[#8C8377] focus:ring-0 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Search"
          className="flex cursor-pointer items-center text-[#9C6F2E] transition-opacity outline-none hover:opacity-70 focus-visible:ring-2 focus-visible:ring-[#9C6F2E]"
        >
          <AdminSearchIcon />
        </button>
      </div>
    </form>
  );
}
