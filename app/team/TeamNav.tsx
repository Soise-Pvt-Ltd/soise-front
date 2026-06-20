'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/components/home/nav/actions';

const LINKS = [
  { href: '/team', label: 'Overview' },
  { href: '/team/playbook', label: 'Playbook' },
  { href: '/team/prospects', label: 'Prospects' },
];

export default function TeamNav({ role }: { role: string }) {
  const path = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#ECECEF] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <div className="flex items-center gap-6">
          <Link href="/team" className="flex items-center gap-2">
            <span className="text-[15px] font-semibold tracking-tight text-[#121212]">
              Swaz<span className="text-[#0072BB]"> Creator Team</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {LINKS.map((l) => {
              const active =
                l.href === '/team' ? path === '/team' : path.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    active
                      ? 'bg-[#E7F1F8] text-[#0072BB]'
                      : 'text-[#6B6B70] hover:bg-[#F4F4F6] hover:text-[#121212]'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-[#F0F0F2] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-[#8A8A8F] sm:inline">
            {role}
          </span>
          <Link
            href="/"
            className="rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#6B6B70] transition-colors hover:bg-[#F4F4F6] hover:text-[#121212]"
          >
            Shop ↗
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#991C00] transition-colors hover:bg-[#FBEEEB]"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-[#F2F2F4] px-5 py-2 sm:hidden">
        {LINKS.map((l) => {
          const active =
            l.href === '/team' ? path === '/team' : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-[8px] px-3 py-1.5 text-[13px] font-medium ${
                active ? 'bg-[#E7F1F8] text-[#0072BB]' : 'text-[#6B6B70]'
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
