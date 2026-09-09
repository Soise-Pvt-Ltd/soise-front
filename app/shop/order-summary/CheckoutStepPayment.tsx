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
  /** Second door: the admin-set bank account. Hidden until the rail is switched on. */
  transferEnabled?: boolean;
  onTransfer?: (formData: FormData) => void;
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
  transferEnabled = false,
  onTransfer,
}: CheckoutStepPaymentProps) {
  // One <form>, two submit buttons. formAction on the second routes the same
  // fields (the email above all) to the transfer handler, so the shopper
  // never types anything twice and validation runs identically.
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
          Secure card payment via Bachs
        </p>

        {transferEnabled && onTransfer && (
          <>
            <div className="my-[18px] flex items-center gap-x-3 text-[10px] tracking-[0.16em] text-[#8E8E93] uppercase">
              <span className="flex-1 border-t-2 border-[#121212] opacity-15" />
              or
              <span className="flex-1 border-t-2 border-[#121212] opacity-15" />
            </div>
            {/* The door most Nigerian commerce actually walks through. Same
                order, same fields; the account details appear in place and
                land in their inbox. */}
            <button
              type="submit"
              formAction={onTransfer}
              className="brut-btn-paper brut-press w-full"
              disabled={pending || cartEmpty}
            >
              Pay by bank transfer
            </button>
            <p className="mt-3 text-center text-[11px] tracking-[0.12em] text-[#8E8E93] uppercase">
              Account details shown next · confirmed same day
            </p>
          </>
        )}
      </div>
    </form>
  );
}
