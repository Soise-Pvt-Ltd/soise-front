'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/components/home/nav/actions';
import BrandMark from '@/components/brand/BrandMark';

const LINKS = [
  { href: '/team', label: 'Overview' },
  { href: '/team/playbook', label: 'Playbook' },
  { href: '/team/prospects', label: 'Prospects' },
];

export default function TeamNav({ role }: { role: string | null }) {
  const path = usePathname();
  const router = useRouter();
  const isOutreach = role === 'admin' || role === 'outreach';

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Public viewers (e.g. on the shareable /team/playbook) get a clean public
  // header — a user-facing mark, no internal links, no sign-out, never main-logo.
  if (!isOutreach) {
    return (
      <header className="sticky top-0 z-30 border-b border-[#ECECEF] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link href="/" aria-label="Soise home" className="flex items-center">
            <BrandMark height={34} />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/creators"
              className="rounded-[8px] px-3 py-1.5 text-[13px] font-medium text-[#6B6B70] transition-colors hover:bg-[#F4F4F6] hover:text-[#121212]"
            >
              Become a creator
            </Link>
            <Link
              href="/"
              className="rounded-[8px] bg-[#121212] px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2a2a2a]"
            >
              Shop
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#ECECEF] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <div className="flex items-center gap-6">
          <Link href="/team" className="flex items-center gap-2.5">
            <Image src="/main-logo.png" alt="Soise" width={38} height={38} priority />
            <span className="hidden text-[13px] font-medium tracking-tight text-[#6B6B70] sm:inline">
              <span className="text-[#121212]">Creator</span> Team
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
          {role && (
            <span className="hidden rounded-full bg-[#F0F0F2] px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-[#8A8A8F] sm:inline">
              {role}
            </span>
          )}
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
