'use client';

import { useState } from 'react';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  const handleContinue = () => {
    if (currentStep === 0 && !email) return;
    setCurrentStep((prev) => prev + 1);
  };

  return (
    <>
      <div className="mx-auto px-[16px] pt-[100px] md:max-w-xl">
        <h1 className="!font-display pb-[32px] text-center text-[50px] tracking-[0.2em] uppercase">
          Sosie
        </h1>
        <div className="auth">
          {currentStep === 0 && (
            <div>
              <div className="gap-y-[16px]">
                <div className="text-[18px]">Sign In or Register</div>
                <div className="text-[14px] text-[#8E8E93]">
                  Please choose a sign-in option
                </div>
              </div>
              <div>
                <div className="pt-[40px]">
                  <button className="btn_black flex items-center justify-center gap-x-[4px]">
                    <img
                      src="/google.png"
                      alt="google"
                      className="size-[16px]"
                    />
                    Continue with Google
                  </button>
                </div>
                <div className="py-[16px]">
                  <Divider />
                </div>
                <input
                  type="text"
                  className="solid"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  className="btn_outline !my-[36px]"
                  onClick={handleContinue}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <div className="gap-y-[16px] pb-[40px]">
                <div className="text-[18px]">Sign In or Register</div>
                <div className="text-[14px] text-[#8E8E93]">
                  Enter account password
                </div>
              </div>
              <input type="password" className="solid" placeholder="Password" />
              <button className="btn_black !my-[36px]" onClick={handleContinue}>
                Continue
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <div className="gap-y-[16px] pb-[40px]">
                <div className="text-[18px]">Enter code</div>
                <div className="text-[14px] text-[#8E8E93]">
                  Sent to {email}
                </div>
              </div>
              <input
                type="number"
                className="solid"
                placeholder="6-Digit Code"
              />
              <button className="btn_black !my-[36px]">Submit</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Divider() {
  return (
    <div className="flex w-full items-center">
      <div className="h-px flex-grow bg-[#AEAEB2]"></div>
      <span className="px-3 text-[13px] text-[#8E8E93]">or</span>
      <div className="h-px flex-grow bg-[#AEAEB2]"></div>
    </div>
  );
}
