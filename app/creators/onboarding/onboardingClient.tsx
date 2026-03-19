'use client';
import { useState } from 'react';
import { CircleCheckIcon, MenuIcon, UserIcon } from '@/components/icons';
import Image from 'next/image';
import ReferralCode from '../ReferralCode';
import Menu from '../dashboard/Menu'; // Import the Menu component
import { savePaymentInformation } from './actions';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { showToast } from '@/lib/toast-utils';

export default function OnBoardingCreatorClient({
  banks,
  codes,
}: {
  banks?: any;
  codes?: any;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State to control menu visibility
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    bankCode: '',
    accountName: '',
    accountNumber: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep = async () => {
    if (step === 2) {
      if (
        !formData.bankCode ||
        !formData.accountName ||
        !formData.accountNumber
      ) {
        showToast.error('Please fill in all fields');
        return;
      }

      setIsLoading(true);
      const payload = new FormData();
      payload.append('bankCode', formData.bankCode);
      const selectedBank = banks?.find(
        (b: any) => b.code === formData.bankCode,
      );
      payload.append('bankName', selectedBank?.name || '');
      payload.append('accountName', formData.accountName);
      payload.append('accountNumber', formData.accountNumber);

      const res = await savePaymentInformation(payload);
      setIsLoading(false);

      if (res.success) {
        setStep((prev) => prev + 1);
      } else {
        showToast.error(res.error || 'Failed to save payment information. Please try again.');
      }
    } else {
      setStep((prev) => prev + 1);
    }
  };

  return (
    <>
      <Toaster position="top-center" richColors />
      <div className="profile mx-auto mb-[119px] px-[16px] md:max-w-7xl">
        <div className="xs:gap-y-0 flex flex-wrap items-center justify-between gap-y-4 pt-[51px] pb-[28px]">
          <div></div>

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
                  Application Accepted
                </p>
                <p className="text-[14px] text-[#8E8E93]">
                  Your creator application has been accepted.
                </p>
              </div>
            </div>
            <button
              onClick={handleNextStep}
              className="btn_black mt-[40px] sm:!w-fit sm:!px-[40px]"
            >
              Get onboard
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="">
            <h1 className="text-[16px] uppercase">Payment Information</h1>
            <div className="mt-[24px] flex flex-col gap-y-6">
              <div>
                <label htmlFor="bank">Bank</label>
                <select
                  id="bank"
                  name="bankCode"
                  value={formData.bankCode}
                  onChange={handleChange}
                  className="solid"
                >
                  <option value="">Select your bank</option>
                  {banks?.map((bank: any) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="acount_name">Account Name</label>
                <input
                  id="account_name"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleChange}
                  type="text"
                  className="solid"
                  placeholder="John Sosie"
                />
              </div>
              <div>
                <label htmlFor="account_number">Account Number</label>
                <input
                  id="account_number"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  type="text"
                  inputMode="numeric"
                  className="solid"
                  placeholder="0123456789"
                  maxLength={10}
                  onInput={(e: any) => {
                    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  }}
                />
              </div>
            </div>
            <button
              onClick={handleNextStep}
              className="btn_black mt-[40px]"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Next'}
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
            <ReferralCode
              code={Array.isArray(codes) ? codes[0]?.code : codes?.code}
            />
            <div className="text-center">
              <button
                onClick={() => router.push('/creators/dashboard')}
                className="btn_creators_solid mt-[40px]"
              >
                Go to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
      <Menu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
