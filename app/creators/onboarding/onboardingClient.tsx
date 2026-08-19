'use client';
import { useState } from 'react';
import CreatorCode from '../CreatorCode';
import CreatorNav from '@/components/creators/CreatorNav';
import { savePaymentInformation } from './actions';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { showToast } from '@/lib/toast-utils';

/** Instrument Serif — the Pressed Ink display face. */
const serif = { fontFamily: 'var(--font-display, Georgia, serif)' } as const;

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
    <div className="min-h-screen bg-[#F5F0E8] text-[#121212]">
      <Toaster position="top-center" richColors />
      <CreatorNav />
      <div className="profile mx-auto mt-[24px] mb-[119px] w-full max-w-[880px] px-[16px]">
        {step === 1 && (
          <div className="mt-[72px] flex flex-col items-start">
            <span className="brut-rise brut-plate flex h-14 w-14 items-center justify-center text-[22px] text-[#B3101C]">
              ✓
            </span>
            <p
              className="brut-rise brut-label mt-8 text-[#B3101C]"
              style={{ animationDelay: '0.08s' }}
            >
              You’re in
            </p>
            <h1
              className="brut-rise mt-4 max-w-[12ch] text-[56px] leading-[0.95] tracking-tight uppercase sm:text-[80px]"
              style={{ ...serif, animationDelay: '0.16s' }}
            >
              Welcome to the founding cohort<span className="text-[#B3101C]">.</span>
            </h1>
            <p
              className="brut-rise mt-6 max-w-[46ch] text-[15px] leading-relaxed text-[#3F3830]"
              style={{ animationDelay: '0.24s' }}
            >
              Your application was accepted. Two quick steps — payout details,
              then your code — and you’re live.
            </p>
            <button
              onClick={handleNextStep}
              className="brut-btn brut-press brut-rise mt-10 sm:w-fit sm:px-[48px]"
              style={{ animationDelay: '0.32s' }}
            >
              Get onboard
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="mx-auto max-w-[520px] pt-8">
            <p className="brut-rise brut-label text-[#B3101C]">
              Step 2 of 2
            </p>
            <h1
              className="brut-rise mt-4 text-[44px] leading-[0.95] tracking-tight uppercase sm:text-[56px]"
              style={{ ...serif, animationDelay: '0.08s' }}
            >
              Where should we send your earnings<span className="text-[#B3101C]">?</span>
            </h1>
            <div
              className="brut-rise mt-10 flex flex-col gap-y-6"
              style={{ animationDelay: '0.16s' }}
            >
              <div>
                <label htmlFor="bank" className="brut-label mb-2 block">
                  Bank
                </label>
                <select
                  id="bank"
                  name="bankCode"
                  value={formData.bankCode}
                  onChange={handleChange}
                  className="brut-input"
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
                <label htmlFor="account_name" className="brut-label mb-2 block">
                  Account Name
                </label>
                <input
                  id="account_name"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleChange}
                  type="text"
                  className="brut-input"
                  placeholder="John Sosie"
                />
              </div>
              <div>
                <label htmlFor="account_number" className="brut-label mb-2 block">
                  Account Number
                </label>
                <input
                  id="account_number"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  type="text"
                  inputMode="numeric"
                  className="brut-input"
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
              className="brut-btn brut-press brut-rise mt-10"
              style={{ animationDelay: '0.24s' }}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Next'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="mx-auto max-w-[560px]">
            <div className="mt-[64px] mb-[32px] flex flex-col items-start">
              <span className="brut-rise brut-plate flex h-14 w-14 items-center justify-center text-[22px] text-[#B3101C]">
                ✓
              </span>
              <p
                className="brut-rise brut-label mt-8 text-[#B3101C]"
                style={{ animationDelay: '0.08s' }}
              >
                Wallet created
              </p>
              <h1
                className="brut-rise mt-4 text-[44px] leading-[0.95] tracking-tight uppercase sm:text-[56px]"
                style={{ ...serif, animationDelay: '0.16s' }}
              >
                Your code is live. Let’s make some noise<span className="text-[#B3101C]">.</span>
              </h1>
              <p
                className="brut-rise mt-6 max-w-[46ch] text-[15px] leading-relaxed text-[#3F3830]"
                style={{ animationDelay: '0.24s' }}
              >
                Share it, tag us, and every verified sale lands straight in
                your wallet.
              </p>
              <p
                className="brut-rise mt-3 max-w-[46ch] text-[13px] leading-relaxed font-bold text-[#B3101C]"
                style={{ animationDelay: '0.32s' }}
              >
                Every 10 verified sales unlocks ₦100,000 — added to your next
                withdrawal — plus fresh Soise gear, on us.
              </p>
            </div>
            <div className="brut-plate brut-shadow brut-rise p-5" style={{ animationDelay: '0.4s' }}>
              <CreatorCode
                code={Array.isArray(codes) ? codes[0]?.code : codes?.code}
              />
            </div>
            <div>
              <button
                onClick={() => router.push('/creators/dashboard')}
                className="brut-btn brut-press brut-rise mt-10"
                style={{ animationDelay: '0.48s' }}
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
