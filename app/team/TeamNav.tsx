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
      <header className="sticky top-0 z-30 border-b border-[#E2DBCC] bg-[#F4F1EA]/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link href="/" aria-label="Soise home" className="flex items-center">
            <BrandMark height={34} />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/creators"
              className="rounded-full px-3 py-1.5 text-[13px] font-medium text-[#5C544A] transition-colors hover:bg-[#14110E]/[0.04] hover:text-[#14110E]"
            >
              Become a creator
            </Link>
            <Link
              href="/"
              className="rounded-full bg-[#14110E] px-3.5 py-1.5 text-[13px] font-medium text-[#F4F1EA] transition-colors hover:bg-[#241f19]"
            >
              Shop
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#E2DBCC] bg-[#F4F1EA]/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <div className="flex items-center gap-6">
          <Link href="/team" className="flex items-center gap-2.5">
            <Image src="/main-logo.png" alt="Soise" width={38} height={38} priority />
            <span className="hidden text-[13px] font-medium tracking-tight text-[#5C544A] sm:inline">
              <span className="text-[#14110E]">Creator</span> Team
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
                  className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    active
                      ? 'bg-[#14110E] text-[#F4F1EA]'
                      : 'text-[#5C544A] hover:bg-[#14110E]/[0.04] hover:text-[#14110E]'
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
            <span className="suite-badge suite-badge-neutral hidden sm:inline-flex">
              {role}
            </span>
          )}
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-[#5C544A] transition-colors hover:bg-[#14110E]/[0.04] hover:text-[#14110E]"
          >
            Shop ↗
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-full px-3 py-1.5 text-[13px] font-medium text-[#8C3A2B] transition-colors hover:bg-[#8C3A2B]/[0.06]"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-[#E2DBCC]/50 px-5 py-2 sm:hidden">
        {LINKS.map((l) => {
          const active =
            l.href === '/team' ? path === '/team' : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium ${
                active ? 'bg-[#14110E] text-[#F4F1EA]' : 'text-[#5C544A]'
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
