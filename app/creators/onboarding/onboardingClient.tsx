'use client';
import { useState } from 'react';
import CreatorCode from '../CreatorCode';
import CreatorNav from '@/components/creators/CreatorNav';
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
    <div className="min-h-screen bg-[#F4F1EA] text-[#14110E]">
      <Toaster position="top-center" richColors />
      <CreatorNav />
      <div className="profile page-shell mt-[24px] mb-[119px] px-[16px]">
        {step === 1 && (
          <div className="mt-[96px] flex flex-col items-center justify-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#9C6F2E] text-[22px] text-[#9C6F2E]">
              ✓
            </span>
            <p className="suite-eyebrow mt-6">
              You’re in
            </p>
            <h1 className="suite-display mt-4 max-w-[420px] text-[28px] leading-[1.15] sm:text-[34px]">
              Welcome to the founding cohort.
            </h1>
            <p className="mt-3 max-w-[380px] text-[14px] leading-relaxed text-[#5C544A]">
              Your application was accepted. Two quick steps — payout details,
              then your code — and you’re live.
            </p>
            <button
              onClick={handleNextStep}
              className="suite-btn suite-btn-primary mt-9 !px-9 !py-3.5 !text-[14px]"
            >
              Get onboard
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="mx-auto max-w-[440px] pt-8">
            <p className="suite-eyebrow">
              Step 2 of 2
            </p>
            <h1 className="suite-display mt-2 text-[24px]">
              Where should we send your earnings?
            </h1>
            <div className="mt-8 flex flex-col gap-y-6">
              <div>
                <label htmlFor="bank" className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#5C544A]">
                  Bank
                </label>
                <select
                  id="bank"
                  name="bankCode"
                  value={formData.bankCode}
                  onChange={handleChange}
                  className="suite-input mt-2 !h-[46px] !px-4 !text-[14px]"
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
                <label htmlFor="account_name" className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#5C544A]">
                  Account Name
                </label>
                <input
                  id="account_name"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleChange}
                  type="text"
                  className="suite-input mt-2 !h-[46px] !px-4 !text-[14px]"
                  placeholder="John Sosie"
                />
              </div>
              <div>
                <label htmlFor="account_number" className="text-[12px] font-medium uppercase tracking-[0.14em] text-[#5C544A]">
                  Account Number
                </label>
                <input
                  id="account_number"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  type="text"
                  inputMode="numeric"
                  className="suite-input mt-2 !h-[46px] !px-4 !text-[14px]"
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
              className="suite-btn suite-btn-primary mt-9 w-full !px-8 !py-3.5 !text-[14px]"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Next'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="mx-auto max-w-[440px]">
            <div className="mt-[80px] mb-[32px] flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#9C6F2E] text-[22px] text-[#9C6F2E]">
                ✓
              </span>
              <p className="suite-eyebrow mt-6">
                Wallet created
              </p>
              <h1 className="suite-display mt-4 text-[26px]">
                Your code is live. Let’s make some noise.
              </h1>
              <p className="mt-3 max-w-[360px] text-[14px] leading-relaxed text-[#5C544A]">
                Share it, tag us, and every verified sale lands straight in
                your wallet.
              </p>
              <p className="mt-2 max-w-[360px] text-[13px] font-medium leading-relaxed text-[#9C6F2E]">
                Every 10 verified sales unlocks ₦100,000 — added to your next
                withdrawal — plus fresh Soise gear, on us.
              </p>
            </div>
            <div className="suite-panel p-5">
              <CreatorCode
                code={Array.isArray(codes) ? codes[0]?.code : codes?.code}
              />
            </div>
            <div className="text-center">
              <button
                onClick={() => router.push('/creators/dashboard')}
                className="suite-btn suite-btn-primary mt-9 !px-9 !py-3.5 !text-[14px]"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
