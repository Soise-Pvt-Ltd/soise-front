'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/components/home/nav/actions';
import BrandMark from '@/components/brand/BrandMark';

/**
 * PRESSED INK masthead for /team — this bar IS the area's masthead (it replaces
 * the single-page masthead used on /contact), so it carries the 2px ink rule at
 * its foot and the nav reads as a row of small pressed plates.
 */

const LINKS = [
  { href: '/team', label: 'Overview' },
  { href: '/team/playbook', label: 'Playbook' },
  { href: '/team/prospects', label: 'Prospects' },
];

/** Nav plate: active is ink-filled, inactive is ink type that plates on hover. */
const navPlate = (active: boolean) =>
  `rounded-[2px] border-2 px-3 py-1.5 text-[12px] font-bold tracking-[0.1em] uppercase transition-colors ${
    active
      ? 'border-[#121212] bg-[#121212] text-white'
      : 'border-transparent text-[#121212] hover:border-[#121212] hover:bg-white'
  }`;

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
      <header className="sticky top-0 z-30 border-b-2 border-[#121212] bg-[#F5F0E8]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link href="/" aria-label="Soise home" className="flex items-center">
            <BrandMark height={34} />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/creators"
              className="brut-plate brut-press px-3 py-2 text-[11px] font-bold tracking-[0.14em] uppercase"
            >
              Become a creator
            </Link>
            <Link
              href="/"
              className="brut-press rounded-[2px] border-2 border-[#121212] bg-[#121212] px-3.5 py-2 text-[11px] font-bold tracking-[0.14em] text-white uppercase"
            >
              Shop
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 border-b-2 border-[#121212] bg-[#F5F0E8]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <div className="flex items-center gap-6">
          <Link href="/team" className="flex items-center gap-2.5">
            <Image src="/main-logo.png" alt="Soise" width={38} height={38} priority />
            <span className="hidden text-[11px] font-bold tracking-[0.16em] text-[#5C544A] uppercase sm:inline">
              <span className="text-[#121212]">Creator</span> Team
            </span>
          </Link>
          <nav className="hidden items-center gap-1.5 sm:flex">
            {LINKS.map((l) => {
              const active =
                l.href === '/team' ? path === '/team' : path.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? 'page' : undefined}
                  className={navPlate(active)}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {role && <span className="brut-stamp hidden sm:inline-flex">{role}</span>}
          <Link
            href="/"
            className="brut-plate brut-press px-3 py-2 text-[11px] font-bold tracking-[0.14em] uppercase"
          >
            Shop ↗
          </Link>
          <button
            onClick={handleLogout}
            className="cursor-pointer rounded-[2px] border-2 border-transparent px-2.5 py-1.5 text-[11px] font-bold tracking-[0.14em] text-[#B3101C] uppercase transition-colors hover:border-[#B3101C] hover:bg-white"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <nav className="flex items-center gap-1.5 overflow-x-auto border-t-2 border-[#121212]/10 px-5 py-2 sm:hidden">
        {LINKS.map((l) => {
          const active =
            l.href === '/team' ? path === '/team' : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap ${navPlate(active)}`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
