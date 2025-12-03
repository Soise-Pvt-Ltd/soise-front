'use client';
import { useState } from 'react';
import { CircleCheckIcon, MenuIcon, UserIcon } from '@/components/icons';
import Image from 'next/image';
import ReferralCode from '../ReferralCode';
import Menu from '../dashboard/Menu'; // Import the Menu component

export default function OnBoardingPage() {
  const [step, setStep] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State to control menu visibility

  const handleNextStep = () => setStep((prev) => prev + 1);

  return (
    <>
      <div className="profile mx-auto mb-[119px] px-[16px] md:max-w-7xl">
        <div className="xs:gap-y-0 flex flex-wrap items-center justify-between gap-y-4 pt-[51px] pb-[28px]">
          <UserIcon />

          <Image src="/logo.png" alt="Soise Logo" width={100} height={58} />
          <div
            onClick={() => setIsMenuOpen(true)}
            className="hover:cursor-pointer"
          >
            <MenuIcon />
          </div>
        </div>
        {step === 1 && (
          <div className="mt-[112px] flex flex-col items-center justify-center">
            <div className="flex w-[208px] flex-col items-center text-center">
              <CircleCheckIcon />
              <div className="mt-[20px] gap-y-[16px]">
                <p className="text-[16px] font-semibold">
                  Submission successful
                </p>
                <p className="text-[14px] text-[#8E8E93]">
                  You have successfully submitted your creator application.
                </p>
              </div>
            </div>
            <button
              onClick={handleNextStep}
              className="btn_black mt-[40px] sm:!w-fit sm:!px-[40px]"
            >
              Get onboarding
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="">
            <h1 className="text-[16px] uppercase">Payment Information</h1>
            <div className="mt-[24px] flex flex-col gap-y-6">
              <div>
                <label htmlFor="bank">Bank</label>
                <select id="bank" className="solid">
                  <option value="">Select your bank</option>
                  <option value="bank1">Bank 1</option>
                  <option value="bank2">Bank 2</option>
                  <option value="bank3">Bank 3</option>
                </select>
              </div>
              <div>
                <label htmlFor="acount_name">Account Name</label>
                <input
                  id="account_name"
                  type="text"
                  className="solid"
                  placeholder="John Sosie"
                />
              </div>
              <div>
                <label htmlFor="acount_number">Account Number</label>
                <input
                  id="account_number"
                  type="number"
                  className="solid"
                  placeholder="876345789098"
                />
              </div>
            </div>
            <button onClick={handleNextStep} className="btn_black mt-[40px]">
              Next
            </button>
          </div>
        )}

        {step === 3 && (
          <>
            <div className="mt-[112px] mb-[40px] flex flex-col items-center justify-center">
              <div className="flex w-[208px] flex-col items-center text-center">
                <CircleCheckIcon />
                <div className="mt-[20px] gap-y-[16px]">
                  <p className="text-[16px] font-semibold">Wallet Created</p>
                  <p className="text-[14px] text-[#8E8E93]">
                    You have successfully created your Soise wallet.
                  </p>
                </div>
              </div>
            </div>
            <ReferralCode code="SOI238" />
            <div className="text-center">
              <button className="btn_creators_solid mt-[40px]">Next</button>
            </div>
          </>
        )}
      </div>
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
