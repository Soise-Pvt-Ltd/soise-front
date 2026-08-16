'use client';

import { Field } from './Field';
import { captureCartEmailAction } from './actions';

interface CheckoutStepPaymentProps {
  isLoggedIn: boolean;
  prefillFirstName: string;
  prefillLastName: string;
  pending: boolean;
  error: string | null;
  cartEmpty: boolean;
  onSubmit: (formData: FormData) => void;
}

/**
 * Step 1 of the two-step checkout: email + name only, enough to create the
 * order and initiate payment. The shipping address is collected in Step 2
 * (CheckoutStepAddress) after payment is underway.
 */
export default function CheckoutStepPayment({
  isLoggedIn,
  prefillFirstName,
  prefillLastName,
  pending,
  error,
  cartEmpty,
  onSubmit,
}: CheckoutStepPaymentProps) {
  return (
    <form action={onSubmit} className="mb-[36px]">
      <div>
        <h1 className="text-[16px] font-bold uppercase">Your details</h1>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="mt-[24px] mb-[18px] space-y-[10px]">
          {!isLoggedIn && (
            <Field
              label="Email address"
              htmlFor="email"
              hint="For your receipt and delivery updates"
            >
              <input
                id="email"
                type="email"
                name="email"
                className="solid"
                autoComplete="email"
                required
                // Real-time capture for abandoned cart recovery
                onChange={(e) => {
                  const value = e.target.value.trim();
                  if (value.includes('@')) {
                    void captureCartEmailAction(value);
                  }
                }}
              />
            </Field>
          )}

          <div className="grid gap-[10px] sm:grid-cols-2">
            <Field label="First name" htmlFor="firstName">
              <input
                id="firstName"
                type="text"
                name="firstName"
                className="solid"
                autoComplete="given-name"
                defaultValue={prefillFirstName}
                required
              />
            </Field>
            <Field label="Last name" htmlFor="lastName">
              <input
                id="lastName"
                type="text"
                name="lastName"
                className="solid"
                autoComplete="family-name"
                defaultValue={prefillLastName}
                required
              />
            </Field>
          </div>

          <div className="mb-[16px] rounded-[10px] border border-[#EAEAEA] bg-[#F7F7F7] px-[14px] py-[12px]">
            <p className="text-[13px] font-medium text-[#121212]">
              Step 1 of 2
            </p>
            <p className="mt-[2px] text-[12px] text-[#8E8E93]">
              Enter your details to proceed to payment. Delivery address will be collected next.
            </p>
          </div>
        </div>

        <button
          type="submit"
          className="btn_black"
          disabled={pending || cartEmpty}
        >
          {pending ? 'Processing...' : 'Continue to payment'}
        </button>
      </div>
    </form>
  );
}
