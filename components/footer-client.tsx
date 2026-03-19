'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ChevronRightIcon, InstagramIcon, TiktokIcon, XIcon } from './icons';
import { siteConfig } from '@/lib/site-config';

export default function FooterClient() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const bottomRef = useRef<HTMLDivElement>(null);
  const bottomInView = useInView(bottomRef, { once: true, amount: 0.3 });

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
                  { Icon: InstagramIcon, href: siteConfig.social.instagram },
                  { Icon: TiktokIcon, href: siteConfig.social.tiktok },
                  { Icon: XIcon, href: siteConfig.social.x },
                ].map(({ Icon, href }, i) => (
                  <motion.a
                    key={i}
                    href={href}
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
            <div className="relative flex items-center">
              <input
                type="text"
                className="h-[40px] w-full rounded-[10px] border border-[#AEAEB2] pr-[42px] pl-[10px] transition-all duration-300 focus:border-[#121212] focus:shadow-[0_0_0_1px_#121212]"
                placeholder="EMAIL"
              />
              <motion.button
                className="absolute top-1/2 right-[6px] flex size-[30px] -translate-y-1/2 items-center justify-center rounded-md bg-[#121212]"
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
                <ChevronRightIcon className="size-[14px]" />
              </motion.button>
            </div>

            <div className="flex gap-x-[10px]">
              <input type="checkbox" className="form-checkbox size-[17px]" />
              <div className="text-[13px] leading-[18px] text-[#2F2F2F]">
                I have read the Privacy Policy and consent to the processing of
                my personal data for marketing purposes (Newsletters, News and
                Promotions)
              </div>
            </div>
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
          Copyright © {new Date().getFullYear()} {siteConfig.name}™
          <br />
          Office: {siteConfig.officeAddress}
          <br />
          Company Registration Number: {siteConfig.registrationNumber}
        </div>
      </motion.div>
    </>
  );
}
