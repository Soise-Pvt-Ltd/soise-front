'use client';

import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ChevronRightIcon, InstagramIcon, TiktokIcon, XIcon } from './icons';
import { siteConfig } from '@/lib/site-config';
import { showToast } from '@/lib/toast-utils';
import { subscribeNewsletter } from './newsletter-actions';

export default function FooterClient() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const bottomRef = useRef<HTMLDivElement>(null);
  const bottomInView = useInView(bottomRef, { once: true, amount: 0.3 });

  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!email.trim()) {
      showToast.error('Please enter your email address.');
      return;
    }
    setSubmitting(true);
    const toastId = showToast.loading('Adding you to the list…');
    try {
      const res = await subscribeNewsletter(email, consent);
      showToast.dismiss(toastId);
      if (res.success) {
        showToast.success(res.message);
        setEmail('');
        setConsent(false);
      } else {
        showToast.error(res.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        ref={ref}
        className="space-y-[24px] px-[24px] pt-[67px] pb-[40px] md:px-[48px] md:pt-[134px]"
      >
        {/* Desktop: 2 columns | Mobile: stacked */}
        <div className="grid gap-[40px] md:grid-cols-2 lg:gap-x-[80px]">
          {/* --- LEFT COLUMN --- */}
          <div className="space-y-[24px]">
            <div>
              <motion.div
                className="font-display pb-[16px] text-[24px] text-[#121212] uppercase"
                initial={{ opacity: 0, y: 30 }}
                animate={
                  isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
                }
                transition={{
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                JoIN THE soise <p className="md:hidden"></p>
                COMMUNITY
              </motion.div>

              <motion.div
                className="text-[14px] leading-[22px] text-[#2F2F2F] uppercase"
                initial={{ opacity: 0, y: 20 }}
                animate={
                  isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                }
                transition={{
                  duration: 0.6,
                  delay: 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                Join our mailing list and enjoy up to 10% off your first order.
                Stay up to date with SOISE&apos;s new arrivals and promotions.
              </motion.div>
            </div>

            <motion.a
              href={siteConfig.social.swazChannel}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-x-[8px] rounded-[10px] bg-[#121212] px-[16px] py-[10px] text-[13px] text-white uppercase transition-opacity hover:opacity-90"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{
                duration: 0.6,
                delay: 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Join the Swaz Channel
            </motion.a>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="pb-[24px] text-[13px] text-[#2F2F2F] uppercase">
                Follow us on:
              </div>

              <div className="flex space-x-4">
                {[
                  {
                    Icon: InstagramIcon,
                    href: siteConfig.social.instagram,
                    label: 'SOISE on Instagram',
                  },
                  {
                    Icon: TiktokIcon,
                    href: siteConfig.social.tiktok,
                    label: 'SOISE on TikTok',
                  },
                  { Icon: XIcon, href: siteConfig.social.x, label: 'SOISE on X' },
                ].map(({ Icon, href, label }, i) => (
                  <motion.a
                    key={i}
                    href={href}
                    aria-label={label}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.2, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 17,
                    }}
                    className="cursor-pointer"
                  >
                    <Icon />
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <motion.div
            className="align-right space-y-[24px]"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{
              duration: 0.7,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <form onSubmit={handleSubscribe} className="space-y-[24px]" noValidate>
              <div className="relative flex items-center">
                <input
                  type="email"
                  aria-label="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  className="h-[40px] w-full rounded-[10px] border border-[#AEAEB2] pr-[42px] pl-[10px] transition-all duration-300 focus:border-[#121212] focus:shadow-[0_0_0_1px_#121212] disabled:opacity-60"
                  placeholder="EMAIL"
                />
                <motion.button
                  type="submit"
                  disabled={submitting}
                  aria-label="Subscribe to the mailing list"
                  className="absolute top-1/2 right-[6px] flex size-[30px] -translate-y-1/2 items-center justify-center rounded-md bg-[#121212] disabled:opacity-60"
                  whileHover={{
                    scale: 1.1,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  }}
                  whileTap={{ scale: 0.9 }}
                  transition={{
                    type: 'spring',
                    stiffness: 400,
                    damping: 17,
                  }}
                >
                  {submitting ? (
                    <span
                      className="size-[14px] animate-spin rounded-full border-2 border-white/40 border-t-white"
                      aria-hidden="true"
                    />
                  ) : (
                    <ChevronRightIcon className="size-[14px]" />
                  )}
                </motion.button>
              </div>

              <div className="flex gap-x-[10px]">
                <input
                  type="checkbox"
                  aria-label="I consent to the processing of my personal data for marketing purposes"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="form-checkbox size-[17px]"
                />
                <div className="text-[13px] leading-[18px] text-[#2F2F2F]">
                  I have read the Privacy Policy and consent to the processing of
                  my personal data for marketing purposes (Newsletters, News and
                  Promotions)
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      <motion.div
        ref={bottomRef}
        className="border-t border-[#AEAEB2]"
        initial={{ opacity: 0 }}
        animate={bottomInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="container px-[24px] pt-[24px] pb-[40px] text-[13px] text-[#2F2F2F] md:px-[48px]">
          <nav className="mb-[18px] flex flex-wrap gap-x-6 gap-y-2 text-[12px] tracking-wide uppercase">
            <Link href="/about" className="transition-colors hover:text-[#121212]">
              About
            </Link>
            <Link href="/creators" className="transition-colors hover:text-[#121212]">
              Creators
            </Link>
            <Link href="/swaz-loop" className="transition-colors hover:text-[#121212]">
              The Swaz Loop
            </Link>
            <Link href="/contact" className="transition-colors hover:text-[#121212]">
              Contact
            </Link>
          </nav>
          Copyright © {new Date().getFullYear()} {siteConfig.name}™
          <br />
          Office: {siteConfig.officeAddress}
          <br />
          Company Registration Number: RC {siteConfig.registrationNumber}
        </div>
      </motion.div>
    </>
  );
}
