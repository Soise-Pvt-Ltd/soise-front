import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import { pageMetadata } from '@/lib/seo';
import { InstagramIcon, TiktokIcon, XIcon, CheckShieldIcon } from '@/components/icons';

export const metadata: Metadata = pageMetadata({
  title: 'Contact Us',
  description:
    'Get in touch with SOISE — questions about an order, delivery across Nigeria, returns, or the Swaz Creator Program. We reply within one business day.',
  path: '/contact',
  ogTitle: 'Contact SOISE',
  ogDescription:
    'Questions about an order, delivery, returns or the Swaz Creator Program? Get in touch with the SOISE team.',
});

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

        <a
          href="tel:08135757947"
          className="mt-4 inline-flex items-center gap-3 rounded-full border-2 border-[#C4AA6E] px-9 py-3.5 text-[14px] font-semibold tracking-wide text-[#C4AA6E] transition-transform hover:scale-[1.02] hover:bg-[#C4AA6E] hover:text-[#0E0E10]"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transition-colors group-hover:text-[#0E0E10]"
          >
            <path
              d="M3.62 8.52C5.06 11.34 7.42 13.68 10.24 15.12L12.5 12.86C12.78 12.58 13.19 12.49 13.55 12.61C14.68 12.98 15.9 13.18 17.15 13.18C17.65 13.18 18.06 13.59 18.06 14.09V17.14C18.06 17.64 17.65 18.05 17.15 18.05C7.66 18.05 0 10.39 0 0.9C0 0.4 0.41 0 0.91 0H3.96C4.46 0 4.87 0.41 4.87 0.9C4.87 2.16 5.08 3.37 5.44 4.5C5.55 4.86 5.47 5.27 5.18 5.55L3.62 8.52Z"
              fill="currentColor"
            />
          </svg>
          0813 575 7947
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

        <div className="mx-auto mt-14 max-w-[420px] border-t border-[#1F1F22] pt-10">
          <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-[#C4AA6E]">
            Verified Business
          </p>
          <div className="mt-6 space-y-4">
            <div className="group relative overflow-hidden rounded-lg border border-[#2A2A2D] bg-[#151517] transition-all hover:border-[#C4AA6E]/50 hover:shadow-lg hover:shadow-[#C4AA6E]/10">
              <div className="absolute inset-0 bg-gradient-to-br from-[#C4AA6E]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C4AA6E]/10">
                    <CheckShieldIcon />
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-[#7A766C] transition-colors group-hover:text-[#C4AA6E]"
                  >
                    <path
                      d="M5.25 2.91669L9.33333 7.00002L5.25 11.0834"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#F4F1EA]">Verified on TikTok</p>
                  <p className="text-[11px] text-[#7A766C]">Official business account</p>
                </div>
                <div className="mt-3 rounded border border-[#2A2A2D] bg-[#0E0E10] p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-6 items-center justify-center rounded bg-[#C4AA6E]/20">
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7.875 0H9.6075C9.7335 0.625625 10.08 1.41488 10.6881 2.198C11.2831 2.96537 12.0724 3.5 13.125 3.5V5.25C11.5911 5.25 10.4387 4.53775 9.625 3.64963V9.625C9.625 10.4903 9.36841 11.3362 8.88768 12.0556C8.40695 12.7751 7.72367 13.3358 6.92424 13.667C6.12481 13.9981 5.24515 14.0847 4.39648 13.9159C3.54781 13.7471 2.76826 13.3304 2.15641 12.7186C1.54455 12.1067 1.12787 11.3272 0.959063 10.4785C0.790252 9.62985 0.876892 8.75019 1.20803 7.95076C1.53916 7.15133 2.09991 6.46805 2.81938 5.98732C3.53884 5.50659 4.38471 5.25 5.25 5.25V7C4.73082 7 4.2233 7.15395 3.79163 7.44239C3.35995 7.73083 3.02349 8.1408 2.82481 8.62046C2.62613 9.10011 2.57415 9.62791 2.67544 10.1371C2.77672 10.6463 3.02673 11.114 3.39384 11.4812C3.76096 11.8483 4.22869 12.0983 4.73789 12.1996C5.24709 12.3008 5.77489 12.2489 6.25454 12.0502C6.7342 11.8515 7.14417 11.5151 7.43261 11.0834C7.72104 10.6517 7.875 10.1442 7.875 9.625V0Z" fill="#C4AA6E"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 h-2 w-16 rounded bg-[#C4AA6E]/30"></div>
                      <div className="h-1.5 w-12 rounded bg-[#2A2A2D]"></div>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-full rounded bg-[#2A2A2D]"></div>
                    <div className="h-1.5 w-3/4 rounded bg-[#2A2A2D]"></div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="h-1.5 w-8 rounded bg-[#C4AA6E]/20"></div>
                    <div className="text-[9px] text-[#7A766C]">VERIFIED</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-lg border border-[#2A2A2D] bg-[#151517] transition-all hover:border-[#C4AA6E]/50 hover:shadow-lg hover:shadow-[#C4AA6E]/10">
              <div className="absolute inset-0 bg-gradient-to-br from-[#C4AA6E]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C4AA6E]/10">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M10 0L12.5 7.5H20L14 12L16.5 20L10 15L3.5 20L6 12L0 7.5H7.5L10 0Z"
                        fill="#C4AA6E"
                      />
                    </svg>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-[#7A766C] transition-colors group-hover:text-[#C4AA6E]"
                  >
                    <path
                      d="M5.25 2.91669L9.33333 7.00002L5.25 11.0834"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#F4F1EA]">CAC Registered</p>
                  <p className="text-[11px] text-[#7A766C]">RC {siteConfig.registrationNumber}</p>
                </div>
                <div className="mt-3 rounded border border-[#2A2A2D] bg-[#0E0E10] p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-6 items-center justify-center rounded bg-[#C4AA6E]/20">
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 0L12.5 7.5H20L14 12L16.5 20L10 15L3.5 20L6 12L0 7.5H7.5L10 0Z" fill="#C4AA6E"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 h-2 w-16 rounded bg-[#C4AA6E]/30"></div>
                      <div className="h-1.5 w-12 rounded bg-[#2A2A2D]"></div>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-full rounded bg-[#2A2A2D]"></div>
                    <div className="h-1.5 w-3/4 rounded bg-[#2A2A2D]"></div>
                    <div className="h-1.5 w-1/2 rounded bg-[#2A2A2D]"></div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="h-1.5 w-8 rounded bg-[#C4AA6E]/20"></div>
                    <div className="text-[9px] text-[#7A766C]">REGISTERED</div>
                  </div>
                </div>
              </div>
            </div>

            <a
              href="/cac-registration.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-lg border border-[#2A2A2D] bg-[#151517] transition-all hover:border-[#C4AA6E]/50 hover:shadow-lg hover:shadow-[#C4AA6E]/10"
              aria-label="View CAC registration certificate document"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#C4AA6E]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C4AA6E]/10">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M4 4C4 3.46957 4.21071 2.96086 4.58579 2.58579C4.96086 2.21071 5.46957 2 6 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V16C16 16.5304 15.7893 17.0391 15.4142 17.4142C15.0391 17.7893 14.5304 18 14 18H6C5.46957 18 4.96086 17.7893 4.58579 17.4142C4.21071 17.0391 4 16.5304 4 16V4Z"
                        stroke="#C4AA6E"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 2V4H12V2"
                        stroke="#C4AA6E"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 10H8.01"
                        stroke="#C4AA6E"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 10H12.01"
                        stroke="#C4AA6E"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 14H8.01"
                        stroke="#C4AA6E"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 14H8"
                        stroke="#C4AA6E"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-[#7A766C] transition-colors group-hover:text-[#C4AA6E]"
                  >
                    <path
                      d="M5.33333 10.6667V11.3333C5.33333 11.8637 5.54405 12.3724 5.91912 12.7475C6.29419 13.1226 6.8029 13.3333 7.33333 13.3333H14C14.5304 13.3333 15.0391 13.1226 15.4142 12.7475C15.7893 12.3724 16 11.8637 16 11.3333V10.6667M12 5.33333L9.33333 2.66667M9.33333 2.66667L6.66667 5.33333M9.33333 2.66667V10.6667"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#F4F1EA]">CAC Registration Document</p>
                  <p className="text-[11px] text-[#7A766C]">Official certificate of incorporation</p>
                </div>
                <div className="mt-3 rounded border border-[#2A2A2D] bg-[#0E0E10] p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-6 items-center justify-center rounded bg-[#C4AA6E]/20">
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 0L12.5 7.5H20L14 12L16.5 20L10 15L3.5 20L6 12L0 7.5H7.5L10 0Z" fill="#C4AA6E"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 h-2 w-16 rounded bg-[#C4AA6E]/30"></div>
                      <div className="h-1.5 w-12 rounded bg-[#2A2A2D]"></div>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 w-full rounded bg-[#2A2A2D]"></div>
                    <div className="h-1.5 w-3/4 rounded bg-[#2A2A2D]"></div>
                    <div className="h-1.5 w-1/2 rounded bg-[#2A2A2D]"></div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="h-1.5 w-8 rounded bg-[#C4AA6E]/20"></div>
                    <div className="text-[9px] text-[#7A766C]">PDF</div>
                  </div>
                </div>
              </div>
            </a>
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
