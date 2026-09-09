'use client';

import { useState } from 'react';
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
  // One button. The rail is a two-way choice above it, not a second button
  // below it: two full-height buttons with a caption each read as a menu
  // on a ₦150k screen. The form action follows the choice, so the same
  // email field feeds both paths.
  const [method, setMethod] = useState<'card' | 'transfer'>('card');
  const useTransfer = transferEnabled && !!onTransfer && method === 'transfer';
  return (
    <form action={useTransfer ? onTransfer : onSubmit} className="mb-[36px]">
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
        </div>

        {transferEnabled && onTransfer && (
          <div
            role="radiogroup"
            aria-label="How would you like to pay?"
            className="mb-[14px] flex overflow-hidden rounded-[2px] border-2 border-[#121212]"
          >
            {(
              [
                ['card', 'Card'],
                ['transfer', 'Bank transfer'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={method === value}
                onClick={() => setMethod(value)}
                className={`flex-1 py-[12px] text-[11px] font-bold tracking-[0.12em] uppercase transition-colors ${
                  method === value
                    ? 'bg-[#121212] text-white'
                    : 'bg-white text-[#121212] hover:bg-[#121212]/5'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <button
          type="submit"
          className="brut-btn brut-press"
          disabled={pending || cartEmpty}
        >
          {pending ? 'Processing…' : useTransfer ? 'Get transfer details' : payLabel}
        </button>

        {/* One line of reassurance, chosen by the rail. */}
        <p className="mt-4 text-center text-[11px] tracking-[0.12em] text-[#8E8E93] uppercase">
          {useTransfer
            ? 'Account details next · confirmed the same day'
            : 'Secure card payment · address asked after'}
        </p>
      </div>
    </form>
  );
}
