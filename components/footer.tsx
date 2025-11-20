import { ChevronRightIcon, InstagramIcon, TiktokIcon, XIcon } from "./icons";

export default function Footer() {
  return (
    <>
      <div className="container px-[24px] md:px-[48px] pt-[67px] pb-[40px] space-y-[24px]">
        <div>
          <div className="uppercase text-[24px] text-[#121212] pb-[16px]">
            JoIN THE soise <p className="md:hidden"></p>
            COMMUNITY
          </div>

          <div className="uppercase text-[14px] text-[#2F2F2F] leading-[22px]">
            Join our mailing list and enjoy up to 10% off your first order. Stay
            up to date with SOISE's new arrivals, and promotions.
          </div>
        </div>

        <div className="relative flex items-center">
          <input
            type="text"
            className="form-input w-full pr-[42px]"
            placeholder="EMAIL"
          />
          <button className="absolute right-[6px] top-1/2 -translate-y-1/2 size-[30px] flex items-center justify-center bg-[#121212] rounded-[5px]">
            <ChevronRightIcon className="size-[14px]" />
          </button>
        </div>
        <div className="flex gap-x-[10px]">
          <input type="checkbox" className="form-checkbox size-[17px]" />
          <div className="text-[13px] text-[#2F2F2F]">
            I have read the Privacy Policy and consent to the processing of my
            personal data for marketing purposes (Newsletters,
            News and Promotions)
          </div>
        </div>

        <div>
          <div className="pb-[24px] text-[13px] text-[#2F2F2F]">
            Follow us on:
          </div>
          <div className="flex space-x-4">
            <div>
              <InstagramIcon />
            </div>
            <div>
              <TiktokIcon />
            </div>
            <div>
              <XIcon />
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-[#AEAEB2]">
        <div className="container px-[24px] md:px-[48px] text-[13px] text-[#2F2F2F] pt-[24px] pb-[40px]">
          Copyright © 2025 SOISE™
          <br />
          Office: Better Days, Heaven.
          <br />
          Company Registration Number: 1234567890
        </div>
      </div>
    </>
  );
}
