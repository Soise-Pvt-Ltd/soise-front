'use client';

import { Field } from './Field';
import { captureCartEmailAction } from './actions';

interface CheckoutStepPaymentProps {
  isLoggedIn: boolean;
  pending: boolean;
  error: string | null;
  cartEmpty: boolean;
  /** Rendered on the button so the shopper sees the exact charge before paying. */
  payLabel: string;
  onSubmit: (formData: FormData) => void;
}

/**
 * Step 1 of the two-step checkout: an email, then straight to payment.
 *
 * ONE field stands between the shopper and the pay button — that is the entire
 * point. The recipient's name moved to Step 2 (CheckoutStepAddress) with the
 * rest of the delivery details: the parcel needs a name, the payment doesn't,
 * and the backend never required one here (first/last are Optional in the
 * checkout schema — only the guest email hard-fails). Signed-in shoppers see
 * no fields at all: their email and profile name are already known.
 */
export default function CheckoutStepPayment({
  isLoggedIn,
  pending,
  error,
  cartEmpty,
  payLabel,
  onSubmit,
}: CheckoutStepPaymentProps) {
  return (
    <form action={onSubmit} className="mb-[36px]">
      <div>
        {/* Step marker: a stamped index, not a status card. */}
        <div className="flex items-baseline gap-x-3">
          <span className="text-[12px] font-bold tracking-[0.08em] text-[#B3101C]">
            1/2
          </span>
          <h1
            className="text-[26px] leading-none tracking-tight uppercase"
            style={{ fontFamily: 'var(--font-display, Georgia, serif)' }}
          >
            Pay
          </h1>
          <span className="mt-auto mb-[5px] flex-1 border-t-2 border-[#121212] opacity-20" />
        </div>

        {error && (
          <div className="mt-4 rounded-[2px] border-2 border-[#B3101C] bg-[#B3101C]/5 p-4 text-[13px] text-[#B3101C]">
            {error}
          </div>
        )}

        <div className="mt-[20px] mb-[20px]">
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
                className="brut-input"
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
          <p className="mt-[12px] text-[12px] leading-relaxed text-[#8E8E93] normal-case">
            We’ll ask for your name and delivery address right after — nothing
            else before you pay.
          </p>
        </div>

        <button
          type="submit"
          className="brut-btn brut-press"
          disabled={pending || cartEmpty}
        >
          {pending ? 'Processing…' : payLabel}
        </button>

        {/* Reassurance at the exact moment of doubt: the button. */}
        <p className="mt-4 text-center text-[11px] tracking-[0.12em] text-[#8E8E93] uppercase">
          Secure payment via Bachs
        </p>
      </div>
    </form>
  );
}
