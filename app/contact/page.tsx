import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { pageMetadata } from '@/lib/seo';
import { InstagramIcon, TiktokIcon, XIcon } from '@/components/icons';

export const metadata: Metadata = pageMetadata({
  title: 'Contact Us',
  description:
    'Get in touch with SOISE — questions about an order, delivery across Nigeria, returns, or the Swaz Creator Program. We reply within one business day.',
  path: '/contact',
  ogTitle: 'Contact SOISE',
  ogDescription:
    'Questions about an order, delivery, returns or the Swaz Creator Program? Get in touch with the SOISE team.',
});

/**
 * PRESSED INK — the storefront's quiet-luxury editorial language run through a
 * letterpress (see the brut- tokens in globals.css). Ink on paper, Instrument
 * Serif display, index-numbered sections, hard offset shadows, and the ad
 * creatives' exact crimson (#B3101C) as the only accent.
 *
 * Deliberately a server component with CSS-only entrance animation: a shopper
 * tapping "contact" from an ad-bought session gets painted content, not a
 * hydration pause.
 */

const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

const SOCIALS = [
  { Icon: InstagramIcon, href: siteConfig.social.instagram, label: 'Instagram' },
  { Icon: TiktokIcon, href: siteConfig.social.tiktok, label: 'TikTok' },
  { Icon: XIcon, href: siteConfig.social.x, label: 'X' },
];

/** Index number + rule — the editorial section head, pressed harder. */
function IndexHead({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-x-3">
      <span className="text-[12px] font-bold tracking-[0.08em] text-[#B3101C]">
        {n}
      </span>
      <span className="brut-label">{title}</span>
      <span className="brut-rule mt-auto mb-[6px] flex-1 opacity-20" />
    </div>
  );
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#F5F0E8] text-[#121212]">
      {/* Masthead bar */}
      <div className="mx-auto flex max-w-[880px] items-center justify-between px-5 pt-7">
        <Link href="/" aria-label="Back to shop" className="brut-plate brut-press flex h-[48px] w-[48px] items-center justify-center bg-white">
          <Image
            src="/main-logo.png"
            alt="Soise"
            width={34}
            height={34}
            className="h-[30px] w-[30px] object-contain"
          />
        </Link>
        <Link
          href="/"
          className="brut-plate brut-press px-4 py-2.5 text-[11px] font-bold tracking-[0.14em] uppercase"
        >
          Back to shop
        </Link>
      </div>

      <div className="mx-auto max-w-[880px] px-5 pt-14 pb-24">
        {/* Editorial masthead — left-aligned, oversized, the crimson full stop
            doing the "motion?" punctuation work. */}
        <header className="brut-rise">
          <p className="brut-label text-[#B3101C]">
            Correspondence
          </p>
          <h1
            className="mt-4 text-[64px] leading-[0.95] tracking-tight uppercase sm:text-[96px]"
            style={serif}
          >
            Talk to us<span className="text-[#B3101C]">.</span>
          </h1>
          <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-[#3F3830]">
            Order questions, sizing, delivery, the Swaz Creator Program — we
            read every message ourselves and reply within one business day.
          </p>
        </header>

        {/* 01 — WRITE: the primary channel gets the heaviest plate. */}
        <section className="brut-rise mt-16" style={{ animationDelay: '0.08s' }}>
          <IndexHead n="01" title="Write" />
          <a
            href={`mailto:${siteConfig.supportEmail}`}
            className="brut-press mt-5 flex flex-col gap-1 rounded-[2px] border-2 border-[#121212] bg-[#121212] px-6 py-6 text-white sm:flex-row sm:items-baseline sm:justify-between"
          >
            <span className="text-[20px] break-all sm:text-[26px]" style={serif}>
              {siteConfig.supportEmail}
            </span>
            <span className="text-[11px] font-bold tracking-[0.16em] uppercase opacity-70">
              Replies in 1 business day →
            </span>
          </a>
        </section>

        {/* 02 — CALL */}
        <section className="brut-rise mt-12" style={{ animationDelay: '0.16s' }}>
          <IndexHead n="02" title="Call or WhatsApp" />
          <a
            href="tel:08135757947"
            className="brut-plate brut-press mt-5 flex flex-col gap-1 px-6 py-6 sm:flex-row sm:items-baseline sm:justify-between"
          >
            <span className="text-[20px] sm:text-[26px]" style={serif}>
              0813 575 7947
            </span>
            <span className="text-[11px] font-bold tracking-[0.16em] text-[#5C544A] uppercase">
              Mon–Sat · 9:00–18:00 WAT
            </span>
          </a>
        </section>

        {/* 03 — FOLLOW */}
        <section className="brut-rise mt-12" style={{ animationDelay: '0.24s' }}>
          <IndexHead n="03" title="Follow the motion" />
          <div className="mt-5 flex gap-3">
            {SOCIALS.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`SOISE on ${label}`}
                className="brut-plate brut-press flex h-[56px] w-[56px] items-center justify-center"
              >
                <Icon />
              </a>
            ))}
          </div>
        </section>

        {/* 04 — PROOF: the trust section, kept deliberately (the certificate
            is a conversion asset for a brand nobody has bought from yet). One
            honest document plate instead of three mock-document cards. */}
        <section className="brut-rise mt-12" style={{ animationDelay: '0.32s' }}>
          <IndexHead n="04" title="A real company" />
          <div className="brut-plate brut-shadow mt-5 px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="brut-stamp">CAC Registered</span>
                <p className="mt-3 text-[15px] font-medium">
                  Soise — RC {siteConfig.registrationNumber}
                </p>
                <p className="mt-1 max-w-[42ch] text-[13px] leading-relaxed text-[#5C544A]">
                  Incorporated with Nigeria&apos;s Corporate Affairs Commission.
                  Also the verified business behind @soise.ng on TikTok and
                  Instagram.
                </p>
              </div>
              <a
                href="/cac-registration.pdf"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View CAC registration certificate document"
                className="brut-plate brut-press px-4 py-3 text-[11px] font-bold tracking-[0.14em] uppercase"
              >
                View certificate ↗
              </a>
            </div>
          </div>
        </section>

        {/* Footer line */}
        <footer
          className="brut-rise brut-rule mt-16 pt-8 text-[13px] leading-relaxed text-[#5C544A]"
          style={{ animationDelay: '0.4s' }}
        >
          <p>
            Want to earn instead of just shop?{' '}
            <Link
              href="/join"
              className="font-bold text-[#B3101C] underline underline-offset-2"
            >
              See the Swaz Creator Program
            </Link>
          </p>
          <p className="mt-3">
            {siteConfig.officeAddress} · RC {siteConfig.registrationNumber}
          </p>
        </footer>
      </div>
    </main>
  );
}
