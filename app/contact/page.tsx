import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { InstagramIcon, TiktokIcon, XIcon } from '@/components/icons';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with SOISE — questions about an order, the Swaz Creator Program, or anything else.',
  alternates: { canonical: '/contact' },
  openGraph: {
    type: 'website',
    title: 'Contact Us — SOISE',
    description: 'Get in touch with SOISE.',
    url: '/contact',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us — SOISE',
    description: 'Get in touch with SOISE.',
    images: ['/og-image.jpg'],
  },
};

const serif = { fontFamily: 'var(--font-luxe, Georgia, serif)' } as const;

const SOCIALS = [
  { Icon: InstagramIcon, href: siteConfig.social.instagram, label: 'Instagram' },
  { Icon: TiktokIcon, href: siteConfig.social.tiktok, label: 'TikTok' },
  { Icon: XIcon, href: siteConfig.social.x, label: 'X' },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#0E0E10] text-[#F4F1EA]">
      <div className="mx-auto flex max-w-[980px] items-center justify-between px-6 pt-8">
        <Link href="/" aria-label="Back to shop">
          <Image
            src="/main-logo.png"
            alt="Soise"
            width={44}
            height={44}
            className="h-[40px] w-[40px] object-contain"
          />
        </Link>
        <Link
          href="/"
          className="rounded-full border border-[#3A3A3D] px-4 py-2 text-[12px] font-medium tracking-wide text-[#D8D3C7] uppercase transition-colors hover:border-[#C4AA6E] hover:text-[#F4F1EA]"
        >
          Back to shop
        </Link>
      </div>

      <div className="mx-auto max-w-[640px] px-6 pt-12 pb-24 text-center">
        <p className="text-[12px] font-medium uppercase tracking-[0.32em] text-[#C4AA6E]">
          Get in touch
        </p>
        <h1 className="mt-5 text-[38px] leading-[1.1] tracking-tight sm:text-[48px]" style={serif}>
          Talk to us.
        </h1>
        <p className="mx-auto mt-5 max-w-[440px] text-[15px] leading-relaxed text-[#B7B2A6]">
          Order questions, sizing, the Swaz Creator Program, or anything else —
          we read every message ourselves.
        </p>

        <a
          href={`mailto:${siteConfig.supportEmail}`}
          className="mt-9 inline-block rounded-full bg-[#C4AA6E] px-9 py-3.5 text-[14px] font-semibold tracking-wide text-[#0E0E10] transition-transform hover:scale-[1.02]"
        >
          {siteConfig.supportEmail}
        </a>

        <div className="mx-auto mt-14 max-w-[420px] border-t border-[#1F1F22] pt-10">
          <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-[#C4AA6E]">
            Follow along
          </p>
          <div className="mt-5 flex justify-center gap-6">
            {SOCIALS.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`SOISE on ${label}`}
                // These icons hardcode a dark fill (#121212) rather than
                // currentColor, so a text-color className has no effect on
                // them — invert instead to get a light mark on this dark
                // background without touching the shared icon file (used
                // elsewhere against light backgrounds, where inverting
                // would break them).
                className="opacity-80 invert transition-opacity hover:opacity-100"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-[420px] border-t border-[#1F1F22] pt-10 text-[13px] leading-relaxed text-[#7A766C]">
          <p>
            Want to earn instead of just shop?{' '}
            <Link href="/join" className="font-medium text-[#C4AA6E] underline">
              See the Swaz Creator Program
            </Link>
          </p>
          <p className="mt-4 inline-flex items-center gap-1">
            {siteConfig.officeAddress} · RC {siteConfig.registrationNumber}
          </p>
        </div>
      </div>
    </main>
  );
}
