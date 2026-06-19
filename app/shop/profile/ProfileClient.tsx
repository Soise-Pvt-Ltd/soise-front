'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Footer from '@/components/footer';

export interface WardrobePiece {
  variantId: string;
  productId: string;
  name: string | null;
  slug: string | null;
  image: string | null;
  color: string | null;
  size: string | null;
  acquiredAt: string | null;
  timesPurchased: number;
}

export interface ProfileUser {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  avatar: string | null;
  memberSince: string | null;
}

const LUXE = { fontFamily: 'var(--font-luxe)' };
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function formatAcquired(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/* A fine wire clothes-hanger drawn in stroke, so each garment reads as if it
   hangs from the closet rod above it. The hook curls over the rod line. */
function Hanger() {
  return (
    <svg
      width="58"
      height="46"
      viewBox="0 0 58 46"
      fill="none"
      aria-hidden="true"
      className="text-[#1c1c1c]"
    >
      {/* hook curling over the rod */}
      <path
        d="M29 17 C29 11 33 11 33 7 A4 4 0 1 0 25 7"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      {/* triangular shoulders + bottom bar */}
      <path
        d="M29 17 L7 35 A1.6 1.6 0 0 0 8 38 H50 A1.6 1.6 0 0 0 51 35 L29 17 Z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      style={dir === 'left' ? { transform: 'rotate(180deg)' } : undefined}
    >
      <path
        d="M5.25 2.91675L9.33333 7.00008L5.25 11.0834"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GarmentImage({ piece }: { piece: WardrobePiece }) {
  if (piece.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={piece.image}
        alt={piece.name ?? 'A Soise piece'}
        loading="lazy"
        className="h-full w-full object-cover"
      />
    );
  }
  // Delisted / image-less piece: a quiet ivory plate with a serif glyph.
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#EFEAE2]">
      <span className="text-[40px] text-[#C9BEA9]" style={LUXE}>
        S
      </span>
    </div>
  );
}

function WardrobeCard({ piece, index }: { piece: WardrobePiece; index: number }) {
  const acquired = formatAcquired(piece.acquiredAt);
  const meta = [piece.color, piece.size].filter(Boolean).join(' · ');

  const inner = (
    <>
      {/* Hanger zone — the hook crosses the rod drawn behind the row. */}
      <div className="relative flex h-[50px] items-end justify-center">
        <Hanger />
      </div>

      {/* The garment, hanging. Sways gently from the hook on hover. */}
      <motion.div
        className="relative aspect-[3/4] w-full overflow-hidden rounded-[3px] bg-[#EFEAE2] shadow-[0_18px_40px_-26px_rgba(0,0,0,0.55)]"
        style={{ transformOrigin: '50% 0%' }}
        whileHover={{ rotate: 1.4 }}
        transition={{ type: 'spring', stiffness: 120, damping: 8 }}
      >
        <GarmentImage piece={piece} />
        {piece.timesPurchased > 1 && (
          <span
            className="absolute top-[10px] right-[10px] rounded-full bg-white/85 px-[8px] py-[2px] text-[10px] font-medium tracking-[0.12em] text-[#1c1c1c] backdrop-blur-sm"
            title={`Collected ${piece.timesPurchased} times`}
          >
            ×{piece.timesPurchased}
          </span>
        )}
      </motion.div>

      {/* Editorial caption */}
      <div className="mt-[18px] text-center">
        <div className="truncate text-[16px] leading-snug" style={LUXE}>
          {piece.name ?? 'A Soise Piece'}
        </div>
        {meta ? (
          <div className="mt-[4px] truncate text-[11px] tracking-[0.12em] text-[#8E8E93] uppercase">
            {meta}
          </div>
        ) : null}
        {acquired ? (
          <div className="mt-[6px] text-[11px] tracking-[0.16em] text-[#B8945F] uppercase">
            Acquired {acquired}
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <motion.div
      className="w-[208px] shrink-0 snap-start sm:w-[236px]"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.6, ease: EASE, delay: (index % 6) * 0.05 }}
    >
      {piece.slug ? (
        <Link
          href={`/shop/product-listing/${piece.slug}`}
          aria-label={`View ${piece.name ?? 'this piece'}`}
          className="group block rounded-[6px] focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-4 focus-visible:outline-none"
        >
          {inner}
        </Link>
      ) : (
        <div>{inner}</div>
      )}
    </motion.div>
  );
}

export default function ProfileClient({
  user,
  pieces,
}: {
  user: ProfileUser;
  pieces: WardrobePiece[];
}) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    (user.email ? user.email.split('@')[0] : '') ||
    'Your';
  const firstName =
    user.firstName?.trim() ||
    (user.email ? user.email.split('@')[0] : '') ||
    displayName;
  const memberYear = user.memberSince
    ? new Date(user.memberSince).getFullYear()
    : null;

  const updateArrows = () => {
    const el = railRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 8);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  useEffect(() => {
    updateArrows();
    const el = railRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
    // pieces length changing re-evaluates whether the rail overflows
  }, [pieces.length]);

  const scrollBy = (dir: 'left' | 'right') => {
    const el = railRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.8, 240);
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <main className="text-[#121212]">
      {/* ——— Maison header ——— */}
      <section className="px-[24px] pt-[8px] pb-[44px] md:px-[40px]">
        <div className="flex items-center gap-[12px]">
          <span className="h-px w-[34px] bg-[#1c1c1c]" />
          <span className="text-[11px] tracking-[0.34em] text-[#8E8E93] uppercase">
            Soise Maison · Private Wardrobe
          </span>
        </div>

        <div className="mt-[26px] flex items-end justify-between gap-[20px]">
          <div className="min-w-0">
            <h1
              className="text-[44px] leading-[0.98] sm:text-[60px] md:text-[76px]"
              style={LUXE}
            >
              {firstName}
              <span className="text-[#B8945F]">.</span>
            </h1>
            <p
              className="mt-[8px] text-[18px] text-[#6b6b6b] italic sm:text-[22px]"
              style={LUXE}
            >
              Your collection, archived.
            </p>
          </div>

          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar}
              alt=""
              className="hidden h-[84px] w-[84px] shrink-0 rounded-full object-cover ring-1 ring-[#121212]/10 sm:block"
            />
          ) : null}
        </div>

        {/* Member ledger */}
        <div className="mt-[30px] flex flex-wrap items-center gap-x-[28px] gap-y-[10px] border-t border-[#ECECEC] pt-[18px] text-[11px] tracking-[0.18em] text-[#8E8E93] uppercase">
          {memberYear ? <span>Member since {memberYear}</span> : null}
          <span>
            {pieces.length} {pieces.length === 1 ? 'Piece' : 'Pieces'} Collected
          </span>
          <Link
            href="/shop/order-history"
            className="text-[#121212] underline-offset-4 transition-opacity hover:underline focus-visible:underline focus-visible:outline-none"
          >
            Order history
          </Link>
        </div>
      </section>

      {/* ——— The wardrobe ——— */}
      {pieces.length === 0 ? (
        <section className="mx-[24px] mb-[60px] rounded-[6px] bg-[#F7F4EF] px-[24px] py-[80px] text-center md:mx-[40px]">
          <h2 className="text-[30px] sm:text-[40px]" style={LUXE}>
            Your wardrobe awaits.
          </h2>
          <p className="mx-auto mt-[14px] max-w-[440px] text-[14px] leading-relaxed text-[#6b6b6b]">
            Every Soise piece you collect is archived here — a private record of
            your taste, kept beautifully. Begin with your first.
          </p>
          <Link
            href="/shop/product-listing"
            className="mt-[28px] inline-flex h-[50px] items-center justify-center rounded-[10px] bg-[#121212] px-[34px] text-[12px] font-bold tracking-[0.14em] text-white uppercase transition-all duration-300 hover:bg-[#2a2a2a] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)] active:scale-[0.98]"
          >
            Begin your collection
          </Link>
        </section>
      ) : (
        <section className="bg-[#F7F4EF] py-[48px]">
          <div className="mb-[26px] flex items-center justify-between px-[24px] md:px-[40px]">
            <div className="flex items-baseline gap-[14px]">
              <h2 className="text-[24px] sm:text-[30px]" style={LUXE}>
                The Rail
              </h2>
              <span className="text-[11px] tracking-[0.22em] text-[#8E8E93] uppercase">
                {pieces.length} {pieces.length === 1 ? 'piece' : 'pieces'}
              </span>
            </div>

            {/* Desktop scroll controls */}
            <div className="hidden items-center gap-[10px] sm:flex">
              <button
                type="button"
                onClick={() => scrollBy('left')}
                disabled={!canPrev}
                aria-label="Scroll wardrobe left"
                className="grid h-[42px] w-[42px] place-items-center rounded-full border border-[#1c1c1c]/15 text-[#1c1c1c] transition-all duration-200 hover:border-[#1c1c1c] disabled:cursor-not-allowed disabled:opacity-25 focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Chevron dir="left" />
              </button>
              <button
                type="button"
                onClick={() => scrollBy('right')}
                disabled={!canNext}
                aria-label="Scroll wardrobe right"
                className="grid h-[42px] w-[42px] place-items-center rounded-full border border-[#1c1c1c]/15 text-[#1c1c1c] transition-all duration-200 hover:border-[#1c1c1c] disabled:cursor-not-allowed disabled:opacity-25 focus-visible:ring-2 focus-visible:ring-[#121212] focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Chevron dir="right" />
              </button>
            </div>
          </div>

          {/* Horizontal rail. The closet rod is painted on the track background
              so it spans the full content width and scrolls with the garments. */}
          <div
            ref={railRef}
            role="region"
            aria-label="Your wardrobe, scroll horizontally"
            tabIndex={0}
            className="scrollbar-hide snap-x snap-mandatory overflow-x-auto overscroll-x-contain focus-visible:outline-none"
          >
            <div
              className="flex w-max gap-[24px] px-[24px] pt-[6px] pb-[40px] sm:gap-[34px] md:px-[40px]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, transparent, rgba(28,28,28,0.28) 6%, rgba(28,28,28,0.28) 94%, transparent)',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '100% 2px',
                backgroundPosition: '0 18px',
              }}
            >
              {pieces.map((piece, i) => (
                <WardrobeCard key={piece.variantId} piece={piece} index={i} />
              ))}
            </div>
          </div>

          <p className="mt-[14px] px-[24px] text-[11px] tracking-[0.14em] text-[#A79B86] uppercase md:px-[40px]">
            Drag or swipe to browse your rail
          </p>
        </section>
      )}

      {/* ——— Atelier closing note ——— */}
      <section className="px-[24px] py-[60px] text-center md:px-[40px]">
        <p
          className="mx-auto max-w-[560px] text-[22px] leading-snug text-[#1c1c1c] sm:text-[28px]"
          style={LUXE}
        >
          “Style is a way to say who you are without having to speak.”
        </p>
        <div className="mt-[28px]">
          <Link
            href="/shop/product-listing"
            className="inline-flex h-[50px] items-center justify-center rounded-[10px] border border-[#121212] px-[34px] text-[12px] font-bold tracking-[0.14em] text-[#121212] uppercase transition-all duration-300 hover:bg-[#121212] hover:text-white active:scale-[0.98]"
          >
            Continue the collection
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
