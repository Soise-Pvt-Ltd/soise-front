'use client';
import { useState } from 'react';
import CreatorCode from '../CreatorCode';
import CreatorNav from '@/components/creators/CreatorNav';
import { savePaymentInformation } from './actions';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { showToast } from '@/lib/toast-utils';

/** Playfair Display — the Ivory House display face. */
const luxe = { fontFamily: 'var(--font-luxe, Georgia, serif)' } as const;

/** Shared field styling — the house form block. */
const FIELD =
  'w-full appearance-none rounded-[10px] border border-[#2A2A2D] bg-[#121214] px-4 py-3 text-[14px] text-[#F4F1EA] outline-none transition-colors placeholder-[#5C584F] focus:border-[#C4AA6E] focus:ring-0';
const FIELD_LABEL =
  'text-[12px] font-medium uppercase tracking-[0.14em] text-[#9F9A8E]';

/** The house pills. */
const PILL_LIGHT =
  'flex w-full cursor-pointer items-center justify-center rounded-full bg-[#F4F1EA] px-8 py-3.5 text-[14px] font-semibold tracking-wide text-[#0E0E10] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 sm:w-fit sm:px-[48px]';
const PILL_GOLD =
  'flex w-full cursor-pointer items-center justify-center rounded-full bg-[#C4AA6E] px-8 py-3.5 text-[14px] font-semibold tracking-wide text-[#0E0E10] transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 sm:w-fit sm:px-[48px]';

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
    <div className="relative min-h-screen overflow-hidden bg-[#0E0E10] text-[#F4F1EA]">
      <Toaster position="top-center" richColors />
      <CreatorNav />
      {/* The hero glow — once per page, sitting behind the whole flow. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-60"
        style={{
          background:
            'radial-gradient(120% 80% at 50% -10%, rgba(196,170,110,0.18), transparent 60%)',
        }}
      />
      <div className="profile relative z-10 mx-auto mt-[24px] mb-[119px] w-full max-w-[880px] px-[16px]">
        {step === 1 && (
          <div className="mt-[72px] flex flex-col items-start">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#C4AA6E] text-[22px] text-[#C4AA6E]">
              ✓
            </span>
            <p className="mt-8 text-[12px] font-medium tracking-[0.32em] text-[#C4AA6E] uppercase">
              You’re in
            </p>
            <h1
              className="mt-6 max-w-[16ch] text-[44px] leading-[1.08] font-medium tracking-tight sm:text-[64px]"
              style={luxe}
            >
              Welcome to the founding cohort.
            </h1>
            <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-[#B7B2A6] sm:text-[17px]">
              Your application was accepted. Two quick steps — payout details,
              then your code — and you’re live.
            </p>
            <button onClick={handleNextStep} className={`${PILL_LIGHT} mt-10`}>
              Get onboard
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="mx-auto max-w-[520px] pt-8">
            <p className="text-[12px] font-medium tracking-[0.32em] text-[#C4AA6E] uppercase">
              Step 2 of 2
            </p>
            <h1
              className="mt-6 text-[36px] leading-[1.08] font-medium tracking-tight sm:text-[48px]"
              style={luxe}
            >
              Where should we send your earnings?
            </h1>
            <div className="mt-10 flex flex-col gap-y-6">
              <div>
                <label htmlFor="bank" className={`mb-2 block ${FIELD_LABEL}`}>
                  Bank
                </label>
                <select
                  id="bank"
                  name="bankCode"
                  value={formData.bankCode}
                  onChange={handleChange}
                  className={FIELD}
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
                <label
                  htmlFor="account_name"
                  className={`mb-2 block ${FIELD_LABEL}`}
                >
                  Account Name
                </label>
                <input
                  id="account_name"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleChange}
                  type="text"
                  className={FIELD}
                  placeholder="John Sosie"
                />
              </div>
              <div>
                <label
                  htmlFor="account_number"
                  className={`mb-2 block ${FIELD_LABEL}`}
                >
                  Account Number
                </label>
                <input
                  id="account_number"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  type="text"
                  inputMode="numeric"
                  className={FIELD}
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
              className={`${PILL_GOLD} mt-10`}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Next'}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="mx-auto max-w-[560px]">
            <div className="mt-[64px] mb-[32px] flex flex-col items-start">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#C4AA6E] text-[22px] text-[#C4AA6E]">
                ✓
              </span>
              <p className="mt-8 text-[12px] font-medium tracking-[0.32em] text-[#C4AA6E] uppercase">
                Wallet created
              </p>
              <h1
                className="mt-6 text-[36px] leading-[1.08] font-medium tracking-tight sm:text-[48px]"
                style={luxe}
              >
                Your code is live. Let’s make some noise.
              </h1>
              <p className="mt-6 max-w-[46ch] text-[15px] leading-relaxed text-[#B7B2A6] sm:text-[17px]">
                Share it, tag us, and every verified sale lands straight in
                your wallet.
              </p>
              <p className="mt-4 max-w-[46ch] text-[14px] leading-relaxed text-[#C4AA6E]">
                Every 10 verified sales unlocks ₦100,000 — added to your next
                withdrawal — plus fresh Soise gear, on us.
              </p>
            </div>
            {/* Ground-level panel with a hairline, so the code plate inside is
                the thing that lifts. */}
            <div className="rounded-[16px] border border-[#1F1F22] p-[22px]">
              <CreatorCode
                code={Array.isArray(codes) ? codes[0]?.code : codes?.code}
              />
            </div>
            <div>
              <button
                onClick={() => router.push('/creators/dashboard')}
                className={`${PILL_LIGHT} mt-10`}
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
