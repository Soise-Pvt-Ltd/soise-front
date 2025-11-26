import { ChevronRightIcon, InstagramIcon, TiktokIcon, XIcon } from './icons';

export default function Footer() {
  return (
    <>
      <div className="container space-y-[24px] px-[24px] pt-[67px] pb-[40px] md:px-[48px] md:pt-[134px]">
        {/* Desktop: 2 columns | Mobile: stacked */}
        <div className="grid gap-[40px] md:grid-cols-2">
          {/* --- LEFT COLUMN --- */}
          <div className="space-y-[24px]">
            <div>
              <div className="pb-[16px] text-[24px] text-[#121212] uppercase">
                JoIN THE soise <p className="md:hidden"></p>
                COMMUNITY
              </div>

              <div className="text-[14px] leading-[22px] text-[#2F2F2F] uppercase">
                Join our mailing list and enjoy up to 10% off your first order.
                Stay up to date with SOISE's new arrivals and promotions.
              </div>
            </div>

            <div>
              <div className="pb-[24px] text-[13px] text-[#2F2F2F] uppercase">
                Follow us on:
              </div>

              <div className="flex space-x-4">
                <InstagramIcon />
                <TiktokIcon />
                <XIcon />
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN --- */}
          <div className="space-y-[24px]">
            <div className="relative flex items-center">
              <input
                type="text"
                className="h-[40px] w-full rounded-[10px] border border-[#AEAEB2] pr-[42px] pl-[10px]"
                placeholder="EMAIL"
              />
              <button className="absolute top-1/2 right-[6px] flex size-[30px] -translate-y-1/2 items-center justify-center rounded-md bg-[#121212]">
                <ChevronRightIcon className="size-[14px]" />
              </button>
            </div>

            <div className="flex gap-x-[10px]">
              <input type="checkbox" className="form-checkbox size-[17px]" />
              <div className="text-[13px] leading-[18px] text-[#2F2F2F]">
                I have read the Privacy Policy and consent to the processing of
                my personal data for marketing purposes (Newsletters, News and
                Promotions)
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[#AEAEB2]">
        <div className="container px-[24px] pt-[24px] pb-[40px] text-[13px] text-[#2F2F2F] md:px-[48px]">
          Copyright © 2025 SOISE™
          <br />
          Office: Better Days, Heaven.
          <br />
          Company Registration Number: 1234567890
        </div>
      </div>
    </>
  );
}
